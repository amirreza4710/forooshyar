# Initialize-Farakhorasan.ps1
Write-Host "Initializing Farakhorasan Sales OS..." -ForegroundColor Cyan

# 1. Frontend production build
Write-Host "Building Frontend..."
pnpm --filter @workspace/nadraan run build
if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }

# 2. Docker Compose runtime verification
Write-Host "Starting Docker containers..."
docker-compose build
docker-compose up -d
if ($LASTEXITCODE -ne 0) { throw "Docker Compose up failed" }

Write-Host "Initialization complete. Await DB healthcheck..." -ForegroundColor Green
