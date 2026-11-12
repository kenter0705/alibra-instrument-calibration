param([Parameter(Mandatory=$true)][ValidateSet('personal','classroom')][string]$Edition)
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$editions=Get-Content -LiteralPath (Join-Path $root 'installer/editions.json') -Raw|ConvertFrom-Json
$settings=$editions.$Edition
$zip=Join-Path $root ('public/downloads/'+$settings.assetPrefix+'-Setup-v'+$settings.version+'-20261112.zip')
$expected=([IO.File]::ReadAllText($zip+'.sha256').Trim() -split '\s+')[0]
if((Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expected.ToLowerInvariant()){throw 'Verified ZIP checksum mismatch.'}
$stage=Join-Path $root ('dist/apply-'+$Edition+'-'+$settings.version)
New-Item -ItemType Directory -Force -Path $stage|Out-Null
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive=[IO.Compression.ZipFile]::OpenRead($zip)
try{
 foreach($entry in $archive.Entries){
  if($entry.FullName.StartsWith('app/node_modules/')){continue}
  $destination=[IO.Path]::GetFullPath((Join-Path $stage $entry.FullName))
  if(-not $destination.StartsWith([IO.Path]::GetFullPath($stage)+'\',[StringComparison]::OrdinalIgnoreCase)){throw 'Archive entry escaped application staging.'}
  if($entry.FullName.EndsWith('/')){New-Item -ItemType Directory -Force -Path $destination|Out-Null;continue}
  New-Item -ItemType Directory -Force -Path (Split-Path $destination)|Out-Null
  [IO.Compression.ZipFileExtensions]::ExtractToFile($entry,$destination,$true)
 }
}finally{$archive.Dispose()}
$directory=if($Edition -eq 'classroom'){'CALIBRA-Classroom'}else{'CALIBRA'}
$modules=Join-Path $env:LOCALAPPDATA ('Programs/'+$directory+'/app/node_modules')
if($Edition -eq 'classroom' -and -not ((Test-Path -LiteralPath (Join-Path $modules 'next/package.json')) -and (Test-Path -LiteralPath (Join-Path $env:LOCALAPPDATA 'CALIBRA-Classroom/active-release.json')))){
 # Copy dependency files into an independent physical folder; never share the
 # personal app's module directory or user database with the Multi installation.
 $existing=Join-Path $env:LOCALAPPDATA 'Programs/CALIBRA/app/node_modules'
 if(-not (Test-Path -LiteralPath $existing)){throw 'The verified baseline dependency installation is missing.'}
 New-Item -ItemType Directory -Force -Path $modules|Out-Null
 & robocopy $existing $modules /E /XJ /MT:8 /R:1 /W:1 /NFL /NDL /NJH /NJS /NC /NS|Out-Null
 if($LASTEXITCODE -ge 8){throw 'Independent Multi dependency copy failed.'}
}
if(-not (Test-Path -LiteralPath $modules)){throw 'Existing verified dependencies are required for this code-preserving local update.'}
$script=Join-Path $stage '설치하기.ps1'
& $script -NoLaunch
if($LASTEXITCODE -ne 0){throw 'Edition installation did not complete.'}
Write-Output ('Installed '+$settings.name+' v'+$settings.version+'; existing database, auth key and uploaded files retained.')
