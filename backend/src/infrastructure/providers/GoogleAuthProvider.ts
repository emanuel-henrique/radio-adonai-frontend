import { OAuth2Client } from 'google-auth-library';
import {
  IGoogleAuthProvider,
  GoogleUserData,
} from '../../domain/providers/IGoogleAuthProvider.js';
import { AppError } from '../../domain/errors/AppError.js';

export class GoogleAuthProvider implements IGoogleAuthProvider {
  private client: OAuth2Client;
  private clientId: string | undefined;

  constructor(clientId?: string) {
    this.clientId = clientId || process.env.GOOGLE_CLIENT_ID;
    this.client = new OAuth2Client(this.clientId);
  }

  async verifyIdToken(idToken: string): Promise<GoogleUserData> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.clientId || undefined,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.sub || !payload.email) {
        throw new AppError(
          'Token do Google inválido ou sem dados suficientes.',
          401,
        );
      }

      return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        avatarUrl: payload.picture || null,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Falha ao autenticar com o Google.', 401);
    }
  }
}
