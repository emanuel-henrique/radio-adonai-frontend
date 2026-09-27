import { FastifyInstance } from 'fastify';
import {
  CreateBoardMessageUseCase,
  ListBoardMessagesUseCase,
} from '../../application/use-cases/BoardMessageUseCases.js';
import { IBoardMessageRepository } from '../../domain/repositories/IBoardMessageRepository.js';
import { AppError } from '../../domain/errors/AppError.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import {
  createBoardSchema,
  CreateBoardInput,
} from '../schemas/board.schema.js';

/**
 * Rotas do mural de recados.
 * Validação com Zod e injeção de dependência.
 */
export function boardRoutes(boardRepo: IBoardMessageRepository) {
  const createUseCase = new CreateBoardMessageUseCase(boardRepo);
  const listUseCase = new ListBoardMessagesUseCase(boardRepo);

  return async function (app: FastifyInstance) {
    app.post<{ Body: CreateBoardInput }>(
      '/board',
      { preHandler: [authenticate, validateBody(createBoardSchema)] },
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

    app.get('/board', async (request, reply) => {
      try {
        const result = await listUseCase.execute();
        return reply.send(result);
      } catch (err) {
        request.log.error(err);
        return reply
          .status(500)
          .send({ error: 'Erro ao buscar mensagens do mural.' });
      }
    });
  };
}
