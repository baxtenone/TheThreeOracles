import type { OracleGenerator } from './_lib/oracleService';
import { processOracleRequest } from './oracle';

const generator: OracleGenerator = {
  answer: async (question) => ({ question, responses: [
    { person: 'Bruce', verdict: 'Yes.', explanation: 'Systems can improve.', expandedReasoning: null },
    { person: 'Kevin', verdict: 'Probably.', explanation: 'The evidence points there.', expandedReasoning: null },
    { person: 'Travis', verdict: 'With constraints.', explanation: 'Incentives still matter.', expandedReasoning: null }
  ], group: { alignment: 'mostly-agreed', summary: 'Broad agreement.', mainDisagreement: null, conversationStarter: 'What changes first?' } }),
  discuss: async (category, history) => ({ question: `A fresh ${category} question beyond ${history.length} repeats?`, category, optionalContext: null })
};

it('routes one valid Ask request to one generator call', async () => {
  const answerSpy = vi.spyOn(generator, 'answer');
  const result = await processOracleRequest({ mode: 'answer_question', question: 'Can this work?' }, generator);
  expect(answerSpy).toHaveBeenCalledTimes(1);
  expect(result).toHaveProperty('responses');
});

it('passes validated recent history to question generation', async () => {
  const discussSpy = vi.spyOn(generator, 'discuss');
  await processOracleRequest({ mode: 'generate_discussion_question', category: 'Future', recentQuestions: ['One?', 'Two?'] }, generator);
  expect(discussSpy).toHaveBeenCalledWith('Future', ['One?', 'Two?']);
});
