param (
    [string]$DbUser = "farakhorasan",
    [string]$DbName = "farakhorasan_db",
    [string]$TestDbName = "farakhorasan_verify_restore"
)

$ErrorActionPreference = "Stop"

# Get project name to properly scope commands
$project = if ($env:COMPOSE_PROJECT_NAME) { "-p $($env:COMPOSE_PROJECT_NAME)" } else { "" }
$ContainerName = (Invoke-Expression "docker compose $project ps -q db")

if ([string]::IsNullOrWhiteSpace($ContainerName)) {
    throw "Could not find 'db' service. Is docker compose running?"
}

Write-Host "Running deterministic Backup and Restore check..." -ForegroundColor Cyan

# 1. Run the backup script
.\scripts\Backup-Database.ps1

# Find the latest backup
$backupFile = Get-ChildItem -Path "backups" -Filter "*.dump" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $backupFile) { throw "No backup file found after running Backup-Database.ps1" }

# 2. Get original record count
$origCount = docker exec -t $ContainerName psql -U $DbUser -d $DbName -t -c "SELECT count(*) FROM users;"
$origCountNum = [int]($origCount.Trim())
Write-Host "Original DB user count: $origCountNum"

# 3. Create a test DB and restore into it
Write-Host "Restoring into test database: $TestDbName" -ForegroundColor Cyan
docker cp $backupFile.FullName "${ContainerName}:/tmp/db_test_restore.dump"
docker exec -t $ContainerName psql -U $DbUser -d postgres -c "DROP DATABASE IF EXISTS $TestDbName;"
docker exec -t $ContainerName psql -U $DbUser -d postgres -c "CREATE DATABASE $TestDbName;"
docker exec -t $ContainerName pg_restore -U $DbUser -d $TestDbName -1 "/tmp/db_test_restore.dump"

if ($LASTEXITCODE -ne 0) { throw "pg_restore failed" }

# 4. Get restored record count
$restoredCount = docker exec -t $ContainerName psql -U $DbUser -d $TestDbName -t -c "SELECT count(*) FROM users;"
$restoredCountNum = [int]($restoredCount.Trim())
Write-Host "Restored DB user count: $restoredCountNum"

# 5. Verify equality
if ($origCountNum -eq $restoredCountNum) {
    Write-Host "PASS: Record counts match." -ForegroundColor Green
} else {
    throw "FAIL: Record counts do not match. Orig: $origCountNum, Restored: $restoredCountNum"
}

# Cleanup
docker exec -t $ContainerName psql -U $DbUser -d postgres -c "DROP DATABASE IF EXISTS $TestDbName;"
Write-Host "Deterministic restore verification complete." -ForegroundColor Green
