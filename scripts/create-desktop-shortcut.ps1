$ErrorActionPreference = 'Stop'
$product = 'QoneHome智能家电门店营销系统'
$exe = Join-Path $PSScriptRoot 'QoneHome.exe'
if (-not (Test-Path $exe)) {
  Write-Host 'ERROR: 同目录下找不到 QoneHome.exe'
  exit 1
}
$shell = New-Object -ComObject WScript.Shell
$desktop = [Environment]::GetFolderPath('Desktop')
$lnk = Join-Path $desktop "$product.lnk"
$s = $shell.CreateShortcut($lnk)
$s.TargetPath = $exe
$s.WorkingDirectory = $PSScriptRoot
$s.IconLocation = "$exe,0"
$s.Description = $product
$s.Save()
Write-Host "桌面快捷方式已创建: $lnk"

$programs = [Environment]::GetFolderPath('Programs')
$menuDir = Join-Path $programs $product
New-Item -ItemType Directory -Path $menuDir -Force | Out-Null
$m = $shell.CreateShortcut((Join-Path $menuDir "$product.lnk"))
$m.TargetPath = $exe
$m.WorkingDirectory = $PSScriptRoot
$m.IconLocation = "$exe,0"
$m.Save()
Write-Host '开始菜单快捷方式已创建'
