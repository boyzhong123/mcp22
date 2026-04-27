'use client';

import { useLocale } from 'next-intl';
import { DocsShell, type NavGroup } from './docs-shell';
import {
  CodeBlock,
  DocSection,
  SubDoc,
  ParamTable,
  Callout,
  FlowStep,
  ToolTable,
} from './docs-shared';
import { DocsEnglishBody } from './docs-content-en';
import {
  BookOpen,
  Code2,
  Zap,
  FileText,
  Terminal,
  Globe,
  Mic,
  MessageSquare,
  BarChart3,
  AlertTriangle,
  Radio,
  FolderOpen,
  Workflow,
  Sparkles,
  Plug,
  Bot,
  Building2,
  Check,
} from 'lucide-react';

/* ─── Navigation Structure ─── */

const NAV = [
  { id: 'concept', icon: Workflow, label: 'MCP 工作原理', children: [
    { id: 'why-mcp', label: '为什么需要 MCP' },
    { id: 'scenario-walkthrough', label: '场景走查 · 6 步' },
    { id: 'dev-responsibility', label: '开发者只做两件事' },
    { id: 'integration-paths', label: '三种接入姿势' },
  ]},
  { id: 'quick-start', icon: Zap, label: '快速开始', children: [
    { id: 'overview', label: '概述' },
    { id: 'requirements', label: '系统要求' },
    { id: 'install', label: '安装方式' },
    { id: 'env-vars', label: '环境变量' },
  ]},
  { id: 'config', icon: Plug, label: '接入 · 直接用（零代码）', children: [
    { id: 'config-cursor', label: 'Cursor' },
    { id: 'config-claude-desktop', label: 'Claude Desktop' },
    { id: 'config-claude-code', label: 'Claude Code' },
    { id: 'config-ai-ide', label: 'Windsurf / Zed / Continue' },
    { id: 'config-coze', label: '扣子（Coze）' },
    { id: 'config-coze-workflow', label: 'Coze 工作流' },
    { id: 'config-ai-workspace', label: 'AI 工作台 · 豆包 / 飞书 / WorkBuddy / 钉钉' },
    { id: 'config-workflow-platforms', label: 'Dify / n8n / Flowise' },
    { id: 'config-other', label: '其他 MCP 客户端' },
  ]},
  { id: 'config-code', icon: Code2, label: '接入 · 编程用（SDK / 代码）', children: [
    { id: 'code-mcp-sdk', label: '官方 MCP 客户端库' },
    { id: 'code-agent-frameworks', label: 'LangChain / Mastra / Agents SDK' },
    { id: 'code-function-calling', label: '直调 chat.completions · tools' },
    { id: 'code-selfhosted-agent', label: '自研后端 Agent' },
  ]},
  { id: 'eval-modes', icon: Radio, label: '评测模式', children: [
    { id: 'stream-eval', label: '实时录音评测' },
    { id: 'stream-flow', label: '流式评测流程' },
    { id: 'file-eval', label: '音频文件评测' },
  ]},
  { id: 'api-reference', icon: BookOpen, label: 'API 参考', children: [
    { id: 'tools-en', label: '英文评测工具' },
    { id: 'tools-cn', label: '中文评测工具' },
    { id: 'result-fields', label: '评测结果字段' },
    { id: 'error-codes', label: '错误码' },
  ]},
  { id: 'architecture', icon: Terminal, label: '架构说明', children: [
    { id: 'arch-diagram', label: '架构图' },
    { id: 'transport', label: '传输协议' },
  ]},
  { id: 'integration', icon: Code2, label: '示例代码', children: [
    { id: 'code-python', label: 'Python' },
    { id: 'code-javascript', label: 'JavaScript' },
  ]},
  { id: 'best-practices', icon: FileText, label: '最佳实践', children: [
    { id: 'prompt-templates', label: 'Prompt 模板' },
    { id: 'error-handling', label: '错误处理' },
    { id: 'performance', label: '性能优化' },
  ]},
  { id: 'service-info', icon: Globe, label: '服务信息', children: [
    { id: 'endpoints', label: '服务端点' },
    { id: 'limits', label: '服务限制' },
    { id: 'changelog', label: '更新日志' },
  ]},
];

const NAV_EN: NavGroup[] = [
  { id: 'concept', icon: Workflow, label: 'How MCP works', children: [
    { id: 'why-mcp', label: 'Why MCP' },
    { id: 'scenario-walkthrough', label: 'Scenario · 6 steps' },
    { id: 'dev-responsibility', label: 'Two developer tasks' },
    { id: 'integration-paths', label: 'Three integration styles' },
  ]},
  { id: 'quick-start', icon: Zap, label: 'Quick start', children: [
    { id: 'overview', label: 'Overview' },
    { id: 'requirements', label: 'Requirements' },
    { id: 'install', label: 'Install' },
    { id: 'env-vars', label: 'Environment' },
  ]},
  { id: 'config', icon: Plug, label: 'Zero-code clients', children: [
    { id: 'config-cursor', label: 'Cursor' },
    { id: 'config-claude-desktop', label: 'Claude Desktop' },
    { id: 'config-claude-code', label: 'Claude Code' },
    { id: 'config-ai-ide', label: 'Windsurf / Zed / Continue' },
    { id: 'config-coze', label: 'Coze' },
    { id: 'config-coze-workflow', label: 'Coze workflows' },
    { id: 'config-ai-workspace', label: 'Enterprise AI workspaces' },
    { id: 'config-workflow-platforms', label: 'Dify / n8n / Flowise' },
    { id: 'config-other', label: 'Other MCP clients' },
  ]},
  { id: 'config-code', icon: Code2, label: 'SDK / code integration', children: [
    { id: 'code-mcp-sdk', label: 'Official MCP SDK' },
    { id: 'code-agent-frameworks', label: 'Agent frameworks' },
    { id: 'code-function-calling', label: 'chat.completions + tools' },
    { id: 'code-selfhosted-agent', label: 'Custom backend' },
  ]},
  { id: 'eval-modes', icon: Radio, label: 'Evaluation modes', children: [
    { id: 'stream-eval', label: 'Streaming mic' },
    { id: 'stream-flow', label: 'Streaming flow' },
    { id: 'file-eval', label: 'Audio files' },
  ]},
  { id: 'api-reference', icon: BookOpen, label: 'API reference', children: [
    { id: 'tools-en', label: 'English tools' },
    { id: 'tools-cn', label: 'Chinese tools' },
    { id: 'result-fields', label: 'Result fields' },
    { id: 'error-codes', label: 'Errors' },
  ]},
  { id: 'architecture', icon: Terminal, label: 'Architecture', children: [
    { id: 'arch-diagram', label: 'Diagram' },
    { id: 'transport', label: 'Transports' },
  ]},
  { id: 'integration', icon: Code2, label: 'Sample code', children: [
    { id: 'code-python', label: 'Python' },
    { id: 'code-javascript', label: 'JavaScript' },
  ]},
  { id: 'best-practices', icon: FileText, label: 'Best practices', children: [
    { id: 'prompt-templates', label: 'Prompt templates' },
    { id: 'error-handling', label: 'Errors & retries' },
    { id: 'performance', label: 'Performance' },
  ]},
  { id: 'service-info', icon: Globe, label: 'Service info', children: [
    { id: 'endpoints', label: 'Endpoints' },
    { id: 'limits', label: 'Limits' },
    { id: 'changelog', label: 'Changelog' },
  ]},
];

/* ─── Page（英文 / 中文拆成两个组件，避免切换语言时 Hooks 数量变化导致白屏）─── */

function DocsPageEn() {
  return (
    <DocsShell
      nav={NAV_EN}
      backLabel="Back to Home"
      title="Developer documentation"
      subtitle="Chivox Speech Evaluation MCP · chivox-local-mcp"
    >
      <DocsEnglishBody />
    </DocsShell>
  );
}

function DocsPageZh() {
  return (
    <DocsShell
      nav={NAV}
      backLabel="返回首页"
      title="开发者文档"
      subtitle="驰声语音评测 MCP · chivox-local-mcp"
    >
            {/* ══════ MCP 工作原理 ══════ */}
            <DocSection id="concept" icon={Workflow} title="MCP 工作原理">

              <SubDoc id="why-mcp" title="为什么需要 MCP">
                <p>
                  大模型（GPT / Claude / Gemini / 通义千问 等）本质上是<strong>文字大脑</strong>：它擅长读和写，但天生<strong>听不到</strong>音频、<strong>打不开</strong>你的数据库、<strong>调不通</strong>第三方 API。
                </p>
                <p>
                  <strong>MCP（Model Context Protocol）</strong>是一套由 Anthropic 主导、业界共同推进的开放协议，它像一根"对讲机"：让大模型可以在需要时主动去调用外部能力（工具、数据源、服务），然后把结果接回来继续对话。
                </p>
                <div className="grid sm:grid-cols-2 gap-3 my-4">
                  <div className="rounded-lg border border-border/60 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm font-semibold">没有 MCP 的做法</span>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
                      <li>· 研究评测服务的 REST 文档</li>
                      <li>· 自己写鉴权 / 上传 / 轮询代码</li>
                      <li>· 把结果序列化后塞进 prompt</li>
                      <li>· 每换一个大模型都得重写一遍</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border-2 border-foreground/60 p-4 bg-foreground/[0.02]">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="h-4 w-4 text-foreground" />
                      <span className="text-sm font-semibold">用驰声 MCP 之后</span>
                    </div>
                    <ul className="text-xs space-y-1.5 leading-relaxed">
                      <li>· 填一行 MCP Server 地址</li>
                      <li>· 大模型自动发现&amp;调用评测工具</li>
                      <li>· 换任何支持 MCP 的大模型都能用</li>
                      <li>· 不写一行调用代码</li>
                    </ul>
                  </div>
                </div>
                <Callout type="info">
                  MCP 让"接入语音评测"从一个"后端工程"变成了一个"配置项"。这也是为什么 Cursor、Claude Desktop、Dify、Coze、字节豆包、飞书智能助手都已经原生支持 MCP。
                </Callout>
              </SubDoc>

              <SubDoc id="scenario-walkthrough" title="场景走查 · 从一段录音到温柔反馈">
                <p>
                  想象一个具体场景：一位开发者用 Claude 做了一款 <strong>「AI 雅思口语陪练」小程序</strong>，接入驰声语音评测 MCP。当用户发来一段录音，整个链路是这样的：
                </p>
                <div className="rounded-lg border border-border/60 bg-muted/20 p-5 my-4 space-y-5">
                  <FlowStep title="1">
                    <p><strong className="text-foreground">配置阶段</strong>（开发者 · 一次性）</p>
                    <p className="text-muted-foreground mt-1">在 AI 后端的配置文件里填一行驰声 MCP Server 地址。大模型启动时自动发现：「我多了一个叫<strong>语音评测</strong>的工具」。</p>
                  </FlowStep>
                  <FlowStep title="2">
                    <p><strong className="text-foreground">接收用户指令</strong>（终端用户）</p>
                    <p className="text-muted-foreground mt-1">小程序用户发来一段自我介绍录音：「帮我听听，发音哪里有问题？」后端把「文字 + 录音链接」打包给大模型。</p>
                  </FlowStep>
                  <FlowStep title="3">
                    <p><strong className="text-foreground">大模型自主思考</strong>（LLM · 最核心的魔法）</p>
                    <div className="text-muted-foreground mt-1 rounded-md bg-background/80 border border-border/40 px-3 py-2 text-xs leading-relaxed">
                      「用户让我听发音。」<br />
                      「但我只是文字大脑，我听不到。」<br />
                      「等等 —— 开发者给了我一个叫 <code className="bg-muted px-1 rounded">chivox_voice_eval</code> 的 MCP 工具！」
                    </div>
                  </FlowStep>
                  <FlowStep title="4">
                    <p><strong className="text-foreground">MCP 协议 · 自动调用</strong>（LLM → 驰声）</p>
                    <p className="text-muted-foreground mt-1">大模型自动按 MCP 标准构造 <code className="bg-muted px-1 rounded text-xs font-mono">tools/call</code> 请求，把录音链接和参考文本发到驰声服务。<span className="text-foreground">开发者不需要写任何调用代码。</span></p>
                  </FlowStep>
                  <FlowStep title="5">
                    <p><strong className="text-foreground">驰声服务处理</strong>（评测引擎）</p>
                    <p className="text-muted-foreground mt-1">驰声对音频进行考试级打分，把结构化结果通过 MCP 原路返回：<code className="bg-muted px-1 rounded text-xs font-mono">overall 85</code>、<code className="bg-muted px-1 rounded text-xs font-mono">/θ/ 音发音错误</code>、<code className="bg-muted px-1 rounded text-xs font-mono">流利度 88</code>。</p>
                  </FlowStep>
                  <FlowStep title="6">
                    <p><strong className="text-foreground">大模型整合并输出反馈</strong>（LLM）</p>
                    <p className="text-muted-foreground mt-1">大模型把冷冰冰的分数翻译成温柔反馈：</p>
                    <div className="text-foreground/80 mt-2 rounded-md bg-background/80 border border-border/40 px-3 py-2 text-xs leading-relaxed italic">
                      「你的自我介绍很棒！综合 85 分 🎉 不过 <strong>think</strong> 这个词的 /θ/ 咬舌音不太标准，我们一起来练一下……」
                    </div>
                  </FlowStep>
                </div>
                <Callout type="tip">
                  <strong>整条链路里，MCP 只出现在 ① 和 ④</strong>：① 让开发者一次性告诉大模型「你多了一个工具」，④ 让大模型可以自动调用它。这两步的标准化，就是 MCP 的全部价值。
                </Callout>
              </SubDoc>

              <SubDoc id="dev-responsibility" title="开发者只做两件事">
                <p>听起来复杂，但对开发者来说只需要两件事：</p>
                <div className="grid sm:grid-cols-2 gap-3 my-4">
                  <div className="rounded-lg border border-border/60 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="h-6 w-6 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center">1</span>
                      <span className="text-sm font-semibold">填一次 MCP 配置</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                      在 AI 后端的配置里填入驰声 MCP Server 地址和 API Key，就这一次，以后新加评测能力完全免开发。
                    </p>
                    <CodeBlock filename="mcp-config.json" lang="json">{`{
  "chivox_voice_eval": {
    "type": "streamable-http",
    "url": "https://speech-eval.site/mcp",
    "apiKey": "sk-••••••••••"
  }
}`}</CodeBlock>
                  </div>
                  <div className="rounded-lg border border-border/60 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="h-6 w-6 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center">2</span>
                      <span className="text-sm font-semibold">写一段 System Prompt</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                      告诉大模型这个工具是做什么的、什么时候调用、结果怎么转成用户友好的反馈。
                    </p>
                    <CodeBlock filename="system-prompt.md">{`你是一位英语口语教练。
当用户发来录音时：
1. 调用 chivox_voice_eval 评分
2. 聚焦 <70 分的音素家族
3. 用高情商话术给出练习建议`}</CodeBlock>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  其余所有事情 —— 音频上传、鉴权、工具发现、调用时机、返回格式、结果整合 —— 都由 MCP 协议和大模型自己搞定。
                </p>
              </SubDoc>

              <SubDoc id="integration-paths" title="三种典型接入姿势">
                <p>根据你的技术栈，有三种等价的接入方式，底层都走完全相同的 MCP 协议：</p>

                {/* ── 姿势一：可视化 ── */}
                <div className="rounded-lg border border-border/60 p-5 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-foreground" />
                    <h4 className="text-sm font-semibold">姿势一 · 可视化拖拽（扣子 / Coze / 飞书智能助手）</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    适合产品经理、运营、不写后端代码的开发者。整个过程像在手机上装 App。
                  </p>
                  <ol className="list-decimal list-inside space-y-2 ml-1 text-sm">
                    <li><strong>找到入口</strong>：在扣子平台的 <strong>「插件 / 工具」</strong> 配置区，点击<strong>「添加 MCP 服务」</strong>。</li>
                    <li><strong>填两个字段</strong>（这也是你未来会从驰声这边拿到的）：
                      <div className="mt-2 overflow-x-auto rounded-lg border border-border/60">
                        <table className="w-full text-sm">
                          <tbody className="divide-y divide-border/30">
                            <tr><td className="py-2 px-3 font-medium w-32">服务器地址</td><td className="py-2 px-3 font-mono text-xs">https://speech-eval.site/mcp</td></tr>
                            <tr><td className="py-2 px-3 font-medium">鉴权密钥</td><td className="py-2 px-3 font-mono text-xs">sk-•••••••••• <span className="text-muted-foreground ml-2">（由驰声分配，用于计费与识别）</span></td></tr>
                          </tbody>
                        </table>
                      </div>
                    </li>
                    <li><strong>平台自动发现能力</strong>：扣子会访问你填的地址，读取 MCP Server 自描述的"说明书"。瞬间明白：「这是个语音评测工具，需要传音频，会返发音分」。</li>
                    <li><strong>右侧测试</strong>：在平台的聊天框里发一段语音，大模型就会自动调用工具。<strong>整个过程不需要写一行代码。</strong></li>
                  </ol>
                </div>

                {/* ── 姿势二：代码框架 ── */}
                <div className="rounded-lg border border-border/60 p-5 mt-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Code2 className="h-4 w-4 text-foreground" />
                    <h4 className="text-sm font-semibold">姿势二 · 代码框架配置（Dify / LangChain / 自研后端）</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    适合做独立 APP / 小程序、用 Dify 或 LangChain 写 Agent 的极客开发者。核心就是往配置文件里加一段 JSON。
                  </p>
                  <ol className="list-decimal list-inside space-y-2 ml-1 text-sm">
                    <li><strong>打开配置文件</strong>（项目根目录下的 <code className="bg-muted px-1 rounded text-xs font-mono">mcp.json</code> 或框架指定的配置路径）。</li>
                    <li><strong>在 <code className="bg-muted px-1 rounded text-xs font-mono">mcpServers</code> 下增加一个节点</strong>：
                      <CodeBlock filename="mcp.json" lang="json">{`{
  "mcpServers": {
    "chivox_voice_eval": {
      "type": "streamable-http",
      "url": "https://speech-eval.site/mcp",
      "env": {
        "API_KEY": "你的专属密钥"
      }
    }
  }
}`}</CodeBlock>
                    </li>
                    <li><strong>重启后端服务</strong>。大模型的底层调度器会在启动时自动连上驰声 MCP Server，把 16 种评测工具注册成<strong>随时待命</strong>的 tools。</li>
                    <li><strong>触发调用</strong>：用户发来录音后，大模型看到 system prompt 的引导，自动选择合适的工具（单词/句子/段落/半开放）调用。</li>
                  </ol>
                </div>

                {/* ── 姿势三：Function Calling 直连（分 A / B 两种做法） ── */}
                <div className="rounded-lg border border-border/60 p-5 mt-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Terminal className="h-4 w-4 text-foreground" />
                    <h4 className="text-sm font-semibold">姿势三 · 原生 Function Calling（豆包 / DeepSeek / OpenAI 兼容 API）</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    适合不用任何 Agent 框架、直接调用 LLM API 的后端开发者。豆包 1.5+ / DeepSeek / GPT / Qwen 等模型都走标准 <code className="bg-muted px-1 rounded text-xs font-mono">chat.completions</code> 的 <code className="bg-muted px-1 rounded text-xs font-mono">tools</code> 参数。这里又分 A / B 两种做法，<strong>B 才是生产推荐</strong>。
                  </p>

                  <Callout type="warning">
                    常见疑问：<em>"要不要手写一个 tool 定义？"</em><br />
                    — <strong>姿势一 / 二不用</strong>（Coze、Dify、火山方舟控制台、Claude Desktop 会自动从 MCP Server 拉工具列表）。<br />
                    — <strong>姿势三看你选 A 还是 B</strong>：A 要手写，B 用 MCP 客户端库自动拉。
                  </Callout>

                  {/* ── 3-A：手写 tool schema ── */}
                  <div className="mt-4 rounded-md border border-border/40 bg-muted/20 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold">3-A · 手写 tool schema（最快验证，不推荐生产）</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">快速 Demo</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                      自己写一段 JSON Schema 告诉豆包"有个工具叫 xxx，参数长这样"，豆包返回 tool_call 后你再手动去调驰声 MCP。<strong>缺点</strong>：驰声有 16 个评测工具，你每加一个题型都要改代码。
                    </p>
                    <CodeBlock filename="3a_hardcode_tool.py" lang="python">{`import os, json
from openai import OpenAI

client = OpenAI(
    base_url="https://ark.cn-beijing.volces.com/api/v3",
    api_key=os.getenv('ARK_API_KEY'),
)

# ─── 手写一段 tool schema（不推荐：16 个工具就要写 16 段）───
tools = [{
    "type": "function",
    "function": {
        "name": "en_word_eval",
        "description": "英语单词发音评测。当用户让你评价英语发音并提供录音链接时调用。",
        "parameters": {
            "type": "object",
            "properties": {
                "audio_url":      {"type": "string", "description": "录音 URL"},
                "reference_text": {"type": "string", "description": "参考文本，如 Apple"},
            },
            "required": ["audio_url", "reference_text"]
        }
    }
}]

resp = client.chat.completions.create(
    model="ep-xxx-doubao-tools",
    messages=[
        {"role": "system", "content": "你是英语老师，拿到评测结果后温柔地反馈，不要直接报分数。"},
        {"role": "user",   "content": "老师，我读了 Apple，录音 https://demo.com/u1.mp3"},
    ],
    tools=tools,
    tool_choice="auto",
)

msg = resp.choices[0].message
if msg.tool_calls:
    args = json.loads(msg.tool_calls[0].function.arguments)
    # ↓↓↓ 这里手动调驰声 MCP，再把结果回填给豆包做第二趟 ↓↓↓
    # result = requests.post("https://speech-eval.site/mcp", json={...})`}</CodeBlock>
                  </div>

                  {/* ── 3-B：MCP 自动发现 ── */}
                  <div className="mt-3 rounded-md border border-foreground/30 bg-foreground/[0.03] dark:bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold flex items-center gap-1.5">
                        3-B · 用 MCP 客户端库自动发现 <Sparkles className="h-3 w-3 text-foreground" />
                      </p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-foreground text-background">生产推荐</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                      启动时连上驰声 MCP Server，调一次 <code className="bg-muted px-1 rounded">tools/list</code>，把 16 个评测工具自动转成 Function Calling 的 tools 格式。<strong>驰声加新工具，你代码不用改</strong>。这才是 MCP 协议的真正价值。
                    </p>
                    <CodeBlock filename="3b_mcp_autodiscover.py" lang="python">{`import asyncio, os
from openai import AsyncOpenAI
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

client = AsyncOpenAI(
    base_url="https://ark.cn-beijing.volces.com/api/v3",
    api_key=os.getenv("ARK_API_KEY"),
)

async def main():
    # ─── 1. 连驰声 MCP Server，自动拉取全部 16 个工具 ───
    async with streamablehttp_client(
        "https://speech-eval.site/mcp",
        headers={"Authorization": f"Bearer {os.getenv('CHIVOX_KEY')}"},
    ) as (read, write, _):
        async with ClientSession(read, write) as session:
            await session.initialize()
            mcp_tools = (await session.list_tools()).tools  # ← 一行拿到全部工具

            # ─── 2. MCP schema → OpenAI Function Calling schema ───
            tools = [{
                "type": "function",
                "function": {
                    "name": t.name,
                    "description": t.description,
                    "parameters": t.inputSchema,  # MCP 直接给 JSON Schema
                }
            } for t in mcp_tools]

            # ─── 3. 正常调豆包，tools 由 MCP 动态注入 ───
            resp = await client.chat.completions.create(
                model="ep-xxx-doubao-tools",
                messages=[
                    {"role": "system", "content": "你是英语老师，收到评测结果后温柔反馈。"},
                    {"role": "user",   "content": "老师，我读了 Apple，录音 https://demo.com/u1.mp3"},
                ],
                tools=tools,
                tool_choice="auto",
            )

            # ─── 4. 折返跑：豆包选好工具后，直接走 MCP 调驰声 ───
            msg = resp.choices[0].message
            if msg.tool_calls:
                call = msg.tool_calls[0]
                result = await session.call_tool(
                    call.function.name,
                    arguments=__import__("json").loads(call.function.arguments),
                )
                # 把 result 回填给豆包做第二趟 chat.completions 即可

asyncio.run(main())`}</CodeBlock>
                    <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
                      想要更省心？直接用 <a href="https://github.com/modelcontextprotocol/python-sdk" target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-2">官方 mcp python sdk</a>、<code className="bg-muted px-1 rounded text-xs">mcp-use</code>、<code className="bg-muted px-1 rounded text-xs">openai-agents</code>，或火山官方 <code className="bg-muted px-1 rounded text-xs">Arkitect</code> 高代码 SDK，它们都把上面这段"MCP → Function Calling"的桥接封装好了。
                    </p>
                  </div>
                </div>

                <Callout type="info">
                  三种姿势走的是完全相同的 MCP 协议，能力完全等价。选型建议：<strong>产品经理 / 原型验证用姿势一</strong>（Coze 填表单）；<strong>AI 客户端用户用姿势二</strong>（Cursor / Claude Desktop 填 <code className="bg-black/5 dark:bg-white/10 px-1 rounded text-xs">mcp.json</code>）；<strong>后端生产服务用姿势三-B</strong>（MCP 客户端库自动发现工具，不要手写 tool schema）。
                </Callout>
              </SubDoc>

            </DocSection>

            {/* ══════ 快速开始 ══════ */}
            <DocSection id="quick-start" icon={Zap} title="快速开始">

              <SubDoc id="overview" title="概述">
                <p><strong>chivox-local-mcp</strong> 是驰声语音评测的 MCP 本地代理，通过 <a href="https://modelcontextprotocol.io/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Model Context Protocol</a> 将远程驰声评测服务桥接到本地，让 AI 助手（Claude Desktop、Claude Code、Cursor 等）直接调用语音评测能力。</p>
                <p>它支持两种评测模式，覆盖从即时交互到批量处理的全部场景：</p>
                <div className="grid sm:grid-cols-2 gap-3 my-4">
                  <div className="rounded-lg border border-border/60 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Mic className="h-4 w-4 text-foreground" />
                      <span className="text-sm font-semibold">实时录音评测</span>
                    </div>
                    <p className="text-xs text-muted-foreground">通过麦克风边录边评，音频以 WebSocket 流式推送，无需生成中间文件，延迟更低、体验更佳。</p>
                  </div>
                  <div className="rounded-lg border border-border/60 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FolderOpen className="h-4 w-4 text-foreground" />
                      <span className="text-sm font-semibold">音频文件评测</span>
                    </div>
                    <p className="text-xs text-muted-foreground">支持本地文件路径、Base64 编码、URL 三种输入，适合已有音频的批量评测场景。</p>
                  </div>
                </div>
                <Callout type="info">当前支持 <strong>16 种评测工具</strong>：英文 10 种（单词、句子、段落、纠音、自然拼读、口语选择、半开放题等）+ 中文 6 种（汉字、拼音、词句、段落、有限分支、AI Talk）。</Callout>
              </SubDoc>

              <SubDoc id="requirements" title="系统要求">
                <div className="overflow-x-auto rounded-lg border border-border/60">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border/40 bg-muted/30">
                      <th className="text-left py-2 px-3 font-medium">依赖</th>
                      <th className="text-left py-2 px-3 font-medium">版本</th>
                      <th className="text-left py-2 px-3 font-medium">说明</th>
                    </tr></thead>
                    <tbody className="divide-y divide-border/30">
                      <tr><td className="py-2 px-3 font-semibold">Node.js</td><td className="py-2 px-3 font-mono text-xs">{'>'}= 18</td><td className="py-2 px-3 text-muted-foreground">运行时必须</td></tr>
                      <tr><td className="py-2 px-3 font-semibold">SoX</td><td className="py-2 px-3 font-mono text-xs">any</td><td className="py-2 px-3 text-muted-foreground">仅实时录音功能需要（处理麦克风音频流）</td></tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-3">安装 SoX（仅在使用实时录音时需要）：</p>
                <CodeBlock filename="Terminal" lang="bash">{`# macOS
brew install sox

# Ubuntu / Debian
sudo apt-get install sox`}</CodeBlock>
              </SubDoc>

              <SubDoc id="install" title="安装方式">
                <p><strong>方式一：npm 全局安装</strong>（推荐）</p>
                <CodeBlock filename="Terminal" lang="bash">{`npm install -g chivox-local-mcp`}</CodeBlock>

                <p><strong>方式二：npx 免安装运行</strong></p>
                <CodeBlock filename="Terminal" lang="bash">{`MCP_REMOTE_URL=http://your-server:8080 npx chivox-local-mcp`}</CodeBlock>

                <p><strong>方式三：从源码构建</strong></p>
                <CodeBlock filename="Terminal" lang="bash">{`git clone https://git.chivox.com/CLOUD_DEV/cvx_local_mcp.git
cd cvx_local_mcp
bash scripts/build.sh`}</CodeBlock>
              </SubDoc>

              <SubDoc id="env-vars" title="环境变量">
                <ParamTable params={[
                  { name: 'MCP_REMOTE_URL', type: 'string', required: true, desc: '远程驰声 MCP 服务地址，如 http://your-server:8080' },
                  { name: 'MCP_API_KEY', type: 'string', required: false, desc: 'API 认证密钥（如已配置鉴权则必填）' },
                ]} />
              </SubDoc>
            </DocSection>

            {/* ══════ 接入 · 直接用（零代码） ══════ */}
            <DocSection id="config" icon={Plug} title="接入 · 直接用 MCP（零代码）">

              <div className="rounded-lg border border-border/60 bg-muted/30 p-4 mb-5 text-sm">
                <p className="font-semibold mb-1.5 flex items-center gap-2"><Sparkles className="h-4 w-4" /> 这一类接入的共同特征</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>不用写代码、不用装 SDK，只在客户端的<strong className="text-foreground">「MCP 配置」</strong>或<strong className="text-foreground">「扩展」</strong>里填一段 JSON / URL</li>
                  <li>保存后 LLM 自动发现 16 个评测工具，并在对话 / Agent 中自主调用</li>
                  <li>覆盖 <strong className="text-foreground">IDE 编程助手</strong>、<strong className="text-foreground">桌面 AI 客户端</strong>、<strong className="text-foreground">企业 AI 工作台</strong>、<strong className="text-foreground">可视化 Bot / 工作流平台</strong>四大生态</li>
                </ul>
              </div>


              <SubDoc id="config-cursor" title="Cursor 配置">
                <ol className="list-decimal list-inside space-y-2 ml-1">
                  <li>打开 Cursor 设置（<kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Cmd + ,</kbd>）</li>
                  <li>左侧选择 <strong>MCP</strong>（或搜索 &quot;MCP&quot;）</li>
                  <li>点击 <strong>Add new MCP server</strong></li>
                  <li>填写配置并保存：</li>
                </ol>
                <CodeBlock filename="Cursor MCP 配置" lang="json">{`{
  "name": "chivox-speech-eval",
  "type": "streamable-http",
  "url": "https://speech-eval.site/mcp"
}`}</CodeBlock>
                <Callout type="tip">Cursor 使用远程 Streamable HTTP 模式直连，无需安装本地代理。如需实时录音功能，请使用下方 Claude Desktop 的本地代理配置。</Callout>
              </SubDoc>

              <SubDoc id="config-claude-desktop" title="Claude Desktop 配置">
                <p>编辑配置文件（macOS：<code className="bg-muted px-1 rounded text-xs font-mono">~/Library/Application Support/Claude/claude_desktop_config.json</code>）：</p>
                <CodeBlock filename="claude_desktop_config.json" lang="json">{`{
  "mcpServers": {
    "chivox": {
      "command": "chivox-local-mcp",
      "env": {
        "MCP_REMOTE_URL": "http://your-server:8080",
        "MCP_API_KEY": "your-api-key"
      }
    }
  }
}`}</CodeBlock>
                <p>如果是从源码构建：</p>
                <CodeBlock filename="claude_desktop_config.json" lang="json">{`{
  "mcpServers": {
    "chivox": {
      "command": "node",
      "args": ["/path/to/cvx_local_mcp/dist/index.js"],
      "env": {
        "MCP_REMOTE_URL": "http://your-server:8080"
      }
    }
  }
}`}</CodeBlock>
                <Callout type="info">Claude Desktop 使用本地代理模式（stdio），支持实时录音评测。本地代理会自动桥接远程服务。</Callout>
              </SubDoc>

              <SubDoc id="config-claude-code" title="Claude Code 配置">
                <CodeBlock filename="Terminal" lang="bash">{`# npm 全局安装后
claude mcp add chivox -- env MCP_REMOTE_URL=http://your-server:8080 chivox-local-mcp

# 源码构建后
claude mcp add chivox -- env MCP_REMOTE_URL=http://your-server:8080 node /path/to/cvx_local_mcp/dist/index.js`}</CodeBlock>
              </SubDoc>

              <SubDoc id="config-ai-ide" title="Windsurf / Zed / Continue 等 IDE 编程助手">
                <p>除了 Cursor 和 Claude Code，主流的 AI 编程 IDE 都原生支持 MCP。以下客户端使用<strong>完全一致</strong>的 Streamable HTTP 配置，区别只在配置入口：</p>
                <div className="overflow-x-auto rounded-lg border border-border/60 my-3">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border/40 bg-muted/30">
                      <th className="text-left py-2 px-3 font-medium">客户端</th>
                      <th className="text-left py-2 px-3 font-medium">配置入口</th>
                      <th className="text-left py-2 px-3 font-medium">备注</th>
                    </tr></thead>
                    <tbody className="divide-y divide-border/30">
                      <tr><td className="py-2 px-3 font-medium">Windsurf (Codeium)</td><td className="py-2 px-3 text-xs">Settings → Cascade → MCP Servers</td><td className="py-2 px-3 text-xs text-muted-foreground">直接贴下方 JSON</td></tr>
                      <tr><td className="py-2 px-3 font-medium">Zed</td><td className="py-2 px-3 text-xs"><code className="bg-muted px-1 rounded text-xs font-mono">~/.config/zed/settings.json</code> 的 <code className="bg-muted px-1 rounded text-xs font-mono">context_servers</code></td><td className="py-2 px-3 text-xs text-muted-foreground">Assistant Panel 自动发现</td></tr>
                      <tr><td className="py-2 px-3 font-medium">Continue (VS Code / JetBrains)</td><td className="py-2 px-3 text-xs"><code className="bg-muted px-1 rounded text-xs font-mono">config.yaml</code> 的 <code className="bg-muted px-1 rounded text-xs font-mono">mcpServers</code></td><td className="py-2 px-3 text-xs text-muted-foreground">v0.9+ 支持</td></tr>
                      <tr><td className="py-2 px-3 font-medium">通义灵码 / CodeGeeX / 文心快码</td><td className="py-2 px-3 text-xs">插件设置 → MCP 服务</td><td className="py-2 px-3 text-xs text-muted-foreground">2026 Q1 起陆续支持</td></tr>
                      <tr><td className="py-2 px-3 font-medium">Cline (原 Claude Dev)</td><td className="py-2 px-3 text-xs">MCP Servers 面板 → 编辑配置</td><td className="py-2 px-3 text-xs text-muted-foreground">VS Code 扩展</td></tr>
                    </tbody>
                  </table>
                </div>
                <CodeBlock filename="通用 MCP 配置（复制即用）" lang="json">{`{
  "mcpServers": {
    "chivox-speech-eval": {
      "type": "streamable-http",
      "url": "https://speech-eval.site/mcp"
    }
  }
}`}</CodeBlock>
                <Callout type="tip">所有 IDE 类客户端都走远程 Streamable HTTP，零本地依赖。需要实时录音才需切到 Claude Desktop 的本地代理模式。</Callout>
              </SubDoc>

              <SubDoc id="config-coze" title="扣子（Coze）配置">
                <p><a href="https://www.coze.cn/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">扣子（Coze）</a>是字节跳动推出的 AI 应用开发平台，支持通过 MCP 扩展为 Agent 赋予外部工具能力。接入驰声语音评测后，你可以构建口语练习 Bot、发音诊断助手等应用。</p>
                <p className="font-semibold mt-4">方式一：扣子空间 MCP 扩展（推荐）</p>
                <ol className="list-decimal list-inside space-y-2 ml-1">
                  <li>打开 <a href="https://space.coze.cn/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">扣子空间</a>（space.coze.cn）</li>
                  <li>在对话框下方点击 <strong>「添加扩展」</strong></li>
                  <li>选择 <strong>「自定义」</strong> 标签，点击添加新的 MCP 服务</li>
                  <li>填入以下配置信息：</li>
                </ol>
                <div className="overflow-x-auto rounded-lg border border-border/60 my-3">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border/40 bg-muted/30">
                      <th className="text-left py-2 px-3 font-medium">配置项</th>
                      <th className="text-left py-2 px-3 font-medium">值</th>
                    </tr></thead>
                    <tbody className="divide-y divide-border/30">
                      <tr><td className="py-2 px-3 font-medium">名称</td><td className="py-2 px-3 font-mono text-xs">chivox-speech-eval</td></tr>
                      <tr><td className="py-2 px-3 font-medium">传输类型</td><td className="py-2 px-3 font-mono text-xs">streamable-http</td></tr>
                      <tr><td className="py-2 px-3 font-medium">URL</td><td className="py-2 px-3 font-mono text-xs">https://speech-eval.site/mcp</td></tr>
                    </tbody>
                  </table>
                </div>
                <ol className="list-decimal list-inside space-y-1 ml-1" start={5}>
                  <li>保存后，在对话中输入 <strong>「帮我评测这段英文发音」</strong> 即可触发 Agent 调用</li>
                </ol>
                <Callout type="tip">添加 MCP 扩展后，扣子空间的 Agent 会自动识别并调用评测工具。你可以在 Agent 的思考过程中看到具体的工具调用细节。</Callout>

                <p className="font-semibold mt-6">方式二：在 Coze 开发平台的 Bot 中使用</p>
                <ol className="list-decimal list-inside space-y-2 ml-1">
                  <li>进入 <a href="https://www.coze.cn/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Coze 开发平台</a>，创建或编辑 Bot</li>
                  <li>在 Bot 的 <strong>「插件」</strong> 或 <strong>「工具」</strong> 面板中，添加 MCP 工具</li>
                  <li>选择 <strong>Streamable HTTP</strong> 类型，填入 URL：<code className="bg-muted px-1 rounded text-xs font-mono">https://speech-eval.site/mcp</code></li>
                  <li>Bot 将自动发现所有可用的评测工具（如 <code className="bg-muted px-1 rounded text-xs font-mono">evaluate_english_word</code> 等）</li>
                  <li>在 Bot 的人设提示词中，添加语音评测相关的引导语</li>
                </ol>
                <CodeBlock filename="Bot 人设提示词示例">{`你是一位专业的英语口语教练。当用户上传音频并请求评测时：
1. 使用 evaluate_english_word / evaluate_english_sentence 等工具进行评测
2. 根据评测结果（overall、accuracy、fluency 等分数）给出专业分析
3. 针对得分较低的维度提供具体改进建议
4. 鼓励用户持续练习`}</CodeBlock>
              </SubDoc>

              <SubDoc id="config-coze-workflow" title="Coze 工作流接入">
                <p>如果你需要在 Coze 工作流中集成语音评测能力，可以通过 <strong>HTTP Request 节点</strong>调用评测 API：</p>

                <p className="font-semibold mt-4">步骤 1：上传音频</p>
                <p>在工作流中添加一个 HTTP Request 节点，配置如下：</p>
                <div className="overflow-x-auto rounded-lg border border-border/60 my-3">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border/40 bg-muted/30">
                      <th className="text-left py-2 px-3 font-medium">配置项</th>
                      <th className="text-left py-2 px-3 font-medium">值</th>
                    </tr></thead>
                    <tbody className="divide-y divide-border/30">
                      <tr><td className="py-2 px-3 font-medium">方法</td><td className="py-2 px-3 font-mono text-xs">POST</td></tr>
                      <tr><td className="py-2 px-3 font-medium">URL</td><td className="py-2 px-3 font-mono text-xs">https://speech-eval.site/upload</td></tr>
                      <tr><td className="py-2 px-3 font-medium">Content-Type</td><td className="py-2 px-3 font-mono text-xs">audio/mp3</td></tr>
                      <tr><td className="py-2 px-3 font-medium">Body</td><td className="py-2 px-3 text-muted-foreground">音频文件二进制数据</td></tr>
                    </tbody>
                  </table>
                </div>
                <p>响应中获取 <code className="bg-muted px-1 rounded text-xs font-mono">{'{{audioId}}'}</code>，传递给下一步。</p>

                <p className="font-semibold mt-4">步骤 2：调用评测</p>
                <p>添加第二个 HTTP Request 节点，通过 MCP 接口调用评测工具：</p>
                <CodeBlock filename="HTTP Request Body" lang="json">{`{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "evaluate_english_sentence",
    "arguments": {
      "audioId": "{{audioId}}",
      "sentence": "{{ref_text}}"
    }
  },
  "id": 1
}`}</CodeBlock>

                <p className="font-semibold mt-4">步骤 3：处理结果</p>
                <p>评测结果通过 JSON 格式返回，可使用 Coze 的 <strong>代码节点</strong> 或 <strong>LLM 节点</strong> 对结果进行解析和二次处理（如生成学习建议、计算进步趋势等）。</p>

                <Callout type="info">工作流方式适合需要固定流程的场景（如批量评测、定时任务、与其他系统联动）。如果是交互式场景，推荐使用上方的 MCP 扩展方式，Agent 会自动选择合适的工具。</Callout>

                <div className="rounded-lg bg-muted/30 p-5 mt-4">
                  <p className="text-xs font-semibold mb-3">完整工作流示意</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-3 py-1.5 rounded-md bg-background border border-border/60 font-medium">用户输入音频</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="px-3 py-1.5 rounded-md bg-background border border-border/60 font-medium">HTTP: 上传音频</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="px-3 py-1.5 rounded-md bg-background border border-border/60 font-medium">HTTP: 调用评测</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="px-3 py-1.5 rounded-md bg-background border border-border/60 font-medium">LLM: 分析结果</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="px-3 py-1.5 rounded-md bg-background border border-border/60 font-medium">输出反馈</span>
                  </div>
                </div>
              </SubDoc>

              <SubDoc id="config-ai-workspace" title="AI 工作台 · 豆包 / 飞书智能伙伴 / WorkBuddy / 钉钉 AI">
                <p>这一类是<strong>面向「上班族」的企业 / 日常 AI 助手</strong>，产品形态是个聊天框 + 插件市场 / 扩展面板。接入后，员工在 App 里打字「帮我评一下这段录音」就能自动触发驰声评测，不用写任何代码。</p>

                <div className="grid gap-3 md:grid-cols-2 mt-4">
                  <div className="rounded-lg border border-border/60 p-4">
                    <p className="font-semibold text-sm mb-1 flex items-center gap-2"><Bot className="h-4 w-4 text-amber-500" /> 豆包（Doubao）App / 桌面版</p>
                    <p className="text-xs text-muted-foreground mb-2">字节跳动官方 AI 助手，2026 年起桌面版支持 MCP 扩展。</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>桌面版设置 → <strong>「智能体扩展」</strong> → 添加 MCP 服务</li>
                      <li>类型选 <code className="bg-muted px-1 rounded text-[10px] font-mono">streamable-http</code>，URL 填 <code className="bg-muted px-1 rounded text-[10px] font-mono">https://speech-eval.site/mcp</code></li>
                      <li>对话中直接说「帮我评测」即可自动调用</li>
                    </ol>
                  </div>

                  <div className="rounded-lg border border-border/60 p-4">
                    <p className="font-semibold text-sm mb-1 flex items-center gap-2"><Building2 className="h-4 w-4 text-blue-500" /> 飞书智能伙伴（My AI）</p>
                    <p className="text-xs text-muted-foreground mb-2">飞书企业 AI，支持以 MCP / Function Calling 挂载外部工具给团队 Bot。</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>飞书开发者后台 → 创建应用 → <strong>「AI 能力 / 智能伙伴」</strong></li>
                      <li>在「工具」中选 <strong>外部 MCP 服务</strong>，填入上方 URL</li>
                      <li>把智能伙伴拉进群聊，@ 它提交音频即可评测</li>
                    </ol>
                  </div>

                  <div className="rounded-lg border border-border/60 p-4">
                    <p className="font-semibold text-sm mb-1 flex items-center gap-2"><Sparkles className="h-4 w-4 text-rose-500" /> WorkBuddy / 企业智能助手</p>
                    <p className="text-xs text-muted-foreground mb-2">字节 WorkBuddy、腾讯会议 AI、企业微信智能助手等企业 AI 工作台场景。</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>在工作台的<strong>「技能 / 扩展」</strong>后台新增一个 MCP 连接器</li>
                      <li>传输协议选 Streamable HTTP，地址填 <code className="bg-muted px-1 rounded text-[10px] font-mono">https://speech-eval.site/mcp</code></li>
                      <li>把技能发布到指定部门 / 群组，HR、培训、销售口语陪练场景即可直接用</li>
                    </ol>
                  </div>

                  <div className="rounded-lg border border-border/60 p-4">
                    <p className="font-semibold text-sm mb-1 flex items-center gap-2"><Workflow className="h-4 w-4 text-cyan-500" /> 钉钉 AI 助理 / 通义千问 App</p>
                    <p className="text-xs text-muted-foreground mb-2">阿里生态：钉钉 AI 助理支持自定义插件，通义 App 可通过「AI 工具箱」挂载 MCP。</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>钉钉开发者后台 → AI 助理 → <strong>「插件开发 / MCP 接入」</strong></li>
                      <li>选 HTTP Streamable，填入驰声 MCP URL 并开启鉴权（可选）</li>
                      <li>在钉钉群 @AI 助理上传音频，自动返回评测卡片</li>
                    </ol>
                  </div>
                </div>

                <Callout type="tip"><strong>典型场景 · 小龙虾们的共同剧本</strong>：销售口语陪练 → 外语培训 → 主持 / 播音岗位考核 → K12 英语作业批改 → 客服话术复盘。这些「上班族 AI 工作台」接入驰声 MCP 后，员工 / 学员只要对着话筒说话，AI 就能自动打分并给出个性化改进建议，运营 / 培训 / 教研团队零开发即可上线。</Callout>
              </SubDoc>

              <SubDoc id="config-workflow-platforms" title="Dify / n8n / Flowise 等可视化编排">
                <p>如果你需要把语音评测编排进<strong>多步业务流</strong>（例如：学员录音 → 评测 → 生成错题集 → 推送到 CRM），可视化工作流平台比聊天 Bot 更合适。</p>

                <div className="grid gap-3 md:grid-cols-3 mt-4">
                  <div className="rounded-lg border border-border/60 p-4">
                    <p className="font-semibold text-sm mb-2">Dify</p>
                    <p className="text-xs text-muted-foreground mb-2">开源 LLMOps，v0.15+ 原生 MCP 工具。</p>
                    <ul className="list-disc list-inside space-y-0.5 text-xs">
                      <li>「工具」→「自定义 MCP」→ 填 URL</li>
                      <li>在 Chatflow / Workflow 节点里直接拖用</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border border-border/60 p-4">
                    <p className="font-semibold text-sm mb-2">n8n</p>
                    <p className="text-xs text-muted-foreground mb-2">工作流自动化，用 <code className="bg-muted px-1 rounded text-[10px] font-mono">MCP Client</code> 节点。</p>
                    <ul className="list-disc list-inside space-y-0.5 text-xs">
                      <li>添加 <strong>MCP Client</strong> 节点</li>
                      <li>Transport 选 HTTP Stream，URL 贴驰声地址</li>
                      <li>Tool 下拉自动列出 16 个评测能力</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border border-border/60 p-4">
                    <p className="font-semibold text-sm mb-2">Flowise / LangFlow</p>
                    <p className="text-xs text-muted-foreground mb-2">可视化 LangChain Agent 编排。</p>
                    <ul className="list-disc list-inside space-y-0.5 text-xs">
                      <li>拖出 <strong>MCP Tool</strong> 节点</li>
                      <li>连到 AgentExecutor 即可</li>
                    </ul>
                  </div>
                </div>

                <Callout type="info">可视化平台的好处是<strong>流程可追溯、可回放</strong>，适合教育机构 / 培训部门做批量评测 + 报表导出；缺点是单步延迟略高于直接 MCP 调用，对延迟敏感的交互场景建议用 Cursor / Claude Desktop 直连。</Callout>
              </SubDoc>

              <SubDoc id="config-other" title="其他 MCP 客户端（通用配置）">
                <p>任何遵循 MCP 协议的客户端都可以接入，统一使用以下配置：</p>
                <div className="overflow-x-auto rounded-lg border border-border/60">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border/40 bg-muted/30">
                      <th className="text-left py-2 px-3 font-medium">配置项</th>
                      <th className="text-left py-2 px-3 font-medium">值</th>
                    </tr></thead>
                    <tbody className="divide-y divide-border/30">
                      <tr><td className="py-2 px-3 font-medium">传输类型</td><td className="py-2 px-3 font-mono text-xs">streamable-http</td></tr>
                      <tr><td className="py-2 px-3 font-medium">URL</td><td className="py-2 px-3 font-mono text-xs">https://speech-eval.site/mcp</td></tr>
                      <tr><td className="py-2 px-3 font-medium">鉴权（可选）</td><td className="py-2 px-3 font-mono text-xs">Header：<code>Authorization: Bearer &lt;MCP_API_KEY&gt;</code></td></tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-3">还没找到你用的客户端？任何支持 <a href="https://modelcontextprotocol.io/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Model Context Protocol</a> 的终端都通用。找不到入口？下一小节「编程用 MCP」里用 SDK 直接接即可。</p>
              </SubDoc>
            </DocSection>

            {/* ══════ 接入 · 编程用 MCP ══════ */}
            <DocSection id="config-code" icon={Code2} title="接入 · 编程用 MCP（SDK / 代码集成）">

              <div className="rounded-lg border border-border/60 bg-muted/30 p-4 mb-5 text-sm">
                <p className="font-semibold mb-1.5 flex items-center gap-2"><Terminal className="h-4 w-4" /> 这一类接入的共同特征</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>你在写一段<strong className="text-foreground">真正的后端服务</strong>：一个 Agent Worker、一个 API、一个自动化脚本</li>
                  <li>业务里的「语音评测」是其中一个步骤，需要由代码 <strong className="text-foreground">决定何时调用</strong>、<strong className="text-foreground">如何解析结果</strong></li>
                  <li>三种主流写法：① 官方 MCP 客户端库 → ② Agent 框架自动桥接 → ③ 退化到 chat.completions + tools 参数</li>
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">💡 强烈推荐①或②：驰声有 16 个评测工具，<strong className="text-foreground">让 MCP 自动注入 tool schema</strong>，每新增一个题型不用改一行业务代码。</p>
              </div>

              <SubDoc id="code-mcp-sdk" title="① 官方 MCP 客户端库（Python / TypeScript）">
                <p>最底层、也最推荐的方式。由 <a href="https://modelcontextprotocol.io/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Anthropic 官方维护</a>，一次连接自动拿到全部工具的 JSON Schema，然后交给任意 LLM。</p>

                <p className="font-semibold mt-4">Python：<code className="bg-muted px-1 rounded text-xs font-mono">mcp</code></p>
                <CodeBlock filename="chivox_client.py" lang="python">{`# pip install mcp openai
import asyncio, os
from openai import OpenAI
from mcp.client.streamable_http import streamablehttp_client
from mcp import ClientSession

MCP_URL = "https://speech-eval.site/mcp"
llm = OpenAI(api_key=os.getenv("DOUBAO_KEY"),
             base_url="https://ark.cn-beijing.volces.com/api/v3")  # 豆包 / DeepSeek / OpenAI 同构

async def main(audio_id: str, ref: str):
    async with streamablehttp_client(MCP_URL) as (reader, writer, _):
        async with ClientSession(reader, writer) as sess:
            await sess.initialize()

            tools = await sess.list_tools()
            openai_tools = [{
                "type": "function",
                "function": {"name": t.name, "description": t.description,
                             "parameters": t.inputSchema},
            } for t in tools.tools]

            resp = llm.chat.completions.create(
                model="doubao-1-5-pro-32k",
                messages=[{"role": "user",
                           "content": f"帮我评测 audioId={audio_id}，参考文本：{ref}"}],
                tools=openai_tools,
            )

            for call in resp.choices[0].message.tool_calls or []:
                result = await sess.call_tool(call.function.name,
                                              arguments=eval(call.function.arguments))
                print(call.function.name, "→", result.content[0].text[:200])

asyncio.run(main("abc123", "I think therefore I am"))`}</CodeBlock>

                <p className="font-semibold mt-4">TypeScript / Node.js：<code className="bg-muted px-1 rounded text-xs font-mono">@modelcontextprotocol/sdk</code></p>
                <CodeBlock filename="chivox-client.ts" lang="typescript">{`// npm i @modelcontextprotocol/sdk openai
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import OpenAI from "openai";

const mcp = new Client({ name: "chivox-biz", version: "1.0.0" });
await mcp.connect(new StreamableHTTPClientTransport(new URL("https://speech-eval.site/mcp")));

const { tools } = await mcp.listTools();
const openai = new OpenAI({ apiKey: process.env.DEEPSEEK_KEY, baseURL: "https://api.deepseek.com" });

const resp = await openai.chat.completions.create({
  model: "deepseek-chat",
  messages: [{ role: "user", content: "评测 audioId=abc123, 参考 I think therefore I am" }],
  tools: tools.map(t => ({ type: "function", function: {
    name: t.name, description: t.description, parameters: t.inputSchema
  }})),
});

for (const call of resp.choices[0].message.tool_calls ?? []) {
  const r = await mcp.callTool({ name: call.function.name,
                                 arguments: JSON.parse(call.function.arguments) });
  console.log(call.function.name, r.content);
}`}</CodeBlock>
                <Callout type="tip">这种写法 <strong>LLM 供应商可换</strong>（豆包 / DeepSeek / GPT / Qwen / Moonshot），<strong>工具自动更新</strong>（驰声新增题型无需改业务代码），适合生产后端。</Callout>
              </SubDoc>

              <SubDoc id="code-agent-frameworks" title="② 用 Agent 框架自动桥接（LangChain / Mastra / Agents SDK）">
                <p>如果项目已经在用 Agent 框架，几行 adapter 就能把驰声 MCP 塞进去，框架本身会接管 tool-calling 循环、重试、日志。</p>

                <div className="grid gap-3 md:grid-cols-2 mt-4">
                  <div className="rounded-lg border border-border/60 p-4">
                    <p className="font-semibold text-sm mb-2">LangChain / LangGraph（Python）</p>
                    <CodeBlock filename="agent.py" lang="python">{`# pip install langchain-mcp-adapters langgraph
from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.prebuilt import create_react_agent

client = MultiServerMCPClient({
    "chivox": {
        "transport": "streamable_http",
        "url": "https://speech-eval.site/mcp",
    }
})
tools = await client.get_tools()

agent = create_react_agent("openai:gpt-4o-mini", tools)
result = await agent.ainvoke({"messages":
    [("user", "评测 audioId=abc123 参考 think")]})
print(result["messages"][-1].content)`}</CodeBlock>
                  </div>

                  <div className="rounded-lg border border-border/60 p-4">
                    <p className="font-semibold text-sm mb-2">Mastra（TypeScript）</p>
                    <CodeBlock filename="mastra-agent.ts" lang="typescript">{`// npm i @mastra/core @mastra/mcp
import { MCPClient } from "@mastra/mcp";
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";

const mcp = new MCPClient({ servers: {
  chivox: { url: new URL("https://speech-eval.site/mcp") }
}});

export const speechCoach = new Agent({
  name: "speech-coach",
  instructions: "你是口语教练，用 chivox 工具评测并给改进建议。",
  model: openai("gpt-4o-mini"),
  tools: await mcp.getTools(),
});`}</CodeBlock>
                  </div>

                  <div className="rounded-lg border border-border/60 p-4">
                    <p className="font-semibold text-sm mb-2">OpenAI Agents SDK（Python）</p>
                    <CodeBlock filename="agents_sdk.py" lang="python">{`# pip install openai-agents
from agents import Agent, Runner
from agents.mcp import MCPServerStreamableHttp

chivox = MCPServerStreamableHttp(
    params={"url": "https://speech-eval.site/mcp"},
    name="chivox-speech-eval",
)

async with chivox:
    agent = Agent(name="coach",
                  instructions="专业口语教练",
                  mcp_servers=[chivox])
    r = await Runner.run(agent, "评测 audioId=abc123")
    print(r.final_output)`}</CodeBlock>
                  </div>

                  <div className="rounded-lg border border-border/60 p-4">
                    <p className="font-semibold text-sm mb-2">LlamaIndex / AutoGen / CrewAI</p>
                    <p className="text-xs text-muted-foreground mb-2">这些框架都有官方或社区 MCP adapter，用法与上述类似：</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li><strong>LlamaIndex</strong>：<code className="bg-muted px-1 rounded text-[10px] font-mono">llama-index-tools-mcp</code></li>
                      <li><strong>AutoGen</strong>：<code className="bg-muted px-1 rounded text-[10px] font-mono">autogen-ext[mcp]</code></li>
                      <li><strong>CrewAI</strong>：<code className="bg-muted px-1 rounded text-[10px] font-mono">crewai-tools</code> 的 MCPServerAdapter</li>
                      <li><strong>Spring AI</strong>（Java）：<code className="bg-muted px-1 rounded text-[10px] font-mono">spring-ai-mcp-client</code></li>
                    </ul>
                  </div>
                </div>
              </SubDoc>

              <SubDoc id="code-function-calling" title="③ 直调 chat.completions · tools 参数（豆包 / DeepSeek / 火山方舟）">
                <p>当你用的 LLM SDK <strong>还没有原生 MCP 支持</strong>（比如老版本的火山方舟 / 百度千帆 / 通义 DashScope），退化方案是：用 MCP 客户端<strong>一次性拉到 tool schema</strong>，然后按 OpenAI Function Calling 格式喂给 LLM。</p>
                <CodeBlock filename="doubao_tools.py" lang="python">{`# 适用：豆包（火山方舟）/ DeepSeek / Qwen / Moonshot / GLM 等 OpenAI 兼容 API
# 核心思路：MCP 列工具 → 转 OpenAI tools → LLM 决策 → MCP 执行 → 回填

async with streamablehttp_client("https://speech-eval.site/mcp") as (r, w, _):
    async with ClientSession(r, w) as mcp:
        await mcp.initialize()
        tools = (await mcp.list_tools()).tools

        # ① 用 MCP 拉到的 schema 自动转 OpenAI 格式
        oa_tools = [{"type": "function", "function": {
            "name": t.name,
            "description": t.description,
            "parameters": t.inputSchema,
        }} for t in tools]

        # ② 喂给豆包
        messages = [{"role": "user", "content": "评测一下 audioId=abc123"}]
        resp = doubao.chat.completions.create(
            model="doubao-1-5-pro-32k", messages=messages, tools=oa_tools,
        )

        # ③ LLM 回 tool_calls → 折返跑到 MCP 执行
        msg = resp.choices[0].message
        if msg.tool_calls:
            messages.append(msg)
            for c in msg.tool_calls:
                result = await mcp.call_tool(
                    c.function.name, arguments=json.loads(c.function.arguments))
                messages.append({"role": "tool", "tool_call_id": c.id,
                                 "content": result.content[0].text})
            # ④ 再喂一轮，让豆包根据评测结果产出自然语言诊断
            final = doubao.chat.completions.create(
                model="doubao-1-5-pro-32k", messages=messages)
            print(final.choices[0].message.content)`}</CodeBlock>
                <Callout type="warning"><strong>千万别手写 tool schema！</strong>驰声 16 个评测工具每个都有几十个字段，手写既容易错也难维护。一定用 MCP <code className="bg-black/5 dark:bg-white/10 px-1 rounded text-xs font-mono">list_tools()</code> 动态拿。</Callout>
              </SubDoc>

              <SubDoc id="code-selfhosted-agent" title="④ 自研后端 Agent（FastAPI / NestJS / Spring）">
                <p>大部分落地场景其实是：<strong>你已有一个业务后端</strong>（教育 SaaS / 培训系统 / 客服平台），只需要新增一个「语音评测」能力。推荐架构：</p>

                <div className="rounded-lg bg-muted/30 p-5 my-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-3 py-1.5 rounded-md bg-background border border-border/60 font-medium">前端录音 / 上传</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="px-3 py-1.5 rounded-md bg-background border border-border/60 font-medium">业务后端</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="px-3 py-1.5 rounded-md bg-primary/10 border border-primary/30 font-medium">MCP Client（常驻连接）</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="px-3 py-1.5 rounded-md bg-background border border-border/60 font-medium">驰声 MCP</span>
                    <span className="text-muted-foreground">↘</span>
                    <span className="px-3 py-1.5 rounded-md bg-background border border-border/60 font-medium">LLM（诊断 / 出题）</span>
                  </div>
                </div>

                <p className="font-semibold mt-2">FastAPI 示例（生产最小骨架）</p>
                <CodeBlock filename="app.py" lang="python">{`from fastapi import FastAPI
from mcp.client.streamable_http import streamablehttp_client
from mcp import ClientSession
from contextlib import asynccontextmanager

mcp_session: ClientSession | None = None

@asynccontextmanager
async def lifespan(app):
    global mcp_session
    async with streamablehttp_client("https://speech-eval.site/mcp") as (r, w, _):
        async with ClientSession(r, w) as s:
            await s.initialize()
            mcp_session = s
            yield
    mcp_session = None

app = FastAPI(lifespan=lifespan)

@app.post("/api/evaluate")
async def evaluate(audio_id: str, ref_text: str):
    # 直接选一个最合适的工具执行（不经 LLM，延迟最低）
    r = await mcp_session.call_tool("evaluate_english_sentence",
                                    {"audioId": audio_id, "sentence": ref_text})
    return {"result": r.content[0].text}`}</CodeBlock>

                <Callout type="tip"><strong>关键优化</strong>：① MCP 连接在 lifespan 里做成长连接，不要每次请求都重连；② 对延迟敏感的场景可以「跳过 LLM 直接调 tool」，把 LLM 放到「生成诊断报告」那一步。</Callout>
              </SubDoc>

              <div className="rounded-lg border border-border/60 bg-muted/30 p-4 mt-6 text-sm">
                <p className="font-semibold mb-2">方案选型速查</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-border/40">
                      <th className="text-left py-2 font-medium">场景</th>
                      <th className="text-left py-2 font-medium">推荐方案</th>
                    </tr></thead>
                    <tbody className="divide-y divide-border/30">
                      <tr><td className="py-2">AI 对话 / Copilot 类产品，LLM 供应商可能会换</td><td className="py-2">① 官方 MCP 客户端库</td></tr>
                      <tr><td className="py-2">已有 LangChain / Mastra / Agents SDK 技术栈</td><td className="py-2">② Agent 框架 + adapter</td></tr>
                      <tr><td className="py-2">火山方舟 / 千帆控制台直连，最小侵入</td><td className="py-2">③ chat.completions + tools</td></tr>
                      <tr><td className="py-2">教育 SaaS / 培训 / 客服等业务后端集成</td><td className="py-2">④ 自研后端 Agent</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </DocSection>

            {/* ══════ 评测模式 ══════ */}
            <DocSection id="eval-modes" icon={Radio} title="评测模式">

              <SubDoc id="stream-eval" title="实时录音评测（边录边评）">
                <p>通过本地麦克风实时录音，音频以 WebSocket 流式推送到评测服务，<strong>无需生成中间文件</strong>。这是最灵活、延迟最低的评测方式，特别适合交互式口语练习场景。</p>
                <Callout type="tip">实时录音评测需要安装 <strong>SoX</strong> 并使用本地代理模式（Claude Desktop / Claude Code）。Cursor 等远程直连模式暂不支持实时录音。</Callout>

                <p className="font-semibold mt-4">需要按顺序调用三个工具：</p>

                <div className="mt-3 space-y-4">
                  <div className="rounded-lg border border-border/60 p-4">
                    <p className="font-semibold text-sm mb-2"><code className="bg-muted px-1.5 py-0.5 rounded text-xs">create_stream_session</code> — 创建流式评测会话</p>
                    <ParamTable params={[
                      { name: 'core_type', type: 'string', required: true, desc: '评测类型，如 en.word.score、en.sent.score、cn.sent.raw' },
                      { name: 'ref_text', type: 'string', required: true, desc: '评测参考文本' },
                      { name: 'audio_type', type: 'string', required: false, desc: '音频格式，默认 mp3' },
                      { name: 'sample_rate', type: 'number', required: false, desc: '采样率，默认 16000' },
                      { name: 'rank', type: 'number', required: false, desc: '评分制：4 或 100，默认 100' },
                    ]} />
                    <p className="text-xs text-muted-foreground mt-2">返回 <code className="bg-muted px-1 rounded text-xs">session_id</code>，后续步骤需使用。</p>
                  </div>

                  <div className="rounded-lg border border-border/60 p-4">
                    <p className="font-semibold text-sm mb-2"><code className="bg-muted px-1.5 py-0.5 rounded text-xs">start_recording</code> — 开始麦克风录音</p>
                    <ParamTable params={[
                      { name: 'session_id', type: 'string', required: true, desc: '来自 create_stream_session 的会话 ID' },
                      { name: 'chunk_size', type: 'number', required: false, desc: '音频块大小（bytes），默认 3200' },
                      { name: 'chunk_interval_ms', type: 'number', required: false, desc: '推送间隔（ms），默认 100' },
                    ]} />
                    <p className="text-xs text-muted-foreground mt-2">调用后自动启动麦克风，音频通过 WebSocket 实时推送到评测服务。</p>
                  </div>

                  <div className="rounded-lg border border-border/60 p-4">
                    <p className="font-semibold text-sm mb-2"><code className="bg-muted px-1.5 py-0.5 rounded text-xs">stop_recording</code> — 停止录音并获取结果</p>
                    <ParamTable params={[
                      { name: 'session_id', type: 'string', required: true, desc: '会话 ID' },
                      { name: 'timeout', type: 'number', required: false, desc: '等待评测结果超时秒数，默认 30' },
                    ]} />
                  </div>
                </div>
              </SubDoc>

              <SubDoc id="stream-flow" title="流式评测完整流程">
                <div className="rounded-lg border border-border/60 p-5 bg-muted/10 space-y-5">
                  <FlowStep title="1">
                    <p><strong>用户：</strong>&quot;请评测我的英文发音，文本是 Hello&quot;</p>
                    <p className="text-muted-foreground mt-1">AI 调用 <code className="bg-muted px-1 rounded text-xs font-mono">create_stream_session(core_type=&quot;en.word.score&quot;, ref_text=&quot;Hello&quot;)</code></p>
                    <p className="text-muted-foreground">→ 获得 <code className="bg-muted px-1 rounded text-xs font-mono">session_id</code></p>
                  </FlowStep>
                  <FlowStep title="2">
                    <p>AI 调用 <code className="bg-muted px-1 rounded text-xs font-mono">start_recording(session_id=xxx)</code></p>
                    <p className="text-muted-foreground mt-1">麦克风开始录音，音频通过 WebSocket 实时推送到评测服务</p>
                  </FlowStep>
                  <FlowStep title="3">
                    <p><strong>用户</strong>说完后告知 AI &quot;结束&quot;</p>
                    <p className="text-muted-foreground mt-1">AI 调用 <code className="bg-muted px-1 rounded text-xs font-mono">stop_recording(session_id=xxx)</code></p>
                    <p className="text-muted-foreground">→ 返回评测结果（总分、准确度、流利度、音素得分等）</p>
                  </FlowStep>
                </div>
              </SubDoc>

              <SubDoc id="file-eval" title="音频文件评测">
                <p>适用于已有音频文件的评测场景，支持三种输入方式：</p>
                <div className="overflow-x-auto rounded-lg border border-border/60">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border/40 bg-muted/30">
                      <th className="text-left py-2 px-3 font-medium">参数</th>
                      <th className="text-left py-2 px-3 font-medium">说明</th>
                      <th className="text-left py-2 px-3 font-medium">适用场景</th>
                    </tr></thead>
                    <tbody className="divide-y divide-border/30">
                      <tr><td className="py-2 px-3 font-mono text-xs">audio_file_path</td><td className="py-2 px-3">本地文件路径</td><td className="py-2 px-3 text-muted-foreground">代理自动读取并转为 Base64，最便捷</td></tr>
                      <tr><td className="py-2 px-3 font-mono text-xs">audio_base64</td><td className="py-2 px-3">Base64 编码数据</td><td className="py-2 px-3 text-muted-foreground">已有编码数据时使用</td></tr>
                      <tr><td className="py-2 px-3 font-mono text-xs">audio_url</td><td className="py-2 px-3">音频文件 URL</td><td className="py-2 px-3 text-muted-foreground">音频托管在云存储时使用</td></tr>
                    </tbody>
                  </table>
                </div>
                <Callout type="tip">推荐使用 <code className="bg-black/5 dark:bg-white/10 px-1 rounded text-xs">audio_file_path</code>，只需传入本地文件路径，代理会自动处理编码和上传。</Callout>
                <p><strong>支持的音频格式：</strong>mp3, wav, ogg, m4a, aac, pcm</p>
                <p><strong>限制：</strong>单文件最大 50MB，大于 500KB 的文件自动压缩为 16kHz / 单声道 / 32kbps。</p>
              </SubDoc>
            </DocSection>

            {/* ══════ API 参考 ══════ */}
            <DocSection id="api-reference" icon={BookOpen} title="API 参考">

              <SubDoc id="tools-en" title="英文评测工具（10 种）">
                <ToolTable tools={[
                  ['en_word_eval', '单词评测', '评测 "Hello" 的发音准确度'],
                  ['en_word_correction', '单词纠音', '检测多读/漏读/错读并给出纠正建议'],
                  ['en_vocab_eval', '词语评测', '同时评测多个单词的发音'],
                  ['en_sentence_eval', '句子评测', '评测整句朗读的准确度与流利度'],
                  ['en_sentence_correction', '句子纠音', '逐词检测发音问题并给出修正建议'],
                  ['en_paragraph_eval', '段落朗读评测', '评测整段英文课文的朗读质量'],
                  ['en_phonics_eval', '自然拼读评测', '评测 Phonics 拼读规则掌握程度'],
                  ['en_choice_eval', '口语选择题', '从预设选项中识别口语回答'],
                  ['en_semi_open_eval', '半开放题评测', '场景对话等半开放口语题型'],
                  ['en_realtime_eval', '实时朗读评测', '实时反馈朗读质量，逐句评分'],
                ]} />

                <p className="mt-4"><strong>通用参数：</strong>所有英文评测工具均支持以下参数。</p>
                <ParamTable params={[
                  { name: 'ref_text', type: 'string', required: true, desc: '评测参考文本' },
                  { name: 'audio_file_path', type: 'string', required: false, desc: '本地音频文件路径（三选一）' },
                  { name: 'audio_base64', type: 'string', required: false, desc: 'Base64 编码的音频数据（三选一）' },
                  { name: 'audio_url', type: 'string', required: false, desc: '音频文件 URL（三选一）' },
                  { name: 'accent', type: 'string', required: false, desc: '口音：british / american（默认）' },
                ]} />
              </SubDoc>

              <SubDoc id="tools-cn" title="中文评测工具（6 种）">
                <ToolTable tools={[
                  ['cn_word_raw_eval', '单字评测（汉字）', '评测 "中" 的发音'],
                  ['cn_word_pinyin_eval', '单字评测（拼音）', '评测 "zhōng" 的发音'],
                  ['cn_sentence_eval', '词句评测', '评测 "你好世界" 的朗读'],
                  ['cn_paragraph_eval', '段落朗读评测', '评测一段中文课文的朗读质量'],
                  ['cn_rec_eval', '有限分支识别评测', '从预设选项中识别用户发音'],
                  ['cn_aitalk_eval', 'AI Talk 口语评测', '中文口语对话能力评测'],
                ]} />

                <p className="mt-4"><strong>通用参数：</strong></p>
                <ParamTable params={[
                  { name: 'ref_text', type: 'string', required: true, desc: '评测参考文本（汉字或拼音）' },
                  { name: 'audio_file_path', type: 'string', required: false, desc: '本地音频文件路径（三选一）' },
                  { name: 'audio_base64', type: 'string', required: false, desc: 'Base64 编码的音频数据（三选一）' },
                  { name: 'audio_url', type: 'string', required: false, desc: '音频文件 URL（三选一）' },
                ]} />
              </SubDoc>

              <SubDoc id="result-fields" title="评测结果字段">
                <p>所有评测工具返回统一的结构化结果：</p>
                <CodeBlock filename="result.json" lang="json">{`{
  "overall": 85,
  "accuracy": 82,
  "pron": 88,
  "fluency": {
    "overall": 78,
    "speed": 65,
    "pause": 2
  },
  "integrity": 95,
  "details": [
    {
      "char": "hello",
      "score": 85,
      "phone": [
        { "phoneme": "h", "score": 90 },
        { "phoneme": "ɛ", "score": 82 },
        { "phoneme": "l", "score": 88 },
        { "phoneme": "oʊ", "score": 80 }
      ]
    }
  ]
}`}</CodeBlock>
                <div className="overflow-x-auto rounded-lg border border-border/60">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border/40 bg-muted/30">
                      <th className="text-left py-2 px-3 font-medium">字段</th>
                      <th className="text-left py-2 px-3 font-medium">范围</th>
                      <th className="text-left py-2 px-3 font-medium">说明</th>
                    </tr></thead>
                    <tbody className="divide-y divide-border/30">
                      {[
                        ['overall', '0–100', '综合总分，反映整体语音质量'],
                        ['accuracy', '0–100', '准确度，音素级别的发音准确率'],
                        ['pron', '0–100', '发音得分，整体发音质量评价'],
                        ['fluency.overall', '0–100', '流利度，语流的自然度与平滑度'],
                        ['fluency.speed', '0–100', '语速得分，每分钟词/音节计量'],
                        ['fluency.pause', 'number', '不自然停顿次数'],
                        ['integrity', '0–100', '完整度，是否完整朗读了参考文本'],
                        ['details[].phone[]', 'array', '每个音素的独立评分，可定位具体弱项'],
                        ['details[].stress[]', 'array', '重音得分，检测重弱读是否正确'],
                      ].map(([field, range, desc]) => (
                        <tr key={field}>
                          <td className="py-2 px-3 font-mono text-xs">{field}</td>
                          <td className="py-2 px-3 text-muted-foreground">{range}</td>
                          <td className="py-2 px-3">{desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SubDoc>

              <SubDoc id="error-codes" title="错误码">
                <div className="overflow-x-auto rounded-lg border border-border/60">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border/40 bg-muted/30">
                      <th className="text-left py-2 px-3 font-medium">场景</th>
                      <th className="text-left py-2 px-3 font-medium">原因</th>
                      <th className="text-left py-2 px-3 font-medium">解决方式</th>
                    </tr></thead>
                    <tbody className="divide-y divide-border/30">
                      {[
                        ['音频 ID 无效或已过期', '音频上传后 5 分钟内有效，评测完成后自动删除', '重新上传音频'],
                        ['服务器繁忙', '当前请求过多，排队已满', '稍后重试，使用指数退避策略'],
                        ['存储空间已满', '服务器临时音频存储已满', '稍后重试，系统会自动清理'],
                        ['音频格式不支持', '上传了不支持的文件类型', '使用 mp3/wav/ogg/m4a/aac/pcm'],
                        ['音频时长超限', '超过该题型最大时长限制', '裁剪音频后重试'],
                        ['WebSocket 连接断开', '网络不稳定导致流式连接中断', '代理会自动重连，如持续失败请检查网络'],
                      ].map(([scene, reason, fix]) => (
                        <tr key={scene}>
                          <td className="py-2 px-3 font-medium">{scene}</td>
                          <td className="py-2 px-3 text-muted-foreground">{reason}</td>
                          <td className="py-2 px-3">{fix}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SubDoc>
            </DocSection>

            {/* ══════ 架构说明 ══════ */}
            <DocSection id="architecture" icon={Terminal} title="架构说明">

              <SubDoc id="arch-diagram" title="系统架构">
                <div className="flex flex-wrap items-center justify-center gap-4 my-6">
                  <div className="rounded-xl border-2 border-foreground/30 px-6 py-4 text-center min-w-[140px]">
                    <p className="text-xs font-semibold mb-1">AI 客户端</p>
                    <p className="text-[11px] text-muted-foreground">Claude Desktop<br/>Claude Code<br/>Cursor</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-muted-foreground">⇄</p>
                    <p className="text-[10px] text-muted-foreground">stdio</p>
                  </div>
                  <div className="rounded-xl border-2 border-emerald-500/50 bg-emerald-500/5 px-6 py-4 text-center min-w-[140px]">
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">chivox-local-mcp</p>
                    <p className="text-[11px] text-muted-foreground">本地代理<br/>SoX 录音</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-muted-foreground">⇄</p>
                    <p className="text-[10px] text-muted-foreground">HTTP / WS</p>
                  </div>
                  <div className="rounded-xl border-2 border-foreground/30 px-6 py-4 text-center min-w-[140px]">
                    <p className="text-xs font-semibold mb-1">Remote Chivox</p>
                    <p className="text-[11px] text-muted-foreground">MCP Server<br/>评测引擎</p>
                  </div>
                </div>
              </SubDoc>

              <SubDoc id="transport" title="传输协议">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-foreground shrink-0" />
                    <span><strong>stdio</strong> — AI 客户端通过标准输入输出与本地代理通信，这是 MCP 的标准传输方式</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-foreground shrink-0" />
                    <span><strong>HTTP</strong> — 音频文件评测工具通过 HTTP 代理到远程服务，适用于非流式场景</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-foreground shrink-0" />
                    <span><strong>WebSocket</strong> — 实时录音音频通过 WebSocket 流式推送，支持断线自动重连</span>
                  </li>
                </ul>
              </SubDoc>
            </DocSection>

            {/* ══════ 示例代码 ══════ */}
            <DocSection id="integration" icon={Code2} title="示例代码">

              <SubDoc id="code-python" title="Python 上传音频">
                <CodeBlock filename="upload.py" lang="python">{`import requests

with open('audio.mp3', 'rb') as f:
    r = requests.post(
        'https://speech-eval.site/upload',
        data=f,
        headers={'Content-Type': 'audio/mp3'}
    )

result = r.json()
print(f"audioId: {result['audioId']}")
print(f"size: {result['size']} bytes")
print(f"expires: {result['expiresIn']}")`}</CodeBlock>
              </SubDoc>

              <SubDoc id="code-javascript" title="JavaScript 上传音频">
                <CodeBlock filename="upload.js" lang="javascript">{`const fs = require('fs');

const audioData = fs.readFileSync('audio.mp3');

const res = await fetch('https://speech-eval.site/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'audio/mp3' },
  body: audioData,
});

const result = await res.json();
console.log('audioId:', result.audioId);`}</CodeBlock>
              </SubDoc>
            </DocSection>

            {/* ══════ 最佳实践 ══════ */}
            <DocSection id="best-practices" icon={FileText} title="最佳实践">

              <SubDoc id="prompt-templates" title="Prompt 模板">
                <p>以下模板帮助你引导 LLM 对评测结果进行深度分析：</p>
                <div className="space-y-4 mt-4">
                  <div className="border border-border/60 rounded-lg p-4">
                    <p className="font-semibold text-sm mb-2 flex items-center gap-2"><MessageSquare className="h-4 w-4" /> 发音诊断</p>
                    <CodeBlock filename="prompt-diagnosis.txt">{`你是一位专业的英语口语教练。请根据以下 MCP 评测结果分析学生的发音表现：

评测结果：{evaluation_result}

请按以下格式输出：
1. 总体评价（一句话）
2. 优势项（>80 分的指标）
3. 弱项分析（<70 分的指标，定位到具体音素）
4. 针对性练习建议（2-3 条可操作的建议）`}</CodeBlock>
                  </div>
                  <div className="border border-border/60 rounded-lg p-4">
                    <p className="font-semibold text-sm mb-2 flex items-center gap-2"><Mic className="h-4 w-4" /> 练习生成</p>
                    <CodeBlock filename="prompt-practice.txt">{`根据以下弱项列表，为学生生成针对性的口语练习材料：

弱项：{weak_points}

请生成：
1. 3 个绕口令（专门针对弱项音素）
2. 5 个包含目标音素的常用短句（标注重音和连读）
3. 1 段跟读练习段落（50-80 词）`}</CodeBlock>
                  </div>
                  <div className="border border-border/60 rounded-lg p-4">
                    <p className="font-semibold text-sm mb-2 flex items-center gap-2"><BarChart3 className="h-4 w-4" /> 学习报告</p>
                    <CodeBlock filename="prompt-report.txt">{`请根据学生近 7 天的评测历史生成学习报告：

评测历史：{history}

报告要求：
1. 整体趋势（进步/持平/退步）
2. 各维度变化（准确度、流利度、语速）
3. 本周最大进步项
4. 下周重点练习建议
5. 鼓励性总结`}</CodeBlock>
                  </div>
                </div>
              </SubDoc>

              <SubDoc id="error-handling" title="错误处理">
                <ul className="space-y-3 mt-2">
                  <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground shrink-0" /><span><strong>音频过期：</strong>上传后 5 分钟内有效。建议在上传后 3 分钟内完成评测。</span></li>
                  <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground shrink-0" /><span><strong>服务繁忙：</strong>使用指数退避策略重试（1s → 2s → 4s），最多 3 次。</span></li>
                  <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground shrink-0" /><span><strong>录音中断：</strong>WebSocket 断线后代理会自动重连。如持续失败，检查网络连接和 SoX 安装。</span></li>
                </ul>
              </SubDoc>

              <SubDoc id="performance" title="性能优化">
                <ul className="space-y-3 mt-2">
                  <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground shrink-0" /><span><strong>优先使用流式评测：</strong>实时录音模式跳过了文件上传环节，端到端延迟比文件评测低 30-50%。</span></li>
                  <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground shrink-0" /><span><strong>音频压缩：</strong>文件评测时，上传前将音频转为 16kHz 单声道 mp3，可减少 60-80% 的上传体积。</span></li>
                  <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground shrink-0" /><span><strong>选择合适的工具：</strong>单词评测比段落评测快 3-5 倍。如只需单词级分数，不要用句子评测。</span></li>
                  <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground shrink-0" /><span><strong>本地文件路径最便捷：</strong>使用 <code className="bg-muted px-1 rounded text-xs">audio_file_path</code> 参数传入本地路径，代理自动处理编码，无需手动转 Base64。</span></li>
                </ul>
              </SubDoc>
            </DocSection>

            {/* ══════ 服务信息 ══════ */}
            <DocSection id="service-info" icon={Globe} title="服务信息">
              <SubDoc id="endpoints" title="服务端点">
                <div className="overflow-x-auto rounded-lg border border-border/60">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border/40 bg-muted/30">
                      <th className="text-left py-2 px-3 font-medium">端点</th>
                      <th className="text-left py-2 px-3 font-medium">方法</th>
                      <th className="text-left py-2 px-3 font-medium">说明</th>
                    </tr></thead>
                    <tbody className="divide-y divide-border/30">
                      <tr><td className="py-2 px-3 font-mono text-xs">/upload</td><td className="py-2 px-3">POST</td><td className="py-2 px-3">音频文件上传</td></tr>
                      <tr><td className="py-2 px-3 font-mono text-xs">/mcp</td><td className="py-2 px-3">POST</td><td className="py-2 px-3">MCP JSON-RPC 接口（Streamable HTTP）</td></tr>
                      <tr><td className="py-2 px-3 font-mono text-xs">/health</td><td className="py-2 px-3">GET</td><td className="py-2 px-3">健康检查</td></tr>
                    </tbody>
                  </table>
                </div>
              </SubDoc>
              <SubDoc id="limits" title="服务限制">
                <div className="overflow-x-auto rounded-lg border border-border/60">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border/40 bg-muted/30">
                      <th className="text-left py-2 px-3 font-medium">配置项</th>
                      <th className="text-left py-2 px-3 font-medium">默认值</th>
                      <th className="text-left py-2 px-3 font-medium">说明</th>
                    </tr></thead>
                    <tbody className="divide-y divide-border/30">
                      {[
                        ['存储限制', '500MB', '最大音频存储空间'],
                        ['最大排队', '10', '等待处理的请求数'],
                        ['最大并发', '3', '同时处理的评测数'],
                        ['音频有效期', '5 分钟', '上传后未评测自动过期'],
                        ['文件大小限制', '50MB', '单个音频文件最大'],
                      ].map(([k, v, d]) => (
                        <tr key={k}><td className="py-2 px-3 font-medium">{k}</td><td className="py-2 px-3 font-mono text-xs">{v}</td><td className="py-2 px-3 text-muted-foreground">{d}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SubDoc>
              <SubDoc id="changelog" title="更新日志">
                <div className="space-y-3">
                  {[
                    { ver: 'v3.0.0', date: '2026-04-16', desc: '新增本地代理模式，支持实时录音流式评测，工具扩展至 16 种' },
                    { ver: 'v2.3.0', date: '2026-03-25', desc: '支持 HTTPS，域名 speech-eval.site' },
                    { ver: 'v2.2.0', date: '2026-03-24', desc: '添加 MCP 配置指南（Cursor / Claude Desktop）' },
                    { ver: 'v2.1.0', date: '2026-03-24', desc: '简化上传流程，统一使用 HTTP API' },
                    { ver: 'v2.0.0', date: '2026-03-24', desc: '初始版本，支持多种评测类型' },
                  ].map(l => (
                    <div key={l.ver} className="flex items-start gap-3">
                      <span className="font-mono text-xs font-bold bg-muted px-2 py-0.5 rounded shrink-0">{l.ver}</span>
                      <span className="text-xs text-muted-foreground shrink-0 mt-0.5">{l.date}</span>
                      <span className="text-sm">{l.desc}</span>
                    </div>
                  ))}
                </div>
              </SubDoc>
            </DocSection>

    </DocsShell>
  );
}

export default function DocsPage() {
  const locale = useLocale();
  return locale.startsWith('zh') ? <DocsPageZh /> : <DocsPageEn />;
}
