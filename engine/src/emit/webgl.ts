/**
 * COLD OPEN — the rendered spatial topology.
 *
 * Same World, same Ledger, same lexicon as the CSS spatial emitter. The
 * difference is that the object is rendered rather than drawn: brushed
 * aluminium under a generated environment, hinged halves, and the artist's own
 * footage on a cylinder around the camera.
 *
 * The DOM underneath is not a placeholder. It is the complete site, and the
 * canvas is an enhancement layer over its hero. If WebGL is missing, refused,
 * or too slow, nothing is lost but the render — which is the only honest way
 * to ship a 3D hero on an artist's only web presence.
 */

import type { World } from '../world.ts';
import { hsl } from '../world.ts';
import { Ledger, renderValue } from '../ledger.ts';
import type { SiteContent } from './html.ts';
import type { CaseShell } from './spatial.ts';

const alpha = (hex: string, a: number) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
const esc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface Panel {
  readonly title: string;
  readonly sub?: string;
  readonly href: string;
  readonly poster: string;
  readonly video?: string;
  readonly sourceHost?: string;
}

const LANG_NAME: Record<string, string> = {
  en: 'English', pt: 'Português', es: 'Español', fr: 'Français',
};

export function emitWebGLCSS(w: World, shell: CaseShell): string {
  const { ground, accent, payoff, ink, muted } = w.palette;
  return `/* =========================================================
   ${w.artist} — "${w.name}"  ·  SPATIAL / RENDERED
   ${w.logline}
   ========================================================= */
:root{
  --ground:${ground}; --ink:${ink}; --muted:${muted}; --subtle:${alpha(ink, 0.34)};
  --accent:${accent}; --accent-line:${alpha(accent, 0.42)}; --payoff:${payoff};
  --line:${alpha(ink, 0.16)};
  --f-disp:'${w.type.display.family}', system-ui, sans-serif;
  --f-text:'${w.type.text.family}', system-ui, sans-serif;
  --f-mono:'${w.type.mono.family}', ui-monospace, monospace;
  --hud:.62rem; --gut:clamp(1.1rem,4vw,3rem);
}
*{margin:0;padding:0;box-sizing:border-box}
html{background:var(--ground);scroll-behavior:smooth}
body{background:var(--ground);color:var(--ink);font-family:var(--f-text);overflow-x:hidden;
  -webkit-font-smoothing:antialiased;min-height:100svh}
img,video{display:block;max-width:100%}
a{color:inherit} button{font:inherit}
.mono{font-family:var(--f-mono);font-variant-numeric:tabular-nums}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
::selection{background:var(--accent);color:${ground}}

/* ---------- the rendered hero ----------
   A sticky viewport inside a tall track. Page scroll turns the wall for the
   length of the track, then releases into the document — no wheel hijacking,
   so a trackpad, a keyboard and a screen reader all behave normally and the
   scrollbar never lies about how long the page is. */
#glscroll{ position:relative; height:340svh; }
#glroot{ position:sticky; top:0; height:100svh; width:100%; overflow:hidden; }
#gl{ position:absolute; inset:0; width:100%; height:100%; display:block; z-index:1; }
#gl-labels{ position:absolute; inset:0; z-index:3; pointer-events:none; }

/* The montage of her own footage. This is the GROUND — it stays once the
   renderer arrives, because the case is meant to stand IN her work rather
   than on a flat swatch. It is also the whole hero if WebGL never loads. */
#fallback{ position:absolute; inset:0; z-index:0; overflow:hidden; }
#fallback video,#fallback img{ width:100%; height:100%; object-fit:cover; filter:saturate(.85) contrast(1.06); }
#fallback::after{ content:""; position:absolute; inset:0;
  background:radial-gradient(120% 90% at 50% 45%, transparent 20%, ${alpha(ground, 0.72)} 74%, var(--ground) 100%),
             linear-gradient(180deg, ${alpha(ground, 0.6)}, transparent 32%, transparent 58%, ${alpha(ground, 0.92)}); }
#glroot[data-ready="1"] #fallback video{ filter:saturate(.7) contrast(1.02) brightness(.72) }
#glroot[data-ready="1"] #fallback::after{ background:
  radial-gradient(115% 85% at 50% 46%, transparent 8%, ${alpha(ground, 0.62)} 62%, ${alpha(ground, 0.9)} 100%),
  linear-gradient(180deg, ${alpha(ground, 0.55)}, transparent 30%, transparent 62%, ${alpha(ground, 0.94)}) }
/* once open, the montage steps back so the wall is the picture */
body.is-open #fallback video{ filter:saturate(.35) contrast(.95) brightness(.17) blur(4px); transition:filter 1.4s ease }
body.is-open #fallback::after{ background:
  radial-gradient(120% 90% at 50% 50%, ${alpha(ground, 0.72)} 0%, ${alpha(ground, 0.9)} 68%, ${alpha(ground, 0.97)} 100%) }

/* ---------- the copy laid over it ---------- */
.hero-copy{ position:absolute; inset:0; z-index:4; display:flex; flex-direction:column; align-items:center;
  justify-content:flex-start; padding:clamp(3.4rem,8vh,6rem) var(--gut) 0; pointer-events:none;
  transition:opacity .8s ease, transform 1s cubic-bezier(.16,1,.3,1) }
body.is-open .hero-copy{ opacity:0; transform:translateY(-28px) }
.premise{ font-family:var(--f-mono); font-size:var(--hud); letter-spacing:.42em; text-transform:uppercase;
  color:var(--accent); font-weight:700; margin-bottom:.6rem }
.wordmark{ font-family:var(--f-disp); font-weight:900; text-transform:uppercase; text-align:center;
  font-size:clamp(1.9rem,8vw,5.6rem); line-height:.86; letter-spacing:-.035em;
  text-shadow:0 0 clamp(30px,7vw,90px) ${alpha('#000000', 0.55)} }

/* the tags — the language choice IS the way in */
.gate{ position:absolute; left:0; right:0; bottom:clamp(2rem,7vh,4.5rem); z-index:5;
  display:flex; flex-direction:column; align-items:center; gap:.9rem; padding:0 var(--gut);
  transition:opacity .5s ease }
.gate.gone{ opacity:0; pointer-events:none }
.tagline{ font-family:var(--f-mono); font-size:clamp(.56rem,1.3vw,.72rem); letter-spacing:.26em;
  text-transform:uppercase; color:${alpha(ink, 0.9)}; text-align:center }
.tagline b{ color:var(--accent); font-weight:700 }
.tags{ display:flex; gap:clamp(.5rem,1.4vw,.9rem); justify-content:center; flex-wrap:wrap }
.tag{ position:relative; cursor:pointer; border:0; padding:0; background:none }
.tag::before{ content:""; position:absolute; left:50%; top:-15px; width:1px; height:15px; background:${alpha(ink, 0.55)} }
.tag-body{ display:block; min-width:clamp(80px,15vw,116px); padding:1.15rem .7rem .6rem; border-radius:3px;
  background:linear-gradient(160deg, ${alpha(ink, 0.96)}, ${alpha(ink, 0.82)}); color:${ground};
  box-shadow:0 8px 22px ${alpha('#000000', 0.5)}; border-top:3px solid var(--accent);
  transition:transform .28s cubic-bezier(.16,1,.3,1), box-shadow .28s }
.tag:hover .tag-body,.tag:focus-visible .tag-body{ transform:translateY(-6px) rotate(-1.5deg);
  box-shadow:0 18px 32px ${alpha('#000000', 0.6)}; outline:none }
.tag-body::after{ content:""; position:absolute; left:50%; top:9px; transform:translateX(-50%);
  width:7px; height:7px; border-radius:50%; background:var(--ground); box-shadow:inset 0 1px 2px ${alpha('#000000', 0.6)} }
.tag-code{ display:block; font-family:var(--f-disp); font-weight:900; font-size:clamp(1.1rem,2.6vw,1.5rem); line-height:1 }
.tag-name{ display:block; font-family:var(--f-mono); font-size:.5rem; letter-spacing:.2em; text-transform:uppercase;
  opacity:.66; margin-top:.28rem }

/* ---------- the info tags on the wall ---------- */
.gl-tag{ position:absolute; top:0; left:0; opacity:0; text-decoration:none;
  transition:opacity .35s ease; will-change:transform,opacity;
  padding:.55rem .7rem; min-width:9.5rem; text-align:left;
  background:${alpha('#05060A', 0.9)}; backdrop-filter:blur(9px);
  border-left:2px solid var(--accent); border-radius:2px;
  box-shadow:0 6px 18px ${alpha('#000000', 0.55)} }
.gl-tag .t-n{ display:block; font-family:var(--f-mono); font-size:.48rem; letter-spacing:.24em; color:var(--accent) }
.gl-tag .t-title{ display:block; font-family:var(--f-disp); font-weight:900; text-transform:uppercase;
  font-size:.9rem; line-height:1.05; letter-spacing:-.012em; color:#fff; margin-top:.18rem }
.gl-tag .t-meta{ display:block; font-family:var(--f-mono); font-size:.5rem; letter-spacing:.13em;
  text-transform:uppercase; color:${alpha('#ffffff', 0.86)}; margin-top:.2rem }
.gl-tag .t-src{ display:block; font-family:var(--f-mono); font-size:.44rem; letter-spacing:.16em;
  color:${alpha(accent, 0.85)}; margin-top:.3rem }
.gl-tag:hover{ background:${alpha('#05060A', 0.9)} }

.scrollhint{ position:absolute; left:50%; bottom:1.6rem; transform:translateX(-50%); z-index:5;
  font-family:var(--f-mono); font-size:.58rem; letter-spacing:.26em; text-transform:uppercase; color:var(--accent);
  opacity:0; transition:opacity .6s ease .9s; pointer-events:none }
body.is-open .scrollhint{ opacity:1 }

/* ---------- chrome ---------- */
.hud{ position:fixed; z-index:60; font-family:var(--f-mono); font-size:var(--hud); letter-spacing:.24em;
  text-transform:uppercase; pointer-events:none; color:var(--muted) }
.hud-tl{ top:1.1rem; left:var(--gut); color:var(--accent); font-weight:700 }
.hud-tl i{ color:var(--subtle); font-style:normal; font-weight:400 }
.hud-tr{ top:1.1rem; right:var(--gut) }
.dial{ position:fixed; z-index:70; top:1rem; left:50%; transform:translateX(-50%); display:flex; gap:1px;
  background:var(--accent-line); border:1px solid var(--accent-line); border-radius:2px; overflow:hidden;
  opacity:0; pointer-events:none; transition:opacity .5s }
.dial.shown{ opacity:1; pointer-events:auto }
.dial-b{ background:${alpha(ground, 0.9)}; backdrop-filter:blur(9px); border:0; color:var(--muted); cursor:pointer;
  font-family:var(--f-mono); font-size:var(--hud); letter-spacing:.22em; text-transform:uppercase; padding:.55rem .85rem }
.dial-b:hover{ color:var(--ink) }
.dial-b.is-on{ background:var(--accent); color:${ground}; font-weight:700 }
.sound{ position:fixed; z-index:70; right:var(--gut); bottom:1.05rem; display:flex; align-items:center; gap:.6rem;
  cursor:pointer; font-family:var(--f-mono); font-size:var(--hud); letter-spacing:.24em; text-transform:uppercase;
  background:${alpha(ground, 0.78)}; backdrop-filter:blur(9px); border:1px solid var(--accent-line); color:var(--ink);
  padding:.62rem .95rem }
.sound:hover{ border-color:var(--accent) }
.sound .bars{ display:flex; align-items:flex-end; gap:2px; height:12px }
.sound .bars i{ width:2px; background:var(--accent); height:30%; transform-origin:bottom }
.sound.on .bars i{ animation:eq .9s ease-in-out infinite }
.sound.on .bars i:nth-child(2){animation-delay:.15s}.sound.on .bars i:nth-child(3){animation-delay:.3s}.sound.on .bars i:nth-child(4){animation-delay:.45s}
@keyframes eq{0%,100%{height:28%}50%{height:100%}}

/* ---------- the site under the hero ---------- */
main{ position:relative; z-index:10; background:var(--ground) }
section{ padding:clamp(3.5rem,9vh,7rem) var(--gut); position:relative }
.slug{ font-family:var(--f-mono); font-size:var(--hud); letter-spacing:.34em; text-transform:uppercase;
  color:var(--accent); font-weight:700; margin-bottom:1.1rem; display:flex; align-items:center; gap:.8rem }
.slug::after{ content:""; flex:1; height:1px; background:var(--accent-line) }
h2{ font-family:var(--f-disp); font-weight:900; text-transform:uppercase; letter-spacing:-.02em; line-height:.92;
  font-size:clamp(1.8rem,6vw,4.2rem); margin-bottom:1.6rem }
p{ font-family:var(--f-text); line-height:1.7; color:${alpha(ink, 0.9)}; max-width:60ch; font-size:clamp(1rem,1.5vw,1.1rem) }
p + p{ margin-top:1rem }
.reveal{opacity:0;transform:translateY(26px);transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1)}
.reveal.in{opacity:1;transform:none}
.cube{ margin-bottom:clamp(1rem,2.4vw,1.6rem); border-radius:5px; padding:clamp(.8rem,1.8vw,1.2rem);
  background:${alpha('#000000', 0.3)}; box-shadow:inset 0 0 0 1px ${alpha(ink, 0.12)} }
.cube-lab{ font-family:var(--f-mono); font-size:.56rem; letter-spacing:.3em; text-transform:uppercase;
  color:var(--accent); margin-bottom:.7rem; display:flex; align-items:center; gap:.7rem }
.cube-lab::after{ content:""; flex:1; height:1px; background:${alpha(accent, 0.22)} }
.slots{ display:grid; gap:clamp(.5rem,1.2vw,.8rem); grid-template-columns:repeat(var(--n,3),1fr) }
@media (max-width:900px){ .slots{ grid-template-columns:repeat(min(var(--n,3),2),1fr) } }
@media (max-width:560px){ .slots{ grid-template-columns:1fr } }
.slot{ position:relative; aspect-ratio:16/9; border-radius:3px; overflow:hidden; display:block; text-decoration:none;
  background:#000; box-shadow:inset 0 0 0 1px ${alpha('#ffffff', 0.1)}, 0 5px 12px ${alpha('#000000', 0.6)};
  transition:transform .4s cubic-bezier(.16,1,.3,1), box-shadow .4s }
.slot:hover{ transform:translateY(-5px) scale(1.02); box-shadow:inset 0 0 0 1px var(--accent), 0 14px 26px ${alpha('#000000', 0.75)} }
.slot img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; transition:transform .6s }
.slot:hover img{ transform:scale(1.05) }
.slot::after{ content:""; position:absolute; inset:0; background:linear-gradient(transparent 36%, ${alpha('#000000', 0.9)}) }
.slot-t{ position:absolute; left:0; right:0; bottom:0; z-index:2; padding:.55rem .55rem .5rem }
.slot-t b{ display:block; font-family:var(--f-disp); font-weight:900; text-transform:uppercase;
  font-size:clamp(.68rem,1.5vw,.84rem); line-height:1.04; color:#fff }
.slot-t i{ display:block; font-style:normal; font-family:var(--f-mono); font-size:.5rem; letter-spacing:.13em;
  color:${alpha('#ffffff', 0.68)}; margin-top:.22rem; text-transform:uppercase }
.slot-n{ position:absolute; top:.42rem; left:.48rem; z-index:2; font-family:var(--f-mono); font-size:.48rem;
  letter-spacing:.14em; color:${alpha(accent, 0.92)} }
.figures{ display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,190px),1fr)); gap:1px;
  background:var(--line); border:1px solid var(--line); margin:2.5rem 0; max-width:100%; overflow:hidden }
.fig{ background:var(--ground); padding:clamp(1.15rem,2.4vw,1.6rem); position:relative;
  display:flex; flex-direction:column; justify-content:flex-end; min-height:7.5rem }
.fig b{ display:block; font-family:var(--f-disp); font-weight:900; font-size:clamp(1.5rem,3.6vw,2.6rem);
  line-height:1; letter-spacing:-.03em; color:var(--ink); font-variant-numeric:tabular-nums; overflow-wrap:anywhere }
.fig .fl{ display:block; font-family:var(--f-mono); font-size:.58rem; letter-spacing:.24em; text-transform:uppercase;
  color:var(--muted); margin-top:.6rem }
.fig .src{ position:absolute; top:.7rem; right:.7rem; font-family:var(--f-mono); font-size:.5rem; letter-spacing:.14em;
  color:var(--subtle); text-decoration:none; border-bottom:1px dotted var(--subtle) }
.fig .src:hover{ color:var(--accent); border-color:var(--accent) }
.fig.sealed b{ display:flex; align-items:center; height:clamp(1.5rem,3.6vw,2.6rem) }
.fig.sealed .bar{ display:block; width:min(100%,8.5ch); height:.62em;
  background:repeating-linear-gradient(90deg, ${alpha(ink, 0.34)} 0 .8em, transparent .8em .95em) }
.fig.sealed .fl{ color:var(--accent) }
.rail{ border:1px solid var(--accent-line); padding:clamp(1.5rem,4.5vw,3rem); background:${alpha(accent, 0.06)} }
.rail form{ display:grid; gap:.9rem; margin-top:1.6rem; max-width:38rem }
.rail label{ font-family:var(--f-mono); font-size:.56rem; letter-spacing:.26em; text-transform:uppercase;
  color:var(--muted); display:block; margin-bottom:.4rem }
.rail input,.rail textarea,.rail select{ width:100%; background:${alpha('#000000', 0.3)}; border:1px solid var(--line);
  color:var(--ink); padding:.85rem .9rem; font-family:var(--f-mono); font-size:.82rem }
.rail input:focus,.rail textarea:focus,.rail select:focus{ outline:none; border-color:var(--accent) }
.rail textarea{ min-height:7rem; resize:vertical }
.rail button{ font-family:var(--f-mono); font-size:.66rem; letter-spacing:.3em; text-transform:uppercase; font-weight:700;
  background:var(--accent); color:${ground}; border:0; padding:1.05rem 1.5rem; cursor:pointer }
.rail button:hover{ filter:brightness(1.12) }
.rail .alt{ margin-top:1.1rem; font-family:var(--f-mono); font-size:.6rem; letter-spacing:.16em; color:var(--muted) }
.rail .alt a{ color:var(--accent) }
.form-msg{ font-family:var(--f-mono); font-size:.66rem; letter-spacing:.14em; margin-top:.9rem; min-height:1.2em }
.form-msg.ok{ color:var(--accent) } .form-msg.err{ color:#FF8A8A }
.links{ display:flex; flex-wrap:wrap; gap:.55rem; margin-top:2rem }
.links a{ font-family:var(--f-mono); font-size:.6rem; letter-spacing:.24em; text-transform:uppercase; text-decoration:none;
  border:1px solid var(--line); padding:.72rem 1rem; color:var(--muted) }
.links a:hover{ color:var(--accent); border-color:var(--accent) }
.sources{ border-top:1px solid var(--line) }
.sources table{ width:100%; border-collapse:collapse; font-family:var(--f-mono); font-size:.66rem; margin-top:1.4rem }
.sources th{ text-align:left; letter-spacing:.24em; text-transform:uppercase; color:var(--accent); font-size:.56rem;
  padding:.7rem .8rem; border-bottom:1px solid var(--accent-line); font-weight:700 }
.sources td{ padding:.7rem .8rem; border-bottom:1px solid var(--line); color:var(--muted); vertical-align:top }
.sources td a{ color:var(--accent); text-decoration:none; border-bottom:1px dotted var(--accent-line); word-break:break-all }
.sources .wrap{ overflow-x:auto }
footer{ padding:2.5rem var(--gut) 6.5rem; border-top:1px solid var(--line); font-family:var(--f-mono); font-size:.58rem;
  letter-spacing:.2em; text-transform:uppercase; color:var(--subtle); display:flex; justify-content:space-between;
  gap:1rem; flex-wrap:wrap }
footer a{ color:var(--muted); text-decoration:none } footer a:hover{ color:var(--accent) }

@media (max-width:760px){
  #glscroll{ height:260svh }
  .hud-tr{ display:none }
  .gl-tag{ min-width:7.5rem; padding:.45rem .55rem }
  .gl-tag .t-title{ font-size:.74rem }
  .tag-body{ min-width:clamp(70px,22vw,96px); padding:1rem .5rem .5rem }
}
@media (prefers-reduced-motion:reduce){
  *{ animation-duration:.001ms !important; transition-duration:.001ms !important; scroll-behavior:auto !important }
  .reveal{ opacity:1; transform:none }
}
`;
}

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

export interface WebGLExtras {
  readonly panels: readonly Panel[];
  /** the montage behind the closed case, and its poster */
  readonly montage?: { src: string; poster: string };
}

export function emitWebGLHTML(w: World, c: SiteContent, l: Ledger, shell: CaseShell, x: WebGLExtras): string {
  const families = [w.type.display.google, w.type.text.google, w.type.mono.google];
  const g = [...new Set(families)].join('&family=');
  const lex = w.lexicon;
  const regs = w.registers ?? [];

  const cfg = {
    palette: { ground: w.palette.ground, accent: w.palette.accent, payoff: w.palette.payoff },
    panels: x.panels,
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
${x.montage ? `<link rel="preload" href="${esc(x.montage.poster)}" as="image" />` : ''}
<link rel="stylesheet" href="css/style.css" />
</head>
<body>

<div class="hud hud-tl mono">${esc(w.artist)}<i> // ${esc(w.name)}</i></div>
<div class="hud hud-tr mono" id="hudReadout">${esc(w.chrome.docCode)}</div>

${regs.length > 1 ? `<div class="dial mono" id="dial" role="group" aria-label="Language">
${regs.map((r, i) => `  <button class="dial-b${i === 0 ? ' is-on' : ''}" data-reg="${esc(r.code)}" aria-pressed="${i === 0}">${esc(r.label)}</button>`).join('\n')}
</div>
<script id="registers" type="application/json">${JSON.stringify(
  Object.fromEntries(regs.map(r => [r.code, { lexicon: r.lexicon, logline: r.logline, story: r.story, prompt: (r as any).prompt }]))
)}</script>` : ''}

${w.sound ? `<button class="sound mono" id="soundBtn" aria-pressed="false" aria-label="Toggle ${esc(w.sound.label)}">
  <span class="bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="s-label">${esc(w.sound.label)}</span>
</button>
<audio id="bed" src="${esc(w.sound.src)}" loop preload="none"></audio>` : ''}

<!-- =========================================================
     THE HERO. Rendered when WebGL is there; the montage alone when it is not.
     ========================================================= -->
<div id="glscroll">
<div id="glroot">
  <div id="fallback" aria-hidden="true">
    ${x.montage
      ? `<video src="${esc(x.montage.src)}" poster="${esc(x.montage.poster)}" muted loop playsinline autoplay preload="metadata"></video>`
      : `<img src="${esc(c.ogImage)}" alt="" />`}
  </div>
  <canvas id="gl"></canvas>
  <div id="gl-labels"></div>

  <div class="hero-copy">
    <p class="premise">${esc(w.name)}</p>
    <h1 class="wordmark">${esc(w.artist)}</h1>
  </div>

  ${regs.length > 1 ? `<!-- The language choice IS the way in: three tags, at eye
       level, and picking one both sets the register and opens the case. -->
  <div class="gate" id="gate">
    <p class="tagline" data-t="prompt"><b>CHOOSE YOUR TAG</b> — IT OPENS THE CASE</p>
    <div class="tags" id="tags">
${regs.map(r => `      <button class="tag" data-reg="${esc(r.code)}" aria-label="${esc(LANG_NAME[r.code] ?? r.label)}">
        <span class="tag-body"><span class="tag-code">${esc(r.label)}</span><span class="tag-name">${esc(LANG_NAME[r.code] ?? r.label)}</span></span>
      </button>`).join('\n')}
    </div>
  </div>` : ''}
  <p class="scrollhint mono">${esc(w.threshold.reward)} — SCROLL TO TURN THE WALL</p>
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

  <section id="catalogue" class="reveal">
    <p class="slug" data-t="lex.catalogue">${esc(lex.catalogue)}</p>
    <h2>${c.units.length} ${esc(lex.unit)}${c.units.length === 1 ? '' : 'S'}</h2>
${shell.trays.map(t => `    <div class="cube">
      <p class="cube-lab">${esc(t.label)}</p>
      <div class="slots" style="--n:${Math.max(1, Math.min(4, t.to - t.from))}">
${c.units.slice(t.from, t.to).map((u, i) => `        <a class="slot" href="${esc(u.href)}" target="_blank" rel="noopener">
          <img src="${esc(u.image)}" alt="${esc(u.title)}" loading="lazy" decoding="async" />
          <span class="slot-n mono">${String(t.from + i + 1).padStart(2, '0')}</span>
          <span class="slot-t"><b>${esc(u.title)}</b>${u.sub ? `<i>${esc(u.sub)}</i>` : ''}</span>
        </a>`).join('\n')}
      </div>
    </div>`).join('\n')}
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

<script>window.__COLDOPEN__ = ${JSON.stringify(cfg)};</script>
<script src="js/ui.js" defer></script>
<script type="module" src="js/scene.js"></script>
</body>
</html>
`;
}

/**
 * The DOM half. Kept out of the module so it runs even if the WebGL module
 * fails to parse — the language dial, the rail and the reveals are the site,
 * and none of them should depend on a renderer.
 */
export function emitWebGLUIJS(w: World): string {
  const soundLabel = (w.sound?.label ?? 'SOUND').toUpperCase();
  return `/* ${w.artist} — "${w.name}". DOM layer. Generated by COLD OPEN. */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tags = document.getElementById('tags');
  var gate = document.getElementById('gate');
  var dial = document.getElementById('dial');
  var audio = document.getElementById('bed');
  var opened = false;

  var REG = {}, base = {}, baseCode = 'en';
  var regEl = document.getElementById('registers');
  if (regEl) {
    try { REG = JSON.parse(regEl.textContent || '{}'); } catch (e) {}
    document.querySelectorAll('[data-t]').forEach(function (n) { base[n.getAttribute('data-t')] = n.innerHTML; });
    var f = document.querySelector('.dial-b');
    if (f) baseCode = f.getAttribute('data-reg');
  }

  /* Prose and section names move. Every NUMBER stays exactly as it was — a
     figure does not change language, and re-rendering one is how a translated
     site starts lying. */
  function setRegister(code) {
    var r = REG[code];
    document.querySelectorAll('.dial-b').forEach(function (b) {
      var on = b.getAttribute('data-reg') === code;
      b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
    });
    document.documentElement.lang = code;
    document.querySelectorAll('[data-t]').forEach(function (n) {
      var k = n.getAttribute('data-t');
      if (code === baseCode || !r) { n.innerHTML = base[k]; return; }
      if (k === 'logline' && r.logline) n.textContent = r.logline;
      else if (k === 'prompt' && r.prompt) n.innerHTML = r.prompt;
      else if (k === 'story' && r.story && r.story.length) {
        n.innerHTML = r.story.map(function (p) { return '<p>' + p.replace(/[&<>]/g, '') + '</p>'; }).join('');
      } else if (k.indexOf('lex.') === 0 && r.lexicon && r.lexicon[k.slice(4)]) n.textContent = r.lexicon[k.slice(4)];
      else n.innerHTML = base[k];
    });
    try { localStorage.setItem('co-register', code); } catch (e) {}
  }

  function open(code) {
    if (code) setRegister(code);
    if (opened) return;
    opened = true;
    document.body.classList.add('is-open');
    if (gate) gate.classList.add('gone');
    if (dial) dial.classList.add('shown');
    // hand off to the renderer if it loaded; if it did not, the montage stays
    if (typeof window.__coldopenOpen === 'function') window.__coldopenOpen();
    try { if (audio && localStorage.getItem('co-sound') === '1') {
      audio.volume = 0; audio.play().then(function () { fade(audio, .5, 1200); setSound(true); }).catch(function () {});
    } } catch (e) {}
  }
  window.__coldopenUIOpen = open;

  if (tags) tags.querySelectorAll('.tag').forEach(function (t) {
    t.addEventListener('click', function () { open(t.getAttribute('data-reg')); });
  });
  if (dial) dial.querySelectorAll('.dial-b').forEach(function (b) {
    b.addEventListener('click', function () { setRegister(b.getAttribute('data-reg')); });
  });

  /* Nobody gets stuck at a shut case. */
  addEventListener('wheel', function (e) { if (e.deltaY > 24) open(); }, { passive: true });
  addEventListener('touchmove', function () { open(); }, { passive: true });
  document.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') open(); });
  if (reduce) open(); else setTimeout(open, 16000);

  try { var saved = localStorage.getItem('co-register'); if (saved && REG[saved]) setRegister(saved); } catch (e) {}

  /* sound */
  function fade(a, to, ms) { var f0 = a.volume, t0 = performance.now();
    (function s(n) { var k = Math.min(1, (n - t0) / ms); a.volume = f0 + (to - f0) * k; if (k < 1) requestAnimationFrame(s); })(t0); }
  var sBtn = document.getElementById('soundBtn'), sOn = false;
  function setSound(on) {
    sOn = on; if (!sBtn) return;
    sBtn.classList.toggle('on', on); sBtn.setAttribute('aria-pressed', String(on));
    var l = sBtn.querySelector('.s-label');
    if (l) l.textContent = on ? '${soundLabel} ON' : '${soundLabel} OFF';
    try { localStorage.setItem('co-sound', on ? '1' : '0'); } catch (e) {}
  }
  if (sBtn && audio) {
    setSound(false);
    sBtn.addEventListener('click', function () {
      if (sOn) { fade(audio, 0, 350); setTimeout(function () { audio.pause(); }, 380); setSound(false); }
      else { audio.volume = 0; audio.play().then(function () { fade(audio, .5, 900); setSound(true); }).catch(function () {}); }
    });
  }

  /* reveals + count-up */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      e.target.querySelectorAll('[data-count]').forEach(countUp);
      io.unobserve(e.target);
    });
  }, { threshold: .12, rootMargin: '0px 0px -8% 0px' }) : null;
  document.querySelectorAll('.reveal').forEach(function (n) { if (io && !reduce) io.observe(n); else n.classList.add('in'); });
  function countUp(n) {
    var target = parseFloat(n.getAttribute('data-count'));
    if (!target || reduce || n.dataset.done) return;
    n.dataset.done = '1';
    var dur = 1400, t0 = performance.now();
    (function s(now) {
      var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      n.textContent = Math.round(target * e).toLocaleString('en-US');
      if (k < 1) requestAnimationFrame(s); else n.textContent = target.toLocaleString('en-US');
    })(t0);
  }

  var ro = document.getElementById('hudReadout');
  if (ro && !reduce) {
    var b0 = ro.textContent;
    addEventListener('scroll', function () {
      var p = Math.min(100, Math.round(scrollY / Math.max(1, document.body.scrollHeight - innerHeight) * 100));
      ro.textContent = b0 + ' · ' + String(p).padStart(3, '0') + '%';
    }, { passive: true });
  }

  var form = document.getElementById('railForm'), msg = document.getElementById('formMsg');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.querySelector('[name="_gotcha"]').value) return;
    var b = form.querySelector('button[type="submit"]'), o = b.textContent;
    b.disabled = true; b.textContent = 'SENDING…'; msg.className = 'form-msg mono'; msg.textContent = '';
    fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status);
        form.reset(); msg.className = 'form-msg mono ok'; msg.textContent = 'RECEIVED. YOU WILL HEAR BACK.'; })
      .catch(function (err) { msg.className = 'form-msg mono err'; msg.textContent = 'DID NOT SEND (' + err.message + '). EMAIL INSTEAD.'; })
      .finally(function () { b.disabled = false; b.textContent = o; });
  });
})();
`;
}
