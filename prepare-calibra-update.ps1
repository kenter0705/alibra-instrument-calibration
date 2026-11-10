$ErrorActionPreference = 'Stop'
$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$releaseRoot = Join-Path $projectPath '.calibra-releases'
$releaseName = '.calibra-releases\release-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
$releasePath = Join-Path $projectPath $releaseName
New-Item -ItemType Directory -Force -Path $releaseRoot | Out-Null

# Prepare the candidate separately; the live build and local data are not touched.
$env:CALIBRA_BUILD_DIR = $releaseName
Push-Location $projectPath
try {
  Write-Host "새 버전을 별도 폴더에서 준비합니다: $releaseName"
  & pnpm exec next build
  if ($LASTEXITCODE -ne 0) { throw "빌드 실패 (종료 코드 $LASTEXITCODE). 현재 실행 버전은 그대로 유지됩니다." }
  if (-not (Test-Path -LiteralPath (Join-Path $releasePath 'BUILD_ID'))) { throw 'BUILD_ID를 찾을 수 없어 새 버전을 활성화하지 않았습니다.' }
  [IO.File]::WriteAllText((Join-Path $projectPath '.calibra-pending-build'), $releaseName, [Text.UTF8Encoding]::new($false))
  Write-Host '업데이트 준비 완료. 현재 실행본은 유지됩니다. CALIBRA 바로가기를 다시 실행하면 새 버전으로 전환됩니다.'
} finally {
  Pop-Location
  Remove-Item Env:\CALIBRA_BUILD_DIR -ErrorAction SilentlyContinue
}
