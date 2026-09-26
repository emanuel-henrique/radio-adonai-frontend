/**
 * Entidade de domínio: SongRequest.
 */
export interface SongRequest {
  id: string;
  songName: string;
  artist: string | null;
  status: string;
  userId: string;
  createdAt: Date;
}
