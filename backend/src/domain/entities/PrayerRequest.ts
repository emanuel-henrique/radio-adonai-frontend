/**
 * Entidade de domínio: PrayerRequest.
 */
export interface PrayerRequest {
  id: string;
  message: string;
  status: string;
  userId: string;
  createdAt: Date;
}
