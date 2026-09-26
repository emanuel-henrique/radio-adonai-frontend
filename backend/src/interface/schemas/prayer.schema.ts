import { z } from 'zod';

export const createPrayerSchema = z.object({
  message: z
    .string('A mensagem do pedido de oração é obrigatória.')
    .trim()
    .min(3, 'O pedido de oração deve ter no mínimo 3 caracteres.')
    .max(1000, 'O pedido de oração deve ter no máximo 1000 caracteres.'),
});

export type CreatePrayerInput = z.infer<typeof createPrayerSchema>;
