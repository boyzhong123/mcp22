'use client';

import { useState, useEffect, useRef } from 'react';
import { Settings, FileText, MessageSquare, Brain, Waves, Sparkles, Plug, Code2, Rocket } from 'lucide-react';
import { useLocale } from 'next-intl';

type TabKey = 'dev' | 'user';

type Step = {
  num: string;
  title: string;
  desc: string;
  icon: React.ElementType;
  role: { label: string; tone: string };
  panel: {
    filename: string;
    content: React.ReactNode;
  };
};

// ─── 开发场景：开发者"做一次"的事 ───
const DEV_STEPS: Step[] = [
  {
    num: '01',
    title: '填一次 MCP 配置',
    desc: '不管宿主是代码框架（LangChain / Mastra / 自研 Agent）、可视化平台（Dify / Coze / n8n）还是 IDE 原生 Agent（Cursor / Claude Desktop / Windsurf）—— 填一次驰声 MCP 的地址和 API Key，宿主启动时会按 MCP 协议自动发现 16 个评测工具，不需要写一行 SDK 调用代码。',
    icon: Settings,
    role: { label: '开发者', tone: 'text-sky-400' },
    panel: {
      filename: 'mcp.json',
      content: (
        <>
          <span className="text-zinc-500">{'// 同一份配置，代码框架 / 可视化平台 / IDE Agent 通用'}</span>{'\n'}
          {'{'}{'\n'}
          {'  '}<span className="text-emerald-400">&quot;mcpServers&quot;</span>: {'{'}{'\n'}
          {'    '}<span className="text-emerald-400">&quot;chivox_voice_eval&quot;</span>: {'{'}{'\n'}
          {'      '}<span className="text-emerald-400">&quot;type&quot;</span>:   <span className="text-amber-300">&quot;streamable-http&quot;</span>,{'\n'}
          {'      '}<span className="text-emerald-400">&quot;url&quot;</span>:    <span className="text-amber-300">&quot;https://speech-eval.site/mcp&quot;</span>,{'\n'}
          {'      '}<span className="text-emerald-400">&quot;apiKey&quot;</span>: <span className="text-amber-300">&quot;sk-••••••••&quot;</span>{'\n'}
          {'    '}{'}'}{'\n'}
          {'  '}{'}'}{'\n'}
          {'}'}
          {'\n\n'}
          <span className="text-zinc-500">{'// ✓ LangChain / Mastra / Dify / Coze / Cursor / Claude Desktop ...'}</span>{'\n'}
          <span className="text-zinc-500">{'// ✓ 16 个评测工具自动注册到 LLM，无需二次封装'}</span>
        </>
      ),
    },
  },
  {
    num: '02',
    title: '写一段 System Prompt',
    desc: '告诉大模型三件事：①什么场景下该调用评测工具（识别到音频 + 参考文本时）；②结构化分数如何解读（音素级 dp_type、维度评分、speed 等字段的含义）；③以什么人设和语气把诊断讲给用户。这是整个接入里唯一需要动脑的环节，也是你的 Agent 产品差异化所在。',
    icon: FileText,
    role: { label: '开发者', tone: 'text-sky-400' },
    panel: {
      filename: 'system-prompt.md',
      content: (
        <>
          <span className="text-zinc-500">{'// 告诉 LLM：何时调用 · 如何解读 · 以什么口吻输出'}</span>{'\n'}
          {'\n'}
          <span className="text-emerald-400">你是一位英语口语教练。</span>{'\n'}
          {'\n'}
          当用户上传录音时：{'\n'}
          {'  '}<span className="text-violet-400">1.</span> 调用 <span className="text-amber-300">chivox_voice_eval</span> 系列工具评分{'\n'}
          {'  '}<span className="text-violet-400">2.</span> 聚焦 <span className="text-rose-400">score &lt; 70</span> 的词与 <span className="text-rose-400">dp_type</span> 异常{'\n'}
          {'  '}<span className="text-violet-400">3.</span> 将音素家族误读聚类为 <span className="text-emerald-400">可执行的纠音动作</span>{'\n'}
          {'  '}<span className="text-violet-400">4.</span> 产出 <span className="text-emerald-400">鼓励式诊断 + 个性化练习</span>{'\n'}
          {'\n'}
          <span className="text-zinc-500">{'// 风格：先肯定、再诊断、最后一步可执行练习'}</span>
        </>
      ),
    },
  },
  {
    num: '03',
    title: '部署 · 验证 · 收工',
    desc: '按宿主方式触发一次加载：代码框架重启进程、Dify / Coze / n8n 点"保存 / 发布"、Cursor / Claude Desktop 重启会话。发一条带音频的测试消息，看到工具被自动调用、返回结构化分数就算完成 —— 之后大模型会按上下文自主决定何时调用，接入方不再维护任何评测逻辑。',
    icon: Rocket,
    role: { label: '开发者', tone: 'text-sky-400' },
    panel: {
      filename: 'mcp-bootstrap.log',
      content: (
        <>
          <span className="text-zinc-500">{'// 宿主重启 / 发布后，MCP 客户端自动连接并拉取工具清单'}</span>{'\n'}
          {'\n'}
          <span className="text-zinc-400">[mcp ]</span> connecting <span className="text-amber-300">https://speech-eval.site/mcp</span>...{'\n'}
          <span className="text-zinc-400">[mcp ]</span> <span className="text-emerald-400">✓</span> handshake ok · protocol <span className="text-amber-300">streamable-http</span>{'\n'}
          <span className="text-zinc-400">[mcp ]</span> <span className="text-emerald-400">✓</span> listTools → <span className="text-amber-300">16</span> tools registered{'\n'}
          <span className="text-zinc-400">[mcp ]</span>   · <span className="text-sky-300">en.word.score</span>  · <span className="text-sky-300">en.sent.score</span>  · <span className="text-sky-300">en.pred.score</span>{'\n'}
          <span className="text-zinc-400">[mcp ]</span>   · <span className="text-sky-300">en.pqan.score</span>  · <span className="text-sky-300">en.scne.exam</span>  · <span className="text-sky-300">en.prtl.exam</span>{'\n'}
          <span className="text-zinc-400">[mcp ]</span>   · <span className="text-sky-300">cn.word.raw</span>   · <span className="text-sky-300">cn.sent.raw</span>    · <span className="text-sky-300">cn.pred.raw</span>{'\n'}
          <span className="text-zinc-400">[mcp ]</span>   · ...and <span className="text-amber-300">7</span> more{'\n'}
          {'\n'}
          <span className="text-zinc-500">{'// 发一条测试消息验证（任意宿主都一样）'}</span>{'\n'}
          <span className="text-emerald-400">user</span>  : 帮我打分：hello.mp3 · &quot;Hello world&quot;{'\n'}
          <span className="text-violet-400">llm</span>   : <span className="text-zinc-400">→ tools/call</span> <span className="text-amber-300">en.sent.score</span>{'\n'}
          <span className="text-rose-300">chivox</span>: <span className="text-zinc-400">←</span> {'{ overall: 85, ... }'}{'\n'}
          <span className="text-violet-400">llm</span>   : &quot;整体 85 分 🎉 /θ/ 需要多练...&quot;{'\n'}
          {'\n'}
          <span className="text-emerald-400">Ready.</span> 开发者工作到此结束。
        </>
      ),
    },
  },
];

// ─── 用户场景：每次用户使用时运行时发生的事 ───
const USER_STEPS: Step[] = [
  {
    num: '01',
    title: '用户发来一段录音',
    desc: '用户朗读完一段自我介绍后发送请求。驰声 MCP 支持两种接入方式：已录好的音频 URL / base64 · 或 浏览器 / 小程序 / App 的实时流式录音（PCM 分片），前端二选一即可。',
    icon: MessageSquare,
    role: { label: '终端用户', tone: 'text-emerald-400' },
    panel: {
      filename: 'user-request.txt',
      content: (
        <>
          <span className="text-zinc-500">{'// 前端 → 大模型的完整上下文 · 音频接入支持两种模式'}</span>{'\n'}
          {'\n'}
          <span className="text-violet-400">user</span>:{'\n'}
          {'  '}帮我听听这段自我介绍，{'\n'}
          {'  '}发音哪里有问题？{'\n'}
          {'\n'}
          <span className="text-zinc-500">{'// 方式 A · 离线音频（已录好的 mp3 / wav · URL 或 base64）'}</span>{'\n'}
          <span className="text-emerald-400">audio</span>:{'\n'}
          {'  '}<span className="text-amber-300">https://cdn.app.com/u123/intro.mp3</span>{'\n'}
          {'\n'}
          <span className="text-zinc-500">{'// ─── 或 ─────────────────────────────────────────'}</span>{'\n'}
          <span className="text-zinc-500">{'// 方式 B · 实时流式录音（浏览器 MediaRecorder · 小程序 · App）'}</span>{'\n'}
          <span className="text-emerald-400">stream</span>:{'\n'}
          {'  '}<span className="text-amber-300">audio/pcm</span> · <span className="text-amber-300">16k</span> · <span className="text-amber-300">16bit</span> · <span className="text-amber-300">mono</span>{'\n'}
          {'  '}<span className="text-zinc-400">→ 200ms 分片上传，评测结果流式回吐</span>{'\n'}
          {'\n'}
          <span className="text-emerald-400">refText</span>:{'\n'}
          {'  '}<span className="text-amber-300">&quot;Hello, my name is Lucy...&quot;</span>
        </>
      ),
    },
  },
  {
    num: '02',
    title: '大模型按 MCP 调用驰声',
    desc: '大模型意识到自己听不到音频，但它记得配置阶段注册的"语音评测"工具，自动按 MCP 协议发起调用。',
    icon: Plug,
    role: { label: '大模型 → MCP', tone: 'text-amber-300' },
    panel: {
      filename: 'mcp-tools-call.json',
      content: (
        <>
          <span className="text-zinc-500">{'// LLM 自动构造 — 开发者不写一行调用代码'}</span>{'\n'}
          {'{'}{'\n'}
          {'  '}<span className="text-emerald-400">&quot;jsonrpc&quot;</span>: <span className="text-amber-300">&quot;2.0&quot;</span>,{'\n'}
          {'  '}<span className="text-emerald-400">&quot;method&quot;</span>:  <span className="text-amber-300">&quot;tools/call&quot;</span>,{'\n'}
          {'  '}<span className="text-emerald-400">&quot;params&quot;</span>: {'{'}{'\n'}
          {'    '}<span className="text-emerald-400">&quot;name&quot;</span>: <span className="text-amber-300">&quot;en_sentence_eval&quot;</span>,{'\n'}
          {'    '}<span className="text-emerald-400">&quot;arguments&quot;</span>: {'{'}{'\n'}
          {'      '}<span className="text-emerald-400">&quot;audio_url&quot;</span>: <span className="text-amber-300">&quot;https://cdn.../intro.mp3&quot;</span>,{'\n'}
          {'      '}<span className="text-emerald-400">&quot;ref_text&quot;</span>:  <span className="text-amber-300">&quot;Hello, my name is Lucy...&quot;</span>{'\n'}
          {'    '}{'}'}{'\n'}
          {'  '}{'}'}{'\n'}
          {'}'}
          {'\n\n'}
          <span className="text-zinc-500">{'// ↑ 这一步就是 MCP 的全部魔法'}</span>
        </>
      ),
    },
  },
  {
    num: '03',
    title: '驰声考试级打分',
    desc: '驰声评测引擎对音频逐词、逐音素打分，以结构化 JSON 通过 MCP 原路返回给大模型。',
    icon: Waves,
    role: { label: '驰声服务', tone: 'text-rose-300' },
    panel: {
      filename: 'mcp-response.json',
      content: (
        <>
          <span className="text-zinc-500">{'// 驰声评测引擎 → 标准 MCP 响应'}</span>{'\n'}
          {'{'}{'\n'}
          {'  '}<span className="text-emerald-400">&quot;overall&quot;</span>: <span className="text-amber-300">85</span>,{'\n'}
          {'  '}<span className="text-emerald-400">&quot;pron&quot;</span>: {'{'}{'\n'}
          {'    '}<span className="text-emerald-400">&quot;accuracy&quot;</span>:  <span className="text-amber-300">82</span>,{'\n'}
          {'    '}<span className="text-emerald-400">&quot;integrity&quot;</span>: <span className="text-amber-300">95</span>,{'\n'}
          {'    '}<span className="text-emerald-400">&quot;fluency&quot;</span>:   <span className="text-amber-300">88</span>{'\n'}
          {'  '}{'}'},{'\n'}
          {'  '}<span className="text-emerald-400">&quot;details&quot;</span>: [{'\n'}
          {'    '}{'{'} <span className="text-emerald-400">&quot;char&quot;</span>: <span className="text-amber-300">&quot;think&quot;</span>, <span className="text-emerald-400">&quot;score&quot;</span>: <span className="text-amber-300">62</span>,{'\n'}
          {'      '}<span className="text-emerald-400">&quot;dp_type&quot;</span>: <span className="text-rose-400">&quot;mispron&quot;</span>,{'\n'}
          {'      '}<span className="text-emerald-400">&quot;phoneme&quot;</span>:  <span className="text-rose-400">&quot;/θ/&quot;</span> {'}'}{'\n'}
          {'  '}]{'\n'}
          {'}'}
        </>
      ),
    },
  },
  {
    num: '04',
    title: '大模型输出温柔反馈',
    desc: '大模型把冷冰冰的分数翻译成"老师式"的个性化反馈 + 针对性练习，直接展示给用户。',
    icon: Sparkles,
    role: { label: '大模型', tone: 'text-violet-400' },
    panel: {
      filename: 'user-feedback.md',
      content: (
        <>
          <span className="text-zinc-500">{'// LLM 输出 · 可直接渲染给用户'}</span>{'\n'}
          {'\n'}
          <span className="text-emerald-400">## 你的自我介绍很棒！</span>{'\n'}
          {'\n'}
          整体能拿到 <span className="text-amber-300">85 分</span> 哦 🎉{'\n'}
          流利度 <span className="text-amber-300">88</span>，完整度 <span className="text-amber-300">95</span>，都很到位。{'\n'}
          {'\n'}
          <span className="text-emerald-400">## 一个小细节可以优化</span>{'\n'}
          &ldquo;<span className="text-rose-400">think</span>&rdquo; 里的 <span className="text-amber-300">/θ/</span> 音，{'\n'}
          你发成了 /s/，试着把舌尖 <span className="text-emerald-400">轻轻抵在上齿</span>，{'\n'}
          气流从齿缝送出。我们一起练这几个词：{'\n'}
          {'   '}<span className="text-amber-300">think · three · thank · path</span>
        </>
      ),
    },
  },
];

export function WorkflowSteps() {
  const locale = useLocale();
  const isZh = locale.startsWith('zh');
  const [tab, setTab] = useState<TabKey>('user');
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(true);
  const [displayed, setDisplayed] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const steps = tab === 'dev' ? DEV_STEPS : USER_STEPS;

  const switchTo = (index: number) => {
    if (index === active) return;
    setVisible(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setDisplayed(index);
      setActive(index);
      setVisible(true);
    }, 200);
  };

  const switchTab = (next: TabKey) => {
    if (next === tab) return;
    setVisible(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setTab(next);
      setActive(0);
      setDisplayed(0);
      setVisible(true);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const TAB_META: Record<TabKey, { label: string; hint: string }> = {
    dev: { label: isZh ? '开发场景' : 'Developer Flow', hint: isZh ? '一次性工作' : 'One-time setup' },
    user: { label: isZh ? '用户场景' : 'User Flow', hint: isZh ? '每次使用发生' : 'Happens each run' },
  };

  const currentStep = steps[displayed];
  const enStepText: Record<TabKey, { title: string[]; desc: string[]; role: string[] }> = {
    dev: {
      title: ['Configure MCP once', 'Write a system prompt', 'Deploy, verify, done'],
      desc: [
        'Set MCP URL and API key once. Your host auto-discovers tools via MCP.',
        'Tell the model when to call tools and how to turn scores into feedback.',
        'Restart host and run one test message. After that, calls are automatic.',
      ],
      role: ['Developer', 'Developer', 'Developer'],
    },
    user: {
      title: ['User sends audio', 'LLM calls Chivox via MCP', 'Chivox returns exam-grade scores', 'LLM outputs friendly feedback'],
      desc: [
        'Audio can be uploaded file URL/base64 or realtime stream chunks.',
        'The model selects the right tool and sends a standard tools/call request.',
        'Chivox returns structured JSON including overall, dimensions and phoneme details.',
        'The model converts scores into actionable and friendly learning guidance.',
      ],
      role: ['End User', 'LLM → MCP', 'Chivox Service', 'LLM'],
    },
  };

  const panelFallbackEn: Record<TabKey, string[]> = {
    dev: [
      `// Configure once, use everywhere\n{\n  "mcpServers": {\n    "chivox_voice_eval": {\n      "type": "streamable-http",\n      "url": "https://speech-eval.site/mcp",\n      "apiKey": "sk-••••••••"\n    }\n  }\n}`,
      `// System prompt (example)\nYou are a speaking coach.\nWhen user provides audio:\n1) Call chivox tools\n2) Focus on low-score phonemes\n3) Provide actionable correction`,
      `[mcp] connected\n[mcp] tools discovered: 16\n[mcp] test call passed\nReady.`,
    ],
    user: [
      `// Frontend payload\nuser:\n  Please evaluate this self-intro.\n\naudio:\n  https://cdn.app.com/u123/intro.mp3\n\n// or stream\nstream:\n  audio/pcm · 16k · 16bit · mono\n  -> chunk upload every 200ms`,
      `{\n  "jsonrpc": "2.0",\n  "method": "tools/call",\n  "params": {\n    "name": "en_sentence_eval",\n    "arguments": {\n      "audio_url": "https://cdn.app.com/u123/intro.mp3",\n      "ref_text": "Hello, my name is Lucy..."\n    }\n  }\n}`,
      `{\n  "overall": 85,\n  "pron": {\n    "accuracy": 82,\n    "integrity": 95,\n    "fluency": 88\n  },\n  "details": [\n    { "char": "think", "score": 62, "dp_type": "mispron", "phoneme": "/θ/" }\n  ]\n}`,
      `## Great self-introduction!\n\nOverall score: 85 🎉\nFluency 88, integrity 95.\n\n## One detail to improve\nIn "think", your /θ/ sounds like /s/.\nPlace tongue lightly against upper teeth,\nthen push air through the gap.\nPractice: think · three · thank · path`,
    ],
  };

  const displayTitle = !isZh ? enStepText[tab].title[displayed] : currentStep.title;
  const displayDesc = !isZh ? enStepText[tab].desc[displayed] : currentStep.desc;
  const displayRole = !isZh ? enStepText[tab].role[displayed] : currentStep.role.label;
  const displayPanel = !isZh ? panelFallbackEn[tab][displayed] : null;

  return (
    <section
      id="workflow"
      data-fp-section
      className="min-h-screen flex flex-col justify-center py-14 md:py-20 border-t border-border/40 bg-muted/30"
    >
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-5 gap-10 items-start max-w-6xl mx-auto">
          {/* Left: header + tabs + steps */}
          <div className="lg:col-span-2">
            <span className="text-xs tracking-widest uppercase text-muted-foreground mb-3 block">{isZh ? 'How it works' : 'How It Works'}</span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">{isZh ? '一段录音如何变成温柔反馈' : 'How one audio turns into smart feedback'}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              {isZh ? (
                <>以「AI 雅思口语陪练」为例。开发者<span className="text-foreground font-medium">只填一次地址</span>，用户<span className="text-foreground font-medium">每次说话都自动被打分 + 给反馈</span>。</>
              ) : (
                <>Take an &quot;AI IELTS speaking coach&quot; as an example. Developers <span className="text-foreground font-medium">configure once</span>, users get <span className="text-foreground font-medium">automatic scoring + feedback every time</span>.</>
              )}
            </p>

            {/* ── Tabs ── */}
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-background/60 border border-border/60 mb-4">
              {(['dev', 'user'] as TabKey[]).map((k) => {
                const isActive = tab === k;
                return (
                  <button
                    key={k}
                    onClick={() => switchTab(k)}
                    onMouseEnter={() => switchTab(k)}
                    onFocus={() => switchTab(k)}
                    className={`relative flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
                      isActive
                        ? 'bg-foreground text-background shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {k === 'dev' ? <Code2 className="h-3.5 w-3.5" /> : <Brain className="h-3.5 w-3.5" />}
                    {TAB_META[k].label}
                    <span className={`text-[10px] font-normal ${isActive ? 'text-background/60' : 'text-muted-foreground/60'}`}>
                      · {TAB_META[k].hint}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ── Steps · 未激活仅显示标题一行，激活才展开 desc；容器固定高度防抖 ── */}
            <div className="space-y-1.5 min-h-[400px]">
              {steps.map((step, i) => {
                const Icon = step.icon;
                const isActive = active === i;
                return (
                  <button
                    key={`${tab}-${i}`}
                    onClick={() => switchTo(i)}
                    onMouseEnter={() => switchTo(i)}
                    aria-expanded={isActive}
                    className={`w-full flex items-start gap-3 text-left rounded-lg px-3 py-2.5 transition-all duration-200 ${
                      isActive
                        ? 'bg-background shadow-sm border border-border/60'
                        : 'hover:bg-background/60 border border-transparent'
                    }`}
                  >
                    <div
                      className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                        isActive ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap min-h-[32px]">
                        <span className="text-xs font-mono text-muted-foreground">{step.num}</span>
                        <h4
                          className={`text-sm font-semibold transition-colors ${
                            isActive ? 'text-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          {!isZh ? enStepText[tab].title[i] : step.title}
                        </h4>
                      </div>
                      {/* desc 只在激活时展开，消除高度抖动 */}
                      <div
                        className={`grid transition-all duration-300 ease-out ${
                          isActive ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0'
                        }`}
                      >
                        <p className="overflow-hidden text-xs leading-relaxed text-muted-foreground">
                          {!isZh ? enStepText[tab].desc[i] : step.desc}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* MCP 价值提示 */}
            <div className="mt-4 rounded-lg border border-border/60 bg-background/60 px-4 py-2.5">
              <div className="flex items-start gap-2">
                <Plug className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {tab === 'dev' ? (
                    <>
                      {isZh ? <>开发者只做左侧这点事，<span className="text-foreground">剩下的都是大模型和 MCP 自动完成</span>。</> : <>Developers only do the setup on the left. <span className="text-foreground">Everything else is automated by LLM + MCP</span>.</>}
                    </>
                  ) : (
                    <>
                      {isZh ? <>用户场景第 <span className="text-foreground font-medium">②</span> 步就是 MCP 的核心魔法 —— <span className="text-foreground">大模型自动选择并调用工具</span>。</> : <>Step <span className="text-foreground font-medium">②</span> is MCP magic — <span className="text-foreground">the LLM auto-selects and calls tools</span>.</>}
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Right: dynamic code panel · 固定高度，避免切换时抖动 */}
          <div className="lg:col-span-3 rounded-lg border border-border/60 bg-zinc-950 text-zinc-100 overflow-hidden shadow-2xl shadow-black/10 lg:sticky lg:top-24 h-[520px] flex flex-col">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06] shrink-0">
              <div className="w-3 h-3 rounded-full bg-white/10" />
              <div className="w-3 h-3 rounded-full bg-white/10" />
              <div className="w-3 h-3 rounded-full bg-white/10" />
              <span className={`ml-3 text-xs text-zinc-500 font-mono transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}>
                {currentStep.panel.filename}
              </span>
              <span
                className={`ml-auto text-[10px] font-mono px-2 py-0.5 rounded border border-white/10 transition-opacity duration-200 ${currentStep.role.tone} ${
                  visible ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {displayRole}
              </span>
            </div>
            <div className="flex-1 p-5 overflow-auto">
              <pre
                className={`text-sm font-mono leading-relaxed whitespace-pre-wrap transition-all duration-200 ${
                  visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                }`}
              >
                <code>{displayPanel ?? currentStep.panel.content}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
