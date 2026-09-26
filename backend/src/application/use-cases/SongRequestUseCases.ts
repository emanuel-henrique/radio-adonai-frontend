import { ISongRequestRepository } from '../../domain/repositories/ISongRequestRepository.js';
import { AppError } from './RegisterUserUseCase.js';

interface CreateSongInput {
  songName: string;
  artist?: string;
  userId: string;
}

/**
 * Use Case: Criar pedido de música.
 */
export class CreateSongRequestUseCase {
  constructor(private readonly songRepo: ISongRequestRepository) {}

  async execute(input: CreateSongInput) {
    if (!input.songName) {
      throw new AppError('Nome da música é obrigatório.', 400);
    }
    return this.songRepo.create(input);
  }
}

/**
 * Use Case: Listar pedidos de música.
 */
export class ListSongRequestsUseCase {
  constructor(private readonly songRepo: ISongRequestRepository) {}

  async execute(limit = 50) {
    return this.songRepo.findAll(limit);
  }
}
