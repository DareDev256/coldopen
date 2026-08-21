/**
 * TEST 2 — "new release" on a site COLD OPEN did not generate.
 *
 * 100bandplan.com is hand-built. The engine reads its world, patches it in
 * that world's own vocabulary, and proves it did not break the markup.
 * Nothing here is regenerated.
 *
 * Every fact was read from a primary source on 2026-08-21. See the sourceUrl
 * on each entry; that is the whole point.
 */
import fs from 'node:fs';
import { Ledger } from '../../engine/src/ledger.ts';
import { extractWorld, applyPatch, tagBalance } from '../../engine/src/update.ts';
import { inferHostPattern, buildReleasePatch, describeHost, type VerifiedRelease } from '../../engine/src/release.ts';

const SITE = '/Users/t./dev/100bandplans-site';
const V = '2026-08-21';

const ledger = new Ledger();

// --- the new record -------------------------------------------------------
ledger
  .add({ id: 'die2young.title', kind: 'title', value: 'Die 2 Young', label: 'NEW RELEASE',
    sourceUrl: 'https://open.spotify.com/track/44rdeJo94TRE25sS6XGF63', verifiedAt: V,
    note: 'Spotify bills it "Die 2 Young (ft. 100Bandplan)"; Apple uses "(feat. …)"' })
  .add({ id: 'die2young.credit', kind: 'credit', value: 'Casper TNG, 100Bandplan', label: 'BILLED AS',
    sourceUrl: 'https://open.spotify.com/track/44rdeJo94TRE25sS6XGF63', verifiedAt: V,
    note: 'Casper TNG lead, 100Bandplan featured — do not reverse the order' })
  .add({ id: 'die2young.date', kind: 'date', value: '2026-08-18', label: 'RELEASED',
    sourceUrl: 'https://open.spotify.com/album/2NVz064wIitXZaBqMUQvNP', verifiedAt: V })
  .add({ id: 'die2young.video', kind: 'link', value: 'https://www.youtube.com/watch?v=XLa_pNSU50I', label: 'OFFICIAL VIDEO',
    sourceUrl: 'https://www.youtube.com/watch?v=XLa_pNSU50I', verifiedAt: V,
    note: 'published 2026-08-18, © 2026 Universal Music Canada Inc.' })
  .add({ id: 'draftday.title', kind: 'title', value: 'Draft Day', label: 'ALBUM',
    sourceUrl: 'https://www.universalmusic.ca/2026/08/18/casper-tng-releases-his-official-debut-album-draft-day/', verifiedAt: V,
    note: "Casper TNG's official debut album; 100Bandplan on track 7 of 14" })
  .add({ id: 'draftday.label', kind: 'text', value: 'Universal Music Canada', label: 'LABEL',
    sourceUrl: 'https://open.spotify.com/album/2NVz064wIitXZaBqMUQvNP', verifiedAt: V,
    note: '© 2026 Universal Music Canada Inc. ℗ 2026 Universal Music Canada Inc.' })
  .add({ id: 'die2young.location', kind: 'text', value: 'Paris', label: 'VIDEO SHOT IN',
    sourceUrl: 'https://www.universalmusic.ca/2026/08/18/casper-tng-releases-his-official-debut-album-draft-day/', verifiedAt: V,
    note: 'label press states VIDEO SHOT IN PARIS; the thumbnail is the Eiffel Tower at night, which corroborates it' });

// --- numbers the new release makes wrong ----------------------------------
ledger
  .add({ id: 'market.streams', kind: 'count', value: 10_630_835, label: 'THE MARKET · SPOTIFY STREAMS',
    sourceUrl: 'https://open.spotify.com/artist/54gXMsMsoa0quu4bwTms8v', verifiedAt: V,
    note: 'crossed 10M; the site was printing 9,391,470' })
  .add({ id: 'remix.streams', kind: 'count', value: 2_243_678, label: 'THE MARKET REMIX · SPOTIFY STREAMS',
    sourceUrl: 'https://open.spotify.com/artist/54gXMsMsoa0quu4bwTms8v', verifiedAt: V })
  .add({ id: 'monthly.listeners', kind: 'count', value: 326_075, label: 'MONTHLY LISTENERS',
    sourceUrl: 'https://open.spotify.com/artist/54gXMsMsoa0quu4bwTms8v', verifiedAt: V })
  .add({ id: 'monthly.listeners.raw', kind: 'count', value: 326075, label: 'MONTHLY LISTENERS (COUNT-UP TARGET)', format: 'raw',
    sourceUrl: 'https://open.spotify.com/artist/54gXMsMsoa0quu4bwTms8v', verifiedAt: V,
    note: 'the data-target the counter animates to; must match the printed figure or the page contradicts itself' })
  .add({ id: 'market.streams.abbrev', kind: 'count', value: '10.6M+', label: 'THE MARKET · STREAMS (PROSE)', format: 'none',
    sourceUrl: 'https://open.spotify.com/artist/54gXMsMsoa0quu4bwTms8v', verifiedAt: V,
    note: 'rounded DOWN from 10,630,835 for the screen-reader prose block; never round a flex up' })
  .add({ id: 'market.gold.year', kind: 'date', value: '’26', label: 'GOLD CERTIFIED',
    sourceUrl: 'https://www.udiscovermusic.com/news/casper-tng-draft-day/', verifiedAt: V,
    note: 'Gold was 24 March 2026, not 2025 — the site had the wrong year' })
  .add({ id: 'market.platinum', kind: 'award', value: 'Platinum · Canada', label: 'CERTIFICATION',
    sourceUrl: 'https://musiccanada.com/gold-platinum/', verifiedAt: V,
    note: 'registry row read directly: July 2 2026 · Platinum Single · Casper TNG & 100Bandplan — The Market. SINGLE level. A search snippet bled the adjacent RAYE row and read as 6x Platinum; that is wrong.' });

// --- what is still not verified, and stays redacted -----------------------
ledger
  .seal({ id: 'tiktok.uses', label: 'TIKTOK USES',
    reason: 'the 58.9M figure has no primary source. UMC does state "No. 1 sound on TikTok in Canada for 14 consecutive weeks" — that sentence is printable, the number is not.',
    unblockedBy: 'a TikTok sound page showing the use count' })
  .seal({ id: 'billboard.peak', label: 'BILLBOARD CANADIAN HOT 100',
    reason: 'the #61 peak could not be found on any Billboard surface',
    unblockedBy: 'the Billboard Canadian Hot 100 archive for the charting week' })
  .seal({ id: 'die2young.isrc', label: 'ISRC / UPC',
    reason: 'not exposed on Spotify, Apple or the label page',
    unblockedBy: 'the UMC media kit or the distributor dashboard' });

// --- read the host world --------------------------------------------------
const html = fs.readFileSync(`${SITE}/index.html`, 'utf8');
const css = fs.readFileSync(`${SITE}/css/style.css`, 'utf8');
const world = extractWorld(html, css);
const host = inferHostPattern(html);
if (!host) throw new Error('could not infer the host item pattern — patch by hand rather than guessing');

console.log('── HOST WORLD (read, not assumed) ──');
console.log(describeHost(world, host));

const release: VerifiedRelease = {
  title: 'Die 2 Young',
  billedAs: 'Casper TNG, 100Bandplan',
  releaseDate: '2026-08-18',
  kind: 'album-feature',
  parentTitle: 'Draft Day',
  label: 'Universal Music Canada',
  primaryUrl: 'https://open.spotify.com/track/44rdeJo94TRE25sS6XGF63',
  videoUrl: 'https://www.youtube.com/watch?v=XLa_pNSU50I',
  imageUrl: 'assets/img/die2young-paris.jpg',
  factIds: ['die2young.title', 'die2young.credit', 'die2young.date', 'die2young.video', 'draftday.title', 'die2young.location'],
  // in the host's register: its captions are short all-caps fragments
  // (TORONTO · ON SET · PARIS · NO LIMIT). "DRAFT DAY" belongs to that set.
  caption: 'DRAFT DAY',
};

const patch = buildReleasePatch({
  release, host, hostHtml: html, ledger,
  corrections: [
    { factId: 'market.streams', was: '9,391,470', occurrences: 1 },
    { factId: 'monthly.listeners', was: '323,024', occurrences: 1 },
    { factId: 'monthly.listeners.raw', was: '323024', occurrences: 1 },
    { factId: 'remix.streams', was: '1.6M', occurrences: 2 },
    { factId: 'market.streams.abbrev', was: '9.4M+', occurrences: 2 },
    { factId: 'market.gold.year', was: '’25', occurrences: 1 },
  ],
  // anchored on the PARIS plate: a string that cannot prefix-match its container
  afterMarker: '<span class="m-cap mono">PARIS</span><span class="m-play">↗</span></a>',
  // no coordinate: the engine finds a free slot. Hand-picking one put the
  // plate behind the centrepiece, invisible, with every check still green.
});

const result = applyPatch(html, patch, ledger);

console.log('\n── PATCH ──');
console.log(patch.headline);
result.applied.forEach(a => console.log('  ✓ ' + a));
result.skipped.forEach(s => console.log('  · skipped: ' + s));
console.log('\n── MARKUP BALANCE ──');
console.log(`  balanced: ${result.balance.ok}  unclosed: [${result.balance.unclosed}]  stray: [${result.balance.stray}]`);

if (process.argv.includes('--write')) {
  fs.writeFileSync(`${SITE}/index.html`, result.html);
  console.log('\n  WRITTEN to ' + SITE + '/index.html');
} else {
  console.log('\n  (dry run — pass --write to apply)');
}
