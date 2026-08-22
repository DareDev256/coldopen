import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sampleHues, proposePalette, visionPrompt, thumbsFromYouTube } from '../src/vision.ts';
import { hsl, assertGroundAllowed, contrastRatio } from '../src/world.ts';

/** a solid block of one colour, as raw RGBA */
function block(hex: string, n = 400): Uint8ClampedArray {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
  const px = new Uint8ClampedArray(n * 4);
  for (let i = 0; i < n * 4; i += 4) { px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255; }
  return px;
}
function mix(...parts: [string, number][]): Uint8ClampedArray {
  const chunks = parts.map(([hex, n]) => block(hex, n));
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const out = new Uint8ClampedArray(total);
  let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.length; }
  return out;
}

test('samples the dominant hue out of the work', () => {
  const h = sampleHues(mix(['#E5CA0A', 800], ['#CF6E09', 140], ['#0A0A0A', 400]), 'cover');
  assert.ok(h.length > 0);
  assert.ok(Math.abs(hsl(h[0].hex).h - hsl('#E5CA0A').h) < 20, `got ${h[0].hex}`);
});

test('ignores neutrals — a mostly-black cover does not make black the artist colour', () => {
  const h = sampleHues(mix(['#000000', 3000], ['#0E0E10', 2000], ['#3FD8FF', 300]), 'cover');
  assert.ok(h.length > 0, 'should still find the one real hue');
  assert.ok(Math.abs(hsl(h[0].hex).h - hsl('#3FD8FF').h) < 20, `got ${h[0].hex}`);
});

test('returns nothing rather than guessing when there is no usable hue', () => {
  assert.deepEqual(sampleHues(mix(['#101012', 800], ['#F4F4F6', 800]), 'cover'), []);
});

test('a proposed palette is always one the build would accept', () => {
  for (const seed of ['#E5CA0A', '#27A0F1', '#4024A8', '#CE4A30', '#869A32']) {
    const p = proposePalette(sampleHues(mix([seed, 900], ['#111113', 300]), 't'));
    assert.ok(p, `no proposal for ${seed}`);
    assert.doesNotThrow(() => assertGroundAllowed(p!.ground), `${seed} proposed a banned ground`);
    assert.ok(contrastRatio(p!.accent, p!.ground) >= 3, `${seed} proposed an illegible pair`);
  }
});

test('the vision prompt bans the adjectives that mean nobody looked', () => {
  const p = visionPrompt('X', thumbsFromYouTube(['abc123']));
  for (const w of ['edgy', 'gritty', 'vibrant', 'dynamic', 'aesthetic']) assert.ok(p.includes(w));
  assert.ok(p.includes('RECURRING OBJECTS'));
  assert.ok(p.includes('Never infer a fact that is not visible'));
});

test('youtube thumbs carry the watch URL they came from', () => {
  const [t] = thumbsFromYouTube(['EmrpNsyVtDQ']);
  assert.equal(t.sourceUrl, 'https://www.youtube.com/watch?v=EmrpNsyVtDQ');
  assert.ok(t.url.includes('EmrpNsyVtDQ'));
});
