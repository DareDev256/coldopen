import type { World } from '../world.ts';
import { Ledger, renderValue } from '../ledger.ts';

export interface Unit {
  readonly title: string;
  readonly sub?: string;
  readonly href: string;
  readonly image: string;
  /** ledger id proving this item exists where we say it does */
  readonly sourceId?: string;
}

export interface Climax {
  readonly stamp: string;
  readonly title: string;
  readonly sub: string;
  readonly href?: string;
}

export interface Rail {
  /** POST endpoint that actually delivers. A mailto alone is not a rail. */
  readonly endpoint: string;
  readonly fields: readonly { name: string; label: string; type: 'text' | 'email' | 'tel' | 'textarea' | 'select'; required?: boolean; options?: readonly string[] }[];
  readonly submitLabel: string;
  /** the fallback shown under the form — never the only path */
  readonly fallbackEmail?: string;
}

export interface SiteContent {
  readonly title: string;
  readonly description: string;
  readonly canonical: string;
  readonly ogImage: string;
  /** ledger ids to render as the live-number flex, in order */
  readonly figures: readonly string[];
  readonly units: readonly Unit[];
  readonly climax?: Climax;
  readonly story: readonly string[];
  readonly rail: Rail;
  readonly links: readonly { label: string; href: string }[];
  readonly jsonLd?: Record<string, unknown>;
}

const esc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function figure(l: Ledger, id: string): string {
  const f = l.get(id);
  if (f) {
    const v = renderValue(f);
    const host = (() => { try { return new URL(f.sourceUrl).hostname.replace('www.', ''); } catch { return 'source'; } })();
    return `      <div class="fig">
        <a class="src mono" href="${esc(f.sourceUrl)}" target="_blank" rel="noopener" title="Verified ${esc(f.verifiedAt)} — ${esc(f.sourceUrl)}">${esc(host)} ↗</a>
        <b data-count="${typeof f.value === 'number' ? f.value : ''}">${esc(v)}</b>
        <span class="fl">${esc(f.label)}</span>
      </div>`;
  }
  const s = l.sealedClaim(id);
  if (s) {
    // The move James invented: the site admits it is holding something back
    // rather than inventing a number to fill the slot.
    return `      <div class="fig sealed" title="${esc(s.reason)}">
        <b><span class="bar" aria-hidden="true"></span><span class="sr-only">withheld</span></b>
        <span class="fl">${esc(s.label)} · UNVERIFIED</span>
      </div>`;
  }
  return '';
}

export function emitHTML(w: World, c: SiteContent, l: Ledger): string {
  const families = [w.type.display.google, w.type.text.google, w.type.mono.google];
  const g = [...new Set(families)].join('&family=');
  const lex = w.lexicon;
  const groundTag = w.ground.kind === 'video'
    ? `<video class="co-ground" src="${esc(w.ground.src)}" ${w.ground.poster ? `poster="${esc(w.ground.poster)}"` : ''} muted playsinline preload="auto" autoplay loop></video>`
    : `<img class="co-ground" src="${esc(w.ground.src)}" alt="" />`;

  const gestureCopy: Record<string, string> = {
    scroll: 'SCROLL', hold: 'HOLD', drag: 'DRAG', press: 'PRESS', turn: 'TURN',
  };

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>${esc(c.title)}</title>
<meta name="description" content="${esc(c.description)}" />
<meta name="theme-color" content="${w.palette.ground}" />
<link rel="canonical" href="${esc(c.canonical)}" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<meta property="og:type" content="music.musician" />
<meta property="og:title" content="${esc(c.title)}" />
<meta property="og:description" content="${esc(c.description)}" />
<meta property="og:url" content="${esc(c.canonical)}" />
<meta property="og:image" content="${esc(c.ogImage)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(c.title)}" />
<meta name="twitter:image" content="${esc(c.ogImage)}" />
${c.jsonLd ? `<script type="application/ld+json">\n${JSON.stringify(c.jsonLd, null, 2)}\n</script>` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=${g}&display=swap" rel="stylesheet" />
${w.ground.kind === 'video' ? `<link rel="preload" href="${esc(w.ground.src)}" as="video" type="video/mp4" />` : ''}
<link rel="stylesheet" href="css/style.css" />
</head>
<body>

<!-- ============ THE COLD OPEN · ${esc(w.threshold.label)} ============ -->
<div id="coldopen" data-gesture="${w.threshold.gesture}" data-dwell="${w.threshold.maxDwellMs}">
  ${groundTag}
  <div class="co-tint" aria-hidden="true"></div>
  <div class="co-frame" aria-hidden="true"><span></span><span></span><span></span><span></span></div>

  <div class="co-body">
    <p class="co-premise">${esc(w.name)}</p>
    <h1 class="co-word">${esc(w.artist)}</h1>
    <p class="co-log mono" data-t="logline">${esc(w.logline)}</p>

    <div class="co-gate">
      <button class="co-cta mono" id="crossBtn" type="button"
        aria-label="${esc(w.threshold.label)} — ${esc(w.threshold.reward)}">
        <span class="fill" aria-hidden="true"></span>${esc(w.threshold.label)}
      </button>
      <span class="co-hint">${esc(gestureCopy[w.threshold.gesture] ?? 'PRESS')} · ${esc(w.threshold.reward)}</span>
      ${w.threshold.gesture === 'scroll' ? '<span class="co-arrow" aria-hidden="true">↓</span>' : ''}
    </div>
  </div>

  <div class="co-serial mono">${esc(w.chrome.docCode)}</div>
  <div class="co-status mono">${esc(w.chrome.readout)}<i class="live-dot" aria-hidden="true"></i></div>
</div>

<!-- ============ PERSISTENT CHROME ============ -->
<div class="ground-bed" aria-hidden="true">
  ${w.ground.kind === 'video'
    ? `<video src="${esc(w.ground.src)}" muted loop playsinline preload="none" data-bed></video>`
    : `<img src="${esc(w.ground.src)}" alt="" />`}
</div>
${w.ground.treatment.includes('grain') ? '<div class="grain" aria-hidden="true"></div>' : ''}

<div class="hud hud-tl mono">${esc(w.artist)}<i> // ${esc(w.name)}</i></div>
<div class="hud hud-tr mono" id="hudReadout">${esc(w.chrome.docCode)}</div>
<div class="hud hud-bl mono">${esc(w.chrome.stamps.join(' · '))}</div>

${(w.registers?.length ?? 0) > 0 ? `<!-- the dial. Two audiences read this page in two languages; picking one
     would have picked which half of the artist to erase. -->
<div class="dial mono" role="group" aria-label="Language">
  <button class="dial-b is-on" data-reg="${esc(w.registers![0].code)}" aria-pressed="true">${esc(w.registers![0].label)}</button>
${w.registers!.slice(1).map(r => `  <button class="dial-b" data-reg="${esc(r.code)}" aria-pressed="false">${esc(r.label)}</button>`).join('\n')}
</div>
<script id="registers" type="application/json">${JSON.stringify(
  Object.fromEntries((w.registers ?? []).map(r => [r.code, { lexicon: r.lexicon, logline: r.logline, story: r.story }]))
)}</script>` : ''}

${w.sound ? `<button class="sound mono" id="soundBtn" aria-pressed="false" aria-label="Toggle ${esc(w.sound.label)}">
  <span class="bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
  <span class="s-label">${esc(w.sound.label)}</span>
</button>
<audio id="bed" src="${esc(w.sound.src)}" loop preload="none"></audio>` : ''}

<main>

  <!-- ${lex.proof} -->
  <section id="proof" class="reveal">
    <p class="slug" data-t="lex.proof">${esc(lex.proof)}</p>
    <h2>${esc(w.name)}</h2>
    <div data-t="story">${c.story.map(p => `<p>${esc(p)}</p>`).join('\n      ')}</div>
    <div class="figures">
${c.figures.map(id => figure(l, id)).filter(Boolean).join('\n')}
    </div>
  </section>

  ${c.climax ? `<!-- the climax object — the one thing this is built around -->
  <section id="climax" class="reveal">
    <p class="slug" data-t="lex.latest">${esc(lex.latest)}</p>
    <div class="climax">
      <span class="stamp mono">${esc(c.climax.stamp)}</span>
      <h3>${esc(c.climax.title)}</h3>
      <p class="cx-sub">${esc(c.climax.sub)}</p>
      ${c.climax.href ? `<div class="links"><a href="${esc(c.climax.href)}" target="_blank" rel="noopener">▶ ${esc(lex.enter)}</a></div>` : ''}
    </div>
  </section>` : ''}

  <!-- ${lex.catalogue} -->
  <section id="catalogue" class="reveal">
    <p class="slug" data-t="lex.catalogue">${esc(lex.catalogue)}</p>
    <h2>${c.units.length} ${esc(lex.unit)}${c.units.length === 1 ? '' : 's'}</h2>
    <div class="rack">
${c.units.map((u, i) => `      <a class="unit" href="${esc(u.href)}" target="_blank" rel="noopener">
        <span class="u-corner" aria-hidden="true"></span>
        <img src="${esc(u.image)}" alt="${esc(u.title)}" loading="lazy" decoding="async" />
        <span class="u-meta">
          <span class="u-n mono">${String(i + 1).padStart(2, '0')}</span>
          <span class="u-t">${esc(u.title)}</span>
          ${u.sub ? `<span class="u-s mono">${esc(u.sub)}</span>` : ''}
        </span>
      </a>`).join('\n')}
    </div>
  </section>

  <!-- ${lex.contact} — the rail. A real endpoint, not a mailto. -->
  <section id="rail" class="reveal">
    <p class="slug" data-t="lex.contact">${esc(lex.contact)}</p>
    <div class="rail">
      <h2 data-t="lex.contact">${esc(lex.contact)}</h2>
      <form id="railForm" method="POST" action="${esc(c.rail.endpoint)}">
${c.rail.fields.map(f => `        <div>
          <label for="f-${esc(f.name)}">${esc(f.label)}</label>
          ${f.type === 'textarea'
            ? `<textarea id="f-${esc(f.name)}" name="${esc(f.name)}" ${f.required ? 'required' : ''}></textarea>`
            : f.type === 'select'
            ? `<select id="f-${esc(f.name)}" name="${esc(f.name)}" ${f.required ? 'required' : ''}>${(f.options ?? []).map(o => `<option>${esc(o)}</option>`).join('')}</select>`
            : `<input id="f-${esc(f.name)}" type="${f.type}" name="${esc(f.name)}" ${f.required ? 'required' : ''} autocomplete="${f.type === 'email' ? 'email' : 'on'}" />`}
        </div>`).join('\n')}
        <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px" />
        <button type="submit">${esc(c.rail.submitLabel)}</button>
        <p class="form-msg mono" id="formMsg" role="status" aria-live="polite"></p>
      </form>
      ${c.rail.fallbackEmail ? `<p class="alt">or <a href="mailto:${esc(c.rail.fallbackEmail)}">${esc(c.rail.fallbackEmail)}</a></p>` : ''}
      <div class="links">
${c.links.map(k => `        <a href="${esc(k.href)}" target="_blank" rel="noopener">${esc(k.label)}</a>`).join('\n')}
      </div>
    </div>
  </section>

  <!-- ${lex.index} — every number on this page, and where it came from. -->
  <section id="sources" class="sources reveal">
    <p class="slug">${esc(lex.index)}</p>
    <h2>${esc(lex.index)}</h2>
    <p>Every figure on this page was read from a primary source on the date shown. Nothing here is estimated, rounded up, or inferred.</p>
    <div class="wrap">
      <table>
        <thead><tr><th>Figure</th><th>Value</th><th>Read from</th><th>Verified</th></tr></thead>
        <tbody>
${l.toSourceTable().map(r => `          <tr><td>${esc(r.label)}</td><td>${esc(r.value)}</td><td><a href="${esc(r.sourceUrl)}" target="_blank" rel="noopener">${esc(r.sourceUrl)}</a></td><td>${esc(r.verifiedAt)}</td></tr>`).join('\n')}
${l.allSealed().map(s => `          <tr><td>${esc(s.label)}</td><td>████ withheld</td><td>${esc(s.reason)}</td><td>—</td></tr>`).join('\n')}
        </tbody>
      </table>
    </div>
  </section>

</main>

<footer>
  <span>© ${new Date().getFullYear()} ${esc(w.artist)}</span>
  <span class="mono">${esc(w.chrome.docCode)}</span>
  <span>Built by <a href="https://jamesdare.com" target="_blank" rel="noopener">DareDev256</a> · COLD OPEN</span>
</footer>

<script src="js/main.js" defer></script>
</body>
</html>
`;
}
