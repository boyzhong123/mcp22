#!/usr/bin/env bash
# ============================================================
# Chivox MCP 官网 · 一键构建脚本（裸机 / 虚机 / CI 通用）
# ------------------------------------------------------------
# 用法:
#   bash scripts/build.sh
#
# 产物:
#   dist/                 ← 自包含可部署目录（可整体 scp / tar 给运维）
#   ├── server.js         Next.js standalone 服务入口
#   ├── package.json
#   ├── node_modules/     运行时依赖
#   ├── .next/            构建好的服务器代码
#   ├── public/           静态资源（含 uploads/ 头像目录）
#   ├── .next/static/     被 server.js 注入的客户端静态资源
#   ├── run.sh            启动脚本（运维直接执行）
#   └── ENV.example       环境变量样例（运维按需复制为 .env）
# ============================================================

set -euo pipefail

# ---------- 1. 基本检查 ----------
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "▶ 工作目录: $ROOT"

# Node 版本必须 ≥ 20（Next.js 16 强制）
NODE_MAJOR="$(node -v 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/')"
if [ -z "${NODE_MAJOR:-}" ]; then
  echo "✖ 没有检测到 Node.js，请先安装 Node.js 20.x 或更高版本（推荐 20 LTS）。"
  exit 1
fi
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "✖ 当前 Node.js 版本为 $(node -v)，但本项目要求 ≥ 20。"
  echo "  请用 nvm/asdf/fnm 切到 Node 20，再重试。"
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "✖ 没有检测到 npm，请确认 Node.js 安装完整。"
  exit 1
fi

echo "▶ Node $(node -v) · npm $(npm -v)"

# ---------- 2. 安装依赖 ----------
# 用 npm ci 才能严格依赖 package-lock.json，构建结果才可复现
if [ -d node_modules ] && [ "${1:-}" != "--clean" ]; then
  echo "▶ 已存在 node_modules，使用现有依赖（如需洁净构建：bash scripts/build.sh --clean）"
else
  echo "▶ 清理 node_modules 并执行 npm ci ..."
  rm -rf node_modules
  npm ci --no-audit --no-fund --legacy-peer-deps
fi

# ---------- 3. Next.js 构建 ----------
echo "▶ 执行 npm run build ..."
rm -rf .next dist
npm run build

# ---------- 4. 组装可部署目录 dist/ ----------
echo "▶ 组装 dist/ ..."
mkdir -p dist

# Next standalone 输出
cp -R .next/standalone/. dist/
mkdir -p dist/.next
cp -R .next/static dist/.next/static

# 静态资源
mkdir -p dist/public
cp -R public/. dist/public/

# 让运维有个可直接执行的启动脚本
cat > dist/run.sh <<'RUN_EOF'
#!/usr/bin/env bash
# 生产启动脚本：在 dist/ 目录下执行 `bash run.sh`
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

# 加载同目录下的 .env（如果存在）
if [ -f .env ]; then
  # shellcheck disable=SC2046
  export $(grep -v '^[[:space:]]*#' .env | grep -E '^[A-Za-z_][A-Za-z0-9_]*=' | xargs -I{} echo {})
fi

export NODE_ENV=production
export PORT="${PORT:-3000}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"

echo "▶ 启动 Chivox MCP 官网，监听 ${HOSTNAME}:${PORT}"
exec node server.js
RUN_EOF
chmod +x dist/run.sh

# 给一份带注释的 env 示例
cp .env.example dist/ENV.example 2>/dev/null || true

# ---------- 5. 打包 tar.gz（方便发给运维） ----------
PKG_NAME="chivoxmcp-global-$(node -p "require('./package.json').version")-$(date +%Y%m%d%H%M).tar.gz"
echo "▶ 生成发布包: $PKG_NAME"
tar -czf "$PKG_NAME" -C dist .

echo ""
echo "✅ 构建完成。"
echo "   产物目录: $ROOT/dist"
echo "   发布包:   $ROOT/$PKG_NAME"
echo ""
echo "运维侧使用："
echo "   1. 解压: mkdir chivoxmcp && tar -xzf $PKG_NAME -C chivoxmcp"
echo "   2. 配置环境变量：cp ENV.example .env 并按需修改"
echo "   3. 启动: cd chivoxmcp && bash run.sh"
