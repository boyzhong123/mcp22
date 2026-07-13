import {
  PARAGRAPH_POINTS_PER_USE,
  WORD_SENTENCE_POINTS_PER_USE,
} from './topup';
import type { UsagePoint } from './mock-store';

export type EvaluationUsageBreakdown = {
  calls: number;
  wordSentenceCalls: number;
  paragraphCalls: number;
  wordSentencePoints: number;
  paragraphPoints: number;
  totalPoints: number;
};

const EMPTY_USAGE: EvaluationUsageBreakdown = {
  calls: 0,
  wordSentenceCalls: 0,
  paragraphCalls: 0,
  wordSentencePoints: 0,
  paragraphPoints: 0,
  totalPoints: 0,
};

/**
 * Normalise a usage record into the point-based product vocabulary. The split
 * fields are optional for backward compatibility while the backend rolls out
 * the richer usage contract; old records are treated as word/sentence calls.
 */
export function toEvaluationUsage(point: UsagePoint): EvaluationUsageBreakdown {
  const calls = Math.max(0, point.calls ?? 0);
  const paragraphCalls = Math.max(0, point.paragraphCalls ?? 0);
  const wordSentenceCalls = Math.max(
    0,
    point.wordSentenceCalls ?? Math.max(0, calls - paragraphCalls),
  );
  const normalisedCalls = wordSentenceCalls + paragraphCalls;
  const wordSentencePoints = Math.max(
    0,
    point.wordSentencePoints ?? wordSentenceCalls * WORD_SENTENCE_POINTS_PER_USE,
  );
  const paragraphPoints = Math.max(
    0,
    point.paragraphPoints ?? paragraphCalls * PARAGRAPH_POINTS_PER_USE,
  );
  return {
    calls: normalisedCalls,
    wordSentenceCalls,
    paragraphCalls,
    wordSentencePoints,
    paragraphPoints,
    totalPoints: Math.max(0, point.evaluationPoints ?? wordSentencePoints + paragraphPoints),
  };
}

export function aggregateEvaluationUsage(points: UsagePoint[]): EvaluationUsageBreakdown {
  return points.reduce<EvaluationUsageBreakdown>((total, point) => {
    const usage = toEvaluationUsage(point);
    return {
      calls: total.calls + usage.calls,
      wordSentenceCalls: total.wordSentenceCalls + usage.wordSentenceCalls,
      paragraphCalls: total.paragraphCalls + usage.paragraphCalls,
      wordSentencePoints: total.wordSentencePoints + usage.wordSentencePoints,
      paragraphPoints: total.paragraphPoints + usage.paragraphPoints,
      totalPoints: total.totalPoints + usage.totalPoints,
    };
  }, EMPTY_USAGE);
}

export function aggregateEvaluationUsageByKey(points: UsagePoint[]): Map<string, EvaluationUsageBreakdown> {
  const result = new Map<string, EvaluationUsageBreakdown>();
  for (const point of points) {
    const current = result.get(point.keyId) ?? { ...EMPTY_USAGE };
    const usage = toEvaluationUsage(point);
    result.set(point.keyId, {
      calls: current.calls + usage.calls,
      wordSentenceCalls: current.wordSentenceCalls + usage.wordSentenceCalls,
      paragraphCalls: current.paragraphCalls + usage.paragraphCalls,
      wordSentencePoints: current.wordSentencePoints + usage.wordSentencePoints,
      paragraphPoints: current.paragraphPoints + usage.paragraphPoints,
      totalPoints: current.totalPoints + usage.totalPoints,
    });
  }
  return result;
}
