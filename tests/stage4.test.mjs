/**
 * Stage 4 Tests: Victory Button — JWT Verification Logic
 *
 * Validates the meta-challenge: crafting a JWT with all 3 flags solved.
 * Zero dependencies — uses only node:assert and node:buffer.
 */

import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';

// --- Replicate JWT helpers (same logic as frontend/lib/jwt.ts) ---

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4;
  if (padding) base64 += '='.repeat(4 - padding);
  return Buffer.from(base64, 'base64').toString('utf8');
}

function makeJWT(payload, alg = 'none') {
  const header = base64UrlEncode(JSON.stringify({ alg, typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(payload));
  return `${header}.${body}.`;
}

function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const header = JSON.parse(base64UrlDecode(parts[0]));
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    return { header, payload };
  } catch {
    return null;
  }
}

// --- Replicate verifyVictoryJWT (same logic as VictoryOverlay.tsx) ---

const REQUIRED_STAGES = ['stage1', 'stage2', 'stage3'];

function verifyVictoryJWT(token) {
  try {
    if (!token) return false;
    const decoded = decodeJWT(token);
    if (!decoded?.payload) return false;

    const { flags_solved, solved_stages } = decoded.payload;

    if (flags_solved !== 3) return false;
    if (!Array.isArray(solved_stages)) return false;
    if (solved_stages.length !== 3) return false;

    return REQUIRED_STAGES.every((s) => solved_stages.includes(s));
  } catch {
    return false;
  }
}

// --- Replicate button visibility logic (same as page.tsx gate) ---

function shouldRenderButton(flagsCount) {
  return flagsCount === 3;
}

// ================================================================
// Tests
// ================================================================

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${e.message}`);
  }
}

// --- Button visibility logic ---

console.log('\n=== Button Visibility Logic ===');

test('Button NOT rendered when flagsCount is 0', () => {
  assert.equal(shouldRenderButton(0), false);
});

test('Button NOT rendered when flagsCount is 1', () => {
  assert.equal(shouldRenderButton(1), false);
});

test('Button NOT rendered when flagsCount is 2', () => {
  assert.equal(shouldRenderButton(2), false);
});

test('Button rendered when flagsCount is 3', () => {
  assert.equal(shouldRenderButton(3), true);
});

test('Button NOT rendered when flagsCount is 4 (overflow)', () => {
  assert.equal(shouldRenderButton(4), false);
});

test('Button NOT rendered for non-numeric flagsCount', () => {
  assert.equal(shouldRenderButton('3'), false);
  assert.equal(shouldRenderButton(null), false);
  assert.equal(shouldRenderButton(undefined), false);
});

// --- JWT click verification ---

console.log('\n=== JWT Click Verification ===');

test('Valid JWT with 3 flags and all stages → passes', () => {
  const token = makeJWT({
    flags_solved: 3,
    solved_stages: ['stage1', 'stage2', 'stage3'],
    iat: Date.now(),
    sub: 'ctf_player',
  });
  assert.equal(verifyVictoryJWT(token), true);
});

test('JWT with flags_solved: 3 but missing stage IDs → fails', () => {
  const token = makeJWT({
    flags_solved: 3,
    solved_stages: ['stage1', 'stage2'],
    iat: Date.now(),
    sub: 'ctf_player',
  });
  assert.equal(verifyVictoryJWT(token), false);
});

test('JWT with flags_solved: 2 but 3 stages → fails (count mismatch)', () => {
  const token = makeJWT({
    flags_solved: 2,
    solved_stages: ['stage1', 'stage2', 'stage3'],
    iat: Date.now(),
    sub: 'ctf_player',
  });
  assert.equal(verifyVictoryJWT(token), false);
});

test('JWT with flags_solved: 3 and extra/invalid stage IDs → fails', () => {
  const token = makeJWT({
    flags_solved: 3,
    solved_stages: ['stage1', 'stage2', 'stage4'],
    iat: Date.now(),
    sub: 'ctf_player',
  });
  assert.equal(verifyVictoryJWT(token), false);
});

test('JWT with flags_solved: 3 and 4 stages (extra) → fails', () => {
  const token = makeJWT({
    flags_solved: 3,
    solved_stages: ['stage1', 'stage2', 'stage3', 'stage4'],
    iat: Date.now(),
    sub: 'ctf_player',
  });
  assert.equal(verifyVictoryJWT(token), false);
});

test('Empty JWT string → fails', () => {
  assert.equal(verifyVictoryJWT(''), false);
});

test('Malformed JWT (not base64) → fails', () => {
  assert.equal(verifyVictoryJWT('not.a.jwt'), false);
});

test('JWT with flags_solved: 4 (overflow) → fails', () => {
  const token = makeJWT({
    flags_solved: 4,
    solved_stages: ['stage1', 'stage2', 'stage3'],
    iat: Date.now(),
    sub: 'ctf_player',
  });
  assert.equal(verifyVictoryJWT(token), false);
});

test('No token at all (null/undefined) → fails', () => {
  assert.equal(verifyVictoryJWT(null), false);
  assert.equal(verifyVictoryJWT(undefined), false);
});

test('JWT with flags_solved: 0 → fails', () => {
  const token = makeJWT({
    flags_solved: 0,
    solved_stages: [],
    iat: Date.now(),
    sub: 'ctf_player',
  });
  assert.equal(verifyVictoryJWT(token), false);
});

test('JWT with solved_stages not an array → fails', () => {
  const token = makeJWT({
    flags_solved: 3,
    solved_stages: 'stage1,stage2,stage3',
    iat: Date.now(),
    sub: 'ctf_player',
  });
  assert.equal(verifyVictoryJWT(token), false);
});

test('JWT with no solved_stages field → fails', () => {
  const token = makeJWT({
    flags_solved: 3,
    iat: Date.now(),
    sub: 'ctf_player',
  });
  assert.equal(verifyVictoryJWT(token), false);
});

// --- Programmatic protection ---

console.log('\n=== Programmatic Protection ===');

test('Verification reads from token, not from external count', () => {
  // Even if someone passes a "good" count externally, the token must be valid
  const badToken = makeJWT({
    flags_solved: 1,
    solved_stages: ['stage1'],
    iat: Date.now(),
    sub: 'ctf_player',
  });
  // verifyVictoryJWT only reads from token — no second argument
  assert.equal(verifyVictoryJWT(badToken), false);
});

test('Partial solved_stages (1 stage) → fails even if flags_solved says 3', () => {
  const token = makeJWT({
    flags_solved: 3,
    solved_stages: ['stage1'],
    iat: Date.now(),
    sub: 'ctf_player',
  });
  assert.equal(verifyVictoryJWT(token), false);
});

test('Partial solved_stages (2 stages) → fails even if flags_solved says 3', () => {
  const token = makeJWT({
    flags_solved: 3,
    solved_stages: ['stage1', 'stage3'],
    iat: Date.now(),
    sub: 'ctf_player',
  });
  assert.equal(verifyVictoryJWT(token), false);
});

test('Stages in different order still passes', () => {
  const token = makeJWT({
    flags_solved: 3,
    solved_stages: ['stage3', 'stage1', 'stage2'],
    iat: Date.now(),
    sub: 'ctf_player',
  });
  assert.equal(verifyVictoryJWT(token), true);
});

test('Duplicate stages (3 of the same) → fails', () => {
  const token = makeJWT({
    flags_solved: 3,
    solved_stages: ['stage1', 'stage1', 'stage1'],
    iat: Date.now(),
    sub: 'ctf_player',
  });
  assert.equal(verifyVictoryJWT(token), false);
});

test('flags_solved as string "3" → fails (strict type check)', () => {
  const token = makeJWT({
    flags_solved: '3',
    solved_stages: ['stage1', 'stage2', 'stage3'],
    iat: Date.now(),
    sub: 'ctf_player',
  });
  assert.equal(verifyVictoryJWT(token), false);
});

// --- Summary ---

console.log(`\n=== Stage 4 Results: ${passed}/${total} tests passed ===\n`);

if (passed < total) {
  process.exit(1);
}
