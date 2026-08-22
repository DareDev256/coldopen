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
import { build, type CaseShell, type Docs, type FeedPost } from '../../engine/src/emit/index.ts';
import type { SiteContent, Unit } from '../../engine/src/emit/html.ts';
import type { PremiseDraft } from '../../engine/src/premise.ts';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const SHARED = path.join(HERE, '..', 'shortiie-raw');
const OUT = path.join(HERE, 'site');
const ledger = Ledger.fromJSON(JSON.parse(fs.readFileSync(path.join(SHARED, 'ledger.json'), 'utf8')));

const premise: PremiseDraft = {
  name: 'Carry-On',
  logline: 'Everything she moved between three countries, packed in one case.',
  topology: 'spatial',
  // The ground is the loud hue here; the case is black lacquer on top of it.
  // Cobalt is not decoration: it is the blue of the Luanda towers on the Way We
  // Move cover and the passport-blue of the Sip Cuca collage.
  ground: '#1B2FE8',
  // The other half of the Angolan flag, and the diagonal band on Sip Cuca.
  accent: '#FFDD33',
  thresholdGesture: 'hold',
  thresholdLabel: 'CHOOSE YOUR TAG',
  thresholdReward: 'EVERYTHING SHE CARRIES',
  lexicon: {
    enter: 'CHOOSE YOUR TAG',
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
    // Sip Cuca, her 2025 single — the same record this world already uses for
    // the cover and the mirror. preload="none", so it costs a visitor nothing
    // until they press it. Shipped 404 until 2026-08-22.
    sound: { src: 'assets/bed.mp3', label: 'PLAY SIP CUCA', startsMuted: true },
  }),
  // English leads. Portuguese and Spanish are one click away because she is
  // billed as a trilingual artist — allowed only against the sourced fact
  // 'artist.languages', never as decoration.
  registers: [
    { code: 'en', label: 'EN', evidenceId: 'artist.languages', lexicon: {}, logline: premise.logline, story: [],
      prompt: '<b>CHOOSE YOUR TAG</b> — IT OPENS THE CASE' },
    {
      code: 'pt', label: 'PT', evidenceId: 'artist.languages',
      logline: 'Tudo o que ela levou entre três países, numa só mala. Levanta a tampa.',
      mirrorCaption: 'Lisboa · Toronto · Luanda',
      prompt: '<b>ESCOLHE A TUA ETIQUETA</b> — ABRE A MALA',
      lexicon: {
        enter: 'ABRE A MALA', catalogue: 'O QUE VAI DENTRO', story: 'DECLARADO',
        proof: 'QUANTO PESA', contact: 'QUEM PERGUNTA', latest: 'ÚLTIMO A ENTRAR',
        unit: 'PEÇA', index: 'O MANIFESTO',
      },
      story: [
        'Nasceu em Lisboa. Chegou a Toronto aos seis anos sem falar inglês — "és negra, como é que não falas inglês?" é como ela se lembra da pergunta. Hoje faz rap em três línguas.',
        'Os comentários dos vídeos dela estão em português e trazem a bandeira de Angola. O mapa de streaming diz 43% Canadá, 26% Estados Unidos, e Angola em lado nenhum. São dois públicos diferentes a ler a mesma artista.',
        'Está tudo aqui dentro.',
      ],
    },
    {
      code: 'es', label: 'ES', evidenceId: 'artist.languages',
      logline: 'Todo lo que se llevó entre tres países, en una sola maleta. Levanta la tapa.',
      mirrorCaption: 'Lisboa · Toronto · Luanda',
      prompt: '<b>ELIGE TU ETIQUETA</b> — ABRE LA MALETA',
      lexicon: {
        enter: 'ABRE LA MALETA', catalogue: 'LO QUE LLEVA', story: 'DECLARADO',
        proof: 'CUÁNTO PESA', contact: 'QUIÉN PREGUNTA', latest: 'LO ÚLTIMO EN ENTRAR',
        unit: 'PIEZA', index: 'EL MANIFIESTO',
      },
      story: [
        'Nació en Lisboa. Llegó a Toronto a los seis años sin hablar inglés — "eres negra, ¿cómo es que no hablas inglés?" es como recuerda la pregunta. Hoy hace rap en tres idiomas.',
        'Los comentarios de sus vídeos están en portugués y llevan la bandera de Angola. El mapa de streaming dice 43% Canadá, 26% Estados Unidos, y Angola en ninguna parte. Son dos públicos distintos leyendo a la misma artista.',
        'Está todo aquí dentro.',
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
  material: 'aluminium',
  // Three cities, each one a fact in the ledger. No stamp for a place she has
  // not actually been — that is the whole discipline, applied to a sticker.
  stamps: [
    { text: 'LISBOA', sub: 'PT · 1994', rotate: -7, factId: 'artist.origin' },
    { text: 'TORONTO', sub: 'CA · AT SIX', rotate: 4, factId: 'artist.base' },
    { text: 'LUANDA', sub: 'AO · KINAXIXI', rotate: -3, factId: 'press.brizzo' },
  ],
  mirror: 'assets/yt-NbJnT5j365M.jpg',
  trays: [
    { label: 'TOP TRAY · HEAVIEST', from: 0, to: 4 },
    { label: 'SECOND TRAY · WHAT SHE BROUGHT BACK', from: 4, to: 7 },
    { label: 'BOTTOM · KEPT', from: 7, to: 10 },
  ],
  engraving: 'RAW® · SHORTIIE RAW',
  packed: 4,
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
    'It is all packed in here.',
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

/* Her about, as papers rather than a bio block. Every field and quote resolves
   through the ledger, so the passport is as sourced as the numbers are. */
const docs: Docs = {
  kicker: 'PASSPORT · DOCUMENTS',
  title: 'Shortiie Raw',
  /* Field labels stacked PT / EN, the way the Portuguese book prints them. */
  /* Field labels in the pairing each book actually prints: PT/EN for the
     Portuguese, EN/FR for the Canadian, ES/EN for the Dominican. */
  fields: [
    { labelPt: 'Apelido / Nome', labelFr: 'Nom', labelEs: 'Apellido / Nombre', label: 'Name', value: String(ledger.require('artist.name').value) },
    { labelPt: 'Local de nascimento', labelFr: 'Lieu de naissance', labelEs: 'Lugar de nacimiento', label: 'Place of birth', value: 'Lisboa, Portugal' },
    { labelPt: 'Data de nascimento', labelFr: 'Date de naissance', labelEs: 'Fecha de nacimiento', label: 'Date of birth', value: String(ledger.require('artist.born').value) },
    { labelPt: 'Residência', labelFr: 'Résidence', labelEs: 'Residencia', label: 'Residence', value: 'Toronto, Canada' },
    { labelPt: 'Grava em', labelFr: 'Enregistre à', labelEs: 'Graba en', label: 'Records from', value: 'Luanda, Angola' },
    { labelPt: 'Línguas', labelFr: 'Langues', labelEs: 'Idiomas', label: 'Languages', value: 'PT · EN · ES' },
  ],
  body: [
    'Born in Lisbon. Landed in Toronto at six speaking no English. She raps in three languages now.',
    'The comments under her videos are in Portuguese and flagged Angola. The streaming map says 43% Canada, 26% United States, and no Angola at all. Those are two different audiences reading the same artist.',
    'Independent. No label, no team.',
  ],
  quotes: [
    { text: String(ledger.require('quote.bullied').value), source: 'Flaunt Magazine', sourceUrl: String(ledger.require('quote.bullied').sourceUrl) },
    { text: String(ledger.require('quote.culture').value), source: 'Flaunt Magazine', sourceUrl: String(ledger.require('quote.culture').sourceUrl) },
    { text: String(ledger.require('quote.selfmade').value), source: 'Flaunt Magazine', sourceUrl: String(ledger.require('quote.selfmade').sourceUrl) },
  ],
};

/* Her Instagram, ranked by comment count read from Instagram's own embed
   endpoint on 2026-08-21. Only posts owned by @shortiieraw. The wedding post
   ranked second and is pulled at James's request — personal, not a promo asset. */
const feed: FeedPost[] = [
  // Her Fire promo, and the post she names first. Instagram refuses to embed
  // this one — the embed URL answers "the link may be broken" on a white card
  // while the reel itself is perfectly alive — so it carries its own frame.
  { id: 'DCpBNoDRtgx', caption: '1 of 1 glowing like one of a kind', comments: 156,
    kind: 'reel', embeddable: false, poster: 'assets/ig-1of1-glowing.jpg' },
  { id: 'CZr3NgclTAj', caption: "I'm going to miss it here", comments: 149 },
  { id: 'CFZ7NNApL3N', caption: 'Fire — in-studio performance', comments: 109 },
  { id: 'DWdDqX6jSiA', caption: 'Woke up to the sweetest messages', comments: 100 },
  { id: 'CqiijQ8ug_N', caption: '#photodump', comments: 75 },
  { id: 'DESsejVNENs', caption: 'Dess — music video out now', comments: 73 },
  { id: 'DFfyclJuO1c', caption: 'Way We Move — out now', comments: 65, kind: 'reel' },
  { id: 'DG59aS3O__8', caption: 'Sip Cuca — out everywhere', comments: 60, kind: 'reel' },
  { id: 'DJ4cG1euwkk', caption: 'Never expect honesty when people lie to themselves', comments: 59 },
  { id: 'DHBo6pUOI3W', caption: 'Y\u2019all heard Sip Cuca yet?', comments: 50 },
];

/* What did not fit in the carry-on: the 2013 uploads, the features living on
   other people's channels, and the audio-only releases. Verified present on
   YouTube 2026-08-21; view counts are from that read. */
const deepCuts = [
  { title: 'Slaughter', sub: 'ft. Jason Packs · 2013 · 24,431', href: 'https://www.youtube.com/watch?v=ii_AKDGHAFA', image: 'assets/clips/ii_AKDGHAFA.jpg' },
  { title: 'Panda Freestyle', sub: 'on 6ixBuzz Premieres · 18,819', href: 'https://www.youtube.com/watch?v=d7DqCGOxxpI', image: 'assets/clips/d7DqCGOxxpI.jpg' },
  { title: 'Knockout', sub: 'on HAM Toronto · 2014 · 9,859', href: 'https://www.youtube.com/watch?v=3af1plSKe6M', image: 'assets/clips/3af1plSKe6M.jpg' },
  { title: 'Dess', sub: '2025 · 2,572', href: 'https://www.youtube.com/watch?v=YfPCjexMP18', image: 'assets/clips/YfPCjexMP18.jpg' },
  { title: 'Drip', sub: 'audio · 30,824', href: 'https://www.youtube.com/watch?v=F5K3XSy-iMA', image: 'assets/clips/F5K3XSy-iMA.jpg' },
  { title: 'A1 Perico', sub: 'audio · 4,914', href: 'https://www.youtube.com/watch?v=ZXgPDKefSkU', image: 'assets/clips/ZXgPDKefSkU.jpg' },
  { title: 'Time or Day', sub: 'audio · 4,127', href: 'https://www.youtube.com/watch?v=L0nwhXZnF5g', image: 'assets/clips/L0nwhXZnF5g.jpg' },
];

/* The machine-readable zone, to ICAO 9303 shape. The document-number field
   carries this site's own reference code, not a passport number — the page is
   a design device and says so under the MRZ. */
const mrz: [string, string] = [
  'P<PRTSHORTIIE<<RAW<<<<<<<<<<<<<<<<<<<<<<<<<<',
  'SHORCA264734PRT9403284F<<<<<<<CARRYON<<<<<<0',
];

const out = build(world as any, content, ledger, {
  shell,
  spatial: {
    montage: { src: 'assets/montage.mp4', poster: 'assets/montage-poster.jpg' },
    docs, feed, igHandle: 'shortiieraw', deepCuts, mrz,
  },
});
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

/* Every local asset the page names must actually be in the output. A missing
   one is invisible: the build is green, the HTML is valid, and the tile just
   renders empty. Cost me a silent empty poster on 2026-08-22. */
{
  const html = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');
  const refs = [...html.matchAll(/(?:src|href)="(assets\/[^"]+)"|url\('(assets\/[^']+)'\)/g)]
    .map(m => m[1] ?? m[2]).filter(Boolean) as string[];
  const missing = [...new Set(refs)].filter(r => !fs.existsSync(path.join(OUT, r)));
  if (missing.length) {
    console.error(`\n  ✕ ${missing.length} asset(s) referenced but not emitted:`);
    for (const m of missing) console.error('    ' + m);
    process.exit(1);
  }
  console.log(`  ${new Set(refs).size} local assets referenced, all present`);
}
console.log(`\n  ${Object.keys(out.files).length} files → ${OUT}`);
