/**
 * COLD OPEN — the vision pass.
 *
 * WHY THIS EXISTS, from two cases that both went the same way.
 *
 * Street Bud, 2026-08-08. James floated a throwaway guess — "his chain's a
 * street light no or ? or idk just a thought" — buried mid-sentence, maximally
 * hedged. Checking the music videos frame by frame found the pendant
 * motion-blurred in every frame it appeared, and the answer came back "cannot
 * confirm". Wrong. A later sweep of his Instagram surfaced it immediately: a
 * repost card reading "THE DAY QUAVO PULLED UP ON STREET BUD WITH A NEW ICED
 * OUT STREET LIGHT", and he signs his own posts with the traffic-light emoji.
 * It became the endcap of the site.
 *
 * Shortiie Raw, 2026-08-21. Reading her bios produced "Toronto rapper". LOOKING
 * at her covers produced two irreconcilable visual eras — anime illustration
 * 2018-2021, Angola photography 2023-2025 — which is the actual premise, and
 * no amount of text would have said it.
 *
 * The rule both cases teach: TEXT TELLS YOU WHAT THEY SAY, IMAGES TELL YOU WHAT
 * THEY ARE. A premise generated from bios alone will be the median premise,
 * because bios are written to be unobjectionable.
 *
 * So this module gathers the artist's own imagery, samples the palette OUT of
 * it rather than picking one, and hands a contact sheet to a vision model with
 * a prompt aimed at motifs rather than adjectives.
 */

import { hsl, hslToHex, assertGroundAllowed, contrastRatio } from './world.ts';

export interface ImageRef {
  readonly url: string;
  /** where it came from, so a motif can be cited like any other fact */
  readonly sourceUrl: string;
  readonly kind: 'cover' | 'video-thumb' | 'press' | 'social';
  readonly label: string;
}

/* ------------------------------------------------------------------ */
/* GATHERING — keyless, from the artist's own surfaces                 */
/* ------------------------------------------------------------------ */

const UA = { 'User-Agent': 'coldopen/0.1 (+https://github.com/DareDev256/coldopen)' };

/** Every release cover Apple will hand over for an artist, at 600px. */
export async function coversFromItunes(artistId: string, limit = 24): Promise<ImageRef[]> {
  const url = `https://itunes.apple.com/lookup?id=${artistId}&entity=album&limit=${limit}`;
  const r = await fetch(url, { headers: UA });
  if (!r.ok) return [];
  const d: any = await r.json();
  return (d.results ?? [])
    .filter((x: any) => x.wrapperType === 'collection' && x.artworkUrl100)
    .map((x: any) => ({
      url: String(x.artworkUrl100).replace('100x100', '600x600'),
      sourceUrl: x.collectionViewUrl ?? url,
      kind: 'cover' as const,
      label: x.collectionName ?? 'release',
    }));
}

/** A video's own frame, which is often a better read than its cover. */
export function thumbsFromYouTube(ids: readonly string[]): ImageRef[] {
  return ids.map((id) => ({
    url: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
    sourceUrl: `https://www.youtube.com/watch?v=${id}`,
    kind: 'video-thumb' as const,
    label: id,
  }));
}

/* ------------------------------------------------------------------ */
/* SAMPLING — take the palette OUT of the work                         */
/* ------------------------------------------------------------------ */

export interface SampledHue {
  readonly hex: string;
  /** share of sampled pixels, 0..1 */
  readonly weight: number;
  readonly from: string;
}

/**
 * Dominant hues from an artist's own artwork.
 *
 * James, on the Ninjora wiki: "what about it feels AI-sloppy, maybe it's cause
 * it's lacking a colour theme." The diagnosis was right and the fix was not to
 * pick a nicer colour — it was to SAMPLE the colour from the subject. A palette
 * chosen by taste is a palette chosen from the median; a palette pulled out of
 * the artist's own covers can only look like them.
 *
 * Buckets by hue at usable saturation and lightness, so a cover that is 80%
 * black does not return black as the artist's colour. Ignores near-neutrals
 * entirely — they are the ground, not the hue.
 */
export function sampleHues(
  pixels: Uint8ClampedArray,
  from: string,
  opts: { buckets?: number; minSat?: number } = {},
): SampledHue[] {
  const buckets = opts.buckets ?? 18;              // 20° per bucket
  const minSat = opts.minSat ?? 0.28;
  const bins = new Array(buckets).fill(0).map(() => ({ n: 0, h: 0, s: 0, l: 0 }));
  let counted = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 200) continue;             // transparent
    const hex = `#${[pixels[i], pixels[i + 1], pixels[i + 2]]
      .map((v) => v.toString(16).padStart(2, '0')).join('')}`;
    const { h, s, l } = hsl(hex);
    if (s < minSat || l < 0.12 || l > 0.92) continue;   // neutral, crushed or blown
    const b = Math.min(buckets - 1, Math.floor((h / 360) * buckets));
    bins[b].n++; bins[b].h += h; bins[b].s += s; bins[b].l += l;
    counted++;
  }
  if (!counted) return [];

  return bins
    .filter((b) => b.n > 0)
    .map((b) => ({
      hex: hslToHex(b.h / b.n, Math.min(0.92, (b.s / b.n) * 1.12), Math.min(0.62, Math.max(0.4, b.l / b.n))),
      weight: b.n / counted,
      from,
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);
}

export interface PaletteProposal {
  readonly accent: string;
  readonly ground: string;
  readonly rationale: string;
  readonly sampledFrom: readonly string[];
}

/**
 * Turn sampled hues into a ground/accent pair the engine will actually accept.
 *
 * The accent is the artist's own dominant hue, pushed to real saturation. The
 * ground is either near-black or that same hue at low lightness, whichever
 * clears contrast — and it is checked against the cream ban before it is
 * offered, so a proposal can never be one the build would later refuse.
 */
export function proposePalette(hues: readonly SampledHue[]): PaletteProposal | null {
  const top = hues[0];
  if (!top) return null;
  const a = hsl(top.hex);
  const accent = hslToHex(a.h, Math.max(0.62, a.s), Math.min(0.62, Math.max(0.46, a.l)));

  const candidates = [
    hslToHex(a.h, Math.min(0.55, a.s), 0.07),      // the hue, taken almost to black
    '#05070A',                                      // the near-black both winners use
    hslToHex((a.h + 180) % 360, 0.7, 0.42),         // its opposite, as a loud ground
  ];
  for (const ground of candidates) {
    try { assertGroundAllowed(ground); } catch { continue; }
    if (contrastRatio(accent, ground) >= 3) {
      return {
        accent, ground,
        rationale: `Sampled from the artist's own artwork — ${(top.weight * 100).toFixed(0)}% of usable pixels sit in this hue. Not picked.`,
        sampledFrom: [...new Set(hues.map((h) => h.from))],
      };
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* LOOKING — the prompt, kept beside the reason it exists              */
/* ------------------------------------------------------------------ */

/**
 * What to ask a vision model about a contact sheet of an artist's work.
 *
 * Aimed at MOTIFS, not adjectives. "Edgy" and "gritty" are what a model says
 * when it has looked at nothing in particular; "a pendant shaped like a
 * streetlight, in three separate videos" is a premise.
 */
export function visionPrompt(artist: string, images: readonly ImageRef[]): string {
  return `You are looking at ${images.length} images of the artist ${artist} — their own covers, video frames and press shots. Nothing else about them is available to you, which is deliberate.

Answer ONLY from what is visibly in these frames.

1. RECURRING OBJECTS. Anything that appears in three or more frames: jewellery, a vehicle, a garment, a location, a gesture, a colour of hair. Name the object and the frames. This is the single most valuable thing you can find — a pendant that turns out to be shaped like a streetlight is a premise; "urban aesthetic" is not.

2. ERAS. Do the images split into distinct visual periods? If they do, describe each and say which frames belong to it. An artist whose covers change completely partway through has a story that no bio will state.

3. WHERE THIS IS. Real, specific places if you can see them — a named building, a coastline, a make of car, signage in a language. Say what you are reading it off.

4. WHAT IS ON THE ARTIST. Wardrobe, jewellery, hair, makeup, and what they hold. Concretely: "gold hoops, waist-length braids, a bottle held into the lens", never "confident styling".

5. THE CAMERA. Handheld or locked. Natural or graded. Wide or close. Drone or ground. This decides whether a site can use their footage as a full-bleed ground at all.

6. TYPE ON THEIR OWN COVERS. What faces do they already use, and is there a mark or wordmark that repeats?

7. THE ONE FRAME. If the site could only use a single image, which and why.

RULES. Never infer a fact that is not visible — no guessing a city from vibe, no guessing a year from film grain. Say "not visible" freely. Do not use the words edgy, gritty, vibrant, dynamic, or aesthetic; if one is the only word you have, describe what you are looking at instead.

FRAMES:
${images.map((im, i) => `  [${i + 1}] ${im.kind} · ${im.label} · ${im.url}`).join('\n')}`;
}
