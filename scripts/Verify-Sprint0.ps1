# Verify-Sprint0.ps1
$ErrorActionPreference = "Stop"
Write-Host "Verifying Sprint 0 Target Environment (Windows + Docker Desktop)..." -ForegroundColor Cyan

# Single source of truth for secrets: .env — the same file docker compose reads.
# Existing environment variables win, so a CI/shell override still takes precedence.
if (Test-Path ".env") {
    foreach ($line in Get-Content ".env") {
        if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
            $name = $Matches[1]
            $value = $Matches[2].Trim()
            if (-not [Environment]::GetEnvironmentVariable($name)) { Set-Item "env:$name" $value }
        }
    }
}

function Assert-Command {
    param([scriptblock]$Command, [string]$Gate, [string]$Desc)
    Write-Host "`n[$Gate] $Desc" -ForegroundColor Cyan
    try {
        & $Command
        if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
            throw "Command exited with non-zero code $LASTEXITCODE"
        }
        Write-Host "PASS" -ForegroundColor Green
    } catch {
        Write-Host "FAIL: $_" -ForegroundColor Red
        throw "$Gate FAILED"
    }
}

# 1. GATE-1.7-01 Frontend production build
Assert-Command -Gate "GATE-1.7-01" -Desc "Frontend production build" -Command {
    pnpm --filter @workspace/nadraan run build
}

# 2. GATE-1.7-02 Docker Compose build/up
Assert-Command -Gate "GATE-1.7-02" -Desc "Docker Compose build/up" -Command {
    docker compose build
    if ($LASTEXITCODE -ne 0) { throw "docker compose build failed" }
    docker compose up -d
    if ($LASTEXITCODE -ne 0) { throw "docker compose up failed" }
}

# 3. GATE-1.7-03 Backend tests inside container
Assert-Command -Gate "GATE-1.7-03" -Desc "Backend tests inside container (tester stage)" -Command {
    # The suite is an integration suite against a real database, and it runs before
    # the restore gate below — so the schema has to exist first.
    $DbUser = $env:POSTGRES_USER ?? "farakhorasan"
    $DbPass = $env:POSTGRES_PASSWORD ?? "farakhorasan_password"
    $DbName = $env:POSTGRES_DB ?? "farakhorasan_db"
    $DbPort = $env:POSTGRES_PORT ?? "5432"
    $env:DATABASE_URL = "postgresql://${DbUser}:${DbPass}@localhost:${DbPort}/${DbName}"
    pnpm -C lib/db run push
    if ($LASTEXITCODE -ne 0) { throw "Drizzle schema push failed" }

    docker build --target tester -t api-server-tester -f artifacts/api-server/Dockerfile .
    if ($LASTEXITCODE -ne 0) { throw "docker build tester failed" }

    # Building the image proves nothing about the tests — actually run them.
    $Network = (docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}' (docker compose ps -q db))
    $ContainerDbUrl = "postgresql://${DbUser}:${DbPass}@db:5432/${DbName}"
    docker run --rm --network $Network -e "DATABASE_URL=$ContainerDbUrl" -e "SESSION_SECRET=$($env:SESSION_SECRET)" api-server-tester
    if ($LASTEXITCODE -ne 0) { throw "Backend tests inside container failed" }
}

Write-Host "Sprint 0 Verification (Gates 1-3) complete!" -ForegroundColor Green

# 4. GATE-1.7-04 Host health/readiness
Assert-Command -Gate "GATE-1.7-04" -Desc "Host health/readiness" -Command {
    $maxRetries = 15
    $retryCount = 0
    $healthy = $false

    while (-not $healthy -and $retryCount -lt $maxRetries) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/api/healthz" -Method Get -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                $healthy = $true
            }
        } catch {
            $retryCount++
            Start-Sleep -Seconds 3
        }
    }
    if (-not $healthy) { throw "API failed health check at /api/healthz" }
}

# 5. GATE-1.7-05 PostgreSQL backup
Assert-Command -Gate "GATE-1.7-05" -Desc "PostgreSQL backup" -Command {
    .\scripts\Backup-Database.ps1
}

# 6. GATE-1.7-06 PostgreSQL restore
Assert-Command -Gate "GATE-1.7-06" -Desc "PostgreSQL restore" -Command {
    $backupFile = Get-ChildItem -Path "backups" -Filter "*.dump" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $backupFile) { throw "No backup file found to restore" }
    .\scripts\Restore-Database.ps1 -BackupFile $backupFile.FullName
}

Write-Host "Sprint 0 Verification (Gates 4-6) complete!" -ForegroundColor Green

$InitialAdminPassword = $env:SEED_ADMIN_PASSWORD
$RotatedAdminPassword = $env:TEST_ROTATED_PASSWORD ?? "TempRotate456!"
if (-not $InitialAdminPassword) { throw "SEED_ADMIN_PASSWORD is not set — copy .env.example to .env and set it" }

# 6.5. GATE-1.7-06.5 Schema sync after restore
Assert-Command -Gate "GATE-1.7-06.5" -Desc "Drizzle schema sync after restore" -Command {
    $env:DATABASE_URL = "postgresql://$($env:POSTGRES_USER ?? 'farakhorasan'):$($env:POSTGRES_PASSWORD ?? 'farakhorasan_password')@localhost:$($env:POSTGRES_PORT ?? '5432')/$($env:POSTGRES_DB ?? 'farakhorasan_db')"
    pnpm -C lib/db run push
    if ($LASTEXITCODE -ne 0) { throw "Drizzle schema push failed" }
}

# 6.6. GATE-1.7-06.6 Dev seed admin after restore
Assert-Command -Gate "GATE-1.7-06.6" -Desc "Dev seed admin after restore" -Command {
    $headers = @{ "x-seed-token" = ($env:SEED_TOKEN ?? "sprint0-dev-seed-token") }
    $seed = Invoke-WebRequest -Uri "http://localhost:3000/api/dev/seed-admin" -Method Post -Headers $headers -ErrorAction Stop
    if ($seed.StatusCode -notin @(200, 201)) { throw "Admin seed failed with status $($seed.StatusCode)" }
}

# 7. GATE-1.7-07 Seed Admin login
Assert-Command -Gate "GATE-1.7-07" -Desc "Seed Admin login" -Command {
    $body = @{
        username = "امیررضا"
        password = $InitialAdminPassword
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
    if ($response.StatusCode -ne 200) { throw "Login failed" }

    $data = $response.Content | ConvertFrom-Json
    if (-not $data.token) { throw "No token returned" }

    $script:AdminToken = $data.token
    $script:AdminUserId = $data.user.id
}

# 8. GATE-1.7-08 Admin password rotation
Assert-Command -Gate "GATE-1.7-08" -Desc "Admin password rotation" -Command {
    if (-not $script:AdminToken) { throw "No admin token available for password rotation test" }

    # Change password
    $patchBody = @{
        password = $RotatedAdminPassword
    } | ConvertTo-Json

    $headers = @{
        Authorization = "Bearer $script:AdminToken"
    }

    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/users/$($script:AdminUserId)" -Method Patch -Body $patchBody -Headers $headers -ContentType "application/json" -ErrorAction Stop
    if ($response.StatusCode -ne 200) { throw "Password change failed" }

    # Verify new password
    $loginBodyNew = @{
        username = "امیررضا"
        password = $RotatedAdminPassword
    } | ConvertTo-Json

    $loginResNew = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $loginBodyNew -ContentType "application/json" -ErrorAction Stop
    if ($loginResNew.StatusCode -ne 200) { throw "Login with new password failed" }

    # The old password must now be rejected — rotation that leaves the old
    # credential working is not rotation.
    $loginBodyOld = @{
        username = "امیررضا"
        password = $InitialAdminPassword
    } | ConvertTo-Json

    $oldStatus = 0
    try {
        Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $loginBodyOld -ContentType "application/json" -ErrorAction Stop | Out-Null
        $oldStatus = 200
    } catch {
        $oldStatus = [int]$_.Exception.Response.StatusCode
    }
    if ($oldStatus -ne 401) { throw "Old password was not rejected after rotation (status $oldStatus)" }

    # Revert password
    $patchBodyRevert = @{
        password = $InitialAdminPassword
    } | ConvertTo-Json

    $headersNew = @{
        Authorization = "Bearer $script:AdminToken"
    }

    Invoke-WebRequest -Uri "http://localhost:3000/api/users/$($script:AdminUserId)" -Method Patch -Body $patchBodyRevert -Headers $headersNew -ContentType "application/json" -ErrorAction Stop | Out-Null
}

# Soft-delete columns check
Assert-Command -Gate "DB-CHECK" -Desc "Soft-delete columns in DB" -Command {
    $ContainerName = (docker compose ps -q db)
    if ([string]::IsNullOrWhiteSpace($ContainerName)) { throw "DB container not found" }

    $tables = @("users", "customers", "products", "orders")
    foreach ($table in $tables) {
        $query = "SELECT column_name FROM information_schema.columns WHERE table_name = '$table' AND column_name = 'deleted_at';"
        $res = docker exec -t $ContainerName psql -U farakhorasan -d farakhorasan_db -t -c $query
        if (-not ($res -match "deleted_at")) {
            throw "Table $table is missing deleted_at column"
        }
    }
}

Write-Host "Sprint 0 Verification complete! Candidate is ready for Checkpoint 1.7." -ForegroundColor Green
