import { QUESTIONS } from '../../../../engine/src/interview.ts';
export async function GET() {
  return Response.json({ questions: QUESTIONS.map(({ when, ...q }) => q) });
}
