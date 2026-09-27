/**
 * Entidade de domínio: User.
 * Representa o modelo puro, sem dependência de framework ou ORM.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string | null;
  googleId: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
