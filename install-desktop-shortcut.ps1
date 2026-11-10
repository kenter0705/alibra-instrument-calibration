$ErrorActionPreference = 'Stop'
$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$desktop = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop 'CALIBRA.lnk'
$launcher = Join-Path $projectPath 'start-calibra-hidden.vbs'
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = Join-Path $env:SystemRoot 'System32\wscript.exe'
$shortcut.Arguments = "`"$launcher`""
$shortcut.WorkingDirectory = $projectPath
$shortcut.Description = '계측기 검교정 이력관리 시스템 실행'
$shortcut.IconLocation = Join-Path $projectPath 'public\calibra.ico'
$shortcut.Save()
Write-Output "바탕화면 바로가기를 만들었습니다: $shortcutPath"
