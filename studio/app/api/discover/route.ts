import { discover } from '../../../lib/discover.ts';
export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q') ?? '';
  if (!q.trim()) return Response.json({ candidates: [], searched: [], exact: null });
  try { return Response.json(await discover(q)); }
  catch (e: any) { return Response.json({ error: e.message, candidates: [], searched: [] }, { status: 500 }); }
}
