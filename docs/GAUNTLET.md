# The blind A/B

## The bar

> A generated site must be indistinguishable from a hand-built James site.
> Put it side by side with officialkmoney.com, savv4x.com, syreneffect.com and
> 100bandplan.com and have a judge with FRESH CONTEXT — one that never saw the
> builder's reasoning — pick which one was generated. If it can pick, you have
> not finished.

## Method

All five sites captured under identical conditions: Chromium, 1440×900, DPR 1,
`domcontentloaded` + 5.5s, one Enter keypress to cross any threshold, 260px
scroll, 3s settle. Order shuffled. The judge was given the five images and
nothing else — no repo access, no web access, no build reasoning — and was
explicitly told not to reason from resolution, file size or framing.

| Shown as | Actually |
|---|---|
| site-1 | 100bandplan.com — hand-built |
| **site-2** | **shortiieraw.com — GENERATED** |
| site-3 | officialkmoney.com — hand-built |
| site-4 | syreneffect.com — hand-built |
| site-5 | savv4x.com — hand-built |

## Result — 2026-08-21

**The judge picked site-5 (savv4x.com, hand-built) at 70% confidence.**

It ranked the generated site **first — most hand-made of all five**:

> Committing an entire page to flat saturated red with yellow annotation is a
> decision no hedging system makes, and the copy ("Born in Lisbon… she raps in
> three languages now," the Angola/Canada audience split) could not describe
> another artist; the unverified-stat placeholder is a human refusing to fake a
> number.

That last clause is the one worth keeping. The redaction bar is a *generated*
artefact — the ledger refusing to print an Instagram count it could not read
from a primary source — and it read to a fresh judge as evidence of human
restraint. Admitting a gap is a stronger credibility signal than filling it.

Its stated heuristic for the whole set: *"four of these have a point of view and
one has competence."* That is the failure mode this engine was built against,
and the generated page landed on the right side of it.

## Honesty about this result

- The judge stated 70/30 and volunteered that it was partly guessing. A single
  pass at 70% is evidence, not proof.
- One judge, one round, one viewport. No mobile, no repeat trials, no panel.
- The generated site had an advantage the others did not: its subject has a
  genuinely unusual story (Lisbon → Toronto → Luanda, three languages), and the
  interview surfaced it. On a more ordinary artist the copy would carry less.
- The reference set is four sites by one designer. Passing here means "reads as
  his hand", not "reads as human" in general.

## What the judge found on a hand-built site

Unprompted, it identified a real defect on **savv4x.com** — verified live:

> `250K MONTHLY LISTENERS · 200+ TRACKS · 10K PROJECTS`
>
> "Three evenly spaced numbers under the hero, in identical type at identical
> size — the classic three-slot metrics row. And the content is incoherent under
> one second of scrutiny: '10K PROJECTS' is not a real number for a rapper, it's
> a slot that needed a value."

It is right. 10,000 projects is not a quantity a person has. The 250K is
unsourced and undated. Its recommendation — one sourced, dated number at hero
scale, hard left, the other two deleted — is exactly what the fact ledger
enforces by construction, which is the clearest argument for the ledger in this
document.

## Next round

The bar is met for now. The honest next test is harder: three judges, mobile
viewport, and a second generated site for an artist with a *dull* story, since
that is where a premise engine should fail first.
