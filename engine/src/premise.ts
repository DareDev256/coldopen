/**
 * COLD OPEN — premise generation and the divergence gate.
 *
 * Three premises that are all "dark cinematic with one accent" are ONE premise
 * wearing three hats, and offering them is worse than offering one, because it
 * launders a single median idea as a choice. The divergence gate is what makes
 * the menu real.
 */

export interface PremiseDraft {
  readonly name: string;
  readonly logline: string;
  /** the topology this premise implies */
  readonly topology: 'spatial' | 'dossier' | 'broadcast' | 'plate' | 'ledger';
  readonly ground: string;
  readonly accent: string;
  readonly thresholdGesture: 'scroll' | 'hold' | 'drag' | 'press' | 'turn';
  readonly thresholdLabel: string;
  /** what is on the other side, in this world's words. Falls back to topology. */
  readonly thresholdReward?: string;
  /** the renamed sections — proves the world reached the copy */
  readonly lexicon: Record<string, string>;
  /** one line on why THIS artist, from THEIR answers. Cites the answer id. */
  readonly rationale: string;
  /** which interview answers drove it */
  readonly fromAnswers: readonly string[];
}

import { hsl, assertGroundAllowed, assertOneHue, contrastRatio, liftAccentForGround } from './world.ts';

function hueDistance(a: string, b: string): number {
  const d = Math.abs(hsl(a).h - hsl(b).h);
  return Math.min(d, 360 - d);
}

export interface DivergenceReport {
  readonly ok: boolean;
  readonly problems: string[];
  readonly topologies: string[];
  readonly minHueGap: number;
}

/**
 * The gate. Three drafts must differ on the axes that matter:
 *  - TOPOLOGY must be unique across all three (this is the architecture)
 *  - accents must be at least 60° apart on the hue wheel
 *  - grounds must not all be near-black
 *  - threshold gestures must not all be the same
 */
export function assertDivergent(drafts: readonly PremiseDraft[]): DivergenceReport {
  const problems: string[] = [];
  if (drafts.length < 3) problems.push(`only ${drafts.length} premises — the artist needs at least 3 to react to`);

  const topologies = drafts.map(d => d.topology);
  if (new Set(topologies).size < drafts.length) {
    problems.push(`topologies repeat (${topologies.join(', ')}) — these are the same site with different paint. Topology is the architecture; make each one a different SHAPE of site.`);
  }

  let minHueGap = 360;
  for (let i = 0; i < drafts.length; i++) {
    for (let j = i + 1; j < drafts.length; j++) {
      const gap = hueDistance(drafts[i].accent, drafts[j].accent);
      minHueGap = Math.min(minHueGap, gap);
      if (gap < 60) problems.push(`"${drafts[i].name}" and "${drafts[j].name}" accents are ${gap.toFixed(0)}° apart — under 60°, that reads as the same colour`);
    }
  }

  const darkGrounds = drafts.filter(d => hsl(d.ground).l < 0.15).length;
  if (darkGrounds === drafts.length) {
    problems.push('every ground is near-black — "dark and cinematic" is the median premise. At least one option must commit to white, a saturated ground, or true black with a different strategy.');
  }

  if (new Set(drafts.map(d => d.thresholdGesture)).size === 1) {
    problems.push(`all three thresholds use the same gesture (${drafts[0]?.thresholdGesture}) — the way in should differ per world`);
  }

  const names = drafts.map(d => d.name.toLowerCase());
  if (new Set(names).size < names.length) problems.push('duplicate premise names');

  for (const d of drafts) {
    try { assertGroundAllowed(d.ground); } catch (e) { problems.push(`"${d.name}": ${(e as Error).message}`); }
    try { assertOneHue(d.ground, d.accent); } catch (e) { problems.push(`"${d.name}": ${(e as Error).message}`); }
    // A premise the artist can pick but the engine cannot build is a broken
    // promise. Check legibility HERE, at choosing time, not at build time.
    const ratio = contrastRatio(d.accent, d.ground);
    if (ratio < 3) {
      const lifted = liftAccentForGround(d.accent, d.ground);
      problems.push(lifted
        ? `"${d.name}" accent ${d.accent} on ${d.ground} is ${ratio.toFixed(2)}:1 — below 3:1. Same hue at ${lifted} clears it; use that.`
        : `"${d.name}" accent ${d.accent} cannot reach 3:1 on ${d.ground} at any lightness — that hue does not work on that ground.`);
    }
    if (!d.rationale?.trim() || !d.fromAnswers?.length) {
      problems.push(`"${d.name}" has no rationale tied to an interview answer — that means it came from the model, not the artist`);
    }
    const generic = ['contact', 'about', 'gallery', 'music', 'videos', 'home', 'work', 'bio'];
    for (const [slot, word] of Object.entries(d.lexicon ?? {})) {
      if (generic.includes(String(word).toLowerCase().trim())) {
        problems.push(`"${d.name}" lexicon.${slot} is "${word}" — the premise did not reach the copy`);
      }
    }
  }

  return { ok: problems.length === 0, problems, topologies, minHueGap };
}

/**
 * The system prompt the studio sends to Claude to draft premises. Kept here,
 * beside the gate that judges its output, so the two cannot drift apart.
 */
export function premisePrompt(input: {
  artist: string;
  answers: Record<string, string>;
  evidence: string;
}): string {
  return `You are drafting NAMED PREMISES for a musician's website.

A named premise is a world, not a layout. "The Vault." "Mission File." "Problem Child."
The design falls out of the name. If you find yourself describing a layout
("a bold hero with a grid below"), you have failed — name the WORLD and the
layout becomes obvious.

ARTIST: ${input.artist}

WHAT THE ARTIST SAID (this outranks everything else — it is the only input that
is not in your training data):
${Object.entries(input.answers).map(([k, v]) => `  [${k}] ${v}`).join('\n')}

VERIFIED EVIDENCE (every item carries the URL it was read from; you may not
state anything not in here):
${input.evidence}

Draft EXACTLY THREE premises. They will be checked by a gate that rejects the
set if they are the same idea in three coats of paint. Specifically:

- Each must have a DIFFERENT topology: spatial (a room you move through),
  dossier (a document you are cleared into), broadcast (a channel you tune),
  plate (one held image that resolves), ledger (a running record).
- Accents must be at least 60 degrees apart on the hue wheel.
- They must not all be near-black grounds. "Dark and cinematic" is the median
  answer and at least one option must refuse it.
- Threshold gestures must differ.
- Every section name in the lexicon must be renamed FROM THE WORLD. A premise
  that still says "Contact" or "Gallery" has leaked.
- Each needs a rationale citing which interview answer produced it, by id.

NEVER a cream, beige or warm off-white ground. Not a preference — a build error.

Return JSON: an array of three objects matching PremiseDraft.`;
}
