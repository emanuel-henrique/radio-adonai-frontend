import { describe, it, expect, beforeEach } from 'vitest';
import { RegisterUserUseCase } from './RegisterUserUseCase.js';
import { InMemoryUserRepository } from '../../test/in-memory-repositories.js';
import { AppError } from '../../domain/errors/AppError.js';
import bcrypt from 'bcrypt';

describe('RegisterUserUseCase', () => {
  let userRepo: InMemoryUserRepository;
  let useCase: RegisterUserUseCase;

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    useCase = new RegisterUserUseCase(userRepo);
  });

  it('deve registrar um novo usuário com sucesso', async () => {
    const result = await useCase.execute({
      name: 'João Silva',
      email: 'joao@example.com',
      password: 'password123',
    });

    expect(result.user).toBeDefined();
    expect(result.user.name).toBe('João Silva');
    expect(result.user.email).toBe('joao@example.com');
    expect(result.token).toBeDefined();

    // Senha salva deve estar hasheada
    const saved = await userRepo.findByEmail('joao@example.com');
    expect(saved).not.toBeNull();
    const isPasswordHashed = await bcrypt.compare('password123', saved!.passwordHash);
    expect(isPasswordHashed).toBe(true);
  });

  it('deve lançar erro 409 ao tentar registrar email já existente', async () => {
    await useCase.execute({
      name: 'Primeiro',
      email: 'duplicado@example.com',
      password: 'password123',
    });

    await expect(
      useCase.execute({
        name: 'Segundo',
        email: 'duplicado@example.com',
        password: 'outrasenha123',
      }),
    ).rejects.toThrow(AppError);
  });

  it('deve lançar erro 400 se faltar campo obrigatório', async () => {
    await expect(
      useCase.execute({
        name: '',
        email: 'teste@example.com',
        password: '123',
      }),
    ).rejects.toThrow(AppError);
  });
});
