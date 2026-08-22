/**
 * COLD OPEN — the SPATIAL topology.
 *
 * The other topologies are pages. This one is an OBJECT: a thing that sits
 * closed on the ground, that you physically open, and that has the artist's
 * work inside it rather than laid out beneath it.
 *
 * That distinction is the whole reason topology is the divergence axis. A
 * dossier and a broadcast are different documents; an object is a different
 * kind of site. The catalogue is not a grid — it is contents.
 *
 * Everything below the object reuses the shared sections, so the ledger, the
 * rail and the SOURCES table behave identically across topologies.
 */

import type { World } from '../world.ts';
import { hsl } from '../world.ts';
import { Ledger, renderValue } from '../ledger.ts';
import type { SiteContent, Unit } from './html.ts';

const alpha = (hex: string, a: number) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
const esc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface CaseShell {
  /** the object's material — drives the shell rendering */
  readonly material: 'lacquer' | 'leather' | 'aluminium';
  /** stamps stuck to the outside. Each must be a real place, from the ledger. */
  readonly stamps: readonly { text: string; sub: string; rotate: number; factId?: string }[];
  /** the image reflected in the lid's mirror */
  readonly mirror: string;
  /** how the trays are divided. Each tray is a named layer of the catalogue. */
  readonly trays: readonly { label: string; from: number; to: number }[];
  /** engraved on the hardware */
  readonly engraving: string;
}

export function emitSpatialCSS(w: World, shell: CaseShell): string {
  const { ground, accent, payoff, ink, muted } = w.palette;
  const lightGround = hsl(ground).l > 0.5;
  const shellBase = shell.material === 'lacquer' ? '#0C0A0D' : shell.material === 'leather' ? '#1A1113' : '#B9BEC6';
  const shellHi = shell.material === 'aluminium' ? '#EDF0F4' : alpha(ink, 0.14);

  return `/* =========================================================
   ${w.artist} — "${w.name}"  ·  SPATIAL
   ${w.logline}

   Not a page with sections. An object that opens.
   ========================================================= */

:root{
  --ground:${ground}; --ink:${ink}; --muted:${muted}; --subtle:${alpha(ink, 0.34)};
  --accent:${accent}; --accent-line:${alpha(accent, 0.42)}; --payoff:${payoff};
  --line:${alpha(ink, 0.16)};
  --shell:${shellBase}; --shell-hi:${shellHi};
  --f-disp:'${w.type.display.family}', system-ui, sans-serif;
  --f-text:'${w.type.text.family}', system-ui, sans-serif;
  --f-mono:'${w.type.mono.family}', ui-monospace, monospace;
  --hud:.62rem; --gut:clamp(1.1rem,4vw,3rem);
}
*{margin:0;padding:0;box-sizing:border-box}
html{background:var(--ground);scroll-behavior:smooth}
body{background:var(--ground);color:var(--ink);font-family:var(--f-text);overflow-x:hidden;
  -webkit-font-smoothing:antialiased;min-height:100vh}
img,video{display:block;max-width:100%}
a{color:inherit}
.mono{font-family:var(--f-mono);font-variant-numeric:tabular-nums}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
::selection{background:var(--accent);color:${ground}}

/* ---------- the stage the object sits on ---------- */
#stage{ position:relative; min-height:100vh; display:flex; flex-direction:column; align-items:center;
  justify-content:center; padding:clamp(3rem,7vh,5rem) var(--gut) clamp(2rem,5vh,3.5rem); perspective:2100px; }
/* the lid needs somewhere to lean back into once it is open */
.case.open{ margin-top:clamp(5rem,16vw,12rem); }
#stage::after{ /* the object casts onto its ground */
  content:""; position:absolute; left:50%; bottom:14%; width:min(72vw,760px); height:80px;
  transform:translateX(-50%); border-radius:50%; pointer-events:none;
  background:radial-gradient(closest-side, ${alpha('#000000', 0.5)}, transparent 74%); filter:blur(14px); }

.premise{ font-family:var(--f-mono); font-size:var(--hud); letter-spacing:.42em; text-transform:uppercase;
  color:var(--accent); font-weight:700; margin-bottom:.7rem; }
.wordmark{ font-family:var(--f-disp); font-weight:900; text-transform:uppercase;
  font-size:clamp(2rem,8.5vw,6.2rem); line-height:.86; letter-spacing:-.035em; text-align:center; margin-bottom:1.6rem; }

/* =========================================================
   THE OBJECT
   ========================================================= */
/* Closed, this has to read as a BOX sitting on a surface — a shallow lid on a
   shallow base. The first pass gave it a tall base full of hidden trays, which
   rendered as a black slab running off the bottom of the screen and looked
   like a laptop. Depth arrives when it opens, not before. */
.case{ position:relative; width:min(84vw,780px); transform-style:preserve-3d;
  transform:rotateX(24deg); transition:transform 1.1s cubic-bezier(.16,1,.3,1); }
.case.open{ transform:rotateX(19deg); }

/* ---- the lid ---- */
.lid{ position:relative; height:clamp(96px,14vw,150px); transform-origin:50% 0%; transform-style:preserve-3d;
  transform:rotateX(0deg); transition:transform 1.15s cubic-bezier(.34,1.16,.42,1); z-index:3; }
/* Chosen by measuring, not by eye.
 *
 * The lid must pass 90 degrees for its INNER face to turn toward the viewer at
 * all — under 90 you are still looking at the stamped shell. But the useful
 * range is narrow: with the case tipped 19 degrees, -126 rendered the mirror
 * 26px tall and -140 only 58px. Sweeping the angle and measuring the lid's
 * actual client height gave -158, where it renders 94px and reads as a mirror
 * rather than a dark strip. Physically this is the lid folded right back
 * behind the case, which is how a flat-hinged vanity case actually opens. */
.case.open .lid{ transform:rotateX(-158deg); }

.lid-out,.lid-in{ position:absolute; inset:0; backface-visibility:hidden; border-radius:10px 10px 3px 3px; overflow:hidden; }
.lid-out{
  background:linear-gradient(158deg, ${shellHi} 0%, var(--shell) 42%, #000 130%);
  box-shadow:inset 0 1px 0 ${alpha('#ffffff', 0.16)}, inset 0 -12px 26px ${alpha('#000000', 0.5)}, 0 20px 44px ${alpha('#000000', 0.42)};
  border:1px solid ${alpha('#000000', 0.6)};
}
/* the underside of the lid, plain once it has folded away */
.lid-in{ transform:rotateX(180deg); background:#0A0A0C; border:1px solid ${alpha('#000000', 0.7)};
  box-shadow:inset 0 0 0 6px ${alpha(payoff, 0.22)}; }

/* THE MIRROR.
 *
 * It began life as the lid's inner face on a 3D backface, and CSS perspective
 * fought it at every angle: past 90 degrees it was 26px of dark strip, and the
 * angle that finally rendered it 94px tall pushed it clean off the top of the
 * viewport. A detail nobody can see is not a detail.
 *
 * So it sits where you would actually see it — looking down into the open case,
 * seated above the trays. Same object, no perspective to fight. */
.mirror{ position:relative; height:clamp(96px,15vw,168px); margin-bottom:clamp(.7rem,1.6vw,1.1rem);
  border-radius:4px; overflow:hidden; background:#08080A;
  box-shadow:inset 0 0 0 5px ${alpha(payoff, 0.5)}, inset 0 0 40px ${alpha('#000000', 0.95)},
             0 6px 18px ${alpha('#000000', 0.6)};
  opacity:0; transform:translateY(-10px); transition:opacity .7s ease .18s, transform .8s cubic-bezier(.16,1,.3,1) .18s; }
.case.open .mirror{ opacity:1; transform:none; }
.mirror img{ width:100%; height:100%; object-fit:cover; object-position:50% 28%;
  filter:contrast(1.06) saturate(.9) brightness(1.04); }
/* the sheen that makes it read as glass rather than a photo in a hole */
.mirror::after{ content:""; position:absolute; inset:0; pointer-events:none;
  background:linear-gradient(112deg, ${alpha('#ffffff', 0.22)} 0%, transparent 24%, transparent 64%, ${alpha('#ffffff', 0.1)} 90%); }
.mirror-cap{ position:absolute; left:0; right:0; bottom:0; z-index:2; padding:.8rem .9rem;
  font-family:var(--f-mono); font-size:.58rem; letter-spacing:.26em; text-transform:uppercase;
  color:${alpha('#ffffff', 0.9)}; background:linear-gradient(transparent, ${alpha('#000000', 0.86)}); }

/* travel stamps on the shell — each one a place she has actually been */
.stamp{ position:absolute; z-index:2; padding:.42rem .62rem; border:2px solid ${alpha(accent, 0.72)};
  color:${alpha(accent, 0.86)}; font-family:var(--f-mono); text-transform:uppercase; text-align:center;
  border-radius:3px; background:${alpha('#000000', 0.2)}; mix-blend-mode:screen; }
.stamp b{ display:block; font-size:clamp(.6rem,1.4vw,.78rem); letter-spacing:.14em; font-weight:700; }
.stamp i{ display:block; font-style:normal; font-size:.5rem; letter-spacing:.2em; opacity:.72; margin-top:2px; }

/* the hardware */
.clasp{ position:absolute; z-index:5; top:calc(clamp(96px,14vw,150px) - 13px); left:50%; transform:translateX(-50%);
  width:clamp(58px,9vw,86px); height:26px; border-radius:3px;
  background:linear-gradient(180deg, ${payoff}, ${alpha(payoff, 0.5)});
  box-shadow:0 2px 7px ${alpha('#000000', 0.62)}, inset 0 1px 0 ${alpha('#ffffff', 0.55)};
  display:flex; align-items:center; justify-content:center;
  font-family:var(--f-mono); font-size:.46rem; letter-spacing:.16em; color:${alpha('#000000', 0.7)}; font-weight:700; }
.case.open .clasp{ opacity:0; transition:opacity .3s; }
.hinge{ position:absolute; z-index:4; top:0; height:9px; width:34px; border-radius:2px;
  background:linear-gradient(180deg, ${payoff}, ${alpha(payoff, 0.34)}); box-shadow:0 1px 4px ${alpha('#000000', 0.6)}; }
.hinge.l{ left:16%; } .hinge.r{ right:16%; }

/* ---- the base, and the fitted trays inside it ---- */
.base{ position:relative; border-radius:3px 3px 12px 12px; padding:clamp(.7rem,1.6vw,1.1rem);
  background:linear-gradient(180deg, var(--shell) 0%, #050506 100%);
  border:1px solid ${alpha('#000000', 0.66)};
  box-shadow:inset 0 2px 0 ${alpha('#ffffff', 0.1)}, 0 30px 60px ${alpha('#000000', 0.55)};
  /* shallow while shut, deep once open */
  max-height:clamp(78px,11vw,118px); overflow:hidden;
  transition:max-height 1.1s cubic-bezier(.16,1,.3,1), padding .6s ease; }
.case.open .base{ max-height:400vh; padding:clamp(.9rem,2vw,1.4rem); }
/* the front wall, so a closed case reads as an object and not a rectangle */
.base::after{ content:""; position:absolute; left:0; right:0; bottom:0; height:clamp(10px,1.6vw,16px);
  border-radius:0 0 12px 12px; pointer-events:none;
  background:linear-gradient(180deg, transparent, ${alpha('#000000', 0.85)}); }
/* the cut-foam the contents sit in */
.foam{ background:${alpha('#000000', 0.55)}; border-radius:5px; padding:clamp(.7rem,1.6vw,1.1rem);
  box-shadow:inset 0 3px 14px ${alpha('#000000', 0.9)}; }
.tray{ margin-bottom:clamp(.7rem,1.6vw,1.1rem); opacity:0; transform:translateY(16px);
  transition:opacity .6s ease, transform .7s cubic-bezier(.16,1,.3,1); }
.tray:last-child{ margin-bottom:0; }
.case.open .tray{ opacity:1; transform:none; }
.case.open .tray:nth-child(2){ transition-delay:.34s } .case.open .tray:nth-child(3){ transition-delay:.5s }
.tray-lab{ font-family:var(--f-mono); font-size:.54rem; letter-spacing:.3em; text-transform:uppercase;
  color:${alpha(accent, 0.78)}; margin-bottom:.6rem; display:flex; align-items:center; gap:.6rem; }
.tray-lab::after{ content:""; flex:1; height:1px; background:${alpha(accent, 0.2)}; }

/* one track = one compact seated in a cutout */
/* Each tray declares how many compartments it has (--n, from its item count),
   so a tray of four is four across rather than three-and-a-gap. auto-fit still
   guessed, and a guess leaves dead foam. The slot is 16:9 because the material
   is 16:9 — forcing a square letterboxed every thumbnail in black bars. */
.slots{ display:grid; gap:clamp(.5rem,1.2vw,.8rem); grid-template-columns:repeat(var(--n,3),1fr); }
@media (max-width:900px){ .slots{ grid-template-columns:repeat(min(var(--n,3),2),1fr); } }
@media (max-width:560px){ .slots{ grid-template-columns:1fr; } }
.slot{ position:relative; aspect-ratio:16/9; border-radius:4px; overflow:hidden; display:block; text-decoration:none;
  background:#000; box-shadow:inset 0 0 0 1px ${alpha('#ffffff', 0.09)}, 0 5px 12px ${alpha('#000000', 0.66)};
  transition:transform .4s cubic-bezier(.16,1,.3,1), box-shadow .4s; }
.slot:hover,.slot:focus-visible{ transform:translateY(-6px) scale(1.03); outline:none;
  box-shadow:inset 0 0 0 1px var(--accent), 0 14px 26px ${alpha('#000000', 0.78)}; }
.slot img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:.92;
  transition:opacity .35s, transform .6s; }
.slot:hover img{ opacity:1; transform:scale(1.06); }
.slot::after{ content:""; position:absolute; inset:0; background:linear-gradient(transparent 34%, ${alpha('#000000', 0.9)}); }
.slot-t{ position:absolute; left:0; right:0; bottom:0; z-index:2; padding:.55rem .55rem .5rem; }
.slot-t b{ display:block; font-family:var(--f-disp); font-weight:900; text-transform:uppercase; letter-spacing:-.01em;
  font-size:clamp(.68rem,1.5vw,.82rem); line-height:1.04; color:#fff; }
.slot-t i{ display:block; font-style:normal; font-family:var(--f-mono); font-size:.5rem; letter-spacing:.13em;
  color:${alpha('#ffffff', 0.66)}; margin-top:.22rem; text-transform:uppercase; }
.slot-n{ position:absolute; top:.42rem; left:.48rem; z-index:2; font-family:var(--f-mono); font-size:.48rem;
  letter-spacing:.14em; color:${alpha(accent, 0.9)}; }

/* ---- the way in ---- */
.gate{ margin-top:clamp(1.2rem,3.5vh,2.2rem); display:flex; flex-direction:column; align-items:center; gap:.7rem;
  transition:opacity .5s; }
/* A threshold control below the fold is not a threshold. */
.gate.gone{ opacity:0; pointer-events:none; }
.gate-b{ font-family:var(--f-mono); font-size:clamp(.62rem,1.4vw,.76rem); letter-spacing:.3em; text-transform:uppercase;
  color:var(--ink); background:${alpha(ground, 0.4)}; border:1px solid var(--accent); cursor:pointer;
  padding:1rem 1.7rem; border-radius:2px; position:relative; overflow:hidden; isolation:isolate; transition:color .3s; }
.gate-b .fill{ position:absolute; inset:0; z-index:-1; background:var(--accent); transform:scaleY(var(--held,0));
  transform-origin:bottom; transition:transform .1s linear; }
.gate-b[data-held="1"]{ color:${ground}; }
.gate-h{ font-family:var(--f-mono); font-size:.6rem; letter-spacing:.26em; text-transform:uppercase; color:var(--accent); }


/* ---- chrome ---- */
.hud{ position:fixed; z-index:60; font-family:var(--f-mono); font-size:var(--hud); letter-spacing:.24em;
  text-transform:uppercase; pointer-events:none; color:var(--muted); }
.hud-tl{ top:1.1rem; left:var(--gut); color:var(--accent); font-weight:700; }
.hud-tl i{ color:var(--subtle); font-style:normal; font-weight:400 }
.hud-tr{ top:1.1rem; right:var(--gut) }
.hud-bl{ bottom:1.1rem; left:var(--gut) }
body:has(.dial) .hud-bl{ bottom:3.6rem }

.dial{ position:fixed; z-index:70; left:var(--gut); bottom:1.05rem; display:flex; gap:1px;
  background:var(--accent-line); border:1px solid var(--accent-line) }
.dial-b{ background:${alpha(ground, 0.86)}; backdrop-filter:blur(9px); border:0; color:var(--muted); cursor:pointer;
  font-family:var(--f-mono); font-size:var(--hud); letter-spacing:.24em; text-transform:uppercase; padding:.62rem .9rem;
  transition:color .2s, background .2s }
.dial-b:hover{ color:var(--ink) }
.dial-b.is-on{ background:var(--accent); color:${ground}; font-weight:700 }

.sound{ position:fixed; z-index:70; right:var(--gut); bottom:1.05rem; display:flex; align-items:center; gap:.6rem;
  cursor:pointer; font-family:var(--f-mono); font-size:var(--hud); letter-spacing:.24em; text-transform:uppercase;
  background:${alpha(ground, 0.78)}; backdrop-filter:blur(9px); border:1px solid var(--accent-line); color:var(--ink);
  padding:.62rem .95rem; transition:border-color .25s }
.sound:hover{ border-color:var(--accent) }
.sound .bars{ display:flex; align-items:flex-end; gap:2px; height:12px }
.sound .bars i{ width:2px; background:var(--accent); height:30%; transform-origin:bottom }
.sound.on .bars i{ animation:eq .9s ease-in-out infinite }
.sound.on .bars i:nth-child(2){animation-delay:.15s}.sound.on .bars i:nth-child(3){animation-delay:.3s}.sound.on .bars i:nth-child(4){animation-delay:.45s}
@keyframes eq{0%,100%{height:28%}50%{height:100%}}

/* ---- everything under the object ---- */
main{ position:relative; z-index:10 }
section{ padding:clamp(3.5rem,9vh,7rem) var(--gut); position:relative }
.slug{ font-family:var(--f-mono); font-size:var(--hud); letter-spacing:.34em; text-transform:uppercase;
  color:var(--accent); font-weight:700; margin-bottom:1.1rem; display:flex; align-items:center; gap:.8rem }
.slug::after{ content:""; flex:1; height:1px; background:var(--accent-line) }
h2{ font-family:var(--f-disp); font-weight:900; text-transform:uppercase; letter-spacing:-.02em; line-height:.92;
  font-size:clamp(1.8rem,6vw,4.2rem); margin-bottom:1.6rem }
p{ font-family:var(--f-text); line-height:1.7; color:${alpha(ink, 0.9)}; max-width:60ch;
  font-size:clamp(1rem,1.5vw,1.1rem) }
p + p{ margin-top:1rem }
.reveal{opacity:0;transform:translateY(26px);transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1)}
.reveal.in{opacity:1;transform:none}

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
  color:var(--ink); padding:.85rem .9rem; font-family:var(--f-mono); font-size:.82rem; transition:border-color .25s }
.rail input:focus,.rail textarea:focus,.rail select:focus{ outline:none; border-color:var(--accent) }
.rail textarea{ min-height:7rem; resize:vertical }
.rail button{ font-family:var(--f-mono); font-size:.66rem; letter-spacing:.3em; text-transform:uppercase; font-weight:700;
  background:var(--accent); color:${ground}; border:0; padding:1.05rem 1.5rem; cursor:pointer; transition:filter .25s }
.rail button:hover{ filter:brightness(1.12) }
.rail button[disabled]{ opacity:.5; cursor:wait }
.rail .alt{ margin-top:1.1rem; font-family:var(--f-mono); font-size:.6rem; letter-spacing:.16em; color:var(--muted) }
.rail .alt a{ color:var(--accent) }
.form-msg{ font-family:var(--f-mono); font-size:.66rem; letter-spacing:.14em; margin-top:.9rem; min-height:1.2em }
.form-msg.ok{ color:var(--accent) } .form-msg.err{ color:#FF8A8A }
.links{ display:flex; flex-wrap:wrap; gap:.55rem; margin-top:2rem }
.links a{ font-family:var(--f-mono); font-size:.6rem; letter-spacing:.24em; text-transform:uppercase; text-decoration:none;
  border:1px solid var(--line); padding:.72rem 1rem; color:var(--muted); transition:color .25s,border-color .25s }
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

@media (max-width:700px){
  .hud-tr,.hud-bl{ display:none }
  .sound{ right:auto; left:auto; right:var(--gut) }
  .case{ transform:rotateX(8deg) } .case.open{ transform:rotateX(16deg) }
}
@media (prefers-reduced-motion:reduce){
  *{ animation-duration:.001ms !important; animation-iteration-count:1 !important; transition-duration:.001ms !important;
     scroll-behavior:auto !important }
  .reveal{ opacity:1; transform:none } .tray{ opacity:1; transform:none }
}
`;
}
