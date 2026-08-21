/**
 * COLD OPEN — artist discovery.
 *
 * "Type a name, find them everywhere, then ASK if it's the right person."
 *
 * The confirmation step is not politeness. Name collision in music is the
 * norm, not the exception, and a generator that silently picks the top search
 * hit will eventually build a site out of a stranger's discography. So the
 * engine surfaces candidates with enough evidence for a human to tell them
 * apart — a face, a genre, a real number, a most-recent release — and refuses
 * to proceed until one is picked.
 *
 * Every source here is keyless and public, so the studio runs for anyone who
 * clones the repo.
 */

export interface Candidate {
  readonly key: string;
  readonly name: string;
  readonly image?: string;
  readonly genre?: string;
  readonly country?: string;
  /** something countable, so two same-named artists are distinguishable */
  readonly signal?: { label: string; value: string };
  readonly latest?: { title: string; year: string };
  readonly links: { platform: string; url: string; id?: string }[];
  readonly sources: string[];
}

const UA = { 'User-Agent': 'coldopen/0.1 (+https://github.com/DareDev256/coldopen)' };

async function j(url: string, headers: Record<string, string> = {}): Promise<any> {
  // MusicBrainz rate-limits to 1 req/sec and will happily sit there. One slow
  // source must not hold up the other two — a partial answer now beats a
  // complete one the user gave up waiting for.
  const r = await fetch(url, { headers: { ...UA, ...headers }, signal: AbortSignal.timeout(6000), next: { revalidate: 300 } } as any);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

async function fromItunes(q: string): Promise<Candidate[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=musicArtist&limit=8`;
  const d = await j(url).catch(() => ({ results: [] }));
  return (d.results ?? []).map((a: any) => ({
    key: `apple:${a.artistId}`,
    name: a.artistName,
    genre: a.primaryGenreName,
    links: [{ platform: 'Apple Music', url: a.artistLinkUrl, id: String(a.artistId) }],
    sources: [url],
  }));
}

async function fromDeezer(q: string): Promise<Candidate[]> {
  const url = `https://api.deezer.com/search/artist?q=${encodeURIComponent(q)}&limit=8`;
  const d = await j(url).catch(() => ({ data: [] }));
  return (d.data ?? []).map((a: any) => ({
    key: `deezer:${a.id}`,
    name: a.name,
    image: a.picture_big ?? a.picture_medium,
    signal: { label: 'Deezer fans', value: String(a.nb_fan) },
    links: [{ platform: 'Deezer', url: a.link, id: String(a.id) }],
    sources: [url],
  }));
}

async function fromMusicBrainz(q: string): Promise<Candidate[]> {
  const url = `https://musicbrainz.org/ws/2/artist?query=${encodeURIComponent(q)}&fmt=json&limit=8`;
  const d = await j(url).catch(() => ({ artists: [] }));
  return (d.artists ?? []).map((a: any) => ({
    key: `mb:${a.id}`,
    name: a.name,
    country: a.country,
    genre: a.disambiguation,
    links: [{ platform: 'MusicBrainz', url: `https://musicbrainz.org/artist/${a.id}`, id: a.id }],
    sources: [url],
  }));
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Merge candidates that are obviously the same artist, keeping every source. */
export function merge(all: Candidate[]): Candidate[] {
  const out = new Map<string, Candidate>();
  for (const c of all) {
    const k = norm(c.name);
    const prev = out.get(k);
    if (!prev) { out.set(k, { ...c, key: k }); continue; }
    out.set(k, {
      ...prev,
      image: prev.image ?? c.image,
      genre: prev.genre ?? c.genre,
      country: prev.country ?? c.country,
      signal: prev.signal ?? c.signal,
      links: [...prev.links, ...c.links],
      sources: [...new Set([...prev.sources, ...c.sources])],
    });
  }
  return [...out.values()];
}

export async function discover(q: string): Promise<{ candidates: Candidate[]; searched: string[]; exact: Candidate | null }> {
  const settled = await Promise.allSettled([fromItunes(q), fromDeezer(q), fromMusicBrainz(q)]);
  const all = settled.flatMap(s => (s.status === 'fulfilled' ? s.value : []));
  const searched = ['itunes.apple.com', 'api.deezer.com', 'musicbrainz.org'];
  const merged = merge(all).sort((a, b) => {
    const ea = norm(a.name) === norm(q) ? 1 : 0, eb = norm(b.name) === norm(q) ? 1 : 0;
    if (ea !== eb) return eb - ea;
    return b.links.length - a.links.length;
  });
  // "exact" means every source agreed on the name — still shown for confirmation,
  // never auto-selected.
  const top = merged[0];
  const exact = top && norm(top.name) === norm(q) && top.links.length >= 2 ? top : null;
  return { candidates: merged.slice(0, 8), searched, exact };
}
