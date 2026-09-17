# Verify-Sprint0.ps1
Write-Host "Verifying Sprint 0 Target Environment (Windows + Docker Desktop)..." -ForegroundColor Cyan

function Assert-Command {
    param([scriptblock]$Command, [string]$Gate, [string]$Desc)
    Write-Host "`n[$Gate] $Desc" -ForegroundColor Cyan
    try {
        & $Command
        if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
            throw "Command failed with exit code $LASTEXITCODE"
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
    docker compose up -d
}

# 3. GATE-1.7-03 Backend tests inside container
Assert-Command -Gate "GATE-1.7-03" -Desc "Backend tests inside container (tester stage)" -Command {
    # Test execution is already baked into the 'tester' stage of artifacts/api-server/Dockerfile
    # So we just run a build targeting that stage.
    docker build --target tester -t api-server-tester -f artifacts/api-server/Dockerfile .
}

Write-Host "Sprint 0 Verification (Gates 1-3) complete!" -ForegroundColor Green

# 4. GATE-1.7-04 Host health/readiness
Assert-Command -Gate "GATE-1.7-04" -Desc "Host health/readiness" -Command {
    $maxRetries = 10
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
            Start-Sleep -Seconds 5
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

# 7. GATE-1.7-07 Seed Admin login
Assert-Command -Gate "GATE-1.7-07" -Desc "Seed Admin login" -Command {
    $body = @{
        username = "امیررضا"
        password = "1234"
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
        password = "4321"
    } | ConvertTo-Json

    $headers = @{
        Authorization = "Bearer $($script:AdminToken)"
    }

    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/users/$($script:AdminUserId)" -Method Patch -Body $patchBody -Headers $headers -ContentType "application/json" -ErrorAction Stop
    if ($response.StatusCode -ne 200) { throw "Password change failed" }

    # Verify new password
    $loginBodyNew = @{
        username = "امیررضا"
        password = "4321"
    } | ConvertTo-Json

    $loginResNew = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $loginBodyNew -ContentType "application/json" -ErrorAction Stop
    if ($loginResNew.StatusCode -ne 200) { throw "Login with new password failed" }

    # Revert password
    $patchBodyRevert = @{
        password = "1234"
    } | ConvertTo-Json

    $headersNew = @{
        Authorization = "Bearer $(($loginResNew.Content | ConvertFrom-Json).token)"
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
