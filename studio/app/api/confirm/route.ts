/**
 * Turn a confirmed artist into a fact ledger.
 *
 * Only what a keyless public endpoint can actually prove goes in as a fact.
 * Everything a site normally brags about but we cannot read — monthly
 * listeners, follower counts behind a login — is SEALED rather than guessed,
 * and the studio shows it as a redaction so the gap is visible instead of
 * silently filled.
 */
import { Ledger } from '../../../../engine/src/ledger.ts';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const c = await req.json();
  const today = new Date().toISOString().slice(0, 10);
  const l = new Ledger();

  l.add({ id: 'artist.name', kind: 'text', value: c.name, label: 'BILLED AS', format: 'none',
    sourceUrl: c.links?.[0]?.url ?? c.sources?.[0], verifiedAt: today,
    note: 'the DSP spelling — never our stylisation' });

  for (const link of c.links ?? []) {
    l.add({ id: `link.${link.platform.toLowerCase().replace(/\W+/g, '')}`, kind: 'link', value: link.url,
      label: `${link.platform.toUpperCase()} PROFILE`, format: 'none', sourceUrl: link.url, verifiedAt: today });
  }
  if (c.genre) l.add({ id: 'artist.genre', kind: 'text', value: c.genre, label: 'GENRE', format: 'none',
    sourceUrl: c.sources?.[0] ?? c.links?.[0]?.url, verifiedAt: today });
  if (c.signal) l.add({ id: 'signal.primary', kind: 'count', value: Number(c.signal.value) || c.signal.value,
    label: c.signal.label.toUpperCase(), sourceUrl: c.sources?.find((s: string) => s.includes('deezer')) ?? c.sources?.[0], verifiedAt: today });

  // the honest gaps
  l.seal({ id: 'spotify.monthly_listeners', label: 'SPOTIFY MONTHLY LISTENERS',
    reason: 'Spotify does not expose this on a keyless endpoint — it has to be read off the artist page by a human and entered with the date',
    unblockedBy: 'a screenshot or a reading of open.spotify.com/artist/… with today\'s date' });
  l.seal({ id: 'instagram.followers', label: 'INSTAGRAM FOLLOWERS',
    reason: 'Instagram blocks automated reads; a number from a search-index snippet is not a primary source',
    unblockedBy: 'the count read off the profile, dated' });

  return Response.json({ facts: l.all(), sealed: l.allSealed() });
}
