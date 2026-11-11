$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms

$installRoot = Join-Path $env:LOCALAPPDATA 'Programs\CALIBRA'
$dataRoot = Join-Path $env:LOCALAPPDATA 'CALIBRA'
$dbPath = Join-Path $installRoot 'app\prisma\dev.db'
$preservedDb = Join-Path $dataRoot 'dev.db'
$instanceFile = Join-Path $dataRoot 'server-instance.json'
$desktop = [Environment]::GetFolderPath('Desktop')
$startMenu = Join-Path ([Environment]::GetFolderPath('Programs')) 'CALIBRA'
$uninstallKey = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\CALIBRA'

$choice = [Windows.Forms.MessageBox]::Show(
  "CALIBRA 프로그램 파일과 바로가기를 제거합니다.`n`n로컬 DB, 교재, 사진, 첨부자료는 다음 위치에 보존됩니다:`n$dataRoot`n`n계속하시겠습니까?",
  'CALIBRA 제거', 'YesNo', 'Warning')
if ($choice -ne [Windows.Forms.DialogResult]::Yes) { exit 0 }

# Stop only the server process recorded by this installation and matching its runtime.
if (Test-Path $instanceFile) {
  try {
    $instance = Get-Content -LiteralPath $instanceFile -Raw | ConvertFrom-Json
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $([int]$instance.pid)" -ErrorAction Stop
    $node = Join-Path $installRoot 'node.exe'
    if ($process -and $process.ExecutablePath -and
        ([IO.Path]::GetFullPath($process.ExecutablePath) -ieq [IO.Path]::GetFullPath($node)) -and
        $process.CommandLine.Contains('--port ' + [int]$instance.port) -and
        $process.CommandLine.Contains('next')) {
      Stop-Process -Id ([int]$instance.pid) -Force
      Start-Sleep -Milliseconds 700
    }
  } catch { }
}

# Keep a copy of the database outside the removable program directory.
if (Test-Path $dbPath) {
  New-Item -ItemType Directory -Force -Path $dataRoot | Out-Null
  if (Test-Path $preservedDb) {
    $backupDir = Join-Path $dataRoot 'backups'
    New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
    Copy-Item -LiteralPath $preservedDb -Destination (Join-Path $backupDir ('dev-before-uninstall-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.db'))
  }
  Copy-Item -LiteralPath $dbPath -Destination $preservedDb -Force
  foreach ($suffix in @('-wal', '-shm')) {
    $sidecar = $dbPath + $suffix
    if (Test-Path $sidecar) { Copy-Item -LiteralPath $sidecar -Destination ($preservedDb + $suffix) -Force }
  }
}

$shell = New-Object -ComObject WScript.Shell
foreach ($link in @((Join-Path $desktop 'CALIBRA.lnk'), (Join-Path $startMenu 'CALIBRA 제거.lnk'), (Join-Path $startMenu 'CALIBRA.lnk'))) {
  if (Test-Path $link) { Remove-Item -LiteralPath $link -Force }
}
if (Test-Path $uninstallKey) { Remove-Item -LiteralPath $uninstallKey -Recurse -Force }
if (Test-Path $startMenu) { Remove-Item -LiteralPath $startMenu -Force -ErrorAction SilentlyContinue }
if (Test-Path $installRoot) {
  Remove-Item -LiteralPath $installRoot -Recurse -Force
}
[Windows.Forms.MessageBox]::Show("프로그램을 제거했습니다.`n사용자 자료는 보존되었습니다:`n$dataRoot", 'CALIBRA 제거 완료', 'OK', 'Information') | Out-Null
