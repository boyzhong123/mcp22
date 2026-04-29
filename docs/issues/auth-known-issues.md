# 认证模块已知问题

> 记录人：开发自查
> 创建时间：2026-04-29
> 模块范围：`/login`、`/register`、`/dev-en/login`（开发者控制台登录）

---

## 1. 邮箱验证码（OTP）发送链路不可用

- **现象**
  - 在登录页切换到「改用邮箱验证码登录」，点击「发送验证码」后，前端会显示「验证码已发送至 xxx@xxx.com。」绿色提示，但**实际邮箱收不到邮件**（含垃圾箱）。
  - 60 秒倒计时正常，重发逻辑正常，但邮件始终未送达。

- **复现路径**
  1. 打开 `https://chivoxmcp2.netlify.app/login`（或 `/dev-en/login`）
  2. 输入有效邮箱 → 点击「Sign in with a one-time code instead」
  3. 点击「Send code / 发送验证码」
  4. 前端提示发送成功 → 收件箱 / 垃圾箱均未收到邮件

- **前端调用**
  - `POST /api/auth/otp/send`，body：`{ channel: 'email', identifier: '<email>' }`
  - 代码位置：
    - `src/app/dev-en/_lib/api/auth.ts` → `otpSend()`
    - `src/app/dev-en/_lib/auth-context.tsx` → `sendOtp()`
    - `src/app/dev-en/login/page.tsx` → `handleSendCode()`

- **代理转发**
  - `src/app/api/[...path]/route.ts` 将同源 `/api/*` 透传到 `API_BASE_URL`
  - 默认值：`http://10.0.10.3:8081/api`（内网地址，Netlify 生产环境必须覆盖）

- **怀疑点 / 待确认**
  1. Netlify 上 `API_BASE_URL` 是否已配置为可达的生产后端（如 `https://fc.cloud.chivox.com/api`）？
  2. 后端 `/auth/otp/send` 是否真正接通了邮件发送服务（SMTP / SendGrid / 阿里云邮推 等）？
  3. 后端是否仅写入了验证码记录但未触发投递？日志里有无 send-mail 错误？
  4. 邮件发件人域名是否做了 SPF/DKIM/DMARC，避免被 Gmail 直接丢弃？
  5. 前端无论后端真发还是 mock 成功都会显示绿色提示，**该提示不能作为"邮件已投递"的证据**，建议后端把投递结果分两步返回（accepted vs delivered）。

- **影响**
  - 用户无法通过邮箱验证码登录，仅能依赖密码登录；新用户走不通验证码注册路径。

- **建议处理顺序**
  1. 后端先在测试环境用 `curl` 直打 `/auth/otp/send`，确认是否真正触发邮件投递。
  2. 检查邮件服务商投递日志，确认 bounce / spam / queued。
  3. Netlify 控制台核对 `API_BASE_URL` 环境变量。
  4. 修复后回归测试 Gmail / Outlook / 企业邮箱三类收件方。

---

## 2. 第三方登录（OAuth）未接通

- **现象**
  - 登录 / 注册页底部的第三方登录按钮（GitHub / Google 等）点击后**无法完成登录**，跳转目标返回错误或回跳后未建立会话。

- **代码位置**
  - 按钮组件：`src/app/dev-en/_components/oauth-buttons.tsx`
  - 起始链接：`src/app/dev-en/_lib/api/auth.ts` → `oauthStartUrl(provider, redirect)` → 拼成 `/api/auth/oauth/{provider}/start`
  - 回调页面：`src/app/auth/callback/page.tsx`
  - 代理：`src/app/api/[...path]/route.ts`（同 OTP 一样透传到后端）

- **怀疑点 / 待确认**
  1. 后端 `/auth/oauth/{provider}/start` 是否注册了对应的 OAuth App（client_id / client_secret）？
  2. OAuth 服务商后台配置的回调地址是否包含生产域名 `https://chivoxmcp2.netlify.app/auth/callback`？
     - 当前线上若仍写着 `http://localhost:3000/...`，三方授权会直接拒绝。
  3. 回调页 `src/app/auth/callback/page.tsx` 拿到 `code/token` 后是否正确写入 `localStorage` 的 `chivox_token` 并跳转 `/dashboard/overview`？
  4. 跨子域 cookie / SameSite 限制是否影响会话保持？
  5. Netlify 上 `API_BASE_URL`、以及后端处需要的回调白名单是否都更新到了生产域名？

- **当前可用的 Provider 清单**（待确认）
  - [ ] Google
  - [ ] GitHub
  - [ ] 其他（如有）

- **影响**
  - 用户只能通过邮箱+密码登录，OAuth 入口形同虚设。
  - 注册引导路径变窄，新用户漏斗下降。

- **建议处理顺序**
  1. 列出当前要支持的 Provider 清单，与后端 / 运维对齐每家的 client_id、回调地址。
  2. 在每家 OAuth 后台配置生产回调：`https://chivoxmcp2.netlify.app/auth/callback`（如域名变更同步更新）。
  3. 后端 `/auth/oauth/{provider}/start` → `/auth/oauth/{provider}/callback` 联调通过后，前端 `auth/callback/page.tsx` 做端到端验证。
  4. 加打点：起始跳转、回调到达、token 写入三个步骤分别埋日志，便于后续排障。

---

## 待办（汇总）

- [ ] 确认 Netlify `API_BASE_URL` 指向真实后端
- [ ] 后端排查 `/auth/otp/send` 邮件投递链路 & 日志
- [ ] 后端补齐 / 排查 `/auth/oauth/*/start|callback` 实现
- [ ] OAuth 服务商后台同步生产回调地址
- [ ] 联调通过后回归：邮箱 OTP、Google、GitHub 三条登录路径
