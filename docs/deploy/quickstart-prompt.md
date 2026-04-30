# 给「技术 / 运维同事」的 AI 上手提示词

> 不熟悉 Next.js？**直接把下面三道横线之间的整段内容**复制给你电脑里的
> AI 助手（Cursor、Claude Code、Codex CLI、ChatGPT 桌面 等任意一个），
> 它会自动按步骤把项目跑起来给你预览。
>
> 出问题时，把 AI 汇报的报错原文 + `node -v` + `npm -v` 一并发回开发同学，
> 比单独说「跑不起来」高效 100 倍。

---

```
你是我的本地开发助手。请按以下步骤把这个项目跑起来，让我能在浏览器里预览。
每一步执行完后简短汇报结果（成功/失败 + 关键日志）。出错时不要乱猜，先把
报错原文贴出来再分析。

# 项目背景
- Next.js 16（React 19）应用，仓库地址：
  https://git.chivox.com/zhongxuesheng/chivoxmcp-global.git
- 一定要看仓库里的 docs/deploy/README.md，按它说的来；不要自己发明步骤。
- 这是一个 Node 服务，不是静态站点，不能用 nginx 直出。

# 第 0 步：环境检查（先做完再继续）
- node -v 必须 >= 20。如果是 18 或更低，先用 nvm 装 Node 20 再继续。
- npm -v 至少 10。
- 必须有 git，且能访问 https://git.chivox.com/。

# 第 1 步：拉代码
git clone https://git.chivox.com/zhongxuesheng/chivoxmcp-global.git
cd chivoxmcp-global
git status        # 确认在 main，干净

# 第 2 步：装依赖（必须用这条命令，不要换）
npm ci --legacy-peer-deps
# 不要用 npm install / yarn / pnpm，否则会装出不一致依赖。

# 第 3 步：配环境变量
# 复制 .env.example 为 .env.local，至少改 API_BASE_URL 指向真实后端：
cp .env.example .env.local
# 然后把 .env.local 里的 API_BASE_URL 改成可以联通的后端地址，例如：
#   API_BASE_URL=https://fc.cloud.chivox.com/api
# 默认值是内网地址 10.0.10.3:8081，本地预览基本不通，必须覆盖。

# 第 4 步：本地预览（开发模式即可，不需要 build）
npm run dev
# 看到 "Ready in xxx ms / Local: http://localhost:3000" 就成功。
# 在浏览器打开 http://localhost:3000/global 即可预览全球站。

# 第 5 步：自检（如果页面打开但接口报错，按顺序排查）
1) curl -I http://127.0.0.1:3000/                返回 200 → Node 起成功
2) curl -i http://127.0.0.1:3000/api/healthz     看响应头
   - 有 x-chivox-proxy-target: <某个 URL>  → 代理已生效
   - 502 + Upstream API unreachable        → API_BASE_URL 不通，回到第 3 步
3) 浏览器 DevTools → Network 看具体接口的 status / response

# 常见坑（先排除这些再问开发）
- "Cannot find module xxx" → 没跑 npm ci，或跑在了错误目录。
- "engine node" 报错       → Node 版本 < 20。
- 页面能开，接口全炸       → API_BASE_URL 没配 / 不通，与代码无关。
- 不要用 npm run build + start 来做预览，太慢；预览就用 npm run dev。
- 不要修改任何业务代码来"试错"。如果你确认是代码 bug，先列出文件:行号
  和复现步骤，再去找开发同学。

# 想生产部署而不只是预览？
看仓库 docs/deploy/README.md 第 1 节（Docker 方案，最快）。
```

---

## 为什么不直接 `npm install && npm start` 就行？

| 你以为 | 实际 |
|---|---|
| `npm install` | ❌ 可能装出与 lockfile 不一致的依赖。**必须 `npm ci`**。 |
| 不加 `--legacy-peer-deps` | ❌ peer dep 冲突直接装失败。Netlify 也是这么配的。 |
| `npm start` 看效果 | ❌ `npm start` 等于 `next start`，没 build 就报错。**预览用 `npm run dev`**。 |
| 不配 `API_BASE_URL` | ❌ 所有 `/api/*` 接口走默认内网地址，本地必然 502。 |

按上面的提示词走，这 4 个坑会被 AI 自动避开。
