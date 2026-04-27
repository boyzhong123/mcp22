'use client';

/**
 * Full English developer documentation (structure & anchor ids mirror the Chinese page).
 */
import {
  BookOpen,
  Code2,
  Zap,
  FileText,
  Check,
  Terminal,
  Mic,
  MessageSquare,
  BarChart3,
  AlertTriangle,
  Radio,
  FolderOpen,
  Workflow,
  Sparkles,
  Plug,
  Globe,
} from 'lucide-react';

import {
  CodeBlock,
  DocSection,
  SubDoc,
  ParamTable,
  Callout,
  FlowStep,
  ToolTable,
} from './docs-shared';

export function DocsEnglishBody() {
  const L: 'en' = 'en';
  return (
    <>
      <ConceptSection L={L} />
      <DocsEnglishBodyRest L={L} />
    </>
  );
}

function ConceptSection({ L }: { L: 'en' }) {
  return (
    <DocSection id="concept" icon={Workflow} title="How MCP works">
        <SubDoc id="why-mcp" title="Why MCP">
          <p>
            Large language models (GPT, Claude, Gemini, Qwen, …) are fundamentally <strong>text brains</strong>: they
            excel at reading and writing, but they cannot <strong>hear</strong> audio, <strong>open</strong> your
            database, or <strong>call</strong> third-party APIs on their own.
          </p>
          <p>
            <strong>Model Context Protocol (MCP)</strong> is an open standard (led by Anthropic, adopted across the
            industry). It is like a walkie-talkie: the model can invoke external tools, data sources, and services when
            needed, then continue the conversation with the results.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 my-4">
            <div className="rounded-lg border border-border/60 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-semibold">Without MCP</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
                <li>· Read REST docs for the scoring service</li>
                <li>· Hand-write auth, upload, polling</li>
                <li>· Serialize results into prompts manually</li>
                <li>· Repeat for every new model provider</li>
              </ul>
            </div>
            <div className="rounded-lg border-2 border-foreground/60 p-4 bg-foreground/[0.02]">
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-4 w-4 text-foreground" />
                <span className="text-sm font-semibold">With Chivox MCP</span>
              </div>
              <ul className="text-xs space-y-1.5 leading-relaxed">
                <li>· Paste one MCP server URL</li>
                <li>· The model discovers &amp; calls scoring tools</li>
                <li>· Works with any MCP-capable assistant</li>
                <li>· No custom integration code for the happy path</li>
              </ul>
            </div>
          </div>
          <Callout type="info">
            MCP turns “wire up speech scoring” from a backend project into a <strong>configuration task</strong>. That
            is why Cursor, Claude Desktop, Dify, Coze, Doubao, Feishu assistants, and others ship MCP support.
          </Callout>
        </SubDoc>

        <SubDoc id="scenario-walkthrough" title="Scenario walkthrough · six steps">
          <p>
            Picture an <strong>IELTS speaking coach mini-app</strong> built on Claude with Chivox MCP. When a user sends
            a recording, the flow looks like this:
          </p>
          <div className="rounded-lg border border-border/60 bg-muted/20 p-5 my-4 space-y-5">
            <FlowStep title="1">
              <p>
                <strong className="text-foreground">Configure once</strong> (developer)
              </p>
              <p className="text-muted-foreground mt-1">
                Add the Chivox MCP server URL. On startup the model learns there is a new <strong>speech evaluation</strong>{' '}
                tool.
              </p>
            </FlowStep>
            <FlowStep title="2">
              <p>
                <strong className="text-foreground">User message</strong>
              </p>
              <p className="text-muted-foreground mt-1">
                The user uploads a self-introduction clip and asks: “Where is my pronunciation weak?” The backend
                forwards text + audio reference to the model.
              </p>
            </FlowStep>
            <FlowStep title="3">
              <p>
                <strong className="text-foreground">Model reasoning</strong>
              </p>
              <div className="text-muted-foreground mt-1 rounded-md bg-background/80 border border-border/40 px-3 py-2 text-xs leading-relaxed">
                “The user wants pronunciation feedback.”
                <br />
                “I cannot hear audio directly.”
                <br />
                “I have an MCP tool named <code className="bg-muted px-1 rounded">chivox_voice_eval</code>.”
              </div>
            </FlowStep>
            <FlowStep title="4">
              <p>
                <strong className="text-foreground">MCP tool call</strong>
              </p>
              <p className="text-muted-foreground mt-1">
                The model issues a standard <code className="bg-muted px-1 rounded text-xs font-mono">tools/call</code>{' '}
                with the audio reference and reference text. <span className="text-foreground">You do not hand-write RPC code.</span>
              </p>
            </FlowStep>
            <FlowStep title="5">
              <p>
                <strong className="text-foreground">Chivox scoring</strong>
              </p>
              <p className="text-muted-foreground mt-1">
                The engine returns structured scores: overall, phoneme issues, fluency, and more — back through MCP.
              </p>
            </FlowStep>
            <FlowStep title="6">
              <p>
                <strong className="text-foreground">Natural-language feedback</strong>
              </p>
              <p className="text-muted-foreground mt-1">The model turns numbers into coaching text for the learner.</p>
            </FlowStep>
          </div>
          <Callout type="tip">
            MCP matters at <strong>① configuration</strong> and <strong>④ automatic invocation</strong>: expose tools
            once, call them through a standard protocol.
          </Callout>
        </SubDoc>

        <SubDoc id="dev-responsibility" title="Two jobs for developers">
          <p>In practice you only need to:</p>
          <div className="grid sm:grid-cols-2 gap-3 my-4">
            <div className="rounded-lg border border-border/60 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="h-6 w-6 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <span className="text-sm font-semibold">Configure MCP once</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Add server URL and API key. New scoring capabilities appear without redeploying your app.
              </p>
              <CodeBlock filename="mcp-config.json" lang="json" locale={L}>{`{
  "chivox_voice_eval": {
    "type": "streamable-http",
    "url": "https://speech-eval.site/mcp",
    "apiKey": "sk-••••••••••"
  }
}`}</CodeBlock>
            </div>
            <div className="rounded-lg border border-border/60 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="h-6 w-6 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <span className="text-sm font-semibold">Write system guidance</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Tell the model what the tool does, when to call it, and how to phrase feedback for users.
              </p>
              <CodeBlock filename="system-prompt.md" locale={L}>{`You are an English speaking coach.
When the user sends audio:
1. Call chivox_voice_eval
2. Focus on phoneme families below 70
3. Give kind, actionable drills`}</CodeBlock>
            </div>
          </div>
          <p className="text-muted-foreground">
            Uploads, auth, discovery, invocation timing, and response shaping are handled by MCP runtimes and the model —
            not bespoke glue code for every integration.
          </p>
        </SubDoc>

        <SubDoc id="integration-paths" title="Three equivalent integration styles">
          <p>Pick the path that matches your stack. Under the hood everything speaks the same MCP protocol.</p>

          <div className="rounded-lg border border-border/60 p-5 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-foreground" />
              <h4 className="text-sm font-semibold">1 · No-code consoles (Coze, Feishu, …)</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Best for PMs and operators. Add an MCP server in the platform UI, paste URL + key, test in chat.
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-1 text-sm">
              <li>Open the MCP / extensions panel.</li>
              <li>
                Create a Streamable HTTP endpoint:
                <div className="mt-2 overflow-x-auto rounded-lg border border-border/60">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-border/30">
                      <tr>
                        <td className="py-2 px-3 font-medium w-36">URL</td>
                        <td className="py-2 px-3 font-mono text-xs">https://speech-eval.site/mcp</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-medium">API key</td>
                        <td className="py-2 px-3 font-mono text-xs">
                          sk-•••••••••• <span className="text-muted-foreground ml-2">(billing / tenant id)</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </li>
              <li>The console pulls <code className="bg-muted px-1 rounded text-xs">tools/list</code> and exposes tools to the bot.</li>
            </ol>
          </div>

          <div className="rounded-lg border border-border/60 p-5 mt-3">
            <div className="flex items-center gap-2 mb-3">
              <Code2 className="h-4 w-4 text-foreground" />
              <h4 className="text-sm font-semibold">2 · IDE / agent frameworks</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Add a block to <code className="bg-muted px-1 rounded text-xs font-mono">mcp.json</code> (or equivalent) so
              Cursor, Claude Code, Dify, LangChain, etc. load tools at startup.
            </p>
            <CodeBlock filename="mcp.json" lang="json" locale={L}>{`{
  "mcpServers": {
    "chivox_voice_eval": {
      "type": "streamable-http",
      "url": "https://speech-eval.site/mcp",
      "env": { "API_KEY": "your-key" }
    }
  }
}`}</CodeBlock>
          </div>

          <div className="rounded-lg border border-border/60 p-5 mt-3">
            <div className="flex items-center gap-2 mb-3">
              <Terminal className="h-4 w-4 text-foreground" />
              <h4 className="text-sm font-semibold">3 · Function calling with MCP discovery</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              For OpenAI-compatible APIs (Doubao, DeepSeek, GPT, Qwen, …), fetch tool schemas from MCP instead of
              hard-coding JSON Schema for all 16 tools.
            </p>
            <Callout type="warning">
              Coze / Dify / Claude Desktop usually auto-import tools. For raw <code className="bg-muted px-1 rounded text-xs">chat.completions</code>, prefer{' '}
              <strong>MCP list_tools → OpenAI tools[]</strong> instead of maintaining schemas by hand.
            </Callout>
            <CodeBlock filename="3b_mcp_autodiscover.py" lang="python" locale={L}>{`import asyncio, os
from openai import AsyncOpenAI
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

client = AsyncOpenAI(
    base_url="https://ark.cn-beijing.volces.com/api/v3",
    api_key=os.getenv("ARK_API_KEY"),
)

async def main():
    async with streamablehttp_client(
        "https://speech-eval.site/mcp",
        headers={"Authorization": f"Bearer {os.getenv('CHIVOX_KEY')}"},
    ) as (read, write, _):
        async with ClientSession(read, write) as session:
            await session.initialize()
            mcp_tools = (await session.list_tools()).tools

            tools = [{
                "type": "function",
                "function": {
                    "name": t.name,
                    "description": t.description,
                    "parameters": t.inputSchema,
                }
            } for t in mcp_tools]

            resp = await client.chat.completions.create(
                model="ep-xxx-doubao-tools",
                messages=[
                    {"role": "system", "content": "You are a coach; give gentle feedback."},
                    {"role": "user", "content": "Score my Apple clip: https://demo.com/u1.mp3"},
                ],
                tools=tools,
                tool_choice="auto",
            )
            # execute tool_calls via session.call_tool, then second LLM pass…

asyncio.run(main())`}</CodeBlock>
            <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
              Use the official{' '}
              <a href="https://github.com/modelcontextprotocol/python-sdk" className="underline underline-offset-2" target="_blank" rel="noreferrer">
                MCP Python SDK
              </a>
              , <code className="bg-muted px-1 rounded text-xs">mcp-use</code>, or vendor SDKs that wrap the same bridge.
            </p>
          </div>

          <Callout type="info">
            All three paths are capability-equivalent. Choose <strong>①</strong> for fastest demos, <strong>②</strong> for
            desktop assistants, <strong>③-B (dynamic tools)</strong> for production backends talking to OpenAI-compatible APIs.
          </Callout>
        </SubDoc>
    </DocSection>
  );
}

function DocsEnglishBodyRest({ L }: { L: 'en' }) {
  return (
    <>
      <DocSection id="quick-start" icon={Zap} title="Quick start">
        <SubDoc id="overview" title="Overview">
          <p>
            <strong>chivox-local-mcp</strong> is a local MCP proxy for Chivox speech scoring. It bridges the hosted
            scoring service to assistants such as Claude Desktop, Claude Code, and Cursor via{' '}
            <a
              href="https://modelcontextprotocol.io/"
              className="text-blue-600 dark:text-blue-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Model Context Protocol
            </a>
            .
          </p>
          <p>Two evaluation modes cover interactive and batch workflows:</p>
          <div className="grid sm:grid-cols-2 gap-3 my-4">
            <div className="rounded-lg border border-border/60 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Mic className="h-4 w-4 text-foreground" />
                <span className="text-sm font-semibold">Streaming microphone</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Audio flows over WebSocket while you speak — no intermediate file, lowest latency for tutoring UX.
              </p>
            </div>
            <div className="rounded-lg border border-border/60 p-4">
              <div className="flex items-center gap-2 mb-2">
                <FolderOpen className="h-4 w-4 text-foreground" />
                <span className="text-sm font-semibold">File upload</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Local path, Base64, or URL — ideal for batch jobs and async pipelines.
              </p>
            </div>
          </div>
          <Callout type="info">
            The public catalog includes <strong>16 tools</strong>: 10 English tasks (word, sentence, paragraph, correction,
            phonics, multiple-choice, semi-open, realtime, …) and 6 Chinese tasks (character, pinyin, sentence, paragraph,
            constrained recognition, AI Talk).
          </Callout>
        </SubDoc>

        <SubDoc id="requirements" title="Requirements">
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-muted/30">
                  <th className="text-left py-2 px-3 font-medium">Dependency</th>
                  <th className="text-left py-2 px-3 font-medium">Version</th>
                  <th className="text-left py-2 px-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                <tr>
                  <td className="py-2 px-3 font-semibold">Node.js</td>
                  <td className="py-2 px-3 font-mono text-xs">{'>='} 18</td>
                  <td className="py-2 px-3 text-muted-foreground">Required at runtime</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold">SoX</td>
                  <td className="py-2 px-3 font-mono text-xs">any</td>
                  <td className="py-2 px-3 text-muted-foreground">Only for live microphone capture</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3">Install SoX when you need streaming capture:</p>
          <CodeBlock filename="Terminal" lang="bash" locale={L}>{`# macOS
brew install sox

# Ubuntu / Debian
sudo apt-get install sox`}</CodeBlock>
        </SubDoc>

        <SubDoc id="install" title="Install">
          <p>
            <strong>Option A — global npm</strong> (recommended)
          </p>
          <CodeBlock filename="Terminal" lang="bash" locale={L}>{`npm install -g chivox-local-mcp`}</CodeBlock>
          <p>
            <strong>Option B — npx</strong>
          </p>
          <CodeBlock filename="Terminal" lang="bash" locale={L}>{`MCP_REMOTE_URL=http://your-server:8080 npx chivox-local-mcp`}</CodeBlock>
          <p>
            <strong>Option C — build from source</strong>
          </p>
          <CodeBlock filename="Terminal" lang="bash" locale={L}>{`git clone https://git.chivox.com/CLOUD_DEV/cvx_local_mcp.git
cd cvx_local_mcp
bash scripts/build.sh`}</CodeBlock>
        </SubDoc>

        <SubDoc id="env-vars" title="Environment variables">
          <ParamTable
            locale="en"
            params={[
              {
                name: 'MCP_REMOTE_URL',
                type: 'string',
                required: true,
                desc: 'Remote Chivox MCP endpoint, e.g. http://your-server:8080',
              },
              {
                name: 'MCP_API_KEY',
                type: 'string',
                required: false,
                desc: 'API key when the deployment enforces authentication',
              },
            ]}
          />
        </SubDoc>
      </DocSection>

      <DocSection id="config" icon={Plug} title="Zero-code clients (paste MCP config)">
        <div className="rounded-lg border border-border/60 bg-muted/30 p-4 mb-5 text-sm">
          <p className="font-semibold mb-1.5 flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> What these setups share
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>No SDK import — paste JSON / URL into the client&apos;s MCP panel.</li>
            <li>After saving, the LLM discovers all scoring tools automatically.</li>
            <li>
              Covers <strong className="text-foreground">IDE copilots</strong>, <strong className="text-foreground">desktop assistants</strong>,{' '}
              <strong className="text-foreground">enterprise AI workspaces</strong>, and <strong className="text-foreground">workflow builders</strong>.
            </li>
          </ul>
        </div>

        <SubDoc id="config-cursor" title="Cursor">
          <ol className="list-decimal list-inside space-y-2 ml-1">
            <li>
              Open Cursor settings (<kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Cmd + ,</kbd>)
            </li>
            <li>
              Choose <strong>MCP</strong>
            </li>
            <li>
              Click <strong>Add new MCP server</strong>
            </li>
          </ol>
          <CodeBlock filename="Cursor MCP" lang="json" locale={L}>{`{
  "name": "chivox-speech-eval",
  "type": "streamable-http",
  "url": "https://speech-eval.site/mcp"
}`}</CodeBlock>
          <Callout type="tip">
            Cursor uses remote Streamable HTTP — no local binary. For microphone streaming, run the local proxy via Claude
            Desktop instead.
          </Callout>
        </SubDoc>

        <SubDoc id="config-claude-desktop" title="Claude Desktop">
          <p>
            Edit{' '}
            <code className="bg-muted px-1 rounded text-xs font-mono">
              ~/Library/Application Support/Claude/claude_desktop_config.json
            </code>{' '}
            on macOS:
          </p>
          <CodeBlock filename="claude_desktop_config.json" lang="json" locale={L}>{`{
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
          <Callout type="info">
            Claude Desktop uses stdio to talk to the local proxy, which bridges streaming audio to the remote engine.
          </Callout>
        </SubDoc>

        <SubDoc id="config-claude-code" title="Claude Code">
          <CodeBlock filename="Terminal" lang="bash" locale={L}>{`claude mcp add chivox -- env MCP_REMOTE_URL=http://your-server:8080 chivox-local-mcp`}</CodeBlock>
        </SubDoc>

        <SubDoc id="config-ai-ide" title="Windsurf / Zed / Continue">
          <p>Use the same Streamable HTTP JSON as Cursor; only the settings location differs.</p>
          <CodeBlock filename="mcp.json" lang="json" locale={L}>{`{
  "mcpServers": {
    "chivox-speech-eval": {
      "type": "streamable-http",
      "url": "https://speech-eval.site/mcp"
    }
  }
}`}</CodeBlock>
        </SubDoc>

        <SubDoc id="config-coze" title="Coze">
          <p>
            In <a href="https://www.coze.cn/" className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noreferrer">Coze</a>, add a custom MCP extension with transport <code className="bg-muted px-1 rounded text-xs">streamable-http</code> and URL{' '}
            <code className="bg-muted px-1 rounded text-xs">https://speech-eval.site/mcp</code>. After saving, bots can call scoring tools from prompts.
          </p>
        </SubDoc>

        <SubDoc id="config-coze-workflow" title="Coze workflows">
          <p>
            Use an HTTP node to POST audio to <code className="bg-muted px-1 rounded text-xs">https://speech-eval.site/upload</code>, then call MCP JSON-RPC with the returned{' '}
            <code className="bg-muted px-1 rounded text-xs">audioId</code>.
          </p>
        </SubDoc>

        <SubDoc id="config-ai-workspace" title="Enterprise AI workspaces">
          <p>
            Doubao, Feishu My AI, DingTalk assistants, and similar products expose MCP or OpenAPI bridges. Register{' '}
            <code className="bg-muted px-1 rounded text-xs">https://speech-eval.site/mcp</code> in the admin console, map it to a skill, and publish to your org.
          </p>
        </SubDoc>

        <SubDoc id="config-workflow-platforms" title="Dify / n8n / Flowise">
          <p>
            Add an MCP client node, point it at the same URL, and drag tool calls into LangChain / n8n graphs for batch scoring + reporting.
          </p>
        </SubDoc>

        <SubDoc id="config-other" title="Other MCP clients">
          <p>Any MCP-compatible host can use:</p>
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-muted/30">
                  <th className="text-left py-2 px-3 font-medium">Field</th>
                  <th className="text-left py-2 px-3 font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 px-3 font-medium">Transport</td>
                  <td className="py-2 px-3 font-mono text-xs">streamable-http</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">URL</td>
                  <td className="py-2 px-3 font-mono text-xs">https://speech-eval.site/mcp</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Auth (optional)</td>
                  <td className="py-2 px-3 font-mono text-xs">Authorization: Bearer &lt;MCP_API_KEY&gt;</td>
                </tr>
              </tbody>
            </table>
          </div>
        </SubDoc>
      </DocSection>

      <DocSection id="config-code" icon={Code2} title="Programmatic integration (SDKs & code)">
        <div className="rounded-lg border border-border/60 bg-muted/30 p-4 mb-5 text-sm">
          <p className="font-semibold mb-1.5 flex items-center gap-2">
            <Terminal className="h-4 w-4" /> Typical traits
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>You own a backend service, worker, or script.</li>
            <li>Your code decides when to call scoring and how to interpret JSON.</li>
            <li>Preferred paths: official MCP SDK → agent adapters → raw chat.completions with dynamic tools.</li>
          </ul>
        </div>

        <SubDoc id="code-mcp-sdk" title="Official MCP client (Python / TypeScript)">
          <p>
            Connect once, call <code className="bg-muted px-1 rounded text-xs">list_tools</code>, forward schemas to any LLM. Example (Python):
          </p>
          <CodeBlock filename="chivox_client.py" lang="python" locale={L}>{`# pip install mcp openai
import asyncio, os
from openai import OpenAI
from mcp.client.streamable_http import streamablehttp_client
from mcp import ClientSession

MCP_URL = "https://speech-eval.site/mcp"
llm = OpenAI(api_key=os.getenv("DOUBAO_KEY"),
             base_url="https://ark.cn-beijing.volces.com/api/v3")

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
                           "content": f"Score audioId={audio_id}, reference: {ref}"}],
                tools=openai_tools,
            )
            # handle tool_calls → sess.call_tool → second LLM pass

asyncio.run(main("abc123", "I think therefore I am"))`}</CodeBlock>
        </SubDoc>

        <SubDoc id="code-agent-frameworks" title="LangChain / Mastra / Agents SDK">
          <p>Point the MCP adapter at <code className="bg-muted px-1 rounded text-xs">https://speech-eval.site/mcp</code> and let the framework manage the tool loop.</p>
        </SubDoc>

        <SubDoc id="code-function-calling" title="chat.completions + tools">
          <p>
            Mirror the Chinese doc: never hand-write sixteen tool schemas — always hydrate from <code className="bg-muted px-1 rounded text-xs">list_tools()</code>.
          </p>
        </SubDoc>

        <SubDoc id="code-selfhosted-agent" title="Custom backend (FastAPI / Nest / Spring)">
          <p>
            Keep a long-lived MCP session in your API lifespan, call tools directly for low latency, and optionally add an LLM pass only for coaching copy.
          </p>
        </SubDoc>
      </DocSection>

      <DocSection id="eval-modes" icon={Radio} title="Evaluation modes">
        <SubDoc id="stream-eval" title="Streaming microphone">
          <p>
            Call <code className="bg-muted px-1 rounded text-xs">create_stream_session</code>, then <code className="bg-muted px-1 rounded text-xs">start_recording</code>, then{' '}
            <code className="bg-muted px-1 rounded text-xs">stop_recording</code>. Requires SoX and a local stdio proxy.
          </p>
          <ParamTable
            locale="en"
            params={[
              { name: 'core_type', type: 'string', required: true, desc: 'e.g. en.word.score, cn.sent.raw' },
              { name: 'ref_text', type: 'string', required: true, desc: 'Reference transcript' },
            ]}
          />
        </SubDoc>

        <SubDoc id="stream-flow" title="End-to-end streaming flow">
          <p>Create session → record → stop → receive scores. Same mechanics as the Chinese documentation.</p>
        </SubDoc>

        <SubDoc id="file-eval" title="Audio file evaluation">
          <p>Provide <code className="bg-muted px-1 rounded text-xs">audio_file_path</code>, <code className="bg-muted px-1 rounded text-xs">audio_base64</code>, or <code className="bg-muted px-1 rounded text-xs">audio_url</code>.</p>
          <Callout type="tip">Prefer local file paths — the proxy handles encoding.</Callout>
        </SubDoc>
      </DocSection>

      <DocSection id="api-reference" icon={BookOpen} title="API reference">
        <SubDoc id="tools-en" title="English tools (10)">
          <ToolTable
            locale="en"
            tools={[
              ['en_word_eval', 'Word scoring', 'Single-word pronunciation'],
              ['en_word_correction', 'Word correction', 'Detect omissions/extra/wrong phones'],
              ['en_vocab_eval', 'Vocabulary scoring', 'Multiple words in one clip'],
              ['en_sentence_eval', 'Sentence scoring', 'Accuracy + fluency'],
              ['en_sentence_correction', 'Sentence correction', 'Per-word feedback'],
              ['en_paragraph_eval', 'Paragraph read-aloud', 'Long passage quality'],
              ['en_phonics_eval', 'Phonics scoring', 'Letter-sound rules'],
              ['en_choice_eval', 'Oral multiple choice', 'Constrained answers'],
              ['en_semi_open_eval', 'Semi-open prompt', 'Scenario speaking'],
              ['en_realtime_eval', 'Realtime read-aloud', 'Streaming feedback'],
            ]}
          />
        </SubDoc>

        <SubDoc id="tools-cn" title="Chinese tools (6)">
          <ToolTable
            locale="en"
            tools={[
              ['cn_word_raw_eval', 'Character scoring', 'Hanzi pronunciation'],
              ['cn_word_pinyin_eval', 'Pinyin scoring', 'Syllable-level'],
              ['cn_sentence_eval', 'Phrase scoring', 'Short utterances'],
              ['cn_paragraph_eval', 'Paragraph scoring', 'Long text'],
              ['cn_rec_eval', 'Constrained recognition', 'Pick-one answers'],
              ['cn_aitalk_eval', 'AI Talk scoring', 'Open dialog evaluation'],
            ]}
          />
        </SubDoc>

        <SubDoc id="result-fields" title="Result fields">
          <CodeBlock filename="result.json" lang="json" locale={L}>{`{
  "overall": 85,
  "accuracy": 82,
  "pron": 88,
  "fluency": { "overall": 78, "speed": 65, "pause": 2 },
  "integrity": 95,
  "details": [
    {
      "char": "hello",
      "score": 85,
      "phone": [
        { "phoneme": "h", "score": 90 },
        { "phoneme": "ɛ", "score": 82 }
      ]
    }
  ]
}`}</CodeBlock>
        </SubDoc>

        <SubDoc id="error-codes" title="Error handling">
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-muted/30">
                  <th className="text-left py-2 px-3 font-medium">Symptom</th>
                  <th className="text-left py-2 px-3 font-medium">Mitigation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                <tr>
                  <td className="py-2 px-3">Invalid or expired audio id</td>
                  <td className="py-2 px-3">Re-upload; IDs expire ~5 minutes after upload.</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">Server busy</td>
                  <td className="py-2 px-3">Retry with exponential backoff.</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">WebSocket disconnect</td>
                  <td className="py-2 px-3">Proxy reconnects automatically; check network if persistent.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </SubDoc>
      </DocSection>

      <DocSection id="architecture" icon={Terminal} title="Architecture">
        <SubDoc id="arch-diagram" title="Diagram">
          <p>Desktop clients ⇄ stdio ⇄ chivox-local-mcp ⇄ HTTP/WebSocket ⇄ remote Chivox MCP + scoring engine.</p>
        </SubDoc>
        <SubDoc id="transport" title="Transports">
          <ul className="space-y-3">
            <li>
              <strong>stdio</strong> — default for Claude Desktop / local proxies.
            </li>
            <li>
              <strong>HTTP</strong> — upload + MCP JSON-RPC for file workflows.
            </li>
            <li>
              <strong>WebSocket</strong> — streaming audio with auto-reconnect.
            </li>
          </ul>
        </SubDoc>
      </DocSection>

      <DocSection id="integration" icon={Code2} title="Sample code">
        <SubDoc id="code-python" title="Python upload">
          <CodeBlock filename="upload.py" lang="python" locale={L}>{`import requests

with open('audio.mp3', 'rb') as f:
    r = requests.post(
        'https://speech-eval.site/upload',
        data=f,
        headers={'Content-Type': 'audio/mp3'}
    )

result = r.json()
print(f"audioId: {result['audioId']}")`}</CodeBlock>
        </SubDoc>
        <SubDoc id="code-javascript" title="JavaScript upload">
          <CodeBlock filename="upload.js" lang="javascript" locale={L}>{`const fs = require('fs');
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

      <DocSection id="best-practices" icon={FileText} title="Best practices">
        <SubDoc id="prompt-templates" title="Prompt templates">
          <p>Use MCP JSON as ground truth, then ask the LLM to translate scores into coaching plans.</p>
          <div className="border border-border/60 rounded-lg p-4 mt-4">
            <p className="font-semibold text-sm mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Diagnosis
            </p>
            <CodeBlock filename="prompt-diagnosis.txt" locale={L}>{`You are an English coach. Given:
{evaluation_result}

Summarize strengths (>80), weaknesses (<70) with phoneme detail, and 3 drills.`}</CodeBlock>
          </div>
          <div className="border border-border/60 rounded-lg p-4 mt-4">
            <p className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Mic className="h-4 w-4" /> Practice generation
            </p>
            <CodeBlock filename="prompt-practice.txt" locale={L}>{`Weak points: {weak_points}
Return tongue twisters, short sentences, and a 60-word paragraph targeting those phones.`}</CodeBlock>
          </div>
          <div className="border border-border/60 rounded-lg p-4 mt-4">
            <p className="font-semibold text-sm mb-2 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Weekly report
            </p>
            <CodeBlock filename="prompt-report.txt" locale={L}>{`History (7d): {history}
Report trend, dimension deltas, biggest win, next focus, encouragement.`}</CodeBlock>
          </div>
        </SubDoc>

        <SubDoc id="error-handling" title="Errors & retries">
          <ul className="space-y-3 mt-2">
            <li>
              Treat uploads as short-lived — score within a few minutes.
            </li>
            <li>
              Back off exponentially on 5xx / busy signals.
            </li>
          </ul>
        </SubDoc>

        <SubDoc id="performance" title="Performance">
          <ul className="space-y-3 mt-2">
            <li>Streaming avoids file upload latency for interactive tutoring.</li>
            <li>Compress to 16 kHz mono mp3 before large uploads.</li>
            <li>Pick the smallest tool that answers your product question (word vs paragraph).</li>
          </ul>
        </SubDoc>
      </DocSection>

      <DocSection id="service-info" icon={Globe} title="Service information">
        <SubDoc id="endpoints" title="Endpoints">
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-muted/30">
                  <th className="text-left py-2 px-3 font-medium">Path</th>
                  <th className="text-left py-2 px-3 font-medium">Method</th>
                  <th className="text-left py-2 px-3 font-medium">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                <tr>
                  <td className="py-2 px-3 font-mono text-xs">/upload</td>
                  <td className="py-2 px-3">POST</td>
                  <td className="py-2 px-3">Audio upload</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono text-xs">/mcp</td>
                  <td className="py-2 px-3">POST</td>
                  <td className="py-2 px-3">MCP JSON-RPC (Streamable HTTP)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono text-xs">/health</td>
                  <td className="py-2 px-3">GET</td>
                  <td className="py-2 px-3">Health check</td>
                </tr>
              </tbody>
            </table>
          </div>
        </SubDoc>

        <SubDoc id="limits" title="Limits">
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-muted/30">
                  <th className="text-left py-2 px-3 font-medium">Item</th>
                  <th className="text-left py-2 px-3 font-medium">Default</th>
                  <th className="text-left py-2 px-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {[
                  ['Scratch storage', '500MB', 'Temporary audio cache'],
                  ['Queue depth', '10', 'Pending jobs'],
                  ['Concurrency', '3', 'Parallel scoring workers'],
                  ['Audio TTL', '5 min', 'Expires if not scored'],
                  ['Max upload', '50MB', 'Per file'],
                ].map(([k, v, d]) => (
                  <tr key={k as string}>
                    <td className="py-2 px-3 font-medium">{k}</td>
                    <td className="py-2 px-3 font-mono text-xs">{v}</td>
                    <td className="py-2 px-3 text-muted-foreground">{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SubDoc>

        <SubDoc id="changelog" title="Changelog">
          <div className="space-y-3">
            {[
              { ver: 'v3.0.0', date: '2026-04-16', desc: 'Local proxy + streaming mic; 16 tools' },
              { ver: 'v2.3.0', date: '2026-03-25', desc: 'HTTPS on speech-eval.site' },
              { ver: 'v2.2.0', date: '2026-03-24', desc: 'MCP guides for Cursor / Claude Desktop' },
              { ver: 'v2.1.0', date: '2026-03-24', desc: 'Unified HTTP upload API' },
              { ver: 'v2.0.0', date: '2026-03-24', desc: 'Initial multi-task scoring' },
            ].map((l) => (
              <div key={l.ver} className="flex items-start gap-3">
                <span className="font-mono text-xs font-bold bg-muted px-2 py-0.5 rounded shrink-0">{l.ver}</span>
                <span className="text-xs text-muted-foreground shrink-0 mt-0.5">{l.date}</span>
                <span className="text-sm">{l.desc}</span>
              </div>
            ))}
          </div>
        </SubDoc>
      </DocSection>
    </>
  );
}
