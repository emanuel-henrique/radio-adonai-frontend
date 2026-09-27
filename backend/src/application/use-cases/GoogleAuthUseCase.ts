import { IUserRepository } from '../../domain/repositories/IUserRepository.js';
import { IGoogleAuthProvider } from '../../domain/providers/IGoogleAuthProvider.js';
import { AppError } from '../../domain/errors/AppError.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'radio-adonai-secret';

export interface GoogleAuthInput {
  idToken: string;
}

export interface GoogleAuthOutput {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  token: string;
}

/**
 * Use Case: Autenticação via Google OAuth.
 * Valida o token ID do Google, vincula a conta existente ou cria uma nova conta.
 */
export class GoogleAuthUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly googleAuthProvider: IGoogleAuthProvider,
  ) {}

  async execute(input: GoogleAuthInput): Promise<GoogleAuthOutput> {
    if (!input.idToken) {
      throw new AppError('O token do Google é obrigatório.', 400);
    }

    const googleUser = await this.googleAuthProvider.verifyIdToken(
      input.idToken,
    );

    // 1. Verificar se usuário já existe pelo googleId
    let user = await this.userRepository.findByGoogleId(googleUser.googleId);

    if (!user) {
      // 2. Verificar se já existe pelo e-mail
      const existingByEmail = await this.userRepository.findByEmail(
        googleUser.email,
      );

      if (existingByEmail) {
        // Vincula a conta Google ao usuário existente
        user = await this.userRepository.updateGoogleId(
          existingByEmail.id,
          googleUser.googleId,
          existingByEmail.avatarUrl || googleUser.avatarUrl,
        );
      } else {
        // Cria novo usuário via Google
        user = await this.userRepository.createWithGoogle({
          name: googleUser.name,
          email: googleUser.email,
          googleId: googleUser.googleId,
          avatarUrl: googleUser.avatarUrl,
        });
      }
    }

    // 3. Gerar token JWT da nossa aplicação
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
      token,
    };
  }
}
