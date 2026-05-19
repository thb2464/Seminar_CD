# boot.ps1 — start the full Travel TVB stack from a cold machine.
# Usage:  powershell -ExecutionPolicy Bypass -File .\infra\boot.ps1
#         (or just .\infra\boot.ps1 once executionpolicy permits)

$ErrorActionPreference = 'Stop'
$env:Path += ";C:\Program Files\Docker\Docker\resources\bin"

$root = Split-Path -Parent $PSScriptRoot
$infraCompose    = Join-Path $PSScriptRoot 'docker-compose.yml'
$servicesCompose = Join-Path $PSScriptRoot 'docker-compose.services.yml'
$frontend        = Join-Path $root 'Travel_TVB'

Write-Host '==> Bringing up infra (postgres, rabbit, chroma, redis, kong, pact)...' -ForegroundColor Cyan
docker compose -f $infraCompose up -d | Out-Null

Write-Host '==> Waiting for postgres + rabbitmq to be healthy...' -ForegroundColor Cyan
do {
    Start-Sleep 3
    $p = docker inspect -f '{{.State.Health.Status}}' travel-tvb-postgres 2>$null
    $r = docker inspect -f '{{.State.Health.Status}}' travel-tvb-rabbitmq 2>$null
} while ($p -ne 'healthy' -or $r -ne 'healthy')

Write-Host '==> Bringing up microservices...' -ForegroundColor Cyan
docker compose -f $servicesCompose up -d | Out-Null

Write-Host '==> Waiting for kong + content-service to be healthy...' -ForegroundColor Cyan
do {
    Start-Sleep 3
    $k  = docker inspect -f '{{.State.Health.Status}}' travel-tvb-kong            2>$null
    $cs = docker inspect -f '{{.State.Health.Status}}' travel-tvb-content-service 2>$null
} while ($k -ne 'healthy' -or $cs -ne 'healthy')

Write-Host '==> Starting Vite dev server in a new window...' -ForegroundColor Cyan
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd '$frontend'; npm run dev"

Write-Host ''
Write-Host 'All up. Endpoints:' -ForegroundColor Green
Write-Host '  Frontend       http://localhost:5173'
Write-Host '  Admin console  http://localhost:5173/admin   (admin@traveltvb.com / AdminTVB!2026)'
Write-Host '  API gateway    http://localhost:8000'
Write-Host '  Strapi admin   http://localhost:1337/admin'
Write-Host '  RabbitMQ UI    http://localhost:15672          (guest / guest)'
Write-Host '  Pact Broker    http://localhost:9292            (pact_ci / pact_ci)'
