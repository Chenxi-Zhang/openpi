#!/usr/bin/env bash
# pack-win.sh — 在 WSL 中打包 Windows portable exe
#
# 流程: WSL 编译 → 复制到 Windows 本地 → Windows npm ci + electron-builder
#
# 用法: ./scripts/pack-win.sh [选项]
#   --skip-build    跳过 npm run build (已编译过时使用)
#   --run           打包完成后启动应用
#
# 前提: Windows 侧已安装 Node.js 22+
# 产物: release/<version>/OpenPi <version>.exe (portable)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
VERSION="$(node -e "console.log(require('$PROJECT_DIR/package.json').version)")"
UNC_PATH="$(wslpath -w "$PROJECT_DIR")"
WIN_TEMP="C:\\temp\\openpi-build"

# ── 参数解析 ──────────────────────────────────────────────────────────────────

SKIP_BUILD=false

for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=true ;;
    -h|--help)
      echo "用法: $0 [--skip-build] [--run]"
      echo "在 WSL 中编译, 然后调用 Windows PowerShell 打包 Windows portable exe."
      echo "  --run  打包完成后启动应用"
      exit 0
      ;;
    *) echo "未知参数: $arg"; exit 1 ;;
  esac
done

echo "版本:     $VERSION"
echo "WSL:      $PROJECT_DIR"
echo "Windows:  $WIN_TEMP"
echo ""

# ── Step 1: WSL 编译 ──────────────────────────────────────────────────────────

if [[ "$SKIP_BUILD" == "false" ]]; then
  echo "=== Step 1/3: WSL 编译 (electron-vite build) ==="
  npm run build --prefix "$PROJECT_DIR"
else
  echo "=== Step 1/3: 跳过编译 (--skip-build) ==="
fi

# ── Step 2: 复制到 Windows 本地 ───────────────────────────────────────────────

echo ""
echo "=== Step 2/3: 复制到 Windows 临时目录 ==="

# 只复制打包所需的文件, 不复制 node_modules (Windows 侧 npm ci 自己装)
powershell.exe -NoProfile -Command "
  if (Test-Path '$WIN_TEMP') { Remove-Item -Recurse -Force '$WIN_TEMP' };
  New-Item -ItemType Directory -Path '$WIN_TEMP' -Force | Out-Null;
  Copy-Item -Recurse '$UNC_PATH\\out' '$WIN_TEMP\\out';
  Copy-Item '$UNC_PATH\\package.json' '$WIN_TEMP\\';
  Copy-Item '$UNC_PATH\\package-lock.json' '$WIN_TEMP\\';
  Copy-Item '$UNC_PATH\\electron-builder.json' '$WIN_TEMP\\';
  Copy-Item -Recurse '$UNC_PATH\\icons' '$WIN_TEMP\\icons';
  Copy-Item '$UNC_PATH\\CHANGELOG.md' '$WIN_TEMP\\';
  Write-Host 'Done.';
"

# ── Step 3: Windows npm ci + 打包 ────────────────────────────────────────────

echo ""
echo "=== Step 3/3: Windows npm ci + electron-builder ==="

# 关键: 读取 electron-builder.json, 合并 signAndEditExecutable=false,
# 写入 build-config.json 作为覆盖配置, 保留所有原始设置 (asarUnpack, files 等)
powershell.exe -NoProfile -Command "
  Set-Location '$WIN_TEMP';

  # 读取原始 electron-builder.json 并合并禁用签名
  \$config = Get-Content 'electron-builder.json' -Raw | ConvertFrom-Json;
  if (-not \$config.win) { \$config | Add-Member -NotePropertyName 'win' -NotePropertyValue @{} };
  \$config.win | Add-Member -NotePropertyName 'signAndEditExecutable' -NotePropertyValue \$false -Force;
  \$config | ConvertTo-Json -Depth 10 | Set-Content 'build-config.json' -Encoding utf8;
  Write-Host 'Config: merged electron-builder.json + signAndEditExecutable=false';

  Write-Host '[1/2] npm ci (安装 Windows native 模块)...';
  # --ignore-scripts 跳过 prepare 脚本 (git config hooks 在非 git 目录会失败)
  # 之后手动执行 postinstall 来编译 better-sqlite3
  npm ci --ignore-scripts 2>&1 | Select-Object -Last 3;
  if (\$LASTEXITCODE -ne 0) { Write-Host 'npm ci FAILED'; exit 1 };
  Write-Host '[1b/2] electron-rebuild (编译 better-sqlite3)...';
  npx electron-rebuild -f -w better-sqlite3 2>&1 | Select-Object -Last 3;

  Write-Host '[2/2] electron-builder --win portable...';
  npx electron-builder --win portable --publish never --config build-config.json 2>&1 | Select-Object -Last 15;
  Write-Host 'Done.';
"

# ── 复制产物回 WSL ───────────────────────────────────────────────────────────

echo ""
echo "=== 复制产物 ==="

mkdir -p "$PROJECT_DIR/release/$VERSION"

# electron-builder.json 保留 directories.output = "release/${version}"
# 但 portable 目标输出到 dist/, 实际路径取决于最终打包行为
FOUND=false
for candidate in \
  "/mnt/c/temp/openpi-build/dist/openpi $VERSION.exe" \
  "/mnt/c/temp/openpi-build/release/$VERSION/OpenPi $VERSION.exe"; do
  if [[ -f "$candidate" ]]; then
    cp "$candidate" "$PROJECT_DIR/release/$VERSION/OpenPi $VERSION.exe"
    ls -lh "$PROJECT_DIR/release/$VERSION/OpenPi $VERSION.exe"
    FOUND=true
    break
  fi
done

if [[ "$FOUND" == "false" ]]; then
  echo "⚠ 未找到 .exe 产物, 检查 Windows 临时目录:"
  echo "  $WIN_TEMP\\dist\\"
  echo "  $WIN_TEMP\\release\\$VERSION\\"
  exit 1
fi

echo ""
echo "✅ 打包完成: release/$VERSION/OpenPi $VERSION.exe"

# ── 可选: 启动应用 ─────────────────────────────────────────────────────────────

if [[ "${1:-}" == "--run" || "${2:-}" == "--run" ]]; then
  echo ""
  echo "=== 启动 OpenPi ==="
  WIN_EXE="$WIN_TEMP\\release\\$VERSION\\win-unpacked\\OpenPi.exe"
  powershell.exe -NoProfile -Command "
    Start-Process -FilePath '$WIN_EXE' -ArgumentList '--no-sandbox';
    Write-Host 'Launched.';
  "
fi
