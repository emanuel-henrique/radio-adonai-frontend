import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware para validar o corpo da requisição usando schemas do Zod.
 * Garante que dados inválidos sejam rejeitados com status 400 e detalhes claros.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const parsed = schema.parse(request.body);
      request.body = parsed;
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));

        return reply.status(400).send({
          error: 'Dados inválidos.',
          details,
        });
      }

      return reply.status(400).send({ error: 'Erro de validação.' });
    }
  };
}
