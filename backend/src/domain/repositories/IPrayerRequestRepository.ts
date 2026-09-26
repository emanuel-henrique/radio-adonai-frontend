import { PrayerRequest } from '../entities/PrayerRequest.js';

/**
 * Contrato do repositório de pedidos de oração.
 */
export interface IPrayerRequestRepository {
  create(data: { message: string; userId: string }): Promise<PrayerRequest>;
  findAll(limit: number): Promise<(PrayerRequest & { user: { name: string } })[]>;
}
