$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$base=(git rev-parse HEAD).Trim()
$paths=@('.gitignore','next.config.ts','package.json','pnpm-lock.yaml','docs/classroom.html','docs/editions.md','installer/editions.json','installer/Install-Edition.ps1','installer/build-edition-package.ps1','installer/Start-CALIBRA-Personal.ps1','installer/Start-CALIBRA-Classroom.ps1','prisma/init.sql','scripts/initialize-local-data.cjs','scripts/check-board-exports.ts','scripts/check-classroom-http.cjs','scripts/check-edition-release.cjs','scripts/start-classroom-qa.ps1','scripts/publish-edition-release.ps1','scripts/prepare-edition-commits.ps1')
$src=git status --porcelain --untracked-files=all -- src
foreach($line in $src){$file=$line.Substring(3).Trim('"');if($file -notin @('src/app/actions.ts','src/app/special-process/page.tsx','src/components/board-popup-actions.tsx')){$paths+=$file}}
$result=@{}
foreach($entry in @(@{edition='classroom';version='0.2.0'},@{edition='personal';version='0.1.4'})){
  $edition=$entry.edition;$version=$entry.version
  $env:GIT_INDEX_FILE=Join-Path $root ('dist\index-'+$edition+'-'+[guid]::NewGuid().ToString('N'))
  try{
    git read-tree $base
    git add -- $paths
    if($LASTEXITCODE -ne 0){throw 'Source staging failed.'}
    # Replace the source entries with exactly the files used by this compiled candidate.
    $stage=Join-Path $root ('dist\'+$edition+'-v'+$version+'-source')
    $frozen=Get-ChildItem -LiteralPath (Join-Path $stage 'src') -Recurse -File|Where-Object{$_.FullName -notmatch '\\generated\\'}
    $frozen+=Get-Item -LiteralPath (Join-Path $stage 'package.json'),(Join-Path $stage 'scripts\initialize-local-data.cjs')
    foreach($file in $frozen){
      $relative=$file.FullName.Substring($stage.Length+1).Replace('\','/')
      $hash=(git hash-object -w -- $file.FullName).Trim()
      git update-index --add --cacheinfo ('100644,'+$hash+','+$relative)
      if($LASTEXITCODE -ne 0){throw ('Frozen source index failed: '+$relative)}
    }
    $tree=(git write-tree).Trim()
    $commit=('Release '+$edition+' v'+$version+': independent app, preserved originals and post exports')|git commit-tree $tree -p $base
    if($LASTEXITCODE -ne 0){throw 'Release source commit failed.'}
    $commit=$commit.Trim();git update-ref ('refs/heads/codex/'+$edition) $commit
    $result[$edition]=$commit
    Write-Output ($edition+' source commit '+$commit)
  }finally{$index=$env:GIT_INDEX_FILE;Remove-Item Env:GIT_INDEX_FILE;if(Test-Path -LiteralPath $index){Remove-Item -LiteralPath $index -Force}}
}
$result|ConvertTo-Json|Set-Content -LiteralPath (Join-Path $root 'dist\edition-commits.json') -Encoding UTF8
