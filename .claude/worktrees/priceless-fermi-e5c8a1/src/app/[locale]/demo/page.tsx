'use client';

import { Link } from '@/i18n/routing';
import {
  ArrowLeft,
  Loader2,
  Play,
  BrainCircuit,
  BookOpen,
  RotateCcw,
  Copy,
  Check,
  Type,
  AlignLeft,
  FileText,
  MessagesSquare,
  Mic,
  Square,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';

import type { Lang, Phase, QType, Sample, PronSample, SemiSample, WordDetail, DpType } from './demo-sample-types';
import { SAMPLES_EN } from './demo-samples-en';
import { CN_SAMPLES_UI_EN } from './demo-samples-cn-en';

export type { Phase, QType, Lang };

// ─── SAMPLES (real Chivox API shape) ─────────────────────────────────────
const SAMPLES: Record<QType, Sample> = {
  word: {
    kind: 'pron',
    label: '单词',
    desc: 'Word · 音素级打分',
    apiTag: 'en.word.score',
    refText: 'particular',
    overall: 58,
    scores: { accuracy: 45, integrity: 100, fluency: 100 },
    details: [
      {
        char: 'particular',
        score: 45,
        dp_type: 'mispron',
        phonemes: [
          { char: 'p', score: 92, dp_type: 'normal' },
          { char: 'ə', score: 60, dp_type: 'normal' },
          { char: 'ˈt', score: 40, dp_type: 'mispron' },
          { char: 'ɪ', score: 35, dp_type: 'mispron' },
          { char: 'k', score: 90, dp_type: 'normal' },
          { char: 'j', score: 55, dp_type: 'mispron' },
          { char: 'ʊ', score: 48, dp_type: 'mispron' },
          { char: 'l', score: 85, dp_type: 'normal' },
          { char: 'ə', score: 70, dp_type: 'normal' },
          { char: 'r', score: 62, dp_type: 'normal' },
        ],
      },
    ],
    analysisPrompt: `你是一位专业英语语音教练。以下是驰声 MCP 接口返回的单词级考试级评测数据，请结合 phonemes 数组的 score 和 dp_type，生成一份面向学习者的音素诊断报告。

## 诊断规则
- 将 phonemes 按 dp_type 分组：重点看 mispron 的音素
- 对每个 mispron 音素说明：学习者常见误读方向 + 口型/舌位纠正
- 用"从弱到强"顺序罗列，不超过 4 条

## 输出语气
亲切、具体、可执行，不使用"加油"这类空洞鼓励。

## MCP 返回
\`\`\`json
{mcp_response}
\`\`\``,
    analysisOutput: `"particular" 的难点集中在 中段第二个音节 /tɪk/ 和半元音 /jʊ/ 上，可按以下顺序纠音：

① /ˈtɪ/（重音音节）— 目前得分 40/35。你把它发成了接近 /tə/ 的轻读形态，导致词重音丢失。练习时先延长 /ɪ/：p-ə-ˈTEE-k-...，让重拍落稳。

② /jʊ/ — 得分 55/48。舌面没有先抵上颚再滑出 /ʊ/，听起来像 /ə/。可对比 "use /juːz/" 与 "us /ʌs/" 感受 /j/ 起音。

③ /ə/（第一个）— 得分 60。口腔偏紧，放松下颌让它更松弛。

🎯 练习优先级：ˈtɪ > jʊ > ə₁`,
    practicePrompt: `基于上一步诊断，为这个单词生成一组针对性的微练习，遵循以下结构返回 JSON：

{
  "categories": [
    { "category": "...", "icon": "emoji",
      "items": [ { "label": "...", "content": "..." } ] }
  ]
}

## 规则
- 音素矫正：每个 mispron 音素给 1 个最小对立对 + 1 个绕口令
- 口腔意识：给 1 个口型/舌位自检动作
- 整词巩固：给 2-3 个包含该词的真实语料句`,
    practice: [
      {
        category: '音素矫正',
        icon: '🎯',
        items: [
          { label: '/ɪ/ vs /i:/ 最小对立', content: 'sit / seat · bit / beat · pick / peak （先读短音再读长音）' },
          { label: '/jʊ/ 起音练习', content: 'pure · cure · mature · furious（注意舌面先抵再滑出）' },
        ],
      },
      {
        category: '口腔意识',
        icon: '🗣️',
        items: [
          { label: '重音自检', content: '对镜朗读 par-TIC-u-lar，手掌贴下颌感受第二音节是否最张开' },
        ],
      },
      {
        category: '整词巩固',
        icon: '📝',
        items: [
          { label: '真实语料 1', content: 'Are you looking for anything in particular?' },
          { label: '真实语料 2', content: "This particular issue needs our attention." },
        ],
      },
    ],
  },

  sentence: {
    kind: 'pron',
    label: '句子',
    desc: 'Sentence · 词级 + 音素级',
    apiTag: 'en.sent.score',
    refText: 'The quick brown fox jumps over the lazy dog.',
    overall: 72,
    scores: { accuracy: 65, integrity: 95, fluency: 85, rhythm: 70 },
    speed: 130,
    details: [
      {
        char: 'The',
        score: 55,
        dp_type: 'mispron',
        phonemes: [
          { char: 'ð', score: 32, dp_type: 'mispron' },
          { char: 'ə', score: 78, dp_type: 'normal' },
        ],
      },
      { char: 'quick', score: 88, dp_type: 'normal' },
      { char: 'brown', score: 82, dp_type: 'normal' },
      {
        char: 'fox',
        score: 62,
        dp_type: 'mispron',
        phonemes: [
          { char: 'f', score: 90, dp_type: 'normal' },
          { char: 'ɒ', score: 45, dp_type: 'mispron' },
          { char: 'k', score: 85, dp_type: 'normal' },
          { char: 's', score: 88, dp_type: 'normal' },
        ],
      },
      { char: 'jumps', score: 90, dp_type: 'normal' },
      {
        char: 'over',
        score: 66,
        dp_type: 'mispron',
        phonemes: [
          { char: 'ˈoʊ', score: 48, dp_type: 'mispron' },
          { char: 'v', score: 88, dp_type: 'normal' },
          { char: 'ə', score: 72, dp_type: 'normal' },
          { char: 'r', score: 70, dp_type: 'normal' },
        ],
      },
      { char: 'the', score: 58, dp_type: 'mispron' },
      { char: 'lazy', score: 85, dp_type: 'normal' },
      { char: 'dog', score: 80, dp_type: 'normal' },
    ],
    analysisPrompt: `你是一位专业英语语音教练。以下是驰声 MCP 接口返回的句子级考试级评测数据。请基于 details[].dp_type 与 phonemes，为学习者生成结构化诊断。

## 诊断重点
1. 按 dp_type 归类：mispron（错读）/ omit（漏读）/ insert（多读）
2. 聚焦 score < 70 的单词，展开到音素层面找根因
3. 结合 rhythm / fluency 说明节奏和流利度问题

## 输出结构
- 【发音 · 音素级】：每条一个问题音素 → 纠音动作
- 【韵律 · 重音 / 语调】：基于 rhythm 与 score 偏低的单词推断
- 【学习优先级】：1 句话

## 语气
像真人教练，具体、可执行。

## MCP 返回
\`\`\`json
{mcp_response}
\`\`\``,
    analysisOutput: `🎙️ 整体：overall 72 · 完整度 95（几乎全读到）· 流利度 85（不错）· 准确度 65（主问题）· 韵律 70。

【发音 · 音素级】
① /ð/ 音（the）— 你把 /ð/ 发成了接近 /z/ 或 /d/。舌尖轻咬在上门齿下缘，让气流从齿缝送出，别用声带先抖。
② /ɒ/ 音（fox）— 得分 45。开口度不够，听起来像 /ʌ/。尝试张大下颌 + 后缩舌根，感受"啊欧"过渡。
③ /oʊ/ 双元音（over）— 起点是 /o/ 不是 /ə/。你的双元音被压扁了，刻意延长到 "OH-ver"。

【韵律 · 重音 / 语调】
④ "over" 重音落在 -ver 上，应在 O-ver 的第一音节。rhythm 70 主要被这个词拉低。
⑤ 整句是陈述句，末尾 "dog" 要明显降调 ↘，目前语调偏平。

🎯 优先级：/ð/ > /ɒ/ > over 重音。/ð/ 在英语里高频出现，收益最大。`,
    practicePrompt: `基于上一步诊断，生成一组针对该学习者的练习，返回 JSON。

{
  "categories": [
    { "category": "...", "icon": "emoji",
      "items": [ { "label": "...", "content": "..." } ] }
  ]
}

## 规则
- 每个错读音素给 1 个绕口令 + 1 个最小对立对
- 韵律问题给 1 个带重音标注的跟读句
- 最后给 1 个限时朗读挑战（结合学习者实际语速）`,
    practice: [
      {
        category: '音素矫正',
        icon: '🎯',
        items: [
          {
            label: '/θ /ð/ 专项绕口令',
            content: 'The thirty-three thieves thought that they thrilled the throne throughout Thursday.',
          },
          { label: '/ɒ/ vs /ʌ/ 最小对立', content: 'fox / fux · cot / cut · pot / putt（先读 /ɒ/，下颌更张开）' },
        ],
      },
      {
        category: '韵律训练',
        icon: '🎵',
        items: [
          {
            label: '重音标注跟读',
            content: "The 'quick 'brown 'fox 'jumps 'OVER the 'lazy 'DOG↘（大写重读，↘ 降调）",
          },
        ],
      },
      {
        category: '综合挑战',
        icon: '📈',
        items: [
          {
            label: '限时朗读',
            content: '在 3.8s 内读完全句，目标语速 ≈ 135 WPM（比当前 130 略快），并保持 /ð/ 清晰',
          },
        ],
      },
    ],
  },

  paragraph: {
    kind: 'pron',
    label: '段落',
    desc: 'Paragraph · 段落级 + 节奏',
    apiTag: 'en.pred.score',
    refText:
      'Every morning, I wake up at seven and make myself a quick breakfast. After that, I walk along the river to the office, watching the boats pass by. The fresh air really helps me focus and think through the day ahead. Sometimes I stop at a small coffee shop to grab a flat white before I arrive. By then, I feel energized and ready to tackle whatever comes my way.',
    overall: 74,
    scores: { accuracy: 72, integrity: 86, fluency: 78, rhythm: 73 },
    speed: 132,
    details: [
      { char: 'Every', score: 86, dp_type: 'normal' },
      { char: 'morning', score: 80, dp_type: 'normal' },
      { char: 'I', score: 88, dp_type: 'normal' },
      { char: 'wake', score: 82, dp_type: 'normal' },
      { char: 'up', score: 85, dp_type: 'normal' },
      { char: 'at', score: 84, dp_type: 'normal' },
      {
        char: 'seven',
        score: 66,
        dp_type: 'mispron',
        phonemes: [
          { char: 's', score: 90, dp_type: 'normal' },
          { char: 'ˈe', score: 58, dp_type: 'mispron' },
          { char: 'v', score: 82, dp_type: 'normal' },
          { char: 'ə', score: 60, dp_type: 'mispron' },
          { char: 'n', score: 88, dp_type: 'normal' },
        ],
      },
      { char: 'and', score: 78, dp_type: 'normal' },
      { char: 'make', score: 84, dp_type: 'normal' },
      { char: 'myself', score: 80, dp_type: 'normal' },
      { char: 'a', score: 82, dp_type: 'normal' },
      { char: 'quick', score: 86, dp_type: 'normal' },
      {
        char: 'breakfast',
        score: 58,
        dp_type: 'mispron',
        phonemes: [
          { char: 'ˈb', score: 82, dp_type: 'normal' },
          { char: 'r', score: 60, dp_type: 'normal' },
          { char: 'e', score: 45, dp_type: 'mispron' },
          { char: 'k', score: 88, dp_type: 'normal' },
          { char: 'f', score: 42, dp_type: 'mispron' },
          { char: 'ə', score: 70, dp_type: 'normal' },
          { char: 's', score: 84, dp_type: 'normal' },
          { char: 't', score: 86, dp_type: 'normal' },
        ],
      },
      { char: 'After', score: 82, dp_type: 'normal' },
      { char: 'that', score: 78, dp_type: 'normal' },
      { char: 'I', score: 90, dp_type: 'normal' },
      { char: 'walk', score: 82, dp_type: 'normal' },
      { char: '', score: 0, dp_type: 'omit' }, // 漏读 "along"
      { char: 'the', score: 70, dp_type: 'normal' },
      { char: 'river', score: 88, dp_type: 'normal' },
      { char: 'to', score: 84, dp_type: 'normal' },
      { char: 'the', score: 72, dp_type: 'normal' },
      { char: 'office', score: 80, dp_type: 'normal' },
      { char: 'watching', score: 83, dp_type: 'normal' },
      { char: 'the', score: 74, dp_type: 'normal' },
      { char: 'boats', score: 82, dp_type: 'normal' },
      { char: 'pass', score: 80, dp_type: 'normal' },
      { char: 'by', score: 86, dp_type: 'normal' },
      { char: 'The', score: 72, dp_type: 'normal' },
      { char: 'fresh', score: 86, dp_type: 'normal' },
      { char: 'air', score: 84, dp_type: 'normal' },
      { char: 'really', score: 74, dp_type: 'normal' },
      { char: 'helps', score: 82, dp_type: 'normal' },
      { char: 'me', score: 88, dp_type: 'normal' },
      { char: 'focus', score: 85, dp_type: 'normal' },
      { char: 'and', score: 80, dp_type: 'normal' },
      {
        char: 'think',
        score: 62,
        dp_type: 'mispron',
        phonemes: [
          { char: 'θ', score: 48, dp_type: 'mispron' },
          { char: 'ɪ', score: 80, dp_type: 'normal' },
          { char: 'ŋ', score: 78, dp_type: 'normal' },
          { char: 'k', score: 86, dp_type: 'normal' },
        ],
      },
      {
        char: 'through',
        score: 60,
        dp_type: 'mispron',
        phonemes: [
          { char: 'θ', score: 45, dp_type: 'mispron' },
          { char: 'r', score: 72, dp_type: 'normal' },
          { char: 'uː', score: 82, dp_type: 'normal' },
        ],
      },
      { char: 'the', score: 70, dp_type: 'normal' },
      { char: 'day', score: 88, dp_type: 'normal' },
      { char: 'ahead', score: 82, dp_type: 'normal' },
      { char: 'Sometimes', score: 78, dp_type: 'normal' },
      { char: 'I', score: 88, dp_type: 'normal' },
      { char: 'stop', score: 86, dp_type: 'normal' },
      { char: 'at', score: 84, dp_type: 'normal' },
      { char: 'a', score: 82, dp_type: 'normal' },
      { char: 'small', score: 84, dp_type: 'normal' },
      {
        char: 'coffee',
        score: 64,
        dp_type: 'mispron',
        phonemes: [
          { char: 'k', score: 88, dp_type: 'normal' },
          { char: 'ˈɒ', score: 50, dp_type: 'mispron' },
          { char: 'f', score: 82, dp_type: 'normal' },
          { char: 'i', score: 78, dp_type: 'normal' },
        ],
      },
      { char: 'shop', score: 80, dp_type: 'normal' },
      { char: 'to', score: 84, dp_type: 'normal' },
      { char: 'grab', score: 82, dp_type: 'normal' },
      { char: 'a', score: 80, dp_type: 'normal' },
      { char: 'flat', score: 82, dp_type: 'normal' },
      { char: 'white', score: 85, dp_type: 'normal' },
      { char: 'before', score: 82, dp_type: 'normal' },
      { char: 'I', score: 88, dp_type: 'normal' },
      { char: 'arrive', score: 80, dp_type: 'normal' },
      { char: 'By', score: 86, dp_type: 'normal' },
      { char: 'then', score: 78, dp_type: 'normal' },
      { char: 'I', score: 88, dp_type: 'normal' },
      { char: 'feel', score: 84, dp_type: 'normal' },
      {
        char: 'energized',
        score: 68,
        dp_type: 'mispron',
        phonemes: [
          { char: 'ˈe', score: 58, dp_type: 'mispron' },
          { char: 'n', score: 82, dp_type: 'normal' },
          { char: 'ə', score: 72, dp_type: 'normal' },
          { char: 'dʒ', score: 84, dp_type: 'normal' },
          { char: 'aɪ', score: 78, dp_type: 'normal' },
          { char: 'z', score: 80, dp_type: 'normal' },
          { char: 'd', score: 82, dp_type: 'normal' },
        ],
      },
      { char: 'and', score: 80, dp_type: 'normal' },
      { char: 'ready', score: 84, dp_type: 'normal' },
      { char: 'to', score: 86, dp_type: 'normal' },
      { char: 'tackle', score: 80, dp_type: 'normal' },
      {
        char: 'whatever',
        score: 70,
        dp_type: 'mispron',
        phonemes: [
          { char: 'w', score: 82, dp_type: 'normal' },
          { char: 'ɒ', score: 68, dp_type: 'normal' },
          { char: 't', score: 84, dp_type: 'normal' },
          { char: 'ˈe', score: 60, dp_type: 'mispron' },
          { char: 'v', score: 80, dp_type: 'normal' },
          { char: 'ə', score: 72, dp_type: 'normal' },
        ],
      },
      { char: 'comes', score: 82, dp_type: 'normal' },
      { char: 'my', score: 88, dp_type: 'normal' },
      { char: 'way', score: 86, dp_type: 'normal' },
    ],
    analysisPrompt: `你是一位专业英语语音教练。以下是驰声 MCP 返回的段落级评测数据。请综合 details、dp_type、integrity 与 rhythm 做诊断。

## 诊断重点
- 段落级要特别关注 dp_type=omit / insert —— 整段朗读时学习者最常漏句
- 按"连续错读词群"推断背后是同一类音素问题
- rhythm 分数在段落中更能反映停顿和意群划分

## 输出结构
- 【完整度】漏读/多读位置、原因推断
- 【发音】聚合同类错音
- 【节奏】意群停顿是否合理
- 【建议】学习优先级

## MCP 返回
\`\`\`json
{mcp_response}
\`\`\``,
    analysisOutput: `整体 overall 74，段落主要矛盾在 **accuracy 72** 与 **integrity 86**——发音问题分散在多个音素家族，同时有 1 处漏读被系统精准识别。

【完整度 · 最紧急】
⚠ 在 "walk" 之后漏读了介词 "along"。段落朗读中介词因重音弱常被学习者吞音，MCP 的 dp_type=omit 能准确抓到这类问题。

【发音 · 按音素家族聚类】
相似错音聚焦在 **3 个家族** 上：

① **齿擦音 /θ/**
- "think" (62) — /θ/ 48 分，偏向 /s/
- "through" (60) — /θ/ 45 分，同类错
舌尖轻抵上齿，让气流从齿缝摩擦而出，不要缩到齿龈后。

② **短元音 /e/**
- "breakfast" (58) — /e/ 发成了 /æ/
- "seven" (66) — /ˈe/ 重音弱化
- "energized" (68) / "whatever" (70) — /ˈe/ 重音都偏弱
口型：嘴角微向两侧，下颌比 /æ/ 更紧。

③ **开口后元音 /ɒ/**
- "coffee" (64) — /ˈɒ/ 50 分，开口度不足
下颌张大 + 舌根后缩，感受 "啊欧" 的过渡。

【节奏】
- rhythm 73 偏低，speed 132 WPM 正常
- 句间停顿偏长，逗号处 ≤0.3s、句号处 ≤0.5s 更自然
- "along the river" 这种介词短语要整体带过，不要每个词独立停顿

【学习优先级】
1. 先把 /e/ 与 /ɒ/ 两个元音发稳（基本功）
2. 再练 /θ/ /ð/ 齿擦音（英语高频）
3. 介词带进意群，不单独停顿
4. 最后打磨节奏韵律`,
    practicePrompt: `基于诊断生成一组段落级练习，返回 JSON，结构同上。

## 规则
- 把同类错音用"音素家族"练习串起来
- 介词漏读问题用"意群跟读"解决（不是单独练介词）
- 加一个"录音复听自我批改"环节，培养长文本的元认知`,
    practice: [
      {
        category: '音素家族',
        icon: '🎯',
        items: [
          {
            label: '短元音 /e/ 集训',
            content: 'bed · red · said · head · bread · breakfast · seven · leather · energy · whatever（都含 /e/，对比口型）',
          },
          {
            label: '齿擦音 /θ/ 最小对立',
            content: 'think / sink · thought / sought · path / pass · through / true · thin / sin（练完再回段落）',
          },
          {
            label: '开口后元音 /ɒ/',
            content: 'coffee · office · stop · shop · boss · box（英式 /ɒ/；美式 /ɑː/ 可作对照）',
          },
        ],
      },
      {
        category: '意群跟读',
        icon: '🎵',
        items: [
          {
            label: '意群切分版',
            content: '[Every morning] / [I wake up at seven] / [and make myself a quick breakfast] // [I walk along the river] / [to the office] / [watching the boats pass by]（/ = 0.2s，// = 0.4s）',
          },
          {
            label: '介词防漏读',
            content: '重点盯 "along the river"、"through the day"、"by then" ——介词要和前后词连起来读，不要单独停顿',
          },
        ],
      },
      {
        category: '元认知训练',
        icon: '🧠',
        items: [
          {
            label: '录音复听',
            content: '完整朗读 3 遍，每遍录音后听一遍并标出自己能听出的漏读/错读，再对照 MCP 的 details 结果',
          },
        ],
      },
    ],
  },

  semiopen: {
    kind: 'semi',
    label: '半开放题',
    desc: 'Semi-open · 半开放问答 · 仅英文',
    apiTag: 'en.pqan.score',
    refText: 'Topic: Describe your daily morning routine.',
    transcript:
      'Usually I wake up at seven, and then I eat breakfast quickly. After that I walk to work. I like the fresh air in the morning.',
    overall: 71,
    scores: { grammar: 78, content: 62, fluency: 75, pron: 72 },
    speed: 118,
    issues: [
      { level: 'warn', label: '内容丰富度偏低', detail: '只讲了起床 / 早餐 / 走路 / 空气 4 个要点，缺少感受、原因或对比' },
      { level: 'warn', label: '句式结构单一', detail: '全部是 "主+谓+宾" 简单句，无复合句、无从句、无转折连词' },
      { level: 'ok', label: '衔接词恰当', detail: '使用了 "and then"、"After that"，时间顺序清晰' },
      { level: 'warn', label: '/θ/ 与 /r/ 偶发混淆', detail: 'morning 和 fresh 的 /r/ 略偏向 /w/' },
    ],
    analysisPrompt: `你是一位雅思 / 中高考听说考试 的专业教练。以下是驰声 MCP 在半开放题（en.pqan.score）返回的 5 维评分 + 学习者转写。请针对考试评分标准给诊断。

## 评分标准（权重）
- grammar（语法 25%）：时态 / 从句 / 句式多样性
- content（内容 30%）：要点完整性、细节、逻辑
- fluency（流利 25%）：停顿、连贯、速率
- pron（发音 20%）：音素准确 + 韵律

## 输出结构
1. 当前档位估计（满分 100 对标考试）
2. 每个维度的主要扣分点（结合 transcript 引用学习者原话）
3. 下一档需要补什么（给具体句型模板，不要空话）

## MCP 返回
\`\`\`json
{mcp_response}
\`\`\``,
    analysisOutput: `🎯 总分 71/100 · 考试档位：中档（B1 末 / B2 初）。

| 维度 | 分数 | 主要扣分点 |
|---|---|---|
| 内容 | 62 | 只有 4 个要点，没有"为什么"和"感受" |
| 流利 | 75 | 速率 118 WPM 偏慢，停顿次数偏多 |
| 语法 | 78 | 全部简单句，零从句零连词 |
| 发音 | 72 | /r/ 偶发偏 /w/ |

【下一档（80+）要补的 3 件事】

① **加一个原因从句**（语法 +6）
把 "I walk to work" 升级成：
→ "I walk to work **because it helps me wake up**, **even though it takes longer**."

② **加一层感受**（内容 +10）
在 "fresh air" 后面跟：
→ "which makes me **feel refreshed and ready for the day ahead**."

③ **去掉填充词**（流利 +5）
把 "and then"、"After that" 换成 "Once ... , ..."：
→ "Once I've had breakfast, I walk to work."

做到这 3 点，总分可上到 82+。`,
    practicePrompt: `基于诊断生成针对性练习。返回 JSON。

## 规则
- 语法练习：给 2-3 个"从句 / 连词"替换句型模板
- 内容练习：给一个"AREA"结构模板（Answer + Reason + Example + Alternative）
- 发音练习：只针对诊断里提到的音素，不要覆盖面过大
- 最后加一个"录一段对照"任务`,
    practice: [
      {
        category: '语法升级',
        icon: '📐',
        items: [
          {
            label: '从句替换模板',
            content: '① because / since ... ② although / even though ... ③ while / when ... ④ which / that ... —— 把原来的每一个简单句都尝试套一个',
          },
        ],
      },
      {
        category: '内容丰富',
        icon: '💡',
        items: [
          {
            label: 'AREA 结构',
            content: 'Answer（直接答）→ Reason（为什么）→ Example（举一个例子）→ Alternative（或者换一种情境）。把原来 4 个要点的每一个都试着扩一层',
          },
        ],
      },
      {
        category: '发音专项',
        icon: '🎯',
        items: [
          { label: '/r/ 口型', content: '舌尖后卷不碰上颚：red / write / really / refresh（注意嘴唇不外突）' },
        ],
      },
      {
        category: '录音对标',
        icon: '🎙️',
        items: [
          { label: '60s 录音挑战', content: '再录一版不少于 60 秒，要求至少 2 个从句 + 2 次 "feel / make / because"' },
        ],
      },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────
// CN_SAMPLES · 中文评测内核样本集
// 驰声中文内核目前支持：cn.word.raw / cn.sent.raw / cn.pred.raw（封闭题型）
// 半开放与开放题型暂仅英文支持
// 中文特色字段：tone（声调）· erhua（儿化）· 轻声 · 变调
// ─────────────────────────────────────────────────────────────────────────
const CN_SAMPLES: Partial<Record<QType, Sample>> = {
  word: {
    kind: 'pron',
    label: '字词',
    desc: '字词 · 拼音 + 声调评测',
    apiTag: 'cn.word.raw',
    refText: '独特',
    overall: 72,
    scores: { accuracy: 82, integrity: 100, fluency: 100 },
    details: [
      {
        char: '独',
        score: 60,
        dp_type: 'mispron',
        phonemes: [
          { char: 'd', score: 92, dp_type: 'normal' },
          { char: 'ú(2声)', score: 45, dp_type: 'mispron' },
        ],
      },
      {
        char: '特',
        score: 78,
        dp_type: 'normal',
        phonemes: [
          { char: 't', score: 88, dp_type: 'normal' },
          { char: 'è(4声)', score: 72, dp_type: 'normal' },
        ],
      },
    ],
    analysisPrompt: `你是一位专业的普通话口语教练。以下是驰声 MCP 返回的中文字词级评测数据（cn.word.raw）。

## 中文评测的关键
- 声调（tone）错误在中文里权重最高 —— 声调错了意思就变了
- dp_type=mispron 多半来自声调误读、前后鼻音混淆、平翘舌混淆
- 拼音准确但声调错，听起来是"外国口音"

## 诊断规则
- 按音节逐一看：拼音是否准、声调曲线是否对
- 若连字，考虑"三声变调"、"不/一 变调"
- 给出口型 + 舌位 + 声调手势示意

## MCP 返回
\`\`\`json
{mcp_response}
\`\`\``,
    analysisOutput: `"独特" 的主要问题在**「独」的二声**：

① 「独 dú」得分 60 —— 声调 ú(2声) 仅 45 分
你把它发成了近似三声（降升调），听起来像 "dǔ"。二声是"由中平起，向高上扬"，
类似问别人"啊？"的升调，不要先降再升。

② 「特 tè」得分 78 —— 声调 è(4声) 72 分
四声是"由高快速降到低"，你的下降速度不够干脆，听起来偏平。
动作要像握拳砸下来一样短促。

🎯 学习优先级：二声「独」> 四声「特」`,
    practicePrompt: `基于诊断生成针对性中文字词练习，返回 JSON。

## 规则
- 声调训练优先：给该音节的 4 个声调对比（mā má mǎ mà）
- 给含该字的常用词组各 2 个
- 结合普通话的易混字对比`,
    practice: [
      {
        category: '声调专项',
        icon: '🎵',
        items: [
          { label: '二声「dú」对照四声', content: 'dū / dú / dǔ / dù —— 反复读，感受由中平起向高上扬' },
          { label: '四声「tè」对照二声', content: 'tē / té / tě / tè —— 重点体会四声从高到低的干脆下降' },
        ],
      },
      {
        category: '词组巩固',
        icon: '📝',
        items: [
          { label: '"独" 的常用词', content: '独立 · 独特 · 独自 · 孤独（都是二声，练到稳）' },
          { label: '"特" 的常用词', content: '特别 · 特殊 · 特意 · 模特（四声稳定）' },
        ],
      },
    ],
  } as PronSample,

  sentence: {
    kind: 'pron',
    label: '句子',
    desc: '句子 · 拼音 + 声调 + 流利度',
    apiTag: 'cn.sent.raw',
    refText: '妈妈骑着马儿过小桥，小桥轻轻摇啊摇。',
    overall: 74,
    scores: { accuracy: 78, integrity: 98, fluency: 82, rhythm: 62 },
    speed: 4,
    details: [
      { char: '妈妈', score: 82, dp_type: 'normal',
        phonemes: [
          { char: 'mā(1声)', score: 88, dp_type: 'normal' },
          { char: 'ma(轻声)', score: 70, dp_type: 'mispron' },
        ],
      },
      { char: '骑', score: 85, dp_type: 'normal' },
      { char: '着', score: 75, dp_type: 'normal' },
      { char: '马儿', score: 62, dp_type: 'mispron',
        phonemes: [
          { char: 'mǎ(3声)', score: 72, dp_type: 'normal' },
          { char: 'r(儿化)', score: 42, dp_type: 'mispron' },
        ],
      },
      { char: '过', score: 88, dp_type: 'normal' },
      { char: '小桥', score: 80, dp_type: 'normal' },
      { char: '小桥', score: 80, dp_type: 'normal' },
      { char: '轻轻', score: 75, dp_type: 'normal' },
      { char: '摇啊摇', score: 70, dp_type: 'normal' },
    ],
    analysisPrompt: `你是一位普通话口语教练。以下是驰声 MCP 句子评测（cn.sent.raw）返回数据。

## 中文句子评测重点
- 儿化（/r/）是否出现
- 轻声（中、第二个"妈"、"子"、"头"等）是否短促
- 变调：三声连读、"不+四声"、"一+一声/二声/三声/四声"
- 意群停顿：逗号 ≤0.3s

## MCP 返回
\`\`\`json
{mcp_response}
\`\`\``,
    analysisOutput: `整体 overall 74，主要问题在**儿化**和**轻声**处理：

【儿化 · 最紧急】
⚠ 「马儿」里的 r(儿化) 得分仅 42。你把它读成了「马（mǎ）+ 儿（ér）」两个音节。
儿化是把「马」的尾音卷舌接近 r，一气呵成，只有一个音节（mǎr）。

【轻声】
⚠ 「妈妈」的第二个「ma」是轻声，你读成了和第一个一样的阴平。
轻声要短、轻、不带声调，像"蜻蜓点水"。

【节奏 · rhythm 62 偏低】
- 全句语速 ≈4 字/秒，正常
- 但"过 / 小桥" 处停顿过长；"摇啊摇" 连读偏生硬

【学习优先级】
1. 儿化「马儿」→ 最影响普通话地道度
2. 「妈妈」的轻声
3. "摇啊摇" 的连读韵律`,
    practicePrompt: '基于诊断生成中文句子练习，重点练儿化、轻声、意群连读。返回 JSON。',
    practice: [
      {
        category: '儿化韵',
        icon: '🌀',
        items: [
          { label: '儿化字集', content: '马儿 (mǎr) · 花儿 (huār) · 鸟儿 (niǎor) · 小孩儿 (xiǎoháir) · 今儿 (jīnr)' },
          { label: '口型要点', content: '发完主要元音后，舌尖迅速上卷接近 r 位置，不要停顿、不要换气' },
        ],
      },
      {
        category: '轻声',
        icon: '🪶',
        items: [
          { label: '叠字轻声', content: '妈妈 · 爸爸 · 哥哥 · 姐姐 · 弟弟（第二个字都是轻声）' },
          { label: '语气词轻声', content: '走吧 · 说呢 · 是吗 · 好啊（句末语气词一律轻读）' },
        ],
      },
      {
        category: '意群跟读',
        icon: '🎵',
        items: [
          { label: '标注版', content: '[妈妈骑着马儿] / [过小桥] // [小桥轻轻] / [摇啊摇]（/ = 短停 0.2s，// = 句间停顿 0.4s）' },
        ],
      },
    ],
  } as PronSample,

  paragraph: {
    kind: 'pron',
    label: '段落',
    desc: '段落 · 综合拼音 / 声调 / 韵律',
    apiTag: 'cn.pred.raw',
    refText:
      '春天来了，公园里的花儿都开了。小朋友们在草地上奔跑，脸上挂着灿烂的笑容。不远处有几只鸟儿在枝头唱歌，空气里弥漫着花香，让人心情舒畅。',
    overall: 76,
    scores: { accuracy: 80, integrity: 92, fluency: 78, rhythm: 66 },
    speed: 5,
    details: [
      { char: '春天', score: 85, dp_type: 'normal' },
      { char: '来了', score: 80, dp_type: 'normal' },
      { char: '公园', score: 82, dp_type: 'normal' },
      { char: '里的', score: 75, dp_type: 'normal' },
      { char: '花儿', score: 60, dp_type: 'mispron',
        phonemes: [
          { char: 'huā(1声)', score: 85, dp_type: 'normal' },
          { char: 'r(儿化)', score: 38, dp_type: 'mispron' },
        ],
      },
      { char: '都', score: 85, dp_type: 'normal' },
      { char: '开了', score: 80, dp_type: 'normal' },
      { char: '小朋友们', score: 78, dp_type: 'normal' },
      { char: '在', score: 82, dp_type: 'normal' },
      { char: '草地上', score: 80, dp_type: 'normal' },
      { char: '奔跑', score: 78, dp_type: 'normal' },
      { char: '脸上', score: 82, dp_type: 'normal' },
      { char: '挂着', score: 75, dp_type: 'normal' },
      { char: '灿烂', score: 70, dp_type: 'normal',
        phonemes: [
          { char: 'càn(4声)', score: 65, dp_type: 'normal' },
          { char: 'làn(4声)', score: 75, dp_type: 'normal' },
        ],
      },
      { char: '的', score: 75, dp_type: 'normal' },
      { char: '笑容', score: 82, dp_type: 'normal' },
      { char: '不远处', score: 70, dp_type: 'normal',
        phonemes: [
          { char: 'bù(4声+4声 → 2声+4声)', score: 55, dp_type: 'mispron' },
        ],
      },
      { char: '有', score: 85, dp_type: 'normal' },
      { char: '几只', score: 80, dp_type: 'normal' },
      { char: '鸟儿', score: 58, dp_type: 'mispron',
        phonemes: [
          { char: 'niǎo(3声)', score: 78, dp_type: 'normal' },
          { char: 'r(儿化)', score: 35, dp_type: 'mispron' },
        ],
      },
      { char: '在', score: 85, dp_type: 'normal' },
      { char: '枝头', score: 78, dp_type: 'normal' },
      { char: '唱歌', score: 82, dp_type: 'normal' },
      { char: '空气', score: 80, dp_type: 'normal' },
      { char: '里', score: 78, dp_type: 'normal' },
      { char: '弥漫着', score: 72, dp_type: 'normal' },
      { char: '花香', score: 80, dp_type: 'normal' },
      { char: '让人', score: 82, dp_type: 'normal' },
      { char: '心情', score: 80, dp_type: 'normal' },
      { char: '舒畅', score: 78, dp_type: 'normal' },
    ],
    analysisPrompt: `你是一位普通话口语教练。以下是驰声 MCP 段落评测（cn.pred.raw）返回数据。

## 段落级关注点
- 儿化（/r/）分布：「花儿」「鸟儿」等常见儿化词
- 「不」「一」变调：不+4声→2声、一+4声→2声、一+1/2/3声→4声
- 意群停顿：中文意群偏短，2-4 字一组
- 整体语速 ≈ 4-5 字/秒

## MCP 返回
\`\`\`json
{mcp_response}
\`\`\``,
    analysisOutput: `整体 overall 76，主要矛盾在**儿化韵**（2 处 38/35 分）和**「不」变调**（55 分）：

【儿化 · 系统性问题】
⚠ 「花儿 huār」(38) 和 「鸟儿 niǎor」(35) 都把儿化读成了独立音节。
儿化不是加一个「儿」字，而是主元音尾部卷舌，整个音节只有一个拍子。

【变调】
⚠ 「不远处」的「不」读作 bù（四声）。
"不 + 第四声" 时，"不" 必须变为第二声（bú）。
所以这里应读 bú yuǎn chù，不是 bù yuǎn chù。

【韵律 · rhythm 66 偏低】
- 意群切分不够自然，"在草地上奔跑" 应作为一个意群
- "挂着灿烂的笑容" 中间停顿过长

【学习优先级】
1. 儿化（最影响地道度）
2. 「不」「一」变调规则
3. 意群连读`,
    practicePrompt: '基于诊断生成中文段落综合练习，返回 JSON。',
    practice: [
      {
        category: '儿化韵',
        icon: '🌀',
        items: [
          { label: '儿化对照练', content: '花 / 花儿 · 鸟 / 鸟儿 · 孩 / 孩儿 · 今天 / 今儿 · 老头 / 老头儿（对比感受区别）' },
          { label: '整段儿化版', content: '整段中所有可儿化的词都儿化：公园里的花儿都开了... 几只鸟儿在枝头... （体会地道北京腔）' },
        ],
      },
      {
        category: '变调规则',
        icon: '📐',
        items: [
          { label: '"不" 变调', content: '不好 (bù hǎo) · 不去 (bú qù) · 不对 (bú duì) · 不错 (bú cuò) —— 后接 4 声才变 2 声' },
          { label: '"一" 变调', content: '一个 (yí gè) · 一次 (yí cì) · 一天 (yì tiān) · 一年 (yì nián) · 一只 (yì zhī)' },
        ],
      },
      {
        category: '意群分段',
        icon: '🎵',
        items: [
          { label: '标注版', content: '[春天来了] // [公园里的花儿都开了] // [小朋友们] / [在草地上奔跑] / [脸上挂着灿烂的笑容]' },
        ],
      },
    ],
  } as PronSample,
};

// ─── util: build MCP JSON string for prompt injection ────────────────────
function buildMcpJson(sample: Sample): string {
  if (sample.kind === 'pron') {
    const compact = {
      overall: sample.overall,
      pron: sample.scores,
      ...(sample.speed ? { speed: sample.speed } : {}),
      details: sample.details.map((d) => ({
        char: d.char,
        score: d.score,
        dp_type: d.dp_type,
        ...(d.phonemes ? { phonemes: d.phonemes } : {}),
      })),
    };
    return JSON.stringify(compact, null, 2);
  }
  const compact = {
    overall: sample.overall,
    scores: sample.scores,
    speed: sample.speed,
    transcript: sample.transcript,
  };
  return JSON.stringify(compact, null, 2);
}

// ─── small components ────────────────────────────────────────────────────
function AnimatedScore({ target, label, sub }: { target: number; label: string; sub?: string }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame: number;
    const duration = 800;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  const color = target >= 80 ? 'text-emerald-600' : target >= 65 ? 'text-amber-600' : 'text-rose-500';

  return (
    <div className="bg-background p-4 flex flex-col items-center">
      <span className={`text-2xl font-bold tabular-nums ${color}`}>{value}</span>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
      {sub && <span className="text-[10px] text-muted-foreground/70 mt-0.5 font-mono">{sub}</span>}
    </div>
  );
}

function CopyButton({
  text,
  label = '复制',
  copiedLabel = '已复制',
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300 transition-colors font-mono"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      {copied ? copiedLabel : label}
    </button>
  );
}

function TypewriterMarkdown({ text }: { text: string }) {
  const [visibleChars, setVisibleChars] = useState(0);
  useEffect(() => {
    setVisibleChars(0);
    const total = text.length;
    const step = Math.max(4, Math.floor(total / 120));
    const id = setInterval(() => {
      setVisibleChars((c) => {
        if (c >= total) {
          clearInterval(id);
          return c;
        }
        return Math.min(total, c + step);
      });
    }, 25);
    return () => clearInterval(id);
  }, [text]);

  const shown = text.slice(0, visibleChars);
  return (
    <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans text-foreground">
      {shown}
      {visibleChars < text.length && <span className="inline-block w-1.5 h-3.5 bg-foreground/60 align-middle animate-pulse ml-0.5" />}
    </pre>
  );
}

// ─── diagnostic renderers ────────────────────────────────────────────────
const DP_BADGE: Record<DpType, { text: string; cls: string }> = {
  normal: { text: 'normal', cls: 'bg-muted text-muted-foreground' },
  mispron: { text: 'mispron', cls: 'bg-rose-50 text-rose-600 border-rose-200' },
  omit: { text: 'omit', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  insert: { text: 'insert', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
};

function WordInline({ d }: { d: WordDetail }) {
  if (d.dp_type === 'omit') {
    return (
      <span className="inline-flex items-center gap-0.5 mx-0.5 px-1 rounded border border-dashed border-amber-300 text-amber-600 text-xs font-mono">
        ⊘ omit
      </span>
    );
  }
  const cls =
    d.dp_type === 'mispron'
      ? 'text-rose-600 underline decoration-rose-300 decoration-2 underline-offset-4'
      : d.dp_type === 'insert'
      ? 'text-violet-600 italic'
      : 'text-foreground';
  return (
    <span className={`${cls} relative`} title={`score: ${d.score} · ${d.dp_type}`}>
      {d.char}
      <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground/80 font-mono opacity-0 group-hover:opacity-100 pointer-events-none">
        {d.score}
      </span>
    </span>
  );
}

function DetailsPanel({ sample, uiZh }: { sample: PronSample; uiZh: boolean }) {
  const problems = sample.details.filter((d) => d.dp_type !== 'normal' || d.score < 75);
  const missing = uiZh ? '(缺失)' : '(missing)';
  const headerPb = uiZh ? '问题词展开 · Phoneme Breakdown' : 'Problem words · phoneme breakdown';
  return (
    <div className="space-y-4">
      {/* Inline sentence rendering */}
      <div className="rounded-md border border-border/60 bg-muted/20 p-4">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Word-level rendering</div>
        <p className="text-base leading-loose group">
          {sample.details.map((d, i) => (
            <span key={i}>
              <WordInline d={d} />
              {i < sample.details.length - 1 && <span> </span>}
            </span>
          ))}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
          {(Object.keys(DP_BADGE) as DpType[]).map((t) => (
            <span key={t} className={`px-1.5 py-0.5 rounded border font-mono ${DP_BADGE[t].cls}`}>
              {DP_BADGE[t].text}
            </span>
          ))}
        </div>
      </div>

      {/* Problem words with phoneme breakdown */}
      {problems.length > 0 && (
        <div className="rounded-md border border-border/60 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border/40 bg-muted/30 flex items-center justify-between">
            <span className="text-xs font-semibold">{headerPb}</span>
            <span className="text-[10px] text-muted-foreground font-mono">{problems.length} words</span>
          </div>
          <div className="divide-y divide-border/40">
            {problems.map((w, wi) => (
              <div key={wi} className="px-4 py-3">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-semibold text-sm">{w.char || missing}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${DP_BADGE[w.dp_type].cls}`}
                  >
                    {DP_BADGE[w.dp_type].text}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono ml-auto">score: {w.score}</span>
                </div>
                {w.phonemes && (
                  <div className="flex flex-wrap gap-1">
                    {w.phonemes.map((p, pi) => (
                      <span
                        key={pi}
                        className={`px-2 py-1 rounded font-mono text-[11px] border ${
                          p.dp_type === 'mispron'
                            ? 'bg-rose-50 text-rose-600 border-rose-200'
                            : p.score < 70
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-muted text-foreground border-border/50'
                        }`}
                      >
                        /{p.char}/ <span className="opacity-60">{p.score}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SemiPanel({ sample, uiZh }: { sample: SemiSample; uiZh: boolean }) {
  const asr = uiZh ? 'Transcript · ASR 识别' : 'Transcript · ASR';
  const diag = uiZh ? '半开放诊断要点' : 'Semi-open · diagnosis';
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border/60 bg-muted/20 p-4">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">{asr}</div>
        <p className="text-sm leading-relaxed italic">&ldquo;{sample.transcript}&rdquo;</p>
        <div className="mt-2 text-[10px] font-mono text-muted-foreground">
          speed: {sample.speed} WPM · length: {sample.transcript.split(/\s+/).length} words
        </div>
      </div>
      <div className="rounded-md border border-border/60 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/40 bg-muted/30 text-xs font-semibold">{diag}</div>
        <ul className="divide-y divide-border/40">
          {sample.issues.map((is, i) => (
            <li key={i} className="px-4 py-2.5 flex items-start gap-3 text-sm">
              <span
                className={`mt-0.5 w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  is.level === 'warn' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                }`}
              >
                {is.level === 'warn' ? '!' : '✓'}
              </span>
              <div>
                <span className="font-medium">{is.label}</span>
                <span className="text-muted-foreground ml-2">— {is.detail}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── icons for tabs ──────────────────────────────────────────────────────
const TAB_ICONS: Record<QType, typeof Type> = {
  word: Type,
  sentence: AlignLeft,
  paragraph: FileText,
  semiopen: MessagesSquare,
};

// 中文内核支持的题型（半开放仅英文支持）
const CN_AVAILABLE: QType[] = ['word', 'sentence', 'paragraph'];
const EN_AVAILABLE: QType[] = ['word', 'sentence', 'paragraph', 'semiopen'];

/** 英文 UI 下中文内核题型卡片的文案（数据仍为 CN_SAMPLES，仅展示层英文化） */
const CN_CARD_EN: Partial<Record<QType, { label: string; desc: string }>> = {
  word: { label: 'Words', desc: 'Word-level · pinyin + tone' },
  sentence: { label: 'Sentences', desc: 'Sentence · pinyin + tone + fluency' },
  paragraph: { label: 'Paragraphs', desc: 'Paragraph · pinyin, tone & prosody' },
};

// ─── page ─────────────────────────────────────────────────────────────────
export default function DemoPage() {
  const locale = useLocale();
  const uiZh = locale.startsWith('zh');
  const searchParams = useSearchParams();
  const rawType = searchParams.get('type');
  const typeMap: Record<string, QType> = {
    word: 'word',
    sent: 'sentence',
    sentence: 'sentence',
    para: 'paragraph',
    paragraph: 'paragraph',
    semi: 'semiopen',
    semiopen: 'semiopen',
  };
  /** 评测内核（英/中）：与站点语言无关，可选英文或中文内核 */
  const initialLang: Lang = searchParams.get('lang') === 'cn' ? 'cn' : 'en';
  const mapped = rawType ? typeMap[rawType] : undefined;
  const allowed = initialLang === 'cn' ? CN_AVAILABLE : EN_AVAILABLE;
  const initialQType: QType = mapped && allowed.includes(mapped) ? mapped : 'sentence';

  const [lang, setLang] = useState<Lang>(initialLang);
  const [qtype, setQtype] = useState<QType>(initialQType);
  const [phase, setPhase] = useState<Phase>('idle');
  const [showRawJson, setShowRawJson] = useState(false);

  const samplesForLang: Partial<Record<QType, Sample>> =
    lang === 'cn' ? CN_SAMPLES : uiZh ? SAMPLES : SAMPLES_EN;
  const availableTypes: QType[] = lang === 'cn' ? CN_AVAILABLE : EN_AVAILABLE;

  // 如当前题型在该语言下不可用，取第一个可用题型
  const effectiveQType: QType = availableTypes.includes(qtype) ? qtype : availableTypes[0];

  /** 中文内核 + 英文 UI：保留 JSON 数值结构，Prompt / 诊断 / 练习文案走英文展示层 */
  const sample = useMemo(() => {
    const pool: Partial<Record<QType, Sample>> =
      lang === 'cn' ? CN_SAMPLES : uiZh ? SAMPLES : SAMPLES_EN;
    const base = (pool[effectiveQType] ?? SAMPLES[effectiveQType]) as Sample;
    if (lang !== 'cn' || uiZh) return base;
    const patch = CN_SAMPLES_UI_EN[effectiveQType];
    if (!patch || base.kind !== 'pron') return base;
    return { ...base, ...patch } as PronSample;
  }, [lang, uiZh, effectiveQType]);

  const isWordType = sample.kind === 'pron' && effectiveQType === 'word';
  const mcpJson = useMemo(() => buildMcpJson(sample), [sample]);

  const analysisPromptResolved = sample.analysisPrompt.replace('{mcp_response}', mcpJson);

  function switchType(t: QType) {
    if (t === effectiveQType) return;
    setQtype(t);
    setPhase('idle');
    setShowRawJson(false);
  }

  function switchLang(l: Lang) {
    if (l === lang) return;
    setLang(l);
    const next = l === 'cn' ? CN_AVAILABLE : EN_AVAILABLE;
    if (!next.includes(qtype)) {
      setQtype(next[0]);
    }
    setPhase('idle');
    setShowRawJson(false);
  }

  function runAssess() {
    setPhase('recording');
    // 2.4s 模拟录音 → 1.2s 评测 → 结果
    setTimeout(() => {
      setPhase('assessing');
      setTimeout(() => setPhase('scores'), 1200);
    }, 2400);
  }
  function runAnalysis() {
    setPhase('analyzing');
    setTimeout(() => setPhase('analysis'), 500);
  }
  function runPractice() {
    setPhase('generating');
    setTimeout(() => setPhase('practice'), 600);
  }
  function reset() {
    setPhase('idle');
    setShowRawJson(false);
  }

  const ui = {
    back: uiZh ? '返回首页' : 'Back to Home',
    title: uiZh ? '在线体验' : 'Live Demo',
    lead: uiZh
      ? '完整还原驰声 MCP 真实 API 输出 + LLM 二次 / 三次分析的 Prompt Skill。每一步的提示词都可复制，直接拿走做你自己 Agent 的模板。'
      : 'Faithful Chivox MCP API output plus second- and third-pass LLM prompt skills. Copy any step into your own agent.',
    langLabel: uiZh ? '评测内核（中 / 英可选）' : 'Evaluation engine (CN / EN)',
    kernEn: uiZh ? '英文内核' : 'EN engine',
    kernCn: uiZh ? '中文内核' : 'ZH engine',
    cnNote: uiZh
      ? '中文内核目前支持字词 / 句子 / 段落三类（cn.word.raw · cn.sent.raw · cn.pred.raw）；半开放与开放题型当前仅英文内核支持。'
      : 'The Chinese engine supports three task types — words, sentences, and paragraphs (cn.word.raw · cn.sent.raw · cn.pred.raw). Semi-open and open-ended prompts are only available on the English engine for now.',
    qTypeLabel: uiZh ? '选择题型 · Question Type' : 'Question type',
    step1: uiZh ? '① 语音评测' : '① Evaluate',
    step2: uiZh ? '② 二次分析 · LLM 诊断' : '② LLM analysis',
    step3: uiZh ? '③ 三次分析 · 练习生成' : '③ Practice',
    readAloud: uiZh ? '请朗读以下文本 · Read aloud' : 'Read aloud',
    openQ: uiZh ? '半开放题目 · Open question' : 'Open-ended prompt',
    simRun: uiZh ? '模拟评测' : 'Run demo',
    rec: uiZh ? '正在录音 · RECORDING' : 'Recording',
    recBtn: uiZh ? '录音中...' : 'Recording…',
    assessing: uiZh ? '评测中...' : 'Scoring…',
    s1title: uiZh ? '① 语音评测 · MCP 原始返回' : '① MCP response',
    hideJson: uiZh ? '隐藏 JSON' : 'Hide JSON',
    showJson: uiZh ? '查看 raw JSON' : 'View raw JSON',
    subOverall: uiZh ? '总分' : 'Total',
    subPron: uiZh ? '发音分' : 'Pron.',
    subAcc: uiZh ? '准确度' : 'Accuracy',
    subFlu: uiZh ? '流利度' : 'Fluency',
    subInt: uiZh ? '完整度' : 'Integrity',
    subGram: uiZh ? '语法分' : 'Grammar',
    subCont: uiZh ? '内容分' : 'Content',
    subFlu2: uiZh ? '流利分' : 'Fluency',
    analyze: uiZh ? '开始二次分析 · LLM 诊断' : 'Run LLM analysis',
    analyzing: uiZh ? '② LLM 正在基于 Prompt 分析 MCP 数据...' : '② LLM is analyzing MCP data…',
    repTitle: uiZh ? '② 二次分析 · LLM 诊断报告' : '② LLM diagnosis',
    copyPrompt: uiZh ? '复制 Prompt' : 'Copy prompt',
    copied: uiZh ? '已复制' : 'Copied',
    mcpComment: uiZh ? '/* MCP JSON（上方 raw JSON 中） */' : '/* MCP JSON (see raw JSON above) */',
    llmResp: uiZh ? 'LLM Response · 自然语言' : 'LLM response',
    genPractice: uiZh ? '三次分析 · 生成练习' : 'Generate practice',
    genIng: uiZh ? '③ 正在生成针对性练习...' : '③ Generating practice…',
    practiceTitle: uiZh ? '③ 三次分析 · 个性化练习生成' : '③ Personalized practice',
    restart: uiZh ? '重新体验' : 'Start over',
    foot: uiZh
      ? '模拟数据以展示 MCP → LLM → 练习 的完整链路。接入后所有输出由 LLM 基于真实 MCP 实时数据动态生成。'
      : 'Sample data illustrates MCP → LLM → practice. With a real integration, outputs are generated from live MCP results.',
  };

  return (
    <main className="flex-1">
      <div className="container mx-auto px-6 py-16 md:py-24">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> {ui.back}
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">{ui.title}</h1>
        <p className="text-muted-foreground mb-8 max-w-2xl leading-relaxed">{ui.lead}</p>

        {/* 评测内核切换（与站点语言独立） */}
        <div className="mb-8">
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">{ui.langLabel}</div>
          <div className="inline-flex items-center gap-1 p-1 rounded-full border border-border/60 bg-muted/30">
            {(
              [
                { k: 'en' as Lang, label: 'English', sub: ui.kernEn },
                { k: 'cn' as Lang, label: uiZh ? '中文' : 'Chinese', sub: ui.kernCn },
              ]
            ).map((it) => {
              const active = lang === it.k;
              return (
                <button
                  key={it.k}
                  type="button"
                  onClick={() => switchLang(it.k)}
                  onMouseEnter={() => switchLang(it.k)}
                  onFocus={() => switchLang(it.k)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    active
                      ? 'bg-foreground text-background shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>{it.label}</span>
                  <span className={`ml-2 text-[10px] ${active ? 'text-background/70' : 'text-muted-foreground/70'}`}>
                    · {it.sub}
                  </span>
                </button>
              );
            })}
          </div>
          {lang === 'cn' && (
            <p className="mt-2 text-[11px] text-muted-foreground">{ui.cnNote}</p>
          )}
        </div>

        {/* Question type tabs */}
        <div className="mb-10">
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">{ui.qTypeLabel}</div>
          <div className={`grid gap-2 ${availableTypes.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
            {availableTypes.map((t) => {
              const s = (samplesForLang[t] ?? SAMPLES[t]) as Sample;
              const cardEn = lang === 'cn' && !uiZh ? CN_CARD_EN[t] : undefined;
              const cardLabel = cardEn?.label ?? s.label;
              const cardDesc = cardEn?.desc ?? s.desc;
              const Icon = TAB_ICONS[t];
              const active = t === effectiveQType;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => switchType(t)}
                  onMouseEnter={() => switchType(t)}
                  onFocus={() => switchType(t)}
                  className={`text-left rounded-lg border px-3 py-3 transition-colors ${
                    active
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border/60 hover:border-foreground/40 hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-semibold">{cardLabel}</span>
                  </div>
                  <div className={`text-[11px] ${active ? 'text-background/70' : 'text-muted-foreground'}`}>
                    {cardDesc}
                  </div>
                  <div className={`mt-2 text-[10px] font-mono ${active ? 'text-background/60' : 'text-muted-foreground/60'}`}>
                    {s.apiTag}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-0 mb-8">
          {[
            { label: ui.step1, active: phase !== 'idle' },
            { label: ui.step2, active: ['analysis', 'analyzing', 'generating', 'practice'].includes(phase) },
            { label: ui.step3, active: phase === 'practice' || phase === 'generating' },
          ].map((step, i) => (
            <div key={i} className="flex items-center">
              {i > 0 && (
                <div className={`w-8 md:w-16 h-px transition-colors duration-500 ${step.active ? 'bg-foreground' : 'bg-border'}`} />
              )}
              <div className="flex items-center gap-2">
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-semibold transition-all duration-500 ${
                    step.active ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {i + 1}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:block transition-colors ${
                    step.active ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Text to read */}
        <div className="border border-border/60 rounded-lg p-6 mb-6 bg-background">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              {sample.kind === 'pron' ? ui.readAloud : ui.openQ}
            </p>
            <span className="text-[10px] font-mono text-muted-foreground/70">refText: {sample.apiTag}</span>
          </div>
          <p className="text-lg font-medium leading-relaxed">{sample.refText}</p>
        </div>

        {/* Run button */}
        {phase === 'idle' && (
          <button
            onClick={runAssess}
            className="inline-flex items-center justify-center gap-2 h-12 px-8 text-sm font-medium rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors mb-8"
          >
            <Play className="h-4 w-4" /> {ui.simRun}
          </button>
        )}

        {/* ═══ Recording simulation · 模拟录音动画 ═══ */}
        {phase === 'recording' && (
          <div className="mb-8 rounded-lg border border-rose-500/40 bg-rose-500/5 px-6 py-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-4">
              {/* 脉动麦克风 */}
              <div className="relative h-12 w-12 shrink-0">
                <span className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping" />
                <span className="absolute inset-1 rounded-full bg-rose-500/40 animate-ping [animation-delay:0.3s]" />
                <span className="absolute inset-0 rounded-full bg-rose-500 flex items-center justify-center">
                  <Mic className="h-5 w-5 text-white" />
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                    {ui.rec}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    mic 16kHz / mono · WebSocket streaming
                  </span>
                </div>
                {/* 实时波形 */}
                <div className="flex items-center gap-[3px] h-10">
                  {Array.from({ length: 48 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-full bg-rose-500/70"
                      style={{
                        height: `${(25 + Math.abs(Math.sin(i / 2)) * 70).toFixed(2)}%`,
                        animation: `wave-bar 0.9s ease-in-out ${i * 0.04}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>

              <button
                disabled
                className="inline-flex items-center justify-center gap-2 h-10 px-5 text-sm font-medium rounded-lg border border-rose-500/40 text-rose-600 bg-background cursor-wait shrink-0"
              >
                <Square className="h-3.5 w-3.5 fill-current" /> {ui.recBtn}
              </button>
            </div>
          </div>
        )}

        {phase === 'assessing' && (
          <button
            disabled
            className="inline-flex items-center justify-center gap-2 h-12 px-8 text-sm font-medium rounded-lg bg-foreground text-background opacity-50 cursor-not-allowed mb-8"
          >
            <Loader2 className="h-4 w-4 animate-spin" /> {ui.assessing}
          </button>
        )}

        {/* ═══ Step 1 · Scores ═══ */}
        {(phase === 'scores' ||
          phase === 'analyzing' ||
          phase === 'analysis' ||
          phase === 'generating' ||
          phase === 'practice') && (
          <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border border-border/60 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-border/40 bg-muted/30 flex items-center justify-between">
                <h3 className="text-sm font-semibold">{ui.s1title}</h3>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowRawJson((v) => !v)}
                    className="text-[11px] text-muted-foreground hover:text-foreground font-mono"
                  >
                    {showRawJson ? ui.hideJson : ui.showJson}
                  </button>
                  <span className="text-[10px] text-muted-foreground font-mono">{sample.apiTag}</span>
                </div>
              </div>

              {/* Main scores grid */}
              <div className={`grid grid-cols-2 ${isWordType ? 'sm:grid-cols-3' : 'sm:grid-cols-5'} gap-px bg-border/40`}>
                <AnimatedScore target={sample.overall} label="Overall" sub={ui.subOverall} />
                {sample.kind === 'pron' ? (
                  <>
                    {isWordType ? (
                      <AnimatedScore target={sample.scores.accuracy} label="Pron." sub={ui.subPron} />
                    ) : (
                      <>
                        <AnimatedScore target={sample.scores.accuracy} label="Accuracy" sub={ui.subAcc} />
                        <AnimatedScore target={sample.scores.fluency} label="Fluency" sub={ui.subFlu} />
                        <AnimatedScore target={sample.scores.integrity} label="Integrity" sub={ui.subInt} />
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <AnimatedScore target={sample.scores.pron} label="Pron." sub={ui.subPron} />
                    <AnimatedScore target={sample.scores.grammar} label="Grammar" sub={ui.subGram} />
                    <AnimatedScore target={sample.scores.content} label="Content" sub={ui.subCont} />
                    <AnimatedScore target={sample.scores.fluency} label="Fluency" sub={ui.subFlu2} />
                  </>
                )}
              </div>

              {/* Detail panel */}
              <div className="p-6 border-t border-border/40">
                {sample.kind === 'pron' ? (
                  <DetailsPanel sample={sample} uiZh={uiZh} />
                ) : (
                  <SemiPanel sample={sample} uiZh={uiZh} />
                )}
              </div>

              {/* Raw JSON */}
              {showRawJson && (
                <div className="border-t border-border/40 bg-zinc-950 text-zinc-300">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
                    <span className="text-[11px] text-zinc-500 font-mono">mcp-response.json</span>
                    <CopyButton text={mcpJson} label={ui.copyPrompt} copiedLabel={ui.copied} />
                  </div>
                  <pre className="text-[11px] font-mono p-4 overflow-x-auto max-h-80 leading-relaxed">{mcpJson}</pre>
                </div>
              )}
            </div>

            {phase === 'scores' && (
              <button
                onClick={runAnalysis}
                className="mt-4 inline-flex items-center justify-center gap-2 h-10 px-6 text-sm font-medium rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors"
              >
                <BrainCircuit className="h-4 w-4" /> {ui.analyze}
              </button>
            )}
          </div>
        )}

        {/* ═══ Step 2 · LLM deep analysis ═══ */}
        {phase === 'analyzing' && (
          <div className="mb-6">
            <div className="border border-border/60 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-border/40 bg-muted/30">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> {ui.analyzing}
                </h3>
              </div>
              <div className="p-6">
                <div className="h-4 bg-muted rounded animate-pulse w-3/4 mb-3" />
                <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
              </div>
            </div>
          </div>
        )}

        {(phase === 'analysis' || phase === 'generating' || phase === 'practice') && (
          <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border border-border/60 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-border/40 bg-muted/30 flex items-center justify-between">
                <h3 className="text-sm font-semibold">{ui.repTitle}</h3>
                <span className="text-[10px] text-muted-foreground font-mono">analysis_prompt.md</span>
              </div>

              <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border/40">
                {/* Left: prompt */}
                <div className="bg-zinc-950 text-zinc-300">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="text-emerald-400">●</span>
                      <span className="text-zinc-400">LLM System Prompt</span>
                      <span className="text-zinc-600">/ Skill</span>
                    </div>
                    <CopyButton text={analysisPromptResolved} label={ui.copyPrompt} copiedLabel={ui.copied} />
                  </div>
                  <pre className="text-[11px] font-mono p-4 overflow-auto max-h-[480px] leading-relaxed whitespace-pre-wrap">
                    {sample.analysisPrompt.replace('{mcp_response}', ui.mcpComment)}
                  </pre>
                </div>

                {/* Right: LLM output */}
                <div className="p-5 bg-background">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-3 font-mono">
                    <span className="text-violet-500">●</span>
                    <span>{ui.llmResp}</span>
                  </div>
                  <TypewriterMarkdown text={sample.analysisOutput} />
                </div>
              </div>
            </div>

            {phase === 'analysis' && (
              <button
                onClick={runPractice}
                className="mt-4 inline-flex items-center justify-center gap-2 h-10 px-6 text-sm font-medium rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors"
              >
                <BookOpen className="h-4 w-4" /> {ui.genPractice}
              </button>
            )}
          </div>
        )}

        {/* ═══ Step 3 · Practice generation ═══ */}
        {phase === 'generating' && (
          <div className="mb-6">
            <div className="border border-border/60 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-border/40 bg-muted/30">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> {ui.genIng}
                </h3>
              </div>
              <div className="p-6">
                <div className="h-4 bg-muted rounded animate-pulse w-2/3 mb-3" />
                <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
              </div>
            </div>
          </div>
        )}

        {phase === 'practice' && (
          <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border border-border/60 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-border/40 bg-muted/30 flex items-center justify-between">
                <h3 className="text-sm font-semibold">{ui.practiceTitle}</h3>
                <span className="text-[10px] text-muted-foreground font-mono">practice_prompt.md</span>
              </div>

              <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border/40">
                {/* Left: prompt */}
                <div className="bg-zinc-950 text-zinc-300">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="text-emerald-400">●</span>
                      <span className="text-zinc-400">LLM Prompt · Practice Skill</span>
                    </div>
                    <CopyButton text={sample.practicePrompt} label={ui.copyPrompt} copiedLabel={ui.copied} />
                  </div>
                  <pre className="text-[11px] font-mono p-4 overflow-auto max-h-[480px] leading-relaxed whitespace-pre-wrap">
                    {sample.practicePrompt}
                  </pre>
                </div>

                {/* Right: generated practice */}
                <div className="bg-background divide-y divide-border/40 max-h-[480px] overflow-auto">
                  {sample.practice.map((group, gi) => (
                    <div key={gi} className="p-5">
                      <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                        <span>{group.icon}</span> {group.category}
                      </h4>
                      <div className="space-y-2.5">
                        {group.items.map((ex, ei) => (
                          <div key={ei} className="bg-muted/40 rounded-md p-3">
                            <p className="text-[11px] font-semibold text-muted-foreground mb-1">{ex.label}</p>
                            <p className="text-sm leading-relaxed">{ex.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                onClick={reset}
                className="inline-flex items-center justify-center gap-2 h-10 px-6 text-sm font-medium rounded-lg border border-border/60 hover:bg-muted transition-colors"
              >
                <RotateCcw className="h-4 w-4" /> {ui.restart}
              </button>
              <p className="text-xs text-muted-foreground flex-1 min-w-[200px]">{ui.foot}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
