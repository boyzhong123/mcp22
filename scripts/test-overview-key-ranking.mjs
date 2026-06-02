import assert from 'node:assert/strict';
import test from 'node:test';
import { rankActiveKeysThisMonth } from '../src/app/dev-en/_lib/overview-key-ranking.mjs';

test('keeps a zero-call starter key visible in the overview ranking', () => {
  const keys = [
    { id: 'starter', status: 'active', isStarter: true },
    { id: 'production', status: 'active', isStarter: false },
  ];

  const ranked = rankActiveKeysThisMonth(keys, () => 0);

  assert.deepEqual(
    ranked.map(({ key }) => key.id),
    ['starter', 'production'],
  );
});

test('ranks active keys by this-month calls and omits paused keys', () => {
  const keys = [
    { id: 'starter', status: 'active', isStarter: true },
    { id: 'paused', status: 'paused', isStarter: false },
    { id: 'production', status: 'active', isStarter: false },
  ];
  const calls = new Map([
    ['starter', 10],
    ['paused', 999],
    ['production', 20],
  ]);

  const ranked = rankActiveKeysThisMonth(keys, (keyId) => calls.get(keyId) ?? 0);

  assert.deepEqual(
    ranked.map(({ key }) => key.id),
    ['production', 'starter'],
  );
});
