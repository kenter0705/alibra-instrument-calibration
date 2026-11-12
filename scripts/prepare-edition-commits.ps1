$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$base=(git rev-parse origin/main).Trim()
$editions=Get-Content -LiteralPath (Join-Path $root 'installer/editions.json') -Raw|ConvertFrom-Json
$paths=@('.gitignore','README.md','next.config.ts','package.json','pnpm-lock.yaml','docs/index.html','docs/classroom.html','docs/editions.md','installer/SetupLauncher.cs','installer/editions.json','installer/Install-Edition.ps1','installer/build-edition-package.ps1','installer/Start-CALIBRA-Personal.ps1','installer/Start-CALIBRA-Classroom.ps1','prisma/init.sql','scripts/initialize-local-data.cjs','scripts/check-auth-lifecycle.cjs','scripts/check-calibration-qualification-bulk.ts','scripts/check-board-exports.ts','scripts/check-classroom-http.cjs','scripts/check-edition-release.cjs','scripts/check-packaged-app.cjs','scripts/start-classroom-qa.ps1','scripts/publish-edition-release.ps1','scripts/finalize-edition-releases.ps1','scripts/verify-edition-packages.cjs','scripts/prepare-edition-commits.ps1','scripts/build-example-data.ts','scripts/check-sample-protection.cjs','scripts/check-education-data.ts','scripts/check-installed-edition.cjs','scripts/install-verified-edition.ps1','public/example-data','public/reference','docs/spc-reference.md','scripts/check-spc-analysis.tsx','scripts/build-spc-reference.ts','scripts/render-spc-visual-check.tsx','scripts/serve-spc-visual-check.cjs')
$src=git status --porcelain --untracked-files=all -- src
foreach($line in $src){$file=$line.Substring(3).Trim('"');if($file -notin @('src/app/actions.ts','src/app/special-process/page.tsx','src/components/board-popup-actions.tsx')){$paths+=$file}}
$result=@{}
foreach($edition in @('classroom','personal')){
 $version=$editions.$edition.version
 $branch=if($edition -eq 'classroom'){'codex/multi'}else{'codex/personal'}
 $previous=git rev-parse --verify ('refs/heads/'+$branch) 2>$null
 $savedDir=$env:GIT_DIR;$savedTree=$env:GIT_WORK_TREE;$savedIndex=$env:GIT_INDEX_FILE
 $index=Join-Path $root ('dist/index-'+$edition+'-'+[guid]::NewGuid().ToString('N'))
 try{
  $env:GIT_DIR=Join-Path $root '.git';$env:GIT_WORK_TREE=$root;$env:GIT_INDEX_FILE=$index
  git -C $root read-tree $base
  git -C $root -c core.autocrlf=false add -- $paths
  if($LASTEXITCODE -ne 0){throw 'Source staging failed.'}
  $stage=Join-Path $root ('dist/'+$edition+'-v'+$version+'-source')
  $env:GIT_WORK_TREE=$stage
  git -C $stage -c core.autocrlf=false add -f -- src package.json public/manifest.webmanifest scripts/initialize-local-data.cjs ':(exclude)src/generated/**'
  if($LASTEXITCODE -ne 0){throw 'Frozen candidate staging failed.'}
  $tree=(git -C $stage write-tree).Trim()
  $parents=@('-p',$base)
  if($previous){git merge-base --is-ancestor $previous.Trim() $base;if($LASTEXITCODE -ne 0){$parents+=@('-p',$previous.Trim())}}
  $commit=('Release '+$editions.$edition.name+' v'+$version+': verified SPC charts, protected examples, account persistence and full board exports')|git commit-tree $tree @parents
  if($LASTEXITCODE -ne 0){throw 'Release commit failed.'}
  $commit=$commit.Trim();git update-ref ('refs/heads/'+$branch) $commit
  if($edition -eq 'classroom'){git update-ref refs/heads/codex/classroom $commit}
  $result[$edition]=$commit;Write-Output ($editions.$edition.name+' source '+$commit)
 }finally{
  $env:GIT_DIR=$savedDir;$env:GIT_WORK_TREE=$savedTree;$env:GIT_INDEX_FILE=$savedIndex
  if(Test-Path -LiteralPath $index){Remove-Item -LiteralPath $index -Force}
 }
}
$result|ConvertTo-Json|Set-Content -LiteralPath (Join-Path $root 'dist/edition-commits.json') -Encoding UTF8
