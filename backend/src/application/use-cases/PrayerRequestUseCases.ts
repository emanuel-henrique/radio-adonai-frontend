import { IPrayerRequestRepository } from '../../domain/repositories/IPrayerRequestRepository.js';
import { AppError } from './RegisterUserUseCase.js';

interface CreatePrayerInput {
  message: string;
  userId: string;
}

/**
 * Use Case: Criar pedido de oração.
 */
export class CreatePrayerRequestUseCase {
  constructor(private readonly prayerRepo: IPrayerRequestRepository) {}

  async execute(input: CreatePrayerInput) {
    if (!input.message) {
      throw new AppError('A mensagem é obrigatória.', 400);
    }
    return this.prayerRepo.create(input);
  }
}

/**
 * Use Case: Listar pedidos de oração.
 */
export class ListPrayerRequestsUseCase {
  constructor(private readonly prayerRepo: IPrayerRequestRepository) {}

  async execute(limit = 50) {
    return this.prayerRepo.findAll(limit);
  }
}
