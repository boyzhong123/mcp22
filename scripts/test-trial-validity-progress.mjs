import assert from 'node:assert/strict';
import test from 'node:test';
import { getTrialValidityRemainingProgress } from '../src/app/dev-en/_lib/trial-validity-progress.mjs';

const grantedAt = '2026-06-02T00:00:00.000Z';
const expiresAt = '2026-07-02T00:00:00.000Z';

test('reports remaining trial-window progress between signup and expiry', () => {
  assert.equal(
    getTrialValidityRemainingProgress(grantedAt, expiresAt, '2026-06-17T00:00:00.000Z'),
    50,
  );
});

test('starts full before signup and empties after expiry', () => {
  assert.equal(
    getTrialValidityRemainingProgress(grantedAt, expiresAt, '2026-05-01T00:00:00.000Z'),
    100,
  );
  assert.equal(
    getTrialValidityRemainingProgress(grantedAt, expiresAt, '2026-08-01T00:00:00.000Z'),
    0,
  );
});

test('returns zero for invalid trial windows', () => {
  assert.equal(getTrialValidityRemainingProgress('invalid', expiresAt, grantedAt), 0);
  assert.equal(getTrialValidityRemainingProgress(expiresAt, grantedAt, grantedAt), 0);
});
