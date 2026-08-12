import { z } from 'zod';

export const PEOPLE = ['Bruce', 'Kevin', 'Travis'] as const;
export const CATEGORIES = [
  'Surprise Me', 'Science & Nature', 'Technology & AI', 'Society',
  'Fix Something', 'Future', 'Everyday Mysteries', 'Absurd', 'Big Questions'
] as const;
export const MAX_QUESTION_LENGTH = 500;
export const MAX_STORED_HISTORY = 75;
export const MAX_SENT_HISTORY = 20;

export const oracleResponseSchema = z.object({
  person: z.enum(PEOPLE),
  verdict: z.string().trim().min(1).max(100),
  explanation: z.string().trim().min(1).max(450),
  expandedReasoning: z.string().trim().min(1).max(700).nullable()
});

export const answerResultSchema = z.object({
  question: z.string().trim().min(1).max(MAX_QUESTION_LENGTH),
  responses: z.array(oracleResponseSchema).length(3),
  group: z.object({
    alignment: z.enum(['unanimous', 'mostly-agreed', 'split', 'no-consensus']),
    summary: z.string().trim().min(1).max(500),
    mainDisagreement: z.string().trim().max(400).nullable(),
    conversationStarter: z.string().trim().max(400).nullable()
  })
}).superRefine((value, ctx) => {
  for (const person of PEOPLE) {
    if (value.responses.filter((response) => response.person === person).length !== 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Exactly one ${person} response is required`, path: ['responses'] });
    }
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
