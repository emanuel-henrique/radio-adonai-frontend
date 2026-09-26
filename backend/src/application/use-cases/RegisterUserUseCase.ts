import { IUserRepository } from '../../domain/repositories/IUserRepository.js';
import { AppError } from '../../domain/errors/AppError.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export { AppError };

const JWT_SECRET = process.env.JWT_SECRET || 'radio-adonai-secret';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface AuthOutput {
  user: { id: string; name: string; email: string };
  token: string;
}

/**
 * Use Case: Registrar um novo usuário.
 * Segue SRP (Responsabilidade Única) e DIP (Inversão de Dependência).
 */
export class RegisterUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: RegisterInput): Promise<AuthOutput> {
    if (!input.name || !input.email || !input.password) {
      throw new AppError('Nome, email e senha são obrigatórios.', 400);
    }

    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new AppError('Este email já está cadastrado.', 409);
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return {
      user: { id: user.id, name: user.name, email: user.email },
      token,
    };
  }
}
