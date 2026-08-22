/**
 * SHORTIIE RAW — "CARRY-ON"  (spatial)
 *
 * The second world for the same artist, on the same ledger. A travel vanity
 * case: hard shell stamped with the three cities she has actually lived
 * between, a mirror inside the lid, and her catalogue seated in cut foam.
 *
 * Why this and not another makeup box: a makeup box on a female rapper's site
 * is a format, and formats read generic. What makes it hers is what the case
 * is FOR — she was born in Lisbon, raised in Toronto, and her last three
 * records are about Luanda. The object is the thing you carry between them.
 *
 * "Carry-on" is the bag and it is also what she did.
 *
 * Same ledger as the Rádio Kinaxixi build. Not one fact is re-entered, which
 * is the point: a world is a lens over the evidence, never a second copy of it.
 */
import fs from 'node:fs';
import path from 'node:path';
import { Ledger } from '../../engine/src/ledger.ts';
import { derive } from '../../engine/src/derive.ts';
import { build, type CaseShell } from '../../engine/src/emit/index.ts';
import type { SiteContent, Unit } from '../../engine/src/emit/html.ts';
import type { PremiseDraft } from '../../engine/src/premise.ts';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const SHARED = path.join(HERE, '..', 'shortiie-raw');
const OUT = path.join(HERE, 'site');
const ledger = Ledger.fromJSON(JSON.parse(fs.readFileSync(path.join(SHARED, 'ledger.json'), 'utf8')));

const premise: PremiseDraft = {
  name: 'Carry-On',
  logline: 'Everything she moved between three countries, packed in one case. Lift the lid.',
  topology: 'spatial',
  // The ground is the loud hue here; the case is black lacquer on top of it.
  // Cobalt is not decoration: it is the blue of the Luanda towers on the Way We
  // Move cover and the passport-blue of the Sip Cuca collage.
  ground: '#1B2FE8',
  // The other half of the Angolan flag, and the diagonal band on Sip Cuca.
  accent: '#FFDD33',
  thresholdGesture: 'hold',
  thresholdLabel: 'LIFT THE LID',
  thresholdReward: 'EVERYTHING SHE CARRIES',
  lexicon: {
    enter: 'LIFT THE LID',
    catalogue: "WHAT'S PACKED",
    story: 'DECLARED',
    proof: 'WHAT IT WEIGHS',
    contact: "WHO'S ASKING",
    latest: 'PACKED LAST',
    unit: 'ITEM',
    index: 'THE MANIFEST',
  },
  rationale: 'From [room] and [wrong]: three countries, and a previous site that erased two of them.',
  fromAnswers: ['room', 'wrong', 'four_seconds'],
};

const world = {
  ...derive({
    premise,
    artist: 'SHORTIIE RAW',
    domain: 'shortiieraw.com',
    ground: { kind: 'image' as const, src: 'assets/yt-Xedv19NEX-E.jpg', treatment: ['grain'] as const },
    sound: { src: 'assets/bed.mp3', label: 'PLAY', startsMuted: true },
  }),
  // English leads. Portuguese and Spanish are one click away because she is
  // billed as a trilingual artist — allowed only against the sourced fact
  // 'artist.languages', never as decoration.
  registers: [
    { code: 'en', label: 'EN', evidenceId: 'artist.languages', lexicon: {}, logline: premise.logline, story: [] },
    {
      code: 'pt', label: 'PT', evidenceId: 'artist.languages',
      logline: 'Tudo o que ela levou entre três países, numa só mala. Levanta a tampa.',
      mirrorCaption: 'Lisboa · Toronto · Luanda',
      lexicon: {
        enter: 'LEVANTA A TAMPA', catalogue: 'O QUE VAI DENTRO', story: 'DECLARADO',
        proof: 'QUANTO PESA', contact: 'QUEM PERGUNTA', latest: 'ÚLTIMO A ENTRAR',
        unit: 'PEÇA', index: 'O MANIFESTO',
      },
      story: [
        'Nasceu em Lisboa. Chegou a Toronto aos seis anos sem falar inglês — "és negra, como é que não falas inglês?" é como ela se lembra da pergunta. Hoje faz rap em três línguas.',
        'Os comentários dos vídeos dela estão em português e trazem a bandeira de Angola. O mapa de streaming diz 43% Canadá, 26% Estados Unidos, e Angola em lado nenhum. São dois públicos diferentes a ler a mesma artista.',
        'Está tudo aqui dentro. Levanta a tampa.',
      ],
    },
    {
      code: 'es', label: 'ES', evidenceId: 'artist.languages',
      logline: 'Todo lo que se llevó entre tres países, en una sola maleta. Levanta la tapa.',
      mirrorCaption: 'Lisboa · Toronto · Luanda',
      lexicon: {
        enter: 'LEVANTA LA TAPA', catalogue: 'LO QUE LLEVA', story: 'DECLARADO',
        proof: 'CUÁNTO PESA', contact: 'QUIÉN PREGUNTA', latest: 'LO ÚLTIMO EN ENTRAR',
        unit: 'PIEZA', index: 'EL MANIFIESTO',
      },
      story: [
        'Nació en Lisboa. Llegó a Toronto a los seis años sin hablar inglés — "eres negra, ¿cómo es que no hablas inglés?" es como recuerda la pregunta. Hoy hace rap en tres idiomas.',
        'Los comentarios de sus vídeos están en portugués y llevan la bandera de Angola. El mapa de streaming dice 43% Canadá, 26% Estados Unidos, y Angola en ninguna parte. Son dos públicos distintos leyendo a la misma artista.',
        'Está todo aquí dentro. Levanta la tapa.',
      ],
    },
  ],
};

/* Ordered by what the case is actually holding, heaviest first. */
const units: Unit[] = [
  { title: 'Drip', sub: 'ft. Molly Brazy · 202,424', href: 'https://www.youtube.com/watch?v=EmrpNsyVtDQ', image: 'assets/yt-EmrpNsyVtDQ.jpg' },
  { title: 'Strawberry Go-Kart', sub: '2018 · 31,890', href: 'https://www.youtube.com/watch?v=iiYmh9-D_14', image: 'assets/yt-iiYmh9-D_14.jpg' },
  { title: "Don't Act New", sub: '2021 · 14,609', href: 'https://www.youtube.com/watch?v=HueUBufXMbs', image: 'assets/yt-HueUBufXMbs.jpg' },
  { title: 'Way We Move', sub: 'ft. Ingomblock · 11,985', href: 'https://www.youtube.com/watch?v=Xedv19NEX-E', image: 'assets/yt-Xedv19NEX-E.jpg' },

  { title: 'Angola Kinaxixi Freestyle', sub: 'reprod. AK Marv · 8,676', href: 'https://www.youtube.com/watch?v=X8zj9clGQO4', image: 'assets/yt-X8zj9clGQO4.jpg' },
  { title: 'Sip Cuca', sub: '2025 · 7,463', href: 'https://www.youtube.com/watch?v=NbJnT5j365M', image: 'assets/yt-NbJnT5j365M.jpg' },
  { title: 'Fire', sub: 'In studio · 8,024', href: 'https://www.youtube.com/watch?v=82_xVuYR45c', image: 'assets/yt-82_xVuYR45c.jpg' },

  { title: 'Peace', sub: '2023 · 11,212', href: 'https://www.youtube.com/watch?v=z2BL7wgPsaI', image: 'assets/yt-z2BL7wgPsaI.jpg' },
  { title: 'Cartier Tints', sub: '2024 · 6,367', href: 'https://www.youtube.com/watch?v=9hRUzEGfW7o', image: 'assets/yt-9hRUzEGfW7o.jpg' },
  { title: 'Sexy No Jutsu', sub: 'prod. Cash Money AP · 5,736', href: 'https://www.youtube.com/watch?v=WLnquJAMnt0', image: 'assets/yt-WLnquJAMnt0.jpg' },
];

const shell: CaseShell = {
  material: 'lacquer',
  // Three cities, each one a fact in the ledger. No stamp for a place she has
  // not actually been — that is the whole discipline, applied to a sticker.
  stamps: [
    { text: 'LISBOA', sub: 'PT · 1994', rotate: -7, factId: 'artist.origin' },
    { text: 'TORONTO', sub: 'CA · ARRIVED AT SIX', rotate: 4, factId: 'artist.base' },
    { text: 'LUANDA', sub: 'AO · KINAXIXI', rotate: -3, factId: 'press.brizzo' },
  ],
  mirror: 'assets/yt-NbJnT5j365M.jpg',
  trays: [
    { label: 'TOP TRAY · HEAVIEST', from: 0, to: 4 },
    { label: 'SECOND TRAY · WHAT SHE BROUGHT BACK', from: 4, to: 7 },
    { label: 'BOTTOM · KEPT', from: 7, to: 10 },
  ],
  engraving: 'RAW®',
};

const content: SiteContent = {
  title: 'SHORTIIE RAW — Carry-On',
  description: 'Lisbon · Toronto · Luanda',
  canonical: 'https://shortiieraw.com/',
  ogImage: 'https://shortiieraw.com/assets/yt-NbJnT5j365M.jpg',
  figures: ['drip.spotify', 'drip.youtube', 'catalogue.streams', 'reach.followers', 'x.followers', 'yt.subs', 'instagram.followers'],
  units,
  story: [
    'Born in Lisbon. Landed in Toronto at six speaking no English — "You\'re black, how do you not speak English?" is how she remembers being asked. She raps in three languages now.',
    'The comments under her videos are in Portuguese and flagged Angola. The streaming map says 43% Canada, 26% United States, and no Angola at all. Those are two different audiences reading the same artist.',
    'It is all in here. Lift the lid.',
  ],
  rail: {
    endpoint: 'https://formsubmit.co/ajax/bookingshortiieraw@gmail.com',
    fields: [
      { name: 'name', label: "WHO'S ASKING", type: 'text', required: true },
      { name: 'email', label: 'REACH YOU AT', type: 'email', required: true },
      { name: 'reason', label: 'WHAT FOR', type: 'select', required: true, options: ['A feature', 'A show', 'Press / interview', 'Something else'] },
      { name: 'message', label: 'THE ASK', type: 'textarea', required: true },
    ],
    submitLabel: 'SEND IT',
    fallbackEmail: 'bookingshortiieraw@gmail.com',
  },
  links: ledger.all().filter(f => f.kind === 'link' && f.id.startsWith('link.')).map(f => ({ label: f.label, href: String(f.value) })),
  jsonLd: {
    '@context': 'https://schema.org', '@type': 'MusicGroup', '@id': 'https://shortiieraw.com/#artist',
    name: 'Shortiie Raw', url: 'https://shortiieraw.com/', genre: ['Hip-Hop', 'Rap', 'Trap'],
    birthPlace: { '@type': 'Place', name: 'Lisbon, Portugal' },
    foundingLocation: { '@type': 'Place', name: 'Toronto, Ontario, Canada' },
    knowsLanguage: ['en', 'pt', 'es'],
    description: 'Toronto rapper, born in Lisbon of Angolan family. Raps in English, Portuguese and Spanish.',
    sameAs: ledger.all().filter(f => f.id.startsWith('link.')).map(f => String(f.value)),
  },
};

const out = build(world as any, content, ledger, { shell });
console.log('── AUDIT ──');
console.log(`  moves ${out.audit.moveCount}/7   ink ${out.audit.contrast.inkOnGround.toFixed(2)}:1   accent ${out.audit.contrast.accentOnGround.toFixed(2)}:1`);
console.log(out.audit.ok ? '  ✓ clean' : out.audit.problems.map(p => '  ✕ ' + p).join('\n'));

fs.mkdirSync(OUT, { recursive: true });
for (const [rel, body] of Object.entries(out.files)) {
  const p = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, body);
}
fs.cpSync(path.join(SHARED, 'assets'), path.join(OUT, 'assets'), { recursive: true });
console.log(`\n  ${Object.keys(out.files).length} files → ${OUT}`);
