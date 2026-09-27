import { IUserRepository } from '../../domain/repositories/IUserRepository.js';
import { User } from '../../domain/entities/User.js';
import { prisma } from '../prisma.js';

/**
 * Implementação concreta do IUserRepository usando Prisma.
 * O Prisma só é conhecido aqui, na camada de infraestrutura.
 */
export class PrismaUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { googleId } });
  }

  async create(data: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<User> {
    return prisma.user.create({ data });
  }

  async createWithGoogle(data: {
    name: string;
    email: string;
    googleId: string;
    avatarUrl?: string | null;
  }): Promise<User> {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        googleId: data.googleId,
        avatarUrl: data.avatarUrl || null,
      },
    });
  }

  async updateGoogleId(
    id: string,
    googleId: string,
    avatarUrl?: string | null,
  ): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        googleId,
        ...(avatarUrl ? { avatarUrl } : {}),
      },
    });
  }
}
