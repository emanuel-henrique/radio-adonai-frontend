import { User } from '../entities/User.js';

/**
 * Contrato do repositório de usuários.
 * Define o que a camada de domínio espera, sem saber como é implementado.
 * (Dependency Inversion Principle — D do SOLID)
 */
export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: { name: string; email: string; passwordHash: string }): Promise<User>;
}
