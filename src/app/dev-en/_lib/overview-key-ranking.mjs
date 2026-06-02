/**
 * @template {{ id: string, status: string }} T
 * @param {T[]} keys
 * @param {(keyId: string) => number} getMonthlyCalls
 * @param {number} [limit]
 * @returns {{ key: T, monthCalls: number }[]}
 */
export function rankActiveKeysThisMonth(keys, getMonthlyCalls, limit = 3) {
  return keys
    .filter((key) => key.status === 'active')
    .map((key) => ({ key, monthCalls: getMonthlyCalls(key.id) }))
    .sort((a, b) => b.monthCalls - a.monthCalls)
    .slice(0, limit);
}
