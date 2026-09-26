import { IBoardMessageRepository } from '../../domain/repositories/IBoardMessageRepository.js';
import { AppError } from './RegisterUserUseCase.js';

interface CreateBoardInput {
  message: string;
  userId: string;
}

/**
 * Use Case: Criar recado no mural.
 */
export class CreateBoardMessageUseCase {
  constructor(private readonly boardRepo: IBoardMessageRepository) {}

  async execute(input: CreateBoardInput) {
    if (!input.message) {
      throw new AppError('A mensagem é obrigatória.', 400);
    }
    return this.boardRepo.create(input);
  }
}

/**
 * Use Case: Listar recados aprovados.
 */
export class ListBoardMessagesUseCase {
  constructor(private readonly boardRepo: IBoardMessageRepository) {}

  async execute(limit = 50) {
    return this.boardRepo.findApproved(limit);
  }
}
