# 三省六部看板 · 打包脚本（PowerShell 5.1）
# 不带参数就是真打包（这是打包脚本，不是安装脚本），产物落 D:\DSH\skills\store。
# pnpm 必须用 winget 那份 10.33.4：profile 是 pnpm10 布局，用 11 会 ERR_PNPM_UNEXPECTED_STORE。

param()

$ErrorActionPreference = 'Stop'

$PkgDir = 'D:\DSH\projects\orchestra\plugin'
$Store  = 'D:\DSH\skills\store'

function Say([string]$s) { Write-Host $s }

function Find-Pnpm {
  $winget = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages\pnpm.pnpm_Microsoft.Winget.Source_8wekyb3d8bbwe\pnpm.exe'
  if (Test-Path -LiteralPath $winget) { return $winget }
  $c = Get-Command pnpm -ErrorAction SilentlyContinue
  if ($null -ne $c) { return $c.Source }
  return $null
}

function Read-Json([string]$path) {
  $raw = [System.IO.File]::ReadAllText($path)
  $raw = $raw.TrimStart([char]0xFEFF)
  return ($raw | ConvertFrom-Json)
}

Say '=== 三省六部看板 · 打包 ==='

if (-not (Test-Path -LiteralPath $PkgDir)) { throw ('插件源码目录不存在：' + $PkgDir) }
$pkgPath = Join-Path $PkgDir 'package.json'
if (-not (Test-Path -LiteralPath $pkgPath)) { throw ('package.json 不存在：' + $pkgPath) }

$pkg = Read-Json $pkgPath
Say ('包名：' + $pkg.name)
Say ('版本：' + $pkg.version)
Say ('源码：' + $PkgDir)
Say ('产物目录：' + $Store)

$pnpm = Find-Pnpm
if ($null -eq $pnpm) {
  throw '找不到 pnpm 10，别用 pnpm 11 打包（会 ERR_PNPM_UNEXPECTED_STORE）'
}
Say ('pnpm：' + $pnpm)

if (-not (Test-Path -LiteralPath $Store)) {
  Say ('产物目录不存在，创建：' + $Store)
  New-Item -ItemType Directory -Force -Path $Store | Out-Null
}

Say ''
Say '开始打包（pnpm pack）…'
& $pnpm -C $PkgDir pack --pack-destination $Store
if ($LASTEXITCODE -ne 0) { throw ('pnpm pack 失败，exit ' + $LASTEXITCODE) }

$tgzName = $pkg.name + '-' + $pkg.version + '.tgz'
$tgzPath = Join-Path $Store $tgzName
if (-not (Test-Path -LiteralPath $tgzPath)) {
  $hit = Get-ChildItem -LiteralPath $Store -Filter '*.tgz' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if ($null -eq $hit) { throw ('打包命令成功但没在 ' + $Store + ' 找到 tgz') }
  $tgzPath = $hit.FullName
}

$file = Get-Item -LiteralPath $tgzPath
$hash = Get-FileHash -LiteralPath $tgzPath -Algorithm SHA256

Say ''
Say '=== 完成 ==='
Say ('文件：' + $file.FullName)
Say ('大小：' + $file.Length + ' 字节')
Say ('SHA256：' + $hash.Hash)
Say ''
Say '安装方式（在没有 pnpm 的机器上）：解包后把 package.json / cordis.patch.yml / lib\ 复制到'
Say ('  ' + 'D:\DSH\.dsh\profiles\desktop\node_modules\' + $pkg.name + '，再往 profile package.json 的 dsh.profile.bundles 追一行 ' + $pkg.name)
