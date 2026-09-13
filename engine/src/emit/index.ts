import { emitCSS } from './css.ts';
import { emitSpatialCSS, type CaseShell } from './spatial.ts';
import { emitSpatialHTML, type SpatialExtras } from './spatial-html.ts';
import { emitSpatialJS } from './spatial-js.ts';
import { emitWebGLCSS, emitWebGLHTML, emitWebGLUIJS, type WebGLExtras } from './webgl.ts';
import fs from 'node:fs';
import path from 'node:path';
import { emitHTML, type SiteContent } from './html.ts';
import { emitJS } from './js.ts';
import { assertMeasure, emitGA4JS, emitSearchConsoleFiles, measureCSP } from './measure.ts';
import { auditWorld, type World, type WorldAudit } from '../world.ts';
import type { Ledger } from '../ledger.ts';

export * from './html.ts';
export * from './spatial.ts';
export * from './webgl.ts';

export interface BuiltSite {
  readonly files: Record<string, string>;
  readonly audit: WorldAudit;
}

/**
 * A favicon every world gets for free, derived from the world's own tokens —
 * never invented. Ground and accent are the palette this exact site already
 * committed to (the one-hue rule enforced elsewhere in this engine), and the
 * glyph is the first letter of the artist as billed, not a stylisation.
 *
 * This is why no world needs to supply its own icon file: a browser tab or
 * bookmark showing a blank/generic icon was a real defect (shortiieraw.com
 * 404'd on /favicon.ico), and it was an ENGINE gap — no emitter ever wrote a
 * favicon or linked one, so every world built by this engine had it.
 */
export function emitFaviconSVG(w: World): string {
  const letter = (w.artist || w.name || '?').trim().charAt(0).toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
    `<rect width="64" height="64" rx="14" fill="${w.palette.ground}" />` +
    `<text x="32" y="34" text-anchor="middle" dominant-baseline="central" ` +
    `font-family="ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif" ` +
    `font-weight="700" font-size="34" fill="${w.palette.accent}">${letter}</text>` +
    `</svg>\n`;
}

const esc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function hostOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

/**
 * The three origins this engine's own CSP (below) opens frame-src for, in
 * human terms — kept as one list so the privacy page can never drift from
 * what the CSP actually allows to load in an iframe.
 */
const EMBED_ORIGINS: readonly { host: string; note: string }[] = [
  { host: 'YouTube', note: 'via youtube-nocookie.com, which does not set tracking cookies until playback starts' },
  { host: 'Spotify', note: 'via open.spotify.com' },
  { host: 'Instagram', note: 'via instagram.com, for the artist’s own posts and reels' },
];

/**
 * A branded 404 every world gets for free, built ONLY from the world's own
 * tokens and content — never invented copy. Same reasoning as the favicon:
 * a visitor hitting a dead link on a named-premise site should not land on a
 * blank Vercel/Not Found page that breaks the world it just crossed into.
 *
 * Vercel serves this automatically for a static (non-cleanUrls) deploy —
 * nothing else needs wiring for it to work once it exists in the output.
 */
export function emit404(w: World, c: SiteContent): string {
  const cta = c.links.find(k => /instagram\.com/i.test(k.href)) ?? c.links[0];
  const families = [...new Set([w.type.display.google, w.type.text.google, w.type.mono.google])].join('&family=');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>404 — ${esc(w.name)}</title>
<link rel="icon" href="favicon.svg" type="image/svg+xml" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=${families}&display=swap" rel="stylesheet" />
<style>
  :root{ --ground:${w.palette.ground}; --ink:${w.palette.ink}; --accent:${w.palette.accent}; --muted:${w.palette.muted}; }
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;background:var(--ground);min-height:100%}
  body{display:flex;align-items:center;justify-content:center;min-height:100vh;
    font-family:'${w.type.text.family}',system-ui,sans-serif;color:var(--ink);text-align:center;
    padding:2rem;overflow-x:hidden}
  .wrap{max-width:32rem}
  .code{font-family:'${w.type.mono.family}',monospace;font-size:.7rem;letter-spacing:.2em;
    color:var(--muted);text-transform:uppercase;margin:0 0 1rem}
  h1{font-family:'${w.type.display.family}',sans-serif;font-weight:900;
    font-size:clamp(3rem,10vw,6rem);line-height:1;margin:0 0 1rem;color:var(--accent);
    text-transform:uppercase;letter-spacing:-.02em}
  p{font-size:1rem;line-height:1.5;opacity:.82;margin:0 0 2rem}
  .links{display:flex;gap:1.25rem;justify-content:center;flex-wrap:wrap;
    font-family:'${w.type.mono.family}',monospace;font-size:.72rem;letter-spacing:.05em;text-transform:uppercase}
  a{color:var(--ink);text-decoration:none;border-bottom:1px solid var(--muted);padding-bottom:2px}
  a:hover{color:var(--accent);border-color:var(--accent)}
</style>
</head>
<body>
  <div class="wrap">
    <p class="code">${esc(w.chrome.docCode)} · 404</p>
    <h1>Not here</h1>
    <p>This page does not exist in ${esc(w.name)}.</p>
    <div class="links">
      <a href="/">Back to the site</a>
      ${cta ? `<a href="${esc(cta.href)}" target="_blank" rel="noopener">${esc(cta.label)}</a>` : ''}
    </div>
  </div>
</body>
</html>
`;
}

/**
 * A privacy page every world gets for free, drawn only from what the engine
 * and this world actually emit: the rail's real fields and endpoint, GA4 only
 * when `c.measure` is set, and the exact three origins the engine's own CSP
 * opens frame-src for (kept in sync via EMBED_ORIGINS, above). Jurisdiction
 * is Ontario/PIPEDA as the engine default — every world built with this
 * engine so far is a James Dare / Ontario-based project, and there is no
 * per-world jurisdiction field to read instead.
 */
export function emitPrivacy(w: World, c: SiteContent): string {
  const contact = c.rail.fallbackEmail
    ? { label: c.rail.fallbackEmail, href: `mailto:${c.rail.fallbackEmail}` }
    : c.links.find(k => /instagram\.com/i.test(k.href));
  const updated = new Date().toISOString().slice(0, 10);
  const fields = c.rail.fields.map(f => f.label.toLowerCase()).join(', ');
  const formHost = hostOf(c.rail.endpoint);
  const families = [...new Set([w.type.display.google, w.type.text.google, w.type.mono.google])].join('&family=');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Privacy — ${esc(w.name)}</title>
<link rel="icon" href="favicon.svg" type="image/svg+xml" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=${families}&display=swap" rel="stylesheet" />
<style>
  :root{ --ground:${w.palette.ground}; --ink:${w.palette.ink}; --accent:${w.palette.accent}; --muted:${w.palette.muted}; }
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;background:var(--ground);color:var(--ink);overflow-x:hidden}
  body{font-family:'${w.type.text.family}',system-ui,sans-serif;line-height:1.6}
  main{max-width:40rem;margin:0 auto;padding:4rem 1.5rem 6rem}
  .code{font-family:'${w.type.mono.family}',monospace;font-size:.7rem;letter-spacing:.2em;
    color:var(--muted);text-transform:uppercase;margin:0 0 1.5rem}
  h1{font-family:'${w.type.display.family}',sans-serif;font-weight:900;text-transform:uppercase;
    letter-spacing:-.01em;color:var(--accent);font-size:clamp(2rem,6vw,3rem);margin:0 0 2rem}
  h2{font-family:'${w.type.display.family}',sans-serif;font-weight:700;text-transform:uppercase;
    font-size:1rem;letter-spacing:.04em;margin:2.5rem 0 .75rem;color:var(--ink)}
  p{margin:0 0 1rem;opacity:.88}
  a{color:var(--ink);border-bottom:1px solid var(--muted);text-decoration:none}
  a:hover{color:var(--accent);border-color:var(--accent)}
  .meta{margin-top:3rem;font-family:'${w.type.mono.family}',monospace;font-size:.7rem;
    letter-spacing:.05em;text-transform:uppercase;color:var(--muted)}
  .back{display:inline-block;margin-bottom:2rem;font-family:'${w.type.mono.family}',monospace;
    font-size:.72rem;letter-spacing:.05em;text-transform:uppercase}
</style>
</head>
<body>
<main>
  <a class="back" href="/">← Back to the site</a>
  <p class="code">${esc(w.chrome.docCode)} · Privacy</p>
  <h1>Privacy</h1>

  <p>${esc(w.artist)}'s website (${esc(hostOf(c.canonical))}) is a small artist site operated in Ontario, Canada. Personal information collected here is handled under Canada's Personal Information Protection and Electronic Documents Act (PIPEDA). This page states what the site collects, why, and how to ask about it — nothing here is estimated or assumed.</p>

  <h2>The contact form</h2>
  <p>The form on this site asks for ${esc(fields || 'your contact details and message')}. Submitting it sends that information to ${esc(formHost)}, a third-party form-delivery service, which forwards it by email to the address ${esc(w.artist)} checks. It is used only to reply to that request — not for marketing, and not shared beyond that one email.</p>

  ${c.measure ? `<h2>Analytics</h2>
  <p>This site uses Google Analytics (GA4) to count visits and see which links get used, with IP anonymisation on. GA4 sets a small number of cookies to tell repeat visits apart; no cross-site advertising profile is built from this site, and nothing is sold. Google's own privacy policy governs what Google does with that data afterward.</p>` : ''}

  <h2>Embedded content</h2>
  <p>Some panels on this site load video or profile content directly from other services when you open them: ${EMBED_ORIGINS.map(e => `${esc(e.host)} (${esc(e.note)})`).join(', ')}. When one of those loads, that company can see the page was viewed, under its own privacy policy — this site adds no tracking of its own on top of that.</p>

  <h2>What this site does not do</h2>
  <p>There are no user accounts, no passwords, and no payment or checkout on this domain.</p>

  <h2>Your rights</h2>
  <p>Under PIPEDA you can ask what was collected about you, ask for it to be corrected, or ask for a form submission to be deleted.${contact ? ` Reach out at <a href="${esc(contact.href)}"${/^https?:/i.test(contact.href) ? ' target="_blank" rel="noopener"' : ''}>${esc(contact.label)}</a>.` : ''}</p>

  <p class="meta">Last updated ${updated}</p>
</main>
</body>
</html>
`;
}

export function emitVercelJson(w: World, c?: SiteContent): string {
  const m = measureCSP(c ?? ({} as SiteContent));
  const csp = [
    "default-src 'self'",
    `script-src 'self'${m.script}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    `img-src 'self' data: https:${m.img}`,
    "media-src 'self' https:",
    `connect-src 'self' https:${m.connect}`,
    // instagram.com is here for the artist's OWN post embeds — the sanctioned
    // display surface, which keeps attribution and takedowns with her
    "frame-src https://www.youtube-nocookie.com https://open.spotify.com https://www.instagram.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self' https:",
  ].join('; ');
  return JSON.stringify({
    headers: [{
      source: '/(.*)',
      headers: [
        { key: 'Content-Security-Policy', value: csp },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
      ],
    }],
  }, null, 2);
}

export class BuildRefused extends Error {
  readonly audit: WorldAudit;
  constructor(audit: WorldAudit) {
    super(`COLD OPEN refused to build:\n  - ${audit.problems.join('\n  - ')}`);
    this.name = 'BuildRefused';
    this.audit = audit;
  }
}

/**
 * Build the site. The audit runs BEFORE emission and refuses rather than
 * shipping a world that reads as a template — that refusal is the product.
 */
export function build(w: World, c: SiteContent, l: Ledger, opts: { force?: boolean; shell?: CaseShell; webgl?: WebGLExtras; spatial?: SpatialExtras } = {}): BuiltSite {
  // A feed post Instagram refuses to embed renders from its poster. Without
  // one the tile is an empty box, and an empty box passes every check that
  // does not look at the page — so refuse it here instead.
  for (const f of [...(opts.spatial?.feed ?? []), ...(opts.webgl?.feed ?? [])]) {
    if (f.embeddable === false && !f.poster) {
      throw new Error(`feed post ${f.id} is marked not embeddable but carries no poster — it would render as an empty tile`);
    }
  }
  assertMeasure(c.measure);
  if (opts.webgl && opts.shell) return buildWebGL(w, c, l, opts.shell, opts.webgl, opts);
  // Topology decides the emitter, not a flag. A spatial world is an OBJECT
  // that opens; the others are documents. Same ledger, same rail, same
  // SOURCES table underneath either way.
  const spatial = !!opts.shell;
  const html = spatial
    ? emitSpatialHTML(w, c, l, opts.shell!, opts.spatial ?? {})
    : emitHTML(w, c, l);                    // run first: it records ledger misses
  const audit = auditWorld(w, l);
  if (!audit.ok && !opts.force) throw new BuildRefused(audit);
  return {
    files: {
      'index.html': html,
      'css/style.css': spatial ? emitSpatialCSS(w, opts.shell!) : emitCSS(w),
      'js/main.js': spatial ? emitSpatialJS(w) : emitJS(w),
      'favicon.svg': emitFaviconSVG(w),
      '404.html': emit404(w, c),
      'privacy.html': emitPrivacy(w, c),
      'vercel.json': emitVercelJson(w, c),
      ...(c.measure ? { 'js/ga4.js': emitGA4JS() } : {}),
      ...emitSearchConsoleFiles(c),
      'robots.txt': `User-agent: *\nAllow: /\nSitemap: ${c.canonical.replace(/\/$/, '')}/sitemap.xml\n`,
      'sitemap.xml': `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${c.canonical}</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url>\n</urlset>\n`,
      'world.json': JSON.stringify({ world: w, ledger: l.toJSON(), content: c }, null, 2),
    },
    audit,
  };
}


/**
 * The rendered build. Three vendored files ride along so the page needs no CDN
 * and the CSP stays script-src 'self' — a 3D hero is not worth loosening a
 * content policy for.
 */
function buildWebGL(w: World, c: SiteContent, l: Ledger, shell: CaseShell, x: WebGLExtras, opts: { force?: boolean }): BuiltSite {
  const html = emitWebGLHTML(w, c, l, shell, x);
  const audit = auditWorld(w, l);
  if (!audit.ok && !opts.force) throw new BuildRefused(audit);

  const here = path.dirname(new URL(import.meta.url).pathname);
  const runtime = path.resolve(here, '../../runtime');
  const read = (p: string) => fs.readFileSync(path.join(runtime, p), 'utf8');

  return {
    files: {
      'index.html': html,
      'css/style.css': emitWebGLCSS(w, shell),
      'js/ui.js': emitWebGLUIJS(w),
      'js/scene.js': read('webgl-scene.js'),
      'js/vendor/three.module.min.js': read('vendor/three.module.min.js'),
      'js/vendor/three.core.min.js': read('vendor/three.core.min.js'),
      'favicon.svg': emitFaviconSVG(w),
      '404.html': emit404(w, c),
      'privacy.html': emitPrivacy(w, c),
      'vercel.json': emitVercelJson(w, c),
      ...(c.measure ? { 'js/ga4.js': emitGA4JS() } : {}),
      ...emitSearchConsoleFiles(c),
      'robots.txt': `User-agent: *\nAllow: /\nSitemap: ${c.canonical.replace(/\/$/, '')}/sitemap.xml\n`,
      'sitemap.xml': `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${c.canonical}</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url>\n</urlset>\n`,
      'world.json': JSON.stringify({ world: w, ledger: l.toJSON(), content: c, shell, panels: x.panels }, null, 2),
    },
    audit,
  };
}
