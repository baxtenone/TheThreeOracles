import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ZodError } from 'zod';
import { oracleApiRequestSchema } from '../shared/contracts.js';
import { accessCodeFromHeaders, isAuthorized } from './_lib/auth.js';
import { OpenAIOracleGenerator, type OracleGenerator } from './_lib/oracleService.js';

export async function processOracleRequest(body: unknown, generator: OracleGenerator) {
  const request = oracleApiRequestSchema.parse(body);
  return request.mode === 'answer_question'
    ? generator.answer(request.question)
    : generator.discuss(request.category, request.recentQuestions);
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') return response.status(405).json({ error: { code: 'method_not_allowed', message: 'Use POST.' } });
  if (!isAuthorized(accessCodeFromHeaders(request.headers))) {
    return response.status(401).json({ error: { code: 'unauthorized', message: 'The Oracles need the shared access code.' } });
  }
  try {
    return response.status(200).json(await processOracleRequest(request.body, new OpenAIOracleGenerator()));
  } catch (error) {
    if (error instanceof ZodError) {
      return response.status(400).json({ error: { code: 'invalid_request', message: 'That request was not understood.', details: error.flatten() } });
    }
    console.error('Oracle API failure', error instanceof Error ? error.message : error);
    const message = error instanceof Error && error.message.includes('OPENAI_API_KEY')
      ? 'The Oracles have not been configured yet.'
      : "The Oracles aren't answering right now. Try again.";
    return response.status(502).json({ error: { code: 'oracle_unavailable', message } });
  }
}
