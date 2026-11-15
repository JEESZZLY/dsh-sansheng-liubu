param([switch]$Apply, [switch]$Rollback, [switch]$NoLink)

# 三省六部看板 · 安装/回滚脚本（PowerShell 5.1）
# 默认预演：只打印将要执行的动作与目标路径，不写盘；加 -Apply 才动真格。
# pnpm 必须用 winget 那份 10.33.4：profile 是 pnpm10 布局，用 11 会 ERR_PNPM_UNEXPECTED_STORE。
# node-linker=isolated 与 confirm-modules-purge=true 必须显式传，
# 否则 pnpm 会把 495MB 的 node_modules 整体重排成 hoisted。

$ErrorActionPreference = 'Stop'

$Profile    = 'D:\DSH\.dsh\profiles\desktop'
$PkgDir     = 'D:\DSH\projects\orchestra\plugin'
$Name       = 'dsh-sansheng-liubu'
$Manual     = Join-Path $Profile ('node_modules\' + $Name)
$ProfilePkg = Join-Path $Profile 'package.json'
$Stamp      = Get-Date -Format 'yyyyMMdd-HHmmss'

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

function Write-Json([string]$path, $obj) {
  $json = $obj | ConvertTo-Json -Depth 20
  $enc = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($path, $json + "`r`n", $enc)
}

function Backup-File([string]$path, [string]$tag) {
  $dest = $path + '.bak-' + $tag + '-' + $Stamp
  Copy-Item -LiteralPath $path -Destination $dest -Force
  return $dest
}

function Get-BundleList($obj) {
  if ($obj.dsh -and $obj.dsh.profile -and $obj.dsh.profile.bundles) { return @($obj.dsh.profile.bundles) }
  return @()
}

function Add-Bundle([string]$path, [bool]$dry) {
  $obj  = Read-Json $path
  $list = Get-BundleList $obj
  if ($list -contains $Name) { Say ('    [跳过] dsh.profile.bundles 已含 ' + $Name); return }
  if ($dry) {
    Say ('    [预演] 在 dsh.profile.bundles 追加 "' + $Name + '"')
    Say ('    [预演] 写前备份：' + $path + '.bak-sl-bundles-' + $Stamp)
    return
  }
  $bak = Backup-File $path 'sl-bundles'
  Say ('    已备份：' + $bak)
  if (-not $obj.dsh) { $obj | Add-Member -NotePropertyName dsh -NotePropertyValue (New-Object psobject) }
  if (-not $obj.dsh.profile) { $obj.dsh | Add-Member -NotePropertyName profile -NotePropertyValue (New-Object psobject) }
  $obj.dsh.profile | Add-Member -NotePropertyName bundles -NotePropertyValue (@($list) + $Name) -Force
  Write-Json $path $obj
  Say ('    已写入 bundles：' + $Name)
}

function Remove-Bundle([string]$path, [bool]$dry) {
  $obj  = Read-Json $path
  $list = Get-BundleList $obj
  if (-not ($list -contains $Name)) { Say ('    [跳过] dsh.profile.bundles 不含 ' + $Name); return }
  $rest = @($list | Where-Object { $_ -ne $Name })
  if ($dry) {
    Say ('    [预演] 从 dsh.profile.bundles 移除 "' + $Name + '"，剩 ' + $rest.Count + ' 条')
    Say ('    [预演] 写前备份：' + $path + '.bak-sl-bundles-' + $Stamp)
    return
  }
  $bak = Backup-File $path 'sl-bundles'
  Say ('    已备份：' + $bak)
  $obj.dsh.profile | Add-Member -NotePropertyName bundles -NotePropertyValue $rest -Force
  Write-Json $path $obj
  Say ('    已移除 bundles：' + $Name)
}

Say '=== 三省六部看板 · 安装脚本（默认预演）==='
Say ('包名：' + $Name)
Say ('profile：' + $Profile)
Say ('源码：' + $PkgDir)
Say ('手塞副本：' + $Manual)

if (-not (Test-Path -LiteralPath $ProfilePkg)) { throw ('profile package.json 不存在：' + $ProfilePkg) }
if (-not (Test-Path -LiteralPath $PkgDir)) { throw ('插件源码目录不存在：' + $PkgDir) }

$pnpm = Find-Pnpm
if ($null -eq $pnpm) { Say 'pnpm：未找到（winget 10.33.4 与 PATH 都没有）' } else { Say ('pnpm：' + $pnpm) }

$exists = Test-Path -LiteralPath $Manual
$linkType = ''
$linkTarget = ''
if ($exists) {
  $it = Get-Item -LiteralPath $Manual -Force
  $linkType = [string]$it.LinkType
  if ($it.Target) { $linkTarget = (@($it.Target) -join ';') }
}
$isLink = ($linkType -ne '')
if (-not $exists) {
  Say '现态：node_modules 下还没有本包'
} else {
  Say ('现态：LinkType=' + $linkType + ' Target=' + $linkTarget)
}

$dry = -not $Apply

if ($Rollback) {
  Say ''
  Say '=== 回滚（移除 profile 里的安装痕迹）==='
  Say '① dsh.profile.bundles 移除（幂等）'
  Remove-Bundle $ProfilePkg $dry
  Say ''
  Say '② 删除 node_modules 下的目录'
  if (-not $exists) {
    Say '    [跳过] 目录不存在'
  } elseif ($dry) {
    Say ('    [预演] Remove-Item -Recurse -Force ' + $Manual)
  } else {
    Remove-Item -LiteralPath $Manual -Recurse -Force
    Say ('    已删除：' + $Manual)
  }
  Say ''
  Say '③ 若之前是 pnpm 装的，另跑（必须 pnpm 10）：'
  if ($null -eq $pnpm) {
    Say ('  pnpm -C ' + $Profile + ' remove ' + $Name)
  } else {
    Say ('  ' + $pnpm + ' -C ' + $Profile + ' remove ' + $Name)
  }
  Say '④ 重启桌面端后确认「三省六部」标签消失。'
  if ($dry) { Say '（以上均为预演，未写任何文件；加 -Apply 才真跑。）' }
  return
}

if ($dry) { Say ''; Say '=== 预演（加 -Apply 才写盘）===' } else { Say ''; Say '=== 执行（-Apply）===' }
if ($NoLink) { Say '模式：-NoLink（跳过 pnpm，手工复制）' } else { Say '模式：pnpm add file:（isolated 布局）' }

Say ''
Say '① 备份 profile\package.json'
if ($dry) {
  Say ('    [预演] Copy-Item ' + $ProfilePkg + ' -> ' + $ProfilePkg + '.bak-sl-' + $Stamp)
} else {
  $bak0 = Backup-File $ProfilePkg 'sl'
  Say ('    已备份：' + $bak0)
}

Say ''
Say '② 清掉手塞副本（存在且非链接时）'
if (-not $exists) {
  Say '    [跳过] 目录不存在'
} elseif ($isLink) {
  Say ('    [跳过] 已是链接 -> ' + $linkTarget)
} elseif ($dry) {
  Say ('    [预演] Remove-Item -Recurse -Force ' + $Manual)
} else {
  Remove-Item -LiteralPath $Manual -Recurse -Force
  Say '    已清手塞副本'
}

Say ''
if ($NoLink) {
  if ($isLink) { throw '-NoLink 与现有链接冲突：这个目录是链接（多半是 pnpm 装的），先 -Rollback -Apply，别把文件复制回源码目录' }
  Say '③ 复制 package.json / cordis.patch.yml / lib\ 到 node_modules'
  if ($dry) {
    Say ('    [预演] New-Item -ItemType Directory -Force ' + $Manual)
    Say ('    [预演] Copy-Item ' + $PkgDir + '\package.json -Destination ' + $Manual)
    Say ('    [预演] Copy-Item ' + $PkgDir + '\cordis.patch.yml -Destination ' + $Manual)
    Say ('    [预演] Copy-Item ' + $PkgDir + '\lib -Destination ' + $Manual + ' -Recurse')
  } else {
    New-Item -ItemType Directory -Force -Path $Manual | Out-Null
    Copy-Item -LiteralPath (Join-Path $PkgDir 'package.json') -Destination $Manual -Force
    Copy-Item -LiteralPath (Join-Path $PkgDir 'cordis.patch.yml') -Destination $Manual -Force
    Copy-Item -LiteralPath (Join-Path $PkgDir 'lib') -Destination $Manual -Recurse -Force
    Say ('    已复制到：' + $Manual)
  }
} else {
  Say '③ pnpm add'
  $alreadyLinked = $false
  if ($isLink -and -not [string]::IsNullOrEmpty($linkTarget)) {
    if ($linkTarget.ToLower().Contains($PkgDir.ToLower())) { $alreadyLinked = $true }
  }
  if ($alreadyLinked) {
    Say ('    [跳过] 已链接到 ' + $PkgDir + '（幂等）')
  } elseif ($null -eq $pnpm) {
    throw '找不到 pnpm 10，别用 pnpm 11 装（会 ERR_PNPM_UNEXPECTED_STORE）'
  } else {
    $pnpmArgs = @(
      '-C', $Profile,
      'add', ('file:' + $PkgDir),
      '--prefer-offline',
      '--config.node-linker=isolated',
      '--config.confirm-modules-purge=true'
    )
    if ($dry) {
      Say ('    [预演] ' + $pnpm + ' ' + ($pnpmArgs -join ' '))
    } else {
      & $pnpm @pnpmArgs
      if ($LASTEXITCODE -ne 0) { throw ('pnpm add 失败，exit ' + $LASTEXITCODE) }
      Say '    pnpm add 完成'
    }
  }
}

Say ''
Say '④ dsh.profile.bundles 追加（幂等，写前备份）'
Add-Bundle $ProfilePkg $dry

Say ''
Say '⑤ 完成。重启桌面端后打开任一会话 → 会话页「三省六部」标签验证。'
if ($dry) { Say '（以上均为预演，未写任何文件；加 -Apply 才真跑。）' }
