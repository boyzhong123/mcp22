<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Netlify 生产部署（必读）

在完成与用户相关的代码修改后，**若用户要求上线或发布**，在已登录 Netlify CLI 的前提下，于**本仓库根目录**执行：

```bash
netlify deploy --prod --build
```

- **生产站点**：`chivoxmcp2`（生产 URL：<https://chivoxmcp2.netlify.app>）
- **构建说明**：`netlify.toml` 中 `build.command` 为 `npm run build`，由 `@netlify/plugin-nextjs` 处理 Next.js 输出；首次或换机器需本机执行 `netlify login`，并在项目目录执行 `netlify link` 关联到上述站点。
- **工作目录**：若在 `.claude/worktrees/...` 等 **git worktree** 中开发，部署前须将改动 **合并回主工作区**（本仓库根路径下的 `main`），再执行上述命令，避免线上与主仓库不一致。
- **版本记录**：用户若要求「打版本」，在完成部署后可用 `git tag` 标注（例如 `v2.x.x`），并与用户确认是否需推送到远端（需配置 `git remote`）。
