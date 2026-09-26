import { z } from 'zod';

export const createSongSchema = z.object({
  songName: z
    .string('O nome da música é obrigatório.')
    .trim()
    .min(1, 'O nome da música é obrigatório.')
    .max(200, 'O nome da música deve ter no máximo 200 caracteres.'),
  artist: z
    .string()
    .trim()
    .max(200, 'O nome do artista deve ter no máximo 200 caracteres.')
    .optional(),
});

export type CreateSongInput = z.infer<typeof createSongSchema>;
