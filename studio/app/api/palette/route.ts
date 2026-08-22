/**
 * Look at the artist's own artwork and propose a palette from it.
 *
 * This is the route that makes `engine/src/vision.ts` reachable. Until now that
 * module was built, tested, and imported by nothing — the studio asked the
 * artist to describe a colour instead of reading one off their covers.
 *
 * The rule it exists to enforce: a palette chosen by taste is a palette chosen
 * from the median. A palette pulled out of the artist's own covers can only look
 * like them. Validated on Shortiie Raw — sampling her *Sip Cuca* cover returned
 * #E5CA0A at 80% of usable pixels, the same yellow that had been hand-picked
 * hours earlier by eye.
 *
 * `proposePalette` never offers a pair the build would refuse, so a proposal
 * from here cannot fail the cream ban or the contrast gate downstream.
 */
import sharp from 'sharp';
import {
  coversFromItunes,
  thumbsFromYouTube,
  sampleHues,
  proposePalette,
  type ImageRef,
  type SampledHue,
} from '../../../../engine/src/vision.ts';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Decoding is the slow part; more than this buys accuracy nobody can see. */
const MAX_IMAGES = 10;
const EDGE = 160; // downscale before sampling — hue survives it, time does not

async function pixels(url: string): Promise<Uint8ClampedArray | null> {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'coldopen/0.1' } });
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    const { data } = await sharp(buf)
      .resize(EDGE, EDGE, { fit: 'inside', withoutEnlargement: true })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    return new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength);
  } catch {
    return null;                       // one unreadable cover is not a failure
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const appleArtistId: string | undefined = body.appleArtistId;
  const youtubeIds: string[] = Array.isArray(body.youtubeIds) ? body.youtubeIds : [];

  let refs: ImageRef[] = [];
  if (appleArtistId) refs = refs.concat(await coversFromItunes(String(appleArtistId)));
  if (youtubeIds.length) refs = refs.concat(thumbsFromYouTube(youtubeIds));

  if (!refs.length) {
    return Response.json(
      { proposal: null, sampled: [], note: 'No artwork reachable for this artist. A palette is not guessed here — it is sampled or it is not offered.' },
      { status: 200 },
    );
  }

  const picked = refs.slice(0, MAX_IMAGES);
  const settled = await Promise.all(
    picked.map(async (ref) => {
      const px = await pixels(ref.url);
      if (!px) return null;
      const hues = sampleHues(px, ref.sourceUrl);
      return hues.length ? { ref, hues } : null;
    }),
  );
  const read = settled.filter(Boolean) as { ref: ImageRef; hues: SampledHue[] }[];

  if (!read.length) {
    return Response.json(
      { proposal: null, sampled: [], note: `Found ${refs.length} images but none carried a usable hue — all neutral, crushed or blown.` },
      { status: 200 },
    );
  }

  // DO NOT merge across the catalogue. Averaging ten covers regresses to the
  // median, which is the exact failure this module exists to avoid — the first
  // run of this route returned a hue holding 19% of pixels while individual
  // covers were sitting at 68% and 71%. A blended palette is a taste palette
  // wearing a measurement's clothes.
  //
  // Rank by how hard a SINGLE cover commits to a hue. The artist's colour is
  // the one a record of theirs is already drenched in, and it stays citable to
  // that one record.
  const candidates = read
    .map(({ ref, hues }) => ({ ref, hue: hues[0]! }))
    .filter((c) => c.hue)
    .sort((a, b) => b.hue.weight - a.hue.weight);

  // Distinct hues only — two covers in the same 40 degrees are one option.
  const distinct: typeof candidates = [];
  for (const c of candidates) {
    if (distinct.some((d) => Math.abs(hueOf(d.hue.hex) - hueOf(c.hue.hex)) < 40)) continue;
    distinct.push(c);
  }

  const top = distinct[0];
  const proposal = top ? proposePalette([top.hue]) : null;

  return Response.json({
    proposal,
    from: top ? { label: top.ref.label, sourceUrl: top.ref.sourceUrl, share: Math.round(top.hue.weight * 100) } : null,
    // every other hue an artwork commits to, each citable to the one record it
    // came from — the artist picks, the model does not average on their behalf
    alternates: distinct.slice(1, 5).map((c) => ({
      accent: proposePalette([c.hue])?.accent ?? c.hue.hex,
      ground: proposePalette([c.hue])?.ground ?? null,
      label: c.ref.label,
      sourceUrl: c.ref.sourceUrl,
      share: Math.round(c.hue.weight * 100),
    })),
    sampledCount: read.length,
    of: refs.length,
    sampled: read.map(({ ref, hues }) => ({
      url: ref.url,
      label: ref.label,
      sourceUrl: ref.sourceUrl,
      kind: ref.kind,
      top: hues[0]?.hex ?? null,
      share: hues[0] ? Math.round(hues[0].weight * 100) : 0,
    })),
  });
}

/** hue in degrees from a hex, without importing the engine's private helper */
function hueOf(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (!d) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}
