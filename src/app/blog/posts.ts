export type BlogFigure = {
  src: string;
  alt: string;
  caption?: string;
};

export type BlogSection = {
  heading: string;
  body: string;
  figure?: BlogFigure;
};

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  image: string;
  imageAlt: string;
  intro: string;
  sections: readonly BlogSection[];
  takeaways?: readonly string[];
};

export const BLOG_POSTS: readonly BlogPost[] = [
  {
    slug: 'grounding-voice-agents-with-speech-evidence',
    title: 'Grounding voice agents with structured speech evidence',
    excerpt:
      'Why a transcript alone is not enough—and how phoneme, fluency, and audio-quality signals create better agent decisions.',
    category: 'Voice AI',
    date: 'July 10, 2026',
    image: '/blog/banners/speech-evidence-v2.jpg',
    imageAlt: 'Editorial cover: Grounding voice agents with speech evidence',
    intro:
      'A transcript tells an agent what was said. Structured speech evidence helps it understand how it was said, where communication broke down, and what to do next. That difference matters the moment a product stops demoing and starts coaching real learners.',
    sections: [
      {
        heading: 'The transcript is only one layer',
        body: `Two speakers can produce the same transcript while creating very different listening experiences. One may be clear and confident. The other may be hesitant, clipped, noisy, or phonetically unstable in ways that still pass automatic speech recognition.

Pronunciation confidence, pauses, rhythm, background noise, and clipping all affect whether an agent should confirm, coach, retry, or continue. If your workflow only passes text into the model, those signals disappear before the decision begins.

Treat the transcript as necessary context, not as the full speech record.`,
        figure: {
          src: '/blog/figures/speech-evidence-layers.jpg',
          alt: 'Side-by-side comparison of transcript text versus speech evidence fields',
          caption: 'Same words, different listening experiences—evidence fills the gap a transcript leaves open.',
        },
      },
      {
        heading: 'Give the model inspectable evidence',
        body: `Instead of asking an LLM to infer speech quality from text, pass a compact set of typed fields: overall scores, word and phoneme details, fluency events, and audio-quality flags. The model can then explain a decision using evidence your team can inspect.

A useful payload is small enough to fit in a tool result, but rich enough to answer three questions: Was the attempt valid? Where did it fail? What should happen next?

Keep the schema stable across products. Agents improve faster when the same phoneme, fluency, and quality fields appear in every coaching loop.`,
      },
      {
        heading: 'Design the action before the explanation',
        body: `Start with the product action you need—accept, clarify, coach, or escalate—then define the minimum evidence required to support it. This keeps prompts shorter and prevents a rich payload from becoming an unstructured data dump.

For example, a placement flow may only need overall accuracy and audio validity. A tutor loop may need the top failing phoneme and one fluency event. A certification path may need a stricter threshold plus a human review flag.

When the action is clear, the explanation becomes a supporting layer rather than the main product.`,
        figure: {
          src: '/blog/figures/speech-evidence-actions.jpg',
          alt: 'Four action chips Accept Clarify Coach Escalate mapped to evidence needs',
          caption: 'Decide the product action first. Then choose the smallest evidence set that can support it.',
        },
      },
      {
        heading: 'Separate validity from performance',
        body: `Many failed turns are not pronunciation problems. The mic was too quiet. The speaker cut off early. Background noise made the attempt unusable. Those cases need a retry, not a coaching monologue.

Put audio-quality gates ahead of pedagogical logic. If the attempt is invalid, ask for a cleaner recording. If it is valid but weak, coach. If it is valid and strong enough, continue.

This single separation removes a large class of confusing agent behavior.`,
      },
      {
        heading: 'Make evidence reusable across surfaces',
        body: `The same speech result can power the learner UI, the teacher dashboard, analytics, and the agent prompt. Do not ask the model to invent a second version of the score for each surface.

Show learners a focused next step. Show teachers the full evidence. Let agents cite the same underlying fields. That keeps product language consistent and makes support conversations much easier to resolve.`,
      },
    ],
    takeaways: [
      'Pass typed speech fields into the agent, not only the transcript.',
      'Decide the product action first, then select the minimum evidence required.',
      'Gate on audio validity before coaching on pronunciation.',
    ],
  },
  {
    slug: 'production-checklist-for-speech-apis',
    title: 'A production checklist for speech assessment APIs',
    excerpt:
      'Keys, limits, privacy, observability, and fallback behavior to settle before real learners arrive.',
    category: 'Engineering',
    date: 'July 3, 2026',
    image: '/blog/banners/production-checklist-v2.jpg',
    imageAlt: 'Editorial cover: A production checklist for speech APIs',
    intro:
      'The first successful request proves the integration works. Production readiness begins with everything that happens around that request: ownership, budgets, privacy, observability, and what the learner sees when something fails.',
    sections: [
      {
        heading: 'Separate environments and responsibilities',
        body: `Use different keys for development, staging, and production. Assign an owner for rotation, usage review, and incident response so operational questions have a clear answer before launch.

Document who can create keys, who can raise spend limits, and who gets paged when error rates climb. Speech assessment often sits between product, curriculum, and platform teams; unclear ownership shows up first as slow incident response.`,
        figure: {
          src: '/blog/figures/production-keys.jpg',
          alt: 'Three environment key rows for development staging and production',
          caption: 'Separate keys by environment before traffic arrives—ownership should be equally clear.',
        },
      },
      {
        heading: 'Make limits visible early',
        body: `Track latency, error rate, point consumption, and retry volume from the first pilot. Alerts should describe the user impact and the next action—not simply announce that a threshold was crossed.

A useful alert sounds like: “Learner retries are up 40% because quiet-audio failures increased.” A weak alert only says: “Usage exceeded 80%.”

Surface budgets in the same place teams already work. If product managers cannot see spend, they cannot plan content volume.`,
      },
      {
        heading: 'Plan a graceful fallback',
        body: `Decide what the learner sees when audio is too quiet, a request times out, or a quota is reached. A focused retry message is usually more useful than a generic failure screen.

Map each failure class to one product response:
- invalid audio → ask for a clearer recording
- transient timeout → retry once, then offer save-and-continue
- quota or auth failure → stop gracefully and route to support or billing

Do not leave these decisions to an improvised LLM apology.`,
        figure: {
          src: '/blog/figures/production-fallback.jpg',
          alt: 'Learner retry card for quiet audio with a clear next action',
          caption: 'Failure copy is product design. Quiet audio needs a retry, not a coaching monologue.',
        },
      },
      {
        heading: 'Treat privacy as a release requirement',
        body: `Speech audio is sensitive. Decide retention by default, not as a late legal review. Prefer short-lived processing, explicit retention windows, and clear answers for support and compliance teams.

If your product stores audio for teacher review, say so. If it does not, make that the default path and document how debugging works without permanent recordings.`,
      },
      {
        heading: 'Prove the launch path with a dry run',
        body: `Before opening the feature, run a production-like checklist: rotate a staging key, trip a spend alert, force a quiet-audio failure, and confirm the learner message. Then verify that dashboards, logs, and ownership all point to the same incident story.

Production speech integrations fail less often from model quality than from missing operational rehearsal.`,
      },
    ],
    takeaways: [
      'Separate keys, owners, and environments before traffic arrives.',
      'Alert on learner impact, not only raw usage thresholds.',
      'Rehearse quiet audio, timeouts, and quota failures as launch criteria.',
    ],
  },
  {
    slug: 'mandarin-tone-feedback-that-learners-can-use',
    title: 'Mandarin tone feedback that learners can actually use',
    excerpt:
      'Turn tone and Pinyin evidence into one focused retry instead of a wall of corrections.',
    category: 'Learning design',
    date: 'June 25, 2026',
    image: '/blog/banners/mandarin-tone-v2.jpg',
    imageAlt: 'Editorial cover: Mandarin tone feedback learners can actually use',
    intro:
      'Detailed scoring is valuable to a product team, but a learner needs a clear next move. Good feedback translates tone and Pinyin evidence into a small, achievable correction—then gives an immediate chance to try again.',
    sections: [
      {
        heading: 'Choose one teaching priority',
        body: `When several syllables need work, prioritize the error that most changes meaning or most often repeats. This reduces cognitive load and makes the next attempt measurable.

A learner who hears five corrections at once usually improves none of them. A learner who hears “make the third tone fall-rise clearer on 买” has a concrete target.

Curriculum designers should define priority rules up front so the product does not improvise a new pedagogy on every turn.`,
        figure: {
          src: '/blog/figures/mandarin-priority.jpg',
          alt: 'One highlighted syllable priority among a short sentence',
          caption: 'One priority correction beats a full error dump—especially for tones that change meaning.',
        },
      },
      {
        heading: 'Show the contour, then let them retry',
        body: `A short model, a simple tone cue, and an immediate recording opportunity work better together than a long explanation. Keep the feedback close to the action.

Visual tone contours help because learners can compare shape, not only labels. Pair the contour with one spoken model and one retry button. Anything else can wait for the teacher view or a later review screen.`,
        figure: {
          src: '/blog/figures/mandarin-contour.jpg',
          alt: 'Rising-falling tone contour with model and retry controls',
          caption: 'Contour + model + retry. Keep the feedback loop close to the recording action.',
        },
      },
      {
        heading: 'Preserve the evidence for teachers',
        body: `Learners can see a focused prompt while teachers and product teams retain the full tone, fluency, and pronunciation record for progress tracking.

This split is intentional. The learner interface optimizes for momentum. The teacher interface optimizes for diagnosis. Both should read from the same assessment result so progress reports stay trustworthy.`,
      },
      {
        heading: 'Measure improvement on the same syllable',
        body: `After coaching, ask for the same target again before returning to free conversation. If the tone improves, acknowledge it briefly and move on. If it does not, change the drill rather than repeating the same sentence with the same vague advice.

Closing the loop on one syllable teaches the learner that practice has a measurable effect.`,
      },
      {
        heading: 'Avoid over-correcting fluent speech',
        body: `Not every detectable tone deviation deserves interruption. In communicative practice, interrupt only when meaning is at risk or when the error matches the lesson objective.

Assessment engines can surface many signals. Learning products still need judgment about when silence is the better coach.`,
      },
    ],
    takeaways: [
      'One priority correction beats a full error dump.',
      'Pair tone contour + model audio + immediate retry.',
      'Keep learner feedback narrow and teacher evidence complete.',
    ],
  },
  {
    slug: 'building-a-grounded-ai-language-tutor-loop',
    title: 'Building a grounded AI language tutor loop',
    excerpt:
      'A practical pattern for moving from learner audio to explanation, targeted practice, and a measurable retry.',
    category: 'Product pattern',
    date: 'June 18, 2026',
    image: '/blog/banners/tutor-loop-v2.jpg',
    imageAlt: 'Editorial cover: Building a grounded AI tutor loop',
    intro:
      'The most useful language tutors do more than chat. They listen, identify a specific issue, explain it at the right level, and create a chance to improve immediately. That loop only works when speech evidence stays outside the prompt and inside a reliable tool result.',
    sections: [
      {
        heading: 'Keep assessment outside the prompt',
        body: `Use a dedicated speech assessment tool to produce stable evidence. Let the language model decide how to communicate that evidence, not invent the evidence itself.

When the model both “hears” and coaches from the same free-form turn, scores drift and explanations become hard to audit. A tool call restores a clean boundary: assessment produces fields, the tutor turns those fields into teaching language.`,
        figure: {
          src: '/blog/figures/tutor-boundary.jpg',
          alt: 'Assessment tool feeding typed fields into a tutor response',
          caption: 'Assessment tools produce evidence. Models produce teaching language—not the other way around.',
        },
      },
      {
        heading: 'Generate narrow practice',
        body: `Practice should isolate the target sound, stress pattern, or tone before returning to the original sentence. A narrow drill makes improvement easier to hear and measure.

Good loops often look like:
1. assess the original utterance
2. select one priority issue
3. explain briefly
4. run a focused drill
5. reassess with the same metric

Skipping the narrow drill is why many chat tutors feel helpful in the moment and weak over a week.`,
      },
      {
        heading: 'Close the loop with the same measure',
        body: `Score the retry using the same fields that triggered the coaching. The tutor can then acknowledge a real improvement or adjust the next exercise without guessing.

If the first turn failed on a rising tone, the success condition should still be that rising tone. Changing the rubric mid-loop makes the learner feel progress is arbitrary.`,
        figure: {
          src: '/blog/figures/tutor-retry-delta.jpg',
          alt: 'Before and after score chips on the same pronunciation metric',
          caption: 'Reassess with the same metric that triggered coaching. Progress should be measurable, not improvised.',
        },
      },
      {
        heading: 'Keep the tutor voice consistent',
        body: `Tone matters. The same product should not sound like a strict examiner on one turn and an overly cheerful companion on the next. Define a short style guide for praise, correction, and escalation.

Use speech evidence to choose intensity. Mild issues get a light nudge. Repeated meaning-breaking errors get a clearer intervention. Invalid audio gets a practical retry request, not a personality performance.`,
      },
      {
        heading: 'Log the loop for product learning',
        body: `Store the sequence of assess → coach → drill → reassess events. Over time you will see which explanations actually improve retries, which drills stall, and where learners abandon the session.

That product telemetry is more valuable than another prompt rewrite. It tells you whether the loop works as a learning system.`,
      },
    ],
    takeaways: [
      'Assessment tools produce evidence; models produce teaching language.',
      'Always include a narrow drill before returning to free conversation.',
      'Reassess with the same metric that triggered coaching.',
    ],
  },
  {
    slug: 'function-calling-for-predictable-speech-tools',
    title: 'Function calling for predictable speech tools',
    excerpt:
      'How typed inputs and inspectable outputs make speech capabilities easier to place inside an agent workflow.',
    category: 'Integration',
    date: 'June 9, 2026',
    image: '/blog/banners/function-calling-v2.jpg',
    imageAlt: 'Editorial cover: Function calling for predictable speech tools',
    intro:
      'Speech assessment becomes easier to operate when the agent invokes it through a clear contract rather than relying on prompt conventions alone. Function calling turns listening into a tool with typed inputs, inspectable outputs, and predictable failure modes.',
    sections: [
      {
        heading: 'Keep the contract small',
        body: `Expose only the inputs the agent can reliably provide, such as audio, reference text, language, and assessment mode. Defaults should be explicit and safe.

Every optional field is a chance for the agent to invent a value. Prefer a short contract with strong defaults over a flexible contract that needs constant prompt policing.`,
        figure: {
          src: '/blog/figures/function-contract.jpg',
          alt: 'Small typed function inputs for audio language and mode',
          caption: 'A small contract with strong defaults beats a flexible schema the agent can misuse.',
        },
      },
      {
        heading: 'Return fields that support a decision',
        body: `A useful response combines a concise summary with evidence the agent can cite. Avoid forcing the model to reconstruct basic meaning from a deeply nested payload every time.

Include:
- overall scores
- top issues
- validity flags
- a short machine-readable reason code

Then let the agent write the learner-facing explanation from those fields.`,
      },
      {
        heading: 'Treat retries as product behavior',
        body: `Define which failures are safe to retry and which require new user input. That policy belongs in the workflow, not in an improvised error prompt.

Network timeouts may be safe to retry once. Empty audio is not. Quota exhaustion is not. Distinguishing those cases in the tool result keeps agents from looping endlessly or blaming the learner for infrastructure problems.`,
        figure: {
          src: '/blog/figures/function-retry-policy.jpg',
          alt: 'Retry policy matrix for timeout empty-audio and quota failures',
          caption: 'Encode retry policy in the workflow. Not every failure should bounce back to the learner.',
        },
      },
      {
        heading: 'Version the tool like an API',
        body: `Agents accumulate prompts, evaluations, and downstream parsers around a tool schema. Changing field names casually breaks more than documentation.

Version the function, publish example payloads, and keep a compatibility window. Speech tools deserve the same discipline as billing or auth APIs because they sit on the critical path of the conversation.`,
      },
      {
        heading: 'Test the tool independently of the chat',
        body: `Before trusting an agent demo, validate the speech tool with fixed audio fixtures. Confirm score ranges, failure codes, and latency under expected load.

Once the tool is stable, evaluate the agent’s use of it. Mixing both layers in one test makes regressions hard to attribute.`,
      },
    ],
    takeaways: [
      'Prefer a small typed contract with strong defaults.',
      'Return decision-ready fields, not only raw nested detail.',
      'Encode retry policy in the workflow, not in free-form prompts.',
    ],
  },
  {
    slug: 'questions-to-answer-before-adding-speech-assessment',
    title: 'Seven questions to answer before adding speech assessment',
    excerpt:
      'A short alignment guide for product, curriculum, engineering, and procurement teams.',
    category: 'Planning',
    date: 'May 29, 2026',
    image: '/blog/banners/planning-questions-v2.jpg',
    imageAlt: 'Editorial cover: Seven questions before adding speech assessment',
    intro:
      'The best integration plan starts with the learner experience and works backward to technical requirements, measurement, and operations. These seven questions help product, curriculum, engineering, and procurement teams align before the first sprint.',
    sections: [
      {
        heading: 'What decision will the score support?',
        body: `Be specific about whether the product is coaching, placing, certifying, or simply encouraging practice. Each use case needs a different feedback threshold and level of explanation.

A practice product can tolerate softer signals and frequent retries. A placement or certification product needs clearer thresholds, auditability, and escalation paths.`,
        figure: {
          src: '/blog/figures/planning-decisions.jpg',
          alt: 'Four score-use cases coaching placement certification practice',
          caption: 'Name the decision first. Coaching, placement, and certification need different evidence thresholds.',
        },
      },
      {
        heading: 'Which evidence must be visible?',
        body: `Decide what learners, teachers, support teams, and internal analysts each need to see. One response can support several views without showing everyone the same complexity.

If teachers need phoneme detail and learners only need one next tip, design both views from the start. Retrofitting evidence visibility later usually means reworking storage and UI together.`,
      },
      {
        heading: 'How will you evaluate the pilot?',
        body: `Choose a small set of experience and system metrics before launch: completion, retry rate, teacher agreement, latency, and failure recovery are useful starting points.

Write the success criteria down. Otherwise the pilot ends with anecdotes instead of a ship decision.`,
        figure: {
          src: '/blog/figures/planning-pilot.jpg',
          alt: 'Pilot success metrics strip with completion retry and latency',
          caption: 'Write pilot success criteria before launch, or the review becomes a pile of anecdotes.',
        },
      },
      {
        heading: 'What languages and task types matter first?',
        body: `Do not launch on “speech” in the abstract. Name the first language pair, the first task type, and the first learner segment.

Word reading, sentence read-aloud, open response, and conversational turns create different product and assessment requirements. A narrow first slice ships faster and teaches more.`,
      },
      {
        heading: 'Who owns the operating model?',
        body: `Speech features create ongoing work: key management, spend review, content QA, teacher training, and support macros. Assign owners before procurement closes.

If nobody owns the operating model, the integration becomes a demo that quietly degrades after launch.`,
      },
      {
        heading: 'What happens when audio is bad?',
        body: `Quiet rooms, shared devices, and rushed recordings are normal. Define the learner message and the retry policy before engineering starts.

Products that ignore invalid-audio handling create false coaching and unnecessary distrust in the score.`,
      },
      {
        heading: 'What is the minimum lovable loop?',
        body: `Pick the smallest loop that feels valuable: record, score, explain one issue, retry once. Expand only after that loop is reliable.

Many speech roadmaps stall because the first release tries to solve assessment, tutoring, reporting, and certification at the same time.`,
      },
    ],
    takeaways: [
      'Align on the decision the score must support before choosing a vendor.',
      'Define learner, teacher, and ops views of evidence up front.',
      'Ship one reliable loop before expanding languages and task types.',
    ],
  },
] as const;

export function getBlogPost(slug: string) {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
