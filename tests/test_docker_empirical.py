"""
Empirical Docker & Compose Stress Test Suite for Milestone 2
Author: Challenger 1 (Milestone 2)
"""

import os
import re
import sys
import json
import yaml
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent

def test_compose_yaml_validity():
    """Verify docker-compose.yml parses as valid YAML."""
    compose_path = ROOT_DIR / "docker-compose.yml"
    assert compose_path.exists(), f"Missing {compose_path}"
    with open(compose_path, "r", encoding="utf-8") as f:
        content = f.read()
    data = yaml.safe_load(content)
    assert "services" in data, "No 'services' in docker-compose.yml"
    assert "volumes" in data, "No 'volumes' in docker-compose.yml"
    services = data["services"]
    assert set(services.keys()) == {"db", "db-migrate", "api", "web"}, f"Unexpected services: {set(services.keys())}"
    print("✓ Compose YAML structure valid and all 4 services present")
    return data

def parse_env_file(filepath):
    """Parse a .env file strictly."""
    env = {}
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()
    return env

def interpolate_compose_var(expr, env_vars):
    """
    Simulate Docker Compose v2 variable interpolation:
    - ${VAR:-default}
    - ${VAR:?error}
    - ${VAR}
    - $${ESCAPED}
    """
    # Replace escaped $$ with a sentinel
    sentinel = "___ESCAPED_DOLLAR___"
    text = expr.replace("$$", sentinel)

    pattern = re.compile(r"\$\{([^}]+)\}")

    def replacer(match):
        inner = match.group(1)
        if ":-" in inner:
            var_name, default_val = inner.split(":-", 1)
            val = env_vars.get(var_name)
            return val if (val is not None and val != "") else default_val
        elif ":?" in inner:
            var_name, err_msg = inner.split(":?", 1)
            val = env_vars.get(var_name)
            if val is None or val == "":
                raise ValueError(f"Interpolation error for {var_name}: {err_msg}")
            return val
        else:
            return env_vars.get(inner, "")

    interpolated = pattern.sub(replacer, text)
    # Restore $$
    final_text = interpolated.replace(sentinel, "$")
    return final_text

def test_compose_interpolation_with_active_env():
    """Verify all variables resolve cleanly with root .env."""
    compose_path = ROOT_DIR / "docker-compose.yml"
    env_path = ROOT_DIR / ".env"
    assert env_path.exists(), "Root .env does not exist"

    env_vars = parse_env_file(env_path)

    with open(compose_path, "r", encoding="utf-8") as f:
        compose_content = f.read()

    # Find all ${...} expressions
    matches = re.findall(r"\$\{[^}]+\}", compose_content)
    print(f"Found {len(matches)} variable interpolation expressions in docker-compose.yml:")
    for m in matches:
        resolved = interpolate_compose_var(m, env_vars)
        print(f"  {m} => {resolved}")
        assert resolved != "", f"Interpolation produced empty string for {m}"

    # Also test whole-file interpolation
    full_interpolated = interpolate_compose_var(compose_content, env_vars)
    # Ensure it's valid YAML
    parsed_full = yaml.safe_load(full_interpolated)
    assert parsed_full["services"]["api"]["environment"], "api service environment missing"
    print("✓ Compose variable interpolation with .env passed completely")

def test_compose_interpolation_without_env_adversarial():
    """Stress test compose interpolation when required env vars are missing."""
    compose_path = ROOT_DIR / "docker-compose.yml"
    with open(compose_path, "r", encoding="utf-8") as f:
        compose_content = f.read()

    # Empty env: should fail on SESSION_SECRET
    try:
        interpolate_compose_var(compose_content, {})
        assert False, "Expected interpolation error on missing SESSION_SECRET"
    except ValueError as e:
        print(f"✓ Expected failure caught when SESSION_SECRET missing: {e}")

    # Set SESSION_SECRET, missing SEED_ADMIN_PASSWORD
    try:
        interpolate_compose_var(compose_content, {"SESSION_SECRET": "some-secret"})
        assert False, "Expected interpolation error on missing SEED_ADMIN_PASSWORD"
    except ValueError as e:
        print(f"✓ Expected failure caught when SEED_ADMIN_PASSWORD missing: {e}")

    # Defaults testing: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
    test_env = {
        "SESSION_SECRET": "test-secret",
        "SEED_ADMIN_PASSWORD": "test-password"
    }
    interpolated = interpolate_compose_var(compose_content, test_env)
    assert "postgresql://farakhorasan:farakhorasan_password@db:5432/farakhorasan_db" in interpolated
    print("✓ Fallback defaults correctly evaluated for POSTGRES credentials")

def test_nadraan_dockerfile_layers():
    """Verify Nadraan Dockerfile stage commands and monorepo workspace resolution."""
    dockerfile_path = ROOT_DIR / "artifacts" / "nadraan" / "Dockerfile"
    assert dockerfile_path.exists(), "Missing Nadraan Dockerfile"

    with open(dockerfile_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    # Verify deps stage copies all necessary package.json files
    deps_copies = [line.strip() for line in lines if "COPY" in line and "package.json" in line]
    print(f"Nadraan Dockerfile package.json copies: {deps_copies}")

    assert any("artifacts/nadraan/package.json" in c for c in deps_copies), "Missing artifacts/nadraan/package.json copy"
    assert any("lib/api-client-react/package.json" in c for c in deps_copies), "Missing lib/api-client-react/package.json copy"
    assert any("lib/api-zod/package.json" in c for c in deps_copies), "Missing lib/api-zod/package.json copy"

    # Verify builder stage copies source and node_modules
    builder_copies = [line.strip() for line in lines if line.strip().startswith("COPY")]
    assert any("COPY lib/api-zod ./lib/api-zod" in c for c in builder_copies), "Missing COPY lib/api-zod"
    assert any("COPY lib/api-client-react ./lib/api-client-react" in c for c in builder_copies), "Missing COPY lib/api-client-react"
    assert any("COPY artifacts/nadraan ./artifacts/nadraan" in c for c in builder_copies), "Missing COPY artifacts/nadraan"

    # Verify dist output directory matches vite.config.ts
    vite_config_path = ROOT_DIR / "artifacts" / "nadraan" / "vite.config.ts"
    with open(vite_config_path, "r", encoding="utf-8") as f:
        vite_config = f.read()
    assert 'outDir: path.resolve(import.meta.dirname, "dist/public")' in vite_config
    assert any("COPY --from=builder /app/artifacts/nadraan/dist/public /usr/share/nginx/html" in c for c in builder_copies)
    print("✓ Nadraan Dockerfile stages, workspace copies, and dist/public target paths verified")

def test_api_dockerfile_layers():
    """Verify API Server Dockerfile stage commands and monorepo workspace resolution."""
    dockerfile_path = ROOT_DIR / "artifacts" / "api-server" / "Dockerfile"
    assert dockerfile_path.exists(), "Missing API Server Dockerfile"

    with open(dockerfile_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    copies = [line.strip() for line in lines if line.strip().startswith("COPY")]
    assert any("artifacts/api-server/package.json" in c for c in copies)
    assert any("lib/db/package.json" in c for c in copies)
    assert any("lib/api-zod/package.json" in c for c in copies)
    assert any("COPY lib/db ./lib/db" in c for c in copies)
    assert any("COPY lib/api-zod ./lib/api-zod" in c for c in copies)
    assert any("COPY artifacts/api-server ./artifacts/api-server" in c for c in copies)

    # Check runner stage working directory matches esbuild-plugin-pino requirement
    assert any("WORKDIR /app/artifacts/api-server" in line for line in lines)
    print("✓ API Server Dockerfile stages, paths, and workspace copies verified")

def test_service_healthcheck_definitions():
    """Verify healthcheck definitions and conditions across all services in docker-compose.yml."""
    compose_path = ROOT_DIR / "docker-compose.yml"
    with open(compose_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    services = data["services"]

    # db
    assert "healthcheck" in services["db"]
    assert "pg_isready" in str(services["db"]["healthcheck"]["test"])

    # db-migrate
    assert services["db-migrate"]["depends_on"]["db"]["condition"] == "service_healthy"
    assert services["db-migrate"]["restart"] == "no"
    assert "pnpm --filter @workspace/db push" in services["db-migrate"]["command"]

    # api
    assert "healthcheck" in services["api"]
    assert "api/healthz" in str(services["api"]["healthcheck"]["test"])
    assert services["api"]["depends_on"]["db"]["condition"] == "service_healthy"
    assert services["api"]["depends_on"]["db-migrate"]["condition"] == "service_completed_successfully"

    # web
    assert "healthcheck" in services["web"]
    assert "wget" in str(services["web"]["healthcheck"]["test"])
    assert services["web"]["depends_on"]["api"]["condition"] == "service_healthy"

    print("✓ Healthcheck definitions and dependency chain (db -> db-migrate -> api -> web) verified")

if __name__ == "__main__":
    test_compose_yaml_validity()
    test_compose_interpolation_with_active_env()
    test_compose_interpolation_without_env_adversarial()
    test_nadraan_dockerfile_layers()
    test_api_dockerfile_layers()
    test_service_healthcheck_definitions()
    print("\nALL DOCKER EMPIRICAL CHECKS PASSED SUCCESSFULLY!")
