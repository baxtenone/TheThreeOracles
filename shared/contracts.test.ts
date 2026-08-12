import {
  answerRequestSchema, answerResultSchema, boundedHistory, CATEGORIES,
  discussionRequestSchema, discussionResultSchema, MAX_QUESTION_LENGTH,
  MAX_SENT_HISTORY, MAX_STORED_HISTORY, recentHistoryForApi
} from './contracts';

const validAnswer = {
  question: 'Should humans colonize Mars?',
  responses: [
    { person: 'Bruce', verdict: 'Eventually.', explanation: 'Build the systems first.', expandedReasoning: null },
    { person: 'Kevin', verdict: 'Show me the plan.', explanation: 'The engineering case is incomplete.', expandedReasoning: 'Evidence before enthusiasm.' },
    { person: 'Travis', verdict: 'For what purpose?', explanation: 'The incentive matters.', expandedReasoning: null }
  ],
  group: { alignment: 'mostly-agreed', summary: 'Explore first.', mainDisagreement: null, conversationStarter: 'What counts as success?' }
};

describe('request and response contracts', () => {
  it('rejects an empty question', () => expect(() => answerRequestSchema.parse({ mode: 'answer_question', question: ' ' })).toThrow());
  it('rejects an overlong question', () => expect(() => answerRequestSchema.parse({ mode: 'answer_question', question: 'x'.repeat(MAX_QUESTION_LENGTH + 1) })).toThrow());
  it('accepts a valid Ask request', () => expect(answerRequestSchema.parse({ mode: 'answer_question', question: 'Worth it?' }).question).toBe('Worth it?'));
  it('validates a complete structured response', () => expect(answerResultSchema.parse(validAnswer)).toEqual(validAnswer));
  it('requires each Oracle exactly once', () => {
    const malformed = { ...validAnswer, responses: [validAnswer.responses[0], validAnswer.responses[0], validAnswer.responses[2]] };
    expect(() => answerResultSchema.parse(malformed)).toThrow(/Kevin|Bruce/);
  });
  it('rejects malformed AI output safely', () => expect(answerResultSchema.safeParse({ prose: 'Three long opinions' }).success).toBe(false));
  it('validates discussion output and allowed categories', () => {
    expect(discussionResultSchema.parse({ question: 'Why are houses still designed this way?', category: 'Everyday Mysteries', optionalContext: null })).toBeTruthy();
    expect(() => discussionRequestSchema.parse({ mode: 'generate_discussion_question', category: 'Trivia', recentQuestions: [] })).toThrow();
    expect(CATEGORIES).toContain('Surprise Me');
  });
  it('bounds stored history and limits the API subset', () => {
    const history = Array.from({ length: 100 }, (_, index) => `Question ${index}?`);
    expect(boundedHistory(history)).toHaveLength(MAX_STORED_HISTORY);
    expect(recentHistoryForApi(history)).toHaveLength(MAX_SENT_HISTORY);
    expect(recentHistoryForApi(history).at(-1)).toBe('Question 99?');
  });
});
