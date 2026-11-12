param(
 [Parameter(Mandatory=$true)][string]$Tag,
 [Parameter(Mandatory=$true)][string]$Commit,
 [Parameter(Mandatory=$true)][string]$Title,
 [Parameter(Mandatory=$true)][string]$NotesFile,
 [Parameter(Mandatory=$true)][string[]]$Files,
 [switch]$Latest,
 [switch]$KeepDraft
)
$ErrorActionPreference='Stop'
$raw="protocol=https`nhost=github.com`n`n"|git credential fill
$credential=@{};foreach($line in $raw){if($line -match '^([^=]+)=(.*)$'){$credential[$Matches[1]]=$Matches[2]}}
if(-not $credential.password){throw 'GitHub authentication is required.'}
$headers=@{Authorization=('Bearer '+$credential.password);'User-Agent'='CALIBRA-Edition-Release';Accept='application/vnd.github+json'}
$api='https://api.github.com/repos/kenter0705/alibra-instrument-calibration'
foreach($file in $Files){if(-not (Test-Path -LiteralPath $file -PathType Leaf)){throw ('Missing release asset: '+$file)}}
$payload=@{tag_name=$Tag;target_commitish=$Commit;name=$Title;body=[IO.File]::ReadAllText((Resolve-Path -LiteralPath $NotesFile).Path);draft=$true;prerelease=$false}|ConvertTo-Json
$release=Invoke-RestMethod -Method Post -Uri ($api+'/releases') -Headers $headers -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($payload))
Write-Output ('Created release draft '+$Tag)
$client=[Net.Http.HttpClient]::new();$client.Timeout=[TimeSpan]::FromMinutes(30)
$client.DefaultRequestHeaders.Authorization=[Net.Http.Headers.AuthenticationHeaderValue]::new('Bearer',$credential.password)
$client.DefaultRequestHeaders.UserAgent.ParseAdd('CALIBRA-Edition-Release')
try{
 foreach($file in $Files){
  $name=Split-Path $file -Leaf;$stream=[IO.File]::OpenRead((Resolve-Path -LiteralPath $file).Path);$content=[Net.Http.StreamContent]::new($stream)
  $content.Headers.ContentType=[Net.Http.Headers.MediaTypeHeaderValue]::new('application/octet-stream')
  try{
   $url='https://uploads.github.com/repos/kenter0705/alibra-instrument-calibration/releases/'+$release.id+'/assets?name='+[Uri]::EscapeDataString($name)
   $response=$client.PostAsync($url,$content).GetAwaiter().GetResult()
   if(-not $response.IsSuccessStatusCode){throw ('Asset upload failed: '+$name+' HTTP '+[int]$response.StatusCode)}
   $asset=$response.Content.ReadAsStringAsync().GetAwaiter().GetResult()|ConvertFrom-Json
   if($asset.size -ne (Get-Item -LiteralPath $file).Length){throw 'Uploaded asset size mismatch.'}
   $digest='sha256:'+(Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant()
   if($asset.digest -and $asset.digest -ne $digest){throw 'Uploaded SHA-256 mismatch.'}
   Write-Output ('Uploaded and verified '+$name)
  }finally{$content.Dispose();$stream.Dispose()}
 }
}finally{$client.Dispose()}
$latestValue=if($Latest){'true'}else{'false'}
@{id=$release.id;tag=$Tag;latest=$latestValue}|ConvertTo-Json|Set-Content -LiteralPath (Join-Path (Split-Path -Parent $PSScriptRoot) ('dist/release-'+$Tag+'.json')) -Encoding UTF8
if($KeepDraft){Write-Output ('Uploaded verified draft '+$Tag+' ID '+$release.id);exit 0}
$body=@{draft=$false;make_latest=$latestValue}|ConvertTo-Json
$published=Invoke-RestMethod -Method Patch -Uri ($api+'/releases/'+$release.id) -Headers $headers -ContentType 'application/json' -Body $body
Write-Output ('Published '+$published.html_url)
