$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms

$installRoot = Join-Path $env:LOCALAPPDATA 'Programs\CALIBRA'
$appRoot = Join-Path $installRoot 'app'
$node = Join-Path $installRoot 'node.exe'
$nextCli = Join-Path $appRoot 'node_modules\next\dist\bin\next'
$dataRoot = Join-Path $env:LOCALAPPDATA 'CALIBRA'
$secretFile = Join-Path $dataRoot 'auth-secret.txt'
$instanceFile = Join-Path $dataRoot 'server-instance.json'
$lanEnabled = $false
$networkSettings = Join-Path $dataRoot 'network-settings.json'
if (Test-Path -LiteralPath $networkSettings) {
  try { $lanEnabled = (Get-Content -LiteralPath $networkSettings -Raw | ConvertFrom-Json).enabled -eq $true } catch { }
}
$listenHost = if ($lanEnabled) { '0.0.0.0' } else { '127.0.0.1' }
$env:CALIBRA_LAN_ENABLED = if ($lanEnabled) { 'true' } else { 'false' }
$updater = Join-Path $installRoot 'Update-CALIBRA.ps1'
$ErrorActionPreference = 'Continue'
if (Test-Path -LiteralPath $updater) {
  # Best-effort code-only update. The updater package never contains the SQLite DB
  # or user files, and network failure leaves the installed version untouched.
  & $updater -AppRoot $appRoot -InstallRoot $installRoot -DataRoot $dataRoot
}
$ErrorActionPreference = 'Stop'
$buildIdFile = Join-Path $appRoot '.calibra-build\BUILD_ID'
$buildId = if (Test-Path -LiteralPath $buildIdFile) { (Get-Content -LiteralPath $buildIdFile -Raw).Trim() } else { 'unknown' }

if (-not (Test-Path $node) -or -not (Test-Path $nextCli)) {
  [Windows.Forms.MessageBox]::Show('CALIBRA 설치 파일이 올바르지 않습니다. SETUP.exe를 다시 실행해 주세요.', 'CALIBRA 실행 오류', 'OK', 'Error') | Out-Null
  exit 1
}
if (-not (Test-Path $secretFile)) {
  New-Item -ItemType Directory -Force -Path $dataRoot | Out-Null
  $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
  $bytes = New-Object byte[] 48
  try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
  [Convert]::ToBase64String($bytes) | Set-Content -NoNewline $secretFile
}
$secretAcl = Get-Acl -LiteralPath $secretFile
$secretAcl.SetAccessRuleProtection($true, $false)
$owner = [Security.Principal.WindowsIdentity]::GetCurrent().User
$secretAcl.SetOwner($owner)
$secretAcl.Access | ForEach-Object { [void]$secretAcl.RemoveAccessRule($_) }
$secretAcl.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule($owner, 'FullControl', 'Allow')))
Set-Acl -LiteralPath $secretFile -AclObject $secretAcl
$env:AUTH_SECRET = (Get-Content -Raw $secretFile).Trim()
$env:DATABASE_URL = 'file:./dev.db'
$env:CALIBRA_DATA_DIR = Join-Path $dataRoot 'files'
$env:NODE_ENV = 'production'
$env:CALIBRA_BUILD_ID = $buildId
$env:CALIBRA_GOOGLE_LOGIN_EMAIL = 'kenter6746060@gmail.com'

# OAuth client credentials are local machine configuration; never package them
# with the public installer. Existing Google consent is retained by the browser.
$googleConfig = Join-Path $dataRoot 'google-oauth.json'
if (Test-Path -LiteralPath $googleConfig) {
  try {
    $oauth = Get-Content -LiteralPath $googleConfig -Raw | ConvertFrom-Json
    if ($oauth.clientId -and $oauth.clientSecret) {
      $env:GOOGLE_CLIENT_ID = [string]$oauth.clientId
      $env:GOOGLE_CLIENT_SECRET = [string]$oauth.clientSecret
      if ($oauth.redirectUri) { $env:GOOGLE_REDIRECT_URI = [string]$oauth.redirectUri }
    }
  } catch {
    [Windows.Forms.MessageBox]::Show('Google OAuth 설정 파일을 읽지 못했습니다. %LOCALAPPDATA%\CALIBRA\google-oauth.json 내용을 확인해 주세요.', 'CALIBRA 로그인 설정', 'OK', 'Warning') | Out-Null
  }
}

function Test-PortInUse([int]$candidatePort) {
  $client = [Net.Sockets.TcpClient]::new()
  try {
    $task = $client.BeginConnect('127.0.0.1', $candidatePort, $null, $null)
    if (-not $task.AsyncWaitHandle.WaitOne(250)) { return $false }
    try { $client.EndConnect($task); return $true } catch { return $false }
  } catch { return $false } finally { $client.Dispose() }
}

function Test-CalibraServer([int]$candidatePort, [string]$expectedBuildId) {
  try {
    $request = [Net.HttpWebRequest]::Create("http://127.0.0.1:$candidatePort/login")
    $request.Method = 'GET'
    $request.Proxy = $null
    $request.Timeout = 1200
    $response = $request.GetResponse()
    try {
      $reader = New-Object IO.StreamReader($response.GetResponseStream())
      try { $page = $reader.ReadToEnd() } finally { $reader.Dispose() }
      return $response.StatusCode -eq 200 -and $page.Contains('CALIBRA')
    } finally { $response.Dispose() }
  } catch { return $false }
}

# Only reuse the process ID recorded by this install. A different app on port 3000 is ignored.
$port = $null
if (Test-Path $instanceFile) {
  try {
    $instance = Get-Content -LiteralPath $instanceFile -Raw | ConvertFrom-Json
    $serverPid = [int]$instance.pid
    $candidatePort = [int]$instance.port
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $serverPid" -ErrorAction Stop
    $owned = $process.ExecutablePath -and ([IO.Path]::GetFullPath($process.ExecutablePath) -ieq [IO.Path]::GetFullPath($node)) -and $process.CommandLine.Contains($nextCli)
    if ($owned -and (Test-PortInUse $candidatePort)) {
      if ($instance.buildId -eq $buildId -and ([bool]$instance.lanEnabled) -eq $lanEnabled -and (Test-CalibraServer $candidatePort $buildId)) { $port = $candidatePort }
      else { Stop-Process -Id $serverPid -Force; Start-Sleep -Milliseconds 500 }
    }
  } catch { $port = $null }
}

if ($null -eq $port) {
  foreach ($candidate in 3000..3010) {
    if (Test-PortInUse $candidate) { continue }
    $env:PORT = "$candidate"
    $env:HOSTNAME = $listenHost
    New-Item -ItemType Directory -Force -Path $dataRoot | Out-Null
    $outLog = Join-Path $dataRoot "server-$candidate.out.log"
    $errLog = Join-Path $dataRoot "server-$candidate.err.log"
    $server = Start-Process -FilePath $node `
      -ArgumentList @($nextCli, 'start', '--hostname', $listenHost, '--port', "$candidate") `
      -WorkingDirectory $appRoot -WindowStyle Hidden -PassThru `
      -RedirectStandardOutput $outLog -RedirectStandardError $errLog
    $ready = $false
    for ($i = 0; $i -lt 90; $i++) {
      Start-Sleep -Milliseconds 500
      $server.Refresh()
      if ($server.HasExited) { break }
      if (Test-CalibraServer $candidate $buildId) { $ready = $true; break }
    }
    if ($ready) {
      $port = $candidate
      @{ pid = $server.Id; port = $port; buildId = $buildId; lanEnabled = $lanEnabled } | ConvertTo-Json | Set-Content -LiteralPath $instanceFile -Encoding ASCII
      break
    }
  }
}

if ($null -eq $port) {
  [Windows.Forms.MessageBox]::Show('로컬 CALIBRA 서비스를 시작하지 못했습니다. 3000~3010 포트를 사용하는 다른 앱을 닫고 다시 실행해 주세요.', 'CALIBRA 실행 오류', 'OK', 'Error') | Out-Null
  exit 1
}

$url = "http://localhost:$port/"
$edge = Get-Command msedge.exe -ErrorAction SilentlyContinue
if ($edge) { Start-Process -FilePath $edge.Source -ArgumentList @('--app=' + $url) }
else { Start-Process -FilePath $url }
