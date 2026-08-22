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
   0 · HER FOOTAGE, AS THE GROUND
   Aerials over the Luanda coast, the jetski, the quad on the beach. It plays
   behind the case rather than on a panel, because a flat swatch behind an
   object is a studio backdrop and this is meant to be where she is.
   ========================================================= */
#ground{ position:fixed; inset:0; z-index:0; overflow:hidden; pointer-events:none; }
/* Her footage reads as HER footage. The wash was the ground colour laid over
   the top at 85%, which turns Angola blue and makes every plate look like the
   same shot. The scrim is neutral now: it darkens for legibility and does not
   recolour anything. */
#ground video,#ground img{ width:100%; height:100%; object-fit:cover;
  filter:contrast(1.04) brightness(.84); }
#ground::after{ content:""; position:absolute; inset:0;
  background:radial-gradient(120% 88% at 50% 42%, rgba(0,0,0,.16) 0%, rgba(0,0,0,.52) 62%, rgba(0,0,0,.76) 100%),
             linear-gradient(180deg, rgba(0,0,0,.48), transparent 22%, transparent 68%, rgba(0,0,0,.7)); }
/* once the case is open the footage steps back so the contents are the picture */
body.is-open #ground video{ filter:contrast(1) brightness(.42) blur(2px); transition:filter 1.2s ease; }
body.is-open #ground::after{ background:
  radial-gradient(120% 90% at 50% 50%, rgba(0,0,0,.52) 0%, rgba(0,0,0,.76) 68%, rgba(0,0,0,.86) 100%); }

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
/* The case grows to 1.4 when open and its raised handle reaches above its own
   box, so the wordmark needs clearance measured from the SCALED height, not
   the resting one. transform-origin keeps it growing downward, away from the
   type, rather than outward from its middle. */
.case.open{ transform:rotateY(0deg) rotateX(1deg) scale(1.4); transform-origin:50% 62%;
  margin-top:clamp(3.5rem,10vw,7rem); }

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
/* Past 90 so the inner faces turn toward the viewer, but nowhere near flat —
   the lids now carry the paperwork and the back catalogue, and content you
   cannot read is content you did not ship. */
.case.open .half.l{ transform:rotateY(-153deg); }
.case.open .half.r{ transform:rotateY(153deg); }

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
  box-shadow:inset 0 0 0 2px ${alpha(payoff, 0.34)}, inset 0 0 26px ${alpha('#000000', 0.66)}; }
/* the zip divider that runs round the lid */
.face.in::before{ content:""; position:absolute; inset:7%; border-radius:3px; pointer-events:none;
  border:1px dashed ${alpha('#ffffff', 0.2)};
  background:repeating-linear-gradient(90deg, transparent 0 6px, ${alpha('#ffffff', 0.05)} 6px 7px); }
/* the maker's strip sits UNDER the lid content now, not across it */
.face.in::after{ content:"${(w.artist + ' · ' + w.name).toUpperCase()}"; position:absolute; left:0; right:0; bottom:2%;
  text-align:center; font-family:var(--f-mono); font-size:clamp(.28rem,.68vw,.38rem); letter-spacing:.3em;
  color:${alpha(payoff, 0.42)}; pointer-events:none; z-index:1; }

/* THE LIDS CARRY CONTENT.
   Left lid: the paperwork. Right lid: the back catalogue. Middle: what is
   current. Two empty lined panels either side of a crowded middle was the
   whole case doing one third of the work. */
.lid-in-wrap{ position:absolute; inset:6% 6% 9%; z-index:3; display:flex; flex-direction:column;
  gap:clamp(.26rem,.8vw,.44rem); overflow:hidden; }
.lid-lab{ font-family:var(--f-mono); font-size:clamp(.32rem,.8vw,.42rem); letter-spacing:.26em;
  text-transform:uppercase; color:${alpha(accent, 0.85)}; flex:0 0 auto; margin-bottom:.05rem; }
.lid-in-wrap .dtag{ flex:1 1 0; min-height:0; display:flex; flex-direction:column; justify-content:center; }
.lid-in-wrap .slot{ flex:1 1 0; min-height:0; aspect-ratio:auto; }
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
.pocket{ position:relative; flex:0 0 26%; cursor:pointer; border:0; padding:0; width:100%; display:block;
  text-align:left; transition:transform .2s, box-shadow .2s; border-radius:3px; overflow:hidden; min-height:0; cursor:pointer;
  border:0; padding:0; width:100%; display:block; text-align:left;
  transition:box-shadow .25s, transform .25s;
  background:${alpha('#ffffff', 0.05)};
  box-shadow:inset 0 0 0 1px ${alpha('#ffffff', 0.14)} }
.pocket:hover,.pocket:focus-visible{ outline:none; transform:translateY(-2px);
  box-shadow:inset 0 0 0 1px ${alpha(accent, 0.7)}, 0 6px 14px ${alpha('#000000', 0.5)} }
.pocket::before{ content:""; position:absolute; inset:0;
  background:repeating-linear-gradient(45deg, ${alpha('#ffffff', 0.12)} 0 1px, transparent 1px 6px),
             repeating-linear-gradient(-45deg, ${alpha('#ffffff', 0.12)} 0 1px, transparent 1px 6px) }
.pocket:hover,.pocket:focus-visible{ outline:none; transform:translateY(-2px) }
.zip{ position:absolute; top:0; left:0; right:0; height:7px; z-index:2;
  background:repeating-linear-gradient(90deg, ${alpha(payoff, 0.85)} 0 2px, ${alpha('#000000', 0.5)} 2px 4px) }
.pocket-t{ position:absolute; inset:auto 0 0 0; z-index:3; padding:.5rem .55rem;
  font-family:var(--f-mono); font-size:clamp(.4rem,.95vw,.5rem); letter-spacing:.18em; text-transform:uppercase;
  color:${alpha('#ffffff', 0.78)}; line-height:1.7 }

/* right: the packed items under elastic straps */
/* The middle carries the current catalogue — seven items, not four — so it is
   a grid rather than a column. A column of seven in a case-height compartment
   gives each one a 20px sliver. */
.packed{ position:relative; flex:1; display:grid; grid-template-columns:1fr 1fr;
  gap:clamp(.2rem,.7vw,.36rem); min-height:0; align-content:stretch }
.packed .item{ min-height:0 }
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
.item-t{ position:absolute; left:0; right:0; bottom:0; z-index:2; padding:.32rem .38rem }
.item-t b{ font-family:var(--f-disp); font-weight:900; text-transform:uppercase;
  font-size:clamp(.48rem,1vw,.62rem); line-height:1.02; color:#fff;
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden }
.item-t i{ display:block; font-style:normal; font-family:var(--f-mono); font-size:clamp(.3rem,.72vw,.38rem);
  letter-spacing:.08em; color:${alpha('#ffffff', 0.78)}; margin-top:.1rem; text-transform:uppercase;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis }

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
.slot-t b{ font-family:var(--f-disp); font-weight:900; text-transform:uppercase;
  font-size:clamp(.5rem,1.1vw,.68rem); line-height:1.02; color:#fff;
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden }
.slot-t i{ display:block; font-style:normal; font-family:var(--f-mono); font-size:.38rem; letter-spacing:.09em;
  color:${alpha('#ffffff', 0.78)}; margin-top:.14rem; text-transform:uppercase;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.slot-n{ position:absolute; top:.42rem; left:.48rem; z-index:2; font-family:var(--f-mono); font-size:.48rem;
  letter-spacing:.14em; color:${alpha(accent, 0.92)} }

/* =========================================================
   5b · THE PAPERWORK, INSIDE THE CASE
   What used to be four sections under the page is four objects in the lid:
   a baggage docket, a manifest, a customs form and her feed. Plus the pouch,
   which holds the passport. If everything she is fits in this case, a
   scrolling document underneath it contradicts the premise.
   ========================================================= */
.docs{ display:grid; grid-template-columns:1fr 1fr; gap:.34rem; margin-top:.5rem; }
.dtag{ position:relative; display:block; width:100%; text-align:left; cursor:pointer; border:0;
  padding:.5rem .55rem .45rem; border-radius:2px; background:linear-gradient(160deg,#F2EEE2,#DCD6C4);
  color:#14131A; border-top:3px solid var(--accent);
  box-shadow:0 3px 9px ${alpha('#000000', 0.5)}; transition:transform .22s cubic-bezier(.16,1,.3,1), box-shadow .22s; }
.dtag:hover,.dtag:focus-visible{ transform:translateY(-3px) rotate(-.8deg);
  box-shadow:0 9px 18px ${alpha('#000000', 0.6)}; outline:none; }
.dtag b{ display:block; font-family:var(--f-disp); font-weight:900; text-transform:uppercase;
  font-size:clamp(.54rem,1.15vw,.68rem); line-height:1.02; letter-spacing:-.01em; }
.dtag i{ display:block; font-style:normal; font-family:var(--f-mono); font-size:.4rem;
  letter-spacing:.16em; text-transform:uppercase; color:#6A6252; margin-top:.2rem; }
@media (max-width:760px){ .docs{ grid-template-columns:1fr } }

.panel{ position:fixed; inset:0; z-index:120; display:flex; align-items:center; justify-content:center;
  padding:var(--gut); background:${alpha('#04050A', 0.88)}; backdrop-filter:blur(10px);
  opacity:0; visibility:hidden; pointer-events:none; transition:opacity .3s ease, visibility .3s; }
.panel.open{ opacity:1; visibility:visible; pointer-events:auto; }
.doc{ position:relative; width:min(100%,760px); max-height:86svh; overflow:auto;
  background:linear-gradient(168deg,#F6F3EA,#E6E1D4); color:#14131A; border-radius:3px;
  box-shadow:0 30px 80px ${alpha('#000000', 0.6)}; padding:clamp(1.4rem,4vw,2.6rem); }
.doc--wide{ width:min(100%,1080px) }
.doc::before{ content:""; position:absolute; inset:10px; border:1px solid ${alpha('#14131A', 0.22)}; pointer-events:none }
.doc-h{ font-family:var(--f-mono); font-size:.54rem; letter-spacing:.3em; text-transform:uppercase; color:#6A6252;
  display:flex; justify-content:space-between; gap:1rem; flex-wrap:wrap; margin-bottom:1.1rem }
.doc h3{ font-family:var(--f-disp); font-weight:900; text-transform:uppercase; letter-spacing:-.02em; line-height:.92;
  font-size:clamp(1.6rem,5vw,2.8rem); margin-bottom:1rem; color:#14131A }
.doc p{ color:#2A2733; max-width:58ch; font-size:clamp(.94rem,1.5vw,1.02rem); line-height:1.72 }
.doc p + p{ margin-top:.8rem }
.doc-fields{ display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:1px;
  background:${alpha('#14131A', 0.18)}; border:1px solid ${alpha('#14131A', 0.18)}; margin:1.4rem 0 }
.doc-f{ background:#F2EFE6; padding:.75rem .85rem }
.doc-f b{ display:block; font-family:var(--f-disp); font-weight:900; font-size:1rem; color:#14131A }
.doc-f span{ display:block; font-family:var(--f-mono); font-size:.48rem; letter-spacing:.2em; text-transform:uppercase;
  color:#6A6252; margin-top:.28rem }
.doc-q{ border-left:3px solid #B4181F; padding:.2rem 0 .2rem 1rem; margin:1.2rem 0; font-style:italic; color:#2A2733 }
.doc-q cite{ display:block; font-style:normal; font-family:var(--f-mono); font-size:.48rem; letter-spacing:.2em;
  text-transform:uppercase; color:#6A6252; margin-top:.45rem }
.doc-q cite a{ color:#B4181F }
.doc-x{ position:absolute; top:.7rem; right:.8rem; z-index:2; background:none; border:0; cursor:pointer;
  font-family:var(--f-mono); font-size:.58rem; letter-spacing:.24em; color:#6A6252; padding:.4rem }
.doc-x:hover{ color:#B4181F }
.doc .figures{ display:grid; grid-template-columns:repeat(auto-fit,minmax(158px,1fr)); gap:1px;
  background:${alpha('#14131A', 0.18)}; border:1px solid ${alpha('#14131A', 0.18)}; margin:1.3rem 0 }
.doc .fig{ background:#F2EFE6; padding:.8rem .85rem; position:relative; min-height:0;
  display:flex; flex-direction:column; justify-content:flex-end }
.doc .fig b{ display:block; font-family:var(--f-disp); font-weight:900; font-size:clamp(1.25rem,3vw,1.85rem);
  line-height:1; letter-spacing:-.02em; color:#14131A; font-variant-numeric:tabular-nums; overflow-wrap:anywhere }
.doc .fig .fl{ display:block; font-family:var(--f-mono); font-size:.46rem; letter-spacing:.2em; text-transform:uppercase;
  color:#6A6252; margin-top:.38rem }
.doc .fig .src{ position:absolute; top:.45rem; right:.55rem; font-family:var(--f-mono); font-size:.42rem;
  letter-spacing:.12em; color:#8A8270; text-decoration:none; border-bottom:1px dotted #B5AC98 }
.doc .fig .src:hover{ color:#B4181F }
.doc .fig.sealed b{ display:flex; align-items:center; height:clamp(1.25rem,3vw,1.85rem) }
.doc .fig.sealed .bar{ display:block; width:min(100%,8ch); height:.6em;
  background:repeating-linear-gradient(90deg, ${alpha('#14131A', 0.42)} 0 .8em, transparent .8em .95em) }
.doc .fig.sealed .fl{ color:#B4181F }
.doc table{ width:100%; border-collapse:collapse; font-family:var(--f-mono); font-size:.6rem; margin-top:1rem }
.doc th{ text-align:left; letter-spacing:.2em; text-transform:uppercase; color:#6A6252; font-size:.46rem;
  padding:.5rem .55rem; border-bottom:1px solid ${alpha('#14131A', 0.3)}; font-weight:700 }
.doc td{ padding:.5rem .55rem; border-bottom:1px solid ${alpha('#14131A', 0.14)}; color:#2A2733; vertical-align:top }
.doc td a{ color:#B4181F; text-decoration:none; border-bottom:1px dotted rgba(180,24,31,.4); word-break:break-all }
.doc .wrap{ overflow-x:auto }
.doc form{ display:grid; gap:.7rem; margin-top:1.2rem }
.doc label{ font-family:var(--f-mono); font-size:.48rem; letter-spacing:.22em; text-transform:uppercase;
  color:#6A6252; display:block; margin-bottom:.28rem }
.doc input,.doc textarea,.doc select{ width:100%; background:#FBF9F3; border:1px solid ${alpha('#14131A', 0.3)};
  color:#14131A; padding:.68rem .78rem; font-family:var(--f-mono); font-size:.78rem }
.doc input:focus,.doc textarea:focus,.doc select:focus{ outline:none; border-color:#B4181F }
.doc textarea{ min-height:5.5rem; resize:vertical }
.doc form button{ font-family:var(--f-mono); font-size:.58rem; letter-spacing:.28em; text-transform:uppercase;
  font-weight:700; background:#14131A; color:#F4F2EC; border:0; padding:.9rem 1.25rem; cursor:pointer }
.doc form button:hover{ background:#B4181F }
.doc .alt{ margin-top:.85rem; font-family:var(--f-mono); font-size:.52rem; letter-spacing:.14em; color:#6A6252 }
.doc .alt a{ color:#B4181F }
.doc .links{ display:flex; flex-wrap:wrap; gap:.35rem; margin-top:1.3rem }
.doc .links a{ font-family:var(--f-mono); font-size:.5rem; letter-spacing:.2em; text-transform:uppercase;
  text-decoration:none; border:1px solid ${alpha('#14131A', 0.3)}; padding:.5rem .75rem; color:#2A2733 }
.doc .links a:hover{ border-color:#B4181F; color:#B4181F }
.feed{ display:grid; gap:.9rem; grid-template-columns:repeat(auto-fit,minmax(290px,1fr)); margin-top:1.3rem }
.feed-i{ margin:0; background:#FBF9F3; border:1px solid ${alpha('#14131A', 0.2)} }
.feed-i iframe{ width:100%; height:500px; border:0; display:block; background:#fff }
.feed-i figcaption{ font-family:var(--f-mono); font-size:.5rem; letter-spacing:.14em; text-transform:uppercase;
  color:#6A6252; padding:.55rem .65rem; border-top:1px solid ${alpha('#14131A', 0.16)} }
.feed-i figcaption b{ color:#14131A; font-size:.68rem }
.feed-i figcaption a{ color:#B4181F; text-decoration:none }
.form-msg{ font-family:var(--f-mono); font-size:.56rem; letter-spacing:.12em; margin-top:.6rem; min-height:1.1em; color:#6A6252 }
.form-msg.ok{ color:#1B7A3E } .form-msg.err{ color:#B4181F }

/* =========================================================
   5b-ii · THE PASSPORT
   Built to the Portuguese book, because that is the one she was born under:
   EU burgundy, gold arms, trilingual field labels stacked PT / EN / FR, a
   guilloche data page and an MRZ across the bottom. The generic cream document
   it replaced said nothing about anyone.

   It is a design device, not a facsimile of an issued document: where a
   passport number would sit it carries this site's own reference code, and the
   header says TRAVEL DOCUMENT rather than claiming to be a passport.
   ========================================================= */
.pp{ width:min(100%,880px); max-height:88svh; overflow:auto; border-radius:4px;
  box-shadow:0 30px 80px ${alpha('#000000', 0.7)}; }
/* THE BOOK FOLLOWS THE LANGUAGE.
   Portuguese is the one she was born under, Canadian the one she was raised
   under, and the Spanish register carries the Dominican book. Each is its own
   real palette — EU burgundy, Canadian navy, Dominican blue — because "a
   passport" in the abstract is exactly the generic document this replaced. */
.pp-cover{ position:relative; padding:clamp(1.4rem,4vw,2.4rem);
  background:linear-gradient(158deg,#6E1220,#4A0A15 62%,#33060E); color:#D8B45E; }
.pp[data-book="en"] .pp-cover{ background:linear-gradient(158deg,#22375E,#16233D 62%,#0D1626); color:#C9A227 }
.pp[data-book="es"] .pp-cover{ background:linear-gradient(158deg,#123E7A,#0C2B55 62%,#071B37); color:#D4AF37 }
.pp-cover::before{ content:""; position:absolute; inset:12px; border:1px solid currentColor;
  opacity:.4; border-radius:2px; pointer-events:none }
/* only the book in play is shown */
.pp-book{ display:none } .pp[data-book="pt"] .pp-book--pt{ display:block }
.pp[data-book="en"] .pp-book--en{ display:block } .pp[data-book="es"] .pp-book--es{ display:block }
.pp-f em .lb{ display:none } .pp[data-book="pt"] .lb--pt{ display:inline }
.pp[data-book="en"] .lb--en{ display:inline } .pp[data-book="es"] .lb--es{ display:inline }
.pp-eu{ font-family:var(--f-mono); font-size:.56rem; letter-spacing:.36em; text-transform:uppercase;
  text-align:center; opacity:.86 }
.pp-arms{ display:block; width:clamp(52px,7vw,74px); margin:.9rem auto .7rem }
.pp-country{ font-family:var(--f-disp); font-weight:900; text-transform:uppercase; text-align:center;
  font-size:clamp(.9rem,2.4vw,1.35rem); letter-spacing:.12em; line-height:1.2 }
.pp-kind{ font-family:var(--f-mono); font-size:.6rem; letter-spacing:.42em; text-transform:uppercase;
  text-align:center; margin-top:.6rem; opacity:.9 }
.pp-chip{ display:block; width:22px; height:16px; margin:.9rem auto 0; border-radius:2px;
  border:1px solid ${alpha('#D8B45E', 0.55)}; position:relative }
.pp-chip::after{ content:""; position:absolute; inset:3px 5px; border-left:1px solid ${alpha('#D8B45E', 0.55)};
  border-right:1px solid ${alpha('#D8B45E', 0.55)} }

/* the data page */
.pp-page{ position:relative; background:#EFEDE2; color:#1A1721; padding:clamp(1.2rem,3.4vw,2rem); }
.pp[data-book="en"]{ --pp-guilloche:rgba(34,55,94,.13) }
.pp[data-book="es"]{ --pp-guilloche:rgba(18,62,122,.13) }
/* guilloche: the fine interference pattern that makes a page hard to copy */
.pp-page::before{ content:""; position:absolute; inset:0; pointer-events:none; opacity:.5;
  background:
    repeating-radial-gradient(circle at 20% 40%, transparent 0 6px, var(--pp-guilloche, rgba(110,18,32,.12)) 6px 6.6px),
    repeating-radial-gradient(circle at 78% 62%, transparent 0 7px, rgba(24,58,110,.1) 7px 7.6px),
    repeating-linear-gradient(58deg, transparent 0 5px, rgba(26,23,33,.05) 5px 5.5px); }
.pp-grid{ position:relative; z-index:1; display:grid; grid-template-columns:auto 1fr; gap:clamp(.9rem,2.4vw,1.5rem) }
@media (max-width:620px){ .pp-grid{ grid-template-columns:1fr } }
.pp-photo{ width:clamp(108px,15vw,152px); aspect-ratio:3/4; object-fit:cover; filter:grayscale(.25) contrast(1.05);
  border:1px solid ${alpha('#1A1721', 0.28)} }
.pp-photo-wrap{ position:relative }
.pp-ghost{ position:absolute; right:-14px; bottom:-6px; width:52%; opacity:.28; filter:grayscale(1) }
.pp-fields{ display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:.7rem 1.1rem; align-content:start }
.pp-f{ min-width:0 }
.pp-f em{ display:block; font-style:normal; font-family:var(--f-mono); font-size:.42rem; letter-spacing:.14em;
  text-transform:uppercase; color:#7A2634; line-height:1.55 }
.pp[data-book="en"] .pp-f em,.pp[data-book="en"] .pp-note{ color:#2B4372 }
.pp[data-book="es"] .pp-f em,.pp[data-book="es"] .pp-note{ color:#123E7A }
.pp[data-book="en"] .pp-story .doc-q{ border-left-color:#22375E }
.pp[data-book="es"] .pp-story .doc-q{ border-left-color:#123E7A }
.pp[data-book="en"] .pp-story .doc-q cite a{ color:#22375E }
.pp[data-book="es"] .pp-story .doc-q cite a{ color:#123E7A }
.pp-f b{ display:block; font-family:var(--f-mono); font-weight:700; font-size:clamp(.76rem,1.5vw,.9rem);
  letter-spacing:.04em; color:#14121A; margin-top:.16rem; overflow-wrap:anywhere }
.pp-sig{ grid-column:1/-1; margin-top:.4rem; border-top:1px solid ${alpha('#1A1721', 0.2)}; padding-top:.7rem;
  font-family:'Instrument Serif', Georgia, serif; font-style:italic; font-size:1.25rem; color:#2A2436 }
.pp-mrz{ position:relative; z-index:1; margin-top:clamp(1rem,2.6vw,1.6rem); padding-top:.8rem;
  border-top:1px dashed ${alpha('#1A1721', 0.35)};
  font-family:'Courier New', ui-monospace, monospace; font-weight:700;
  font-size:clamp(.6rem,1.5vw,.86rem); letter-spacing:.12em; color:#14121A; white-space:nowrap;
  overflow-x:auto; line-height:1.7 }
.pp-note{ position:relative; z-index:1; margin-top:1rem; font-family:var(--f-mono); font-size:.46rem;
  letter-spacing:.14em; text-transform:uppercase; color:#7A2634 }

/* the story pages, on passport stock */
.pp-story{ background:#E7E4D8; color:#1A1721; padding:clamp(1.2rem,3.4vw,2rem) }
.pp-story p{ color:#2A2733; max-width:58ch; font-size:clamp(.94rem,1.5vw,1.02rem); line-height:1.72 }
.pp-story p + p{ margin-top:.8rem }
.pp-story .doc-q{ border-left:3px solid #6E1220 }
.pp-story .doc-q cite a{ color:#6E1220 }

/* =========================================================
   5c · THE PLAYER
   A video opens IN the case, not in a new tab. Sending someone to YouTube is
   sending them away from her site to a page that will recommend somebody
   else's record next; the link out stays, as a choice, under the player.
   ========================================================= */
#player{ position:fixed; inset:0; z-index:130; display:flex; align-items:center; justify-content:center;
  flex-direction:column; gap:.9rem; padding:var(--gut);
  background:${alpha('#04050A', 0.94)}; backdrop-filter:blur(12px);
  opacity:0; visibility:hidden; pointer-events:none; transition:opacity .3s ease, visibility .3s; }
#player.open{ opacity:1; visibility:visible; pointer-events:auto; }
.pl-frame{ position:relative; width:min(100%,1100px); aspect-ratio:16/9; background:#000;
  box-shadow:0 30px 90px ${alpha('#000000', 0.7)}, 0 0 0 1px ${alpha(accent, 0.34)}; }
.pl-frame iframe{ position:absolute; inset:0; width:100%; height:100%; border:0; }
.pl-bar{ width:min(100%,1100px); display:flex; align-items:baseline; justify-content:space-between;
  gap:1rem; flex-wrap:wrap; }
.pl-t{ font-family:var(--f-disp); font-weight:900; text-transform:uppercase; letter-spacing:-.01em;
  font-size:clamp(1rem,2.4vw,1.5rem); color:var(--ink); }
.pl-t span{ display:block; font-family:var(--f-mono); font-size:.56rem; letter-spacing:.2em;
  color:var(--muted); font-weight:400; margin-top:.3rem; }
.pl-acts{ display:flex; gap:.5rem; flex-wrap:wrap; }
.pl-acts a,.pl-acts button{ font-family:var(--f-mono); font-size:.58rem; letter-spacing:.22em;
  text-transform:uppercase; text-decoration:none; cursor:pointer;
  border:1px solid var(--accent-line); background:none; color:var(--ink); padding:.6rem .9rem; }
.pl-acts a:hover,.pl-acts button:hover{ border-color:var(--accent); color:var(--accent); }

/* =========================================================
   5d · THE HANDBAG — the deep cuts
   A second bag, in her own monogram. RAW is her mark (her X bio is literally
   "RAW®"), so the canvas is that word repeated rather than someone else's
   initials. It holds what did not fit in the carry-on: the 2013 uploads, the
   features on other people's channels, the audio-only releases.
   ========================================================= */
.bag{ position:relative; display:block; border:0; cursor:pointer; padding:0;
  width:clamp(112px,15vw,168px); background:none; margin:clamp(1rem,3vh,2rem) auto 0; }
.bag-body{ position:relative; display:block; aspect-ratio:5/4; border-radius:5px 5px 9px 9px; overflow:hidden;
  background:
    /* the monogram, drawn not shipped */
    url("data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='108' height='72'>
        <g fill='${payoff}' fill-opacity='0.72' font-family='Anton, Impact, sans-serif' font-weight='900' font-size='19' letter-spacing='1'>
          <text x='4' y='22'>RAW</text><text x='58' y='22'>RAW</text>
          <text x='31' y='52'>RAW</text><text x='85' y='52'>RAW</text>
        </g>
        <g fill='${accent}' fill-opacity='0.5'>
          <circle cx='52' cy='14' r='2.4'/><circle cx='106' cy='14' r='2.4'/>
          <circle cx='25' cy='44' r='2.4'/><circle cx='79' cy='44' r='2.4'/>
        </g>
      </svg>`)}"),
    linear-gradient(168deg, #2B1D12, #150E08 78%);
  background-size:clamp(58px,7.5vw,84px) auto, cover;
  box-shadow:inset 0 1px 0 ${alpha('#ffffff', 0.16)}, 0 12px 26px ${alpha('#000000', 0.6)};
  transition:transform .3s cubic-bezier(.16,1,.3,1), box-shadow .3s; }
.bag:hover .bag-body,.bag:focus-visible .bag-body{ transform:translateY(-5px) rotate(-1.2deg);
  box-shadow:inset 0 1px 0 ${alpha('#ffffff', 0.2)}, 0 20px 36px ${alpha('#000000', 0.7)}; }
.bag:focus-visible{ outline:none }
/* the rolled top handles */
.bag-h{ position:absolute; top:-26%; left:50%; transform:translateX(-50%); width:52%; height:34%;
  border:5px solid #5A3B22; border-bottom:0; border-radius:50% 50% 0 0 / 100% 100% 0 0;
  box-shadow:0 2px 5px ${alpha('#000000', 0.5)}; }
/* the clasp */
.bag-c{ position:absolute; z-index:2; top:38%; left:50%; transform:translateX(-50%);
  width:26%; height:16%; border-radius:2px;
  background:linear-gradient(180deg, ${payoff}, ${alpha(payoff, 0.5)});
  box-shadow:0 2px 5px ${alpha('#000000', 0.55)}, inset 0 1px 0 ${alpha('#ffffff', 0.6)}; }
.bag-lab{ display:block; margin-top:.5rem; font-family:var(--f-mono); font-size:.5rem; letter-spacing:.26em;
  text-transform:uppercase; color:var(--accent); text-align:center; }
.bag-lab b{ display:block; color:var(--ink); font-family:var(--f-disp); font-weight:900;
  font-size:.72rem; letter-spacing:.02em; margin-bottom:.16rem; }

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
