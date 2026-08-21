/**
 * COLD OPEN — the World.
 *
 * A World is a NAMED PREMISE, not a layout. Everything downstream — type,
 * colour, motion, section names, the threshold ritual — is DERIVED from it.
 *
 * The failure mode this whole engine exists to avoid is the median premise:
 * a competent dark editorial page with one accent and a hero image. That page
 * is what you get when the premise is never named, because "tasteful" is the
 * safest thing to converge on when nothing has been decided.
 *
 * So the World is picked by the ARTIST, from divergent options, before a single
 * design token is chosen. The engine derives; it does not decide.
 */

import type { Ledger } from './ledger.ts';

/** The seven recurring moves. A World that scores below 6 is not shippable. */
export const MOVES = [
  'named_premise',     // 1. a name, not a layout
  'threshold_ritual',  // 2. you cross something to get in
  'sound_control',     // 3. sound is first-class, not a mute toggle
  'hud_chrome',        // 4. corner brackets, doc numbers, stamps
  'video_ground',      // 5. full-bleed motion as ground, not decoration
  'one_hue',           // 6. ONE saturated hue, tied to the artist
  'live_numbers',      // 7. real counts as flex
] as const;
export type Move = typeof MOVES[number];

export interface Threshold {
  /** what the visitor physically does: 'scroll' | 'hold' | 'drag' | 'press' | 'turn' */
  readonly gesture: 'scroll' | 'hold' | 'drag' | 'press' | 'turn';
  /** the words on screen. World-specific. Never "Enter Site". */
  readonly label: string;
  /** what happens on the other side, in the world's own language */
  readonly reward: string;
  /** seconds the cold open runs before it will let you through regardless */
  readonly maxDwellMs: number;
}

/**
 * The lexicon is the single biggest tell between generated and hand-built.
 * A generic generator writes "Contact", "Gallery", "About". A named world
 * has no Contact section — The Vault has ACCESS, the Mission File has COMMS.
 * Every slot must be renamed or the world leaks.
 */
export interface Lexicon {
  readonly enter: string;      // the threshold CTA
  readonly catalogue: string;  // the body of work
  readonly story: string;      // the bio
  readonly proof: string;      // the numbers / credentials
  readonly contact: string;    // the booking rail
  readonly latest: string;     // the newest thing
  readonly unit: string;       // what one item is called: "deposit", "plate", "feed"
  readonly index: string;      // the sources page
}

export interface Palette {
  /** the ground. Decided FIRST, from the content. */
  readonly ground: string;
  /** ONE saturated hue, tied to the artist. */
  readonly accent: string;
  /** the payoff metal/light — used once, at the climax */
  readonly payoff: string;
  readonly ink: string;
  readonly muted: string;
}

export interface TypePair {
  /** display face — the wordmark and headings */
  readonly display: { family: string; weights: number[]; google: string };
  /** technical face — HUD labels, doc codes, counters */
  readonly mono: { family: string; weights: number[]; google: string };
}

export interface Chrome {
  /** the document code stamped in the corner, e.g. "DWG 100BP-A01", "KMV-2026-0017" */
  readonly docCode: string;
  /** short all-caps stamps this world uses */
  readonly stamps: readonly string[];
  /** the persistent corner readout, e.g. "000°", "SECURED", "REC" */
  readonly readout: string;
}

export interface Ground {
  readonly kind: 'video' | 'image' | 'canvas';
  /** local path or absolute URL — must exist at build time */
  readonly src: string;
  readonly poster?: string;
  /** treatment applied to make it a GROUND rather than a hero picture */
  readonly treatment: readonly ('grain' | 'vignette' | 'scanlines' | 'desaturate' | 'tint' | 'blur-edge')[];
}

export interface World {
  /** the slug, e.g. 'the-vault' */
  readonly id: string;
  /** THE NAME. "The Vault". "Mission File". This is the product. */
  readonly name: string;
  /** one sentence. what a stranger should feel in four seconds. */
  readonly logline: string;
  /** the artist as billed on the DSPs — never a stylisation we invented */
  readonly artist: string;
  readonly domain: string;

  readonly palette: Palette;
  readonly type: TypePair;
  readonly lexicon: Lexicon;
  readonly threshold: Threshold;
  readonly chrome: Chrome;
  readonly ground: Ground;

  /** sound: the bed that plays once you cross. Required — sound is a move. */
  readonly sound?: { src: string; label: string; startsMuted: boolean };

  /** which of the seven moves this world implements */
  readonly moves: readonly Move[];
}

/* ------------------------------------------------------------------ */
/* THE BANNED GROUND                                                   */
/* ------------------------------------------------------------------ */

/**
 * Cream is a hedge. It flatters any photograph, clashes with nothing, and
 * passes contrast without thought — so it wins by default whenever the palette
 * is not decided before layout. That is exactly the failure this engine exists
 * to prevent, so it is a build error, not a lint warning.
 */
export class BannedGroundError extends Error {
  constructor(hex: string, why: string) {
    super(`COLD OPEN refused ground "${hex}": ${why}. Pick the ground FIRST, from the content — white, true black, or a saturated hue. Cream is only permissible when the artist's existing brand is genuinely built on it, and then it must be passed explicitly.`);
    this.name = 'BannedGroundError';
  }
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '').trim();
  const s = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  if (!/^[0-9a-fA-F]{6}$/.test(s)) throw new Error(`not a hex colour: ${hex}`);
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}

/** relative luminance, WCAG */
export function luminance(hex: string): number {
  const f = (c: number) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatio(a: string, b: string): number {
  const [la, lb] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (la + 0.05) / (lb + 0.05);
}

/** HSL saturation + lightness, for the cream test */
export function hsl(hex: string): { h: number; s: number; l: number } {
  const [r0, g0, b0] = hexToRgb(hex).map(v => v / 255) as [number, number, number];
  const max = Math.max(r0, g0, b0), min = Math.min(r0, g0, b0);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r0) h = ((g0 - b0) / d + (g0 < b0 ? 6 : 0));
  else if (max === g0) h = (b0 - r0) / d + 2;
  else h = (r0 - g0) / d + 4;
  return { h: h * 60, s, l };
}

/**
 * The cream test. A warm near-white ground is banned by name AND by shape,
 * because the named list ("#F7F1E7" and friends) is trivially evaded by
 * nudging one channel. The shape test is what actually holds.
 */
export function assertGroundAllowed(hex: string, opts: { brandExemption?: string } = {}): void {
  const { h, s, l } = hsl(hex);
  const warm = (h >= 20 && h <= 65) || h >= 355 || h <= 5;
  const nearWhite = l >= 0.86;
  const tinted = s >= 0.06;

  if (nearWhite && tinted && warm) {
    if (opts.brandExemption) return; // caller has stated the brand reason out loud
    throw new BannedGroundError(hex, `it is a warm near-white (h=${h.toFixed(0)}° s=${(s * 100).toFixed(0)}% l=${(l * 100).toFixed(0)}%) — cream/beige/bone`);
  }
  // sage + taupe + "warm charcoal-brown", cream's usual partners
  if (h >= 20 && h <= 110 && s >= 0.05 && s <= 0.30 && l >= 0.30 && l <= 0.85) {
    if (opts.brandExemption) return;
    throw new BannedGroundError(hex, `it is a desaturated warm mid-tone (sage / taupe / mushroom) — cream's partner palette`);
  }
}

/** The accent must actually be saturated. A grey "accent" is not a hue. */
export function assertAccentSaturated(hex: string): void {
  const { s, l } = hsl(hex);
  if (s < 0.45) throw new Error(`COLD OPEN refused accent "${hex}": saturation ${(s * 100).toFixed(0)}% — the accent is the ONE hue tied to the artist and it must be loud. Minimum 45%.`);
  if (l < 0.15 || l > 0.92) throw new Error(`COLD OPEN refused accent "${hex}": lightness ${(l * 100).toFixed(0)}% is unusable against a ground.`);
}

export interface WorldAudit {
  readonly ok: boolean;
  readonly moveCount: number;
  readonly missingMoves: Move[];
  readonly problems: string[];
  readonly contrast: { inkOnGround: number; accentOnGround: number };
}

export function auditWorld(w: World, ledger?: Ledger): WorldAudit {
  const problems: string[] = [];

  try { assertGroundAllowed(w.palette.ground); } catch (e) { problems.push((e as Error).message); }
  try { assertAccentSaturated(w.palette.accent); } catch (e) { problems.push((e as Error).message); }

  const inkOnGround = contrastRatio(w.palette.ink, w.palette.ground);
  const accentOnGround = contrastRatio(w.palette.accent, w.palette.ground);
  if (inkOnGround < 4.5) problems.push(`body ink ${w.palette.ink} on ground ${w.palette.ground} is ${inkOnGround.toFixed(2)}:1 — below 4.5:1`);
  if (accentOnGround < 3) problems.push(`accent ${w.palette.accent} on ground ${w.palette.ground} is ${accentOnGround.toFixed(2)}:1 — below 3:1, it will read as faint`);

  const missingMoves = MOVES.filter(m => !w.moves.includes(m));
  if (w.moves.length < 6) problems.push(`only ${w.moves.length}/7 moves — a world under 6 reads as a template`);
  if (!w.moves.includes('named_premise')) problems.push('no named premise — this is not a world, it is a layout');
  if (!w.moves.includes('threshold_ritual')) problems.push('no threshold ritual — the visitor never crosses anything');

  // the lexicon leak test: generic section names mean the world did not reach the copy
  const generic = ['contact', 'about', 'gallery', 'music', 'videos', 'home', 'work', 'portfolio', 'bio', 'news', 'shop', 'enter site', 'learn more', 'get in touch'];
  for (const [slot, word] of Object.entries(w.lexicon)) {
    if (generic.includes(String(word).toLowerCase().trim())) {
      problems.push(`lexicon.${slot} is "${word}" — a generic label. The world leaked. Name it from "${w.name}".`);
    }
  }

  if (!w.sound) problems.push('no sound bed — sound is one of the seven moves, not an optional extra');
  if (!w.ground?.src) problems.push('no full-bleed ground media');
  if (!w.chrome?.docCode) problems.push('no document code — the HUD has nothing technical to say');

  if (ledger) {
    const missed = ledger.missed();
    if (missed.length) problems.push(`templates asked for ${missed.length} fact(s) not in the ledger: ${missed.join(', ')}`);
  }

  return { ok: problems.length === 0, moveCount: w.moves.length, missingMoves, problems, contrast: { inkOnGround, accentOnGround } };
}
