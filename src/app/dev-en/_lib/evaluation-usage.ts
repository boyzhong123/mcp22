import type { UsageCoreTypeBreakdown, UsagePoint } from './mock-store';

/**
 * Usage rollups in the point-based vocabulary of the evaluation-points API:
 * dynamic, case-sensitive CoreType buckets (`coreType` is the stable grouping
 * key; `displayName` is display-only) plus the deducted / required /
 * uncovered point triple (`required = deducted + uncovered`).
 */
export type EvaluationUsageBreakdown = {
  calls: number;
  events: number;
  /** Actually deducted points. */
  totalPoints: number;
  requiredPoints: number;
  uncoveredPoints: number;
  /** Per-CoreType totals, largest deduction first. */
  coreTypes: UsageCoreTypeBreakdown[];
};

const EMPTY_USAGE: EvaluationUsageBreakdown = {
  calls: 0,
  events: 0,
  totalPoints: 0,
  requiredPoints: 0,
  uncoveredPoints: 0,
  coreTypes: [],
};

export function emptyEvaluationUsage(): EvaluationUsageBreakdown {
  return { ...EMPTY_USAGE, coreTypes: [] };
}

export function toEvaluationUsage(point: UsagePoint): EvaluationUsageBreakdown {
  const coreTypes = (point.coreTypes ?? []).map((ct) => ({ ...ct }));
  const totalPoints = Math.max(
    0,
    point.evaluationPoints ?? coreTypes.reduce((a, ct) => a + ct.evaluationPoints, 0),
  );
  const uncoveredPoints = Math.max(
    0,
    point.uncoveredPoints ?? coreTypes.reduce((a, ct) => a + ct.uncoveredPoints, 0),
  );
  return {
    calls: Math.max(0, point.calls ?? 0),
    events: Math.max(0, point.events ?? point.calls ?? 0),
    totalPoints,
    uncoveredPoints,
    requiredPoints: Math.max(0, point.requiredPoints ?? totalPoints + uncoveredPoints),
    coreTypes: sortCoreTypes(coreTypes),
  };
}

function sortCoreTypes(list: UsageCoreTypeBreakdown[]): UsageCoreTypeBreakdown[] {
  return [...list].sort((a, b) => b.evaluationPoints - a.evaluationPoints);
}

function mergeCoreTypes(
  into: Map<string, UsageCoreTypeBreakdown>,
  list: UsageCoreTypeBreakdown[],
): void {
  for (const ct of list) {
    // CoreTypes are case-sensitive — `Score` and `score` stay separate.
    const cur = into.get(ct.coreType);
    if (!cur) {
      into.set(ct.coreType, { ...ct });
      continue;
    }
    cur.calls += ct.calls;
    cur.events += ct.events;
    cur.evaluationPoints += ct.evaluationPoints;
    cur.requiredPoints += ct.requiredPoints;
    cur.uncoveredPoints += ct.uncoveredPoints;
  }
}

export function aggregateEvaluationUsage(points: UsagePoint[]): EvaluationUsageBreakdown {
  const coreTypeMap = new Map<string, UsageCoreTypeBreakdown>();
  const total = points.reduce(
    (acc, point) => {
      const usage = toEvaluationUsage(point);
      mergeCoreTypes(coreTypeMap, usage.coreTypes);
      return {
        calls: acc.calls + usage.calls,
        events: acc.events + usage.events,
        totalPoints: acc.totalPoints + usage.totalPoints,
        requiredPoints: acc.requiredPoints + usage.requiredPoints,
        uncoveredPoints: acc.uncoveredPoints + usage.uncoveredPoints,
      };
    },
    { calls: 0, events: 0, totalPoints: 0, requiredPoints: 0, uncoveredPoints: 0 },
  );
  return { ...total, coreTypes: sortCoreTypes([...coreTypeMap.values()]) };
}

export function aggregateEvaluationUsageByKey(
  points: UsagePoint[],
): Map<string, EvaluationUsageBreakdown> {
  const grouped = new Map<string, UsagePoint[]>();
  for (const point of points) {
    const list = grouped.get(point.keyId) ?? [];
    list.push(point);
    grouped.set(point.keyId, list);
  }
  const result = new Map<string, EvaluationUsageBreakdown>();
  for (const [keyId, list] of grouped) {
    result.set(keyId, aggregateEvaluationUsage(list));
  }
  return result;
}
