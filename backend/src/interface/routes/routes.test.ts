import { describe, it, expect, beforeEach } from 'vitest';
import { buildApp } from '../../app.js';
import {
  InMemoryUserRepository,
  InMemorySongRequestRepository,
  InMemoryPrayerRequestRepository,
  InMemoryBoardMessageRepository,
} from '../../test/in-memory-repositories.js';
import { FastifyInstance } from 'fastify';
import { AppError } from '../../domain/errors/AppError.js';
import {
  IGoogleAuthProvider,
  GoogleUserData,
} from '../../domain/providers/IGoogleAuthProvider.js';

class FakeGoogleAuthProvider implements IGoogleAuthProvider {
  public user: GoogleUserData = {
    googleId: 'google-abc-123',
    email: 'novo@adonai.com',
    name: 'Irmão Google',
    avatarUrl: 'https://lh3.googleusercontent.com/photo.jpg',
  };

  public shouldFail = false;

  async verifyIdToken(_idToken: string): Promise<GoogleUserData> {
    if (this.shouldFail) {
      throw new AppError('Falha ao autenticar com o Google.', 401);
    }
    return this.user;
  }
}

describe('API Routes Integration Tests (with Zod & Clean Architecture)', () => {
  let app: FastifyInstance;
  let userRepo: InMemoryUserRepository;
  let songRepo: InMemorySongRequestRepository;
  let prayerRepo: InMemoryPrayerRequestRepository;
  let boardRepo: InMemoryBoardMessageRepository;
  let googleProvider: FakeGoogleAuthProvider;
  let authToken: string;

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository();
    songRepo = new InMemorySongRequestRepository();
    prayerRepo = new InMemoryPrayerRequestRepository();
    boardRepo = new InMemoryBoardMessageRepository();
    googleProvider = new FakeGoogleAuthProvider();

    app = buildApp({
      userRepository: userRepo,
      songRepository: songRepo,
      prayerRepository: prayerRepo,
      boardRepository: boardRepo,
      googleAuthProvider: googleProvider,
      logger: false,
    });

    await app.ready();

    // Registrar um usuário padrão para obter token JWT
    const registerRes = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        name: 'Usuário Teste',
        email: 'teste@adonai.com',
        password: 'senhaSegura123',
      },
    });

    const body = JSON.parse(registerRes.payload);
    authToken = body.token;
  });

  describe('POST /auth/register', () => {
    it('deve registrar com sucesso (201) e retornar usuário e token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          name: 'Novo Membro',
          email: 'novo@adonai.com',
          password: 'senhaForte123',
        },
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.payload);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('novo@adonai.com');
      expect(data.token).toBeDefined();
    });

    it('deve retornar 400 com detalhes ao falhar na validação do Zod (email inválido)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          name: 'Nome Válido',
          email: 'email_invalido_sem_arroba',
          password: 'senhaForte123',
        },
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      expect(data.error).toBe('Dados inválidos.');
      expect(data.details).toBeInstanceOf(Array);
      expect(data.details.some((d: any) => d.field === 'email')).toBe(true);
    });

    it('deve retornar 400 com detalhes ao passar senha muito curta (<6)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          name: 'Nome Válido',
          email: 'valido@adonai.com',
          password: '123',
        },
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      expect(data.details.some((d: any) => d.field === 'password')).toBe(true);
    });

    it('deve retornar 409 Conflict se email já estiver registrado', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          name: 'Outro Nome',
          email: 'teste@adonai.com', // Já criado no beforeEach
          password: 'outraSenha123',
        },
      });

      expect(response.statusCode).toBe(409);
      const data = JSON.parse(response.payload);
      expect(data.error).toBe('Este email já está cadastrado.');
    });
  });

  describe('POST /auth/login', () => {
    it('deve realizar login com sucesso (200) com credenciais corretas', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'teste@adonai.com',
          password: 'senhaSegura123',
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.token).toBeDefined();
      expect(data.user.email).toBe('teste@adonai.com');
    });

    it('deve retornar 401 para senha incorreta', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'teste@adonai.com',
          password: 'senhaErrada',
        },
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.payload);
      expect(data.error).toBe('Credenciais inválidas.');
    });

    it('deve retornar 400 se campos forem omitidos (validação Zod)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      expect(data.error).toBe('Dados inválidos.');
    });
  });

  describe('POST /auth/google', () => {
    it('deve autenticar com Google e criar o usuário (200)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/google',
        payload: { idToken: 'google-id-token-valido' },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.token).toBeDefined();
      expect(data.user.email).toBe('novo@adonai.com');
      expect(data.user.avatarUrl).toBe(
        'https://lh3.googleusercontent.com/photo.jpg',
      );

      const saved = await userRepo.findByGoogleId('google-abc-123');
      expect(saved?.email).toBe('novo@adonai.com');
    });

    it('deve vincular a conta Google ao usuário já cadastrado por senha', async () => {
      googleProvider.user.email = 'teste@adonai.com';

      const response = await app.inject({
        method: 'POST',
        url: '/auth/google',
        payload: { idToken: 'google-id-token-valido' },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.user.email).toBe('teste@adonai.com');

      const linked = await userRepo.findByEmail('teste@adonai.com');
      expect(linked?.googleId).toBe('google-abc-123');
      expect(linked?.passwordHash).not.toBeNull();
    });

    it('deve retornar 400 se idToken não for enviado (validação Zod)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/google',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      expect(data.error).toBe('Dados inválidos.');
      expect(data.details.some((d: any) => d.field === 'idToken')).toBe(true);
    });

    it('deve retornar 401 se o token do Google for inválido', async () => {
      googleProvider.shouldFail = true;

      const response = await app.inject({
        method: 'POST',
        url: '/auth/google',
        payload: { idToken: 'token-invalido' },
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.payload);
      expect(data.error).toBe('Falha ao autenticar com o Google.');
    });
  });

  describe('Rotas de Músicas (/songs)', () => {
    it('deve rejeitar POST /songs com 401 se não enviar token de autenticação', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/songs',
        payload: { songName: 'Alvo Mais Que a Neve' },
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.payload);
      expect(data.error).toBe('Token de autenticação não fornecido.');
    });

    it('deve rejeitar POST /songs com 400 se campo songName for omitido (Zod)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/songs',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { artist: 'Cantor X' },
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      expect(data.error).toBe('Dados inválidos.');
      expect(data.details.some((d: any) => d.field === 'songName')).toBe(true);
    });

    it('deve criar pedido de música com sucesso (201) quando autenticado e válido', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/songs',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          songName: 'Alvo Mais Que a Neve',
          artist: 'Harpa Cristã',
        },
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.payload);
      expect(data.songName).toBe('Alvo Mais Que a Neve');
      expect(data.artist).toBe('Harpa Cristã');
    });

    it('deve listar pedidos de música em GET /songs (200)', async () => {
      // Cria uma música primeiro
      await app.inject({
        method: 'POST',
        url: '/songs',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { songName: 'Música 1' },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/songs',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data).toBeInstanceOf(Array);
      expect(data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Rotas de Oração (/prayers)', () => {
    it('deve rejeitar POST /prayers sem autenticação (401)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/prayers',
        payload: { message: 'Orem pela minha saúde' },
      });

      expect(response.statusCode).toBe(401);
    });

    it('deve rejeitar POST /prayers com mensagem menor que 3 caracteres (400 - Zod)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/prayers',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { message: 'oi' },
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      expect(data.details.some((d: any) => d.field === 'message')).toBe(true);
    });

    it('deve criar pedido de oração com sucesso (201)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/prayers',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { message: 'Orem pelo nosso pastor e ministério de louvor.' },
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.payload);
      expect(data.message).toBe(
        'Orem pelo nosso pastor e ministério de louvor.',
      );
    });

    it('deve listar pedidos de oração em GET /prayers (200)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/prayers',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data).toBeInstanceOf(Array);
    });
  });

  describe('Rotas do Mural (/board)', () => {
    it('deve rejeitar POST /board sem autenticação (401)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/board',
        payload: { message: 'Recado para o mural' },
      });

      expect(response.statusCode).toBe(401);
    });

    it('deve rejeitar POST /board com mensagem inválida (400 - Zod)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/board',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { message: '' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('deve criar recado no mural com sucesso (201)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/board',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { message: 'Culto de jovens neste sábado às 19h! Não perca!' },
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.payload);
      expect(data.message).toBe(
        'Culto de jovens neste sábado às 19h! Não perca!',
      );
    });

    it('deve listar recados do mural em GET /board (200)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/board',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data).toBeInstanceOf(Array);
    });
  });
});
