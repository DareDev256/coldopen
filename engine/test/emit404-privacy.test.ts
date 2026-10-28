import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emit404, emitPrivacy } from '../src/emit/index.ts';
import { emitHTML } from '../src/emit/html.ts';
import { Ledger } from '../src/ledger.ts';
import type { World } from '../src/world.ts';
import type { SiteContent } from '../src/emit/html.ts';

/* ---------- fixtures ----------
   2026-09-13: Wave 2 (404 + privacy + alt-text as ENGINE features, not
   one-off hacks in a single world's build.ts). shortiieraw.com's audit found
   BOTH pages missing site-wide — every world built by this engine gets them
   from a rebuild, or neither test below would compile against index.ts. */

const world: World = {
  id: 'w', name: 'Carry-On', logline: 'l', artist: 'Shortiie Raw', domain: 'shortiieraw.com',
  palette: { ground: '#1B2FE8', accent: '#FFDD33', payoff: '#E6D9A8', ink: '#F2F5F8', muted: 'rgba(242,245,248,.6)' },
  type: { display: { family: 'Anton', weights: [900], google: 'Anton' },
          text: { family: 'Archivo', weights: [400], google: 'Archivo' },
          mono: { family: 'Space Mono', weights: [400], google: 'Space+Mono' } },
  lexicon: { enter: 'OPEN', catalogue: 'THE CATALOGUE', story: 'THE STORY', proof: 'THE MARKET',
             contact: 'BOOK', latest: 'LATEST', unit: 'plate', index: 'SOURCES' },
  threshold: { gesture: 'drag', label: 'DRAG TO OPEN', reward: 'IT OPENS', maxDwellMs: 7000 },
  chrome: { docCode: 'SHOR-CA26-4734', stamps: ['SECURED'], readout: 'OPEN' },
  ground: { kind: 'image', src: 'g.jpg', treatment: ['grain'] },
  moves: ['named_premise', 'threshold_ritual', 'one_hue', 'live_numbers', 'video_ground', 'hud_chrome'],
} as World;

const contentWithLinksAndMailto: SiteContent = {
  title: 't', description: 'd', canonical: 'https://shortiieraw.com/', ogImage: 'og.jpg',
  figures: [], units: [], story: [],
  rail: {
    endpoint: 'https://formsubmit.co/ajax/booking@example.com',
    fields: [
      { name: 'name', label: "WHO'S ASKING", type: 'text', required: true },
      { name: 'message', label: 'THE ASK', type: 'textarea', required: true },
    ],
    submitLabel: 'SEND IT',
    fallbackEmail: 'booking@example.com',
  },
  links: [
    { label: 'Spotify', href: 'https://open.spotify.com/artist/x' },
    { label: 'Instagram', href: 'https://www.instagram.com/x/' },
  ],
  measure: { ga4: 'G-ABC123DEF4' },
};

const contentNoMailtoNoMeasure: SiteContent = {
  ...contentWithLinksAndMailto,
  rail: { ...contentWithLinksAndMailto.rail, fallbackEmail: undefined },
  links: [{ label: 'Instagram', href: 'https://www.instagram.com/x/' }],
  measure: undefined,
};

test('emit404 renders the world\'s own tokens, never generic copy', () => {
  const html = emit404(world, contentWithLinksAndMailto);
  assert.match(html, /<!doctype html>/);
  assert.match(html, /Carry-On/);
  assert.match(html, /#1B2FE8/);   // ground
  assert.match(html, /#FFDD33/);   // accent
  assert.match(html, /SHOR-CA26-4734/);
  assert.match(html, /href="\/"/);
  // copy register: no exclamation marks outside the doctype declaration
  assert.doesNotMatch(html.replace(/<!doctype html>/, ''), /!/);
});

test('emit404 picks the Instagram link as its CTA when one exists', () => {
  const html = emit404(world, contentWithLinksAndMailto);
  assert.match(html, /instagram\.com\/x/);
});

test('emit404 does not throw with an empty links array', () => {
  const html = emit404(world, { ...contentWithLinksAndMailto, links: [] });
  assert.match(html, /Back to the site/);
});

test('emitPrivacy uses the rail\'s real mailto when one exists', () => {
  const html = emitPrivacy(world, contentWithLinksAndMailto);
  assert.match(html, /mailto:booking@example\.com/);
});

test('emitPrivacy falls back to the Instagram link when there is no mailto', () => {
  const html = emitPrivacy(world, contentNoMailtoNoMeasure);
  assert.doesNotMatch(html, /mailto:/);
  assert.match(html, /instagram\.com\/x/);
});

test('emitPrivacy only claims analytics when the world is actually measured', () => {
  const measured = emitPrivacy(world, contentWithLinksAndMailto);
  const unmeasured = emitPrivacy(world, contentNoMailtoNoMeasure);
  assert.match(measured, /Google Analytics/);
  assert.doesNotMatch(unmeasured, /Google Analytics/);
});

test('emitPrivacy names the rail\'s own form fields, not invented ones', () => {
  const html = emitPrivacy(world, contentWithLinksAndMailto);
  assert.match(html, /who's asking/i);
  assert.match(html, /the ask/i);
});

test('emitPrivacy states PIPEDA and Ontario as the engine default jurisdiction', () => {
  const html = emitPrivacy(world, contentWithLinksAndMailto);
  assert.match(html, /Ontario/);
  assert.match(html, /PIPEDA/);
});

test('emitPrivacy carries a same-day staleness line', () => {
  const html = emitPrivacy(world, contentWithLinksAndMailto);
  const today = new Date().toISOString().slice(0, 10);
  assert.match(html, new RegExp(`Last updated ${today}`));
});

/* ---------- alt text is sourced, never hardcoded ----------
   The audit's stale claim was 1/20 images missing alt on shortiieraw.com.
   Rebuilding today shows 0/20 missing (already threaded through `u.title`
   in html.ts/spatial-html.ts) — this test locks that invariant in so it
   cannot regress for ANY world, not just carryon. */
test('emitHTML never emits an <img> without an alt attribute', () => {
  const l = new Ledger();
  const c: SiteContent = {
    ...contentWithLinksAndMailto,
    units: [
      { title: 'Track One', href: 'https://x.example/1', image: 'a.jpg' },
      { title: 'Track Two', href: 'https://x.example/2', image: 'b.jpg' },
    ],
  };
  const html = emitHTML(world, c, l);
  const imgs = html.match(/<img[^>]*>/g) ?? [];
  assert.ok(imgs.length > 0, 'fixture should emit at least one <img>');
  for (const tag of imgs) assert.match(tag, /\salt="/, `missing alt: ${tag}`);
});

/* ---------- terms (2026-09-16) ----------
   checklist-20 found 8 of 15 sites with no terms page; shortiieraw.com was
   the one built by this engine. Same rule as privacy: an engine feature, so
   every world gets it from a rebuild. */
import { emitTerms } from '../src/emit/index.ts';

test('emitTerms renders the world\'s own tokens on the privacy shell', () => {
  const html = emitTerms(world, contentWithLinksAndMailto);
  assert.match(html, /<!doctype html>/);
  assert.match(html, /<title>Terms — Carry-On<\/title>/);
  assert.match(html, /Shortiie Raw/);
  assert.match(html, /#1B2FE8/);
  assert.match(html, /SHOR-CA26-4734 · Terms/);
  assert.match(html, /href="\/privacy\.html"/);
});

test('emitTerms states that a submission is an inquiry, not a booking', () => {
  const html = emitTerms(world, contentWithLinksAndMailto);
  assert.match(html, /is an inquiry, not a booking/);
  assert.match(html, /mailto:booking@example\.com/);
});

test('emitTerms falls back to the Instagram link when there is no mailto', () => {
  const html = emitTerms(world, contentNoMailtoNoMeasure);
  assert.match(html, /instagram\.com\/x/);
  assert.doesNotMatch(html, /mailto:/);
});

test('emitTerms names Ontario law and carries a same-day staleness line', () => {
  const html = emitTerms(world, contentWithLinksAndMailto);
  assert.match(html, /laws of Ontario/);
  assert.match(html, new RegExp(`Last updated ${new Date().toISOString().slice(0, 10)}`));
});

test('every shell footer links terms next to privacy', () => {
  const html = emitHTML(world, contentWithLinksAndMailto, new Ledger());
  assert.match(html, /<a href="\/privacy\.html">Privacy<\/a> · <a href="\/terms\.html">Terms<\/a>/);
});
