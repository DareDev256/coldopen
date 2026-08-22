# The artist-world design language

Extracted from five sites by reading their source, then checked against two
blind A/B rounds. Nothing here is a preference. Every rule below is followed by
the site that proves it and the site that breaks it.

## The evidence

Five sites, shuffled, judged twice by fresh-context critics who saw only
screenshots — no repo, no reasoning, no idea which was generated.

| | Round 1 | Round 2 | Built |
|---|---|---|---|
| officialkmoney.com | 2nd | **1st** | by hand |
| 100bandplan.com | 3rd | 2nd | by hand |
| shortiieraw.com | **1st** | 3rd | generated |
| syreneffect.com | 4th | 4th | by hand |
| savv4x.com | **5th — picked as the generated one** | **5th — picked as the generated one** | by hand |

Both judges picked the same hand-built site as machine-made. That is the most
useful signal in the whole exercise, because it says the difference is not
hand-built vs generated — it is **decided vs undecided**.

## Two families, and only one of them wins

Reading the source, the five sites split cleanly:

**The static family** — kmoney, 100bandplan. Zero build step, plain HTML, CSS
custom properties, `Archivo` + `Space Mono`, near-black ground (`#05070a`,
`#05090c`), one named hue, HUD chrome, a document code, a threshold with a verb.
Ranked 1st and 2nd.

**The component family** — savv4x, syreneffect. Next + Tailwind, colours in a
config object, no HUD, no document code, no threshold. Ranked 4th and 5th.

The stack is not the cause; it is the tell. A `tailwind.config.ts` invites you
to fill in a palette object, and filling in a palette object is not the same act
as choosing a colour.

---

## Rule 1 — ONE hue means one

savv4x's config declares `primary #FF1744`, `primary-dim #8a0a1a`,
`accent #FF4444`, `blood #DC143C`, `crimson #B22222`, `ember #FF6B35`. Six reds,
plus two more greys called `muted` and `dim`.

100bandplan declares `--cyan: #3fd8ff`. One token. One name. One colour.

Six near-identical reds is what a palette looks like when nobody decided. The
eye cannot tell `#FF4444` from `#FF1744`, so the extra five buy nothing and cost
the one thing that would have read: commitment.

`assertOneHue()` enforces the pair. `assertHueDiscipline()` (below) enforces
the count.

## Rule 2 — the ground is decided before the layout

Cream wins by default whenever the palette is not decided first: it flatters any
photograph, clashes with nothing, and passes contrast without thought. It is a
hedge, and it is banned by SHAPE — hue, saturation and lightness — not by a list
of hex codes, because a list is evaded by nudging one channel.

kmoney and 100bandplan both open on near-black and put everything on one hue.
Shortiie Raw opens on cobalt, because the ground came from her own cover art
rather than from a default.

## Rule 3 — a technical face, and only two families

Every winning site pairs a heavy display face with a monospace: `Archivo` +
`Space Mono` on both. The mono is not decoration — it is what makes a document
code, a coordinate readout and a stream count read as *instrumentation* rather
than as copy.

syreneffect uses `font-playfair` — a wedding-invitation serif — on a Twitch
streamer's site. It ranked 4th twice.

Body copy needs a THIRD face when the display face is a poster face. Setting
paragraphs in Anton put text on the page that nobody could read.

## Rule 4 — a threshold with a verb

`SCROLL TO ENTER` (kmoney). `NOW STREAMING / ENTER` (syreneffect).
`CHOOSE YOUR TAG — IT OPENS THE CASE` (Shortiie Raw).

Not "Enter Site". The verb is the one the world implies, and what is on the
other side is named in the world's own words. savv4x has no threshold at all:
you land in the middle of a page.

The threshold must never be a wall. Every implementation here is escapable by
keyboard and self-opens on a timer.

## Rule 5 — the lexicon is the tell

The fastest way to spot a generated artist site is a section called "Contact".

savv4x's nav reads `LATEST · VIDEOS · MUSIC · STORY · CONNECT`. One judge said
it "could be lifted wholesale onto any of the other four artists without editing
a character."

The winners rename everything from the world: `LATEST DEPOSIT` (a vault),
`THE WAR ROOM` and `DWG 100BP-A01` (a mission file), `WHAT IT WEIGHS` and
`THE MANIFEST` (a carry-on). `auditWorld()` fails a build whose lexicon contains
a generic label, because at that point the premise stopped at the palette.

## Rule 6 — real counts, to the digit, with a source

`10,630,835`. Not "10M+". Not "over 10 million".

The exact number is the flex; rounding it throws the flex away. And a number
without a source is not a low-confidence number — it is not a number.

savv4x prints `250K MONTHLY LISTENERS · 200+ TRACKS · 10K PROJECTS`. Both judges
flagged it unprompted. Ten thousand projects is not a quantity a person has; it
is a slot that needed a value.

The counter-move, invented by hand on 100bandplan and now enforced by the
`Ledger`: an unverifiable claim renders as a **redaction bar** with its reason
attached. A judge who had never seen the code read that bar as
*"a human refusing to fake a number."*

## Rule 7 — the moves are a palette, not a checklist

The seven moves are: named premise · threshold ritual · sound as a first-class
control · HUD chrome · full-bleed motion as ground · one saturated hue · live
numbers as flex.

Measured against the source, only two of the five sites carry HUD chrome and
only two state a threshold. The winners average five to six moves; savv4x
carries three.

So the bar is not "all seven". It is: **a named premise and a threshold are
mandatory, and at least four of the remaining five must be present.** A world
that cannot name itself is a layout, and a world you do not cross into is a
page. Everything else is a choice.

## Rule 8 — look at the work, do not read about it

Two cases, both the same shape.

**Street Bud.** A throwaway guess, buried mid-sentence and maximally hedged:
*"his chain's a street light no or ? or idk just a thought."* Checking the music
videos frame by frame found the pendant motion-blurred in every frame it
appeared, so the answer came back "cannot confirm." Wrong. A later sweep of his
Instagram surfaced it at once — a repost card reading *"THE DAY QUAVO PULLED UP
ON STREET BUD WITH A NEW ICED OUT STREET LIGHT"* — and he signs his own posts
with the traffic-light emoji. It became the endcap of the site.

Two lessons, and the second is the bigger one: *"I cannot confirm it from THIS
source"* is not *"it is false"*, and **the picture held a premise that no
amount of reading would have produced.**

**Shortiie Raw.** Reading her bios produces "Toronto rapper". Looking at her
covers produces two irreconcilable visual eras — anime illustration 2018–2021,
Angola photography 2023–2025 — which is the actual premise. Her Spotify bio, for
the record, says she fled war in *"Angola, South Africa"*, which is geographic
nonsense; it is machine-written filler, and a premise built on it would inherit
the nonsense.

**Text tells you what they say. Images tell you what they are.** A premise
generated from bios will be the median premise, because bios are written to be
unobjectionable.

## Rule 9 — sample the palette out of the work, never pick it

James on the Ninjora wiki: *"what about it feels AI-sloppy, maybe it's cause
it's lacking a colour theme."* The diagnosis was right; the fix was not a nicer
colour, it was to take the colour from the subject.

`sampleHues()` buckets an artist's own artwork by hue at usable saturation,
discarding neutrals so that a mostly-black cover does not return black as their
colour. Run across Shortiie Raw's five covers and stills it returns
**`#E5CA0A` at 80% of usable pixels on the *Sip Cuca* cover** — the Cuca-bottle
yellow.

That is the same accent the site had already been given by hand, arrived at by
reasoning about the Angolan flag and her cover art. The sampler found it from
her pixels, with no taste involved. That agreement is the argument: a palette
chosen by taste is chosen from the median, and a palette pulled out of the
artist's own work can only look like them.

`proposePalette()` will not hand back a pair the build would later refuse — it
checks the cream ban and the 3:1 contrast floor before offering anything.

---

## What the engine enforces, and where

| Rule | Where | Fails the build? |
|---|---|---|
| No cream ground, by shape | `assertGroundAllowed` | yes |
| One loud hue in the ground/accent pair | `assertOneHue` | yes |
| Hue discipline — no palette of near-identical accents | `assertHueDiscipline` | yes |
| Accent legible on ground (3:1) | `auditWorld` + premise gate | yes |
| Ink legible on ground (4.5:1), chosen by measurement | `inkFor` | yes |
| Premise named, threshold present | `auditWorld` | yes |
| ≥4 of the remaining five moves | `auditWorld` | yes |
| No generic lexicon label | `auditWorld` | yes |
| Every figure carries a source URL and a date | `Ledger` | yes — cannot be constructed otherwise |
| Sealed claims render as redactions | `emit/*` | n/a |
| Three premises genuinely divergent | `assertDivergent` | yes — regenerates up to 3× |

## What it cannot enforce

Whether the premise is any good. The gate proves three premises are *different*;
nothing proves one is *right*. That is what the interview is for, and the
interview needs a human on the other side.
