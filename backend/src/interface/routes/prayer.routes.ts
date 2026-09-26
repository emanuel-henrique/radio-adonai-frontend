import { FastifyInstance } from 'fastify';
import { CreatePrayerRequestUseCase, ListPrayerRequestsUseCase } from '../../application/use-cases/PrayerRequestUseCases.js';
import { IPrayerRequestRepository } from '../../domain/repositories/IPrayerRequestRepository.js';
import { AppError } from '../../domain/errors/AppError.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createPrayerSchema, CreatePrayerInput } from '../schemas/prayer.schema.js';

/**
 * Rotas de pedidos de oração.
 * Validação com Zod e injeção de dependência.
 */
export function prayerRoutes(prayerRepo: IPrayerRequestRepository) {
  const createUseCase = new CreatePrayerRequestUseCase(prayerRepo);
  const listUseCase = new ListPrayerRequestsUseCase(prayerRepo);

  return async function (app: FastifyInstance) {
    app.post<{ Body: CreatePrayerInput }>(
      '/prayers',
      { preHandler: [authenticate, validateBody(createPrayerSchema)] },
      async (request, reply) => {
        try {
          const { message } = request.body;
          const userId = (request as any).user.userId;
          const result = await createUseCase.execute({ message, userId });
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

    app.get('/prayers', async (request, reply) => {
      try {
        const result = await listUseCase.execute();
        return reply.send(result);
      } catch (err) {
        request.log.error(err);
        return reply.status(500).send({ error: 'Erro ao buscar pedidos de oração.' });
      }
    });
  };
}
