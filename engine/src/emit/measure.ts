/**
 * Measurement: GA4 + Search Console, emitted only when a world asks for it.
 *
 * Why a self-hosted js/ga4.js and not Google's inline snippet: every world ships
 * `script-src 'self'`. Google's snippet is an inline <script>, which would force
 * 'unsafe-inline' and undo the CSP for every other script on the page. Serving
 * the same config from our own origin means the CSP only has to allow
 * googletagmanager.com as a SOURCE, never inline execution.
 *
 * Why contact events: GA4's enhanced measurement counts outbound http links
 * and nothing else. A mailto:, a tel:, a WhatsApp tap — the only things an
 * artist site exists to produce — were invisible. 2026-09-12, estate-wide.
 */
import type { SiteContent } from './html.ts';

export interface Measure {
  /** GA4 measurement id, G-XXXXXXXXXX. One property per site, never shared. */
  readonly ga4: string;
  /** Search Console HTML-tag token (the content= value). Account-wide. */
  readonly searchConsole?: string;
}

const esc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function assertMeasure(m: Measure | undefined): void {
  if (!m) return;
  if (!/^G-[A-Z0-9]{6,12}$/.test(m.ga4)) throw new Error(`measure.ga4 is not a GA4 measurement id: ${m.ga4}`);
}

/** Goes in <head>, after <link rel="canonical">. Config first, loader second — Google's own order. */
export function emitMeasureHead(c: SiteContent): string {
  const m = c.measure;
  if (!m) return '';
  return [
    m.searchConsole ? `<meta name="google-site-verification" content="${esc(m.searchConsole)}" />` : '',
    `<script src="js/ga4.js" data-ga="${esc(m.ga4)}"></script>`,
    `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(m.ga4)}"></script>`,
  ].filter(Boolean).join('\n');
}

/** Extra CSP origins a measured world needs. Empty for an unmeasured one. */
export function measureCSP(c: SiteContent): { script: string; connect: string; img: string } {
  if (!c.measure) return { script: '', connect: '', img: '' };
  return {
    script: ' https://www.googletagmanager.com',
    connect: ' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com',
    img: ' https://www.google-analytics.com https://*.google-analytics.com',
  };
}

export function emitGA4JS(): string {
  return `/* GA4 bootstrap + contact-intent events. Self-hosted so the CSP never needs
   'unsafe-inline'. The measurement id arrives on the script tag as data-ga. */
(function () {
  var ID = document.currentScript && document.currentScript.getAttribute('data-ga');
  if (!ID) return;
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', ID, { anonymize_ip: true });

  function sent(name, params) { try { gtag('event', name, params || {}); } catch (_e) {} }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var label = (a.textContent || a.getAttribute('aria-label') || '').trim().slice(0, 60);
    if (/^mailto:/i.test(href)) return sent('contact_email', { label: label });
    if (/^tel:/i.test(href)) return sent('contact_phone', { label: label });
    if (/^sms:/i.test(href)) return sent('contact_sms', { label: label });
    if (/wa\\.me|api\\.whatsapp\\.com/i.test(href)) return sent('contact_whatsapp', { label: label });
    if (/instagram\\.com\\/direct/i.test(href)) return sent('contact_instagram_dm', { label: label });
    if (/instagram\\.com/i.test(href)) return sent('outbound_instagram', { label: label });
    if (/spotify\\.com|music\\.apple\\.com|youtube\\.com|youtu\\.be|soundcloud\\.com/i.test(href)) return sent('outbound_listen', { label: label, url: href });
    if (/^https?:/i.test(href) && href.indexOf(location.hostname) === -1) return sent('outbound_click', { label: label, url: href });
  }, { passive: true, capture: true });
  document.addEventListener('submit', function (e) {
    var f = e.target; if (!f || f.tagName !== 'FORM') return;
    sent('contact_form_submit', { form: f.id || f.getAttribute('name') || f.getAttribute('action') || 'form' });
  }, { passive: true, capture: true });
})();
`;
}
