import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isTokenValid } from './AuthContext';

const tokenWithPayload = (payload) => {
  const encoded = btoa(JSON.stringify(payload))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
  return `header.${encoded}.signature`;
};

describe('isTokenValid', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('accepts a session token that has not expired', () => {
    const token = tokenWithPayload({ exp: Math.floor(Date.now() / 1000) + 60 });
    expect(isTokenValid(token)).toBe(true);
  });

  it('rejects an expired session token', () => {
    const token = tokenWithPayload({ exp: Math.floor(Date.now() / 1000) - 1 });
    expect(isTokenValid(token)).toBe(false);
  });

  it('rejects a token without expiration', () => {
    expect(isTokenValid(tokenWithPayload({ sub: 'user@test.com' }))).toBe(false);
  });

  it('rejects malformed and empty tokens', () => {
    expect(isTokenValid('invalid-token')).toBe(false);
    expect(isTokenValid('header.not-json.signature')).toBe(false);
    expect(isTokenValid(null)).toBe(false);
  });
});
