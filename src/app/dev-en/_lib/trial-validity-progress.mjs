/**
 * Percentage of the signup trial window that remains.
 *
 * This is intentionally independent from remaining calls: the quota bar
 * answers "how much can I still use?", while this bar answers "how much
 * time is left?".
 */
export function getTrialValidityRemainingProgress(grantedAt, expiresAt, now = Date.now()) {
  const start = Date.parse(grantedAt);
  const end = Date.parse(expiresAt);
  const current = typeof now === 'number' ? now : Date.parse(now);

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    !Number.isFinite(current) ||
    end <= start
  ) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(((end - current) / (end - start)) * 100)));
}
