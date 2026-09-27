import { describe, it, expect, beforeEach } from 'vitest';
import {
  CreatePrayerRequestUseCase,
  ListPrayerRequestsUseCase,
} from './PrayerRequestUseCases.js';
import { InMemoryPrayerRequestRepository } from '../../test/in-memory-repositories.js';
import { AppError } from '../../domain/errors/AppError.js';

describe('PrayerRequestUseCases', () => {
  let prayerRepo: InMemoryPrayerRequestRepository;

  beforeEach(() => {
    prayerRepo = new InMemoryPrayerRequestRepository();
  });

  it('deve criar um pedido de oração', async () => {
    const createUseCase = new CreatePrayerRequestUseCase(prayerRepo);

    const prayer = await createUseCase.execute({
      message: 'Oração pela família e pela igreja.',
      userId: 'user-123',
    });

    expect(prayer.id).toBeDefined();
    expect(prayer.message).toBe('Oração pela família e pela igreja.');
    expect(prayer.status).toBe('pending');
  });

  it('deve falhar se mensagem estiver vazia', async () => {
    const createUseCase = new CreatePrayerRequestUseCase(prayerRepo);

    await expect(
      createUseCase.execute({
        message: '',
        userId: 'user-123',
      }),
    ).rejects.toThrow(AppError);
  });

  it('deve listar pedidos de oração', async () => {
    const createUseCase = new CreatePrayerRequestUseCase(prayerRepo);
    const listUseCase = new ListPrayerRequestsUseCase(prayerRepo);

    await createUseCase.execute({ message: 'Oração 1', userId: 'user-1' });
    await createUseCase.execute({ message: 'Oração 2', userId: 'user-2' });

    const list = await listUseCase.execute();
    expect(list).toHaveLength(2);
  });
});
