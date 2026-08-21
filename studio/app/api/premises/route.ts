/**
 * Draft three premises, then GATE them.
 *
 * The gate is the point. A model asked for three ideas will reliably return
 * one idea in three coats of paint, because the median is what "safe" looks
 * like from inside a training distribution. If the drafts fail divergence we
 * send the specific failures back and ask again, rather than shipping a menu
 * that is really one option.
 *
 * Output is forced through a tool schema. Asking for JSON in prose and then
 * regexing the reply works until the day it doesn't, and the failure mode is
 * a 2-minute round trip that returns nothing.
 */
import { premisePrompt, assertDivergent } from '../../../../engine/src/premise.ts';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const MODEL = 'claude-opus-5';

const PREMISE_SCHEMA = {
  type: 'object',
  properties: {
    premises: {
      type: 'array', minItems: 3, maxItems: 3,
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'THE NAME. A world, two or three words. "The Vault". Not a description.' },
          logline: { type: 'string', description: 'One sentence: what a stranger feels in four seconds.' },
          topology: { type: 'string', enum: ['spatial', 'dossier', 'broadcast', 'plate', 'ledger'] },
          ground: { type: 'string', description: 'Hex. The ground colour, decided before layout. Never a warm off-white.' },
          accent: { type: 'string', description: 'Hex. ONE saturated hue, at least 45% saturation.' },
          thresholdGesture: { type: 'string', enum: ['scroll', 'hold', 'drag', 'press', 'turn'] },
          thresholdLabel: { type: 'string', description: 'The words on the way in, in this world\'s language. Never "Enter Site".' },
          lexicon: {
            type: 'object',
            description: 'Every section renamed FROM THE WORLD. "Contact" or "Gallery" means the premise leaked.',
            properties: {
              enter: { type: 'string' }, catalogue: { type: 'string' }, story: { type: 'string' },
              proof: { type: 'string' }, contact: { type: 'string' }, latest: { type: 'string' },
              unit: { type: 'string' }, index: { type: 'string' },
            },
            required: ['enter', 'catalogue', 'story', 'proof', 'contact', 'latest', 'unit', 'index'],
          },
          rationale: { type: 'string', description: 'Why THIS artist, citing the interview answer id that produced it.' },
          fromAnswers: { type: 'array', items: { type: 'string' }, minItems: 1, description: 'The interview answer ids this came from.' },
        },
        required: ['name', 'logline', 'topology', 'ground', 'accent', 'thresholdGesture', 'thresholdLabel', 'lexicon', 'rationale', 'fromAnswers'],
      },
    },
  },
  required: ['premises'],
};

async function draft(prompt: string, key: string) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: MODEL, max_tokens: 8000,
      tools: [{ name: 'submit_premises', description: 'Submit exactly three named premises.', input_schema: PREMISE_SCHEMA }],
      tool_choice: { type: 'tool', name: 'submit_premises' },
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!r.ok) throw new Error(`Anthropic API ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const d = await r.json();
  const use = d.content?.find((b: any) => b.type === 'tool_use');
  if (!use) throw new Error(`the model returned no tool call (stop_reason: ${d.stop_reason})`);
  return use.input.premises;
}

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return Response.json({ error: 'ANTHROPIC_API_KEY is not set. The premise step needs it; everything else in the studio runs keyless.' }, { status: 400 });

  const { artist, answers, facts } = await req.json();
  const evidence = (facts ?? []).map((f: any) => `  ${f.label}: ${f.value}  [${f.sourceUrl}]`).join('\n');
  let prompt = premisePrompt({ artist, answers, evidence });
  const history: string[] = [];

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const premises = await draft(prompt, key);
      const gate = assertDivergent(premises);
      if (gate.ok) return Response.json({ premises, attempts: attempt, rejected: history });
      history.push(`attempt ${attempt}: ${gate.problems.join(' | ')}`);
      if (attempt === 3) return Response.json({ error: `Three attempts and the premises still collapse into one:\n- ${gate.problems.join('\n- ')}`, premises, gate, rejected: history }, { status: 422 });
      prompt = `${prompt}\n\nYour previous attempt was REJECTED by the divergence gate:\n- ${gate.problems.join('\n- ')}\n\nThese are not style notes. Fix every one and return three genuinely different SHAPES of site.`;
    } catch (e: any) {
      history.push(`attempt ${attempt}: ${e.message}`);
      if (attempt === 3) return Response.json({ error: e.message, rejected: history }, { status: 500 });
    }
  }
}
