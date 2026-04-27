import type { PronSample, QType } from './demo-sample-types';

/**
 * English copy for Chinese-engine demo samples when UI locale is English (/en).
 * Numeric MCP-shaped data stays in CN_SAMPLES; only coach-facing strings are overridden.
 */
export type CnPronEnPatch = Pick<
  PronSample,
  'analysisPrompt' | 'analysisOutput' | 'practicePrompt' | 'practice'
>;

export const CN_SAMPLES_UI_EN: Partial<Record<QType, CnPronEnPatch>> = {
  word: {
    analysisPrompt: `You are a professional Mandarin speaking coach. Below is word-level evaluation data from the Chivox MCP (cn.word.raw).

## What matters in Chinese evaluation
- Tone errors carry the highest weight — wrong tone can change meaning
- dp_type=mispron often comes from wrong tone, nasal confusion, or retroflex vs alveolar
- Correct pinyin with wrong tone still sounds like a "foreign accent"

## Diagnosis rules
- Check each syllable: pinyin accuracy and tone contour
- For connected syllables, consider 3rd-tone sandhi and 不/一 sandhi
- Give mouth shape, tongue position, and tone gesture cues

## MCP response
\`\`\`json
{mcp_response}
\`\`\``,
    analysisOutput: `The main issue with **独特 (dútè)** is the **2nd tone on 独**:

① **独 dú** (score 60) — tone ú (2nd) is only 45
You pronounced it closer to 3rd tone (dip-rise), sounding like "dǔ". 2nd tone rises from mid level to high,
like the intonation in "huh?" — do not dip first.

② **特 tè** (score 78) — 4th tone è is 72
4th tone falls fast from high to low; your fall is not crisp enough and sounds flat.
Think of a quick fist-strike downward.

🎯 Priority: 2nd tone on 独 > 4th tone on 特`,
    practicePrompt: `From the diagnosis, generate targeted Mandarin word drills. Return JSON.

## Rules
- Tone drills first: four-tone contrast for the syllable (mā má mǎ mà)
- Two common phrases containing each character
- Include minimal pairs where helpful`,
    practice: [
      {
        category: 'Tone drills',
        icon: '🎵',
        items: [
          {
            label: '2nd dú vs 4th',
            content: 'dū / dú / dǔ / dù — repeat and feel the mid-to-high rise on 2nd tone',
          },
          {
            label: '4th tè vs 2nd',
            content: 'tē / té / tě / tè — focus on a crisp high-to-low fall on 4th tone',
          },
        ],
      },
      {
        category: 'Phrase practice',
        icon: '📝',
        items: [
          {
            label: 'Phrases with 独',
            content: '独立 · 独特 · 独自 · 孤独 (all 2nd on 独 — stabilize)',
          },
          {
            label: 'Phrases with 特',
            content: '特别 · 特殊 · 特意 · 模特 (stable 4th on 特)',
          },
        ],
      },
    ],
  },

  sentence: {
    analysisPrompt: `You are a Mandarin speaking coach. Below is sentence-level data from Chivox MCP (cn.sent.raw).

## Sentence-level focus
- Erhua (r-colored vowel): is it one syllable or two?
- Neutral tone (e.g. second 妈 in 妈妈, 子, 头): short and light?
- Tone sandhi: consecutive 3rd tones, 不+4th, 一+1st/2nd/3rd/4th
- Prosodic groups: comma pauses ≤ ~0.3s

## MCP response
\`\`\`json
{mcp_response}
\`\`\``,
    analysisOutput: `Overall **74**. The main issues are **erhua** and **neutral tone**:

【Erhua — highest priority】
⚠ r(erhua) on **马儿** is only 42. You pronounced it as two syllables: 马 (mǎ) + 儿 (ér).
Erhua curls the tail of 马 into one merged syllable (mǎr), one beat only.

【Neutral tone】
⚠ The second **妈** in **妈妈** should be neutral; you used full 1st tone like the first.
Neutral tone is short, light, and unstressed — like a tap on water.

【Rhythm — rhythm 62 is low】
- Pace ≈ 4 chars/s is fine
- Pause before 过/小桥 is too long; 摇啊摇 sounds choppy

【Priority】
1. Erhua on 马儿 — biggest impact on natural Mandarin
2. Neutral tone on 妈妈
3. Linking and rhythm on 摇啊摇`,
    practicePrompt:
      'From the diagnosis, generate Mandarin sentence drills focusing on erhua, neutral tone, and phrase linking. Return JSON.',
    practice: [
      {
        category: 'Erhua',
        icon: '🌀',
        items: [
          {
            label: 'Erhua set',
            content: '马儿 (mǎr) · 花儿 (huār) · 鸟儿 (niǎor) · 小孩儿 (xiǎoháir) · 今儿 (jīnr)',
          },
          {
            label: 'Mouth tip',
            content: 'After the main vowel, curl the tongue toward r in one motion — no pause, no extra breath',
          },
        ],
      },
      {
        category: 'Neutral tone',
        icon: '🪶',
        items: [
          {
            label: 'Reduplication',
            content: '妈妈 · 爸爸 · 哥哥 · 姐姐 · 弟弟 (second syllable neutral)',
          },
          {
            label: 'Sentence-final particles',
            content: '走吧 · 说呢 · 是吗 · 好啊 (light, unstressed endings)',
          },
        ],
      },
      {
        category: 'Chunking',
        icon: '🎵',
        items: [
          {
            label: 'Marked script',
            content:
              '[妈妈骑着马儿] / [过小桥] // [小桥轻轻] / [摇啊摇] (/ = 0.2s, // = 0.4s between clauses)',
          },
        ],
      },
    ],
  },

  paragraph: {
    analysisPrompt: `You are a Mandarin speaking coach. Below is paragraph-level data from Chivox MCP (cn.pred.raw).

## Paragraph focus
- Erhua distribution: 花儿, 鸟儿, etc.
- 不 / 一 sandhi: 不+4th→2nd, 一+4th→2nd, 一+1st/2nd/3rd→4th in common patterns
- Short prosodic groups (often 2–4 characters)
- Overall pace ≈ 4–5 characters per second

## MCP response
\`\`\`json
{mcp_response}
\`\`\``,
    analysisOutput: `Overall **76**. Main issues: **erhua** (38 / 35) and **不** sandhi (55):

【Erhua — systematic】
⚠ **花儿 huār** (38) and **鸟儿 niǎor** (35) were pronounced as 花+儿 / 鸟+儿 as separate syllables.
Erhua is not adding a separate 儿 character — the main vowel tails into a curled /r/ in one syllable.

【Sandhi】
⚠ In **不远处**, 不 before a 4th-tone syllable should be read **bú** (2nd tone), not bù.
Pattern: 不 + 4th tone → 2nd tone on 不 → **bú yuǎn chù**.

【Rhythm — rhythm 66】
- Chunking is stiff; "在草地上奔跑" should flow as one group
- Too long a pause before 挂着灿烂的笑容

【Priority】
1. Erhua (most impact on sounding native)
2. 不 / 一 sandhi rules
3. Smoother phrase linking`,
    practicePrompt: 'From the diagnosis, generate integrated Mandarin paragraph practice. Return JSON.',
    practice: [
      {
        category: 'Erhua',
        icon: '🌀',
        items: [
          {
            label: 'Contrast pairs',
            content: '花 / 花儿 · 鸟 / 鸟儿 · 孩 / 孩儿 · 今天 / 今儿 · 老头 / 老头儿',
          },
          {
            label: 'Full paragraph erhua',
            content:
              'Read the passage with erhua wherever natural: 公园里的花儿都开了… 几只鸟儿在枝头… (natural Beijing-style flow)',
          },
        ],
      },
      {
        category: 'Sandhi',
        icon: '📐',
        items: [
          {
            label: '不',
            content: '不好 (bù hǎo) · 不去 (bú qù) · 不对 (bú duì) · 不错 (bú cuò) — 2nd tone on 不 before 4th tone',
          },
          {
            label: '一',
            content: '一个 (yí gè) · 一次 (yí cì) · 一天 (yì tiān) · 一年 (yì nián) · 一只 (yì zhī)',
          },
        ],
      },
      {
        category: 'Chunking',
        icon: '🎵',
        items: [
          {
            label: 'Marked script',
            content:
              '[春天来了] // [公园里的花儿都开了] // [小朋友们] / [在草地上奔跑] / [脸上挂着灿烂的笑容]',
          },
        ],
      },
    ],
  },
};
