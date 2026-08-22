/**
 * COLD OPEN — derivation.
 *
 * Premise in, World out. This is the step where "the design falls out of the
 * name" stops being a slogan and becomes code: given a named premise and a
 * topology, the typeface pair, the chrome vocabulary, the threshold copy and
 * the payoff colour are all determined. Nothing here is a taste call made at
 * build time — every branch traces back to something the artist chose.
 */

import type { PremiseDraft } from './premise.ts';
import type { World, TypePair, Chrome, Threshold, Lexicon, Palette, Ground, Move } from './world.ts';
import { hsl } from './world.ts';

/**
 * Type follows topology, because topology is what the page has to DO.
 * A dossier needs a face that can carry stencilled technical labels; a
 * broadcast needs one that survives being overlaid on moving video; a plate
 * is one held image and can afford a face with real personality.
 */
const TYPE_BY_TOPOLOGY: Record<PremiseDraft['topology'], TypePair> = {
  dossier: {
    display: { family: 'Archivo', weights: [700, 800, 900], google: 'Archivo:wght@700;800;900' },
    text: { family: 'Archivo', weights: [400, 500], google: 'Archivo:wght@400;500' },
    mono: { family: 'Space Mono', weights: [400, 700], google: 'Space+Mono:wght@400;700' },
  },
  spatial: {
    display: { family: 'Bebas Neue', weights: [400], google: 'Bebas+Neue' },
    text: { family: 'Inter', weights: [400, 600], google: 'Inter:wght@400;600' },
    mono: { family: 'JetBrains Mono', weights: [400, 700], google: 'JetBrains+Mono:wght@400;700' },
  },
  broadcast: {
    display: { family: 'Anton', weights: [400], google: 'Anton' },
    // Anton is a poster face. Body copy needs a companion that can hold a
    // paragraph, and Barlow Condensed keeps the broadcast register.
    text: { family: 'Barlow', weights: [400, 600], google: 'Barlow:wght@400;600' },
    mono: { family: 'Share Tech Mono', weights: [400], google: 'Share+Tech+Mono' },
  },
  plate: {
    display: { family: 'Instrument Serif', weights: [400], google: 'Instrument+Serif:ital@0;1' },
    text: { family: 'Instrument Sans', weights: [400, 600], google: 'Instrument+Sans:wght@400;600' },
    mono: { family: 'IBM Plex Mono', weights: [400, 600], google: 'IBM+Plex+Mono:wght@400;600' },
  },
  ledger: {
    display: { family: 'Archivo', weights: [700, 900], google: 'Archivo:wght@700;900' },
    text: { family: 'Archivo', weights: [400, 500], google: 'Archivo:wght@400;500' },
    mono: { family: 'IBM Plex Mono', weights: [400, 600], google: 'IBM+Plex+Mono:wght@400;600' },
  },
};

/** The reward copy is the world's own promise, in the world's own register. */
const REWARD_BY_TOPOLOGY: Record<PremiseDraft['topology'], string> = {
  dossier: 'CLEARANCE GRANTED',
  spatial: 'THE ROOM OPENS',
  broadcast: 'WE GO LIVE',
  plate: 'IT RESOLVES',
  ledger: 'THE RECORD OPENS',
};

const DWELL_BY_GESTURE: Record<Threshold['gesture'], number> = {
  scroll: 7000, press: 9000, hold: 12000, drag: 12000, turn: 10000,
};

/**
 * The payoff colour — used ONCE, at the climax. Derived from the ground:
 * a dark world pays off in a metal that catches light, a light world pays
 * off in ink. Choosing it from the ground rather than from the accent keeps
 * the accent doing exactly one job.
 */
function payoffFor(ground: string, accent: string): string {
  const g = hsl(ground);
  if (g.l > 0.5) return '#0A0A0A';
  const a = hsl(accent);
  return a.h >= 20 && a.h <= 60 ? '#E8EEF5' : '#E6D9A8';
}

function inkFor(ground: string): { ink: string; muted: string } {
  return hsl(ground).l > 0.5
    ? { ink: '#0C0D0F', muted: 'rgba(12,13,15,.62)' }
    : { ink: '#F2F5F8', muted: 'rgba(242,245,248,.58)' };
}

function slug(s: string): string { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

/**
 * The document code. Every one of these sites carries one — it is the single
 * cheapest signal that a page was built rather than generated, so the engine
 * has to produce a real one rather than leaving the slot empty.
 */
function docCode(artist: string, premise: string, year: number): string {
  const a = artist.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase();
  const p = premise.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase();
  const n = String([...premise].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 9973, 7)).padStart(4, '0');
  return `${a}-${p}${year % 100}-${n}`;
}

export interface DeriveInput {
  readonly premise: PremiseDraft;
  readonly artist: string;
  readonly domain: string;
  readonly ground: Ground;
  readonly sound?: { src: string; label: string; startsMuted: boolean };
  /** fallback words for any lexicon slot the premise left unset */
  readonly lexiconFallback?: Partial<Lexicon>;
}

export function derive(i: DeriveInput): World {
  const { premise: p, artist } = i;
  const year = new Date().getFullYear();
  const { ink, muted } = inkFor(p.ground);

  const palette: Palette = { ground: p.ground, accent: p.accent, payoff: payoffFor(p.ground, p.accent), ink, muted };

  const lx = p.lexicon ?? {};
  const fb = i.lexiconFallback ?? {};
  const lexicon: Lexicon = {
    enter: lx.enter ?? fb.enter ?? p.thresholdLabel,
    catalogue: lx.catalogue ?? fb.catalogue ?? 'THE BODY OF WORK',
    story: lx.story ?? fb.story ?? 'THE RECORD',
    proof: lx.proof ?? fb.proof ?? 'WHAT IS TRUE',
    contact: lx.contact ?? fb.contact ?? 'THE WAY IN',
    latest: lx.latest ?? fb.latest ?? 'MOST RECENT',
    unit: lx.unit ?? fb.unit ?? 'entry',
    index: lx.index ?? fb.index ?? 'SOURCES',
  };

  const threshold: Threshold = {
    gesture: p.thresholdGesture,
    label: p.thresholdLabel,
    reward: REWARD_BY_TOPOLOGY[p.topology],
    maxDwellMs: DWELL_BY_GESTURE[p.thresholdGesture],
  };

  const chrome: Chrome = {
    docCode: docCode(artist, p.name, year),
    stamps: [p.name.toUpperCase(), p.topology.toUpperCase()],
    readout: p.topology === 'broadcast' ? 'ON AIR' : p.topology === 'dossier' ? 'CLEARED' : 'OPEN',
  };

  const moves: Move[] = ['named_premise', 'threshold_ritual', 'hud_chrome', 'one_hue', 'live_numbers'];
  if (i.sound) moves.push('sound_control');
  if (i.ground?.src) moves.push('video_ground');

  return {
    id: slug(p.name),
    name: p.name,
    logline: p.logline,
    artist,
    domain: i.domain,
    palette,
    type: TYPE_BY_TOPOLOGY[p.topology],
    lexicon,
    threshold,
    chrome,
    ground: i.ground,
    sound: i.sound,
    moves,
  };
}
