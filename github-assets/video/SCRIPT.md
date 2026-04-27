# Chivox MCP Video Script

## Overview

- **Duration**: ~2 minutes 16 seconds (136s)
- **Total Slides**: 8
- **Voice**: Microsoft Edge TTS (en-US-GuyNeural, rate -5%)
- **Structure**: 6-act narrative with smooth transitions

## Narrative Structure

| Act | Theme | Duration | Purpose |
|-----|-------|----------|---------|
| 1 | Problem | 18s | Hook: LLMs can't hear audio, engineers suffer |
| 2 | Solution | 34s | Before/After + 5-step workflow |
| 3 | Capabilities | 32s | Core values + dual evaluation modes |
| 4 | Demo | 20s | Concrete example: scores → diagnosis → drills |
| 5 | Scenarios | 16s | 9-grid covering all use cases |
| 6 | CTA | 16s | One config, ship today |

## Slide Breakdown

| # | Act | Duration | Transition | English VO | 中文字幕 |
|---|-----|----------|------------|------------|----------|
| S0 | 1 | 18s | → "So, what's the solution?" | Speech assessment APIs have existed for over twenty years. But here's the problem: they return raw numbers — accuracy 78, fluency 82. To turn these into useful learning feedback, engineers must write a translation layer... for every single model, every single time. So, what's the solution? | 语音评测 API 已存在二十多年。但问题在于：它们只返回原始数字——准确度 78，流利度 82。要把这些变成有用的学习反馈，工程师必须为每个模型写一层翻译代码。那么，解决方案是什么？ |
| S1 | 2 | 16s | → "Let me show you how it works." | This is where Chivox MCP comes in. Instead of studying API docs and writing wrapper code, you simply add one MCP server config line. Your LLM auto-discovers sixteen evaluation tools. Phoneme-level results flow directly into context. Zero wrapper code needed. Let me show you how it works. | 这就是驰声 MCP 的价值。不用研究 API 文档和编写包装代码，只需添加一行 MCP 配置。LLM 自动发现 16 个评测工具，音素级结果直接进入上下文，无需包装代码。让我展示它是如何工作的。 |
| S2 | 2 | 18s | → "Now, let's look at what makes this powerful." | Here's the complete workflow in five simple steps. First, you configure once — that's your one-time setup. Then, the user speaks or uploads audio. The LLM automatically picks the right evaluation tool. Chivox scores at phoneme level. And finally, the LLM generates personalized feedback with diagnosis and drills. Now, let's look at what makes this powerful. | 完整工作流程只需五步。首先，配置一次即可。用户说话或上传音频，LLM 自动选择评测工具，驰声进行音素级评分，最后 LLM 生成带诊断和练习的个性化反馈。接下来看看它强大在哪里。 |
| S3 | 3 | 17s | → "And you get flexibility too." | Chivox MCP delivers three core values. First: rich data. Eight main dimensions plus phoneme-level error typing for every sound. Second: LLM diagnosis. Your model turns raw scores into actionable correction advice. Third: universal compatibility. Standard MCP protocol works with GPT, Claude, Gemini, and any AI framework. And you get flexibility too. | 驰声 MCP 带来三大核心价值。一：丰富数据，8 个主维度加每个音素的错误类型标注。二：LLM 诊断，模型将原始分数转化为可执行的纠正建议。三：通用兼容，标准 MCP 协议适用于 GPT、Claude、Gemini 及任何 AI 框架。而且还有灵活性。 |
| S4 | 3 | 15s | → "Let me show you a concrete example." | Two evaluation modes fit different use cases. Real-time streaming: under three hundred milliseconds latency, perfect for tutoring apps where users need instant feedback. Or file upload: batch processing for large-scale content quality control. Supports WAV, MP3, and more. Let me show you a concrete example. | 两种评测模式适配不同场景。实时流式：延迟低于 300 毫秒，非常适合需要即时反馈的辅导应用。或文件上传：批量处理用于大规模内容质检，支持 WAV、MP3 等格式。让我展示一个具体示例。 |
| S5 | 4 | 20s | → "This works across many scenarios." | Here's how it works in practice, in three steps. Step one: MCP returns raw phoneme scores — overall 78, specific phonemes like theta scoring 45. Step two: The LLM diagnoses the issue — your theta sounds like S, tongue not between teeth. Step three: The model generates targeted drills — think, through, three. Practice with these. This works across many scenarios. | 实际操作分三步。第一步：MCP 返回原始音素分数——总分 78，θ 音得分 45。第二步：LLM 诊断问题——你的 θ 听起来像 S，舌头没有放在牙齿之间。第三步：模型生成针对性练习——think、through、three，跟着练。这适用于很多场景。 |
| S6 | 5 | 16s | → "Ready to get started?" | One MCP powers every scenario. IELTS speaking prep. K-12 curriculum. Mandarin proficiency tests. Kids phonics and early learning. One-on-one tutoring. IM bots in Feishu and DingTalk. Podcast quality checking. And the entire developer ecosystem with Dify, n8n, and more. Ready to get started? | 一套 MCP 覆盖全场景。雅思口语备考、K12 课程、普通话水平测试、儿童自然拼读和启蒙、一对一辅导、飞书钉钉 IM 机器人、播客质检、以及 Dify、n8n 等整个开发者生态。准备好开始了吗？ |
| S7 | 6 | 16s | (closing) | Getting started is simple. One line of config, instant integration. Behind this: twenty years of exam-grade speech engines, serving one hundred eighty-five countries, ten billion users, and ninety-five percent alignment with human experts. Visit chivox M C P two dot netlify dot app. Ship your voice-enabled AI product today. | 开始很简单。一行配置，即刻接入。背后是：20 年考试级语音引擎，服务 185 个国家、100 亿用户，与人类专家 95%+ 一致性。访问 chivoxmcp2.netlify.app。今天就发布你的语音 AI 产品。 |

## Transition Summary

Each slide ends with a natural transition to the next:

1. **S0 → S1**: "So, what's the solution?"
2. **S1 → S2**: "Let me show you how it works."
3. **S2 → S3**: "Now, let's look at what makes this powerful."
4. **S3 → S4**: "And you get flexibility too."
5. **S4 → S5**: "Let me show you a concrete example."
6. **S5 → S6**: "This works across many scenarios."
7. **S6 → S7**: "Ready to get started?"
8. **S7**: Final CTA - "Ship your voice-enabled AI product today."

## Files

- `index.html` - Video player with slides
- `generate-audio.py` - Edge TTS audio generator
- `audio/slide0.mp3` ~ `audio/slide7.mp3` - Generated voiceovers
