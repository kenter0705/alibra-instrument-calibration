param(
  [Parameter(Mandatory = $true)][string]$AppRoot,
  [Parameter(Mandatory = $true)][string]$InstallRoot,
  [Parameter(Mandatory = $true)][string]$DataRoot
)

$ErrorActionPreference = 'Stop'
$api = 'https://api.github.com/repos/kenter0705/alibra-instrument-calibration/releases/latest'
$localPackage = Join-Path $AppRoot 'package.json'
$localBuild = Join-Path $AppRoot '.calibra-build\BUILD_ID'
$instanceFile = Join-Path $DataRoot 'server-instance.json'
$tempRoot = Join-Path $env:TEMP ('CALIBRA-update-' + [guid]::NewGuid().ToString('N'))

try {
  if (-not (Test-Path -LiteralPath $localPackage) -or -not (Test-Path -LiteralPath $localBuild)) { return }
  $localVersion = [version](Get-Content -LiteralPath $localPackage -Raw | ConvertFrom-Json).version
  $latest = Invoke-RestMethod -Uri $api -Headers @{ 'User-Agent' = 'CALIBRA-Desktop-Updater'; Accept = 'application/vnd.github+json' } -TimeoutSec 4
  $latestVersion = [version](([string]$latest.tag_name).TrimStart('v'))
  if ($latestVersion -le $localVersion) { return }

  $asset = $latest.assets | Where-Object { $_.name -eq "CALIBRA-CodeUpdate-v$latestVersion.zip" } | Select-Object -First 1
  if (-not $asset -or -not $asset.browser_download_url) { return }
  if ($asset.size -gt 150MB) { return }

  New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null
  $zipPath = Join-Path $tempRoot $asset.name
  Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $zipPath -Headers @{ 'User-Agent' = 'CALIBRA-Desktop-Updater' } -TimeoutSec 45
  if ($asset.digest -match '^sha256:([0-9a-fA-F]{64})$') {
    $actual = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash
    if ($actual -ine $Matches[1]) { throw '업데이트 파일 검증에 실패했습니다.' }
  }

  $stage = Join-Path $tempRoot 'expanded'
  Expand-Archive -LiteralPath $zipPath -DestinationPath $stage -Force
  $manifestPath = Join-Path $stage 'update-manifest.json'
  $newBuild = Join-Path $stage 'app\.calibra-build'
  $newPackage = Join-Path $stage 'app\package.json'
  if (-not (Test-Path $manifestPath) -or -not (Test-Path (Join-Path $newBuild 'BUILD_ID')) -or -not (Test-Path $newPackage)) {
    throw '업데이트에 필요한 프로그램 파일이 없습니다.'
  }
  $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
  if ([version]$manifest.version -ne $latestVersion -or [version]((Get-Content -LiteralPath $newPackage -Raw | ConvertFrom-Json).version) -ne $latestVersion) {
    throw '업데이트 버전 정보가 일치하지 않습니다.'
  }
  if ($manifest.product -ne 'CALIBRA' -or $manifest.payload -ne 'application-code-only' -or $manifest.buildId -ne (Get-Content -LiteralPath (Join-Path $newBuild 'BUILD_ID') -Raw).Trim()) {
    throw '코드 전용 업데이트 manifest 검증에 실패했습니다.'
  }
  # Fail closed if an archive ever contains user data or executable dependencies.
  $archiveEntries = [IO.Compression.ZipFile]::OpenRead($zipPath)
  try {
    foreach ($entry in $archiveEntries.Entries) {
      $entryName = $entry.FullName -replace '\\', '/'
      $entryName = $entryName.ToLowerInvariant()
      $allowedDirectory = $entryName -in @('app/', 'app/.calibra-build/', 'app/public/') -and $entry.Length -eq 0
      $allowedCode = $entryName -eq 'update-manifest.json' -or $entryName -eq 'app/package.json' -or
        $entryName.StartsWith('app/.calibra-build/') -or $entryName.StartsWith('app/public/') -or $allowedDirectory
      if (-not $allowedCode -or $entryName -match '(^|/)(?:dev\.db|[^/]+\.sqlite(?:-wal|-shm)?|auth-secret\.txt|google-oauth\.json)$' -or
          $entryName -match '(^|/)(?:node_modules|prisma|files|attachments|backups)(/|$)') {
        throw '코드 업데이트 파일에 사용자 자료 또는 런타임 파일이 포함되어 있어 적용을 중단했습니다.'
      }
    }
  } finally { $archiveEntries.Dispose() }

  # Stop only the CALIBRA server recorded by this installation. DB and user files
  # live outside AppRoot and are never part of the patch archive.
  if (Test-Path -LiteralPath $instanceFile) {
    try {
      $instance = Get-Content -LiteralPath $instanceFile -Raw | ConvertFrom-Json
      $process = Get-Process -Id ([int]$instance.pid) -ErrorAction Stop
      $expectedNode = [IO.Path]::GetFullPath((Join-Path $InstallRoot 'node.exe'))
      if ($process.Path -and [IO.Path]::GetFullPath($process.Path) -ieq $expectedNode) {
        Stop-Process -Id $process.Id -Force
        Start-Sleep -Milliseconds 700
      }
    } catch { }
  }

  $currentBuild = Join-Path $AppRoot '.calibra-build'
  $stagedBuild = Join-Path $AppRoot '.calibra-build.next'
  $previousBuild = Join-Path $AppRoot '.calibra-build.previous'
  if (Test-Path $stagedBuild) { Remove-Item -LiteralPath $stagedBuild -Recurse -Force }
  Copy-Item -LiteralPath $newBuild -Destination $stagedBuild -Recurse
  if (Test-Path $previousBuild) { Remove-Item -LiteralPath $previousBuild -Recurse -Force }
  if (Test-Path $currentBuild) { Move-Item -LiteralPath $currentBuild -Destination $previousBuild }
  try {
    Move-Item -LiteralPath $stagedBuild -Destination $currentBuild
    Copy-Item -LiteralPath $newPackage -Destination $localPackage -Force
    $publicSource = Join-Path $stage 'app\public'
    if (Test-Path $publicSource) {
      $publicTarget = Join-Path $AppRoot 'public'
      New-Item -ItemType Directory -Force -Path $publicTarget | Out-Null
      & robocopy $publicSource $publicTarget /E /XJ /R:1 /W:1 /NFL /NDL /NJH /NJS /NC /NS | Out-Null
      if ($LASTEXITCODE -ge 8) { throw '화면 이미지 파일을 업데이트하지 못했습니다.' }
    }
    Remove-Item -LiteralPath $previousBuild -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $instanceFile -Force -ErrorAction SilentlyContinue
  } catch {
    if (Test-Path $currentBuild) { Remove-Item -LiteralPath $currentBuild -Recurse -Force -ErrorAction SilentlyContinue }
    if (Test-Path $previousBuild) { Move-Item -LiteralPath $previousBuild -Destination $currentBuild -ErrorAction SilentlyContinue }
    throw
  }
} catch {
  # Updates are best-effort; offline use should continue on the installed build.
  if ($_.Exception.Message -match '검증|필요한 프로그램 파일|버전 정보|업데이트하지|자료 또는 런타임') {
    Add-Type -AssemblyName System.Windows.Forms
    [Windows.Forms.MessageBox]::Show($_.Exception.Message, 'CALIBRA 업데이트 오류', 'OK', 'Warning') | Out-Null
  }
} finally {
  if (Test-Path -LiteralPath $tempRoot) { Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue }
}
