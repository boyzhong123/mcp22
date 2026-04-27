import type { QType, Sample } from './demo-sample-types';

export const SAMPLES_EN: Record<QType, Sample> = {
  word: {
    kind: 'pron',
    label: 'Word',
    desc: 'Word · phoneme-level scoring',
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
    analysisPrompt: `You are a professional English pronunciation coach. Below is word-level exam-grade data from the Chivox MCP API. Use phonemes[].score and dp_type to write a learner-facing phoneme diagnosis.

## Rules
- Group phonemes by dp_type; prioritize mispron
- For each mispron phoneme: common learner error + mouth/tongue fix
- List up to 4 items, weakest to strongest

## Tone
Friendly, concrete, actionable — no empty cheerleading.

## MCP payload
\`\`\`json
{mcp_response}
\`\`\``,
    analysisOutput: `The hardest parts of "particular" are the middle syllable /tɪk/ and the /jʊ/ glide. Fix in this order:

① /ˈtɪ/ (stressed syllable) — scores 40/35. You reduced it toward /tə/, losing stress. Stretch /ɪ/: p-ə-ˈTEE-k-... until the stress lands.

② /jʊ/ — scores 55/48. The tongue does not approach the palate before /ʊ/, so it sounds like /ə/. Compare "use /juːz/" vs "us /ʌs/".

③ First /ə/ — score 60. Jaw is tight; relax it.

🎯 Priority: ˈtɪ > jʊ > ə₁`,
    practicePrompt: `From the diagnosis, generate micro-drills as JSON:

{
  "categories": [
    { "category": "...", "icon": "emoji",
      "items": [ { "label": "...", "content": "..." } ] }
  ]
}

## Rules
- Phoneme drills: 1 minimal pair + 1 tongue twister per mispron phoneme
- Awareness: 1 mouth/tongue self-check
- Whole word: 2–3 real sentences containing the word`,
    practice: [
      {
        category: 'Phoneme drills',
        icon: '🎯',
        items: [
          { label: '/ɪ/ vs /i:/ minimal pairs', content: 'sit / seat · bit / beat · pick / peak (short vowel first, then long)' },
          { label: '/jʊ/ glide', content: 'pure · cure · mature · furious (tongue to palate, then glide)' },
        ],
      },
      {
        category: 'Awareness',
        icon: '🗣️',
        items: [
          { label: 'Stress check', content: 'Mirror-read par-TIC-u-lar; feel the second syllable open widest' },
        ],
      },
      {
        category: 'Whole word',
        icon: '📝',
        items: [
          { label: 'Sentence 1', content: 'Are you looking for anything in particular?' },
          { label: 'Sentence 2', content: 'This particular issue needs our attention.' },
        ],
      },
    ],
  },

  sentence: {
    kind: 'pron',
    label: 'Sentence',
    desc: 'Sentence · word + phoneme level',
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
    analysisPrompt: `You are a professional English pronunciation coach. Below is sentence-level exam-grade data from Chivox MCP. Diagnose using details[].dp_type and phonemes.

## Focus
1. Group by dp_type: mispron / omit / insert
2. For words with score < 70, go to phoneme level
3. Relate rhythm / fluency to pacing

## Output
- Pronunciation · phoneme level: one issue → one fix
- Prosody · stress / intonation from rhythm and weak words
- Priority: one sentence

## Tone
Like a human coach: concrete and actionable.

## MCP payload
\`\`\`json
{mcp_response}
\`\`\``,
    analysisOutput: `🎙️ Overall 72 · integrity 95 (almost full read) · fluency 85 · accuracy 65 (main issue) · rhythm 70.

Pronunciation (phoneme level)
① /ð/ in "the" — often realized as /z/ or /d/. Light bite: tongue tip to lower front teeth, air through the gap.

② /ɒ/ in "fox" — score 45. Open your jaw; it sounds like /ʌ/. Think "ah-oh" transition.

③ /oʊ/ in "over" — start from /o/, not /ə/. Lengthen: "OH-ver".

Prosody
④ Stress on "over" should be on the first syllable; rhythm 70 is dragged down here.
⑤ Declarative sentence: fall on "dog" ↘; your pitch is a bit flat.

🎯 Priority: /ð/ > /ɒ/ > "over" stress. /ð/ is high-frequency — best ROI.`,
    practicePrompt: `From the diagnosis, output practice JSON.

## Rules
- One tongue twister + one minimal pair per mispron phoneme
- One stress-marked shadowing line for prosody
- One timed read challenge at the learner’s WPM`,
    practice: [
      {
        category: 'Phoneme drills',
        icon: '🎯',
        items: [
          {
            label: '/θ /ð/ tongue twister',
            content: 'The thirty-three thieves thought that they thrilled the throne throughout Thursday.',
          },
          { label: '/ɒ/ vs /ʌ/', content: 'fox / fux · cot / cut · pot / putt (wider jaw for /ɒ/)' },
        ],
      },
      {
        category: 'Prosody',
        icon: '🎵',
        items: [
          {
            label: 'Stress-marked shadowing',
            content: "The 'quick 'brown 'fox 'jumps 'OVER the 'lazy 'DOG↘ (CAPS = stress, ↘ fall)",
          },
        ],
      },
      {
        category: 'Challenge',
        icon: '📈',
        items: [
          {
            label: 'Timed read',
            content: 'Read the line in ~3.8s, target ~135 WPM (vs 130 now), keep /ð/ clear',
          },
        ],
      },
    ],
  },

  paragraph: {
    kind: 'pron',
    label: 'Paragraph',
    desc: 'Paragraph · discourse + rhythm',
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
      { char: '', score: 0, dp_type: 'omit' },
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
    analysisPrompt: `You are a professional English pronunciation coach. Below is paragraph-level data from Chivox MCP. Integrate details, dp_type, integrity, and rhythm.

## Focus
- Paragraphs: watch omit/insert — learners often drop function words
- Cluster recurring errors by phoneme family
- rhythm reflects chunking and pauses

## Output
- Completeness: where omitted/inserted and why
- Pronunciation: group similar errors
- Rhythm: chunking quality
- Priority list

## MCP payload
\`\`\`json
{mcp_response}
\`\`\``,
    analysisOutput: `Overall 74 — main tension between accuracy 72 and integrity 86: scattered phoneme issues plus one clear omission.

Completeness
⚠ "along" is missing after "walk" — weak prepositions are often swallowed; dp_type=omit catches this.

Pronunciation (families)
① /θ/: "think", "through" — both weak; tongue not at teeth.
② /e/: "breakfast", "seven", "energized", "whatever" — /e/ toward /æ/ or weak stress.
③ /ɒ/: "coffee" — jaw not open enough.

Rhythm
rhythm 73; commas ~0.3s, periods ~0.5s. Chunk "along the river" as one phrase.

Priority
1) Stabilize /e/ and /ɒ/
2) /θ/ (high frequency)
3) Prepositions inside chunks, not isolated pauses
4) Polish prosody last`,
    practicePrompt: `Generate paragraph drills as JSON.

## Rules
- Chain drills by phoneme family
- Use chunk shadowing for omitted prepositions
- Add record–replay self-check for long texts`,
    practice: [
      {
        category: 'Phoneme families',
        icon: '🎯',
        items: [
          {
            label: '/e/ chain',
            content: 'bed · red · said · breakfast · seven · energy · whatever',
          },
          {
            label: '/θ/ minimal pairs',
            content: 'think / sink · through / true · thin / sin',
          },
          {
            label: '/ɒ/',
            content: 'coffee · office · stop · shop',
          },
        ],
      },
      {
        category: 'Chunking',
        icon: '🎵',
        items: [
          {
            label: 'Chunk map',
            content: '[Every morning] / [I wake up at seven] … // [I walk along the river] / [to the office]',
          },
          {
            label: 'Prepositions',
            content: 'Glue "along the river", "through the day", "by then" — no pause on each word',
          },
        ],
      },
      {
        category: 'Metacognition',
        icon: '🧠',
        items: [
          {
            label: 'Record & replay',
            content: 'Read 3×; each time mark omissions/errors you hear, then compare to MCP details',
          },
        ],
      },
    ],
  },

  semiopen: {
    kind: 'semi',
    label: 'Semi-open',
    desc: 'Semi-open · English only',
    apiTag: 'en.pqan.score',
    refText: 'Topic: Describe your daily morning routine.',
    transcript:
      'Usually I wake up at seven, and then I eat breakfast quickly. After that I walk to work. I like the fresh air in the morning.',
    overall: 71,
    scores: { grammar: 78, content: 62, fluency: 75, pron: 72 },
    speed: 118,
    issues: [
      { level: 'warn', label: 'Thin content', detail: 'Only four ideas (wake, breakfast, walk, air) — no why, feeling, or contrast' },
      { level: 'warn', label: 'Simple syntax', detail: 'All simple SVO; no subordination or richer connectors' },
      { level: 'ok', label: 'Coherence', detail: '"and then", "After that" keep time order clear' },
      { level: 'warn', label: '/θ/ vs /r/', detail: '/r/ in "morning" / "fresh" drifts toward /w/' },
    ],
    analysisPrompt: `You are an IELTS-style speaking coach. Below is semi-open data from Chivox MCP (en.pqan.score): five dimensions + transcript.

## Weights
- grammar 25% · content 30% · fluency 25% · pronunciation 20%

## Output
1. Estimated band (0–100 scale)
2. Main deduction per dimension (quote learner lines)
3. What to add next band — sentence patterns, not fluff

## MCP payload
\`\`\`json
{mcp_response}
\`\`\``,
    analysisOutput: `🎯 Total 71/100 · mid band (late B1 / early B2).

| Dim | Score | Issue |
|-----|-------|-------|
| Content | 62 | Four points only; no why or feeling |
| Fluency | 75 | 118 WPM, many pauses |
| Grammar | 78 | Simple sentences only |
| Pron | 72 | /r/ toward /w/ |

To reach 80+
① Add a reason clause (+grammar)
"I walk to work **because it helps me wake up**, **even though it takes longer**."

② Add feeling (+content)
"...the fresh air, **which makes me feel ready for the day**."

③ Reduce fillers (+fluency)
Replace "and then" with "Once I've had breakfast, I walk to work."`,
    practicePrompt: `Generate targeted practice as JSON.

## Rules
- Grammar: 2–3 clause templates (because / although / once)
- Content: AREA (Answer · Reason · Example · Alternative)
- Pron: only sounds from the diagnosis
- Final: one comparison recording task`,
    practice: [
      {
        category: 'Grammar',
        icon: '📐',
        items: [
          {
            label: 'Clause templates',
            content: 'because / since · although / even though · while / when · which/that — try one per sentence',
          },
        ],
      },
      {
        category: 'Content',
        icon: '💡',
        items: [
          {
            label: 'AREA',
            content: 'Answer → Reason → Example → Alternative; expand each of the four ideas',
          },
        ],
      },
      {
        category: 'Pronunciation',
        icon: '🎯',
        items: [
          { label: '/r/ posture', content: 'red · write · really · refresh — curl tongue, don’t round lips' },
        ],
      },
      {
        category: 'Recording',
        icon: '🎙️',
        items: [
          { label: '60s challenge', content: 'Record ≥60s with ≥2 subordinate clauses and 2× feel/make/because' },
        ],
      },
    ],
  },
};
