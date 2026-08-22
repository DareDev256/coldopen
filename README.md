# COLD OPEN

**A named-premise engine for artist websites.**

A cold open is the scene before the titles. It drops you inside a world and
explains nothing. That is what this builds.

---

## Why this exists

Most site generators produce a competent dark editorial page: heavy grotesk
type, one accent colour, a hero image, a grid of cards below. It is tasteful
and it is the median of everything the model has ever seen, which is exactly
why it reads as generated.

The sites this engine is modelled on do not work that way. They are **named
worlds**, and the design falls out of the name:

| Site | The name | What follows from it |
|---|---|---|
| officialkmoney.com | **The Vault** | vault-door video, `SCROLL TO ENTER`, catalogue hung as art |
| 100bandplan.com | **Mission File** | self-drawing blueprint, `DWG 100BP-A01`, redaction bars |
| savv4x.com | **Problem Child** | red chromatic wordmark, ghost background type |
| syreneffect.com | **SyrenEffect TV** | `NOW STREAMING`, a live video panel, `ENTER` |

Nobody sat down and chose "a grid of cards". They chose *The Vault*, and the
grid became a wall of hung work because that is what a vault contains.

So the engine's job is not to design a layout. It is to **extract a world, let
the artist pick it, and derive everything else from that choice.**

### Why "COLD OPEN" and not "Artist Website Generator"

"Artist Website Generator" describes the output of a commodity. The name
should carry the idea instead. A cold open is a director's term for the thing
these sites actually do — establish a world in four seconds, before anything is
explained. It beat *Premise* (too abstract), *Threshold* (too solemn), and
*Worldbuilder* (already means something else in games).

---

## The seven moves

Every world the engine emits implements at least six of these. Fewer than six
and the build is **refused**, because that is the point where a world starts
reading as a template.

1. **A named premise**, not a layout
2. **A threshold ritual** — you cross something to get in
3. **Sound as a first-class control**, not a mute icon
4. **HUD / technical chrome** — corner brackets, document codes, stamps
5. **Full-bleed motion as ground**, not decoration
6. **ONE saturated hue**, tied to the artist
7. **Live numbers as flex** — real counts, sourced

---

## The two rules the engine enforces in code

### 1. It cannot print a number it cannot source

Every renderable value is a `Fact`, and there is no way to construct one
without a `sourceUrl` and a `verifiedAt` date. It is a thrown error, not a lint
warning.

```ts
ledger.add({
  id: 'market.streams', kind: 'count', value: 10_630_835,
  label: 'THE MARKET · SPOTIFY STREAMS',
  sourceUrl: 'https://open.spotify.com/artist/54gXMsMsoa0quu4bwTms8v',
  verifiedAt: '2026-08-21',
});
```

A claim you believe but cannot source is **sealed**. It renders as a redaction
bar with the reason attached, never as a value:

```ts
ledger.seal({
  id: 'billboard.peak', label: 'BILLBOARD CANADIAN HOT 100',
  reason: 'the #61 peak could not be found on any Billboard surface',
  unblockedBy: 'the Billboard archive for the charting week',
});
```

Every generated site ships a **SOURCES** section listing each figure, its
value, the URL it was read from, and the date. The site shows its work.

### 2. It cannot open on cream

Banned by *shape*, not by a list of hex codes — a name-list is evaded by
nudging one channel, so the guard tests hue, saturation and lightness:

```
#F7F1E7  refused — warm near-white (h=38° s=45% l=94%)
#F9F3E9  refused — not on any banned list, same shape
#A8A48C  refused — desaturated warm mid-tone (sage/taupe)
#FFFFFF  allowed
#05090C  allowed
#E23B2E  allowed
```

Cream wins by default whenever the palette is not decided before layout — it
flatters any photograph and clashes with nothing. That makes it a hedge, and
hedging is the failure this engine exists to prevent. There is a
`brandExemption` escape hatch, and taking it requires saying why out loud.

---

## The onboarding *is* the engine

A model asked to invent a premise from a Spotify page will pick the median
premise. So it doesn't get to.

```
Type a name  →  found across Apple / Deezer / MusicBrainz
             →  "Is this the right person?"   (never auto-selected)
             →  evidence, every row with its source
             →  interview, one question at a time
             →  THREE named premises, shown as worlds
             →  the artist picks
             →  everything after is derived
```

Questions are ordered by **architectural leverage** — how much the answer
changes the *shape* of the site, not its colour. The studio will not let you
skip to premise generation while an architecture question is unanswered.

### The divergence gate

Three premises that are all "dark and cinematic with one accent" are one
premise in three coats of paint, and offering them is worse than offering one,
because it launders a single median idea as a choice. So the set is gated:

- **topology must be unique** across all three (spatial / dossier / broadcast / plate / ledger) — this is the architecture
- accents at least **60° apart** on the hue wheel
- **not all near-black grounds**
- threshold gestures must differ
- **no generic section names** — a premise whose lexicon still says "Contact" has leaked
- every premise must cite the **interview answer id** that produced it

Failures are sent back to the model with the specific problems, up to three
times. If it still collapses, the studio says so rather than shipping a fake menu.

---

## New releases on sites it did not generate

Artists come back when a record drops. If the only answer is "regenerate", the
engine has flattened a world someone lived in. So the release path never
re-emits:

1. **Read the host world** — CSS custom properties, typefaces, document codes,
   and the site's own lexicon, straight out of the file
2. **Infer the item pattern** — whichever link-with-image-and-caption repeats
   most is that site's definition of "one item", whatever it is called
3. **Emit in that pattern** — the host's classes, captions and placement
   convention. COLD OPEN's own house style never appears
4. **Correct every number the release makes stale** — adding the new record and
   leaving the old counts is half a truth, which on a page of live numbers is
   the same as a lie
5. **Prove the markup survived**

```
$ node --experimental-strip-types worlds/100bandplan/release-die2young.ts

── HOST WORLD (read, not assumed) ──
ground/accent tokens : --bg:#05090c  --cyan:#3fd8ff  --plat:#dbe6ee
document codes       : DWG 100BP-A01
its own lexicon      : CLASSIFIED · TORONTO · GOD FIRST · ON SET · PARIS · NO LIMIT
item pattern         : <a class="item pop"> caption=.m-cap seq=data-pop→17 placement=css-vars

── PATCH ──
  ✓ market.streams: 9,391,470 → 10,630,835   (open.spotify.com, read 2026-08-21)
  ✓ market.gold.year: '25 → '26              (udiscovermusic.com, read 2026-08-21)
  ✓ inserted: Casper TNG, 100Bandplan — Die 2 Young (Draft Day), 2026-08-18

── MARKUP BALANCE ──
  balanced: true  unclosed: []  stray: []
```

### Three guards that came from real failures

**A green build is not proof.** Bundlers copy malformed HTML without
complaint. `assertBalancePreserved` compares the open/close count of every tag
before and after and refuses on drift.

**A comma in a machine slot is a live bug.** `data-target="326,075"` parses as
**326**. Facts carry a `format` of `flex` / `raw` / `none`, so prose gets
separators and machine slots never do.

**A file that drifted under you.** Each correction states how many occurrences
it expects. Finding a different number aborts rather than half-applying.

**Placement collision.** On a percentage-positioned stage, a hand-picked
coordinate put a new plate exactly behind the centrepiece — present in the DOM,
tag balance green, completely invisible. `findFreePlacement` now reads every
placed item, reserves the centre for flow-centred centrepieces, and grid-
searches for the point with the most clearance.

---

## Run it

Requires Node 20+.

```bash
git clone https://github.com/DareDev256/coldopen
cd coldopen
node --test --experimental-strip-types engine/test/*.test.ts   # 25 tests, no deps

cd studio && npm install && npm run dev                        # http://localhost:4300
```

Discovery, the fact ledger, the interview, all the guards and the emitter run
**with no API keys at all** — Apple, Deezer and MusicBrainz are public.

Only premise drafting calls a model:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

Without it the studio tells you so and everything else still works.

---

## Layout

```
engine/src/
  ledger.ts     Fact / SealedClaim. No fact without a source. The spine.
  world.ts      The World type + the cream ban + the audit that refuses builds
  interview.ts  Questions ordered by architectural leverage
  premise.ts    The divergence gate + the drafting prompt (kept beside its judge)
  derive.ts     Premise → World. Type, chrome and payoff follow topology.
  update.ts     World extraction, tag-balance proof, surgical patching
  release.ts    Host-pattern inference, recency, collision-free placement
  emit/         index.html · css/style.css · js/main.js · vercel.json · SOURCES
studio/         The UI. Next.js. Six steps, no terminal required.
worlds/         One directory per artist: their ledger and their build script.
```

---

## What it still cannot do

Written honestly, because a tool that oversells itself costs more than it saves.

- **It cannot interview the artist for you.** The interview is the highest-value
  part and it needs a human on the other side. Running it on published quotes
  works, but it is a substitute, not the thing.
- **It cannot read Instagram or TikTok.** Both block automated access. Those
  numbers must be read by a person and entered with a date — which is often the
  artist's *largest* surface, so the biggest number on the page is the one the
  engine can never fetch itself.
- **It cannot see its own output.** The audit checks contrast, palette,
  lexicon and move count. It cannot tell you the page is beautiful, and it
  could not have caught the plate hidden behind the centrepiece without a
  screenshot. Rendered verification is still a human step.
- **It cannot judge whether the premise is right.** The gate proves three
  premises are *different*. It cannot prove any of them is *good*.
- **Ground media is not generated.** Full-bleed video is one of the seven moves
  and the engine wires it up, but somebody still has to shoot it.
- **One page.** No multi-page routing, no store, no mailing list.
- **CSS 3D is the wrong tool for a small detail.** The spatial topology's mirror
  started as the lid's inner face on a 3D backface and could not be made to
  render: past 90 degrees it was 26px of dark strip, and the angle that finally
  gave it 94px pushed it off the top of the viewport. It now sits inside the
  base where you would look down into it. The lesson generalises — if a detail
  needs a swept parameter and a measurement loop to be visible at all, the
  geometry is fighting you.
- **The release path handles static HTML.** Sites where the markup is assembled
  by a framework at build time need their source patched, not their output.

---

MIT. Built by [DareDev256](https://jamesdare.com).
