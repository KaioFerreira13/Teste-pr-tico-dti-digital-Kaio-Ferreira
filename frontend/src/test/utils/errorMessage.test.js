import { describe, expect, it } from 'vitest';
import { getErrorMessage } from '../../utils/errorMessage';

describe('getErrorMessage', () => {
  it('returns the fallback when the server has no response data', () => {
    expect(getErrorMessage({}, 'Falha personalizada')).toBe('Falha personalizada');
  });

  it('returns a plain server message', () => {
    const error = { response: { data: 'Drone indisponivel.' } };
    expect(getErrorMessage(error)).toBe('Drone indisponivel.');
  });

  it('combines field validation messages', () => {
    const error = {
      response: {
        data: {
          message: 'Dados invalidos.',
          fields: { name: 'Nome obrigatorio.', weight: 'Peso invalido.' },
        },
      },
    };
    expect(getErrorMessage(error)).toBe('Nome obrigatorio. Peso invalido.');
  });

  it('uses the general message when field errors are empty', () => {
    const error = {
      response: { data: { message: 'Dados invalidos.', fields: {} } },
    };
    expect(getErrorMessage(error)).toBe('Dados invalidos.');
  });

  it('uses fallback for an unknown response shape', () => {
    const error = { response: { data: { errorCode: 500 } } };
    expect(getErrorMessage(error)).toBe('Nao foi possivel concluir a operacao.');
  });
});
