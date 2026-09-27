import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  ApiError,
  loginUser,
  loginWithGoogle,
  registerUser,
} from './api';

const okResponse = (payload: unknown) =>
  ({
    ok: true,
    status: 200,
    json: async () => payload,
  }) as Response;

const errorResponse = (status: number, payload: unknown) =>
  ({
    ok: false,
    status,
    json: async () => payload,
  }) as Response;

describe('api client', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('deve enviar o cadastro para POST /auth/register', async () => {
    const session = { user: { id: '1', name: 'João', email: 'joao@adonai.com' }, token: 'jwt' };
    fetchMock.mockResolvedValue(okResponse(session));

    const result = await registerUser({
      name: 'João',
      email: 'joao@adonai.com',
      password: 'senha123',
    });

    expect(result).toEqual(session);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:3001/auth/register');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({
      name: 'João',
      email: 'joao@adonai.com',
      password: 'senha123',
    });
  });

  it('deve enviar o idToken para POST /auth/google', async () => {
    fetchMock.mockResolvedValue(okResponse({ user: {}, token: 'jwt' }));

    await loginWithGoogle('google-id-token');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:3001/auth/google');
    expect(JSON.parse(options.body)).toEqual({ idToken: 'google-id-token' });
  });

  it('deve fazer login com e-mail e senha', async () => {
    fetchMock.mockResolvedValue(okResponse({ user: {}, token: 'jwt' }));

    await loginUser({ email: 'joao@adonai.com', password: 'senha123' });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:3001/auth/login');
    expect(JSON.parse(options.body)).toEqual({
      email: 'joao@adonai.com',
      password: 'senha123',
    });
  });

  it('deve lançar ApiError com a mensagem retornada pelo backend', async () => {
    fetchMock.mockResolvedValue(
      errorResponse(401, { error: 'Falha ao autenticar com o Google.' }),
    );

    await expect(loginWithGoogle('token-invalido')).rejects.toThrow(
      'Falha ao autenticar com o Google.',
    );
    await expect(loginWithGoogle('token-invalido')).rejects.toBeInstanceOf(ApiError);
  });

  it('deve lançar ApiError quando a API estiver inacessível', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(loginUser({ email: 'a@b.com', password: '123456' })).rejects.toThrow(
      'Não foi possível conectar ao servidor.',
    );
  });
});
