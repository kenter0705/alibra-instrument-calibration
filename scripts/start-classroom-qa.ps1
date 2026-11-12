$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$stage=Join-Path $root 'dist\classroom-v0.2.1-source'
$qa=Join-Path $root 'dist\classroom-qa'
$id=(Get-Content -LiteralPath (Join-Path $stage '.calibra-build\BUILD_ID') -Raw).Trim()
Copy-Item -LiteralPath (Join-Path $root 'installer\Start-CALIBRA-Classroom.ps1') -Destination (Join-Path $qa 'Start-CALIBRA.ps1') -Force
$env:DATABASE_URL='file:'+((Join-Path $qa 'test.db').Replace('\','/'))
$env:AUTH_SECRET=[Guid]::NewGuid().ToString('N')+[Guid]::NewGuid().ToString('N')
$env:CALIBRA_DATA_DIR=Join-Path $qa 'files'
$env:CALIBRA_BUILD_DIR='.calibra-build'
$env:CALIBRA_BUILD_ID=$id
$env:CALIBRA_LAN_ENABLED='false'
$env:CALIBRA_PREVIEW_MODE='false'
$env:NODE_ENV='production'
$node='C:\Users\k_ent\AppData\Local\Programs\CALIBRA\node.exe'
$next=Join-Path $root 'node_modules\next\dist\bin\next'
$server=Start-Process -FilePath $node -ArgumentList ('"'+$next+'" start --hostname 127.0.0.1 --port 4104') -WorkingDirectory $stage -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $qa 'server.log') -RedirectStandardError (Join-Path $qa 'server-error.log')
@{pid=$server.Id;port=4104;buildId=$id}|ConvertTo-Json|Set-Content -LiteralPath (Join-Path $qa 'server-instance.json') -Encoding ASCII
for($i=0;$i -lt 120;$i++){
 try{$health=Invoke-RestMethod -Uri 'http://127.0.0.1:4104/api/health' -TimeoutSec 2;if($health.buildId -eq $id){Write-Output ('QA server ready PID '+$server.Id);exit 0}}catch{}
 $server.Refresh();if($server.HasExited){Get-Content (Join-Path $qa 'server-error.log') -Tail 15;throw 'QA server exited'}
 if($i%20 -eq 0){Write-Output 'Waiting for isolated QA server'}
 Start-Sleep -Milliseconds 500
}
throw 'QA server readiness timed out'
