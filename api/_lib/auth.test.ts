import { accessCodeFromHeaders, isAuthorized } from './auth';
import authHandler from '../auth';
import type { VercelRequest, VercelResponse } from '@vercel/node';

describe('private access', () => {
  it('rejects missing and invalid access', () => {
    expect(isAuthorized(undefined, 'mesa')).toBe(false);
    expect(isAuthorized('wrong', 'mesa')).toBe(false);
  });
  it('accepts the configured shared code', () => expect(isAuthorized('mesa', 'mesa')).toBe(true));
  it('reads the API header', () => expect(accessCodeFromHeaders({ 'x-oracle-access': 'mesa' })).toBe('mesa'));
  it('rejects an unauthorized API request and accepts valid access', () => {
    const previous = process.env.ORACLE_ACCESS_CODE;
    process.env.ORACLE_ACCESS_CODE = 'mesa';
    const makeResponse = () => {
      const response = { setHeader: vi.fn(), status: vi.fn(), json: vi.fn() };
      response.status.mockReturnValue(response);
      response.json.mockReturnValue(response);
      return response;
    };
    const denied = makeResponse();
    authHandler({ method: 'POST', body: { code: 'wrong' } } as VercelRequest, denied as unknown as VercelResponse);
    expect(denied.status).toHaveBeenCalledWith(401);
    const accepted = makeResponse();
    authHandler({ method: 'POST', body: { code: 'mesa' } } as VercelRequest, accepted as unknown as VercelResponse);
    expect(accepted.status).toHaveBeenCalledWith(200);
    if (previous === undefined) delete process.env.ORACLE_ACCESS_CODE; else process.env.ORACLE_ACCESS_CODE = previous;
  });
});
