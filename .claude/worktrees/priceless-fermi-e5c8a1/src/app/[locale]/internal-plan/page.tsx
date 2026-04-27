export default function InternalPlanPage() {
  return (
    <main className="min-h-screen bg-white text-zinc-900 print:text-[13px]">
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="border-b border-zinc-200 pb-8 mb-12">
          <p className="text-xs text-zinc-400 uppercase tracking-widest mb-2">INTERNAL · 内部文档 · v2</p>
          <h1 className="text-3xl font-bold tracking-tight mb-2">驰声语音评测 MCP — 详细开发计划</h1>
          <p className="text-zinc-500 text-sm">苏州驰声信息科技有限公司 · 2026 Q2 · 周期 4 周（4/14 → 5/9）</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {['MCP Server','并发架构','鉴权计费','开发者网站','文档站','在线体验','SDK','监控'].map(t=>(
              <span key={t} className="px-2 py-0.5 bg-zinc-100 rounded">{t}</span>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════
            目录
        ═══════════════════════════════════════ */}
        <nav className="mb-14 bg-zinc-50 rounded-lg p-5 text-sm">
          <p className="font-semibold mb-2 text-zinc-700">目录</p>
          <ol className="list-decimal list-inside space-y-1 text-zinc-600">
            <li>产品现状与问题分析</li>
            <li>架构升级 — 并发、队列与扩缩容</li>
            <li>MCP Server 功能细化</li>
            <li>鉴权 & 计费体系</li>
            <li>开发者网站 & 文档站</li>
            <li>在线体验（真实接入）</li>
            <li>监控、告警与运维</li>
            <li>安全与合规</li>
            <li>4 周 Sprint 排期</li>
            <li>风险 & 预案</li>
            <li>Open Questions</li>
          </ol>
        </nav>

        {/* ═══ 1 · 产品现状与问题分析 ═══ */}
        <Section n={1} title="产品现状与问题分析">
          <SubSection title="1.1 当前能力">
            <KV items={[
              ['版本', 'v2.3.0（2026-03-25）'],
              ['评测工具', '7 种（英文 word/sent/para/pron/phonics + 中文 word/sent）'],
              ['部署', '单实例云端 SSE，HTTPS'],
              ['并发限制', '最大并发 3 / 排队 10 / 存储 500MB'],
              ['鉴权', '无（公开访问）'],
              ['计费', '无'],
            ]} />
          </SubSection>

          <SubSection title="1.2 核心瓶颈（必须解决）">
            <ProblemList items={[
              {
                problem: '并发天花板极低',
                detail: '当前单实例 max_concurrent=3, max_queue=10。一个教育 App 班级 30 人同时交作业就会大面积排队超时。',
                impact: '无法支撑任何 B 端商用场景',
              },
              {
                problem: '音频存储靠本地磁盘',
                detail: '500MB 本地临时目录，单机故障即丢失。无法水平扩展，多实例之间无法共享音频。',
                impact: '不可扩展，存在数据丢失风险',
              },
              {
                problem: '无鉴权 = 无法商用',
                detail: '任何人只要知道 URL 就能免费无限调用。无法区分用户、统计用量、执行配额。',
                impact: '无法计费，存在滥用风险',
              },
              {
                problem: 'LLM 分析无服务端能力',
                detail: '当前 LLM 分析完全依赖客户端（如 Cursor）自身的模型。官网在线体验用的是 mock 数据。如果未来要提供「评测 + AI 分析」一站式服务，需要服务端集成 LLM 调用。',
                impact: '产品价值无法在非 AI 客户端场景体现',
              },
              {
                problem: '无监控 & 告警',
                detail: '除了 /health 端点外，无请求量、错误率、延迟 P99 等可观测性。出问题只能看日志。',
                impact: '运维被动，SLA 无法保障',
              },
            ]} />
          </SubSection>
        </Section>

        {/* ═══ 2 · 架构升级 ═══ */}
        <Section n={2} title="架构升级 — 并发、队列与扩缩容">

          <SubSection title="2.1 目标并发指标">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead><tr className="border-b border-zinc-200">
                  <th className="text-left py-2 pr-4 font-semibold">指标</th>
                  <th className="text-left py-2 pr-4 font-semibold">当前</th>
                  <th className="text-left py-2 pr-4 font-semibold">4 周后目标</th>
                  <th className="text-left py-2 font-semibold">说明</th>
                </tr></thead>
                <tbody className="divide-y divide-zinc-100">
                  <tr><td className="py-2 pr-4">最大并发评测</td><td className="py-2 pr-4 font-mono">3</td><td className="py-2 pr-4 font-mono text-emerald-700 font-bold">50</td><td className="py-2">多实例 + 连接池</td></tr>
                  <tr><td className="py-2 pr-4">最大排队</td><td className="py-2 pr-4 font-mono">10</td><td className="py-2 pr-4 font-mono text-emerald-700 font-bold">500</td><td className="py-2">Redis 分布式队列</td></tr>
                  <tr><td className="py-2 pr-4">音频存储</td><td className="py-2 pr-4 font-mono">500MB 本地</td><td className="py-2 pr-4 font-mono text-emerald-700 font-bold">无限 (OSS)</td><td className="py-2">对象存储 + 生命周期策略</td></tr>
                  <tr><td className="py-2 pr-4">评测 P99 延迟</td><td className="py-2 pr-4 font-mono">未知</td><td className="py-2 pr-4 font-mono text-emerald-700 font-bold">&lt;3s</td><td className="py-2">含上传+评测+返回</td></tr>
                  <tr><td className="py-2 pr-4">可用性</td><td className="py-2 pr-4 font-mono">无 SLA</td><td className="py-2 pr-4 font-mono text-emerald-700 font-bold">99.9%</td><td className="py-2">多实例 + 健康检查 + 自动恢复</td></tr>
                </tbody>
              </table>
            </div>
          </SubSection>

          <SubSection title="2.2 架构方案">
            <div className="bg-zinc-950 text-zinc-300 rounded-lg p-5 font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-pre">
{`┌──────────────────────────────────────────────────────────┐
│                   Nginx / 云 SLB (负载均衡)                │
│            SSL 终止 · 限流(IP+AppKey) · 路由               │
└────────────────────────┬─────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
   ┌─────────────┐┌─────────────┐┌─────────────┐
   │ MCP Server  ││ MCP Server  ││ MCP Server  │  ← 无状态，可水平扩展
   │ Instance #1 ││ Instance #2 ││ Instance #N │
   └──────┬──────┘└──────┬──────┘└──────┬──────┘
          │              │              │
          └──────────────┼──────────────┘
                         │
          ┌──────────────┼──────────────────────┐
          ▼              ▼                      ▼
   ┌─────────────┐┌──────────────┐  ┌───────────────────┐
   │ Redis 6.x   ││  阿里云 OSS  │  │  驰声 eval API    │
   │ · 任务队列   ││  · 音频存储  │  │  eval.cloud.chivox│
   │ · 配额计数   ││  · 5min TTL  │  │  · 连接池          │
   │ · 结果缓存   ││  · CDN加速   │  │  · 熔断器          │
   │ · 分布式锁   ││              │  │  · 重试 (3次)      │
   └─────────────┘└──────────────┘  └───────────────────┘
                                            │
                                    ┌───────┴───────┐
                                    ▼               ▼
                            ┌────────────┐  ┌────────────┐
                            │ LLM 网关   │  │  评测结果    │
                            │(可选,P1)   │  │  返回 AI    │
                            │ GPT-4/Claude│ └────────────┘
                            │ 令牌桶限流  │
                            └────────────┘`}
            </div>
          </SubSection>

          <SubSection title="2.3 关键技术方案">
            <DetailCard
              title="音频上传 → 对象存储迁移"
              items={[
                '将 /upload 从本地磁盘改为直传 OSS（阿里云 / AWS S3 兼容）',
                '上传流程：客户端 → MCP Server → 生成 presigned URL → 客户端直传 OSS（减少 Server 带宽压力）',
                '替代方案：Server 端中转上传（兼容现有 MCP 协议，客户端无需改造），在 Server 端流式转发到 OSS',
                'OSS 生命周期规则：5 分钟自动删除（与现有逻辑一致）',
                '音频 ID 改用 UUID v7（时间有序，方便排查）+ AppKey 前缀（方便按租户查询）',
                '压缩逻辑保留：>500KB 的文件在 Server 端压缩后再存入 OSS',
              ]}
            />
            <DetailCard
              title="分布式任务队列 (Redis + Bull/BullMQ)"
              items={[
                '评测请求入队 → Worker 消费 → 调用驰声 eval API → 结果写回',
                '队列配置：maxConcurrent=50（可调）, 单 Worker 并发=10, 超时=30s',
                '优先级队列：付费用户优先级 > 免费用户（按 AppKey 套餐识别）',
                '死信队列(DLQ)：超时/失败 3 次的任务进入 DLQ，人工排查',
                '队列积压告警：积压 >100 时触发告警（钉钉/飞书 Webhook）',
                '评测结果缓存：SHA256(audioBlob + refText) 作为 key，缓存 10 分钟，相同内容不重复评测',
              ]}
            />
            <DetailCard
              title="驰声 eval API 连接池 & 熔断"
              items={[
                '现状：每次评测新建 HTTP 连接，无复用，高延迟',
                '方案：使用 undici/got 的连接池，keep-alive 复用，pool size=20',
                '熔断器（Circuit Breaker）：连续 5 次失败 → 打开熔断 → 30s 后半开 → 探测恢复',
                '超时设置：connect 3s / response 15s / 总超时 20s',
                '重试策略：指数退避（1s → 2s → 4s），最多 3 次，仅对 5xx/网络错误重试',
                '降级响应：熔断期间返回 503 + Retry-After header，客户端可感知',
              ]}
            />
            <DetailCard
              title="LLM 并发调用方案（P1 · 可选增值服务）"
              items={[
                '场景：未来如果提供「评测+AI分析」一站式 API，Server 端需调用 LLM',
                '问题：LLM API 有严格 rate limit（GPT-4: ~500 RPM, Claude: ~1000 RPM），且单次调用 1-5s',
                '方案 A — 令牌桶限流：每个 AppKey 分配 LLM token 桶（免费 10 RPM / 专业 100 RPM / 企业 500 RPM）',
                '方案 B — 异步模式：评测立即返回 score，LLM 分析异步处理，通过 Webhook/轮询获取结果',
                '方案 C — 缓存 Prompt 模板：相似评测结果（如 accuracy<60 且 /θ/ 音素弱）命中相同 Prompt 模板，缓存 LLM 响应',
                '成本预估：GPT-4o-mini ~$0.15/1M token，单次分析约 500 token → $0.000075/次，5万次/月 ≈ ¥27（可控）',
                'Provider 降级：主用 GPT-4o-mini → 降级 Claude Haiku → 最终降级到本地小模型（Qwen-7B）',
              ]}
            />
          </SubSection>
        </Section>

        {/* ═══ 3 · MCP Server 功能细化 ═══ */}
        <Section n={3} title="MCP Server 功能细化">
          <SubSection title="3.1 已上线工具（7 + 3 辅助）">
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm border-collapse">
                <thead><tr className="border-b border-zinc-200">
                  <th className="text-left py-2 pr-3 font-semibold">工具名</th>
                  <th className="text-left py-2 pr-3 font-semibold">题型 ID</th>
                  <th className="text-left py-2 pr-3 font-semibold">时长</th>
                  <th className="text-left py-2 font-semibold">待优化项</th>
                </tr></thead>
                <tbody className="divide-y divide-zinc-100">
                  {[
                    ['evaluate_english_word','en.word.score','<20s','增加音素级 detail 返回'],
                    ['evaluate_english_sentence','en.sent.score','≤40s','增加连读/重弱读标注'],
                    ['evaluate_english_paragraph','en.pred.score','≤300s','分句评分 + 整体流利度曲线'],
                    ['evaluate_english_word_pron','en.word.pron','<20s','多读/漏读/错读位置高亮'],
                    ['evaluate_english_sentence_pron','en.sent.pron','≤40s','同上，句子级别'],
                    ['evaluate_english_phonics','en.nsp.score','<20s','拼读规则匹配度'],
                    ['evaluate_chinese','cn.word/sent','<60s','声调评分细化(1-4声)'],
                  ].map(([tool,id,dur,opt])=>(
                    <tr key={tool}><td className="py-2 pr-3 font-mono text-xs">{tool}</td><td className="py-2 pr-3 font-mono text-xs">{id}</td><td className="py-2 pr-3">{dur}</td><td className="py-2 text-zinc-600">{opt}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SubSection>

          <SubSection title="3.2 新增功能（本月交付）">
            <DetailCard
              title="音频质量预检 (audio_precheck)"
              tag="NEW"
              items={[
                '目的：在评测前自动检测音频质量，避免静音/噪声/格式错误浪费评测配额',
                '检测项：静音比例 >80% → 拒绝 | 信噪比 <10dB → 警告 | 采样率 <8kHz → 拒绝 | 时长=0 → 拒绝',
                '返回值：{ valid: boolean, issues: string[], suggestions: string[] }',
                '集成方式：在 evaluate_xxx 内部自动调用，也可独立作为 MCP tool 暴露给 AI',
                '工作量估算：2 人日（核心逻辑 + 单元测试）',
              ]}
            />
            <DetailCard
              title="评测结果解释模式 (explain_score)"
              tag="NEW"
              items={[
                '目的：让 AI 理解「为什么这个分数是 65 分」，而不只是得到一个数字',
                '原理：对评测 detail 进行规则化归因 → 生成自然语言解释',
                '示例输出："accuracy 65 分的主要原因：/θ/ 发成 /s/ (3处)，/r/ 卷舌不足 (2处)，元音 /æ/ 偏短"',
                '不依赖 LLM：纯规则引擎，零成本，低延迟（<100ms）',
                '价值：降低 LLM 的 Prompt 工程成本，AI 客户端可直接展示，无需二次分析',
                '工作量估算：3 人日（规则库 + 中英文模板 + 测试）',
              ]}
            />
            <DetailCard
              title="批量评测接口 (batch_evaluate)"
              tag="NEW"
              items={[
                '场景：教育 App 班级 30-50 人同时交作业，需要一次提交多个评测任务',
                '接口设计：POST /mcp → batch_evaluate({ items: [{ audioId, text, type }], callbackUrl? })',
                '同步模式（≤5 条）：等待全部完成后返回结果数组',
                '异步模式（>5 条）：立即返回 batchId，通过 Webhook 或 get_batch_result(batchId) 获取',
                '并发控制：单次 batch 内部并行度=10，避免一个 batch 占满全部 Worker',
                '进度查询：get_batch_progress(batchId) → { total: 30, completed: 18, failed: 1 }',
                '工作量估算：5 人日（队列编排 + 回调 + 进度追踪 + 压测）',
              ]}
            />
            <DetailCard
              title="发音对比 (compare_pronunciation)"
              tag="NEW · 你可能没想到"
              items={[
                '场景：学生练习后再录一次，想看到「前后对比」进步了多少',
                '接口：compare_pronunciation({ audioId1, audioId2, text }) → { before, after, improved, regressed }',
                '输出示例：{ before: { overall: 62 }, after: { overall: 78 }, improved: ["/θ/: 40→72", "fluency: 58→81"], regressed: ["speed: 偏快了"] }',
                '价值：教育产品核心「成就感」来源，极大提升用户粘性',
                '工作量估算：2 人日（两次评测结果 diff 逻辑 + 格式化）',
              ]}
            />
            <DetailCard
              title="学习进度追踪 (learning_progress)"
              tag="NEW · 你可能没想到"
              items={[
                '场景：AI 教师想了解「这个学生最近一周的发音趋势」以生成个性化计划',
                '前提：需要 AppKey + userId 维度的评测历史存储（Redis sorted set / 数据库）',
                '接口：learning_progress({ userId, days: 7 }) → { trend: [...], weakPoints: [...], suggestion }',
                '存储设计：每次评测结果摘要存入 Redis ZSET（score=timestamp），最多保留 90 天',
                '数据量估算：每条摘要约 200 bytes，单用户 100 条/月 = 20KB → 1 万用户 = 200MB（Redis 可承受）',
                '工作量估算：4 人日（存储层 + 聚合逻辑 + MCP tool 定义）',
              ]}
            />
          </SubSection>

          <SubSection title="3.3 错误码标准化">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead><tr className="border-b border-zinc-200">
                  <th className="text-left py-2 pr-4 font-semibold">错误码</th>
                  <th className="text-left py-2 pr-4 font-semibold">HTTP</th>
                  <th className="text-left py-2 pr-4 font-semibold">含义</th>
                  <th className="text-left py-2 font-semibold">客户端处理</th>
                </tr></thead>
                <tbody className="divide-y divide-zinc-100">
                  {[
                    ['AUDIO_EXPIRED','410','音频已过期/已删除','重新上传'],
                    ['AUDIO_INVALID','400','音频格式/质量不合格','提示用户重录'],
                    ['QUOTA_EXCEEDED','429','调用配额已用完','提示升级套餐'],
                    ['RATE_LIMITED','429','请求频率超限','按 Retry-After 等待'],
                    ['EVAL_TIMEOUT','504','评测超时（>20s）','自动重试 1 次'],
                    ['EVAL_FAILED','502','驰声 API 返回错误','自动重试 + 报告'],
                    ['SERVER_BUSY','503','队列满/熔断中','指数退避重试'],
                    ['AUTH_INVALID','401','AppKey 无效/过期','检查 Key'],
                    ['AUTH_MISSING','401','未携带 Authorization','添加 Header'],
                    ['BATCH_TOO_LARGE','400','批量超过 50 条','拆分提交'],
                  ].map(([code,http,desc,action])=>(
                    <tr key={code}><td className="py-2 pr-4 font-mono text-xs text-red-700">{code}</td><td className="py-2 pr-4 font-mono text-xs">{http}</td><td className="py-2 pr-4">{desc}</td><td className="py-2 text-zinc-600">{action}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SubSection>
        </Section>

        {/* ═══ 4 · 鉴权 & 计费 ═══ */}
        <Section n={4} title="鉴权 & 计费体系">
          <SubSection title="4.1 AppKey 鉴权方案">
            <DetailCard
              title="鉴权流程"
              items={[
                '请求头格式：Authorization: Bearer {appKey}:{timestamp}:{signature}',
                'Signature = HMAC-SHA256(appSecret, method + path + timestamp + body_hash)',
                '简化模式（初期）：Authorization: Bearer {appKey}（先上最简版，再迭代签名）',
                'AppKey 格式：chx_{env}_{random16}（如 chx_prod_a1b2c3d4e5f6g7h8）',
                'AppSecret 格式：chxs_{random32}（仅在注册时展示一次，不可再次查看）',
                'Key 轮转：支持同时存在 2 个有效 Key（新旧交替期），旧 Key 30 天后失效',
              ]}
            />
            <DetailCard
              title="配额管控实现"
              items={[
                '计数器：Redis INCR + EXPIRE（key=quota:{appKey}:{yyyy-MM}, TTL=35天）',
                '检查时机：请求进入时先检查配额 → 配额不足直接返回 429 → 不消耗队列资源',
                '扣减时机：评测成功后扣减（失败不扣，避免因服务端问题消耗用户配额）',
                '配额预警：80% 时邮件提醒 → 90% 时站内通知 → 100% 时拒绝 + 429',
                '超额宽限：允许超额 5%（避免整点卡配额的极端体验）',
                '并发限制：免费 2 / 专业 10 / 企业 50（基于 Redis 滑动窗口计数器）',
              ]}
            />
          </SubSection>

          <SubSection title="4.2 定价细化">
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm border-collapse">
                <thead><tr className="border-b border-zinc-200">
                  <th className="text-left py-2 pr-3 font-semibold">维度</th>
                  <th className="text-left py-2 pr-3 font-semibold">免费版</th>
                  <th className="text-left py-2 pr-3 font-semibold bg-zinc-50">专业版 ¥99/月</th>
                  <th className="text-left py-2 font-semibold">企业版（定制）</th>
                </tr></thead>
                <tbody className="divide-y divide-zinc-100">
                  {[
                    ['月调用量','1,000 次','50,000 次','无限'],
                    ['并发数','2','10','50+'],
                    ['评测工具','基础 3 项(word/sent/cn)','全部 7 项','全部 + 定制'],
                    ['纠音/拼读','✗','✓','✓'],
                    ['批量评测','✗','≤20条/批','≤50条/批'],
                    ['LLM 分析 API','✗','100 次/月','无限'],
                    ['发音对比','✗','✓','✓'],
                    ['学习进度','✗','30 天历史','90 天历史'],
                    ['结果缓存','10 分钟','1 小时','自定义'],
                    ['优先队列','✗','✓','最高优先'],
                    ['技术支持','GitHub Issue','邮件 48h 响应','7×24 专属群'],
                    ['SLA','无','99.5%','99.9%+'],
                    ['数据导出','✗','JSON','JSON + PDF 报告'],
                    ['超额计费','不可超额','¥0.003/次','协商'],
                  ].map(([dim,...vals])=>(
                    <tr key={dim}>
                      <td className="py-1.5 pr-3 font-medium text-xs">{dim}</td>
                      {vals.map((v,i)=>(
                        <td key={i} className={`py-1.5 pr-3 text-xs ${i===1?'bg-zinc-50':''}`}>{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SubSection>

          <SubSection title="4.3 收入预估（保守）">
            <div className="bg-zinc-50 rounded-lg p-5 text-sm space-y-2">
              <p><strong>假设：</strong>上线 2 个月内获取 200 个注册开发者，其中 10% 转化为专业版。</p>
              <p>· 免费用户 180 人 × 1,000 次 = 18 万次调用/月（成本可控，按单次评测成本 ¥0.001 计 = ¥180/月）</p>
              <p>· 专业版 20 人 × ¥99 = <strong>¥1,980/月</strong></p>
              <p>· 超额调用 20 人 × 均超额 5,000 次 × ¥0.003 = <strong>¥300/月</strong></p>
              <p>· 企业版（首年目标 2 家）= 预计 <strong>¥5,000-20,000/月</strong></p>
              <p className="font-semibold mt-2">月收入预估：¥7,000 - ¥22,000（不含企业定制项目收入）</p>
            </div>
          </SubSection>
        </Section>

        {/* ═══ 5 · 开发者网站 & 文档站 ═══ */}
        <Section n={5} title="开发者网站 & 文档站">
          <SubSection title="5.1 文档站细化（本月交付）">
            <DetailCard
              title="文档站结构（基于 Fumadocs / Nextra）"
              items={[
                '/ 快速开始 — 5 分钟接入 MCP（含视频/GIF）',
                '/ 配置指南 / Cursor — 截图 + 分步说明',
                '/ 配置指南 / Claude Desktop — 同上',
                '/ 配置指南 / 豆包·钉钉·其他 — 通用配置说明',
                '/ API 参考 / 音频上传 — 端点、参数、响应示例、错误码',
                '/ API 参考 / 评测工具 — 每个 tool 独立一页（参数表 + 示例对话 + 响应 JSON）',
                '/ API 参考 / 批量评测 — 同步/异步模式、回调格式',
                '/ API 参考 / 辅助工具 — server_status / list_eval_types',
                '/ 评测结果 — 各指标含义、分数范围、detail 字段说明',
                '/ 最佳实践 / Prompt 模板 — 推荐的 LLM Prompt 模板（教学反馈/纠音建议/练习生成）',
                '/ 最佳实践 / 错误处理 — 常见错误码及处理方式',
                '/ 示例代码 — cURL / Python / JavaScript / Go 四种语言',
                '/ 更新日志 — 版本变更记录',
              ]}
            />
            <DetailCard
              title="Prompt 模板库（你可能没想到 · 高价值）"
              tag="NEW"
              items={[
                '为什么做：开发者接入 MCP 后最大痛点是「不知道怎么写 Prompt 让 LLM 分析评测结果」',
                '模板 1 — 发音诊断：输入 score JSON → 输出逐项分析 + 弱项定位 + 严重程度评级',
                '模板 2 — 练习生成：输入弱项列表 → 输出绕口令/最小对立对/跟读材料',
                '模板 3 — 学习报告：输入近 7 天评测历史 → 输出趋势图描述 + 下周练习计划',
                '模板 4 — 考试场景：输入全班评测结果 → 输出班级分析 + 共性问题 + 教学建议',
                '模板 5 — 少儿场景：输入评测结果 → 输出趣味鼓励 + 游戏化练习建议（语气活泼）',
                '价值：降低开发者 80% 的 Prompt 工程成本，提升接入转化率',
              ]}
            />
          </SubSection>

          <SubSection title="5.2 开发者注册 & 控制台">
            <DetailCard
              title="注册流程"
              items={[
                '注册方式：邮箱 + 验证码（初期），后续支持 GitHub OAuth',
                '注册信息：邮箱、密码、用途描述（个人/企业）、公司名（可选）',
                '注册后自动创建：1 个免费版 AppKey + 欢迎邮件 + 引导到快速开始文档',
                '邮箱验证：24 小时内未验证 → 限制 API 调用至 100 次/天',
              ]}
            />
            <DetailCard
              title="控制台功能"
              items={[
                '概览面板：本月调用量(已用/总量)、今日请求数、今日错误率、P99 延迟',
                'AppKey 管理：查看/创建/禁用 Key、查看 Secret（仅创建时）、Key 轮转',
                '用量详情：按天/小时折线图、按 tool 分布饼图、Top 10 错误码',
                '套餐管理：当前套餐、升级/降级、账单历史',
                '评测记录：最近 100 条评测的 audioId / tool / score / 耗时（脱敏）',
                '告警设置：配额 80%/90%/100% 通知、错误率突增通知',
              ]}
            />
          </SubSection>

          <SubSection title="5.3 官网优化（本月）">
            <DetailCard
              title="SEO & 性能"
              items={[
                '各页面添加 meta title/description/og:image（中英文分别优化）',
                'JSON-LD 结构化数据（Organization + Product + FAQ）',
                'sitemap.xml + robots.txt 自动生成',
                '图片全部用 next/image 优化 + WebP 自动转换',
                'Lighthouse 目标：Performance >90 / SEO 100 / Accessibility >90',
                '添加 Google Analytics / 百度统计（了解哪些页面转化率高）',
              ]}
            />
            <DetailCard
              title="你可能没想到的页面"
              tag="NEW"
              items={[
                'Status Page（状态页）：实时展示服务可用性，API 响应时间图表 → 建立信任',
                'Changelog 页：每次版本更新都有记录，开发者可订阅 RSS → 体现活跃度',
                'Showcase 页：展示用 MCP 构建的应用截图 + 链接 → 激发开发者灵感',
                'Blog / 教程页：深度教程如「如何用 MCP + GPT-4 构建 AI 口语教练」→ SEO 引流',
              ]}
            />
          </SubSection>
        </Section>

        {/* ═══ 6 · 在线体验 ═══ */}
        <Section n={6} title="在线体验（真实接入）">
          <SubSection title="6.1 真实录音评测方案">
            <DetailCard
              title="前端录音 → 实时评测 → LLM 分析"
              items={[
                '录音：Web Audio API + MediaRecorder，输出 webm/opus → 后端转 mp3',
                '浏览器兼容：Chrome 60+ / Safari 14+ / Firefox 76+ / Edge 80+（覆盖 >98%）',
                '录音交互：按住录音 / 点击录音（自动 VAD 检测停顿 2s 结束）',
                '上传：录音完成后 POST /upload → 获取 audioId',
                '评测：调用 evaluate_xxx → 拿到分数 + detail',
                'LLM 分析：将评测结果 + Prompt 模板发送到服务端 LLM 网关 → 流式返回分析文本',
                '用户体验：录音(2-5s) → 评测动画(1-3s) → 分数展示 → 「深度分析」按钮 → AI 逐字输出(2-5s) → 练习建议',
              ]}
            />
            <DetailCard
              title="防滥用措施（你可能没想到）"
              tag="重要"
              items={[
                '未登录用户：每 IP 每天限 10 次体验（Cloudflare 边缘限流）',
                '登录用户：消耗免费配额',
                '录音限制：最短 1s / 最长 30s（防止上传超长/空白音频）',
                '音频大小限制：前端裁剪至 5MB 以内',
                '频率限制：同一 session 最多 1 次/10s（防止脚本刷）',
                'Captcha：连续 3 次后触发 hCaptcha 验证',
              ]}
            />
          </SubSection>
        </Section>

        {/* ═══ 7 · 监控告警 ═══ */}
        <Section n={7} title="监控、告警与运维">
          <SubSection title="7.1 可观测性三件套">
            <DetailCard
              title="Metrics（指标）"
              items={[
                '工具：Prometheus + Grafana（或阿里云 ARMS）',
                '核心指标：QPS（按 tool 分组）/ P50/P95/P99 延迟 / 错误率 / 队列深度 / 活跃连接数',
                '业务指标：日活 AppKey 数 / 日评测量 / 日新增注册 / 配额消耗率',
                '仪表盘：总览 / 按 AppKey / 按 Tool / 按错误码',
              ]}
            />
            <DetailCard
              title="Logging（日志）"
              items={[
                '格式：JSON structured log（timestamp, requestId, appKey, tool, duration, statusCode）',
                '聚合：ELK 或阿里云 SLS',
                '每个请求携带唯一 requestId（UUID），从入口到 eval API 全链路透传',
                '敏感信息脱敏：appSecret 永远不打日志，audioId 保留但 audio 内容不记录',
              ]}
            />
            <DetailCard
              title="Alerting（告警）"
              items={[
                '错误率 >5% 持续 2 分钟 → P1 告警（钉钉群 @ 值班人）',
                'P99 延迟 >10s 持续 5 分钟 → P2 告警',
                '队列积压 >100 持续 3 分钟 → P1 告警',
                'eval API 熔断触发 → P0 告警（可能是上游故障）',
                '存储使用率 >80% → P2 告警（虽然迁移 OSS 后不太会触发）',
                '某 AppKey 突发流量 >10x 正常值 → 可能被攻击，自动限流 + P2 告警',
              ]}
            />
          </SubSection>
        </Section>

        {/* ═══ 8 · 安全合规 ═══ */}
        <Section n={8} title="安全与合规">
          <DetailCard
            title="安全清单"
            items={[
              'HTTPS Everywhere：所有端点强制 HTTPS，HSTS header（已完成）',
              'AppKey 存储：服务端用 bcrypt hash 存储，明文仅在创建时返回一次',
              '音频隐私：评测完成立即删除（5 分钟 TTL），不做任何留存和二次使用',
              'CORS 策略：仅允许白名单域名（speech-eval.site + 付费用户自定义域名）',
              'Rate Limit 多层：Nginx 层(IP) + 应用层(AppKey) + 业务层(配额)',
              'SQL 注入/XSS：MCP Server 无数据库直连（Redis 只存 KV），风险极低',
              '依赖审计：npm audit + Dependabot 自动扫描',
              'DDoS：Cloudflare / 云盾基础防护',
              '日志合规：用户音频内容不入日志，仅记录 audioId + 评测元数据',
              '数据导出/删除：企业版支持用户请求删除所有评测记录（GDPR Article 17）',
            ]}
          />
        </Section>

        {/* ═══ 9 · 4 周 Sprint 排期 ═══ */}
        <Section n={9} title="4 周 Sprint 排期 (4/14 → 5/9)">
          <p className="text-sm text-zinc-600 mb-6">假设团队配置：后端 2 人 + 前端 1 人 + 0.5 测试/运维。人日标注为预估值。</p>

          <SprintWeek
            week={1}
            date="4/14 - 4/18"
            theme="基础设施 & 鉴权"
            tasks={[
              { day: '周一', items: ['OSS 存储对接（音频上传改为 OSS 中转）—— 后端 1 人', '本地开发环境搭建 Redis + OSS mock —— 后端 1 人'] },
              { day: '周二', items: ['分布式任务队列搭建（BullMQ + Redis）—— 后端 1 人', 'AppKey 数据模型设计 + 注册接口 —— 后端 1 人'] },
              { day: '周三', items: ['MCP Server 无状态改造（去除本地存储依赖）—— 后端 1 人', 'AppKey 鉴权中间件（解析 Header, 校验, 注入上下文）—— 后端 1 人'] },
              { day: '周四', items: ['配额计数器（Redis INCR + 月度 Key）—— 后端 1 人', '开发者注册页面（邮箱+密码+验证码）—— 前端 1 人'] },
              { day: '周五', items: ['连接池 + 熔断器 + 重试逻辑 —— 后端 1 人', '注册流程联调 + 冒烟测试 —— 全员', '本周回顾 & 下周计划'] },
            ]}
          />

          <SprintWeek
            week={2}
            date="4/21 - 4/25"
            theme="功能增强 & 文档站"
            tasks={[
              { day: '周一', items: ['错误码标准化（10 种错误码 + 中间件统一包装）—— 后端 1 人', '文档站搭建（Fumadocs/Nextra 脚手架 + 导航结构）—— 前端 1 人'] },
              { day: '周二', items: ['音频质量预检 (audio_precheck) 开发 —— 后端 1 人', '文档站内容：快速开始 + 配置指南（Cursor/Claude/豆包）—— 前端 1 人'] },
              { day: '周三', items: ['评测结果解释模式 (explain_score) 规则引擎 —— 后端 1 人', '文档站内容：API 参考（7 个评测工具 + 音频上传）—— 前端 1 人'] },
              { day: '周四', items: ['批量评测 (batch_evaluate) 接口 + 队列编排 —— 后端 2 人'], },
              { day: '周五', items: ['批量评测异步模式 + Webhook 回调 —— 后端 1 人', 'Prompt 模板库编写（5 个模板 + 示例）—— 前端/产品 1 人', '文档站 + 新功能联调'] },
            ]}
          />

          <SprintWeek
            week={3}
            date="4/28 - 5/2"
            theme="在线体验 & 控制台 & 监控"
            tasks={[
              { day: '周一', items: ['前端录音组件（Web Audio API + MediaRecorder）—— 前端 1 人', '开发者控制台 - 概览面板 + AppKey 管理页 —— 后端 1 人'] },
              { day: '周二', items: ['录音 → 上传 → 评测 → 展示 全链路联调 —— 前端 1 人 + 后端 1 人', '控制台 - 用量图表（日/小时折线 + tool 分布饼图）—— 后端 1 人'] },
              { day: '周三', items: ['在线体验接入 LLM 分析（服务端 LLM 网关 + 流式返回）—— 后端 1 人', '控制台 - 套餐管理 + 评测记录 —— 前端 1 人'] },
              { day: '周四', items: ['Prometheus 指标埋点（QPS/延迟/错误率/队列深度）—— 后端 1 人', '防滥用措施（IP 限流 + 录音限制 + hCaptcha 集成）—— 前端 1 人'] },
              { day: '周五', items: ['Grafana 仪表盘搭建 + 告警规则配置 —— 运维', 'JSON structured logging + requestId 全链路透传 —— 后端 1 人', '五一假期前代码 freeze & staging 环境部署'] },
            ]}
          />

          <SprintWeek
            week={4}
            date="5/5 - 5/9"
            theme="压测、修复、上线"
            tasks={[
              { day: '周一', items: ['压测：k6/wrk 模拟 100 并发评测（发现瓶颈 → 调优）—— 后端 2 人', '发音对比 + 学习进度 功能开发 —— 后端 1 人'] },
              { day: '周二', items: ['压测问题修复 + 连接池/队列参数调优 —— 后端 2 人', 'SEO 优化（meta/JSON-LD/sitemap）+ Analytics 集成 —— 前端 1 人'] },
              { day: '周三', items: ['全量回归测试（7 个评测工具 × 中英文 × 正常/异常 case）—— 测试', '文档站最终校对 + 示例代码验证 —— 前端 1 人'] },
              { day: '周四', items: ['Production 环境部署（多实例 + SLB + Redis + OSS）—— 运维 + 后端', 'DNS 切换 + HTTPS 证书 + CDN 配置 —— 运维'] },
              { day: '周五', items: ['灰度放量：先导 10% 流量到新版 → 观察指标 → 全量 —— 全员', '上线后 2 小时值守 + 监控观察', '本月回顾 & 下月规划文档'] },
            ]}
          />
        </Section>

        {/* ═══ 10 · 风险预案 ═══ */}
        <Section n={10} title="风险 & 预案">
          <div className="space-y-3">
            {[
              {
                risk: '驰声 eval API 不稳定/响应慢',
                prob: '中',
                impact: '高',
                plan: '熔断器 + 降级响应（返回缓存结果或提示稍后重试）。长期：与 eval API 团队建立 SLA 沟通机制，获取维护窗口通知。',
              },
              {
                risk: '并发压力超预期（如某教育 App 突然导流）',
                prob: '低',
                impact: '高',
                plan: '自动扩缩容（K8s HPA 或云函数弹性）+ 按 AppKey 并发限制（防止单租户打爆全局）+ 优先队列保障付费用户。',
              },
              {
                risk: 'LLM API 故障/限流',
                prob: '中',
                impact: '中',
                plan: 'Multi-provider 降级（GPT → Claude → 本地模型）+ LLM 分析标记为「增值」而非「必需」，评测本身不依赖 LLM。',
              },
              {
                risk: '音频数据泄露',
                prob: '低',
                impact: '极高',
                plan: 'OSS 加密存储 + 5min TTL 删除 + presigned URL 限时访问 + 日志脱敏 + 安全审计。',
              },
              {
                risk: '开发周期超时（4 周不够）',
                prob: '中',
                impact: '中',
                plan: '按优先级裁剪：P0（鉴权+OSS+队列+文档站）必须交付，P1（在线体验真实接入+LLM网关+控制台图表）可延至下月。',
              },
              {
                risk: 'AppKey 被盗用/滥用',
                prob: '中',
                impact: '中',
                plan: '异常流量检测（10x 突增告警）+ IP 白名单（企业版）+ Key 即时禁用能力 + 使用模式分析。',
              },
              {
                risk: '定价不合理导致转化率低',
                prob: '中',
                impact: '中',
                plan: '初期保持免费额度充足（1000次/月），专业版提供 14 天免费试用。收集用户反馈 2 周后调整价格和额度。',
              },
            ].map((r, i) => (
              <div key={i} className="border border-zinc-200 rounded-lg p-4 text-sm">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <span className="font-semibold">{r.risk}</span>
                  <div className="flex gap-1.5 shrink-0">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${r.prob === '高' ? 'bg-red-100 text-red-700' : r.prob === '中' ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-600'}`}>概率{r.prob}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${r.impact === '极高' || r.impact === '高' ? 'bg-red-100 text-red-700' : r.impact === '中' ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-600'}`}>影响{r.impact}</span>
                  </div>
                </div>
                <p className="text-zinc-600"><strong className="text-zinc-700">预案：</strong>{r.plan}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ═══ 11 · Open Questions ═══ */}
        <Section n={11} title="Open Questions（待讨论）">
          <div className="space-y-2">
            {[
              'eval API 的实际并发承载能力是多少？需要与 eval 团队确认，决定我们队列的 maxConcurrent 参数。',
              '是否需要服务端集成 LLM（提供一站式 API），还是继续让客户端自行调 LLM？前者增加复杂度和成本，后者降低产品一致性。',
              '专业版定价 ¥99/月是否合适？竞品参考？是否需要年付折扣（如 ¥999/年 = 8.3 折）？',
              '免费版 1000 次/月 是否太多/太少？太多 → 没人付费；太少 → 开发者无法充分测试。',
              '企业版是否需要支持私有化部署？如果要，部署文档 + Docker 镜像 + Helm Chart 的工作量需额外评估（预估 2-3 周）。',
              '是否需要支持 WebSocket 实时评测（用户边说边看分数变化）？当前 HTTP 模式延迟约 2-5s，WebSocket 可做到逐句反馈。技术可行但需要较大改造。',
              '学习进度数据需要保留多久？90 天意味着需要持久化存储（MySQL/PostgreSQL），纯 Redis 有内存压力。',
              '是否需要考虑海外节点？如果有海外教育客户，新加坡/美西节点可显著降低延迟。',
              'GitHub 开源策略：MCP Server 是否开源？开源可建立社区信任但暴露实现细节。折中方案：开源 SDK + 闭源 Server。',
              '音频存储合规：是否需要等保认证？教育行业客户可能有此要求。',
            ].map((q, i) => (
              <div key={i} className="flex items-start gap-3 text-sm border-b border-zinc-100 pb-2.5">
                <span className="text-xs font-mono text-zinc-400 mt-0.5 shrink-0">Q{i + 1}</span>
                <p className="text-zinc-700">{q}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Footer */}
        <div className="border-t border-zinc-200 pt-6 mt-8 text-xs text-zinc-400">
          <p>本文档仅供内部使用，请勿外传。</p>
          <p className="mt-1">v2 · 最后更新：2026-04-09 · 驰声信息科技</p>
        </div>
      </div>
    </main>
  );
}

/* ── 复用组件 ── */

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-16">
      <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
        <span className="h-6 w-6 rounded bg-zinc-900 text-white text-xs flex items-center justify-center font-mono shrink-0">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

function KV({ items }: { items: [string, string][] }) {
  return (
    <div className="bg-zinc-50 rounded-lg p-5 text-sm space-y-2">
      {items.map(([k, v]) => (
        <p key={k}><strong>{k}：</strong>{v}</p>
      ))}
    </div>
  );
}

function ProblemList({ items }: { items: { problem: string; detail: string; impact: string }[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.problem} className="border-l-2 border-red-400 pl-4 py-1">
          <p className="text-sm font-semibold text-red-800">{item.problem}</p>
          <p className="text-sm text-zinc-600 mt-0.5">{item.detail}</p>
          <p className="text-xs text-red-600 mt-1">影响：{item.impact}</p>
        </div>
      ))}
    </div>
  );
}

function DetailCard({ title, items, tag }: { title: string; items: string[]; tag?: string }) {
  return (
    <div className="border border-zinc-200 rounded-lg p-4 mb-3">
      <div className="flex items-center gap-2 mb-2">
        <p className="text-sm font-semibold">{title}</p>
        {tag && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            tag.includes('NEW') ? 'bg-blue-100 text-blue-700'
              : tag === '重要' ? 'bg-red-100 text-red-700'
              : 'bg-zinc-100 text-zinc-600'
          }`}>{tag}</span>
        )}
      </div>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-zinc-600 flex items-start gap-2">
            <span className="text-zinc-300 mt-0.5 shrink-0">·</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SprintWeek({ week, date, theme, tasks }: {
  week: number;
  date: string;
  theme: string;
  tasks: { day: string; items: string[] }[];
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-3">
        <span className="h-8 w-8 rounded-full bg-zinc-900 text-white text-xs flex items-center justify-center font-mono shrink-0">W{week}</span>
        <div>
          <p className="text-sm font-semibold">{date} · {theme}</p>
        </div>
      </div>
      <div className="ml-4 border-l border-zinc-200 pl-6 space-y-3">
        {tasks.map((t) => (
          <div key={t.day}>
            <p className="text-xs font-bold text-zinc-500 mb-1">{t.day}</p>
            <ul className="space-y-0.5">
              {t.items.map((item, i) => (
                <li key={i} className="text-sm text-zinc-600 flex items-start gap-2">
                  <span className="text-zinc-300 mt-0.5 shrink-0">○</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
