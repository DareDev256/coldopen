import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertGroundAllowed, assertOneHue, liftAccentForGround, hsl, BannedGroundError, contrastRatio, auditWorld, type World } from '../src/world.ts';
import { Ledger, UnsourcedFactError } from '../src/ledger.ts';
import { assertDivergent, type PremiseDraft } from '../src/premise.ts';
import { tagBalance, assertBalancePreserved, applyPatch, PatchRefused } from '../src/update.ts';

/* ---------- the cream ban ---------- */

test('bans every named cream from CLAUDE.md', () => {
  for (const hex of ['#F7F1E7', '#FAF6EF', '#F8F2E5', '#F4F3E7', '#F6F1E4', '#FDFBF7']) {
    assert.throws(() => assertGroundAllowed(hex), BannedGroundError, `${hex} should be banned`);
  }
});

test('bans creams NOT on the list — the shape test, not the name list', () => {
  // one channel nudged off every banned hex; a name-list-only guard lets these through
  for (const hex of ['#F9F3E9', '#FCF8F0', '#F5EFE3', '#FAF5EA', '#F7F2E8']) {
    assert.throws(() => assertGroundAllowed(hex), BannedGroundError, `${hex} evaded the shape test`);
  }
});

test("bans cream's partner palette (sage, taupe, warm charcoal-brown)", () => {
  for (const hex of ['#A8A48C', '#8C8574', '#B5AE9A', '#6E6555']) {
    assert.throws(() => assertGroundAllowed(hex), BannedGroundError, `${hex} should be banned`);
  }
});

test('allows white, true black, and saturated grounds', () => {
  for (const hex of ['#FFFFFF', '#000000', '#05090C', '#E23B2E', '#1B2FE8', '#0B3D2E']) {
    assert.doesNotThrow(() => assertGroundAllowed(hex), `${hex} should be allowed`);
  }
});

test('cool near-whites are NOT banned — the ban is on WARM off-white', () => {
  for (const hex of ['#F4F7FA', '#F2F4F8']) assert.doesNotThrow(() => assertGroundAllowed(hex));
});

test('brand exemption must be stated out loud', () => {
  assert.throws(() => assertGroundAllowed('#F7F1E7'));
  assert.doesNotThrow(() => assertGroundAllowed('#F7F1E7', { brandExemption: "client's existing brand is built on it" }));
});

test('a grey accent on a grey ground is not a hue', () => {
  assert.throws(() => assertOneHue('#0A0A0A', '#8A8A8A'));
  assert.throws(() => assertOneHue('#101214', '#7C7F84'));
  assert.doesNotThrow(() => assertOneHue('#0A0A0A', '#3FD8FF'));
});

test('a near-neutral accent is CORRECT when the ground is the loud hue', () => {
  // on vermilion, the only cyan that clears contrast is a washed-out ice blue.
  // The ground is move 6, and demanding a saturated accent too fights it.
  assert.doesNotThrow(() => assertOneHue('#C81E1E', '#F2F5F8'));
  assert.doesNotThrow(() => assertOneHue('#1B2FE8', '#EDEFF2'));
});

test('lifting an accent for contrast preserves its hue', () => {
  const lifted = liftAccentForGround('#1BB6E8', '#C81E1E', 3)!;
  assert.ok(lifted);
  assert.ok(contrastRatio(lifted, '#C81E1E') >= 3);
  assert.ok(Math.abs(hsl(lifted).h - hsl('#1BB6E8').h) < 2, 'hue drifted');
});

test('the premise gate rejects an unbuildable premise at CHOOSING time', () => {
  const r = assertDivergent([
    draft({ name: 'A', topology: 'spatial', ground: '#C81E1E', accent: '#1BB6E8', thresholdGesture: 'hold', lexicon: { contact: 'THE DOOR' } }),
    draft({ name: 'B', topology: 'dossier', accent: '#3FD8FF' }),
    draft({ name: 'C', topology: 'broadcast', accent: '#B14BFF', thresholdGesture: 'press' }),
  ]);
  assert.ok(r.problems.some(p => p.includes('below 3:1')), r.problems.join(' | '));
  assert.ok(r.problems.some(p => p.includes('Same hue at')), 'the gate should suggest the corrected accent');
});

/* ---------- the ledger ---------- */

test('refuses a fact with no source', () => {
  const l = new Ledger();
  assert.throws(() => l.add({ id: 'x', kind: 'count', value: 1000, label: 'STREAMS', sourceUrl: '', verifiedAt: '2026-08-21' }), UnsourcedFactError);
  assert.throws(() => l.add({ id: 'x', kind: 'count', value: 1000, label: 'STREAMS', sourceUrl: 'spotify', verifiedAt: '2026-08-21' }), UnsourcedFactError);
});

test('refuses a fact with no verification date', () => {
  const l = new Ledger();
  assert.throws(() => l.add({ id: 'x', kind: 'count', value: 1, label: 'S', sourceUrl: 'https://a.com', verifiedAt: 'recently' }), UnsourcedFactError);
});

test('a sealed claim can never be printed as a value', () => {
  const l = new Ledger();
  l.seal({ id: 'tiktok.uses', label: 'TIKTOK USES', reason: 'no primary source found', unblockedBy: 'a TikTok sound page' });
  assert.equal(l.isSealed('tiktok.uses'), true);
  assert.throws(() => l.require('tiktok.uses'), UnsourcedFactError);
  // and it cannot be quietly shadowed by adding a fact with the same id
  assert.throws(() => l.add({ id: 'tiktok.uses', kind: 'count', value: 58_900_000, label: 'X', sourceUrl: 'https://a.com', verifiedAt: '2026-08-21' }));
});

test('records misses so the audit can report holes', () => {
  const l = new Ledger();
  l.get('nope.missing');
  assert.deepEqual(l.missed(), ['nope.missing']);
});

test('stale() flags rotting numbers', () => {
  const l = new Ledger();
  l.add({ id: 'a', kind: 'count', value: 1, label: 'A', sourceUrl: 'https://a.com', verifiedAt: '2026-01-01' });
  l.add({ id: 'b', kind: 'count', value: 2, label: 'B', sourceUrl: 'https://a.com', verifiedAt: '2026-08-20' });
  const stale = l.stale(30, new Date('2026-08-21'));
  assert.deepEqual(stale.map(f => f.id), ['a']);
});

/* ---------- premise divergence ---------- */

const draft = (o: Partial<PremiseDraft>): PremiseDraft => ({
  name: 'X', logline: 'l', topology: 'dossier', ground: '#05090C', accent: '#3FD8FF',
  thresholdGesture: 'scroll', thresholdLabel: 'CROSS', lexicon: { contact: 'COMMS' },
  rationale: 'from [room]', fromAnswers: ['room'], ...o,
});

test('rejects three premises that are one premise in three coats of paint', () => {
  const r = assertDivergent([
    draft({ name: 'A', accent: '#3FD8FF' }),
    draft({ name: 'B', accent: '#4FD0FF' }),
    draft({ name: 'C', accent: '#2FE0FF' }),
  ]);
  assert.equal(r.ok, false);
  assert.ok(r.problems.some(p => p.includes('topologies repeat')));
  assert.ok(r.problems.some(p => p.includes('apart')));
  assert.ok(r.problems.some(p => p.includes('near-black')));
});

test('rejects a premise whose lexicon still says Contact', () => {
  const r = assertDivergent([
    draft({ name: 'A', topology: 'spatial', accent: '#E23B2E', ground: '#FFFFFF', thresholdGesture: 'hold', lexicon: { contact: 'Contact' } }),
    draft({ name: 'B', topology: 'dossier', accent: '#3FD8FF' }),
    draft({ name: 'C', topology: 'broadcast', accent: '#B14BFF', thresholdGesture: 'press' }),
  ]);
  assert.ok(r.problems.some(p => p.includes('did not reach the copy')));
});

test('rejects a premise with no rationale tied to an interview answer', () => {
  const r = assertDivergent([
    draft({ name: 'A', topology: 'spatial', accent: '#E23B2E', ground: '#FFFFFF', thresholdGesture: 'hold', fromAnswers: [], rationale: '' }),
    draft({ name: 'B', topology: 'dossier', accent: '#3FD8FF' }),
    draft({ name: 'C', topology: 'broadcast', accent: '#B14BFF', thresholdGesture: 'press' }),
  ]);
  assert.ok(r.problems.some(p => p.includes('came from the model, not the artist')));
});

test('accepts three genuinely divergent premises', () => {
  const r = assertDivergent([
    draft({ name: 'A', topology: 'spatial', accent: '#E23B2E', ground: '#FFFFFF', thresholdGesture: 'hold', lexicon: { contact: 'THE DOOR' } }),
    draft({ name: 'B', topology: 'dossier', accent: '#3FD8FF', ground: '#05090C', thresholdGesture: 'scroll', lexicon: { contact: 'COMMS' } }),
    draft({ name: 'C', topology: 'broadcast', accent: '#B14BFF', ground: '#120018', thresholdGesture: 'press', lexicon: { contact: 'CALL IN' } }),
  ]);
  assert.equal(r.ok, true, r.problems.join(' | '));
});

/* ---------- markup safety: a green build is not proof ---------- */

test('detects an eaten container div', () => {
  const before = '<main><div id="plate-stack"><p>a</p></div></main>';
  const after  = '<main><p>a</p></div></main>';
  assert.throws(() => assertBalancePreserved(before, after), PatchRefused);
});

test('tagBalance ignores comments and script bodies', () => {
  const r = tagBalance('<div><!-- <span> --><script>if (a<b) {}</script></div>');
  assert.equal(r.ok, true, JSON.stringify(r));
});

test('a patch refuses when the file has drifted under it', () => {
  const l = new Ledger();
  l.add({ id: 's', kind: 'count', value: 10_630_835, label: 'STREAMS', sourceUrl: 'https://open.spotify.com/x', verifiedAt: '2026-08-21' });
  assert.throws(() => applyPatch('<p>9,391,470</p><p>9,391,470</p>', {
    headline: 'h', requires: ['s'], corrections: [{ factId: 's', was: '9,391,470', occurrences: 1 }],
  }, l), PatchRefused);
});

test('a patch refuses when a required fact is unverified', () => {
  const l = new Ledger();
  assert.throws(() => applyPatch('<p>x</p>', { headline: 'h', requires: ['die2young.date'], corrections: [] }, l), PatchRefused);
});

test('a correct patch applies and reports its provenance', () => {
  const l = new Ledger();
  l.add({ id: 's', kind: 'count', value: 10_630_835, label: 'STREAMS', sourceUrl: 'https://open.spotify.com/x', verifiedAt: '2026-08-21' });
  const r = applyPatch('<p>9,391,470 STREAMS</p>', {
    headline: 'h', requires: ['s'], corrections: [{ factId: 's', was: '9,391,470', occurrences: 1 }],
  }, l);
  assert.ok(r.html.includes('10,630,835'));
  assert.ok(r.applied[0].includes('open.spotify.com'));
  assert.ok(r.applied[0].includes('2026-08-21'));
});

/* ---------- machine slots must not get thousands separators ---------- */

test('a raw-format fact keeps no separator — a comma in data-target parses as 326', () => {
  const l = new Ledger();
  l.add({ id: 'n', kind: 'count', value: 326_075, label: 'N', format: 'raw', sourceUrl: 'https://a.com', verifiedAt: '2026-08-21' });
  const r = applyPatch('<b data-target="323024">0</b>', {
    headline: 'h', requires: ['n'], corrections: [{ factId: 'n', was: '323024', occurrences: 1 }],
  }, l);
  assert.ok(r.html.includes('data-target="326075"'), r.html);
  assert.equal(parseInt('326075', 10), 326075);
});

test('the same fact flexes with separators in prose', () => {
  const l = new Ledger();
  l.add({ id: 'n', kind: 'count', value: 326_075, label: 'N', sourceUrl: 'https://a.com', verifiedAt: '2026-08-21' });
  const r = applyPatch('<p>323,024 listeners</p>', {
    headline: 'h', requires: ['n'], corrections: [{ factId: 'n', was: '323,024', occurrences: 1 }],
  }, l);
  assert.ok(r.html.includes('326,075'));
});
