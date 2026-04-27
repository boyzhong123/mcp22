#!/usr/bin/env python3
"""
Generate English TTS one sentence (segment) at a time for accurate subtitle sync.
Run from repo root or this folder: python generate-audio.py

Output:
  - audio/slide{N}_s{MM}.mp3
  - audio/voice-manifest.js  (durations via ffprobe, en/zh for each segment)

Requires: edge-tts, ffmpeg (ffprobe) on PATH
"""

from __future__ import annotations

import asyncio
import json
import os
import re
import subprocess
import sys

import edge_tts

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(SCRIPT_DIR)

VOICE = "en-US-GuyNeural"
RATE = "-19%"

# Must stay in sync with index.html SUBTITLES (same order, same wording).
SUBTITLE_PAIRS: list[tuple[str, str]] = [
    (
        "Speech assessment APIs have existed for over twenty years. But here's the problem: they return raw numbers - accuracy 78, fluency 82. To turn these into useful learning feedback, engineers must write a translation layer... for every single model, every single time. So, what's the solution?",
        "语音评测 API 已存在二十多年。但问题在于：它们只返回原始数字 - 准确度 78，流利度 82。要把这些变成有用的学习反馈，工程师必须为每个模型写一层翻译代码。那么，解决方案是什么？",
    ),
    (
        "This is where Chivox MCP comes in. Instead of studying API docs and writing wrapper code, you simply add one MCP server config line. Your LLM auto-discovers sixteen evaluation tools. Phoneme-level results flow directly into context. Zero wrapper code needed. Let me show you how it works.",
        "这就是驰声 MCP 的价值。不用研究 API 文档和编写包装代码，只需添加一行 MCP 配置。LLM 自动发现 16 个评测工具，音素级结果直接进入上下文，无需包装代码。让我展示它是如何工作的。",
    ),
    (
        "Here's the complete workflow in five simple steps. First, you configure once - that's your one-time setup. Then, the user speaks or uploads audio. The LLM automatically picks the right evaluation tool. Chivox scores at phoneme level. And finally, the LLM generates personalized feedback with diagnosis and drills. Now, let's look at what makes this powerful.",
        "完整工作流程只需五步。首先，配置一次即可。用户说话或上传音频，LLM 自动选择评测工具，驰声进行音素级评分，最后 LLM 生成带诊断和练习的个性化反馈。接下来看看它强大在哪里。",
    ),
    (
        "Chivox MCP delivers three core values. First: rich data. Eight main dimensions plus phoneme-level error typing for every sound. Second: LLM diagnosis. Your model turns raw scores into actionable correction advice. Third: universal compatibility. Standard MCP protocol works with GPT, Claude, Gemini, and any AI framework. Beyond core value, deployment flexibility is where this becomes practical.",
        "驰声 MCP 带来三大核心价值。一：丰富数据，8 个主维度加每个音素的错误类型标注。二：LLM 诊断，模型将原始分数转化为可执行的纠正建议。三：通用兼容，标准 MCP 协议适用于 GPT、Claude、Gemini 及任何 AI 框架。而真正落地，关键在部署灵活性。",
    ),
    (
        "Two evaluation modes fit different use cases. Real-time streaming: under three hundred milliseconds latency, perfect for tutoring apps where users need instant feedback. Or file upload: batch processing for large-scale content quality control. Supports WAV, MP3, and more. Let me show you a concrete example.",
        "两种评测模式适配不同场景。实时流式：延迟低于 300 毫秒，非常适合需要即时反馈的辅导应用。或文件上传：批量处理用于大规模内容质检，支持 WAV、MP3 等格式。让我展示一个具体示例。",
    ),
    (
        "Here's how it works in practice, in three steps. Step one: MCP returns raw phoneme scores - overall 78, specific phonemes like theta scoring 45. Step two: The LLM diagnoses the issue - your theta sounds like S, tongue not between teeth. Step three: The model generates targeted drills - think, through, three. Practice with these. This works across many scenarios.",
        "实际操作分三步。第一步：MCP 返回原始音素分数 - 总分 78，theta 音得分 45。第二步：LLM 诊断问题 - 你的 theta 听起来像 S，舌头没有放在牙齿之间。第三步：模型生成针对性练习 - think、through、three，跟着练。这适用于很多场景。",
    ),
    (
        "One MCP powers every scenario. IELTS speaking prep. K-12 curriculum. Mandarin proficiency tests. Kids phonics and early learning. One-on-one tutoring. IM bots in Feishu and DingTalk. Podcast quality checking. And the entire developer ecosystem with Dify, n8n, and more. Ready to get started?",
        "一套 MCP 覆盖全场景。雅思口语备考、K12 课程、普通话水平测试、儿童自然拼读和启蒙、一对一辅导、飞书钉钉 IM 机器人、播客质检、以及 Dify、n8n 等整个开发者生态。准备好开始了吗？",
    ),
    (
        "Getting started is simple. One line of config, instant integration. Behind this: twenty years of exam-grade speech engines, serving one hundred eighty-five countries, ten billion users, and ninety-five percent alignment with human experts. Visit chivox M C P two dot netlify dot app. Ship your voice-enabled AI product today.",
        "开始很简单。一行配置，即刻接入。背后是：20 年考试级语音引擎，服务 185 个国家、100 亿用户，与人类专家 95%+ 一致性。访问 chivoxmcp2.netlify.app。今天就发布你的语音 AI 产品。",
    ),
]


def split_en(text: str) -> list[str]:
    # Collapse "..." so the final "." does not trigger a false sentence break before "for ...".
    t = " ".join(text.split())
    t = re.sub(r"\.{3,}", "…", t)
    parts = re.split(r"(?<=[.!?])\s+", t)
    return [p.strip() for p in parts if p.strip()]


def split_zh(text: str) -> list[str]:
    t = text.strip()
    parts = re.split(r"(?<=[。！？])", t)
    return [p.strip() for p in parts if p.strip()]


def align_segments(en_full: str, zh_full: str) -> list[tuple[str, str]]:
    ens = split_en(en_full)
    zhs = split_zh(zh_full)
    if not ens:
        return []
    if len(zhs) < len(ens):
        zhs = zhs + [zhs[-1] if zhs else ""] * (len(ens) - len(zhs))
    elif len(zhs) > len(ens):
        zhs = zhs[: len(ens)]
    return list(zip(ens, zhs))


def ffprobe_duration_ms(path: str) -> int:
    try:
        out = subprocess.check_output(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                path,
            ],
            text=True,
        ).strip()
        return max(0, int(round(float(out) * 1000)))
    except Exception as e:
        print(f"ffprobe failed for {path}: {e}", file=sys.stderr)
        return 0


async def synth_segment(text: str, out_path: str) -> None:
    clean = " ".join(text.split())
    clean = re.sub(r"\.{3,}", "…", clean)
    comm = edge_tts.Communicate(clean, VOICE, rate=RATE)
    await comm.save(out_path)


async def main() -> None:
    audio_dir = os.path.join(SCRIPT_DIR, "audio")
    os.makedirs(audio_dir, exist_ok=True)

    manifest_slides: list[dict] = []
    total_ms = 0

    for slide_i, (en_full, zh_full) in enumerate(SUBTITLE_PAIRS):
        pairs = align_segments(en_full, zh_full)
        segments: list[dict] = []
        slide_ms = 0

        for seg_i, (en, zh) in enumerate(pairs):
            fname = f"slide{slide_i}_s{seg_i:02d}.mp3"
            rel = fname
            abs_path = os.path.join(audio_dir, fname)
            print(f"Generating {rel} ...")
            await synth_segment(en, abs_path)
            dms = ffprobe_duration_ms(abs_path)
            slide_ms += dms
            segments.append(
                {
                    "file": rel,
                    "en": en,
                    "zh": zh,
                    "durationMs": dms,
                }
            )
            print(f"  ✓ {dms} ms")

        total_ms += slide_ms
        manifest_slides.append({"durationMs": slide_ms, "segments": segments})

    payload = {"version": 1, "totalMs": total_ms, "slides": manifest_slides}
    js_path = os.path.join(audio_dir, "voice-manifest.js")
    with open(js_path, "w", encoding="utf-8") as f:
        f.write("window.__CHIVOX_VOICE_MANIFEST__ = ")
        json.dump(payload, f, ensure_ascii=False, indent=2)
        f.write(";\n")

    print(f"\n✅ Done. total ≈ {total_ms / 1000:.1f}s")
    print(f"   Wrote {js_path}")


if __name__ == "__main__":
    asyncio.run(main())
