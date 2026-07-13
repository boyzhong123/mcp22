export type MarketingSection = {
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  /**
   * Optional editorial image for the section block.
   * Layout (cards / spotlight / alternating / mosaic) decides how it is framed.
   * Path is relative to /public. Provide `imageAlt` for accessibility.
   */
  image?: string;
  imageAlt?: string;
};

/**
 * Per-page section composition — keeps the shared page shell but prevents
 * Products + AI Solutions detail pages from reading as six clones of one grid.
 * - cards: equal three-up (Mandarin)
 * - spotlight: large featured lead + two supporting bands (English, Function calling)
 * - alternating: full-width image/copy rows that flip sides (MCP)
 * - mosaic: tall lead + two stacked companions (Kids, AI tutor)
 */
export type MarketingSectionLayout = 'cards' | 'spotlight' | 'alternating' | 'mosaic';

export type MarketingFaq = {
  question: string;
  answer: string;
};

/** Show-not-tell code block: the concrete request/response behind the page's promise. */
export type MarketingPayload = {
  title: string;
  body: string;
  filename: string;
  code: string;
};

/** Per-page visual identity: editorial accent colour + hero artwork. Keeps the
 *  shared template but gives each product/solution page its own look so the
 *  detail pages don't read as one recoloured template. Brand-green CTAs stay put. */
export type MarketingTheme = {
  /** Solid accent for eyebrows, section icons and workflow markers. */
  accent: string;
  /** Translucent accent for icon tiles and soft fills. */
  accentSoft: string;
  hero: {
    src: string;
    alt: string;
    /** Small mono kicker shown over the hero image. */
    kicker: string;
    /** One-line caption shown over the hero image. */
    caption: string;
  };
};

/** Fallback identity — the original emerald + editorial-webp look. */
export const DEFAULT_MARKETING_THEME: MarketingTheme = {
  accent: '#047857',
  accentSoft: 'rgba(16,185,129,0.10)',
  hero: {
    src: '/editorial/speech-assessment-data-dark.webp',
    alt: 'Western learner using Chivox speech assessment with waveform, phoneme scores and pitch evidence',
    kicker: 'Speech → evidence → action',
    caption: 'One assessment layer, structured for product logic and AI reasoning.',
  },
};

/** Default payload — the shared response shape every scoring tool returns (see /docs). */
export const DEFAULT_MARKETING_PAYLOAD: MarketingPayload = {
  title: 'The payload your agent actually gets',
  body: 'Every scoring tool returns the same top-level shape. Three headline numbers you can ship straight to a UI — and details[] with the phoneme-level evidence an LLM can reason over.',
  filename: 'result.json',
  code: `{
  "overall":   85,
  "accuracy":  82,
  "pron":      88,
  "fluency":   { "overall": 78, "speed": 65, "pause": 2 },
  "integrity": 95,
  "details": [
    {
      "char":  "hello",
      "score": 85,
      "phone": [
        { "phoneme": "h",  "score": 90, "dp_type": "normal" },
        { "phoneme": "ɛ",  "score": 82, "dp_type": "normal" },
        { "phoneme": "oʊ", "score": 80, "dp_type": "normal" }
      ]
    }
  ]
}`,
};

export type MarketingPageData = {
  slug: string;
  path: string;
  group: 'Product' | 'AI solution';
  eyebrow: string;
  title: string;
  description: string;
  /** Search-result title; kept separate from the on-page H1. */
  seoTitle: string;
  /** Search-result summary; kept separate from longer page copy. */
  seoDescription: string;
  intro: string;
  outcomes: Array<{ value: string; label: string }>;
  sections: MarketingSection[];
  workflow: string[];
  faq: MarketingFaq[];
  related: Array<{ href: string; label: string; description: string }>;
  /** Optional per-page accent + hero artwork; falls back to DEFAULT_MARKETING_THEME. */
  theme?: MarketingTheme;
  /** Optional page-specific code sample; falls back to DEFAULT_MARKETING_PAYLOAD. */
  payload?: MarketingPayload;
  /** How the three middle sections are composed. Defaults to `cards`. */
  sectionLayout?: MarketingSectionLayout;
};

export const PRODUCT_PAGES: Record<string, MarketingPageData> = {
  'english-speech-assessment': {
    slug: 'english-speech-assessment',
    path: '/products/english-speech-assessment',
    group: 'Product',
    sectionLayout: 'spotlight',
    theme: {
      accent: '#0369a1',
      accentSoft: 'rgba(2,132,199,0.10)',
      hero: {
        src: '/products/hero/english.jpg',
        alt: 'A learner practicing English pronunciation aloud at a laptop',
        kicker: 'Phoneme-level accuracy',
        caption: 'Score pronunciation, fluency and stress down to individual phonemes.',
      },
    },
    eyebrow: 'English speech assessment',
    title: 'English speech assessment and pronunciation scoring for EdTech',
    seoTitle: 'English Speech Assessment & Speech Scoring for EdTech | Chivox AI',
    seoDescription:
      'English speech assessment and scoring for EdTech and AI language tutors, with pronunciation MCP, voice-agent scoring and fluency evaluation by Chivox AI.',
    description:
      'English speech assessment for EdTech and AI language tutors, with pronunciation, fluency, stress, rhythm and phoneme-level scoring from Chivox AI.',
    intro:
      'Turn learner speech into structured feedback that a tutor, coach or voice agent can use immediately. Chivox evaluates the whole utterance and preserves the phoneme-level evidence needed for precise, helpful correction.',
    outcomes: [
      { value: 'Phoneme', label: 'diagnostic detail' },
      { value: 'Word → passage', label: 'assessment range' },
      { value: 'API + MCP', label: 'integration choices' },
    ],
    sections: [
      {
        eyebrow: 'What you can score',
        title: 'Feedback that goes beyond a single percentage',
        body: 'A useful learning experience needs to explain what happened, not merely return a pass or fail.',
        image: '/products/english/score-detail.jpg',
        imageAlt: 'Adult English learner reviewing phoneme-level pronunciation highlights on a laptop',
        points: [
          'Pronunciation accuracy at utterance, word and phoneme level',
          'Fluency, speaking rate, pauses, rhythm and stress signals',
          'Structured error locations for targeted learner feedback',
          'Audio-quality indicators that help separate speech errors from recording issues',
        ],
      },
      {
        eyebrow: 'For product teams',
        title: 'One engine for practice, tutoring and assessment flows',
        body: 'Use the same assessment layer across short drills, guided conversation and longer reading tasks while keeping your product experience consistent.',
        image: '/products/english/product-flows.jpg',
        imageAlt: 'Language product designer comparing drill, tutor and reading practice flows on a large monitor',
        points: [
          'AI language tutors and pronunciation coaches',
          'Reading, speaking and exam-preparation practice',
          'Voice-agent quality checks and conversational feedback',
          'Learner progress views built from stable structured fields',
        ],
      },
      {
        eyebrow: 'Integration',
        title: 'Keep your pedagogy and interface in control',
        body: 'Chivox returns evidence. Your application decides how much feedback to show, when to retry and how an LLM should explain the result.',
        image: '/products/english/integration.jpg',
        imageAlt: 'Product engineer mapping assessment scores to learner-facing coaching cues on a whiteboard and laptop',
        points: [
          'Call through MCP or your existing service workflow',
          'Map scores to your own levels, rubrics and lesson logic',
          'Use the detailed payload for explanations without exposing raw complexity to learners',
          'Add safeguards for low-quality audio and incomplete attempts',
        ],
      },
    ],
    workflow: ['Capture learner speech', 'Assess pronunciation and fluency', 'Return structured evidence', 'Generate product-specific feedback'],
    faq: [
      {
        question: 'Can the assessment support more than isolated words?',
        answer: 'Yes. The product can be designed for word, sentence and longer speaking or reading tasks, with the response depth matched to the activity.',
      },
      {
        question: 'Does the learner have to see every score?',
        answer: 'No. Most products translate the detailed response into a smaller set of age- and task-appropriate coaching cues.',
      },
    ],
    related: [
      { href: '/solutions/ai-language-tutor', label: 'AI language tutor', description: 'Design the feedback loop around the scores.' },
      { href: '/products/mcp-server', label: 'MCP server', description: 'Connect assessment tools to an agent.' },
      { href: '/demo', label: 'Live demo', description: 'See the scoring experience in action.' },
    ],
  },
  'mandarin-chinese-assessment': {
    slug: 'mandarin-chinese-assessment',
    path: '/products/mandarin-chinese-assessment',
    group: 'Product',
    sectionLayout: 'cards',
    theme: {
      accent: '#be123c',
      accentSoft: 'rgba(225,29,72,0.10)',
      hero: {
        src: '/editorial/mandarin-lifestyle-hero.webp',
        alt: 'Western Mandarin learner with headset reviewing tone contours and Pinyin scores for nǐ hǎo',
        kicker: 'Tone → Pinyin → fluency',
        caption: 'Tone-level evidence for every syllable, aligned to Pinyin.',
      },
    },
    eyebrow: 'Mandarin Chinese assessment',
    title: 'Mandarin Chinese pronunciation assessment with tone-level detail',
    seoTitle: 'Mandarin Chinese Pronunciation Assessment & Evaluation MCP | Chivox AI',
    seoDescription:
      'Mandarin Chinese pronunciation assessment and speech evaluation MCP with tonal analysis and Pinyin fluency scoring for voice AI and language education platforms.',
    description:
      'Mandarin Chinese pronunciation assessment for language learning and voice AI, including tone, Pinyin, fluency and pronunciation evaluation from Chivox AI.',
    intro:
      'Assess Mandarin speech with the linguistic detail tonal languages require. Chivox exposes tone, syllable and fluency evidence so applications can explain errors clearly and coach the next attempt.',
    outcomes: [
      { value: 'Tone', label: 'syllable-level evidence' },
      { value: 'Pinyin', label: 'learner-friendly mapping' },
      { value: 'Zh + En', label: 'shared integration' },
    ],
    sections: [
      {
        eyebrow: 'Mandarin depth',
        title: 'Treat tones as meaning-bearing signals',
        body: 'A generic speech score can hide the difference between a segment error and a tone error. The response keeps those signals available for better diagnosis.',
        image: '/products/mandarin/depth.jpg',
        imageAlt: 'A young child practicing the four Mandarin tones of 妈 (mā má mǎ mà) aloud from a tablet',
        points: [
          'Tone-level evidence for each evaluated syllable',
          'Pinyin-aligned detail that is easier to explain to learners',
          'Pronunciation, integrity and fluency signals in one result',
          'Support for short practice and longer reading activities',
        ],
      },
      {
        eyebrow: 'Learning experience',
        title: 'Turn a tonal error into an actionable retry',
        body: 'Use the structured result to highlight the precise syllable, compare the expected contour and prompt a focused second attempt.',
        image: '/products/mandarin/experience.jpg',
        imageAlt: 'A young woman with headphones speaking into her phone to retry a pronunciation exercise',
        points: [
          'Chinese-learning apps and HSK-oriented practice',
          'AI tutors that explain tones in the learner’s preferred language',
          'Reading practice with word- and sentence-level progression',
          'Teacher dashboards that surface recurring problem patterns',
        ],
      },
      {
        eyebrow: 'One payload',
        title: 'Add Mandarin without building a separate agent architecture',
        body: 'English and Mandarin responses follow a consistent product integration model, while preserving the language-specific fields each assessment needs.',
        image: '/products/mandarin/payload.jpg',
        imageAlt: 'A developer integrating a multilingual speech-assessment API, JSON visible in the editor',
        points: [
          'Reuse authentication, limits and observability across languages',
          'Keep one orchestration layer for multilingual tutoring',
          'Route language-specific explanations from structured fields',
          'Test with your own learner audio before production rollout',
        ],
      },
    ],
    workflow: ['Capture Mandarin speech', 'Resolve syllables and tones', 'Return language-specific evidence', 'Coach the next attempt'],
    faq: [
      {
        question: 'Why is tone-level feedback important?',
        answer: 'In Mandarin, tone can change meaning. Keeping tone evidence separate from general pronunciation makes the correction more precise and useful.',
      },
      {
        question: 'Can Mandarin and English live in the same tutor?',
        answer: 'Yes. A shared integration can route each activity to the appropriate assessment while keeping the rest of the agent workflow consistent.',
      },
    ],
    related: [
      { href: '/solutions/ai-language-tutor', label: 'AI language tutor', description: 'Build multilingual coaching experiences.' },
      { href: '/reasoning', label: 'Reasoning engine', description: 'See how an LLM can use detailed evidence.' },
      { href: '/demo', label: 'Live demo', description: 'Try the assessment flow.' },
    ],
    payload: {
      title: 'Tone evidence, not just a transcript',
      body: 'Each syllable carries the expected and detected tone plus a sandhi-aware verdict — so 你好 spoken as (T2, T3) is marked normal, not mispronounced. This is the evidence your tutor explains from.',
      filename: 'result.json · Mandarin',
      code: `{
  "overall": 78,
  "pron":    74,
  "fluency": { "overall": 81, "speed": 72 },
  "details": [
    {
      "char": "你",
      "score": 85,
      "tone_ref": "T3",
      "tone_detected": "T2",
      "dp_type": "normal"
    },
    {
      "char": "好",
      "score": 72,
      "tone_ref": "T3",
      "tone_detected": "T3",
      "dp_type": "normal"
    }
  ]
}`,
    },
  },
  'kids-speech-assessment': {
    slug: 'kids-speech-assessment',
    path: '/products/kids-speech-assessment',
    group: 'Product',
    sectionLayout: 'mosaic',
    theme: {
      accent: '#b45309',
      accentSoft: 'rgba(217,119,6,0.10)',
      hero: {
        src: '/editorial/kids-lifestyle-hero.webp',
        alt: 'Young Western learner practicing pronunciation with headset, phoneme tips and a newly unlocked star',
        kicker: 'Practice → retry → unlock',
        caption: 'Turn structured scores into encouraging, game-like practice loops.',
      },
    },
    eyebrow: 'Kids speech assessment',
    title: 'Kids speech assessment for engaging pronunciation practice',
    seoTitle: 'Kids Speech Assessment API | Pronunciation Practice | Chivox AI',
    seoDescription:
      "Engage young learners with kids speech assessment and pronunciation practice APIs, including real-time feedback for children's language education apps.",
    description:
      'Kids speech assessment API for pronunciation practice, reading and language-learning apps, with real-time structured feedback from Chivox AI.',
    intro:
      'Young voices and young learners need a different product experience. Chivox provides the assessment evidence while your application turns it into encouraging, age-appropriate practice.',
    outcomes: [
      { value: 'Young voices', label: 'product focus' },
      { value: 'Short loops', label: 'retry-friendly practice' },
      { value: 'Structured', label: 'teacher-ready results' },
    ],
    sections: [
      {
        eyebrow: 'Designed for practice',
        title: 'Keep feedback specific without making it discouraging',
        body: 'Detailed scoring can stay behind the scenes while the learner receives a small, clear next step.',
        image: '/products/kids/practice.jpg',
        imageAlt: 'Young child smiling at a tablet after unlocking a star for a pronunciation retry',
        points: [
          'Friendly retry flows for words, sentences and reading activities',
          'Audio-quality checks before blaming the learner’s pronunciation',
          'Configurable feedback thresholds for different ages and levels',
          'Progress signals that teachers and parents can understand',
        ],
      },
      {
        eyebrow: 'Product patterns',
        title: 'Fit assessment into the activity children already enjoy',
        body: 'Use speech assessment as a quiet layer inside stories, games, reading practice and tutor conversations.',
        image: '/products/kids/patterns.jpg',
        imageAlt: 'Child reading aloud from a colorful storybook app with a soft microphone prompt on screen',
        points: [
          'Read-aloud and early literacy products',
          'Game-like pronunciation and vocabulary practice',
          'Conversational tutors with short coaching turns',
          'Classroom practice with teacher-facing summaries',
        ],
      },
      {
        eyebrow: 'Responsible UX',
        title: 'Separate technical confidence from learner-facing judgment',
        body: 'Your product can use confidence and recording-quality signals to decide when to ask for a clean retry instead of presenting an unreliable correction.',
        image: '/products/kids/responsible.jpg',
        imageAlt: 'Parent reviewing a simple progress summary on a tablet while a child practices softly in the background',
        points: [
          'Use neutral retry language for noisy or incomplete recordings',
          'Show one or two priorities instead of every detected issue',
          'Keep raw payloads out of the child-facing interface',
          'Apply your own privacy, consent and retention requirements',
        ],
      },
    ],
    workflow: ['Listen to a short activity', 'Check audio and speech evidence', 'Select the most useful cue', 'Encourage a focused retry'],
    faq: [
      {
        question: 'Does the API decide what a child sees?',
        answer: 'No. It returns assessment evidence. The product team controls the language, thresholds, rewards and amount of feedback shown.',
      },
      {
        question: 'Can it work inside games and stories?',
        answer: 'Yes. The same structured response can drive progress, hints or teacher summaries without interrupting the activity.',
      },
    ],
    related: [
      { href: '/products/english-speech-assessment', label: 'English assessment', description: 'Explore the underlying scoring dimensions.' },
      { href: '/solutions/ai-language-tutor', label: 'AI language tutor', description: 'Plan a helpful coaching loop.' },
      { href: '/faq', label: 'FAQ', description: 'Review integration and privacy questions.' },
    ],
  },
  'mcp-server': {
    slug: 'mcp-server',
    path: '/products/mcp-server',
    group: 'Product',
    sectionLayout: 'alternating',
    theme: {
      accent: '#047857',
      accentSoft: 'rgba(16,185,129,0.10)',
      hero: {
        src: '/products/hero/mcp-server.jpg',
        alt: 'A developer integrating the Chivox assessment MCP at a workstation',
        kicker: 'Structured JSON, agent-ready',
        caption: 'One tool layer returning deterministic scores for any MCP client.',
      },
    },
    eyebrow: 'Speech assessment MCP server',
    title: 'Pronunciation MCP server for voice AI and language agents',
    seoTitle: 'Speech MCP Server – Pronunciation MCP for Voice AI | Chivox AI',
    seoDescription:
      'Integrate the Chivox pronunciation MCP server for real-time speech assessment and pronunciation scoring in MCP clients and voice-AI workflows.',
    description:
      'Connect Chivox speech assessment and pronunciation scoring to voice agents, AI tutors and MCP clients through a structured MCP server workflow.',
    intro:
      'Give an agent access to speech assessment as a tool instead of embedding pronunciation logic in every prompt. The MCP server returns structured evidence your orchestration layer can inspect, explain and act on.',
    outcomes: [
      { value: 'One tool layer', label: 'for agent workflows' },
      { value: 'Zh + En', label: 'assessment coverage' },
      { value: 'Structured JSON', label: 'reasoning-ready output' },
    ],
    sections: [
      {
        eyebrow: 'Agent-native',
        title: 'Make speech assessment callable',
        body: 'The agent selects an assessment tool, supplies the audio and reference context, then receives a result designed for downstream reasoning.',
        image: '/products/mcp/agent-native.jpg',
        imageAlt: 'Developer IDE showing an MCP agent calling a speech-assessment tool and receiving structured scores',
        points: [
          'Use with MCP-compatible clients and custom agent loops',
          'Return pronunciation, fluency and audio-quality evidence together',
          'Keep tool responses deterministic while letting the LLM handle explanation',
          'Reuse one integration across tutoring, coaching and QA scenarios',
        ],
      },
      {
        eyebrow: 'Developer control',
        title: 'Clear responsibilities at every layer',
        body: 'Chivox scores speech, your application enforces product rules, and the LLM turns approved evidence into a useful response.',
        image: '/products/mcp/developer-control.jpg',
        imageAlt: 'Whiteboard sketch of scoring, product rules and LLM explanation layers next to a laptop',
        points: [
          'Validate input and choose the correct language or task mode',
          'Apply score thresholds outside the model prompt',
          'Log tool activity and handle timeouts or low-quality audio',
          'Keep user-facing responses grounded in returned fields',
        ],
      },
      {
        eyebrow: 'From trial to production',
        title: 'Prototype quickly without hiding day-two concerns',
        body: 'The quickstart is intentionally small, while the surrounding runtime covers authentication, usage controls, observability and deployment choices.',
        image: '/products/mcp/production.jpg',
        imageAlt: 'Ops dashboard with API keys, spend limits and latency charts beside a laptop running a quickstart demo',
        points: [
          'Start with the live demo and documented sample payload',
          'Add API keys, spend limits and alerts before broad rollout',
          'Test representative accents, devices and network conditions',
          'Use the runtime guide for operational decisions',
        ],
      },
    ],
    workflow: ['Agent chooses a speech tool', 'Chivox assesses the audio', 'MCP returns structured evidence', 'Agent produces grounded feedback'],
    faq: [
      {
        question: 'Does MCP replace the assessment API?',
        answer: 'MCP is an agent-friendly integration layer around the assessment capability. Teams can choose the integration pattern that best fits their architecture.',
      },
      {
        question: 'Can the result be used by any LLM?',
        answer: 'The response is structured data. Your orchestration layer can pass selected fields to the model or use them in deterministic product logic.',
      },
    ],
    related: [
      { href: '/docs', label: 'Developer docs', description: 'Follow the quickstart and inspect the schema.' },
      { href: '/reasoning', label: 'Reasoning engine', description: 'See how the payload grounds feedback.' },
      { href: '/runtime', label: 'Runtime', description: 'Plan limits, keys and observability.' },
    ],
    payload: {
      title: 'One config block. Every MCP client.',
      body: 'Paste this into Cursor, Claude Desktop or any MCP-compatible agent — no SDK to install. Your LLM immediately sees the assessment tools and starts getting structured scores back.',
      filename: 'mcp.json',
      code: `{
  "mcpServers": {
    "chivox": {
      "command": "npx",
      "args": ["-y", "@chivox/mcp"],
      "env": { "CHIVOX_API_KEY": "sk_live_..." }
    }
  }
}`,
    },
  },
};

export const SOLUTION_PAGES: Record<string, MarketingPageData> = {
  'function-calling': {
    slug: 'function-calling',
    path: '/solutions/function-calling',
    group: 'AI solution',
    // Alternating rows (vs English spotlight / Mandarin cards) — same shell, different rhythm.
    sectionLayout: 'alternating',
    theme: {
      accent: '#6d28d9',
      accentSoft: 'rgba(124,58,237,0.10)',
      hero: {
        src: '/use-cases/voice-v4.jpg',
        alt: 'Voice agent returning an overall and fluency score with a pronunciation tip',
        kicker: 'Typed tool → structured result',
        caption: 'Expose assessment as one reliable function in your agent loop.',
      },
    },
    eyebrow: 'Function calling',
    title: 'Function calling for voice-agent pronunciation scoring',
    seoTitle: 'Function Calling – Voice Agent Pronunciation Scoring | Chivox AI',
    seoDescription:
      'Add function calling for voice-agent pronunciation scoring. Integrate Chivox speech assessment and pronunciation evaluation into LLM agent workflows.',
    description:
      'Add pronunciation assessment and speech scoring to LLM and voice-agent workflows through clear function-calling contracts and structured Chivox AI results.',
    intro:
      'Expose assessment as a well-defined function in your existing agent stack. Keep score calculation deterministic, then let the model explain only the fields and actions your product approves.',
    outcomes: [
      { value: 'Typed inputs', label: 'clear tool contract' },
      { value: 'Structured result', label: 'grounded reasoning' },
      { value: 'Any agent loop', label: 'architecture flexibility' },
    ],
    sections: [
      {
        eyebrow: 'Contract first',
        title: 'Give the model a narrow, reliable tool',
        body: 'A focused function definition helps the agent know when assessment is appropriate and what information it must provide.',
        image: '/solutions/function-calling/contract.jpg',
        imageAlt: 'Clean function-definition panel for assess_speech floating above an agent chat transcript',
        points: [
          'Define language, reference text, task type and audio input clearly',
          'Validate tool arguments before sending an assessment request',
          'Return stable fields instead of prose-only results',
          'Keep scoring and thresholds outside free-form model reasoning',
        ],
      },
      {
        eyebrow: 'Grounded feedback',
        title: 'Let the LLM explain evidence, not invent it',
        body: 'Select the returned words, phonemes, tones or fluency signals that matter, then ask the model to turn them into concise coaching.',
        image: '/solutions/function-calling/grounded.jpg',
        imageAlt: 'Voice-agent UI citing a specific phoneme tip pulled from a structured assessment result',
        points: [
          'Cite the exact problem segment in the user response',
          'Limit advice to the most important one or two corrections',
          'Ask for a retry when audio quality is insufficient',
          'Preserve raw results for analytics without exposing them in the UI',
        ],
      },
      {
        eyebrow: 'Operational safety',
        title: 'Design the failure path before the happy path scales',
        body: 'Production voice agents need explicit behavior for missing audio, unsupported tasks, timeouts and uncertain results.',
        image: '/solutions/function-calling/safety.jpg',
        imageAlt: 'Engineering ops view showing timeout, retry and spend-limit policies for a speech tool',
        points: [
          'Use schema validation and deterministic error handling',
          'Set retry, timeout and spend policies at the application layer',
          'Record tool latency and failure categories',
          'Route sensitive or high-stakes cases to appropriate human review',
        ],
      },
    ],
    workflow: ['Model selects the assessment function', 'Application validates arguments', 'Chivox returns speech evidence', 'Agent explains an approved next step'],
    faq: [
      {
        question: 'How is function calling different from MCP?',
        answer: 'Function calling describes the tool contract inside a particular agent stack. MCP provides a standardized way to expose tools to compatible clients. Both can use the same assessment capability.',
      },
      {
        question: 'Should the model decide pass or fail?',
        answer: 'Product thresholds and high-impact decisions should remain deterministic. The model is best used to explain approved evidence and guide the next interaction.',
      },
    ],
    related: [
      { href: '/products/mcp-server', label: 'MCP server', description: 'Use a standardized agent tool layer.' },
      { href: '/docs', label: 'Developer docs', description: 'Review response fields and integration patterns.' },
      { href: '/runtime', label: 'Runtime', description: 'Add production controls around the tool.' },
    ],
    payload: {
      title: 'One tool call inside your agent loop',
      body: 'The model hands over the audio, gets back structured scores, and explains the result from evidence — numbers it can cite, not vibes it has to invent.',
      filename: 'agent-loop.ts',
      code: `const result = await llm.tool_call("assess_speech", {
  language: "en-US",
  reference_text: "An apple a day.",
  audio_file_path: "./take-01.wav",
});

// → { overall: 85, accuracy: 82, pron: 88,
//     fluency: { overall: 78, speed: 65 },
//     details: [ /* per-word, per-phoneme rows */ ] }`,
    },
  },
  'ai-language-tutor': {
    slug: 'ai-language-tutor',
    path: '/solutions/ai-language-tutor',
    group: 'AI solution',
    sectionLayout: 'mosaic',
    theme: {
      accent: '#0f766e',
      accentSoft: 'rgba(20,184,166,0.10)',
      hero: {
        src: '/products/hero/ai-language-tutor.jpg',
        alt: 'A learner in a friendly online language-tutoring session with headphones and a laptop',
        kicker: 'Listen → diagnose → coach',
        caption: 'Grounded coaching that responds from real speech evidence.',
      },
    },
    eyebrow: 'AI language tutor',
    title: 'Speech scoring for AI language tutors and voice agents',
    seoTitle: 'AI Language Tutor – Voice Agent Pronunciation Assessment | Chivox AI',
    seoDescription:
      'Power AI language tutors with real-time pronunciation MCP and speech scoring, or add real-time pronunciation and speech assessment to voice agents.',
    description:
      'Build AI language tutors and voice agents with real-time pronunciation assessment, structured speech scoring and grounded learner feedback from Chivox AI.',
    intro:
      'A useful AI tutor needs more than transcription. Chivox gives the tutor evidence about how the learner spoke, so the conversation can move from generic encouragement to precise, supportive coaching.',
    outcomes: [
      { value: 'Listen', label: 'capture the attempt' },
      { value: 'Diagnose', label: 'find the priority' },
      { value: 'Coach', label: 'guide the retry' },
    ],
    sections: [
      {
        eyebrow: 'Tutor loop',
        title: 'Keep conversation and assessment in one flow',
        body: 'The learner speaks naturally, the assessment runs behind the interaction, and the tutor responds with a correction tied to actual evidence.',
        image: '/solutions/ai-tutor/tutor-loop.jpg',
        imageAlt: 'Adult learner on a video tutoring call receiving a precise pronunciation tip mid-conversation',
        points: [
          'Use phoneme, word, tone and fluency detail when it is pedagogically useful',
          'Adjust the amount of feedback to the learner’s level and task',
          'Offer a focused retry instead of ending the conversation',
          'Preserve the conversational context around each assessed attempt',
        ],
      },
      {
        eyebrow: 'Learning design',
        title: 'Turn scores into decisions, not dashboards alone',
        body: 'Scores become valuable when they influence the next prompt, example, hint or practice activity.',
        image: '/solutions/ai-tutor/learning-design.jpg',
        imageAlt: 'Tutor interface prioritizing one coaching cue before suggesting the next practice prompt',
        points: [
          'Prioritize repeated or meaning-changing errors',
          'Distinguish recording problems from pronunciation problems',
          'Use short explanations and concrete mouth or sound cues',
          'Track improvement without reducing the learner to one number',
        ],
      },
      {
        eyebrow: 'Product architecture',
        title: 'Keep the tutor flexible and the assessment stable',
        body: 'The assessment response supplies a consistent source of truth while prompts, lesson design and interface copy can evolve independently.',
        image: '/solutions/ai-tutor/architecture.jpg',
        imageAlt: 'Split desk scene with evolving lesson cards on one side and a stable assessment payload panel on the other',
        points: [
          'Use MCP or function calling based on the agent stack',
          'Store only the fields needed for progress and support',
          'Apply product-specific rubrics outside the LLM',
          'Evaluate the complete learner journey before scaling',
        ],
      },
    ],
    workflow: ['Learner speaks in context', 'Assessment identifies useful evidence', 'Tutor selects one teaching priority', 'Learner retries without leaving the flow'],
    faq: [
      {
        question: 'Why not use transcription confidence alone?',
        answer: 'Transcription answers what the system heard. Pronunciation assessment adds evidence about how the utterance was produced, including segmental and fluency detail.',
      },
      {
        question: 'Can the same tutor support English and Mandarin?',
        answer: 'Yes. The orchestration can stay consistent while routing each activity to language-specific assessment and feedback logic.',
      },
    ],
    related: [
      { href: '/products/english-speech-assessment', label: 'English assessment', description: 'Explore pronunciation and fluency evidence.' },
      { href: '/products/mandarin-chinese-assessment', label: 'Mandarin assessment', description: 'Add tone-aware feedback.' },
      { href: '/demo', label: 'Live demo', description: 'Experience the assessment before integrating.' },
    ],
  },
};

export const ALL_MARKETING_PAGES = [...Object.values(PRODUCT_PAGES), ...Object.values(SOLUTION_PAGES)];
