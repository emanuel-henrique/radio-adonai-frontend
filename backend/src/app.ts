import Fastify from 'fastify';

/**
 * Cria e configura a instância da aplicação Fastify.
 *
 * Esta é a raiz de composição da aplicação, onde todas as
 * dependências são conectadas seguindo os princípios de DDD.
 */
export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  // Rota de health check — única rota no scaffold
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  return app;
}
