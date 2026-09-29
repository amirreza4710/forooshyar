param (
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    [string]$DbUser = "farakhorasan",
    [string]$DbName = "farakhorasan_db"
)

if (!(Test-Path -Path $BackupFile)) {
    throw "Backup file not found: $BackupFile"
}

$ContainerName = (docker compose ps -q db)
if ([string]::IsNullOrWhiteSpace($ContainerName)) {
    throw "Could not find 'db' service in docker compose. Is it running?"
}

Write-Host "Restoring database from $BackupFile using container $ContainerName..." -ForegroundColor Cyan
docker cp $BackupFile "${ContainerName}:/tmp/db_restore.dump"
# We drop and create DB for a clean restore using pg_restore.
docker exec -t $ContainerName psql -U $DbUser -d postgres -c "DROP DATABASE IF EXISTS $DbName;"
docker exec -t $ContainerName psql -U $DbUser -d postgres -c "CREATE DATABASE $DbName;"
docker exec -t $ContainerName pg_restore -U $DbUser -d $DbName -1 "/tmp/db_restore.dump"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Restore successful!" -ForegroundColor Green
} else {
    Write-Host "Restore failed." -ForegroundColor Red
    throw "Restore failed"
}
