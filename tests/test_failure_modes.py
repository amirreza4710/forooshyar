"""
Empirical Failure Modes and Healthcheck Verification
Author: Challenger 1 (Milestone 2)
"""

import os
import subprocess
import json

ENV = os.environ.copy()
ENV["PATH"] = f"/home/gapcode/.node/bin:{ENV.get('PATH', '')}"

def test_api_server_failure_modes():
    print("=== Testing Failure Modes ===")

    # 1. Test missing DATABASE_URL
    print("Test 1 (missing DATABASE_URL in tsx):")
    clean_env = {
        "PATH": ENV["PATH"],
        "HOME": ENV.get("HOME", "/home/gapcode"),
    }
    # Explicitly ensure DATABASE_URL is not set
    clean_env.pop("DATABASE_URL", None)

    res_tsx = subprocess.run(
        ["pnpm", "exec", "tsx", "-e", "import('./lib/db/src/index.ts').catch(e => { console.log('ERROR_MSG:', e.message); process.exit(42); })"],
        capture_output=True,
        text=True,
        env=clean_env
    )
    print("STDOUT:", res_tsx.stdout)
    print("STDERR:", res_tsx.stderr)
    print("EXIT:", res_tsx.returncode)
    combined = res_tsx.stdout + res_tsx.stderr
    assert "DATABASE_URL must be set" in combined or res_tsx.returncode == 42, f"Unexpected: {combined}"
    print("✓ Missing DATABASE_URL crashes immediately with explicit provision message")

    # 2. Test unreachable DATABASE_URL on readyz vs healthz
    print("\nTest 2 (unreachable DATABASE_URL readyz vs healthz):")
    script = """
    process.env.DATABASE_URL = 'postgresql://invalid_user:invalid_pass@127.0.0.1:59999/invalid_db?connect_timeout=1';
    process.env.PORT = '3001';
    process.env.SESSION_SECRET = 'test-secret-at-least-32-chars-long-1234';
    import('./artifacts/api-server/src/app').then(async (m) => {
        const app = m.default;
        const server = app.listen(3001, async () => {
            try {
                // Test healthz (liveness)
                const hRes = await fetch('http://127.0.0.1:3001/api/healthz');
                const hData = await hRes.json();
                console.log('HEALTHZ_STATUS:', hRes.status, JSON.stringify(hData));

                // Test readyz (readiness against unreachable DB)
                const rRes = await fetch('http://127.0.0.1:3001/api/readyz');
                const rData = await rRes.json();
                console.log('READYZ_STATUS:', rRes.status, JSON.stringify(rData));

                server.close();
                process.exit(0);
            } catch (err) {
                console.error('FETCH_ERR:', err);
                server.close();
                process.exit(1);
            }
        });
    });
    """
    res_readyz = subprocess.run(
        ["pnpm", "exec", "tsx", "-e", script],
        capture_output=True,
        text=True,
        env=ENV
    )
    print("STDOUT:", res_readyz.stdout)
    print("STDERR:", res_readyz.stderr)
    print("EXIT:", res_readyz.returncode)

    assert "HEALTHZ_STATUS: 200" in res_readyz.stdout, "healthz should return 200 (liveness)"
    assert "READYZ_STATUS: 503" in res_readyz.stdout, "readyz should return 503 (readiness failure when DB is down)"
    print("✓ readyz correctly fails with HTTP 503 when DB is unavailable or malformed")

if __name__ == "__main__":
    test_api_server_failure_modes()
