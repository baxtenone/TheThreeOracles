import {
  answerRequestSchema, answerResultSchema, boundedHistory, CATEGORIES,
  discussionRequestSchema, discussionResultSchema, MAX_QUESTION_LENGTH,
  MAX_BALL_LABEL_WORDS, MAX_SENT_HISTORY, MAX_STORED_HISTORY, oracleResponseSchema, recentHistoryForApi
} from './contracts';

const validAnswer = {
  question: 'Should humans colonize Mars?',
  responses: [
    { person: 'Bruce', mode: 'answer', ballLabel: 'Eventually.', fullAnswer: 'Build the systems first.', expandedReasoning: null },
    { person: 'Kevin', mode: 'answer', ballLabel: 'Needs proof.', fullAnswer: 'The engineering case is incomplete.', expandedReasoning: 'Evidence before enthusiasm.' },
    { person: 'Travis', mode: 'answer', ballLabel: 'Wrong question.', fullAnswer: 'The incentive matters.', expandedReasoning: null }
  ],
  group: { alignment: 'mostly-agreed', summary: 'Explore first.', mainDisagreement: null, conversationStarter: 'What counts as success?', dodgePerson: null }
};

describe('request and response contracts', () => {
  it('rejects an empty question', () => expect(() => answerRequestSchema.parse({ mode: 'answer_question', question: ' ' })).toThrow());
  it('rejects an overlong question', () => expect(() => answerRequestSchema.parse({ mode: 'answer_question', question: 'x'.repeat(MAX_QUESTION_LENGTH + 1) })).toThrow());
  it('accepts a valid Ask request', () => expect(answerRequestSchema.parse({ mode: 'answer_question', question: 'Worth it?' }).question).toBe('Worth it?'));
  it('validates a complete structured response', () => expect(answerResultSchema.parse(validAnswer)).toEqual(validAnswer));
  it('validates normal and dodge responses', () => {
    expect(oracleResponseSchema.parse(validAnswer.responses[0]).mode).toBe('answer');
    expect(oracleResponseSchema.parse({ person: 'Kevin', mode: 'dodge', ballLabel: 'Checking the evidence.', fullAnswer: 'Kevin wants one more source.', expandedReasoning: null }).mode).toBe('dodge');
  });
  it('enforces concise one-to-five-word ball labels', () => {
    expect(validAnswer.responses[0].ballLabel.split(/\s+/)).toHaveLength(1);
    expect(() => oracleResponseSchema.parse({ ...validAnswer.responses[0], ballLabel: Array(MAX_BALL_LABEL_WORDS + 1).fill('word').join(' ') })).toThrow(/at most 5 words/i);
  });
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
  it('bounds compact Results summary copy', () => {
    expect(() => answerResultSchema.parse({ ...validAnswer, group: { ...validAnswer.group, summary: 'x'.repeat(281) } })).toThrow();
    expect(() => answerResultSchema.parse({ ...validAnswer, group: { ...validAnswer.group, conversationStarter: 'x'.repeat(181) } })).toThrow();
  });
});
