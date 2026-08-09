# Backup-Database.ps1
param (
    [string]$ContainerName = "workspace-db-1",
    [string]$DbUser = "farakhorasan",
    [string]$DbName = "farakhorasan_db",
    [string]$BackupDir = "backups"
)

if (!(Test-Path -Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

$DateStr = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupFile = "$BackupDir\farakhorasan_$DateStr.dump"

Write-Host "Backing up database to $BackupFile..." -ForegroundColor Cyan
docker exec -t $ContainerName pg_dump -U $DbUser -d $DbName -F c -f "/tmp/db.dump"
docker cp "${ContainerName}:/tmp/db.dump" $BackupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup successful!" -ForegroundColor Green
} else {
    Write-Host "Backup failed." -ForegroundColor Red
}
