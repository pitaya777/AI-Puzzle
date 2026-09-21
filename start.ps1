param([switch]$Lan,[switch]$NoBrowser)
$ErrorActionPreference='Stop'
$projectRoot=$PSScriptRoot
Set-Location -LiteralPath $projectRoot
$pythonPath=Join-Path $projectRoot '.venv\Scripts\python.exe'
if(-not(Test-Path -LiteralPath $pythonPath)){
  python -m venv .venv
  if($LASTEXITCODE-ne 0){throw '创建Python环境失败'}
  & $pythonPath -m pip install -r requirements.txt
  if($LASTEXITCODE-ne 0){throw '安装依赖失败'}
}
if(-not(Test-Path -LiteralPath '.env')){Copy-Item -LiteralPath '.env.example' -Destination '.env'}
$hostAddress=if($Lan){'0.0.0.0'}else{'127.0.0.1'}
$running=$false
try{$health=Invoke-RestMethod -Uri 'http://127.0.0.1:8001/api/health' -TimeoutSec 2;$running=$health.app-eq'ai-puzzle'}catch{}
if(-not $running){
  $process=Start-Process -FilePath $pythonPath -ArgumentList @('-m','uvicorn','backend.app:app','--host',$hostAddress,'--port','8001') -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $projectRoot 'data\server.log') -RedirectStandardError (Join-Path $projectRoot 'data\server-error.log')
  $process.Id|Set-Content -LiteralPath 'data\server.pid'
  $ready=$false
  for($i=0;$i-lt 30;$i++){Start-Sleep -Milliseconds 500;try{$health=Invoke-RestMethod -Uri 'http://127.0.0.1:8001/api/health' -TimeoutSec 1;if($health.app-eq'ai-puzzle'){$ready=$true;break}}catch{};if($process.HasExited){break}}
  if(-not $ready){throw '启动失败，请查看data\server-error.log'}
}
Write-Host 'AI puzzle is running: http://127.0.0.1:8001'
Write-Host 'Admin password: data\admin-password.txt'
if(-not $NoBrowser){Start-Process 'http://127.0.0.1:8001'}
