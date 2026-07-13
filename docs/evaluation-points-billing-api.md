# 评测积分充值：接口调整清单

## 结论

充值的产品资产是“评测积分”，不是美元余额或可调用次数。美元仅用于 PayPal 付款、退款和财务对账；所有用户侧余额、充值记录和消耗提示均应以 `evaluation_points` 为准。

前端当前使用本地假数据演示此契约；真实接口接入后，`mock-store-bridge.ts` 会优先读取下列积分字段。

## 统一规则

| 项目 | 规则 |
| --- | --- |
| 账户范围 | 一次充值到账户积分池，所有 API Key 共享 |
| 套餐 | `standard` / `advanced` / `flagship`；支持套餐内预设金额与自定义金额 |
| 到账 | `credited_points = base_points + bonus_points` |
| 扣减 | 字 / 词 / 句成功评测扣 1 积分；段落成功评测扣 2 积分 |
| 有效期 | 每笔到账积分返回独立的 `points_expire_at`；扣减使用最早到期批次 |
| 状态 | 仅 `succeeded` 的交易计入余额；`pending` 不加积分 |

## 1. 获取充值规则

`GET /api/billing/pricing`

在现有价格信息基础上增加：

```json
{
  "evaluation_point_rules": {
    "base_points_per_usd": 250,
    "word_sentence_points_per_use": 1,
    "paragraph_points_per_use": 2,
    "valid_days": 30
  },
  "topup_packages": [
    {
      "id": "standard",
      "min_amount_cents": 1990,
      "bonus_percent": 0,
      "preset_amount_cents": [1990, 5000, 9000]
    },
    {
      "id": "advanced",
      "min_amount_cents": 9990,
      "bonus_percent": 10,
      "preset_amount_cents": [9990, 15000, 19900]
    },
    {
      "id": "flagship",
      "min_amount_cents": 19990,
      "bonus_percent": 20,
      "preset_amount_cents": [19990, 30000, 50000]
    }
  ]
}
```

前端不应自行决定赠送比例、可选档位和有效期；这些值以本接口为准。

## 2. 创建 PayPal 订单

`POST /api/billing/topups/order`

```json
{
  "amount_cents": 15000,
  "package_id": "advanced"
}
```

服务端须校验金额是否满足套餐最低金额，按服务端规则计算报价，并返回：

```json
{
  "paypal_order_id": "...",
  "transaction_id": 1042,
  "amount_cents": 15000,
  "package_id": "advanced",
  "quoted_points": 41250
}
```

`quoted_points` 仅用于支付前确认。支付捕获成功后必须以捕获返回的交易字段为准。

## 3. 捕获订单与交易详情

`POST /api/billing/topups/:transactionId/capture` 与 `GET /api/billing/transactions/:id` 均返回以下字段：

```json
{
  "id": 1042,
  "kind": "credit-topup",
  "status": "succeeded",
  "method": "paypal",
  "amount_cents": 15000,
  "package_id": "advanced",
  "base_points": 37500,
  "bonus_points": 3750,
  "credited_points": 41250,
  "point_balance_before": 18125,
  "point_balance_after": 59375,
  "points_expire_at": "2026-08-11T00:00:00Z",
  "used_points": 12500,
  "remaining_points": 28750,
  "created_at": "2026-07-12T10:30:00Z"
}
```

服务端必须在同一事务内完成：验证 PayPal capture、写入交易、写入积分批次、更新积分余额。重复 capture / webhook 重放必须幂等，不能重复加积分。

## 4. 余额与汇总

`GET /api/billing/summary` 应返回：

```json
{
  "evaluation_points_balance": 59375,
  "evaluation_points_credited_total": 66250,
  "evaluation_points_used_total": 6875,
  "evaluation_points_expiring_soon": 5000,
  "evaluation_points_next_expiry_at": "2026-08-01T00:00:00Z"
}
```

`GET /api/billing/balance` 至少返回 `evaluation_points_balance`；美元余额字段可以保留给财务/兼容用途，但不应驱动用户侧积分展示。

## 5. 交易列表

`GET /api/billing/transactions?page=1&page_size=50&kind=credit-topup`

沿用分页 envelope：`{ transactions, total, page, page_size }`。每个列表项必须包含 `amount_cents`、`credited_points`、`used_points`、`remaining_points`、`package_id`、`status`、`method`、`created_at`；`created_at` 必须为 ISO 8601 完整时间（含时分秒与时区），用于区分同日多笔充值。`used_points` 与 `remaining_points` 是请求时刻的当前批次使用快照。列表可不返回 `base_points`、`bonus_points`、余额前后值，前端点击详情时再取完整记录。

## 6. 积分批次与有效期（新增）

每一次成功充值必须生成一个独立的积分批次。不要只返回一个账户总余额，否则前端无法解释多笔充值的有效期、临期积分和扣减顺序。

`GET /api/billing/evaluation-points/batches`

按 `expires_at ASC` 返回，支持仅返回当前账号的数据：

```json
{
  "batches": [
    {
      "id": "epb_1024",
      "transaction_id": 1042,
      "package_id": "advanced",
      "credited_points": 41250,
      "used_points": 12500,
      "remaining_points": 28750,
      "expires_at": "2026-08-11T00:00:00Z",
      "created_at": "2026-07-12T10:30:00Z",
      "status": "active"
    }
  ],
  "total": 1
}
```

- `status`：`active`、`exhausted`、`expired`。
- 调用扣分时，服务端按 `expires_at ASC`（最早到期优先）跨批次扣减；若同日到期，再按 `created_at ASC`。
- 余额、消耗记录、扣减与批次状态更新必须在同一个数据库事务中完成。
- 前端账单页以该接口展示可展开的批次明细和到期分布图；**不得按日期合并**同日的多笔充值。每个批次须使用 `expires_at` 的完整时间（精确到秒）单独展示，并同时展示 `remaining_points / credited_points` 的批次剩余百分比，以及该批次占当前可用积分的比例；`evaluation_points_balance` 仍是账户总览的权威汇总值。

## 7. 积分不足提醒

`GET/PATCH /api/notifications/settings` 增加 `low_evaluation_points_threshold`（整数，单位：积分），与已有 `low_balance_alerts_master` 一起控制提醒。`low_balance_threshold_cents` 可以保留一段兼容期，但不得再驱动前端提醒或通知文案。

```json
{
  "low_balance_alerts_master": true,
  "low_evaluation_points_threshold": 1250
}
```

## 8. 按 Key 的积分消耗明细

`GET /api/usage/points` 的每个日粒度记录除 `calls` 外，增加以下字段。前端不再以美元消费作为主展示；所有 Key 的消耗均以积分和评测对象拆分展示。

```json
{
  "date": "2026-07-13",
  "key_id": 12,
  "calls": 860,
  "word_sentence_calls": 706,
  "paragraph_calls": 154,
  "word_sentence_points": 706,
  "paragraph_points": 308,
  "evaluation_points": 1014
}
```

- `calls = word_sentence_calls + paragraph_calls`。
- `evaluation_points = word_sentence_points + paragraph_points`。
- 当前规则下字 / 词 / 句每次成功评测扣 1 积分，段落每次成功评测扣 2 积分；真实值仍以服务端返回为准。
- 金额字段可保留用于财务对账，不得作为开发者控制台“本月消耗”“按 Key 消耗”或用量图的主指标。

## 9. 账户与 Key 的积分 / 调用上限

调用护栏的计量单位必须是评测积分和调用次数，**不得再用美元金额作为流量停止条件**。支付金额只属于充值订单与财务对账。

`GET /api/billing/limits`、`PUT /api/billing/limits` 使用以下字段；`0` 表示不限：

```json
{
  "monthly_evaluation_point_cap": 30000,
  "daily_evaluation_point_cap": 5000,
  "monthly_call_cap": 100000,
  "daily_call_cap": 5000,
  "warn_at_percents": [50, 75, 90]
}
```

每个 Key 的 `GET/PATCH /api/keys/:id/settings`（或 `limits` 对象）使用同名四个 cap 字段。服务端分别按 UTC 日、UTC 自然月累计 `evaluation_points` 与 `calls`；任一已配置上限达到后停止该账户或该 Key 的后续调用，并返回稳定的限额错误码。

- 警告百分比针对已配置的积分或调用上限计算；通知需指明触发的是哪一个维度。
- `*_spend_cap_mills` 仅可作为短期兼容读字段，不能再写入、不能驱动前端表单或拦截逻辑。
- 旧客户端传入金额上限时，服务端应明确拒绝或按版本兼容处理，不能把金额静默换算为积分。

## 前端接线点

- `src/app/dev-en/_lib/api/types.ts`：已增加积分字段类型。
- `src/app/dev-en/_lib/api/billing.ts`：创建订单会提交 `package_id`。
- `src/app/dev-en/_lib/mock-store-bridge.ts`：已映射 summary 与交易的积分字段。
- `src/app/dev-en/_components/stripe-checkout-modal-packages.tsx`：当前仅使用这一套套餐充值流程。
- `src/app/dev-en/dashboard/billing/history/page.tsx`：以到账积分为记录主列，金额只作支付对账。
- `src/app/dev-en/dashboard/billing/page.tsx`、`src/app/dev-en/dashboard/usage/page.tsx` 与概览：以消耗积分展示 Key 用量，并拆分字词句 / 段落次数与积分。
- `src/app/dev-en/dashboard/settings/page.tsx` 与概览提醒：统一使用“评测积分不足”及积分阈值。
- `src/app/dev-en/dashboard/limits/page.tsx`、Key 设置与接口桥接：统一提交 `*_evaluation_point_cap` 与调用上限。
