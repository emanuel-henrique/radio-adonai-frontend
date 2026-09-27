import { Readable } from 'node:stream';
import { FastifyInstance } from 'fastify';
import { IShoutcastStreamProvider } from '../../domain/providers/IShoutcastStreamProvider.js';
import { ShoutcastStreamProvider } from '../../infrastructure/providers/ShoutcastStreamProvider.js';
import { AppError } from '../../domain/errors/AppError.js';

/**
 * Proxy do áudio da rádio.
 *
 * Existe porque o Shoutcast serve AAC com o Content-Type `audio/aacp`, que os
 * navegadores rejeitam. Aqui o corpo é repassado byte a byte e apenas o
 * Content-Type é corrigido para `audio/aac` (mesmos bytes, rótulo suportado).
 *
 * ATENÇÃO: esta resposta fica aberta enquanto alguém ouve. Em função serverless
 * a Vercel encerra a invocação após 300 s no plano Hobby e devolve 504, cortando
 * o áudio no meio da faixa. Em produção o frontend deve apontar para o
 * Cloudflare Worker do diretório `radio-proxy/`, que não tem limite de duração.
 * Esta rota serve para desenvolvimento e para hosts com conexão longa.
 */
export function radioRoutes(
  provider: IShoutcastStreamProvider = new ShoutcastStreamProvider(),
) {
  return async function (app: FastifyInstance): Promise<void> {
    app.get('/radio/stream', async (request, reply) => {
      const controller = new AbortController();

      // Assume o controle da resposta: o Fastify não deve tentar serializar.
      reply.hijack();

      let source: Readable | undefined;

      // O cliente desconectou ou a resposta terminou: encerra o upstream.
      reply.raw.on('close', () => {
        controller.abort();
        source?.destroy();
      });

      try {
        const upstream = await provider.open(controller.signal);
        source = Readable.fromWeb(
          upstream.body as Parameters<typeof Readable.fromWeb>[0],
        );

        reply.raw.writeHead(200, {
          'Content-Type': upstream.contentType,
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          Pragma: 'no-cache',
          'Accept-Ranges': 'none',
        });

        source.on('error', () => reply.raw.destroy());
        source.pipe(reply.raw);
      } catch (err) {
        request.log.error(err);
        const status = err instanceof AppError ? err.statusCode : 502;
        const message =
          err instanceof AppError
            ? err.message
            : 'Erro ao abrir o stream da rádio.';

        if (reply.raw.headersSent) {
          reply.raw.destroy();
          return;
        }

        reply.raw.writeHead(status, {
          'Content-Type': 'application/json; charset=utf-8',
        });
        reply.raw.end(JSON.stringify({ error: message }));
      }
    });
  };
}
