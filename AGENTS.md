<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## 部署 / 上线

仓库本身**不绑定任何具体托管平台**。生产部署由公司运维按 `docs/deploy/README.md` 执行（Docker 或裸机均可）。AI 助手不要在未经用户明确指示的情况下执行任何 `deploy` / `publish` 类命令。

## 版本号

用户要求「打版本」时，更新 `package.json` 中 `version`，再用 `git tag -a vX.Y.Z -m "vX.Y.Z"` 标注，并与用户确认是否需要推送到远端。
