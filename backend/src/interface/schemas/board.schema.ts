import { z } from 'zod';

export const createBoardSchema = z.object({
  message: z
    .string('A mensagem do mural é obrigatória.')
    .trim()
    .min(3, 'A mensagem do mural deve ter no mínimo 3 caracteres.')
    .max(500, 'A mensagem do mural deve ter no máximo 500 caracteres.'),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
