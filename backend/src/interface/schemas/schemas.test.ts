import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from './auth.schema.js';
import { createSongSchema } from './song.schema.js';
import { createPrayerSchema } from './prayer.schema.js';
import { createBoardSchema } from './board.schema.js';

describe('Zod Validation Schemas', () => {
  describe('registerSchema', () => {
    it('deve aprovar dados de registro válidos e normalizar email e trim', () => {
      const parsed = registerSchema.safeParse({
        name: '  João Adonai  ',
        email: '  JOAO@EXAMPLE.COM  ',
        password: 'password123',
      });

      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.name).toBe('João Adonai');
        expect(parsed.data.email).toBe('joao@example.com');
        expect(parsed.data.password).toBe('password123');
      }
    });

    it('deve rejeitar email com formato inválido', () => {
      const parsed = registerSchema.safeParse({
        name: 'João',
        email: 'email_invalido',
        password: 'password123',
      });

      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        const emailIssue = parsed.error.issues.find((i) => i.path.includes('email'));
        expect(emailIssue).toBeDefined();
      }
    });

    it('deve rejeitar senha com menos de 6 caracteres', () => {
      const parsed = registerSchema.safeParse({
        name: 'João',
        email: 'joao@example.com',
        password: '123',
      });

      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        const passIssue = parsed.error.issues.find((i) => i.path.includes('password'));
        expect(passIssue).toBeDefined();
        expect(passIssue?.message).toContain('6 caracteres');
      }
    });

    it('deve rejeitar nome com menos de 2 caracteres', () => {
      const parsed = registerSchema.safeParse({
        name: 'A',
        email: 'joao@example.com',
        password: 'password123',
      });

      expect(parsed.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('deve aprovar dados de login válidos', () => {
      const parsed = loginSchema.safeParse({
        email: 'joao@example.com',
        password: 'password123',
      });

      expect(parsed.success).toBe(true);
    });

    it('deve rejeitar quando email ou senha estiverem ausentes', () => {
      const parsed = loginSchema.safeParse({
        email: '',
        password: '',
      });

      expect(parsed.success).toBe(false);
    });
  });

  describe('createSongSchema', () => {
    it('deve aprovar música válida com e sem artista', () => {
      const withArtist = createSongSchema.safeParse({
        songName: 'Porque Ele Vive',
        artist: 'Harpa Cristã',
      });
      expect(withArtist.success).toBe(true);

      const withoutArtist = createSongSchema.safeParse({
        songName: 'Grandioso És Tu',
      });
      expect(withoutArtist.success).toBe(true);
    });

    it('deve rejeitar nome de música vazio', () => {
      const parsed = createSongSchema.safeParse({
        songName: '   ',
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe('createPrayerSchema', () => {
    it('deve aprovar pedido de oração válido', () => {
      const parsed = createPrayerSchema.safeParse({
        message: 'Por favor, orem pela saúde de minha família.',
      });
      expect(parsed.success).toBe(true);
    });

    it('deve rejeitar pedido de oração com menos de 3 caracteres', () => {
      const parsed = createPrayerSchema.safeParse({
        message: 'oi',
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe('createBoardSchema', () => {
    it('deve aprovar recado de mural válido', () => {
      const parsed = createBoardSchema.safeParse({
        message: 'Um abraço a todos da comunidade de fé!',
      });
      expect(parsed.success).toBe(true);
    });

    it('deve rejeitar recado com menos de 3 caracteres', () => {
      const parsed = createBoardSchema.safeParse({
        message: 'ok',
      });
      expect(parsed.success).toBe(false);
    });
  });
});
