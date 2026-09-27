import { describe, it, expect, beforeEach } from 'vitest';
import { GoogleAuthUseCase } from './GoogleAuthUseCase.js';
import { InMemoryUserRepository } from '../../test/in-memory-repositories.js';
import {
  IGoogleAuthProvider,
  GoogleUserData,
} from '../../domain/providers/IGoogleAuthProvider.js';
import { AppError } from '../../domain/errors/AppError.js';

class MockGoogleAuthProvider implements IGoogleAuthProvider {
  public mockUser: GoogleUserData = {
    googleId: 'google-12345',
    email: 'irmao@adonai.com',
    name: 'Irmão Adonai',
    avatarUrl: 'https://lh3.googleusercontent.com/photo.jpg',
  };

  public shouldFail = false;

  async verifyIdToken(_idToken: string): Promise<GoogleUserData> {
    if (this.shouldFail) {
      throw new AppError('Falha ao autenticar com o Google.', 401);
    }
    return this.mockUser;
  }
}

describe('GoogleAuthUseCase', () => {
  let userRepo: InMemoryUserRepository;
  let googleProvider: MockGoogleAuthProvider;
  let useCase: GoogleAuthUseCase;

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    googleProvider = new MockGoogleAuthProvider();
    useCase = new GoogleAuthUseCase(userRepo, googleProvider);
  });

  it('deve autenticar e criar um novo usuário via Google quando a conta não existe', async () => {
    const result = await useCase.execute({ idToken: 'valid-google-token' });

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('irmao@adonai.com');
    expect(result.user.name).toBe('Irmão Adonai');
    expect(result.user.avatarUrl).toBe(
      'https://lh3.googleusercontent.com/photo.jpg',
    );
    expect(result.token).toBeDefined();

    const saved = await userRepo.findByEmail('irmao@adonai.com');
    expect(saved).not.toBeNull();
    expect(saved?.googleId).toBe('google-12345');
    expect(saved?.passwordHash).toBeNull();
  });

  it('deve vincular googleId quando já existe usuário com o mesmo e-mail', async () => {
    // Usuário pré-existente cadastrado por senha
    await userRepo.create({
      name: 'Irmão Antigo',
      email: 'irmao@adonai.com',
      passwordHash: 'hash-existente',
    });

    const result = await useCase.execute({ idToken: 'valid-google-token' });

    expect(result.user.email).toBe('irmao@adonai.com');
    expect(result.token).toBeDefined();

    const updated = await userRepo.findByEmail('irmao@adonai.com');
    expect(updated?.googleId).toBe('google-12345');
    // Senha antiga deve ser preservada
    expect(updated?.passwordHash).toBe('hash-existente');
  });

  it('deve autenticar usuário já vinculado pelo googleId', async () => {
    // Cria usuário já vinculado
    await userRepo.createWithGoogle({
      name: 'Irmão Adonai',
      email: 'irmao@adonai.com',
      googleId: 'google-12345',
      avatarUrl: 'https://lh3.googleusercontent.com/photo.jpg',
    });

    const result = await useCase.execute({ idToken: 'valid-google-token' });

    expect(result.user.email).toBe('irmao@adonai.com');
    expect(result.token).toBeDefined();
  });

  it('deve lançar erro 400 se idToken não for fornecido', async () => {
    await expect(useCase.execute({ idToken: '' })).rejects.toThrow(AppError);
  });

  it('deve propagar erro 401 se a validação do Google falhar', async () => {
    googleProvider.shouldFail = true;
    await expect(useCase.execute({ idToken: 'invalid-token' })).rejects.toThrow(
      AppError,
    );
  });
});
