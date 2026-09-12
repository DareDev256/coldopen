import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emitMeasureHead, measureCSP, emitGA4JS, assertMeasure } from '../src/emit/measure.ts';
import { emitVercelJson } from '../src/emit/index.ts';
import type { SiteContent } from '../src/emit/html.ts';

const base = { title: 't', description: 'd', canonical: 'https://x.com/', ogImage: '', figures: [], units: [], story: [], rail: { items: [] } as any, links: [] } as unknown as SiteContent;

test('an unmeasured world emits no tag and no widened CSP', () => {
  assert.equal(emitMeasureHead(base), '');
  const csp = JSON.parse(emitVercelJson({ palette: {} } as any, base)).headers[0].headers[0].value;
  assert.ok(!csp.includes('googletagmanager'));
});

test('a measured world emits config-before-loader and the GA origins, nothing inline', () => {
  const c = { ...base, measure: { ga4: 'G-ABCDEFGHIJ', searchConsole: 'tok' } };
  const head = emitMeasureHead(c);
  assert.ok(head.indexOf('js/ga4.js') < head.indexOf('gtag/js?id=G-ABCDEFGHIJ'));
  assert.ok(head.includes('google-site-verification'));
  assert.ok(!/<script>[^<]/.test(head), 'no inline script');
  const csp = JSON.parse(emitVercelJson({ palette: {} } as any, c)).headers[0].headers[0].value;
  assert.match(csp, /script-src 'self' https:\/\/www\.googletagmanager\.com/);
  assert.match(csp, /connect-src[^;]*google-analytics\.com/);
  assert.ok(emitGA4JS().includes("'contact_email'"));
});

test('a bad measurement id refuses the build', () => {
  assert.throws(() => assertMeasure({ ga4: 'UA-1234' }));
});
