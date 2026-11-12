param([Parameter(Mandatory=$true)][string]$SourceRoot)
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$source=(Resolve-Path -LiteralPath $SourceRoot).Path
$package=Get-Content -LiteralPath (Join-Path $source 'package.json') -Raw|ConvertFrom-Json
$edition=[string]$package.calibraEdition
if($edition -notin @('personal','classroom')){throw 'An explicit app edition is required.'}
$assetName=if($edition -eq 'classroom'){'CALIBRA-Classroom'}else{'CALIBRA-Personal'}
$appName=if($edition -eq 'classroom'){'CALIBRA 다인·교육용'}else{'CALIBRA 개인용'}
$directory=if($edition -eq 'classroom'){'CALIBRA-Classroom'}else{'CALIBRA'}
$port=if($edition -eq 'classroom'){4000}else{3000}
$version=$package.version
$build=Join-Path $source '.calibra-build'
$id=(Get-Content -LiteralPath (Join-Path $build 'BUILD_ID') -Raw).Trim()
$releaseDir=('.calibra-releases\'+$edition+'-')+$version+'-'+(Get-Date -Format 'yyyyMMdd')
$base=Join-Path $root 'public\downloads\CALIBRA-Setup-v0.1.3-20261111.zip'
$output=Join-Path $root (('public\downloads\'+$assetName+'-Setup-v')+$version+'-'+(Get-Date -Format 'yyyyMMdd')+'.zip')
if(Test-Path -LiteralPath $output){throw 'The output already exists; published versions must not be overwritten.'}
$scratch=Join-Path $root ('dist\'+$edition+'-package-metadata');New-Item -ItemType Directory -Force -Path $scratch|Out-Null
@{edition=$edition;version=$version;releaseDate=(Get-Date -Format 'yyyy-MM-dd');buildId=$id;buildDir=$releaseDir}|ConvertTo-Json|Set-Content -LiteralPath (Join-Path $scratch 'active-release.json') -Encoding UTF8
@"
$appName v$version
이 설치 파일은 $edition 앱 전용입니다. 압축을 풀고 SETUP.exe를 실행하세요.
바로가기: $appName / 기본 주소: http://localhost:$port/
설치: %LOCALAPPDATA%\Programs\$directory
자료: %LOCALAPPDATA%\$directory
개인용과 다인·교육용은 설치 폴더, 자료, 계정, 바로가기, 포트를 따로 사용합니다.
기존 앱의 원본 DB와 첨부자료는 보존합니다. 다른 종류 앱의 자료를 자동 복사하지 않습니다.
최초 설치 PC에서 관리자 이메일과 비밀번호를 직접 등록합니다. 기존 계정은 그대로 유지합니다.
다인용만: 관리자 로그인 후 다수 사용하기에서 공유를 저장하고 해당 앱 바로가기를 다시 실행합니다.
교육생은 같은 네트워크에서 서버 IP:4000으로 접속하여 승인된 본인 계정으로 로그인합니다.
공동 데이터실은 원본 보존 / 불러오기 / 사본 수정 / 다른 이름으로 저장을 지원합니다.
게시글 내용은 Excel 또는 PDF로 하나씩, 선택하여, 또는 일괄 내려받을 수 있습니다.
25명 HTTP 동시 사용 시험은 통과했습니다. 실제 교실 PC의 네트워크와 방화벽 접속은 수업 전에 점검하세요.
공유 폴더의 DB를 여러 PC에서 직접 열지 말고, 다인용 서버 PC를 켠 채 웹 주소로 접속합니다.
"@|Set-Content -LiteralPath (Join-Path $scratch '설치 안내.txt') -Encoding UTF8
Add-Type -AssemblyName System.IO.Compression.FileSystem
Copy-Item -LiteralPath $base -Destination $output
$archive=[IO.Compression.ZipFile]::Open($output,[IO.Compression.ZipArchiveMode]::Update)
try{
  for($i=$archive.Entries.Count-1;$i -ge 0;$i--){
    $name=$archive.Entries[$i].FullName
    if(($name.StartsWith('app/') -and -not $name.StartsWith('app/node_modules/')) -or $name -in @('설치하기.ps1','Start-CALIBRA.ps1','Start-CALIBRA.vbs','Update-CALIBRA.ps1','Uninstall-CALIBRA.ps1','Uninstall-CALIBRA.vbs','설치 안내.txt')){$archive.Entries[$i].Delete()}
  }
  function Add-File([string]$file,[string]$name){
    $old=$archive.GetEntry($name);if($old){$old.Delete()}
    [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive,$file,$name,[IO.Compression.CompressionLevel]::Optimal)|Out-Null
  }
  function Add-Tree([string]$folder,[string]$prefix,[scriptblock]$include){
    Get-ChildItem -LiteralPath $folder -Recurse -File|Where-Object{& $include $_}|ForEach-Object{Add-File $_.FullName ($prefix+$_.FullName.Substring($folder.Length+1).Replace('\','/'))}
  }
  Add-Tree (Join-Path $source 'src') 'app/src/' {param($file)$file.Name -notmatch '\.tmp\d+$'}
  Add-Tree (Join-Path $source 'prisma') 'app/prisma/' {param($file)$file.Extension -in @('.prisma','.sql')}
  Add-Tree (Join-Path $source 'public') 'app/public/' {param($file)$file.FullName -notmatch '\\(training|downloads)\\' -and $file.Extension -notin @('.zip','.db','.sqlite')}
  Add-Tree $build ('app/'+$releaseDir.Replace('\','/')+'/') {param($file)$file.FullName.Substring($build.Length+1) -notmatch '^(cache|types|diagnostics|trace|standalone)(\\|$)' -and $file.Name -notmatch '\.tmp\d+$'}
  foreach($file in @('package.json','pnpm-lock.yaml','next.config.ts','tsconfig.json','postcss.config.mjs')){Add-File (Join-Path $source $file) ('app/'+$file)}
  Add-File (Join-Path $source 'scripts\initialize-local-data.cjs') 'app/scripts/initialize-local-data.cjs'
  Add-File (Join-Path $PSScriptRoot 'Install-Edition.ps1') '설치하기.ps1'
  Add-File (Join-Path $PSScriptRoot ('Start-CALIBRA-'+$(if($edition -eq 'classroom'){'Classroom'}else{'Personal'})+'.ps1')) 'Start-CALIBRA.ps1'
  Add-File (Join-Path $PSScriptRoot 'Start-CALIBRA.vbs') 'Start-CALIBRA.vbs'
  Add-File (Join-Path $scratch 'active-release.json') 'active-release.json'
  Add-File (Join-Path $scratch '설치 안내.txt') '설치 안내.txt'
}finally{$archive.Dispose()}
$hash=(Get-FileHash -LiteralPath $output -Algorithm SHA256).Hash.ToLowerInvariant()
[IO.File]::WriteAllText($output+'.sha256',$hash+'  '+(Split-Path $output -Leaf)+"`n")
Write-Output ('Built '+$output)
