import { ISongRequestRepository } from '../../domain/repositories/ISongRequestRepository.js';
import { SongRequest } from '../../domain/entities/SongRequest.js';
import { prisma } from '../prisma.js';

export class PrismaSongRequestRepository implements ISongRequestRepository {
  async create(data: { songName: string; artist?: string; userId: string }): Promise<SongRequest> {
    return prisma.songRequest.create({ data });
  }

  async findAll(limit: number): Promise<(SongRequest & { user: { name: string } })[]> {
    return prisma.songRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: { select: { name: true } } },
    });
  }
}
