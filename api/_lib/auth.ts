import { timingSafeEqual } from 'node:crypto';

export function isAuthorized(provided: unknown, expected = process.env.ORACLE_ACCESS_CODE): boolean {
  if (typeof provided !== 'string' || !expected) return false;
  const supplied = Buffer.from(provided);
  const configured = Buffer.from(expected);
  return supplied.length === configured.length && timingSafeEqual(supplied, configured);
}

export function accessCodeFromHeaders(headers: Record<string, string | string[] | undefined>): string | undefined {
  const value = headers['x-oracle-access'];
  return Array.isArray(value) ? value[0] : value;
}
