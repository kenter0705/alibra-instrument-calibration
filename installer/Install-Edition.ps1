param([switch]$NoLaunch,[switch]$NoShortcuts)
$env:PSModulePath="$PSHOME\Modules;"+$env:PSModulePath
$ErrorActionPreference='Stop'
$payload=Join-Path $PSScriptRoot 'app'
$package=Get-Content -LiteralPath (Join-Path $payload 'package.json') -Raw|ConvertFrom-Json
$release=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'active-release.json') -Raw|ConvertFrom-Json
$edition=[string]$package.calibraEdition
if($edition -notin @('personal','classroom') -or $release.edition -ne $edition -or $package.version -ne $release.version){throw 'Not a matching classroom package.'}
$directory=if($edition -eq 'classroom'){'CALIBRA-Classroom'}else{'CALIBRA'}
$appName=if($edition -eq 'classroom'){'CALIBRA 멀티'}else{'CALIBRA 퍼스널'}
$installRoot=Join-Path $env:LOCALAPPDATA ('Programs\'+$directory)
$dataRoot=Join-Path $env:LOCALAPPDATA $directory
$appRoot=Join-Path $installRoot 'app'
$buildPath=[IO.Path]::GetFullPath((Join-Path $payload $release.buildDir))
if(-not $buildPath.StartsWith([IO.Path]::GetFullPath($payload)+'\',[StringComparison]::OrdinalIgnoreCase)){throw 'Invalid release build path.'}
if((Get-Content -LiteralPath (Join-Path $buildPath 'BUILD_ID') -Raw).Trim() -ne $release.buildId){throw 'Build ID mismatch.'}
if(Get-ChildItem -LiteralPath $payload -Recurse -File|Where-Object{$_.Name -match '\.(db|sqlite)(-wal|-shm|-journal)?$'}){throw 'A public package must not contain user databases.'}
$node=Join-Path $installRoot 'node.exe'
$instance=Join-Path $dataRoot 'server-instance.json'
if(Test-Path -LiteralPath $instance){
  $state=Get-Content -LiteralPath $instance -Raw|ConvertFrom-Json
  $running=Get-CimInstance Win32_Process -Filter ('ProcessId='+$state.pid) -ErrorAction SilentlyContinue
  $cli=Join-Path $appRoot 'node_modules\next\dist\bin\next'
  if($running -and $running.ExecutablePath -eq $node -and $running.CommandLine.Contains($cli)){Stop-Process -Id $running.ProcessId -Force;Start-Sleep -Milliseconds 500}
}
New-Item -ItemType Directory -Force -Path $appRoot,(Join-Path $dataRoot 'files')|Out-Null
$db=Join-Path $appRoot 'prisma\dev.db'
$retained=Join-Path $dataRoot 'dev.db'
if(-not (Test-Path -LiteralPath $db) -and (Test-Path -LiteralPath $retained)){New-Item -ItemType Directory -Force -Path (Split-Path $db)|Out-Null;Copy-Item -LiteralPath $retained -Destination $db}
if(Test-Path -LiteralPath $db){
  $backup=Join-Path $dataRoot ('backups\before-install-'+(Get-Date -Format 'yyyyMMdd-HHmmss'))
  New-Item -ItemType Directory -Force -Path $backup|Out-Null
  foreach($suffix in @('','-wal','-shm')){if(Test-Path -LiteralPath ($db+$suffix)){Copy-Item -LiteralPath ($db+$suffix) -Destination (Join-Path $backup ('dev.db'+$suffix))}}
}
& robocopy $payload $appRoot /E /XJ /MT:8 /R:1 /W:1 /NFL /NDL /NJH /NJS /NC /NS|Out-Null
if($LASTEXITCODE -ge 8){throw 'Classroom application copy failed.'}
$payloadRuntime=Join-Path $PSScriptRoot 'runtime\node.exe'
if(-not (Test-Path -LiteralPath $node) -or (Get-FileHash -LiteralPath $payloadRuntime -Algorithm SHA256).Hash -ne (Get-FileHash -LiteralPath $node -Algorithm SHA256).Hash){Copy-Item -LiteralPath $payloadRuntime -Destination $node -Force}
$modules=Join-Path $appRoot 'node_modules'
$links=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'junctions.json') -Raw|ConvertFrom-Json
foreach($entry in $links){
  $link=Join-Path $modules $entry.link;$target=Join-Path $modules $entry.target
  if(-not (Test-Path -LiteralPath $target)){throw 'Required module target is missing.'}
  if(Test-Path -LiteralPath $link){
    $item=Get-Item -LiteralPath $link -Force
    if($item.LinkType -eq 'Junction'){continue}
    if($item.PSIsContainer -and -not (Get-ChildItem -LiteralPath $link -Force|Select-Object -First 1)){Remove-Item -LiteralPath $link -Force}else{throw 'Unexpected existing module directory. User files were preserved.'}
  }
  New-Item -ItemType Junction -Path $link -Target $target|Out-Null
}
$secret=Join-Path $dataRoot 'auth-secret.txt'
if(-not (Test-Path -LiteralPath $secret)){
  $bytes=New-Object byte[] 48;$rng=[Security.Cryptography.RandomNumberGenerator]::Create()
  try{$rng.GetBytes($bytes)}finally{$rng.Dispose()}
  [IO.File]::WriteAllText($secret,[Convert]::ToBase64String($bytes))
}
$env:CALIBRA_DATA_DIR=Join-Path $dataRoot 'files'
& $node (Join-Path $appRoot 'scripts\initialize-local-data.cjs')
if($LASTEXITCODE -ne 0){throw 'Classroom database initialization failed.'}
foreach($file in @('Start-CALIBRA.ps1','Start-CALIBRA.vbs')){Copy-Item -LiteralPath (Join-Path $PSScriptRoot $file) -Destination (Join-Path $dataRoot $file) -Force}
$manifest=Join-Path $dataRoot 'active-release.json'
$temp=$manifest+'.tmp';Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'active-release.json') -Destination $temp -Force
Move-Item -LiteralPath $temp -Destination $manifest -Force
if(-not $NoShortcuts){
$shell=New-Object -ComObject WScript.Shell
$shortcut=$shell.CreateShortcut((Join-Path ([Environment]::GetFolderPath('Desktop')) ($appName+'.lnk')))
$shortcut.TargetPath=Join-Path $env:SystemRoot 'System32\wscript.exe'
$shortcut.Arguments='"'+(Join-Path $dataRoot 'Start-CALIBRA.vbs')+'"'
$shortcut.WorkingDirectory=$appRoot;$shortcut.Description=$appName+' v'+$release.version
foreach($oldName in @('CALIBRA.lnk','CALIBRA 개인용.lnk','CALIBRA 다인·교육용.lnk')){
 $oldPath=Join-Path ([Environment]::GetFolderPath('Desktop')) $oldName
 if(Test-Path -LiteralPath $oldPath){$old=$shell.CreateShortcut($oldPath);if($old.Arguments -eq $shortcut.Arguments -and $old.TargetPath -eq $shortcut.TargetPath){Remove-Item -LiteralPath $oldPath -Force}}
}
$shortcut.IconLocation=Join-Path $appRoot 'public\calibra.ico';$shortcut.Save()
}
if(-not $NoLaunch){Start-Process -FilePath (Join-Path $env:SystemRoot 'System32\wscript.exe') -ArgumentList ('"'+(Join-Path $dataRoot 'Start-CALIBRA.vbs')+'"') -WindowStyle Hidden}
exit 0
