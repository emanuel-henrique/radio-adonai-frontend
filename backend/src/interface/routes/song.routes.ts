import { FastifyInstance } from 'fastify';
import {
  CreateSongRequestUseCase,
  ListSongRequestsUseCase,
} from '../../application/use-cases/SongRequestUseCases.js';
import { ISongRequestRepository } from '../../domain/repositories/ISongRequestRepository.js';
import { AppError } from '../../domain/errors/AppError.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createSongSchema, CreateSongInput } from '../schemas/song.schema.js';

/**
 * Rotas de pedidos de música.
 * Validação com Zod e injeção de dependência.
 */
export function songRoutes(songRepo: ISongRequestRepository) {
  const createUseCase = new CreateSongRequestUseCase(songRepo);
  const listUseCase = new ListSongRequestsUseCase(songRepo);

  return async function (app: FastifyInstance) {
    app.post<{ Body: CreateSongInput }>(
      '/songs',
      { preHandler: [authenticate, validateBody(createSongSchema)] },
      async (request, reply) => {
        try {
          const { songName, artist } = request.body;
          const userId = (request as any).user.userId;
          const result = await createUseCase.execute({
            songName,
            artist: artist || undefined,
            userId,
          });
          return reply.status(201).send(result);
        } catch (err) {
          if (err instanceof AppError) {
            return reply.status(err.statusCode).send({ error: err.message });
          }
          request.log.error(err);
          return reply.status(500).send({ error: 'Erro interno do servidor.' });
        }
      },
    );

    app.get('/songs', async (request, reply) => {
      try {
        const result = await listUseCase.execute();
        return reply.send(result);
      } catch (err) {
        request.log.error(err);
        return reply
          .status(500)
          .send({ error: 'Erro ao buscar pedidos de música.' });
      }
    });
  };
}
