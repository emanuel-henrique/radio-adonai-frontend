import 'dotenv/config';
import { buildApp } from './app.js';

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

/**
 * Ponto de entrada do servidor.
 * Separado do app.ts para que a instância do Fastify possa ser
 * importada e testada sem iniciar o listener HTTP.
 */
async function start(): Promise<void> {
  const app = buildApp({ logger: true });

  try {
    await app.listen({ port: PORT, host: HOST });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();