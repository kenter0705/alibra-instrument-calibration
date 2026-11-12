# CALIBRA CLASSROOM - one verified release, one port, no automatic version fallback.
$env:PSModulePath = "$PSHOME\Modules;" + $env:PSModulePath
$ErrorActionPreference = 'Stop'
try {
  Add-Type -AssemblyName System.Windows.Forms
  $installRoot = Join-Path $env:LOCALAPPDATA 'Programs\CALIBRA-Classroom'
  $appRoot = Join-Path $installRoot 'app'
  $dataRoot = Join-Path $env:LOCALAPPDATA 'CALIBRA-Classroom'
  $node = Join-Path $installRoot 'node.exe'
  $nextCli = Join-Path $appRoot 'node_modules\next\dist\bin\next'
  $release = Get-Content -LiteralPath (Join-Path $dataRoot 'active-release.json') -Raw | ConvertFrom-Json
  if ($release.edition -ne 'classroom') { throw 'The classroom app requires a classroom release manifest.' }
  $buildPath = [IO.Path]::GetFullPath((Join-Path $appRoot $release.buildDir))
  if (-not $buildPath.StartsWith([IO.Path]::GetFullPath($appRoot)+'\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Invalid active build path.' }
  $buildId = (Get-Content -LiteralPath (Join-Path $buildPath 'BUILD_ID') -Raw).Trim()
  $package = Get-Content -LiteralPath (Join-Path $appRoot 'package.json') -Raw | ConvertFrom-Json
  if ($buildId -ne $release.buildId -or $package.version -ne $release.version -or $package.calibraEdition -ne 'classroom') { throw 'Installed files do not match the verified classroom release.' }
  $secretFile = Join-Path $dataRoot 'auth-secret.txt'
  $owner = [Security.Principal.WindowsIdentity]::GetCurrent().User
  $acl = [IO.File]::GetAccessControl($secretFile, [Security.AccessControl.AccessControlSections]::Access)
  $acl.SetAccessRuleProtection($true,$false)
  $acl.Access | ForEach-Object { [void]$acl.RemoveAccessRule($_) }
  $acl.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule($owner,'FullControl','Allow')))
  [IO.File]::SetAccessControl($secretFile,$acl)
  $env:AUTH_SECRET = [IO.File]::ReadAllText($secretFile).Trim()
  $env:DATABASE_URL = 'file:./dev.db'
  $env:CALIBRA_DATA_DIR = Join-Path $dataRoot 'files'
  $env:CALIBRA_BUILD_DIR = [string]$release.buildDir
  $env:CALIBRA_BUILD_ID = $buildId
  $env:CALIBRA_PREVIEW_MODE = 'false'
  $env:NODE_ENV = 'production'
  $oauthFile = Join-Path $dataRoot 'google-oauth.json'
  if (Test-Path -LiteralPath $oauthFile) {
    $oauth = Get-Content -LiteralPath $oauthFile -Raw | ConvertFrom-Json
    if ($oauth.clientId -and $oauth.clientSecret) { $env:GOOGLE_CLIENT_ID=[string]$oauth.clientId; $env:GOOGLE_CLIENT_SECRET=[string]$oauth.clientSecret; if($oauth.redirectUri){$env:GOOGLE_REDIRECT_URI=[string]$oauth.redirectUri} }
  }
  $env:CALIBRA_LAN_ENABLED='false'
  $networkFile=Join-Path $dataRoot 'network-settings.json'
  if(Test-Path -LiteralPath $networkFile){$network=Get-Content -LiteralPath $networkFile -Raw|ConvertFrom-Json;if($network.enabled -eq $true){$env:CALIBRA_LAN_ENABLED='true'}}
  $bindHost=if($env:CALIBRA_LAN_ENABLED -eq 'true'){'0.0.0.0'}else{'127.0.0.1'}
  $port = 4000
  function Test-ClassroomServer {
    try {
      $r=[Net.HttpWebRequest]::Create('http://localhost:4000/api/health');$r.Proxy=$null;$r.Timeout=2000
      $response=$r.GetResponse()
      try{$reader=[IO.StreamReader]::new($response.GetResponseStream());$health=$reader.ReadToEnd()|ConvertFrom-Json}
      finally{$response.Dispose()}
      return $health.edition -eq 'classroom' -and $health.version -eq $release.version -and $health.buildId -eq $buildId
    }catch{return $false}
  }
  $instanceFile=Join-Path $dataRoot 'server-instance.json'
  $reuse=$false
  if(Test-Path -LiteralPath $instanceFile){
    $state=Get-Content -LiteralPath $instanceFile -Raw|ConvertFrom-Json
    $process=Get-CimInstance Win32_Process -Filter ('ProcessId='+$state.pid) -ErrorAction SilentlyContinue
    $owned=$process -and $process.ExecutablePath -eq $node -and $process.CommandLine.Contains($nextCli)
    if($owned){
      if($state.buildId -eq $buildId -and $state.buildDir -eq $release.buildDir -and $state.lanEnabled -eq $env:CALIBRA_LAN_ENABLED -and (Test-ClassroomServer)){$reuse=$true}
      else{Stop-Process -Id $process.ProcessId -Force;Start-Sleep -Milliseconds 500}
    }
  }
  if(-not $reuse){
    $client=[Net.Sockets.TcpClient]::new()
    try{$task=$client.BeginConnect('127.0.0.1',$port,$null,$null);$occupied=$task.AsyncWaitHandle.WaitOne(300);if($occupied){try{$client.EndConnect($task)}catch{$occupied=$false}}}finally{$client.Dispose()}
    if($occupied){throw 'Port 4000 is occupied by another process. No alternative version was opened.'}
    $logs=Join-Path $dataRoot 'logs';New-Item -ItemType Directory -Force -Path $logs|Out-Null
    $server=Start-Process -FilePath $node -ArgumentList ('"'+$nextCli+'" start --hostname '+$bindHost+' --port 4000') -WorkingDirectory $appRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logs 'classroom-server.log') -RedirectStandardError (Join-Path $logs 'classroom-server-error.log')
    $ready=$false
    for($i=0;$i -lt 120;$i++){Start-Sleep -Milliseconds 500;$server.Refresh();if($server.HasExited){break};if(Test-ClassroomServer){$ready=$true;break}}
    if(-not $ready){throw 'The verified classroom server did not start. Check CALIBRA\logs\classroom-server-error.log.'}
    @{pid=$server.Id;port=$port;buildId=$buildId;buildDir=$release.buildDir;edition='classroom';version=$release.version;lanEnabled=$env:CALIBRA_LAN_ENABLED}|ConvertTo-Json|Set-Content -LiteralPath $instanceFile -Encoding UTF8
  }
  $initializer=Join-Path $appRoot 'scripts\initialize-local-data.cjs'
  $initial=(& $node $initializer)|ConvertFrom-Json
  if($LASTEXITCODE -ne 0){throw 'Classroom database initialization failed.'}
  $url='http://localhost:4000/?edition=classroom&version='+$release.version+'&release='+$release.releaseDate
  if($initial.needsSetup){
    $tokenFile=Join-Path $env:CALIBRA_DATA_DIR 'setup\first-admin-token.txt'
    $acl=[IO.File]::GetAccessControl($tokenFile,[Security.AccessControl.AccessControlSections]::Access)
    $acl.SetAccessRuleProtection($true,$false);$acl.Access|ForEach-Object{[void]$acl.RemoveAccessRule($_)}
    $acl.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule($owner,'FullControl','Allow')))
    [IO.File]::SetAccessControl($tokenFile,$acl)
    $url='http://localhost:4000/setup?token='+[Uri]::EscapeDataString([IO.File]::ReadAllText($tokenFile).Trim())
  }
  $edge=@((Join-Path ${env:ProgramFiles(x86)} 'Microsoft\Edge\Application\msedge.exe'),(Join-Path $env:ProgramFiles 'Microsoft\Edge\Application\msedge.exe'))|Where-Object{Test-Path -LiteralPath $_}|Select-Object -First 1
  if($edge){Start-Process -FilePath $edge -ArgumentList ('--app='+$url)}else{Start-Process -FilePath $url}
} catch {
  $log=Join-Path $env:LOCALAPPDATA 'CALIBRA-Classroom\startup-error.log'
  try{Add-Content -LiteralPath $log -Value ((Get-Date -Format s)+' '+$_.Exception.Message) -Encoding UTF8}catch{}
  try{Add-Type -AssemblyName System.Windows.Forms;[Windows.Forms.MessageBox]::Show("CALIBRA Classroom startup failed. $($_.Exception.Message)`nLog: $log",'CALIBRA 멀티','OK','Error')|Out-Null}catch{}
  exit 1
}