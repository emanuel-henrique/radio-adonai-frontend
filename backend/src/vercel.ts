import { buildApp } from './app.js';
import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Instância da aplicação preparada para a Vercel.
 *
 * A Vercel não executa um servidor HTTP: para cada requisição ela invoca uma
 * função e espera um handler. Por isso o backend não pode ser iniciado com
 * `app.listen()` nesse ambiente — o processo abriria um socket que ninguém
 * atenderia e a função terminaria com `FUNCTION_INVOCATION_FAILED` (HTTP 500)
 * em *todas* as rotas, inclusive as de autenticação.
 *
 * Exportar a instância já construída faz o Fastify atender a requisição da
 * Vercel diretamente. O `server.ts` continua sendo o ponto de entrada para Node
 * (desenvolvimento e hosts com processo de longa duração).
 *
 * O Prisma é inicializado de forma lazy (ver `infrastructure/prisma.ts`), então
 * construir o app aqui não abre conexão com o banco nem exige `DATABASE_URL` no
 * cold start — a variável só é lida na primeira query de verdade.
 *
 * O log fica ligado em produção porque é ele que aparece nos logs da Vercel,
 * e sem ele um `FUNCTION_INVOCATION_FAILED` não deixa rastro. Nos testes ele é
 * desligado para não poluir a saída do vitest.
 */
export const app = buildApp({ logger: process.env.NODE_ENV !== 'test' });

let ready: PromiseLike<void> | undefined;

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  if (!ready) ready = app.ready().then(() => {});
  await ready;
  app.server.emit('request', request, response);
}
