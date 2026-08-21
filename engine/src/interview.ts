/**
 * COLD OPEN — the interview.
 *
 * The artist picks the world. Not the model.
 *
 * A model asked to invent a premise from a Spotify page will pick the median
 * premise, because the median is what "safe" looks like from inside a training
 * distribution. The interview exists to surface the one thing that is NOT in
 * any dataset: what the artist knows about their own work.
 *
 * Questions are ordered by ARCHITECTURAL LEVERAGE — how much the answer
 * changes the SHAPE of the site, not its colour. Ask one at a time.
 */

export type Leverage = 'architecture' | 'content' | 'surface';

export interface Question {
  readonly id: string;
  readonly ask: string;
  /** why this question exists — shown to the operator, never to the artist */
  readonly why: string;
  readonly leverage: Leverage;
  /** what changes downstream depending on the answer */
  readonly changes: string;
  readonly kind: 'open' | 'pick' | 'either';
  readonly options?: readonly string[];
  /** only ask when this predicate passes over prior answers */
  readonly when?: (a: Answers) => boolean;
}

export type Answers = Record<string, string>;

/**
 * Ordered hardest-hitting first. The first four decide whether the site is a
 * room you move through, a document you're cleared into, a broadcast you tune
 * into, or a single held image. Those are four different builds.
 */
export const QUESTIONS: readonly Question[] = [
  {
    id: 'room',
    ask: 'Where does your music live? Not where you recorded it — where it belongs when someone hears it right.',
    why: 'The single highest-leverage answer. A room becomes a navigable space; a car becomes a linear scroll; a stage becomes a broadcast; a memory becomes a single held frame.',
    leverage: 'architecture',
    changes: 'Decides the site TOPOLOGY: spatial gallery vs vertical dossier vs live feed vs single plate.',
    kind: 'open',
  },
  {
    id: 'four_seconds',
    ask: 'A stranger lands on your page and leaves after four seconds. What one thing do you need them to have felt?',
    why: 'Sets the cold open. Everything before the threshold is built to deliver this and nothing else.',
    leverage: 'architecture',
    changes: 'Decides the threshold ritual and the ground media.',
    kind: 'open',
  },
  {
    id: 'guard',
    ask: 'Should it be easy to get in, or should they have to earn it?',
    why: 'Threshold ritual intensity. "Earn it" supports a hold-to-enter or a boot sequence; "easy" needs the ritual to be one gesture or it becomes a toll booth.',
    leverage: 'architecture',
    changes: 'gesture: scroll | hold | drag | press | turn, and maxDwellMs.',
    kind: 'either',
    options: ['Walk straight in', 'Make them cross something'],
  },
  {
    id: 'wrong',
    ask: 'What do people get wrong about you?',
    why: 'The correction IS the premise more often than the self-description is. This question produces the sharpest worlds in practice.',
    leverage: 'architecture',
    changes: 'Often becomes the named premise itself.',
    kind: 'open',
  },
  {
    id: 'one_thing',
    ask: 'If someone could only ever hear one thing you made, which one, and why that one?',
    why: 'Decides what the site is BUILT AROUND. Every one of these sites has a single climax object.',
    leverage: 'architecture',
    changes: 'The climax section and the latest/lead slot.',
    kind: 'open',
  },
  {
    id: 'colour_of',
    ask: 'If that one track were a colour — not your favourite colour, the colour of that track — what is it?',
    why: 'Gets the accent from the WORK, not from taste. Asking "what is your favourite colour" reliably returns black or purple.',
    leverage: 'content',
    changes: 'The single saturated accent hue.',
    kind: 'open',
  },
  {
    id: 'sound_on',
    ask: 'When they land, should something already be playing?',
    why: 'Sound is a first-class control here. This decides whether the bed autostarts muted with a loud invitation, or waits.',
    leverage: 'content',
    changes: 'sound.startsMuted and the threshold copy.',
    kind: 'either',
    options: ['Yes — hit them with it', 'No — let them turn it on'],
  },
  {
    id: 'audience_words',
    ask: 'What do your people actually say about you in the comments? Give me their words, not yours.',
    why: 'The lexicon should be borrowed from the audience where possible. It is the difference between a site about the artist and a site from inside the artist.',
    leverage: 'content',
    changes: 'Section names and microcopy.',
    kind: 'open',
  },
  {
    id: 'booking',
    ask: 'Who do you want to hear from through this page, and who do you not?',
    why: 'The booking rail is the only thing on the page with a job. This decides whether it is a form, a rate card, or a gate.',
    leverage: 'content',
    changes: 'The contact rail shape and its copy.',
    kind: 'open',
  },
  {
    id: 'never',
    ask: 'What should this page never look like?',
    why: 'A negative constraint is worth three positive ones and it is the fastest way to kill the median premise.',
    leverage: 'surface',
    changes: 'Hard exclusions passed to the premise generator.',
    kind: 'open',
  },
];

export function nextQuestion(answers: Answers): Question | null {
  for (const q of QUESTIONS) {
    if (answers[q.id]?.trim()) continue;
    if (q.when && !q.when(answers)) continue;
    return q;
  }
  return null;
}

export function progress(answers: Answers): { answered: number; total: number; architectureDone: boolean } {
  const total = QUESTIONS.length;
  const answered = QUESTIONS.filter(q => answers[q.id]?.trim()).length;
  const arch = QUESTIONS.filter(q => q.leverage === 'architecture');
  return { answered, total, architectureDone: arch.every(q => answers[q.id]?.trim()) };
}
