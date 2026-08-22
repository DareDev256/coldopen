import type { World } from '../world.ts';
import { Ledger, renderValue } from '../ledger.ts';
import type { SiteContent } from './html.ts';
import type { CaseShell } from './spatial.ts';

const esc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function figure(l: Ledger, id: string): string {
  const f = l.get(id);
  if (f) {
    const host = (() => { try { return new URL(f.sourceUrl).hostname.replace('www.', ''); } catch { return 'source'; } })();
    return `        <div class="fig">
          <a class="src mono" href="${esc(f.sourceUrl)}" target="_blank" rel="noopener" title="Verified ${esc(f.verifiedAt)}">${esc(host)} ↗</a>
          <b data-count="${typeof f.value === 'number' && f.format !== 'none' ? f.value : ''}">${esc(renderValue(f))}</b>
          <span class="fl">${esc(f.label)}</span>
        </div>`;
  }
  const s = l.sealedClaim(id);
  if (s) return `        <div class="fig sealed" title="${esc(s.reason)}">
          <b><span class="bar" aria-hidden="true"></span><span class="sr-only">withheld</span></b>
          <span class="fl">${esc(s.label)} · UNVERIFIED</span>
        </div>`;
  return '';
}

export function emitSpatialHTML(w: World, c: SiteContent, l: Ledger, shell: CaseShell): string {
  const families = [w.type.display.google, w.type.text.google, w.type.mono.google];
  const g = [...new Set(families)].join('&family=');
  const lex = w.lexicon;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>${esc(c.title)}</title>
<meta name="description" content="${esc(c.description)}" />
<meta name="theme-color" content="${w.palette.ground}" />
<link rel="canonical" href="${esc(c.canonical)}" />
<meta property="og:type" content="music.musician" />
<meta property="og:title" content="${esc(c.title)}" />
<meta property="og:description" content="${esc(c.description)}" />
<meta property="og:url" content="${esc(c.canonical)}" />
<meta property="og:image" content="${esc(c.ogImage)}" />
<meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
${c.jsonLd ? `<script type="application/ld+json">\n${JSON.stringify(c.jsonLd, null, 2)}\n</script>` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=${g}&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="css/style.css" />
</head>
<body>

<div class="hud hud-tl mono">${esc(w.artist)}<i> // ${esc(w.name)}</i></div>
<div class="hud hud-tr mono" id="hudReadout">${esc(w.chrome.docCode)}</div>
<div class="hud hud-bl mono">${esc(w.chrome.stamps.join(' · '))}</div>

${(w.registers?.length ?? 0) > 1 ? `<!-- She is billed as a trilingual artist and her audience is split across
     two of those languages. English leads; the other two are one click away. -->
<div class="dial mono" role="group" aria-label="Language">
${w.registers!.map((r, i) => `  <button class="dial-b${i === 0 ? ' is-on' : ''}" data-reg="${esc(r.code)}" aria-pressed="${i === 0}">${esc(r.label)}</button>`).join('\n')}
</div>
<script id="registers" type="application/json">${JSON.stringify(
  Object.fromEntries((w.registers ?? []).map(r => [r.code, { lexicon: r.lexicon, logline: r.logline, story: r.story, mirror: (r as any).mirrorCaption }]))
)}</script>` : ''}

${w.sound ? `<button class="sound mono" id="soundBtn" aria-pressed="false" aria-label="Toggle ${esc(w.sound.label)}">
  <span class="bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="s-label">${esc(w.sound.label)}</span>
</button>
<audio id="bed" src="${esc(w.sound.src)}" loop preload="none"></audio>` : ''}

<!-- =========================================================
     THE OBJECT. It sits closed until you open it.
     ========================================================= -->
<div id="stage">
  <p class="premise">${esc(w.name)}</p>
  <h1 class="wordmark">${esc(w.artist)}</h1>

  <div class="case" id="case">
    <div class="lid">
      <div class="lid-out">
${shell.stamps.map((s, i) => `        <span class="stamp" style="top:${12 + (i % 3) * 26}%; ${i % 2 ? 'right' : 'left'}:${6 + (i % 4) * 9}%; transform:rotate(${s.rotate}deg)">
          <b>${esc(s.text)}</b><i>${esc(s.sub)}</i>
        </span>`).join('\n')}
        <span class="hinge l" aria-hidden="true"></span><span class="hinge r" aria-hidden="true"></span>
      </div>
      <div class="lid-in" aria-hidden="true"></div>
    </div>
    <span class="clasp mono" aria-hidden="true">${esc(shell.engraving)}</span>

    <div class="base">
      <div class="foam">
        <div class="mirror">
          <img src="${esc(shell.mirror)}" alt="${esc(w.artist)}" />
          <span class="mirror-cap mono" data-t="mirror">${esc(c.description)}</span>
        </div>
${shell.trays.map(t => `        <div class="tray">
          <p class="tray-lab">${esc(t.label)}</p>
          <div class="slots" style="--n:${Math.max(1, Math.min(4, t.to - t.from))}">
${c.units.slice(t.from, t.to).map((u, i) => `            <a class="slot" href="${esc(u.href)}" target="_blank" rel="noopener">
              <img src="${esc(u.image)}" alt="${esc(u.title)}" loading="lazy" decoding="async" />
              <span class="slot-n mono">${String(t.from + i + 1).padStart(2, '0')}</span>
              <span class="slot-t"><b>${esc(u.title)}</b>${u.sub ? `<i>${esc(u.sub)}</i>` : ''}</span>
            </a>`).join('\n')}
          </div>
        </div>`).join('\n')}
      </div>
    </div>
  </div>

  <div class="gate" id="gate">
    <button class="gate-b mono" id="openBtn" type="button" aria-label="${esc(w.threshold.label)}">
      <span class="fill" aria-hidden="true"></span>${esc(w.threshold.label)}
    </button>
    <span class="gate-h">${esc(w.threshold.reward)}</span>
  </div>
</div>

<main>
  <section id="proof" class="reveal">
    <p class="slug" data-t="lex.proof">${esc(lex.proof)}</p>
    <h2>${esc(w.name)}</h2>
    <div data-t="story">${c.story.map(p => `<p>${esc(p)}</p>`).join('\n      ')}</div>
    <div class="figures">
${c.figures.map(id => figure(l, id)).filter(Boolean).join('\n')}
    </div>
  </section>

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
            : `<input id="f-${esc(f.name)}" type="${f.type}" name="${esc(f.name)}" ${f.required ? 'required' : ''} />`}
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

  <section id="sources" class="sources reveal">
    <p class="slug" data-t="lex.index">${esc(lex.index)}</p>
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
