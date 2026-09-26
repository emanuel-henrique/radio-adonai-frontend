import { SongRequest } from '../entities/SongRequest.js';

/**
 * Contrato do repositório de pedidos de música.
 */
export interface ISongRequestRepository {
  create(data: { songName: string; artist?: string; userId: string }): Promise<SongRequest>;
  findAll(limit: number): Promise<(SongRequest & { user: { name: string } })[]>;
}
