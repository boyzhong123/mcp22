# ============================================================
# Chivox MCP 官网 · 多阶段 Dockerfile（基于 Next.js standalone 输出）
# 运维使用：
#   docker build -t chivoxmcp-global:1.1.1 .
#   docker run -d --name chivoxmcp \
#     -p 3000:3000 \
#     -e API_BASE_URL=https://fc.cloud.chivox.com/api \
#     chivoxmcp-global:1.1.1
# ============================================================

# ---------- 1. 依赖层 ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund --legacy-peer-deps

# ---------- 2. 构建层 ----------
FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- 3. 运行层 ----------
FROM node:20-alpine AS runner
WORKDIR /app

# 安全 / 体积：用非 root 用户运行
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# 仅拷贝 standalone 必需文件（镜像体积最小）
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

# 健康检查（命中首页 200 即视为存活）
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ >/dev/null 2>&1 || exit 1

CMD ["node", "server.js"]
