import { describe, it, expect, beforeEach } from 'vitest';
import { LoginUserUseCase } from './LoginUserUseCase.js';
import { InMemoryUserRepository } from '../../test/in-memory-repositories.js';
import { AppError } from '../../domain/errors/AppError.js';
import bcrypt from 'bcrypt';

describe('LoginUserUseCase', () => {
  let userRepo: InMemoryUserRepository;
  let useCase: LoginUserUseCase;

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository();
    useCase = new LoginUserUseCase(userRepo);

    // Cria usuário de teste
    const passwordHash = await bcrypt.hash('segredo123', 10);
    await userRepo.create({
      name: 'Maria Santos',
      email: 'maria@example.com',
      passwordHash,
    });
  });

  it('deve realizar login com credenciais corretas', async () => {
    const result = await useCase.execute({
      email: 'maria@example.com',
      password: 'segredo123',
    });

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('maria@example.com');
    expect(result.token).toBeDefined();
  });

  it('deve lançar erro 401 para senha incorreta', async () => {
    await expect(
      useCase.execute({
        email: 'maria@example.com',
        password: 'senha_errada',
      }),
    ).rejects.toThrow(AppError);
  });

  it('deve lançar erro 401 para email inexistente', async () => {
    await expect(
      useCase.execute({
        email: 'naoexiste@example.com',
        password: 'qualquersenha',
      }),
    ).rejects.toThrow(AppError);
  });
});
