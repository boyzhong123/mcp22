# 开发者门户 vs 最新后端 API 验收表

盘点日期：2026-06-01  
对照文档：后端最新 `api.md`  
范围：开发者门户 `/dev-en`、登录注册、账单、设置与资料页

## 结论

按“前端页面是否搭建完成”的口径，本轮明确需求已经满足。Webhook 管理页仍作为可选补充项。

真实接口接线仍有待办，但单独归入技术联调清单，不再将已经搭建完成的页面标记为“部分满足”。

## 九项前端需求验收

| # | 需求 | 当前状态 | 说明 |
|---|---|---|---|
| 1 | 登录和注册增加协议勾选 | ✅ 已完成 | 登录和注册均已增加协议确认；协议正文上线前仍需法务审核。 |
| 2 | 邮箱注册增加验证码发送和输入框 | ✅ 已完成 | 注册页已支持协议确认、发送验证码、倒计时和验证码输入。OTP verify 是否为正式注册流程单列给后端确认。 |
| 3 | Overview 补充接口返回字段 | ✅ 页面已完成 | 页面已补充钱包、试用、用量与限额维度；真实 API 适配单列为技术联调项。 |
| 4 | 去掉 Project 概念 | ✅ 已完成 | 创建 Key、列表和 Usage 页面已移除 Project；后端最新文档也没有 Project API。 |
| 5 | 账单去掉发票、保存卡，仅保留 Paypal | ✅ 已完成 | 保存卡入口、发票搜索、发票列、下载按钮和相关页面文案均已移除；充值页面仅展示 Paypal。 |
| 6 | 去掉成员邀请与角色管理 | ✅ 已完成 | Team、Members 页面与接口封装已移除。 |
| 7 | 去掉充值梯度赠送金额 | ✅ 已完成 | 赠送金额逻辑已移除，充值档位仅代表实际充值金额。 |
| 8 | 增加忘记密码、重置密码、修改密码 | ✅ 已完成 | 忘记密码入口、重置密码页面和 Profile 修改密码区块均已搭建；真实 API 接线单列为技术联调项。 |
| 9 | 增加交易详情抽屉 | ✅ 已完成 | 点击充值记录后从右侧打开详情抽屉，展示金额、状态、时间、PayPal 订单号和钱包余额变化。 |

## 后端已经提供

| 模块 | 最新接口能力 | 前端状态 |
|---|---|---|
| Auth | 注册、登录、OTP、邮箱验证、忘记密码、重置密码、修改密码、OAuth、资料修改 | 登录和注册页已增加 GitHub、Google、Microsoft OAuth；密码流程和 OAuth 回调仍需按最新契约接线。 |
| Overview | `/api/billing/summary`、余额、交易、用量汇总 | Summary 只接入部分字段，仍需统一真实数据源。 |
| API Keys | Key 列表、创建、撤销、重命名、四维限额 | 页面已去 Project；Key 限额适配仍读旧字段。 |
| Usage | `/api/usage/points`、`/api/usage/account-summary`、CSV 导出 | 后端字段已足够；前端仍按旧 envelope 和旧点位结构读取。 |
| Billing | Paypal 下单与 capture、余额、交易列表、交易详情、定价、账户四维限额 | 发票和保存卡入口已移除；仍需清理旧 payment-methods / Stripe 接线，并接最新 limits 与 transactions 结构。 |
| Notifications | 低余额总开关、阈值、邮件开关 | 已接入单一低余额开关与阈值。 |
| Profile | 头像上传、公开头像读取、资料修改 | 已接入。 |
| Webhooks | 增删改查、secret、日志 | 后端已提供；前端暂未做管理页。 |

## 技术联调与清理

### P0：后端同步试用额度口径

- 产品确认免费试用为 `900` 次、有效期 `30` 天。
- ✅ 前端 Overview、Rates 和默认值已经按 `900 / 30` 展示。
- 最新后端文档中的 `/api/billing/pricing` 示例仍写 `trial_calls: 600`。
- `/api/billing/summary` 返回剩余次数和到期日，但缺少试用总次数；前端目前将总次数固定为 `900`。
- 建议后端统一 pricing 示例与实际返回，并在 summary 增加 `trial_calls_total`。

### P1：迁移前端适配层

- `/api/usage/points` 最新文档直接返回数组，前端仍按旧 `{ points }` envelope 读取。
- Usage 点位最新字段为 `date`、`key_id`、`model`、`calls`、`cost_cents`、`savings_cents`，前端仍使用旧点位结构。
- 账户四维限额最新接口是 `GET/PUT /api/billing/limits`，前端桥接层仍请求旧 `/api/billing/spend-limit`。
- Key 四维限额已经由后端返回，前端桥接层仍只映射旧的单一月度金额字段。
- 交易列表最新 envelope 为 `{ transactions: [...] }`，前端接口封装仍保留旧 `{ items }`。

### P1：清理账单旧接线

- ✅ 账单历史页已经移除发票搜索、发票列和下载按钮。
- ✅ 设置、资料、Billing 和 Rates 页面已经移除发票相关文案。
- ✅ Billing 和充值弹窗已经移除保存卡管理、选卡和绑卡入口。
- 前端接口封装、桥接层和 DataHydrator 仍保留 payment methods 请求。
- Paypal-only 模式下仍需清理旧 Stripe 接线，保留 Paypal order / capture。

### P1：接通密码流程与 OAuth

- 忘记密码、重置密码、修改密码页面需要调用最新后端接口。
- OAuth 最新文档要求前端生成 `state`、保存到 `sessionStorage`，并从 `/oauth/callback#token=...&state=...` 读取回调；当前前端回调路径和参数读取方式仍不一致。

### P2：可继续补充

- ✅ 交易详情抽屉：已支持点击充值记录后从右侧打开，并请求 `/api/billing/transactions/:id` 补充详情。
- Webhook 管理页：后端接口已具备，可按产品优先级安排。

## 给后端的确认项

1. 免费试用最终口径是否统一为 `900` 次、`30` 天？请同步修正 `/api/billing/pricing` 返回或文档示例。
2. `/api/billing/summary` 是否可以增加 `trial_calls_total`，避免前端写死 `900`？
3. 邮箱验证码注册是否正式统一使用 `/api/auth/otp/send` + `/api/auth/otp/verify`？前端页面和协议确认已经完成。
4. Paypal-only 模式下，`/api/billing/invoices/:number` 是否仅作为后端保留能力，不再要求前端展示？
