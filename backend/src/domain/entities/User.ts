/**
 * Entidade de domínio: User.
 * Representa o modelo puro, sem dependência de framework ou ORM.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}
