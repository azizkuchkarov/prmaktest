# Windows: Prisma generate — avval loyihadagi Next/Node jarayonlarini to‘xtatadi (EPERM oldini olish)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "Prisma Client generatsiyasi (pmtest)..." -ForegroundColor Cyan

$stopped = @()
Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue | ForEach-Object {
  $cmd = if ($_.CommandLine) { $_.CommandLine } else { "" }
  if ($cmd -match [regex]::Escape($root) -or ($cmd -match "next" -and $cmd -match "dev")) {
    try {
      Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop
      $stopped += $_.ProcessId
    } catch {
      Write-Host "  PID $($_.ProcessId) to‘xtatilmadi (ehtimol allaqachon yopilgan)." -ForegroundColor Yellow
    }
  }
}

if ($stopped.Count -gt 0) {
  Write-Host "  To‘xtatildi: Node PID $($stopped -join ', ')" -ForegroundColor Yellow
  Start-Sleep -Seconds 2
} else {
  Write-Host "  Loyiha Node jarayoni topilmadi (yaxshi)." -ForegroundColor DarkGray
}

$clientDir = Join-Path $root "node_modules\.prisma\client"
$dll = Join-Path $clientDir "query_engine-windows.dll.node"
Remove-Item "$dll" -Force -ErrorAction SilentlyContinue
Get-ChildItem $clientDir -Filter "query_engine-windows.dll.node.tmp*" -ErrorAction SilentlyContinue |
  Remove-Item -Force -ErrorAction SilentlyContinue

npx prisma generate
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "XATO: prisma generate muvaffaqiyatsiz." -ForegroundColor Red
  Write-Host "1) Terminalda Ctrl+C bilan npm run dev ni to‘xtating" -ForegroundColor Red
  Write-Host "2) Qayta: npm run prisma:generate" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "Tayyor. Endi: npm run dev" -ForegroundColor Green
