$ErrorActionPreference = 'Stop'

$packageRoot = $PSScriptRoot
$installRoot = Join-Path $env:LOCALAPPDATA 'Programs\CALIBRA'
$dataRoot = Join-Path $env:LOCALAPPDATA 'CALIBRA'
$appRoot = Join-Path $installRoot 'app'
$fileRoot = Join-Path $dataRoot 'files'
$dbPath = Join-Path $appRoot 'prisma\dev.db'
New-Item -ItemType Directory -Force -Path $appRoot, (Split-Path $dbPath), $fileRoot | Out-Null

# Restore a database retained by the uninstaller before considering a new database.
$preservedDb = Join-Path $dataRoot 'dev.db'
if (-not (Test-Path $dbPath) -and (Test-Path $preservedDb)) {
  Copy-Item -LiteralPath $preservedDb -Destination $dbPath
}

# Copy application files as an overlay. No existing file is deleted; the local DB is not in the ZIP payload.
& robocopy (Join-Path $packageRoot 'app') $appRoot /E /XJ /R:1 /W:1 /NFL /NDL /NJH /NJS /NC /NS | Out-Null
if ($LASTEXITCODE -ge 8) { throw '앱 파일 설치에 실패했습니다.' }
Copy-Item -LiteralPath (Join-Path $packageRoot 'runtime\node.exe') -Destination (Join-Path $installRoot 'node.exe') -Force

# Recreate pnpm package junctions after ZIP extraction; this avoids broken package links.
$moduleRoot = Join-Path $appRoot 'node_modules'
$links = Get-Content (Join-Path $packageRoot 'junctions.json') -Raw | ConvertFrom-Json
foreach ($entry in $links) {
  $linkPath = Join-Path $moduleRoot $entry.link
  $targetPath = Join-Path $moduleRoot $entry.target
  if (-not (Test-Path $targetPath)) { throw "필수 모듈을 찾지 못했습니다: $($entry.target)" }
  if (Test-Path $linkPath) {
    $item = Get-Item -LiteralPath $linkPath -Force
    if ($item.LinkType -eq 'Junction') {
      $resolved = (Resolve-Path -LiteralPath $linkPath).Path
      if ($resolved -eq (Resolve-Path -LiteralPath $targetPath).Path) { continue }
      [IO.Directory]::Delete($linkPath, $false)
    } elseif ($item.PSIsContainer -and -not (Get-ChildItem -LiteralPath $linkPath -Force | Select-Object -First 1)) {
      Remove-Item -LiteralPath $linkPath -Force
    } else {
      throw "기존 모듈 자료를 보존하기 위해 설치를 중단했습니다: $linkPath"
    }
  }
  New-Item -ItemType Junction -Path $linkPath -Target $targetPath | Out-Null
}

# Migrate old attachment folders by copying; keep the source folder intact.
$legacyFiles = Join-Path $appRoot 'data'
if (Test-Path $legacyFiles) {
  $legacyItem = Get-Item -LiteralPath $legacyFiles -Force
  if ($legacyItem.LinkType -ne 'Junction') {
    & robocopy $legacyFiles $fileRoot /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NC /NS | Out-Null
    if ($LASTEXITCODE -ge 8) { throw '이전 첨부 자료를 복사하지 못했습니다. 원본 자료는 남아 있습니다.' }
  }
}
$oldProjectFiles = Join-Path $env:USERPROFILE 'Documents\ChatGPT\검교정 이력 관리 시스템\data'
if ((Test-Path $oldProjectFiles) -and -not (Get-ChildItem -LiteralPath $fileRoot -Force -ErrorAction SilentlyContinue | Select-Object -First 1)) {
  & robocopy $oldProjectFiles $fileRoot /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NC /NS | Out-Null
  if ($LASTEXITCODE -ge 8) { throw '이전 첨부 자료를 가져오지 못했습니다. 원본 자료는 남아 있습니다.' }
}

$env:DATABASE_URL = 'file:./dev.db'
$env:CALIBRA_DATA_DIR = $fileRoot
$node = Join-Path $installRoot 'node.exe'
$prisma = Join-Path $appRoot 'node_modules\prisma\build\index.js'
$tsx = Join-Path $appRoot 'node_modules\tsx\dist\cli.mjs'
Push-Location $appRoot
try {
  if (-not (Test-Path $dbPath)) {
    & $node $prisma db push --schema (Join-Path $appRoot 'prisma\schema.prisma')
    if ($LASTEXITCODE -ne 0) { throw '새 로컬 데이터베이스를 준비하지 못했습니다.' }
    & $node $tsx (Join-Path $appRoot 'prisma\seed.ts')
    if ($LASTEXITCODE -ne 0) { throw '초기 가상 업무 데이터를 등록하지 못했습니다.' }
  } else {
    $backupDir = Join-Path $dataRoot 'backups'
    New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
    $backupPath = Join-Path $backupDir ('calibra-before-install-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.db')
    Copy-Item -LiteralPath $dbPath -Destination $backupPath
    foreach ($suffix in @('-wal', '-shm')) {
      $sidecar = $dbPath + $suffix
      if (Test-Path $sidecar) { Copy-Item -LiteralPath $sidecar -Destination ($backupPath + $suffix) -Force }
    }
  }
  & $node $prisma db push --schema (Join-Path $appRoot 'prisma\schema.prisma')
  if ($LASTEXITCODE -ne 0) { throw '기존 데이터베이스를 안전하게 확인·갱신하지 못했습니다. 원본은 보존했습니다.' }
} finally {
  Pop-Location
}

$secretFile = Join-Path $dataRoot 'auth-secret.txt'
if (-not (Test-Path $secretFile)) {
  $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
  $secretBytes = New-Object byte[] 48
  try { $rng.GetBytes($secretBytes) } finally { $rng.Dispose() }
  [Convert]::ToBase64String($secretBytes) | Set-Content -NoNewline $secretFile
}
Copy-Item -LiteralPath (Join-Path $packageRoot 'Start-CALIBRA.ps1') -Destination (Join-Path $dataRoot 'Start-CALIBRA.ps1') -Force
Copy-Item -LiteralPath (Join-Path $packageRoot 'Start-CALIBRA.vbs') -Destination (Join-Path $dataRoot 'Start-CALIBRA.vbs') -Force
Copy-Item -LiteralPath (Join-Path $packageRoot 'Update-CALIBRA.ps1') -Destination (Join-Path $installRoot 'Update-CALIBRA.ps1') -Force
if (-not (Test-Path (Join-Path $packageRoot 'Uninstall-CALIBRA.ps1'))) { throw '제거 도구가 설치 패키지에 없습니다.' }
Copy-Item -LiteralPath (Join-Path $packageRoot 'Uninstall-CALIBRA.ps1') -Destination (Join-Path $installRoot 'Uninstall-CALIBRA.ps1') -Force
Copy-Item -LiteralPath (Join-Path $packageRoot 'Uninstall-CALIBRA.vbs') -Destination (Join-Path $installRoot 'Uninstall-CALIBRA.vbs') -Force
$uninstallKey = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\CALIBRA'
New-Item -Path $uninstallKey -Force | Out-Null
Set-ItemProperty -Path $uninstallKey -Name DisplayName -Value 'CALIBRA 계측기 검교정 이력관리'
$appVersion = (Get-Content (Join-Path $appRoot 'package.json') -Raw | ConvertFrom-Json).version
Set-ItemProperty -Path $uninstallKey -Name DisplayVersion -Value $appVersion
Set-ItemProperty -Path $uninstallKey -Name Publisher -Value 'CALIBRA'
$uninstallCommand = 'wscript.exe "' + (Join-Path $installRoot 'Uninstall-CALIBRA.vbs') + '"'
Set-ItemProperty -Path $uninstallKey -Name UninstallString -Value $uninstallCommand
New-ItemProperty -Path $uninstallKey -Name NoModify -Value 1 -PropertyType DWord -Force | Out-Null
New-ItemProperty -Path $uninstallKey -Name NoRepair -Value 1 -PropertyType DWord -Force | Out-Null
$startMenu = Join-Path ([Environment]::GetFolderPath('Programs')) 'CALIBRA'
New-Item -ItemType Directory -Force -Path $startMenu | Out-Null
$menuLink = (New-Object -ComObject WScript.Shell).CreateShortcut((Join-Path $startMenu 'CALIBRA 제거.lnk'))
$menuLink.TargetPath = Join-Path $env:SystemRoot 'System32\wscript.exe'
$menuLink.Arguments = '"' + (Join-Path $installRoot 'Uninstall-CALIBRA.vbs') + '"'
$menuLink.Description = 'CALIBRA 프로그램 제거 (사용자 자료 보존)'
$menuLink.Save()

$desktop = [Environment]::GetFolderPath('Desktop')
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut((Join-Path $desktop 'CALIBRA.lnk'))
$shortcut.TargetPath = Join-Path $env:SystemRoot 'System32\wscript.exe'
$shortcut.Arguments = '"' + (Join-Path $dataRoot 'Start-CALIBRA.vbs') + '"'
$shortcut.WorkingDirectory = $appRoot
$shortcut.Description = 'CALIBRA 계측기 검교정 이력관리 시스템'
$icon = Join-Path $appRoot 'public\calibra.ico'
if (Test-Path $icon) { $shortcut.IconLocation = $icon }
$shortcut.Save()

# Open the app home when installation finishes, using a hidden launcher process.
Start-Process -FilePath (Join-Path $env:SystemRoot 'System32\wscript.exe') `
  -WindowStyle Hidden -ArgumentList @((Join-Path $dataRoot 'Start-CALIBRA.vbs'))
exit 0
