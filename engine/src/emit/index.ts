import { emitCSS } from './css.ts';
import { emitSpatialCSS, type CaseShell } from './spatial.ts';
import { emitSpatialHTML, type SpatialExtras } from './spatial-html.ts';
import { emitSpatialJS } from './spatial-js.ts';
import { emitWebGLCSS, emitWebGLHTML, emitWebGLUIJS, type WebGLExtras } from './webgl.ts';
import fs from 'node:fs';
import path from 'node:path';
import { emitHTML, type SiteContent } from './html.ts';
import { emitJS } from './js.ts';
import { auditWorld, type World, type WorldAudit } from '../world.ts';
import type { Ledger } from '../ledger.ts';

export * from './html.ts';
export * from './spatial.ts';
export * from './webgl.ts';

export interface BuiltSite {
  readonly files: Record<string, string>;
  readonly audit: WorldAudit;
}

export function emitVercelJson(w: World): string {
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "media-src 'self' https:",
    "connect-src 'self' https:",
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
      'vercel.json': emitVercelJson(w),
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
      'vercel.json': emitVercelJson(w),
      'robots.txt': `User-agent: *\nAllow: /\nSitemap: ${c.canonical.replace(/\/$/, '')}/sitemap.xml\n`,
      'sitemap.xml': `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${c.canonical}</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url>\n</urlset>\n`,
      'world.json': JSON.stringify({ world: w, ledger: l.toJSON(), content: c, shell, panels: x.panels }, null, 2),
    },
    audit,
  };
}
