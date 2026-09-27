import { IUserRepository } from '../../domain/repositories/IUserRepository.js';
import { AppError } from './RegisterUserUseCase.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'radio-adonai-secret';

interface LoginInput {
  email: string;
  password: string;
}

interface AuthOutput {
  user: { id: string; name: string; email: string };
  token: string;
}

/**
 * Use Case: Login de usuário.
 */
export class LoginUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: LoginInput): Promise<AuthOutput> {
    if (!input.email || !input.password) {
      throw new AppError('Email e senha são obrigatórios.', 400);
    }

    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new AppError('Credenciais inválidas.', 401);
    }

    if (!user.passwordHash) {
      throw new AppError(
        'Esta conta usa login com Google. Entre com o Google.',
        401,
      );
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new AppError('Credenciais inválidas.', 401);
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return {
      user: { id: user.id, name: user.name, email: user.email },
      token,
    };
  }
}
