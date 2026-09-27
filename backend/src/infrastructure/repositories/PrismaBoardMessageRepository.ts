import { IBoardMessageRepository } from '../../domain/repositories/IBoardMessageRepository.js';
import { BoardMessage } from '../../domain/entities/BoardMessage.js';
import { prisma } from '../prisma.js';

export class PrismaBoardMessageRepository implements IBoardMessageRepository {
  async create(data: {
    message: string;
    userId: string;
  }): Promise<BoardMessage> {
    return prisma.boardMessage.create({ data });
  }

  async findApproved(
    limit: number,
  ): Promise<(BoardMessage & { user: { name: string } })[]> {
    return prisma.boardMessage.findMany({
      where: { approved: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: { select: { name: true } } },
    });
  }
}
