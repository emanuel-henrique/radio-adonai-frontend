/**
 * Entidade de domínio: BoardMessage.
 */
export interface BoardMessage {
  id: string;
  message: string;
  approved: boolean;
  userId: string;
  createdAt: Date;
}
