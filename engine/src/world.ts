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
  /**
   * Reading face — body copy.
   *
   * Separate from `display` because a poster face is not a text face. Setting
   * paragraphs in Anton produced copy that was technically on the page and
   * practically unreadable. Some grotesks (Archivo) can do both jobs and this
   * is simply the same family again; poster faces get a companion.
   */
  readonly text: { family: string; weights: number[]; google: string };
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
  /**
   * Where the threshold copy sits relative to the frame.
   *
   * Full-bleed footage has a subject in it. Centring the wordmark by default
   * lays it across whoever is in the middle of the shot, which is the one
   * thing a person laying out this page by hand would never do. Anchor the
   * copy away from the subject instead.
   */
  readonly copyAnchor?: 'center' | 'top' | 'bottom';
  /** object-position for the crop, e.g. '50% 30%' */
  readonly focus?: string;
}

/**
 * A register is the site in another language.
 *
 * Not an i18n afterthought — for a diaspora artist it is structural. Shortiie
 * Raw's comment section is Portuguese and Angola-flagged while her streaming
 * audience is 43% Canada; those are two different audiences reading the same
 * page. A site that picks one has picked which half of her to erase.
 *
 * The engine only allows this when the artist's multilingualism is a SOURCED
 * fact, because a language toggle on an artist who does not speak the language
 * is a costume.
 */
export interface Register {
  /** BCP-47, e.g. 'pt' */
  readonly code: string;
  /** how the dial labels it, in that language */
  readonly label: string;
  /** the lexicon in this register — same worlds, its own words */
  readonly lexicon: Partial<Lexicon>;
  readonly logline: string;
  readonly story: readonly string[];
  /** the ledger id proving the artist actually works in this language */
  readonly evidenceId: string;
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

  /** optional: the site in more than one language. See Register. */
  readonly registers?: readonly Register[];
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

export function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const f = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${f(r)}${f(g)}${f(b)}`.toUpperCase();
}

/**
 * Lift an accent to legibility WITHOUT changing its hue.
 *
 * A premise the artist picked should not be thrown away over a contrast
 * failure — the hue is the decision, the lightness is not. So we walk
 * lightness away from the ground, keeping hue and saturation, until it
 * clears. Returns null if the hue genuinely cannot work on that ground,
 * which is a real answer and means the premise needs a different colour.
 */
export function liftAccentForGround(accent: string, ground: string, target = 3.0): string | null {
  if (contrastRatio(accent, ground) >= target) return accent;
  const a = hsl(accent);
  const groundIsDark = luminance(ground) < 0.18;
  const s = Math.max(a.s, 0.5);
  for (let step = 1; step <= 60; step++) {
    const l = groundIsDark ? Math.min(0.92, a.l + step * 0.01) : Math.max(0.12, a.l - step * 0.01);
    const cand = hslToHex(a.h, s, l);
    if (contrastRatio(cand, ground) >= target) return cand;
  }
  // try the other direction before giving up
  for (let step = 1; step <= 60; step++) {
    const l = groundIsDark ? Math.max(0.12, a.l - step * 0.01) : Math.min(0.94, a.l + step * 0.01);
    const cand = hslToHex(a.h, s, l);
    if (contrastRatio(cand, ground) >= target) return cand;
  }
  return null;
}

/**
 * Move 6 is "ONE saturated hue tied to the artist". It is about the PAIR,
 * not about the accent alone.
 *
 * The first version of this rule demanded a saturated accent unconditionally,
 * which is wrong and produced a genuinely bad outcome: on a vermilion ground,
 * the only cyan that reaches usable contrast is a washed-out ice blue. The
 * ground WAS the saturated hue, and the rule was fighting it.
 *
 * So: at least one of ground/accent must carry real saturation. When the
 * ground is the loud one, the accent's job is legibility, and a near-neutral
 * is the correct answer rather than a failure.
 */
export function assertOneHue(ground: string, accent: string): void {
  const g = hsl(ground), a = hsl(accent);
  const groundIsLoud = g.s >= 0.45 && g.l > 0.10 && g.l < 0.90;
  if (!groundIsLoud && a.s < 0.45) {
    throw new Error(`COLD OPEN refused the pair ground ${ground} / accent ${accent}: neither carries a saturated hue (ground ${(g.s * 100).toFixed(0)}%, accent ${(a.s * 100).toFixed(0)}%). Move 6 is ONE loud hue tied to the artist — one of these two has to be it.`);
  }
  if (a.l < 0.08 || a.l > 0.98) {
    throw new Error(`COLD OPEN refused accent "${accent}": lightness ${(a.l * 100).toFixed(0)}% is unusable against any ground.`);
  }
}

/** @deprecated kept for the premise gate, which judges an accent before a ground pairing is final */
export function assertAccentSaturated(hex: string): void {
  const { s, l } = hsl(hex);
  if (s < 0.45) throw new Error(`COLD OPEN refused accent "${hex}": saturation ${(s * 100).toFixed(0)}% — an accent standing alone must be loud. Minimum 45%.`);
  if (l < 0.10 || l > 0.96) throw new Error(`COLD OPEN refused accent "${hex}": lightness ${(l * 100).toFixed(0)}% is unusable against a ground.`);
}

/**
 * HUE DISCIPLINE.
 *
 * savv4x.com's config declares primary #FF1744, primary-dim #8a0a1a,
 * accent #FF4444, blood #DC143C, crimson #B22222 and ember #FF6B35. Six reds.
 * 100bandplan declares `--cyan: #3fd8ff`. One.
 *
 * Both blind judges picked savv4x as the machine-generated site. Six
 * near-identical reds is what a palette looks like when nobody decided — the
 * eye cannot separate #FF4444 from #FF1744, so the extra five buy nothing and
 * cost the only thing that would have read: commitment.
 *
 * A world may declare extra colours, but not extra colours that are secretly
 * the SAME colour. Anything within `minSeparation` degrees of the accent, at
 * comparable saturation, is a duplicate wearing a different name.
 */
export function assertHueDiscipline(
  accent: string,
  others: readonly string[],
  minSeparation = 25,
): void {
  const a = hsl(accent);
  const clashes = others.filter((c) => {
    const o = hsl(c);
    if (o.s < 0.25) return false;                       // a real neutral is fine
    const d = Math.abs(o.h - a.h);
    return Math.min(d, 360 - d) < minSeparation;
  });
  if (clashes.length) {
    throw new Error(
      `COLD OPEN refused the palette: ${clashes.length} colour(s) sit within ${minSeparation}° of the accent ${accent} — ${clashes.join(', ')}. ` +
      `They are the same hue under different names, which is what a palette looks like when nobody decided. Keep ONE and delete the rest.`,
    );
  }
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
  try { assertOneHue(w.palette.ground, w.palette.accent); } catch (e) { problems.push((e as Error).message); }

  const inkOnGround = contrastRatio(w.palette.ink, w.palette.ground);
  const accentOnGround = contrastRatio(w.palette.accent, w.palette.ground);
  if (inkOnGround < 4.5) problems.push(`body ink ${w.palette.ink} on ground ${w.palette.ground} is ${inkOnGround.toFixed(2)}:1 — below 4.5:1`);
  if (accentOnGround < 3) problems.push(`accent ${w.palette.accent} on ground ${w.palette.ground} is ${accentOnGround.toFixed(2)}:1 — below 3:1, it will read as faint`);

  /* THE MOVES ARE A PALETTE, NOT A CHECKLIST.
   *
   * This used to demand 6 of 7, which is stricter than the reference sites it
   * was derived from: only two of the five carry HUD chrome and only two state
   * a threshold. The winners average five to six; the site both judges picked
   * as machine-made carries three.
   *
   * So two are mandatory and the rest is a choice. A world that cannot name
   * itself is a layout; a world you do not cross into is a page. */
  const missingMoves = MOVES.filter(m => !w.moves.includes(m));
  if (!w.moves.includes('named_premise')) problems.push('no named premise — this is not a world, it is a layout');
  if (!w.moves.includes('threshold_ritual')) problems.push('no threshold ritual — the visitor never crosses anything');
  const optional = w.moves.filter(m => m !== 'named_premise' && m !== 'threshold_ritual').length;
  if (optional < 4) {
    problems.push(`only ${optional}/5 of the optional moves — the reference site that both blind judges picked as machine-made carried three. Four is the floor.`);
  }

  // the lexicon leak test: generic section names mean the world did not reach the copy
  const generic = ['contact', 'about', 'gallery', 'music', 'videos', 'home', 'work', 'portfolio', 'bio', 'news', 'shop', 'enter site', 'learn more', 'get in touch'];
  for (const [slot, word] of Object.entries(w.lexicon)) {
    if (generic.includes(String(word).toLowerCase().trim())) {
      problems.push(`lexicon.${slot} is "${word}" — a generic label. The world leaked. Name it from "${w.name}".`);
    }
  }

  if (w.moves.includes('sound_control') && !w.sound) problems.push('the world claims the sound move but carries no bed');

  for (const r of w.registers ?? []) {
    if (!r.evidenceId) {
      problems.push(`register "${r.code}" cites no evidence — a language toggle on an artist who does not work in that language is a costume`);
    } else if (ledger && !ledger.has(r.evidenceId)) {
      problems.push(`register "${r.code}" cites "${r.evidenceId}", which is not a verified fact`);
    }
    for (const [slot, word] of Object.entries(r.lexicon ?? {})) {
      if (generic.includes(String(word).toLowerCase().trim())) problems.push(`register ${r.code} lexicon.${slot} is "${word}" — generic`);
    }
  }
  if (!w.ground?.src) problems.push('no full-bleed ground media');
  if (!w.chrome?.docCode) problems.push('no document code — the HUD has nothing technical to say');

  /* PLACEHOLDERS ARE A BUILD ERROR.
   *
   * The starter world shipped with REPLACE ME in nine slots and built clean,
   * because no rule was looking for it. The first thing a stranger does is
   * copy that template and run it, and a green build on an unfilled template
   * teaches exactly the wrong lesson about what this thing checks. */
  const PLACEHOLDER = /\b(replace me|lorem ipsum|your artist|todo|tbd|xxx+|placeholder|example\.com)\b/i;
  const slots: [string, string][] = [
    ['name', w.name], ['logline', w.logline], ['artist', w.artist], ['domain', w.domain],
    ['threshold.label', w.threshold.label], ['threshold.reward', w.threshold.reward],
    ['chrome.docCode', w.chrome.docCode],
    ...Object.entries(w.lexicon).map(([k, v]) => [`lexicon.${k}`, String(v)] as [string, string]),
  ];
  const unfilled = slots.filter(([, v]) => PLACEHOLDER.test(v)).map(([k]) => k);
  if (unfilled.length) {
    problems.push(`${unfilled.length} slot(s) still hold placeholder text: ${unfilled.join(', ')}. A world is not a world until it is named.`);
  }

  if (ledger) {
    const missed = ledger.missed();
    if (missed.length) problems.push(`templates asked for ${missed.length} fact(s) not in the ledger: ${missed.join(', ')}`);
  }

  return { ok: problems.length === 0, moveCount: w.moves.length, missingMoves, problems, contrast: { inkOnGround, accentOnGround } };
}
