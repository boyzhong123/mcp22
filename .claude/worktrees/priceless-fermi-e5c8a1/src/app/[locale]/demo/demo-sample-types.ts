export type Phase =
  | 'idle'
  | 'recording'
  | 'assessing'
  | 'scores'
  | 'analyzing'
  | 'analysis'
  | 'generating'
  | 'practice';

export type QType = 'word' | 'sentence' | 'paragraph' | 'semiopen';
export type Lang = 'en' | 'cn';
export type DpType = 'normal' | 'omit' | 'insert' | 'mispron';

export type Phoneme = { char: string; score: number; dp_type: DpType };
export type WordDetail = { char: string; score: number; dp_type: DpType; phonemes?: Phoneme[] };

export type PronSample = {
  kind: 'pron';
  label: string;
  desc: string;
  apiTag: string;
  refText: string;
  overall: number;
  scores: { accuracy: number; integrity: number; fluency: number; rhythm?: number };
  speed?: number;
  details: WordDetail[];
  analysisPrompt: string;
  analysisOutput: string;
  practicePrompt: string;
  practice: { category: string; icon: string; items: { label: string; content: string }[] }[];
};

export type SemiSample = {
  kind: 'semi';
  label: string;
  desc: string;
  apiTag: string;
  refText: string;
  transcript: string;
  overall: number;
  scores: { grammar: number; content: number; fluency: number; pron: number };
  speed: number;
  issues: { level: 'warn' | 'ok'; label: string; detail: string }[];
  analysisPrompt: string;
  analysisOutput: string;
  practicePrompt: string;
  practice: { category: string; icon: string; items: { label: string; content: string }[] }[];
};

export type Sample = PronSample | SemiSample;
