<p align="center">
  <a href="video/index.html?play=1">
    <img src="video-cover.jpg" alt="▶ Watch Chivox MCP Demo" width="100%" />
  </a>
</p>

<p align="center">
  <a href="https://chivoxmcp2.netlify.app">
    <img src="https://img.shields.io/badge/🌐_官网_Website-chivoxmcp2.netlify.app-2563EB?style=for-the-badge&logoColor=white" alt="Website" />
  </a>
  &nbsp;&nbsp;
  <a href="https://chivoxmcp2.netlify.app/zh/docs">
    <img src="https://img.shields.io/badge/📖_文档_Docs-Read_Now-10B981?style=for-the-badge" alt="Docs" />
  </a>
  &nbsp;&nbsp;
  <a href="https://chivoxmcp2.netlify.app/zh/demo">
    <img src="https://img.shields.io/badge/🎬_Demo-Try_Live-7C3AED?style=for-the-badge" alt="Demo" />
  </a>
</p>

<h1 align="center">
  <img src="logo.png" alt="Chivox MCP" height="48" />
</h1>

<p align="center">
  <strong>让语音评测被大模型读懂</strong><br>
  <em>Exam-grade phoneme-level speech assessment, delivered as Model Context Protocol tools</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/release-v1.0.0-111827?style=flat-square" />
  <img src="https://img.shields.io/badge/license-Apache--2.0-111827?style=flat-square" />
  <img src="https://img.shields.io/badge/MCP-ready-10B981?style=flat-square" />
  <img src="https://img.shields.io/badge/tools-16_tools-7C3AED?style=flat-square" />
  <img src="https://img.shields.io/badge/ISO_27001-certified-2563EB?style=flat-square" />
</p>

---

## 什么是 Chivox MCP？

**Chivox MCP** 把驰声十年积累的考试级语音评测引擎，封装成标准 [Model Context Protocol](https://modelcontextprotocol.io) 工具集。

LLM 直接调用这些工具，无需额外开发——拿到**音素级**评测结果后，自动生成诊断报告、纠音建议和个性化练习。

> One MCP call. Phoneme-level results. No SDK wrapping. No translation layer.

---

## 🚀 三种接入姿势

官网文档根据使用场景定义了三条路径，按需选择 → **[完整文档](https://chivoxmcp2.netlify.app/zh/docs)**

---

### 姿势一 · 可视化拖拽（零代码）

**适合：** 产品经理、运营、不写后端代码的开发者

在 Cursor / Claude Desktop / Coze / Dify 等客户端的配置文件中加一段，重启即用：

```jsonc
// mcp.json — Cursor · Claude Desktop · Windsurf · Zed · Continue
{
  "mcpServers": {
    "chivox": {
      "command": "npx",
      "args": ["-y", "@chivox/mcp"],
      "env": { "CHIVOX_API_KEY": "YOUR_KEY" }
    }
  }
}
```

重启后对模型说：**「帮我评测一下这段录音」**，模型自动调用工具并输出诊断。

支持客户端：Cursor · Claude Desktop · Claude Code · Windsurf · Zed · Continue · 扣子 · 豆包 · 飞书 · 钉钉 · Dify · n8n · Flowise

📌 **[免费获取 API Key →](https://chivoxmcp2.netlify.app/zh/dashboard/keys)**

---

### 姿势二 · 代码框架配置（SDK）

**适合：** 独立 App / 小程序开发者、用 LangChain / Mastra 写 Agent 的极客

通过 Agent 框架的 MCP 插件接入，驰声新增工具无需改代码：

| 框架 | 接入方式 |
|------|----------|
| **LangChain / LlamaIndex** | `MCPToolkit` 插件 |
| **Mastra** | MCP plugin config |
| **AutoGen / CrewAI** | MCP tool adapter |
| **Spring AI** | MCP starter（Java） |
| **Dify · n8n · Flowise** | Tool 节点 · HTTP node |

---

### 姿势三 · 原生 Function Calling（直调 API）

**适合：** 不用 Agent 框架、直接调用 LLM API 的后端开发者

```python
# 支持：DeepSeek · OpenAI · 豆包·火山方舟 · GLM · KIMI · Gemini
tools = chivox_mcp_client.list_tools()   # 自动发现全部 16 个工具（生产推荐）

response = client.chat.completions.create(
    model="deepseek-chat",
    tools=tools,
    messages=[{"role": "user", "content": "帮我评测这段英文录音"}]
)
```

> 💡 推荐使用 MCP 客户端库自动发现工具，驰声上线新工具你的代码无需修改。

---

## 🔌 支持的客户端

| 客户端 | 类型 | 接入方式 |
|--------|------|----------|
| **Cursor** | IDE | `mcp.json` 零代码 |
| **Claude Desktop / Code** | Desktop / CLI | `mcp.json` 零代码 |
| **Windsurf · Zed · Continue** | IDE | `mcp.json` 零代码 |
| **Coze 扣子** | Agent 平台 | 插件面板 |
| **Doubao 豆包** | Agent 平台 | 插件面板 |
| **Feishu 飞书 · DingTalk 钉钉** | 企业机器人 | Bot 配置 |
| **Dify · n8n · Flowise** | 工作流平台 | Tool 节点 |

---

## 🛠 MCP 工具列表（16 个）

### 英文评测（10 个）

| 工具名 | 功能 |
|--------|------|
| `en_word_eval` | 单词发音评测（准确度 + 音素级） |
| `en_word_correction` | 单词纠音（检测漏读/多读/错读） |
| `en_vocab_eval` | 多单词词汇表评测 |
| `en_sentence_eval` | 句子准确度与流利度评测 |
| `en_sentence_correction` | 逐词错误检测 + 纠音建议 |
| `en_paragraph_eval` | 段落朗读综合评测 |
| `en_phonics_eval` | 自然拼读规则掌握度评测 |
| `en_choice_eval` | 口头选择题识别（预设选项） |
| `en_semi_open_eval` | 半开放对话 / 情景口语评测 |
| `en_realtime_eval` | 实时朗读逐句反馈 |

### 中文评测（6 个）

| 工具名 | 功能 |
|--------|------|
| `cn_word_raw_eval` | 汉字发音评测 |
| `cn_word_pinyin_eval` | 拼音发音评测 |
| `cn_sentence_eval` | 词语 / 句子朗读评测 |
| `cn_paragraph_eval` | 段落朗读综合评测 |
| `cn_rec_eval` | 有限分支识别评测（预设选项） |
| `cn_aitalk_eval` | 中文口语对话能力评测 |

### 通用返回字段

```jsonc
{
  "overall": 88,          // 综合分
  "accuracy": 91,         // 准确度
  "fluency": 85,          // 流利度
  "integrity": 90,        // 完整度
  "pron": 88,             // 发音质量
  "details": [
    {
      "phone": "th",
      "score": 72,
      "dp_type": "mispron",   // normal | omit | insert | mispron
      "begin_time": 0.24,
      "end_time": 0.38
    }
  ]
}
```

> 音频输入支持三种方式：`audio_file_path` · `audio_base64` · `audio_url`

---

## ✨ 核心能力

- 🎯 **音素级诊断** — 逐音素打分、时间戳、置信度、错误类型分类
- 📊 **多维度评分** — 总分 / 准确度 / 完整度 / 流利度 / 节奏 / 语速
- 📚 **考试级精度** — 对齐雅思 · K12 · TOEFL · 普通话水平测试引擎
- 🤖 **LLM 原生 JSON** — GPT · Claude · Gemini · DeepSeek · 通义千问直接消费
- ⚡ **实时 + 批量** — 流式边读边反馈 + 音频文件批处理
- 🔄 **教学闭环** — 评测 → LLM 诊断 → 自动生成练习 / 绕口令 / 计划

---

## 🎯 应用场景

| | | |
|--|--|--|
| 🎓 雅思口语备考 | 📚 K12 中英课程 | 🇨🇳 普通话水平测试 |
| 🏆 演讲赛事评测 | 🧒 儿童音素启蒙 | 👩‍🏫 一对一辅导机器人 |
| 💬 IM / 练口 chatbot | 🎙️ 播客内容质检 | 🧩 开发者生态集成 |

---

## 📸 产品截图

<table>
  <tr>
    <td align="center"><b>首页</b><br><img src="screenshots/home.png" width="400"/></td>
    <td align="center"><b>开发者文档</b><br><img src="screenshots/docs.png" width="400"/></td>
  </tr>
  <tr>
    <td align="center"><b>在线 Demo</b><br><img src="screenshots/demo.png" width="400"/></td>
    <td align="center"><b>定价套餐</b><br><img src="screenshots/plans.png" width="400"/></td>
  </tr>
</table>

---

## 💳 定价

| 套餐 | 适用场景 |
|------|----------|
| **Starter** — 免费 | 原型验证 · 个人体验 |
| **Standard** | 商业生产环境 |
| **Growth** | 流量增长 · 首档折扣 |
| **Scale** | 高并发 · 更大折扣 |
| **Enterprise** | 私有化部署 · 定制 SLA · 7×24 支持 |

→ **[查看套餐详情](https://chivoxmcp2.netlify.app/zh/dashboard/plans)**

---

<p align="center">
  由 <b>驰声科技 Chivox</b> 出品 · Apache-2.0 License<br>
  <a href="https://chivoxmcp2.netlify.app"><b>chivoxmcp2.netlify.app</b></a> · v1.0.0
</p>
