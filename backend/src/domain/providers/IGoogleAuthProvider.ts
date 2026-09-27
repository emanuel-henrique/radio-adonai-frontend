export interface GoogleUserData {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}

/**
 * Contrato para verificação de autenticação com o Google.
 * DIP: Casos de uso dependem desta interface, facilitando mocks em testes.
 */
export interface IGoogleAuthProvider {
  verifyIdToken(idToken: string): Promise<GoogleUserData>;
}
