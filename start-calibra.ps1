$ErrorActionPreference = 'Stop'

$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 3000
$url = "http://localhost:$port/"
$buildName = '.calibra-build'
$runningBuildFile = Join-Path $projectPath '.calibra-running-build'
if(Test-Path -LiteralPath $runningBuildFile) {
  $activeBuild=(Get-Content -LiteralPath $runningBuildFile -Raw).Trim()
  if($activeBuild -and (Test-Path -LiteralPath (Join-Path (Join-Path $projectPath $activeBuild) 'BUILD_ID'))) { $buildName=$activeBuild }
}
$pendingFile = Join-Path $projectPath '.calibra-pending-build'
if(Test-Path -LiteralPath $pendingFile) {
  $candidate=(Get-Content -LiteralPath $pendingFile -Raw).Trim()
  if($candidate -and (Test-Path -LiteralPath (Join-Path (Join-Path $projectPath $candidate) 'BUILD_ID'))) { $buildName=$candidate }
}
$buildPath = Join-Path $projectPath $buildName

function Set-StartupStatus([string]$text) { }
function Test-LocalServer {
  $client=[System.Net.Sockets.TcpClient]::new()
  try { $task=$client.BeginConnect('127.0.0.1',$port,$null,$null); if(-not $task.AsyncWaitHandle.WaitOne(500)){return $false}; $client.EndConnect($task); return $true }
  catch { return $false } finally { $client.Dispose() }
}
try {
  if(-not (Test-Path (Join-Path $buildPath 'BUILD_ID'))) { throw '사용 가능한 앱 빌드를 찾지 못했습니다. 업데이트 준비를 다시 실행해 주세요.' }
  $nextCli=Join-Path $projectPath 'node_modules\next\dist\bin\next'
  if(-not (Test-Path $nextCli)) { throw '앱 실행 모듈을 찾지 못했습니다. 설치 ZIP을 다시 풀어 SETUP.exe를 실행해 주세요.' }

  $desktop=[Environment]::GetFolderPath('Desktop')
  $nodeCandidates=@(
    (Join-Path $env:LOCALAPPDATA 'Programs\CALIBRA\node.exe'),
    (Join-Path $desktop 'CALIBRA-Windows\runtime\node.exe'),
    (Join-Path $env:ProgramFiles 'nodejs\node.exe')
  )
  $nodeCommand=Get-Command node.exe -ErrorAction SilentlyContinue
  if($nodeCommand) { $nodeCandidates += $nodeCommand.Source }
  $node=$nodeCandidates | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
  if(-not $node) { throw 'Node.js 실행 파일을 찾지 못했습니다. SETUP.exe로 앱을 설치해 주세요.' }

  $runningBuild='.calibra-build'
  if(Test-Path -LiteralPath $runningBuildFile) { $runningBuild=(Get-Content -LiteralPath $runningBuildFile -Raw).Trim() }
  if((Test-LocalServer) -and $runningBuild -ne $buildName) {
    $listeners=@(netstat -ano -p tcp | Select-String (':'+$port+'\s+.*LISTENING\s+(\d+)\s*$'))
    $stopped=$false
    foreach($line in $listeners) {
      if($line.Line -match 'LISTENING\s+(\d+)\s*$') {
        $pidToStop=[int]$Matches[1]
        $process=Get-Process -Id $pidToStop -ErrorAction SilentlyContinue
        $processInfo=Get-CimInstance Win32_Process -Filter "ProcessId=$pidToStop" -ErrorAction SilentlyContinue
        $commandLine=[string]$processInfo.CommandLine
        # The runtime executable can change between installations. Only stop a listener
        # whose command line explicitly starts this project's Next server.
        if($process -and $processInfo.ExecutablePath -and $commandLine -and
          $commandLine.IndexOf($projectPath,[StringComparison]::OrdinalIgnoreCase) -ge 0 -and
          $commandLine -match '(?i)next\\dist\\bin\\next' -and
          $commandLine -match '(?i)(^|["\s])start(["\s]|$)') {
          Stop-Process -Id $pidToStop -Force
          $stopped=$true
        }
      }
    }
    if(-not $stopped) { throw '새 버전이 준비됐지만 현재 앱 서버를 안전하게 재시작하지 못했습니다. CALIBRA를 닫은 뒤 다시 실행해 주세요.' }
    for($i=0;$i -lt 20 -and (Test-LocalServer);$i++) { Start-Sleep -Milliseconds 250 }
  }

  if(-not (Test-LocalServer)) {
    Set-StartupStatus 'PC에 저장된 데이터를 보존하며 앱 서비스를 시작하고 있습니다.'
    $dataRoot=Join-Path $env:LOCALAPPDATA 'CALIBRA'
    $secretFile=Join-Path $dataRoot 'auth-secret.txt'
    New-Item -ItemType Directory -Force -Path $dataRoot | Out-Null
    if(-not (Test-Path $secretFile)) {
      $rng=[Security.Cryptography.RandomNumberGenerator]::Create(); $secretBytes=New-Object byte[] 48
      try { $rng.GetBytes($secretBytes) } finally { $rng.Dispose() }
      [Convert]::ToBase64String($secretBytes) | Set-Content -NoNewline $secretFile
    }
    $env:AUTH_SECRET=(Get-Content -Raw $secretFile).Trim()
    $env:DATABASE_URL='file:./dev.db'
    $env:CALIBRA_DATA_DIR=Join-Path $dataRoot 'files'
    $env:CALIBRA_BUILD_DIR=$buildName
    $env:NODE_ENV='production'
    $logRoot=Join-Path $dataRoot 'logs'; New-Item -ItemType Directory -Force -Path $logRoot | Out-Null
    $serverOut=Join-Path $logRoot 'server.log'; $serverErr=Join-Path $logRoot 'server-error.log'
    $nodeArgs='"{0}" start --hostname 127.0.0.1 --port {1}' -f $nextCli,$port
    Start-Process -FilePath $node -ArgumentList $nodeArgs -WorkingDirectory $projectPath -WindowStyle Hidden -RedirectStandardOutput $serverOut -RedirectStandardError $serverErr | Out-Null

    $ready=$false
    for($i=0;$i -lt 60;$i++) {
      Start-Sleep -Milliseconds 500
      if(Test-LocalServer) { $ready=$true; break }
      if($i%4 -eq 0) { Set-StartupStatus '로컬 서비스를 시작하고 있습니다. 데이터는 이 PC에 유지됩니다.' }
    }
    if(-not $ready) {
      $detail=''; if(Test-Path $serverErr) { $detail=(Get-Content $serverErr -Tail 8 -ErrorAction SilentlyContinue) -join "`n" }
      if(-not $detail -and (Test-Path $serverOut)) { $detail=(Get-Content $serverOut -Tail 8 -ErrorAction SilentlyContinue) -join "`n" }
      throw "로컬 서비스를 시작하지 못했습니다.`n로그: $serverErr`n$detail"
    }
    [IO.File]::WriteAllText($runningBuildFile,$buildName,[Text.UTF8Encoding]::new($false))
    if($buildName -ne '.calibra-build' -and (Test-Path -LiteralPath $pendingFile)) { Remove-Item -LiteralPath $pendingFile -Force }
  }

  # Keep startup quiet: no console and no delayed splash window/image.
  $edge=Get-Command 'msedge.exe' -ErrorAction SilentlyContinue
  if($edge) { Start-Process $edge.Source -ArgumentList @('--app='+$url) } else { Start-Process $url }
} catch {
  try { Add-Content -LiteralPath (Join-Path $projectPath '.calibra-launch-error.log') -Value ("{0} {1}" -f (Get-Date -Format 's'), $_.ToString()) } catch { }
  Add-Type -AssemblyName System.Windows.Forms
  [Windows.Forms.MessageBox]::Show("앱을 시작하지 못했습니다.`n$_",'CALIBRA 실행 오류','OK','Error') | Out-Null
  exit 1
}
