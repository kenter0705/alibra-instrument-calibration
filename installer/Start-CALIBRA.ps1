$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms

$installRoot = Join-Path $env:LOCALAPPDATA 'Programs\CALIBRA'
$appRoot = Join-Path $installRoot 'app'
$node = Join-Path $installRoot 'node.exe'
$nextCli = Join-Path $appRoot 'node_modules\next\dist\bin\next'
$dataRoot = Join-Path $env:LOCALAPPDATA 'CALIBRA'
$secretFile = Join-Path $dataRoot 'auth-secret.txt'
$instanceFile = Join-Path $dataRoot 'server-instance.json'

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
$env:AUTH_SECRET = (Get-Content -Raw $secretFile).Trim()
$env:DATABASE_URL = 'file:./dev.db'
$env:CALIBRA_DATA_DIR = Join-Path $dataRoot 'files'
$env:NODE_ENV = 'production'

function Test-PortInUse([int]$candidatePort) {
  $client = [Net.Sockets.TcpClient]::new()
  try {
    $task = $client.BeginConnect('127.0.0.1', $candidatePort, $null, $null)
    if (-not $task.AsyncWaitHandle.WaitOne(250)) { return $false }
    try { $client.EndConnect($task); return $true } catch { return $false }
  } catch { return $false } finally { $client.Dispose() }
}

# Only reuse the process ID recorded by this install. A different app on port 3000 is ignored.
$port = $null
if (Test-Path $instanceFile) {
  try {
    $instance = Get-Content -LiteralPath $instanceFile -Raw | ConvertFrom-Json
    $serverPid = [int]$instance.pid
    $candidatePort = [int]$instance.port
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $serverPid" -ErrorAction Stop
    if ($process -and $process.ExecutablePath -and
        ([IO.Path]::GetFullPath($process.ExecutablePath) -ieq [IO.Path]::GetFullPath($node)) -and
        $process.CommandLine.Contains("--port $candidatePort") -and (Test-PortInUse $candidatePort)) {
      $port = $candidatePort
    }
  } catch { $port = $null }
}

if ($null -eq $port) {
  foreach ($candidate in 3000..3010) {
    if (Test-PortInUse $candidate) { continue }
    $env:PORT = "$candidate"
    $env:HOSTNAME = '127.0.0.1'
    New-Item -ItemType Directory -Force -Path $dataRoot | Out-Null
    $outLog = Join-Path $dataRoot "server-$candidate.out.log"
    $errLog = Join-Path $dataRoot "server-$candidate.err.log"
    $server = Start-Process -FilePath $node `
      -ArgumentList @($nextCli, 'start', '--hostname', '127.0.0.1', '--port', "$candidate") `
      -WorkingDirectory $appRoot -WindowStyle Hidden -PassThru `
      -RedirectStandardOutput $outLog -RedirectStandardError $errLog
    $ready = $false
    for ($i = 0; $i -lt 90; $i++) {
      Start-Sleep -Milliseconds 500
      $server.Refresh()
      if ($server.HasExited) { break }
      if (Test-PortInUse $candidate) { $ready = $true; break }
    }
    if ($ready) {
      $port = $candidate
      @{ pid = $server.Id; port = $port } | ConvertTo-Json | Set-Content -LiteralPath $instanceFile -Encoding ASCII
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
