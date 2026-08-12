import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import {
  answerResultSchema,
  discussionResultSchema,
  type AnswerResult,
  type Category,
  type DiscussionResult
} from '../../shared/contracts.js';
import { answerInstructions, discussionInput, discussionInstructions } from './prompts.js';
import { assertDodgePlan, type DodgePlan } from './dodge.js';

export interface OracleGenerator {
  answer(question: string, dodgePlan: DodgePlan): Promise<AnswerResult>;
  discuss(category: Category, recentQuestions: string[]): Promise<DiscussionResult>;
}

export class OpenAIOracleGenerator implements OracleGenerator {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(apiKey = process.env.OPENAI_API_KEY, model = process.env.OPENAI_MODEL || 'gpt-5.6-luna') {
    if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');
    this.client = new OpenAI({ apiKey, timeout: 25_000, maxRetries: 1 });
    this.model = model;
  }

  async answer(question: string, dodgePlan: DodgePlan): Promise<AnswerResult> {
    const response = await this.client.responses.parse({
      model: this.model,
      instructions: answerInstructions(dodgePlan),
      input: `Question: ${question}`,
      store: false,
      max_output_tokens: 1400,
      text: { format: zodTextFormat(answerResultSchema, 'oracle_answers') }
    });
    if (!response.output_parsed) throw new Error('The model returned no structured answer');
    return assertDodgePlan(answerResultSchema.parse(response.output_parsed), dodgePlan);
  }

  async discuss(category: Category, recentQuestions: string[]): Promise<DiscussionResult> {
    const response = await this.client.responses.parse({
      model: this.model,
      instructions: discussionInstructions,
      input: discussionInput(category, recentQuestions),
      store: false,
      max_output_tokens: 450,
      text: { format: zodTextFormat(discussionResultSchema, 'discussion_question') }
    });
    if (!response.output_parsed) throw new Error('The model returned no structured question');
    return discussionResultSchema.parse(response.output_parsed);
  }
}
