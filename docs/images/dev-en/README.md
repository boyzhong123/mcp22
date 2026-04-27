# dev-en 控制台截图目录

本目录用于 [`docs/dev-en-api-spec.md`](../../dev-en-api-spec.md) 的 UI 截图引用。

## 如何截图

1. 本地起 dev 服务（`npm run dev`），浏览器访问 `http://localhost:3000/dev-en/login`。
2. 登录后按下表顺序走一遍，并用浏览器/系统截图工具截取关键页面。推荐尺寸：宽 **1280–1440px**（DPR=2 也 OK），避免全屏过大或手机窄屏。
3. 命名严格按下表，保存为 **PNG**（需要透明背景时选 webp 也行，改 md 引用即可）。
4. `git add docs/images/dev-en/*.png && git commit`；接口文档里已经预埋了 `<img>` 引用，图一落盘就会渲染。

## 文件清单

| 文件名 | 引用章节 | 抓取重点 |
| --- | --- | --- |
| `login.png` | §1 Auth | 登录页：左侧品牌区 + 右侧 3 个 OAuth 按钮 + Email OTP 表单 |
| `overview-alerts.png` | §3 Keys · §10.1 告警契约 | 首页：顶部 "Needs attention" 告警栈（至少触发 2 条） + KPI 卡 + Starter 条带（默认态） |
| `overview-starter-upgraded.png` | §10.1 Starter 升级契约 | 首页：Starter 升级后（紫色 + cap lifted + Balance bar） |
| `keys-page.png` | §3 API Keys | Keys 主页：Starter 卡片 + 付费 key 列表 + Create paid key 按钮 |
| `key-settings-modal.png` | §3.4–3.9 | 点齿轮弹出的 `KeySettingsModal`，展示 4 个 tab（Rename / Rotate / Spend cap / Low-balance alert） |
| `starter-copy-guide.png` | §3 Starter 复制引导 | 点 Starter 的 Copy 弹出的 `StarterCopyGuideModal`，展示 3 个选项 |
| `stripe-checkout-modal.png` | §5.4 Top-up | 任何 "Top up / Add credits" 唤起的 `StripeCheckoutModal`（建议抓含多支付方式 tab 的版本） |
| `billing-page.png` | §5.2 · §5.3 | Billing 主页：Monthly spend cap 编辑器 + Payment methods 列表 |
| `recharge-history.png` | §5.5–5.6 | 充值历史表格（含 Download PDF 图标） |
| `usage-page.png` | §4 Usage | 用量页：主图 + 日/月切换 + project/key 过滤 + 右上 Export CSV |
| `team-page.png` | §6 Team | Team 成员列表 + Role 下拉 + Invite 弹窗 |
| `settings-notifications.png` | §7 Notifications | Settings 页 Notifications 区域（7 个 toggle） |

## 语言

默认用中文 UI 截图（产品里多数用户是中文 reviewer）。如果要英文版，另存为 `<name>.en.png` 并在 md 里新开一行引用即可。

## 更新节奏

UI 重构后截图很容易过期。约定：每次 Keys/Billing/Stripe modal 有 **视觉上的明显变化** 就重新截该页；微调不必。过期的图比没有图更坑人。
