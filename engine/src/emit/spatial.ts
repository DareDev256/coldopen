/**
 * COLD OPEN — the SPATIAL topology.
 *
 * The other topologies are pages. This one is an OBJECT: a thing that stands
 * in front of you, that you open, and that has the artist's work packed inside
 * it rather than laid out beneath it.
 *
 * The first pass laid the case flat, hinged at the back. It read as a laptop.
 * A designer cabin case STANDS UP — ribbed shell, corner caps, wheels, a
 * telescoping handle — and it opens as a clamshell, splitting down the middle.
 * That is the difference between a box and a piece of luggage, and it is the
 * whole reason to build an object instead of a grid.
 */

import type { World } from '../world.ts';
import { hsl } from '../world.ts';

const alpha = (hex: string, a: number) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

export interface CaseShell {
  readonly material: 'aluminium' | 'lacquer' | 'polycarbonate';
  readonly stamps: readonly { text: string; sub: string; rotate: number; factId?: string }[];
  readonly mirror: string;
  readonly trays: readonly { label: string; from: number; to: number }[];
  /** stamped into the shell plate */
  readonly engraving: string;
  /** how many items ride in the open case itself, before the rest */
  readonly packed?: number;
}

export function emitSpatialCSS(w: World, shell: CaseShell): string {
  const { ground, accent, payoff, ink, muted } = w.palette;
  const metal = shell.material === 'aluminium';
  const shellA = metal ? '#C3C8CF' : '#131117';
  const shellB = metal ? '#7C838D' : '#08070A';
  const shellC = metal ? '#EEF1F5' : '#2A2630';
  const lining = alpha(accent, 0.10);

  return `/* =========================================================
   ${w.artist} — "${w.name}"  ·  SPATIAL
   ${w.logline}

   Not a page with sections. A case that stands up and opens.
   ========================================================= */

:root{
  --ground:${ground}; --ink:${ink}; --muted:${muted}; --subtle:${alpha(ink, 0.34)};
  --accent:${accent}; --accent-line:${alpha(accent, 0.42)}; --payoff:${payoff};
  --line:${alpha(ink, 0.16)};
  --shellA:${shellA}; --shellB:${shellB}; --shellC:${shellC};
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
button{font:inherit}
.mono{font-family:var(--f-mono);font-variant-numeric:tabular-nums}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
::selection{background:var(--accent);color:${ground}}

/* =========================================================
   1 · THE STAND — where the case waits
   ========================================================= */
#stage{ position:relative; min-height:100svh; display:flex; flex-direction:column; align-items:center;
  justify-content:center; padding:clamp(2.2rem,5vh,4rem) var(--gut) clamp(2rem,5vh,3.5rem);
  perspective:1500px; perspective-origin:50% 42%; gap:clamp(.7rem,2vh,1.3rem); }
/* the floor it stands on */
#stage::after{ content:""; position:absolute; left:50%; bottom:clamp(6rem,15vh,11rem); width:min(56vw,440px); height:44px;
  transform:translateX(-50%); border-radius:50%; pointer-events:none; z-index:0;
  background:radial-gradient(closest-side, ${alpha('#000000', 0.55)}, transparent 76%); filter:blur(11px); }

.premise{ font-family:var(--f-mono); font-size:var(--hud); letter-spacing:.42em; text-transform:uppercase;
  color:var(--accent); font-weight:700; text-align:center; }
.wordmark{ font-family:var(--f-disp); font-weight:900; text-transform:uppercase;
  font-size:clamp(1.7rem,6.5vw,4.4rem); line-height:.86; letter-spacing:-.035em; text-align:center; }

/* =========================================================
   2 · THE CASE — upright, ribbed, on wheels
   ========================================================= */
/* Sized from viewport HEIGHT, not width.
 *
 * Width-based sizing put the case at 614px of a 664px phone screen and pushed
 * the language tags below the fold — which is the precise failure the tags
 * exist to avoid. Driving the height guarantees the object AND its tags share
 * one screen at any aspect ratio. */
.case{ position:relative; height:min(46svh,430px); width:auto; aspect-ratio:.72; transform-style:preserve-3d;
  transform:rotateY(-15deg) rotateX(3deg); transition:transform 1.2s cubic-bezier(.16,1,.3,1); z-index:2;
  margin-top:clamp(2.4rem,6vh,4.2rem); }
.case.open{ transform:rotateY(0deg) rotateX(1deg) scale(1.12); }

/* the telescoping handle, behind the shell */
.tele{ position:absolute; left:26%; right:26%; top:-11%; height:12%; z-index:0; transform:translateZ(-26px); }
.tele span{ position:absolute; top:0; bottom:0; width:7px; border-radius:4px;
  background:linear-gradient(90deg, ${alpha('#ffffff', 0.5)}, var(--shellB)); box-shadow:0 2px 6px ${alpha('#000000', 0.5)}; }
.tele span:first-child{ left:0 } .tele span:last-child{ right:0 }
.tele::after{ content:""; position:absolute; left:-6px; right:-6px; top:0; height:12px; border-radius:6px;
  background:linear-gradient(180deg, var(--shellC), var(--shellB)); box-shadow:0 3px 8px ${alpha('#000000', 0.55)}; }

/* the two halves of the clamshell */
.half{ position:absolute; top:0; bottom:0; width:50.4%; transform-style:preserve-3d; z-index:3;
  transition:transform 1.35s cubic-bezier(.5,.02,.28,1); }
.half.l{ left:0; transform-origin:left center; }
.half.r{ right:0; transform-origin:right center; }
.case.open .half.l{ transform:rotateY(-124deg); }
.case.open .half.r{ transform:rotateY(124deg); }

.face{ position:absolute; inset:0; backface-visibility:hidden; overflow:hidden; }
/* the ribbed shell — the one detail that says "luggage" and not "box" */
.face.out{
  background:
    repeating-linear-gradient(90deg,
      ${alpha('#000000', metal ? 0.16 : 0.5)} 0 2px,
      transparent 2px 5px,
      ${alpha('#ffffff', metal ? 0.34 : 0.06)} 5px 7px,
      transparent 7px 22px),
    linear-gradient(104deg, var(--shellC) 0%, var(--shellA) 34%, var(--shellB) 74%, #000 130%);
  box-shadow:inset 0 0 0 1px ${alpha('#000000', 0.55)}, 0 26px 54px ${alpha('#000000', 0.5)};
}
.half.l .face.out{ border-radius:14px 3px 3px 14px; }
.half.r .face.out{ border-radius:3px 14px 14px 3px; }
/* The inside of each half. It first rendered as a flat black rectangle, which
   is what a lid looks like if you forget it has a lining, a divider and a
   branded strip in it — the details that separate luggage from a box. */
.face.in{ transform:rotateY(180deg);
  background:
    repeating-linear-gradient(52deg, ${alpha(accent, 0.09)} 0 1px, transparent 1px 8px),
    repeating-linear-gradient(-52deg, ${alpha(accent, 0.06)} 0 1px, transparent 1px 8px),
    linear-gradient(160deg, #1A1720, #08070B 82%);
  box-shadow:inset 0 0 0 2px ${alpha(payoff, 0.34)}, inset 0 0 44px ${alpha('#000000', 0.9)}; }
/* the zip divider that runs round the lid */
.face.in::before{ content:""; position:absolute; inset:7%; border-radius:3px; pointer-events:none;
  border:1px dashed ${alpha('#ffffff', 0.2)};
  background:repeating-linear-gradient(90deg, transparent 0 6px, ${alpha('#ffffff', 0.05)} 6px 7px); }
/* the maker's strip, the way a real lining carries one */
.face.in::after{ content:"${(w.artist + ' · ' + w.name).toUpperCase()}"; position:absolute; left:0; right:0; bottom:11%;
  text-align:center; font-family:var(--f-mono); font-size:clamp(.36rem,.85vw,.46rem); letter-spacing:.34em;
  color:${alpha(payoff, 0.62)}; pointer-events:none; }
.half.l .face.in{ border-radius:14px 3px 3px 14px } .half.r .face.in{ border-radius:3px 14px 14px 3px }

/* corner caps */
.cap{ position:absolute; width:15%; height:11%; z-index:4; pointer-events:none;
  background:linear-gradient(140deg, ${alpha('#ffffff', 0.42)}, ${alpha('#000000', 0.5)}); }
.cap.tl{ top:0; left:0; border-radius:14px 0 40% 0 } .cap.bl{ bottom:0; left:0; border-radius:0 40% 0 14px }
.cap.tr{ top:0; right:0; border-radius:0 14px 0 40% } .cap.br{ bottom:0; right:0; border-radius:40% 0 14px 0 }

/* the seam down the middle — a dark gap where the two halves meet */
.seam{ position:absolute; z-index:5; top:1%; bottom:1%; left:50%; width:5px; transform:translateX(-50%);
  background:linear-gradient(90deg, ${alpha('#000000', 0.1)}, ${alpha('#000000', 0.86)} 45%, ${alpha('#000000', 0.86)} 55%, ${alpha('#ffffff', 0.22)});
  border-radius:2px; transition:opacity .4s; }
.case.open .seam{ opacity:0 }

/* the latches down the seam */
.latch{ position:absolute; left:50%; transform:translateX(-50%); z-index:6; width:13%; height:4.4%;
  border-radius:2px; background:linear-gradient(180deg, var(--payoff), ${alpha(payoff, 0.45)});
  box-shadow:0 2px 6px ${alpha('#000000', 0.6)}, inset 0 1px 0 ${alpha('#ffffff', 0.6)};
  transition:opacity .4s; }
.latch.a{ top:26% } .latch.b{ top:66% }
.case.open .latch{ opacity:0 }

/* the plate */
/* recessed and dark, so it reads on brushed metal instead of vanishing into it */
.plate{ position:absolute; z-index:5; top:7%; left:50%; transform:translateX(-50%);
  font-family:var(--f-mono); font-size:clamp(.46rem,1.05vw,.58rem); letter-spacing:.26em; font-weight:700;
  color:${alpha(payoff, 0.95)}; background:${alpha('#000000', 0.82)};
  border:1px solid ${alpha(payoff, 0.4)}; padding:.34rem .62rem; border-radius:2px;
  box-shadow:inset 0 1px 3px ${alpha('#000000', 0.9)}, 0 1px 0 ${alpha('#ffffff', 0.35)};
  transition:opacity .4s; white-space:nowrap; }
.case.open .plate{ opacity:0 }

/* travel stamps stuck to the shell */
.stamp{ position:absolute; z-index:5; padding:.34rem .5rem; border:2px solid ${alpha(accent, 0.9)};
  color:${alpha(accent, 0.95)}; font-family:var(--f-mono); text-transform:uppercase; text-align:center;
  border-radius:3px; background:${alpha('#000000', 0.42)}; transition:opacity .4s; white-space:nowrap; }
.stamp{ max-width:80% }
.stamp b{ display:block; font-size:clamp(.42rem,1.05vw,.62rem); letter-spacing:.1em; font-weight:700 }
.stamp i{ display:block; font-style:normal; font-size:.42rem; letter-spacing:.16em; opacity:.78; margin-top:1px }
.case.open .stamp{ opacity:0 }

/* wheels + grab handles */
.wheel{ position:absolute; bottom:-2.6%; width:8.5%; height:4.2%; z-index:0; border-radius:0 0 50% 50%/0 0 100% 100%;
  background:linear-gradient(180deg, #34343C, #0A0A0C 74%);
  box-shadow:0 5px 10px ${alpha('#000000', 0.66)} }
.wheel.w1{ left:9% } .wheel.w2{ left:27% } .wheel.w3{ right:27% } .wheel.w4{ right:9% }
.grab{ position:absolute; z-index:6; background:linear-gradient(180deg, var(--shellC), var(--shellB));
  border-radius:5px; box-shadow:0 3px 8px ${alpha('#000000', 0.5)} }
.grab.top{ top:-3.4%; left:38%; width:24%; height:3.4% }
.grab.side{ top:44%; right:-2.4%; width:3.2%; height:15%; border-radius:4px }

/* =========================================================
   3 · THE LUGGAGE TAG — and the language choice
   It hangs on the handle, at eye level, and picking one is what opens
   the case. A language switch tucked in a corner is a switch nobody finds.
   ========================================================= */
.tagline{ font-family:var(--f-mono); font-size:clamp(.56rem,1.3vw,.7rem); letter-spacing:.26em;
  text-transform:uppercase; color:${alpha(ink, 0.86)}; text-align:center; line-height:2; }
.tagline b{ color:var(--accent); font-weight:700 }
.tags{ display:flex; gap:clamp(.5rem,1.4vw,.9rem); justify-content:center; flex-wrap:wrap; z-index:6; position:relative; }
.tag{ position:relative; cursor:pointer; border:0; padding:0; background:none; }
/* the string it hangs by */
.tag::before{ content:""; position:absolute; left:50%; top:-14px; width:1px; height:14px;
  background:${alpha(ink, 0.5)}; }
.tag-body{ display:block; min-width:clamp(84px,15vw,116px); padding:1.15rem .7rem .6rem; border-radius:3px;
  background:linear-gradient(160deg, ${alpha(ink, 0.94)}, ${alpha(ink, 0.8)}); color:${ground};
  box-shadow:0 6px 16px ${alpha('#000000', 0.45)}; transition:transform .28s cubic-bezier(.16,1,.3,1), box-shadow .28s;
  border-top:3px solid var(--accent); }
.tag:hover .tag-body,.tag:focus-visible .tag-body{ transform:translateY(-5px) rotate(-1.4deg);
  box-shadow:0 14px 26px ${alpha('#000000', 0.55)}; outline:none }
.tag-code{ display:block; font-family:var(--f-disp); font-weight:900; font-size:clamp(1.1rem,2.6vw,1.5rem);
  letter-spacing:.04em; line-height:1 }
.tag-name{ display:block; font-family:var(--f-mono); font-size:.5rem; letter-spacing:.2em; text-transform:uppercase;
  opacity:.66; margin-top:.28rem }
/* the punched hole */
.tag-body::after{ content:""; position:absolute; left:50%; top:9px; transform:translateX(-50%);
  width:7px; height:7px; border-radius:50%; background:var(--ground); box-shadow:inset 0 1px 2px ${alpha('#000000', 0.6)} }
.tags.gone{ opacity:0; pointer-events:none; transition:opacity .5s }

/* =========================================================
   4 · WHAT IS PACKED INSIDE
   ========================================================= */
.inside{ position:absolute; inset:0; z-index:1; display:grid; grid-template-columns:1fr 1fr;
  gap:2px; padding:3.5%; border-radius:12px; overflow:hidden;
  background:linear-gradient(160deg, #17141D, #08070B 78%);
  box-shadow:inset 0 0 0 2px ${alpha(payoff, 0.24)}, inset 0 0 60px ${alpha('#000000', 0.92)};
  opacity:0; transition:opacity .5s ease .55s; }
.case.open .inside{ opacity:1 }
/* the lining weave */
.inside::before{ content:""; position:absolute; inset:0; pointer-events:none; opacity:.5;
  background:repeating-linear-gradient(48deg, ${lining} 0 1px, transparent 1px 7px) }

.compartment{ position:relative; padding:4.5%; display:flex; flex-direction:column; gap:4.5%; min-height:0 }

/* left: the mirror in the lid, and the tag pocket */
.mirror{ position:relative; flex:1 1 56%; border-radius:3px; overflow:hidden; background:#08080A; min-height:0;
  box-shadow:inset 0 0 0 3px ${alpha(payoff, 0.55)}, 0 5px 14px ${alpha('#000000', 0.7)} }
.mirror img{ width:100%; height:100%; object-fit:cover; object-position:50% 24%;
  filter:contrast(1.05) saturate(.9) brightness(1.05) }
.mirror::after{ content:""; position:absolute; inset:0; pointer-events:none;
  background:linear-gradient(116deg, ${alpha('#ffffff', 0.26)} 0%, transparent 22%, transparent 66%, ${alpha('#ffffff', 0.12)} 92%) }
.mirror-cap{ position:absolute; left:0; right:0; bottom:0; z-index:2; padding:.5rem .55rem;
  font-family:var(--f-mono); font-size:clamp(.42rem,1vw,.54rem); letter-spacing:.22em; text-transform:uppercase;
  color:${alpha('#ffffff', 0.92)}; background:linear-gradient(transparent, ${alpha('#000000', 0.88)}) }
/* the zip mesh pocket */
.pocket{ position:relative; flex:0 0 34%; border-radius:3px; overflow:hidden; min-height:0;
  background:${alpha('#ffffff', 0.05)};
  box-shadow:inset 0 0 0 1px ${alpha('#ffffff', 0.14)} }
.pocket::before{ content:""; position:absolute; inset:0;
  background:repeating-linear-gradient(45deg, ${alpha('#ffffff', 0.12)} 0 1px, transparent 1px 6px),
             repeating-linear-gradient(-45deg, ${alpha('#ffffff', 0.12)} 0 1px, transparent 1px 6px) }
.zip{ position:absolute; top:0; left:0; right:0; height:7px; z-index:2;
  background:repeating-linear-gradient(90deg, ${alpha(payoff, 0.85)} 0 2px, ${alpha('#000000', 0.5)} 2px 4px) }
.pocket-t{ position:absolute; inset:auto 0 0 0; z-index:3; padding:.5rem .55rem;
  font-family:var(--f-mono); font-size:clamp(.4rem,.95vw,.5rem); letter-spacing:.18em; text-transform:uppercase;
  color:${alpha('#ffffff', 0.78)}; line-height:1.7 }

/* right: the packed items under elastic straps */
.packed{ position:relative; flex:1; display:flex; flex-direction:column; gap:4%; min-height:0 }
.strap{ position:absolute; z-index:4; pointer-events:none; background:${alpha('#1A1A20', 0.9)};
  box-shadow:0 1px 3px ${alpha('#000000', 0.7)}, inset 0 1px 0 ${alpha('#ffffff', 0.14)} }
.strap.h{ left:-3%; right:-3%; height:8px; top:47%; z-index:6 }
.strap.buckle{ left:50%; top:calc(47% - 5px); transform:translateX(-50%); width:18px; height:16px; border-radius:2px; z-index:7;
  background:linear-gradient(180deg, var(--payoff), ${alpha(payoff, 0.5)}) }
.item{ position:relative; flex:1; border-radius:2px; overflow:hidden; display:block; text-decoration:none;
  min-height:0; background:#000; box-shadow:inset 0 0 0 1px ${alpha('#ffffff', 0.1)}, 0 3px 8px ${alpha('#000000', 0.6)};
  transition:transform .35s cubic-bezier(.16,1,.3,1) }
.item:hover,.item:focus-visible{ transform:scale(1.035); outline:none; z-index:5 }
.item img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:.94 }
.item::after{ content:""; position:absolute; inset:0; background:linear-gradient(transparent 38%, ${alpha('#000000', 0.92)}) }
.item-t{ position:absolute; left:0; right:0; bottom:0; z-index:2; padding:.4rem .45rem }
.item-t b{ display:block; font-family:var(--f-disp); font-weight:900; text-transform:uppercase;
  font-size:clamp(.56rem,1.25vw,.74rem); line-height:1.04; color:#fff }
.item-t i{ display:block; font-style:normal; font-family:var(--f-mono); font-size:clamp(.36rem,.9vw,.46rem);
  letter-spacing:.11em; color:${alpha('#ffffff', 0.7)}; margin-top:.14rem; text-transform:uppercase }

.hint{ font-family:var(--f-mono); font-size:.58rem; letter-spacing:.26em; text-transform:uppercase;
  color:var(--accent); text-align:center; opacity:0; transition:opacity .5s ease .9s }
.case.open ~ .hint{ opacity:1 }

/* =========================================================
   5 · THE REST OF THE LUGGAGE, unpacked below
   ========================================================= */
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

.cube{ margin-bottom:clamp(1rem,2.4vw,1.6rem); border-radius:5px; padding:clamp(.8rem,1.8vw,1.2rem);
  background:${alpha('#000000', 0.34)}; box-shadow:inset 0 0 0 1px ${alpha(ink, 0.12)} }
.cube-lab{ font-family:var(--f-mono); font-size:.56rem; letter-spacing:.3em; text-transform:uppercase;
  color:var(--accent); margin-bottom:.7rem; display:flex; align-items:center; gap:.7rem }
.cube-lab::after{ content:""; flex:1; height:1px; background:${alpha(accent, 0.22)} }
.slots{ display:grid; gap:clamp(.5rem,1.2vw,.8rem); grid-template-columns:repeat(var(--n,3),1fr) }
@media (max-width:900px){ .slots{ grid-template-columns:repeat(min(var(--n,3),2),1fr) } }
@media (max-width:560px){ .slots{ grid-template-columns:1fr } }
.slot{ position:relative; aspect-ratio:16/9; border-radius:3px; overflow:hidden; display:block; text-decoration:none;
  background:#000; box-shadow:inset 0 0 0 1px ${alpha('#ffffff', 0.1)}, 0 5px 12px ${alpha('#000000', 0.6)};
  transition:transform .4s cubic-bezier(.16,1,.3,1), box-shadow .4s }
.slot:hover,.slot:focus-visible{ transform:translateY(-5px) scale(1.02); outline:none;
  box-shadow:inset 0 0 0 1px var(--accent), 0 14px 26px ${alpha('#000000', 0.75)} }
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

/* =========================================================
   6 · CHROME
   ========================================================= */
.hud{ position:fixed; z-index:60; font-family:var(--f-mono); font-size:var(--hud); letter-spacing:.24em;
  text-transform:uppercase; pointer-events:none; color:var(--muted) }
.hud-tl{ top:1.1rem; left:var(--gut); color:var(--accent); font-weight:700 }
.hud-tl i{ color:var(--subtle); font-style:normal; font-weight:400 }
.hud-tr{ top:1.1rem; right:var(--gut) }
.hud-bl{ bottom:1.1rem; left:var(--gut) }

/* the small tag that stays once a language is chosen */
.dial{ position:fixed; z-index:70; top:1rem; left:50%; transform:translateX(-50%); display:flex; gap:1px;
  background:var(--accent-line); border:1px solid var(--accent-line); border-radius:2px; overflow:hidden;
  opacity:0; pointer-events:none; transition:opacity .5s }
.dial.shown{ opacity:1; pointer-events:auto }
.dial-b{ background:${alpha(ground, 0.9)}; backdrop-filter:blur(9px); border:0; color:var(--muted); cursor:pointer;
  font-family:var(--f-mono); font-size:var(--hud); letter-spacing:.22em; text-transform:uppercase; padding:.55rem .85rem;
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

@media (max-width:760px){
  .hud-tr,.hud-bl{ display:none }
  .case{ height:min(40svh,330px); max-width:78vw }
  .wordmark{ font-size:clamp(1.4rem,8vw,2.2rem) }
  .tag-body{ min-width:clamp(70px,22vw,96px); padding:1rem .5rem .5rem }
  .tagline{ font-size:.54rem; letter-spacing:.18em }
  /* stamps collided across the seam once the shell narrowed */
  .stamp{ max-width:72%; padding:.24rem .34rem }
  .stamp i{ display:none }
}
/* short landscape windows: the object gets out of its own way */
@media (max-height:620px){
  .case{ height:min(52svh,300px) }
  .wordmark{ font-size:clamp(1.2rem,5vw,1.9rem) }
}
@media (prefers-reduced-motion:reduce){
  *{ animation-duration:.001ms !important; animation-iteration-count:1 !important; transition-duration:.001ms !important;
     scroll-behavior:auto !important }
  .reveal{ opacity:1; transform:none } .inside{ opacity:1 }
}
`;
}
