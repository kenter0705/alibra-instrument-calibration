$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$sourceRoot = if ($env:CALIBRA_SOURCE_ROOT) { (Resolve-Path -LiteralPath $env:CALIBRA_SOURCE_ROOT).Path } else { $projectRoot }
$version = (Get-Content (Join-Path $projectRoot 'package.json') -Raw | ConvertFrom-Json).version
$buildDirName = if ($env:CALIBRA_BUILD_DIR) { $env:CALIBRA_BUILD_DIR } else { '.calibra-build' }
$buildRoot = Join-Path $projectRoot $buildDirName
$buildIdPath = Join-Path $buildRoot 'BUILD_ID'
$downloads = Join-Path $projectRoot 'dist\code-updates'
$stage = Join-Path $downloads ('stage-' + [guid]::NewGuid().ToString('N'))
$zip = Join-Path $downloads "CALIBRA-CodeUpdate-v$version.zip"

if (-not (Test-Path $buildIdPath)) { throw "프로덕션 빌드가 없습니다: $buildRoot" }
if (Test-Path $zip) { Remove-Item -LiteralPath $zip -Force }
if (Test-Path ($zip + '.sha256')) { Remove-Item -LiteralPath ($zip + '.sha256') -Force }
New-Item -ItemType Directory -Force -Path $stage | Out-Null
try {
  $app = Join-Path $stage 'app'
  New-Item -ItemType Directory -Force -Path (Join-Path $app '.calibra-build') | Out-Null
  $buildId = (Get-Content -LiteralPath $buildIdPath -Raw).Trim()
  $manifest = [ordered]@{
    product = 'CALIBRA'
    version = $version
    buildId = $buildId
    payload = 'application-code-only'
    excluded = @('database', 'accounts', 'attachments', 'user-files', 'runtime', 'node_modules')
    createdAt = (Get-Date).ToUniversalTime().ToString('o')
  }
  $manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $stage 'update-manifest.json') -Encoding UTF8
  Copy-Item -LiteralPath $buildIdPath -Destination (Join-Path $app '.calibra-build\BUILD_ID')
  $package = Get-Content -LiteralPath (Join-Path $projectRoot 'package.json') -Raw
  Set-Content -LiteralPath (Join-Path $app 'package.json') -Value $package -Encoding UTF8

  $skip = '^(?:cache|types|diagnostics|trace)(?:\\|$)|(?:^|\\)query_engine-windows\.dll\.node\.tmp\d+$'
  Get-ChildItem -LiteralPath $buildRoot -Recurse -File -Force | Where-Object {
    $relative = $_.FullName.Substring($buildRoot.Length + 1)
    $relative -notmatch $skip
  } | ForEach-Object {
    $relative = $_.FullName.Substring($buildRoot.Length + 1)
    $destination = Join-Path (Join-Path $app '.calibra-build') $relative
    New-Item -ItemType Directory -Force -Path (Split-Path $destination) | Out-Null
    Copy-Item -LiteralPath $_.FullName -Destination $destination
  }

  # Include only UI/static public assets; never include downloadable installers or local data.
  $publicRoot = Join-Path $sourceRoot 'public'
  Get-ChildItem -LiteralPath $publicRoot -Recurse -File -Force | Where-Object {
    $_.FullName -notmatch '\\downloads\\' -and $_.Extension -notin @('.db', '.sqlite', '.zip')
  } | ForEach-Object {
    $relative = $_.FullName.Substring($publicRoot.Length + 1)
    $destination = Join-Path (Join-Path $app 'public') $relative
    New-Item -ItemType Directory -Force -Path (Split-Path $destination) | Out-Null
    Copy-Item -LiteralPath $_.FullName -Destination $destination
  }

  Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $zip -CompressionLevel Optimal
  $hash = (Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash
  Set-Content -LiteralPath ($zip + '.sha256') -Value "$hash  $(Split-Path $zip -Leaf)" -Encoding ASCII
  Write-Output "Created code-only update: $zip"
  Write-Output "Size: $([math]::Round((Get-Item $zip).Length / 1MB, 1)) MB"
  Write-Output "SHA-256: $hash"
  Write-Output 'Payload contains .calibra-build, package version, and public UI assets only.'
} finally {
  $resolvedStage = [IO.Path]::GetFullPath($stage)
  if (-not $resolvedStage.StartsWith([IO.Path]::GetFullPath($downloads) + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Invalid staging path.' }
  Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue
}
