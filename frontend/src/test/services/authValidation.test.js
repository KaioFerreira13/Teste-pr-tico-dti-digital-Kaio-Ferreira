import { describe, expect, it } from 'vitest';
import {
  getPasswordRequirements,
  validateLogin,
  validateRegistration,
} from '../../services/authValidation';

describe('authValidation', () => {
  it('accepts valid login credentials without requiring a new password policy', () => {
    expect(validateLogin({ email: 'user@example.com', password: 'legacy' })).toBe('');
  });

  it('rejects malformed email addresses', () => {
    expect(validateLogin({ email: 'invalid-email', password: 'Password@1' })).toBe(
      'Informe um email valido.',
    );
  });

  it('requires a strong password during registration', () => {
    expect(
      validateRegistration({
        name: 'Usuario Teste',
        email: 'user@example.com',
        password: 'password',
      }),
    ).toContain('letra maiuscula');
  });

  it('accepts registration when every password requirement is satisfied', () => {
    expect(
      validateRegistration({
        name: 'Usuario Teste',
        email: 'user@example.com',
        password: 'Password@1',
      }),
    ).toBe('');
    expect(getPasswordRequirements('Password@1').every(item => item.valid)).toBe(true);
  });
});

