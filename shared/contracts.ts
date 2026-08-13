import { z } from 'zod';

export const PEOPLE = ['Bruce', 'Kevin', 'Travis'] as const;
export const CATEGORIES = [
  'Surprise Me', 'Science & Nature', 'Technology & AI', 'Society',
  'Fix Something', 'Future', 'Everyday Mysteries', 'Absurd', 'Big Questions'
] as const;
export const MAX_QUESTION_LENGTH = 500;
export const MAX_STORED_HISTORY = 75;
export const MAX_SENT_HISTORY = 20;
export const MAX_BALL_LABEL_WORDS = 5;

const ballLabelSchema = z.string().trim().min(1).max(42).refine(
  (label) => label.split(/\s+/).length <= MAX_BALL_LABEL_WORDS,
  `Ball label must contain at most ${MAX_BALL_LABEL_WORDS} words`
);

export const oracleResponseSchema = z.object({
  person: z.enum(PEOPLE),
  mode: z.enum(['answer', 'dodge']),
  ballLabel: ballLabelSchema,
  fullAnswer: z.string().trim().min(1).max(500),
  expandedReasoning: z.string().trim().min(1).max(700).nullable()
});

export const answerResultSchema = z.object({
  question: z.string().trim().min(1).max(MAX_QUESTION_LENGTH),
  responses: z.array(oracleResponseSchema).length(3),
  group: z.object({
    alignment: z.enum(['unanimous', 'mostly-agreed', 'split', 'no-consensus']),
    summary: z.string().trim().min(1).max(280),
    mainDisagreement: z.string().trim().max(400).nullable(),
    conversationStarter: z.string().trim().max(180).nullable(),
    dodgePerson: z.enum(PEOPLE).nullable()
  })
}).superRefine((value, ctx) => {
  for (const person of PEOPLE) {
    if (value.responses.filter((response) => response.person === person).length !== 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Exactly one ${person} response is required`, path: ['responses'] });
    }
  }
  const dodges = value.responses.filter((response) => response.mode === 'dodge');
  if (dodges.length > 1) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'At most one Oracle may dodge', path: ['responses'] });
  }
  if ((dodges[0]?.person ?? null) !== value.group.dodgePerson) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Group dodgePerson must match the dodge response', path: ['group', 'dodgePerson'] });
  }
});

export const discussionResultSchema = z.object({
  question: z.string().trim().min(10).max(MAX_QUESTION_LENGTH),
  category: z.enum(CATEGORIES),
  optionalContext: z.string().trim().max(220).nullable()
});

export const answerRequestSchema = z.object({
  mode: z.literal('answer_question'),
  question: z.string().trim().min(1).max(MAX_QUESTION_LENGTH)
});

export const discussionRequestSchema = z.object({
  mode: z.literal('generate_discussion_question'),
  category: z.enum(CATEGORIES),
  recentQuestions: z.array(z.string().trim().min(1).max(MAX_QUESTION_LENGTH)).max(MAX_SENT_HISTORY)
});

export const oracleApiRequestSchema = z.discriminatedUnion('mode', [answerRequestSchema, discussionRequestSchema]);

export type AnswerResult = z.infer<typeof answerResultSchema>;
export type DiscussionResult = z.infer<typeof discussionResultSchema>;
export type Category = (typeof CATEGORIES)[number];
export type OracleApiRequest = z.infer<typeof oracleApiRequestSchema>;

export function boundedHistory(history: unknown): string[] {
  if (!Array.isArray(history)) return [];
  return history.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim().slice(0, MAX_QUESTION_LENGTH))
    .slice(-MAX_STORED_HISTORY);
}

export function recentHistoryForApi(history: unknown): string[] {
  return boundedHistory(history).slice(-MAX_SENT_HISTORY);
}
