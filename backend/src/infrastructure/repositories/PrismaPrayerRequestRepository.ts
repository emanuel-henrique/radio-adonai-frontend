import { IPrayerRequestRepository } from '../../domain/repositories/IPrayerRequestRepository.js';
import { PrayerRequest } from '../../domain/entities/PrayerRequest.js';
import { prisma } from '../prisma.js';

export class PrismaPrayerRequestRepository implements IPrayerRequestRepository {
  async create(data: { message: string; userId: string }): Promise<PrayerRequest> {
    return prisma.prayerRequest.create({ data });
  }

  async findAll(limit: number): Promise<(PrayerRequest & { user: { name: string } })[]> {
    return prisma.prayerRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: { select: { name: true } } },
    });
  }
}
