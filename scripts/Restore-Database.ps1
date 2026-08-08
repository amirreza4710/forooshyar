# Restore-Database.ps1
param (
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    [string]$ContainerName = "workspace-db-1",
    [string]$DbUser = "farakhorasan",
    [string]$DbName = "farakhorasan_db"
)

if (!(Test-Path -Path $BackupFile)) {
    throw "Backup file not found: $BackupFile"
}

Write-Host "Restoring database from $BackupFile..." -ForegroundColor Cyan
docker cp $BackupFile "${ContainerName}:/tmp/db_restore.dump"
docker exec -t $ContainerName pg_restore -U $DbUser -d $DbName -c -1 "/tmp/db_restore.dump"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Restore successful!" -ForegroundColor Green
} else {
    Write-Host "Restore failed." -ForegroundColor Red
}
