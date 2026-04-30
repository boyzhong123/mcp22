# Chivox MCP 官网 · 运维部署文档

> 适用版本：`v1.1.5+`
> 适用环境：CentOS 7+ / Ubuntu 20.04+ / 任意 Linux 服务器或 Docker 主机

---

> 🤖 **只想本地预览看一眼效果？**
> 不要照着这份文档一步步配。直接打开 [`./quickstart-prompt.md`](./quickstart-prompt.md)，
> 把里面的整段提示词复制给 Cursor / Claude / Codex 等 AI 助手，30 秒起服务。
> 这份「运维部署文档」是给真正上线、做 Docker / 反代 / systemd 的人看的。

---

## 0. 这是什么应用 / 怎么跑

- 框架：**Next.js 16**（React 19）
- 启动方式：**Node.js 进程**（不是纯静态站点，**不能**直接放 nginx 的 html 目录）
- 监听端口：**3000**（可改）
- **强依赖**：能联通后端 API（同源 `/api/*` 由本服务转发到 `API_BASE_URL`）

> 「下载 zip 解压双击就能跑」**不行**。必须用下面两种部署方式之一。

---

## 1. 推荐方案 · Docker 部署（最简单）

> ✅ 一行命令起服务，运维不需要装 Node / npm / 编译工具
> ✅ 升级只换镜像 tag，环境干净

### 1.1 服务器要求

| 项目 | 要求 |
|---|---|
| OS | 任意 64-bit Linux |
| Docker | ≥ 20.10 |
| docker compose | v2（`docker compose ...` 而非 `docker-compose`） |
| 内存 | ≥ 1 GB（构建时建议 ≥ 2 GB） |
| 磁盘 | ≥ 2 GB（镜像本身约 300 MB） |
| 出网 | 拉取 `node:20-alpine` 镜像 + 调用后端 API |

### 1.2 部署步骤

#### A. 用我们提供的镜像（推荐，省一次构建）

```bash
# 1) 拉镜像（如使用内网 harbor 请改 tag 前缀）
docker pull <镜像仓库>/chivoxmcp-global:1.1.5

# 2) 准备目录
mkdir -p /data/chivoxmcp
cd /data/chivoxmcp

# 3) 写 .env（按需修改）
cat > .env <<'EOF'
API_BASE_URL=https://fc.cloud.chivox.com/api
SMTP_HOST=smtp.qiye.163.com
SMTP_PORT=465
SMTP_USER=BD@chivox.com
SMTP_PASS_B64=<base64 后的授权码>
EOF

# 4) 起服务
docker run -d --name chivoxmcp \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file ./.env \
  <镜像仓库>/chivoxmcp-global:1.1.5
```

> 本服务**不写本地磁盘**（无状态），无需挂卷；所有用户数据由后端 API 负责。

#### B. 用源码 + docker compose（无外部镜像仓库时）

```bash
# 1) 拉取源码
git clone https://git.chivox.com/zhongxuesheng/chivoxmcp-global.git
cd chivoxmcp-global

# 2) 构建本地镜像
docker build -t chivoxmcp-global:1.1.5 .

# 3) （可选）创建 .env 覆盖默认值
cat > .env <<'EOF'
API_BASE_URL=https://fc.cloud.chivox.com/api
SMTP_HOST=smtp.qiye.163.com
SMTP_PORT=465
SMTP_USER=BD@chivox.com
SMTP_PASS_B64=<base64 授权码>
EOF

# 4) 起服务
docker compose up -d
docker compose logs -f web   # 实时查看日志
```

### 1.3 升级版本

```bash
docker pull <镜像仓库>/chivoxmcp-global:1.1.6   # 新版本号
docker rm -f chivoxmcp
docker run -d ...                              # 用同样的命令再起一次
```

或 compose：
```bash
docker compose pull && docker compose up -d
```

---

## 2. 备用方案 · 裸机/虚机部署（无 Docker 时）

### 2.1 服务器要求

| 项目 | 要求 |
|---|---|
| Node.js | **≥ 20**（必填，**18 跑不起来**） |
| npm | 随 Node 一同安装 |
| 内存 | 构建时 ≥ 2 GB；运行时 ≥ 512 MB |
| 出网 | 安装依赖 + 调用后端 API |

> 如果服务器是 Node 18 或更老版本，请先用 `nvm` 装 Node 20：
> ```bash
> curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
> source ~/.nvm/nvm.sh
> nvm install 20
> nvm use 20
> ```

### 2.2 在「构建机」上一次性出包

> 任意一台能上网的机器（甚至开发同事的电脑）都可以做构建机。
> 然后把生成的 `tar.gz` 发给运维，运维**完全不用装 Node 工具链**也行（如果运维机有 Node 20 就更好；没有就用 Docker 方案）。

```bash
# 1) 拉代码
git clone https://git.chivox.com/zhongxuesheng/chivoxmcp-global.git
cd chivoxmcp-global

# 2) 一键构建（首次会自动 npm ci）
bash scripts/build.sh
# 加 --clean 会删掉 node_modules 重新装：
# bash scripts/build.sh --clean

# 3) 生成 dist/ 目录 + tar.gz 发布包
ls -lh chivoxmcp-global-*.tar.gz
```

### 2.3 在「运维机」上启动

> 运维机至少需要 Node ≥ 20。

```bash
# 1) 解压
sudo mkdir -p /opt/chivoxmcp && cd /opt/chivoxmcp
sudo tar -xzf /path/to/chivoxmcp-global-1.1.5-202604300000.tar.gz

# 2) 配置环境变量
sudo cp ENV.example .env
sudo vim .env       # 至少改 API_BASE_URL

# 3) 试启动
bash run.sh
# 看到 “▶ Ready in xxx ms / Listening on 0.0.0.0:3000” 即正常

# 4) 浏览器或 curl 验证
curl -I http://127.0.0.1:3000/
```

### 2.4 用 systemd 守护进程（生产推荐）

新建 `/etc/systemd/system/chivoxmcp.service`：

```ini
[Unit]
Description=Chivox MCP Global Site
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=/opt/chivoxmcp
EnvironmentFile=/opt/chivoxmcp/.env
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOSTNAME=0.0.0.0
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=3
# 日志
StandardOutput=append:/var/log/chivoxmcp/access.log
StandardError=append:/var/log/chivoxmcp/error.log
# 资源限制（按需调整）
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
```

启动：
```bash
sudo mkdir -p /var/log/chivoxmcp
sudo systemctl daemon-reload
sudo systemctl enable --now chivoxmcp
sudo systemctl status chivoxmcp
journalctl -u chivoxmcp -f       # 实时查日志
```

---

## 3. 必备 / 可选 环境变量清单

| 变量 | 必填 | 默认值 | 说明 |
|---|---|---|---|
| `API_BASE_URL` | ✅ **必填** | `http://10.0.10.3:8081/api`（**生产请覆盖**） | 后端 API 根地址。前端 `/api/*` 会被服务端代理转发到这里。**不配 / 配错 → 登录、密钥、计费等所有接口失效。** |
| `PORT` | ❌ | `3000` | Node 监听端口 |
| `HOSTNAME` | ❌ | `0.0.0.0` | Node 监听地址 |
| `NODE_ENV` | ❌ | `production` | 启动脚本已自动设置 |
| `SMTP_HOST` | ❌ | `smtp.qiye.163.com` | 联系表单发件 SMTP |
| `SMTP_PORT` | ❌ | `465` | 同上 |
| `SMTP_USER` | ❌ | — | 同上 |
| `SMTP_PASS_B64` | ❌ | — | SMTP 密码的 **base64**（**推荐**，避开 `$` 被 shell/Next 展开问题） |
| `SMTP_PASS` | ❌ | — | 明文密码（密码不含 `$` 时可用） |
| `NEXT_PUBLIC_SHOW_GLOBAL_ENTRY` | ❌ | （隐藏） | 设 `1` 显示首页 + 登录页的 Global 入口浮层 |
| `CONTACT_FORWARD_URL` | ❌ | — | 海外联系表单转发地址（启用后绕过 SMTP） |
| `CONTACT_FORWARD_SECRET` | ❌ | — | 配合上面，HMAC 签名密钥 |

> base64 生成示例：`printf '%s' '真实密码' | base64`

---

## 4. 反向代理 · 接到现有域名（nginx 示例）

> 你们如果用 nginx 接进自有域名，**绝不能** `try_files / index.html`，要 `proxy_pass` 到 Node：

```nginx
upstream chivoxmcp_upstream {
  server 127.0.0.1:3000;
  keepalive 32;
}

server {
  listen 443 ssl http2;
  server_name your-domain.com;

  # SSL 证书略 ...

  client_max_body_size 5m;     # 表单上传 / 联系附件等

  location / {
    proxy_pass         http://chivoxmcp_upstream;
    proxy_http_version 1.1;
    proxy_set_header   Host              $host;
    proxy_set_header   X-Real-IP         $remote_addr;
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
    proxy_set_header   Connection        "";
    proxy_read_timeout 60s;
  }
}
```

---

## 5. 上线后自检清单（5 分钟）

按下面顺序确认，绝大多数“跑不起来”都能定位：

1. **进程是否在监听 3000**
   ```bash
   ss -lntp | grep :3000
   ```
2. **首页是否返回 200**
   ```bash
   curl -I http://127.0.0.1:3000/
   ```
3. **API 代理是否打通**（关键！）
   ```bash
   curl -i http://127.0.0.1:3000/api/healthz
   # 看响应头里有 x-chivox-proxy-target: <实际转发目标>
   # 如果是 502 + Upstream API unreachable，说明 API_BASE_URL 不通
   ```
4. **环境变量是否生效**
   ```bash
   docker exec chivoxmcp env | grep API_BASE_URL    # docker
   sudo systemctl show chivoxmcp -p Environment      # systemd
   ```
5. **日志里有无报错**
   ```bash
   docker logs --tail 200 -f chivoxmcp               # docker
   journalctl -u chivoxmcp -n 200 -f                  # systemd
   ```
6. **联系表单 / OAuth 是否生效**
   - 联系表单 502 → 看 SMTP 配置
   - OAuth 不通 → 看 `docs/issues/auth-known-issues.md`，多半是后端 / 第三方回调地址未配置

---

## 6. 常见问题 FAQ

### Q1. `npm install` 报 `EBADENGINE` / `engine "node":">=20"`
**A**：Node 版本太老。装 Node 20+ 后重试。

### Q2. `next: command not found` 或 build 报 `Cannot find module`
**A**：跳过了 `npm ci`。在项目根**先**执行 `npm ci --legacy-peer-deps` 再 `npm run build`。**不要**用 `yarn`/`pnpm`。

### Q3. 浏览器能开首页，但所有按钮 / 接口都报错
**A**：99% 是 `API_BASE_URL` 没配或不通。用第 5 节第 3 步验证。

### Q4. 头像 / 用户上传文件保存在哪里？
**A**：本服务**不写本地磁盘**（无状态）。`/api/upload/*` 这类请求会被代理到后端 API（`API_BASE_URL`），由后端负责存储与 CDN 回源，前端无需挂卷或共享存储。

### Q5. 我直接 `git clone` 到运维机能跑吗？
**A**：能，但要满足：
1. Node ≥ 20
2. `npm ci --legacy-peer-deps && npm run build`
3. **不要** `npm run dev`（dev 模式不能上生产）
4. 用 `npm start` 或 `node .next/standalone/server.js` 启动
5. 同样要配 `API_BASE_URL`

但是出于干净/可控，**仍然推荐 Docker 方案 (§1) 或 build.sh 出包方案 (§2)**。

### Q6. 邮件验证码 / OAuth 登录跑不通
**A**：这两个**不是前端问题**，是后端联调还没完成。详见 `docs/issues/auth-known-issues.md`。

---

## 7. 运维联系人 / 责任划分

- **前端构建包 / 镜像产出**：研发同学（本仓库 owner）
- **服务器准备 / Docker / nginx / systemd**：运维同学
- **环境变量值（`API_BASE_URL`、`SMTP_*` 等）**：运维 + 后端共同确认
- **后端 API（`/api/auth/*`、`/api/keys/*` 等）**：后端同学
