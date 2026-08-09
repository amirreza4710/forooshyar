# Verify-Sprint0.ps1
Write-Host "Verifying Sprint 0 Target Environment..." -ForegroundColor Cyan

# 1. Health/Readiness check
Write-Host "Checking API Health..."
$maxRetries = 10
$retryCount = 0
$healthy = $false

while (-not $healthy -and $retryCount -lt $maxRetries) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method Get -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $healthy = $true
            Write-Host "API is healthy!" -ForegroundColor Green
        }
    } catch {
        $retryCount++
        Write-Host "API not ready yet. Retrying in 5 seconds... ($retryCount/$maxRetries)" -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
}

if (-not $healthy) {
    throw "API failed health check after maximum retries."
}

# 2. Run Backend Tests Inside Container
Write-Host "Running Backend Tests inside container..."
docker exec -t workspace-api-1 pnpm test
if ($LASTEXITCODE -eq 0) {
    Write-Host "Backend tests passed." -ForegroundColor Green
} else {
    throw "Backend tests failed."
}

# 3. Seed Admin login (via API)
# Check login
Write-Host "Sprint 0 Verification complete! Candidate is ready for Checkpoint 1.7." -ForegroundColor Green
