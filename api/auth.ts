import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isAuthorized } from './_lib/auth.js';

export default function handler(request: VercelRequest, response: VercelResponse) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') return response.status(405).json({ error: { code: 'method_not_allowed', message: 'Use POST.' } });
  const code = typeof request.body?.code === 'string' ? request.body.code : '';
  if (!isAuthorized(code)) return response.status(401).json({ error: { code: 'invalid_access', message: 'That access code did not work.' } });
  return response.status(200).json({ authorized: true });
}
