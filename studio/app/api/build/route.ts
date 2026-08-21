import { Ledger } from '../../../../engine/src/ledger.ts';
import { derive } from '../../../../engine/src/derive.ts';
import { build, BuildRefused } from '../../../../engine/src/emit/index.ts';
import fs from 'node:fs';
import path from 'node:path';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { premise, artist, facts, sealed } = await req.json();
  const l = Ledger.fromJSON({ facts, sealed });

  const world = derive({
    premise, artist: artist?.name ?? 'ARTIST',
    domain: 'localhost',
    ground: { kind: 'image', src: artist?.image ?? '', treatment: ['grain', 'vignette'] },
  });

  const content = {
    title: `${world.artist} — ${world.name}`,
    description: world.logline,
    canonical: `https://${world.domain}/`,
    ogImage: artist?.image ?? '',
    figures: l.all().filter(f => f.kind === 'count').map(f => f.id).concat(l.allSealed().map(s => s.id)),
    units: [], story: [world.logline],
    rail: { endpoint: '/api/noop', fields: [{ name: 'email', label: 'EMAIL', type: 'email' as const, required: true }], submitLabel: world.lexicon.contact },
    links: (l.all().filter(f => f.kind === 'link')).map(f => ({ label: f.label.replace(' PROFILE', ''), href: String(f.value) })),
  };

  try {
    const out = build(world, content, l, { force: true });
    const dir = path.join(process.cwd(), 'public', 'preview', world.id);
    for (const [rel, body] of Object.entries(out.files)) {
      const p = path.join(dir, rel);
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, body);
    }
    return Response.json({ audit: out.audit, previewUrl: `/preview/${world.id}/index.html` });
  } catch (e: any) {
    if (e instanceof BuildRefused) return Response.json({ audit: e.audit, error: e.message }, { status: 422 });
    return Response.json({ error: e.message }, { status: 500 });
  }
}
