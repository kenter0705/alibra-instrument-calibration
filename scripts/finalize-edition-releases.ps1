$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$raw="protocol=https`nhost=github.com`n`n"|git credential fill
$credential=@{};foreach($line in $raw){if($line -match '^([^=]+)=(.*)$'){$credential[$Matches[1]]=$Matches[2]}}
if(-not $credential.password){throw 'GitHub authentication is required.'}
$headers=@{Authorization=('Bearer '+$credential.password);'User-Agent'='CALIBRA-Finalize';Accept='application/vnd.github+json'}
$api='https://api.github.com/repos/kenter0705/alibra-instrument-calibration'
$editions=Get-Content -LiteralPath (Join-Path $root 'installer/editions.json') -Raw|ConvertFrom-Json
foreach($tag in @($editions.personal.releaseTag,$editions.classroom.releaseTag)){
 $state=Get-Content -LiteralPath (Join-Path $root ('dist/release-'+$tag+'.json')) -Raw|ConvertFrom-Json
 $release=Invoke-RestMethod -Uri ($api+'/releases/'+$state.id) -Headers $headers
 if($release.tag_name -ne $tag -or $release.assets.Count -ne 2){throw 'Release identity or asset count mismatch.'}
 foreach($asset in $release.assets){
  $local=Join-Path $root ('public/downloads/'+$asset.name)
  if($asset.size -ne (Get-Item -LiteralPath $local).Length){throw 'Uploaded asset size mismatch.'}
  $digest='sha256:'+(Get-FileHash -LiteralPath $local -Algorithm SHA256).Hash.ToLowerInvariant()
  if($asset.digest -and $asset.digest -ne $digest){throw 'Uploaded asset hash mismatch.'}
 }
 $body=@{draft=$false;make_latest=[string]$state.latest}|ConvertTo-Json
 $published=Invoke-RestMethod -Method Patch -Uri ($api+'/releases/'+$state.id) -Headers $headers -ContentType 'application/json' -Body $body
 Write-Output ('Published '+$published.html_url)
}
$latest=Invoke-RestMethod -Uri ($api+'/releases/latest') -Headers $headers
if($latest.tag_name -ne $editions.personal.releaseTag){throw 'The personal update channel was changed unexpectedly.'}
Write-Output ('Personal latest remains '+$editions.personal.releaseTag+'; Multi is a separate release channel.')
