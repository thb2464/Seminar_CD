# shutdown.ps1 — gracefully stop the full Travel TVB stack.
# Volumes are preserved (postgres-data, rabbitmq-data, chroma-data, redis-data).
# Pass -Wipe to also drop volumes (destroys all bookings, users, embeddings).

param([switch]$Wipe)

$ErrorActionPreference = 'Continue'
$env:Path += ";C:\Program Files\Docker\Docker\resources\bin"

$infraCompose    = Join-Path $PSScriptRoot 'docker-compose.yml'
$servicesCompose = Join-Path $PSScriptRoot 'docker-compose.services.yml'

Write-Host '==> Stopping Vite dev server (port 5173)...' -ForegroundColor Cyan
Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

$downArgs = @()
if ($Wipe) { $downArgs += '-v' }

Write-Host '==> Stopping microservices...' -ForegroundColor Cyan
docker compose -f $servicesCompose down @downArgs | Out-Null

Write-Host '==> Stopping infra...' -ForegroundColor Cyan
docker compose -f $infraCompose down @downArgs | Out-Null

if ($Wipe) {
    Write-Host 'Stack stopped. Volumes wiped.' -ForegroundColor Yellow
} else {
    Write-Host 'Stack stopped. Volumes preserved.' -ForegroundColor Green
}
