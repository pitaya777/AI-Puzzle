$ErrorActionPreference='Stop'
$pidFile=Join-Path $PSScriptRoot 'data\server.pid'
if(Test-Path -LiteralPath $pidFile){$serverId=[int](Get-Content -LiteralPath $pidFile);$p=Get-CimInstance Win32_Process -Filter "ProcessId=$serverId";if($p-and$p.CommandLine-match'backend.app:app'){Stop-Process -Id $serverId -ErrorAction SilentlyContinue};Remove-Item -LiteralPath $pidFile}
Write-Host 'AI puzzle stopped. Saved data is preserved.'
