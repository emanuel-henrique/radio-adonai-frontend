import { describe, it, expect, afterAll } from 'vitest';
import { app } from './vercel.js';

/**
 * Cobre o ponto de entrada usado na Vercel.
 *
 * O teste que mais importa aqui é o do health check: ele prova que a instância
 * exportada atende requisições sem passar por `app.listen()`, que era
 * exatamente o que fazia a Vercel responder 500 em todas as rotas.
 */
describe('entrada da Vercel', () => {
  afterAll(async () => {
    await app.close();
  });

  it('exporta uma instância do Fastify utilizável para testes', () => {
    expect(typeof app.inject).toBe('function');
    expect(typeof app.close).toBe('function');
  });

  it('atende ao health check sem tocar no banco', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'ok' });
  });

  it('roteia requisições desconhecidas para 404 em vez de 500', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/rota-inexistente',
    });

    expect(response.statusCode).toBe(404);
  });

  it('valida a requisição em vez de engolir o erro', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {},
    });

    // O corpo vazio não é um login válido: a resposta precisa ser de validação
    // (4xx), nunca um erro de infraestrutura (5xx).
    expect(response.statusCode).toBeGreaterThanOrEqual(400);
    expect(response.statusCode).toBeLessThan(500);
  });
});
