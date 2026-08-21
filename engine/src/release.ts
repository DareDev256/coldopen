/**
 * COLD OPEN — "new release" as a first-class operation.
 *
 * An artist comes back when a record drops. If the only way to handle that is
 * to regenerate the site, the engine has flattened a world someone lived in.
 *
 * So this module does the opposite of generating: it reads the host site,
 * infers the markup pattern it already uses for a catalogue item, and emits a
 * new item in THAT pattern — the host's classes, the host's caption style, the
 * host's positional convention. COLD OPEN's own house style never appears.
 */

import { Ledger } from './ledger.ts';
import type { ReleasePatch, NumericClaim, ExtractedWorld } from './update.ts';

export interface VerifiedRelease {
  readonly title: string;
  /** exactly as the DSP bills it — never our stylisation */
  readonly billedAs: string;
  readonly releaseDate: string;
  readonly kind: 'single' | 'album-feature' | 'album' | 'ep' | 'video';
  readonly parentTitle?: string;
  readonly label?: string;
  readonly primaryUrl: string;
  readonly videoUrl?: string;
  readonly imageUrl?: string;
  /** ledger ids backing each of the above — the patch will not run without them */
  readonly factIds: readonly string[];
  /** one short all-caps caption, in the host site's register */
  readonly caption: string;
}

/** What the host site uses for one catalogue item. Inferred, never assumed. */
export interface HostPattern {
  readonly tag: string;
  readonly classes: string;
  readonly captionClass: string;
  readonly imageClass: string;
  readonly affordanceHtml: string;
  readonly positional: 'css-vars' | 'grid' | 'none';
  readonly sequenceAttr?: string;
  readonly nextSequence?: number;
}

/**
 * Infer the item pattern from the host markup. We look for the class that
 * repeats most often as a link-with-image-and-caption — that repetition IS
 * the site's definition of "one item", whatever it happens to be called.
 */
export function inferHostPattern(html: string): HostPattern | null {
  const anchors = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)]
    .map(m => ({ attrs: m[1], inner: m[2] }))
    .filter(a => /<img\b/.test(a.inner) || /<video\b/.test(a.inner));
  if (!anchors.length) return null;

  const byClass = new Map<string, typeof anchors>();
  for (const a of anchors) {
    const c = /class="([^"]+)"/.exec(a.attrs)?.[1];
    if (!c) continue;
    if (!byClass.has(c)) byClass.set(c, []);
    byClass.get(c)!.push(a);
  }
  const [classes, group] = [...byClass.entries()].sort((a, b) => b[1].length - a[1].length)[0] ?? [];
  if (!classes || !group || group.length < 2) return null;

  const sample = group[0];
  const captionClass = /<span class="([^"]*(?:cap|caption|meta|label|tag)[^"]*)"/.exec(sample.inner)?.[1] ?? '';
  const imageClass = /<img class="([^"]+)"/.exec(sample.inner)?.[1] ?? '';
  // the trailing affordance (a play glyph, an arrow) — copy it verbatim
  const affordance = [...sample.inner.matchAll(/<span class="([^"]*play[^"]*)">([^<]*)<\/span>/g)].pop();
  const affordanceHtml = affordance ? `<span class="${affordance[1]}">${affordance[2]}</span>` : '';

  const seqAttr = /(\bdata-[\w-]+)="\d+"/.exec(sample.attrs)?.[1];
  let nextSequence: number | undefined;
  if (seqAttr) {
    const nums = [...html.matchAll(new RegExp(`${seqAttr}="(\\d+)"`, 'g'))].map(m => Number(m[1]));
    nextSequence = nums.length ? Math.max(...nums) + 1 : undefined;
  }

  return {
    tag: 'a',
    classes,
    captionClass,
    imageClass,
    affordanceHtml,
    positional: /--x:/.test(sample.attrs) ? 'css-vars' : 'none',
    sequenceAttr: seqAttr,
    nextSequence,
  };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface PlacementHint { readonly x: string; readonly y: string; readonly r: string; readonly w: string; }

/**
 * How recent counts as "the latest". Inside this window the release earns the
 * host site's own emphasis treatment. Derived from the release date, never
 * typed by hand — otherwise every patch quietly becomes a design decision and
 * the engine is just a text editor with extra steps.
 */
export const LATEST_WINDOW_DAYS = 45;

export function daysSince(iso: string, now = new Date()): number {
  return Math.floor((now.getTime() - Date.parse(iso)) / 864e5);
}

/**
 * The widest plate the host uses. A brand-new major-label feature rendered at
 * the smallest size in the rack is technically present and practically hidden.
 */
export function hostEmphasisWidth(html: string): string | null {
  const widths = [...html.matchAll(/--w:\s*([\d.]+)vw/g)].map(m => parseFloat(m[1]));
  return widths.length ? `${Math.max(...widths)}vw` : null;
}

/**
 * Free-slot placement.
 *
 * A site that positions items by percentage has no layout engine to stop two
 * things landing on each other. Inserting at a hand-picked coordinate produced
 * a plate that was present in the DOM, passed the tag-balance check, and was
 * completely invisible behind the centrepiece. Neither a green build nor a
 * balanced-markup assertion can see that, so the engine has to.
 *
 * We collect every placed item, reserve the centre for the unplaced ones
 * (centrepieces in this idiom carry no --x/--y, they are flow-centred), and
 * pick the grid point furthest from everything already there.
 */
export interface Occupied { readonly x: number; readonly y: number; readonly r: number; }

export function readOccupancy(html: string): { placed: Occupied[]; unplacedCount: number } {
  const placed: Occupied[] = [];
  for (const m of html.matchAll(/--x:\s*([\d.]+)%;\s*--y:\s*([\d.]+)%[^"]*?--w:\s*([\d.]+)vw/g)) {
    placed.push({ x: +m[1], y: +m[2], r: Math.max(6, +m[3] / 2) });
  }
  // items in the same rack that carry a sequence attribute but no coordinates
  // are flow-centred — they own the middle of the stage.
  const seqTotal = [...html.matchAll(/data-pop="\d+"/g)].length;
  return { placed, unplacedCount: Math.max(0, seqTotal - placed.length) };
}

export function findFreePlacement(html: string, width: string): PlacementHint {
  const { placed, unplacedCount } = readOccupancy(html);
  const reserved = [...placed];
  if (unplacedCount > 0) {
    // reserve the centre column, where flow-centred centrepieces sit
    for (let y = 28; y <= 78; y += 8) reserved.push({ x: 50, y, r: 20 });
  }
  const w = parseFloat(width) || 10;
  let best: PlacementHint | null = null;
  let bestScore = -Infinity;
  for (let x = 8; x <= 92; x += 2) {
    for (let y = 8; y <= 92; y += 2) {
      let minD = Infinity;
      for (const o of reserved) {
        const dx = (x - o.x), dy = (y - o.y) * 0.62; // stage is wider than tall
        minD = Math.min(minD, Math.hypot(dx, dy) - o.r);
      }
      // prefer the upper half: a new release should not be buried at the bottom
      const score = minD - Math.abs(y - 34) * 0.08;
      if (score > bestScore) { bestScore = score; best = { x: `${x}%`, y: `${y}%`, r: `${((x % 7) - 3)}deg`, w: width }; }
    }
  }
  if (!best || bestScore < w / 2) {
    throw new Error(`COLD OPEN could not place the new item without overlapping something (best clearance ${bestScore.toFixed(1)}). The stage is full — remove an item or place this one by hand.`);
  }
  return best;
}

export function renderInHostPattern(r: VerifiedRelease, p: HostPattern, place?: PlacementHint, isLatest = false): string {
  const href = r.videoUrl ?? r.primaryUrl;
  const style = p.positional === 'css-vars' && place
    ? ` style="--x:${place.x}; --y:${place.y}; --r:${place.r}; --w:${place.w}"`
    : '';
  const seq = p.sequenceAttr && p.nextSequence != null ? ` ${p.sequenceAttr}="${p.nextSequence}"` : '';
  const img = r.imageUrl
    ? `<img${p.imageClass ? ` class="${p.imageClass}"` : ''} src="${esc(r.imageUrl)}" alt="${esc(r.billedAs)} — ${esc(r.title)}" loading="lazy"/>`
    : '';
  // "NEW" is prepended only when the date says so, in the host's own
  // short all-caps caption register — not because someone felt like it.
  const capText = isLatest ? `NEW · ${r.caption}` : r.caption;
  const cap = p.captionClass ? `<span class="${p.captionClass}">${esc(capText)}</span>` : '';
  return `    <${p.tag} class="${p.classes}"${seq}${style} href="${esc(href)}" target="_blank" rel="noopener">${img}${cap}${p.affordanceHtml}</${p.tag}>`;
}

/**
 * Compose the full patch: the new item, plus every stale number this release
 * makes wrong. A release patch that adds the new record and leaves the old
 * counts untouched has told half a truth, which on a page of live numbers is
 * the same as a lie.
 */
export function buildReleasePatch(input: {
  release: VerifiedRelease;
  host: HostPattern;
  hostHtml: string;
  ledger: Ledger;
  corrections: readonly NumericClaim[];
  afterMarker: string;
  place?: PlacementHint;
}): ReleasePatch {
  const { release, host, ledger, corrections, afterMarker } = input;
  const isLatest = daysSince(release.releaseDate) <= LATEST_WINDOW_DAYS;
  const emphasis = isLatest ? hostEmphasisWidth(input.hostHtml) : null;
  const width = emphasis ?? input.place?.w ?? '10vw';
  const place = input.place ?? (host.positional === 'css-vars' ? findFreePlacement(input.hostHtml, width) : undefined);
  const finalPlace = place ? { ...place, w: width } : undefined;

  for (const id of release.factIds) {
    if (!ledger.has(id)) {
      throw new Error(`COLD OPEN will not announce "${release.title}": fact "${id}" is not verified. Confirm it from a primary source first.`);
    }
  }

  return {
    headline: `${release.billedAs} — ${release.title}${release.parentTitle ? ` (${release.parentTitle})` : ''}, ${release.releaseDate}`,
    requires: [...release.factIds, ...corrections.map(c => c.factId)],
    corrections,
    insert: { html: renderInHostPattern(release, host, finalPlace, isLatest), afterMarker },
  };
}

/** Report for the operator: what the host world looks like, so nothing gets flattened. */
export function describeHost(w: ExtractedWorld, p: HostPattern | null): string {
  return [
    `ground/accent tokens : ${Object.entries(w.cssVars).filter(([k]) => /bg|ground|accent|cyan|ink|plat|line/.test(k)).map(([k, v]) => `--${k}:${v}`).join('  ') || '(none found)'}`,
    `typefaces            : ${w.fontFamilies.join(', ') || '(none found)'}`,
    `document codes       : ${w.docCodes.slice(0, 6).join(', ') || '(none)'}`,
    `its own lexicon      : ${w.lexicon.slice(0, 14).join(' · ')}`,
    `item pattern         : ${p ? `<${p.tag} class="${p.classes}"> caption=.${p.captionClass || '—'} seq=${p.sequenceAttr ?? '—'}→${p.nextSequence ?? '—'} placement=${p.positional}` : 'NOT INFERRED — patch by hand'}`,
  ].join('\n');
}
