import { emitCSS } from './css.ts';
import { emitHTML, type SiteContent } from './html.ts';
import { emitJS } from './js.ts';
import { auditWorld, type World, type WorldAudit } from '../world.ts';
import type { Ledger } from '../ledger.ts';

export * from './html.ts';

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
    "frame-src https://www.youtube-nocookie.com https://open.spotify.com",
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
export function build(w: World, c: SiteContent, l: Ledger, opts: { force?: boolean } = {}): BuiltSite {
  const html = emitHTML(w, c, l);           // run first: it records ledger misses
  const audit = auditWorld(w, l);
  if (!audit.ok && !opts.force) throw new BuildRefused(audit);
  return {
    files: {
      'index.html': html,
      'css/style.css': emitCSS(w),
      'js/main.js': emitJS(w),
      'vercel.json': emitVercelJson(w),
      'robots.txt': `User-agent: *\nAllow: /\nSitemap: ${c.canonical.replace(/\/$/, '')}/sitemap.xml\n`,
      'sitemap.xml': `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${c.canonical}</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url>\n</urlset>\n`,
      'world.json': JSON.stringify({ world: w, ledger: l.toJSON(), content: c }, null, 2),
    },
    audit,
  };
}
