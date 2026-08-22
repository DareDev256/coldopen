/**
 * A STARTING WORLD.
 *
 *   cp -r worlds/_template worlds/your-artist
 *   node --experimental-strip-types worlds/your-artist/build.ts
 *
 * Work top to bottom. The build refuses rather than shipping something that
 * reads as a template, and every refusal tells you what to change.
 *
 * The one thing to get right before anything else is the PREMISE. Everything
 * below it is derived. If you find yourself describing a layout — "a bold hero
 * with a grid under it" — stop and name the world instead; the layout falls out
 * of the name on its own.
 */
import fs from 'node:fs';
import path from 'node:path';
import { Ledger } from '../../engine/src/ledger.ts';
import { derive } from '../../engine/src/derive.ts';
import { build } from '../../engine/src/emit/index.ts';
import type { SiteContent, Unit } from '../../engine/src/emit/html.ts';
import type { PremiseDraft } from '../../engine/src/premise.ts';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(HERE, 'site');
const ledger = Ledger.fromJSON(JSON.parse(fs.readFileSync(path.join(HERE, 'ledger.json'), 'utf8')));

/* ── 1. THE PREMISE ──────────────────────────────────────────────────────
   A world, not a layout. "The Vault." "Mission File." "Carry-On."
   Run the studio (cd studio && npm run dev) to generate three and let the
   artist pick, or write one here if you already know it.                   */
const premise: PremiseDraft = {
  name: 'REPLACE ME',
  logline: 'One sentence. What a stranger should feel in four seconds.',

  // spatial (an object / a room) · dossier (a document) · broadcast (a channel)
  // plate (one held image) · ledger (a running record)
  topology: 'dossier',

  // Decided FIRST, from the artist's own material — a cover, a video, a city.
  // Never a warm off-white: the build refuses it by shape, not by hex list.
  ground: '#05090C',
  accent: '#3FD8FF',

  thresholdGesture: 'scroll',
  thresholdLabel: 'REPLACE ME',          // never "Enter Site"
  thresholdReward: 'REPLACE ME',         // what is on the other side, in this world's words

  /* Rename EVERY slot from the world. The fastest way to spot a generated
     artist site is a section called "Contact". A vault has ACCESS; a mission
     file has COMMS; a carry-on has WHO'S ASKING. */
  lexicon: {
    enter: 'REPLACE ME', catalogue: 'REPLACE ME', story: 'REPLACE ME',
    proof: 'REPLACE ME', contact: 'REPLACE ME', latest: 'REPLACE ME',
    unit: 'REPLACE ME', index: 'SOURCES',
  },

  rationale: 'Why this artist. Cite the interview answer it came from.',
  fromAnswers: ['room'],
};

/* ── 2. THE WORLD ────────────────────────────────────────────────────────
   Type, chrome, payoff colour and dwell time are all derived from the
   premise. You supply the ground media and the sound bed.                  */
const world = derive({
  premise,
  artist: 'REPLACE ME',
  domain: 'example.com',
  ground: { kind: 'image', src: 'assets/ground.jpg', treatment: ['grain', 'vignette'] },
  sound: { src: 'assets/bed.mp3', label: 'SOUND', startsMuted: true },
});

/* ── 3. THE WORK ─────────────────────────────────────────────────────── */
const units: Unit[] = [
  { title: 'REPLACE ME', sub: 'year · view count', href: 'https://www.youtube.com/watch?v=REPLACE', image: 'assets/01.jpg' },
];

const content: SiteContent = {
  title: `${world.artist} — ${world.name}`,
  description: world.logline,
  canonical: `https://${world.domain}/`,
  ogImage: `https://${world.domain}/assets/og.jpg`,   // ABSOLUTE — a relative og:image kills every link preview

  // ledger ids, in the order they should read. A sealed id renders as a
  // redaction bar rather than disappearing.
  figures: ['top.streams', 'instagram.followers'],

  units,
  story: ['Two or three sentences. What only this artist could have said.'],

  /* The rail must actually deliver. A mailto as the only path is not a rail —
     it silently fails on any visitor without a mail client configured. */
  rail: {
    endpoint: 'https://formsubmit.co/ajax/REPLACE@example.com',
    fields: [
      { name: 'name', label: 'WHO IS CALLING', type: 'text', required: true },
      { name: 'email', label: 'REACH YOU AT', type: 'email', required: true },
      { name: 'message', label: 'THE MESSAGE', type: 'textarea', required: true },
    ],
    submitLabel: 'SEND IT',
    fallbackEmail: 'REPLACE@example.com',
  },

  links: ledger.all().filter(f => f.id.startsWith('link.')).map(f => ({ label: f.label, href: String(f.value) })),
};

/* ── 4. BUILD ────────────────────────────────────────────────────────── */
const out = build(world, content, ledger);
console.log(`  moves ${out.audit.moveCount}/7   ink ${out.audit.contrast.inkOnGround.toFixed(2)}:1   accent ${out.audit.contrast.accentOnGround.toFixed(2)}:1`);
console.log(out.audit.ok ? '  ✓ clean' : out.audit.problems.map(p => '  ✕ ' + p).join('\n'));

fs.mkdirSync(OUT, { recursive: true });
for (const [rel, body] of Object.entries(out.files)) {
  const p = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, body);
}
console.log(`\n  ${Object.keys(out.files).length} files → ${OUT}`);
