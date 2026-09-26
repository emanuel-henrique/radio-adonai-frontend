import { FastifyInstance } from 'fastify';
import { RegisterUserUseCase } from '../../application/use-cases/RegisterUserUseCase.js';
import { LoginUserUseCase } from '../../application/use-cases/LoginUserUseCase.js';
import { IUserRepository } from '../../domain/repositories/IUserRepository.js';
import { AppError } from '../../domain/errors/AppError.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema, RegisterInput, LoginInput } from '../schemas/auth.schema.js';

/**
 * Rotas de autenticação.
 * Camada de interface: cuida apenas de HTTP, validação com Zod e status codes.
 */
export function authRoutes(userRepository: IUserRepository) {
  const registerUseCase = new RegisterUserUseCase(userRepository);
  const loginUseCase = new LoginUserUseCase(userRepository);

  return async function (app: FastifyInstance) {
    app.post<{ Body: RegisterInput }>(
      '/auth/register',
      { preHandler: [validateBody(registerSchema)] },
      async (request, reply) => {
        try {
          const result = await registerUseCase.execute(request.body);
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

    app.post<{ Body: LoginInput }>(
      '/auth/login',
      { preHandler: [validateBody(loginSchema)] },
      async (request, reply) => {
        try {
          const result = await loginUseCase.execute(request.body);
          return reply.send(result);
        } catch (err) {
          if (err instanceof AppError) {
            return reply.status(err.statusCode).send({ error: err.message });
          }
          request.log.error(err);
          return reply.status(500).send({ error: 'Erro interno do servidor.' });
        }
      },
    );
  };
}
