import { BoardMessage } from '../entities/BoardMessage.js';

/**
 * Contrato do repositório de mural de recados.
 */
export interface IBoardMessageRepository {
  create(data: { message: string; userId: string }): Promise<BoardMessage>;
  findApproved(
    limit: number,
  ): Promise<(BoardMessage & { user: { name: string } })[]>;
}
