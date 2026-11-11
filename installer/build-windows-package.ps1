$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$sourceRoot = if ($env:CALIBRA_SOURCE_ROOT) { (Resolve-Path -LiteralPath $env:CALIBRA_SOURCE_ROOT).Path } else { $projectRoot }
$legacyZip = Join-Path $projectRoot 'public\downloads\CALIBRA-Windows.zip'
$latestVersioned = Get-ChildItem (Join-Path $projectRoot 'public\downloads') -Filter 'CALIBRA-Setup-v*.zip' -File -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1
$sourceZip = if ($latestVersioned) { $latestVersioned.FullName } else { $legacyZip }
$version = (Get-Content (Join-Path $projectRoot 'package.json') -Raw | ConvertFrom-Json).version
$buildDate = Get-Date -Format 'yyyyMMdd'
$outputZip = Join-Path $projectRoot "public\downloads\CALIBRA-Setup-v$version-$buildDate.zip"
$buildRoot = Join-Path $projectRoot 'dist\installer-build'
$sourceBuildName = if ($env:CALIBRA_BUILD_DIR) { $env:CALIBRA_BUILD_DIR } else { '.calibra-build' }
$sourceBuildRoot = Join-Path $projectRoot $sourceBuildName
$setupExe = Join-Path $buildRoot 'SETUP.exe'

if (-not (Test-Path $sourceZip)) { throw '기준 Windows 설치 패키지를 찾지 못했습니다.' }
if (-not (Test-Path (Join-Path $sourceBuildRoot 'BUILD_ID'))) { throw "먼저 현재 소스로 프로덕션 빌드를 완료하세요: $sourceBuildRoot" }
if (Test-Path $outputZip) { throw "같은 버전의 결과 파일이 이미 있습니다: $outputZip" }
New-Item -ItemType Directory -Force -Path $buildRoot | Out-Null

$compiler = @(
  (Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'),
  (Join-Path $env:WINDIR 'Microsoft.NET\Framework\v4.0.30319\csc.exe')
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $compiler) { throw 'Windows 기본 C# 컴파일러를 찾지 못했습니다.' }
& $compiler /nologo /target:winexe /r:System.Windows.Forms.dll /r:System.Drawing.dll "/out:$setupExe" (Join-Path $PSScriptRoot 'SetupLauncher.cs')
if ($LASTEXITCODE -ne 0 -or -not (Test-Path $setupExe)) { throw 'SETUP.exe를 만들지 못했습니다.' }

Copy-Item -LiteralPath $sourceZip -Destination $outputZip
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [IO.Compression.ZipFile]::Open($outputZip, [IO.Compression.ZipArchiveMode]::Update)
try {
  $removePrefixes = @('app/src/', 'app/prisma/', 'app/public/', 'app/.next', 'app/.calibra-build/')
  $removeExact = @('app/package.json', 'app/next.config.ts', 'app/tsconfig.json', 'app/postcss.config.mjs', 'app/pnpm-lock.yaml', 'SETUP.exe', '설치하기.ps1', 'Start-CALIBRA.ps1', 'Start-CALIBRA.vbs', '설치 안내.txt')
  for ($i = $archive.Entries.Count - 1; $i -ge 0; $i--) {
    $name = $archive.Entries[$i].FullName
    $isGeneratedTempEngine = $name -match '(?i)(?:^|/)query_engine-windows\.dll\.node\.tmp\d+$'
    $isDuplicatePrismaClient = $name -match '(?i)^app/src/generated/prisma-temp/'
    if (($removePrefixes | Where-Object { $name.StartsWith($_, [StringComparison]::OrdinalIgnoreCase) }).Count -gt 0 -or $removeExact -contains $name -or $isGeneratedTempEngine -or $isDuplicatePrismaClient) {
      $archive.Entries[$i].Delete()
    }
  }

  function Add-PackageFile([string]$path, [string]$name) {
    $entry = $archive.GetEntry($name)
    if ($entry) { $entry.Delete() }
    [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $path, $name, [IO.Compression.CompressionLevel]::Optimal) | Out-Null
  }
  function Add-PackageTree([string]$root, [string]$prefix, [scriptblock]$include) {
    $base = (Resolve-Path $root).Path.TrimEnd('\')
    Get-ChildItem -LiteralPath $base -Recurse -File -Force | Where-Object { & $include $_ } | ForEach-Object {
      $relative = $_.FullName.Substring($base.Length + 1).Replace('\', '/')
      Add-PackageFile $_.FullName ($prefix + $relative)
    }
  }

  Add-PackageTree (Join-Path $sourceRoot 'src') 'app/src/' {
    param($file)
    $relative = $file.FullName.Substring((Resolve-Path (Join-Path $sourceRoot 'src')).Path.Length + 1).Replace('\', '/')
    -not ($relative -match '(?i)^generated/prisma-temp/' -or $file.Name -match '(?i)^query_engine-windows\.dll\.node\.tmp\d+$')
  }
  Add-PackageTree (Join-Path $sourceRoot 'prisma') 'app/prisma/' { param($file) $file.Name -notmatch '\.db(-wal|-shm)?$' }
  Add-PackageTree (Join-Path $sourceRoot 'public') 'app/public/' { param($file) $file.Extension -ne '.zip' }
  Add-PackageTree $sourceBuildRoot 'app/.calibra-build/' {
    param($file)
    $relative = $file.FullName.Substring((Resolve-Path $sourceBuildRoot).Path.Length + 1)
    -not ($relative -match '^(standalone|cache|types|diagnostics|trace)(\\|$)' -or $file.Name -match '(?i)^query_engine-windows\.dll\.node\.tmp\d+$')
  }

  foreach ($name in @('package.json','next.config.ts','tsconfig.json','postcss.config.mjs','pnpm-lock.yaml')) {
    Add-PackageFile (Join-Path $sourceRoot $name) ('app/' + $name)
  }
  Add-PackageFile $setupExe 'SETUP.exe'
  Add-PackageFile (Join-Path $PSScriptRoot 'Install-CALIBRA.ps1') '설치하기.ps1'
  Add-PackageFile (Join-Path $PSScriptRoot 'Start-CALIBRA.ps1') 'Start-CALIBRA.ps1'
  Add-PackageFile (Join-Path $PSScriptRoot 'Start-CALIBRA.vbs') 'Start-CALIBRA.vbs'
  Add-PackageFile (Join-Path $PSScriptRoot 'Update-CALIBRA.ps1') 'Update-CALIBRA.ps1'
  Add-PackageFile (Join-Path $PSScriptRoot 'Uninstall-CALIBRA.ps1') 'Uninstall-CALIBRA.ps1'
  Add-PackageFile (Join-Path $PSScriptRoot 'Uninstall-CALIBRA.vbs') 'Uninstall-CALIBRA.vbs'

  $readmePath = Join-Path $buildRoot '설치 안내.txt'
  @"
CALIBRA Windows 설치 패키지 v$version

설치 방법
1. 이 ZIP 파일을 폴더에 압축 해제합니다.
2. SETUP.exe를 더블클릭합니다.
3. 설치가 끝나면 바탕화면 CALIBRA 바로가기로 홈 화면을 엽니다.

이 패키지에는 앱 본체, Node.js 실행 환경, 필수 모듈이 포함되어 있습니다. 설치가 끝난 뒤 앱을 실행할 때 공개 웹사이트나 인터넷 연결은 필요하지 않습니다. 앱은 이 PC 안에서 로컬로 실행됩니다.

공동 교육 사용: 서버 PC에서 관리자 로그인 → 다수 사용하기 → 사내망 접속 허용 저장 → CALIBRA 바로가기 다시 실행 순서로 설정합니다. 다른 PC와 같은 Wi-Fi의 휴대폰은 서버 IP:포트로 접속하고 각자의 승인 계정으로 로그인하세요. 서버 PC는 수업 중 켜 두세요.

원본 데이터는 공동 데이터실에서 읽기 전용으로 보관합니다. 데이터 불러오기 → 사본으로 수정 → 다른 이름으로 저장을 사용하면 작성자·시각과 함께 새 수정본이 생깁니다. CSV·XLSX·JSON, 그래프별 계량치·계수치 양식을 지원합니다. 25명 규모 수업 전에 접속과 동시 저장을 점검하세요.

Google 이메일 로그인, YouTube 재생, KOLAS 공식 페이지 열기처럼 외부 서비스에 연결하는 기능은 인터넷이 필요합니다. 사용자 데이터는 이 PC의 로컬 SQLite 데이터베이스와 %LOCALAPPDATA%\CALIBRA 파일 폴더에 저장됩니다. 업데이트 설치는 기존 DB를 ZIP 안의 파일로 덮어쓰지 않습니다.
"@ | Set-Content -LiteralPath $readmePath -Encoding UTF8
  Add-PackageFile $readmePath '설치 안내.txt'
} finally {
  $archive.Dispose()
}

$hash = (Get-FileHash -LiteralPath $outputZip -Algorithm SHA256).Hash
Set-Content -LiteralPath ($outputZip + '.sha256') -Value "$hash  $(Split-Path $outputZip -Leaf)" -Encoding ASCII
Write-Output "Created versioned package: $outputZip"
Write-Output "Size: $([math]::Round((Get-Item $outputZip).Length / 1MB, 1)) MB"
Write-Output "SHA-256: $hash"
