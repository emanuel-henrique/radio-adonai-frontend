import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string('O nome é obrigatório.')
    .trim()
    .min(2, 'O nome deve ter no mínimo 2 caracteres.')
    .max(100, 'O nome deve ter no máximo 100 caracteres.'),
  email: z
    .string('O email é obrigatório.')
    .trim()
    .email('Formato de email inválido.')
    .toLowerCase(),
  password: z
    .string('A senha é obrigatória.')
    .min(6, 'A senha deve ter no mínimo 6 caracteres.')
    .max(100, 'A senha deve ter no máximo 100 caracteres.'),
});

export const loginSchema = z.object({
  email: z
    .string('O email é obrigatório.')
    .trim()
    .email('Formato de email inválido.')
    .toLowerCase(),
  password: z.string('A senha é obrigatória.').min(1, 'A senha é obrigatória.'),
});

export const googleAuthSchema = z.object({
  idToken: z
    .string('O token do Google é obrigatório.')
    .min(1, 'O token do Google é obrigatório.'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
