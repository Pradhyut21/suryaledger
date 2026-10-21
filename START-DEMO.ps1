$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Install Node.js 22.12 or newer, then run this script again.'
}
if (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'dist\index.html')) {
    Write-Host 'Starting the delivered build at http://127.0.0.1:8787. Press Ctrl+C to stop.'
    node server/index.mjs
    exit $LASTEXITCODE
}
if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'node_modules'))) {
    npm.cmd ci
    if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
}
npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }
Write-Host 'Open http://127.0.0.1:8787 in your browser. Press Ctrl+C to stop.'
npm.cmd start
