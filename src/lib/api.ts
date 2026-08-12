import { answerResultSchema, discussionResultSchema, type AnswerResult, type Category, type DiscussionResult } from '../../shared/contracts';

export class ApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

const mockMode = import.meta.env.DEV && import.meta.env.VITE_ORACLE_MOCK_MODE === 'true';

async function post<T>(path: string, body: unknown, accessCode?: string): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(accessCode ? { 'x-oracle-access': accessCode } : {}) },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
  if (!response.ok) throw new ApiError(payload?.error?.message || "The Oracles aren't answering right now. Try again.", response.status);
  return payload as T;
}

export async function verifyAccess(code: string): Promise<void> {
  if (mockMode && code.trim()) return;
  await post('/api/auth', { code });
}
export async function askOracles(question: string, code: string): Promise<AnswerResult> {
  if (mockMode) return mockAnswer(question);
  return answerResultSchema.parse(await post('/api/oracle', { mode: 'answer_question', question }, code));
}
export async function generateQuestion(category: Category, recentQuestions: string[], code: string): Promise<DiscussionResult> {
  if (mockMode) return mockDiscussion(category, recentQuestions.length);
  return discussionResultSchema.parse(await post('/api/oracle', { mode: 'generate_discussion_question', category, recentQuestions }, code));
}

async function pause() { await new Promise((resolve) => window.setTimeout(resolve, 350)); }
async function mockAnswer(question: string): Promise<AnswerResult> {
  await pause();
  return { question, responses: [
    { person: 'Bruce', mode: 'answer', ballLabel: 'Worth trying.', fullAnswer: 'The system is plausible, provided we design for the messy edge cases instead of the demo.', expandedReasoning: 'Start with a small reversible version, instrument it, and let reality argue with the architecture.' },
    { person: 'Kevin', mode: 'dodge', ballLabel: 'Checking the evidence.', fullAnswer: 'Kevin is comparing the assumptions with one more source before committing to this one.', expandedReasoning: null },
    { person: 'Travis', mode: 'answer', ballLabel: 'Wrong question.', fullAnswer: 'The real question is who has an incentive to make the practical version succeed.', expandedReasoning: 'A technically sound answer still fails when costs, incentives, and ownership point in different directions.' }
  ], group: { alignment: 'mostly-agreed', summary: 'Bruce and Travis see a workable idea from different angles. Kevin appears to be checking the evidence before committing.', mainDisagreement: 'How much evidence is enough before trying a small version?', conversationStarter: 'What is the cheapest experiment that could prove the premise wrong?', dodgePerson: 'Kevin' } };
}
async function mockDiscussion(category: Category, historyCount: number): Promise<DiscussionResult> {
  await pause();
  return { question: 'If electricity disappeared worldwide for one month, which modern institution would prove far more fragile than anyone expects?', category, optionalContext: historyCount ? 'Assume essential infrastructure has only its existing backup capacity.' : null };
}
