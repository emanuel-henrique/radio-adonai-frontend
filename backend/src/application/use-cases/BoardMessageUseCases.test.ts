import { describe, it, expect, beforeEach } from 'vitest';
import {
  CreateBoardMessageUseCase,
  ListBoardMessagesUseCase,
} from './BoardMessageUseCases.js';
import { InMemoryBoardMessageRepository } from '../../test/in-memory-repositories.js';
import { AppError } from '../../domain/errors/AppError.js';

describe('BoardMessageUseCases', () => {
  let boardRepo: InMemoryBoardMessageRepository;

  beforeEach(() => {
    boardRepo = new InMemoryBoardMessageRepository();
  });

  it('deve criar uma mensagem no mural', async () => {
    const createUseCase = new CreateBoardMessageUseCase(boardRepo);

    const message = await createUseCase.execute({
      message: 'A paz do Senhor a todos os ouvintes da rádio!',
      userId: 'user-123',
    });

    expect(message.id).toBeDefined();
    expect(message.message).toBe(
      'A paz do Senhor a todos os ouvintes da rádio!',
    );
  });

  it('deve falhar se mensagem estiver vazia', async () => {
    const createUseCase = new CreateBoardMessageUseCase(boardRepo);

    await expect(
      createUseCase.execute({
        message: '',
        userId: 'user-123',
      }),
    ).rejects.toThrow(AppError);
  });

  it('deve listar mensagens aprovadas do mural', async () => {
    const createUseCase = new CreateBoardMessageUseCase(boardRepo);
    const listUseCase = new ListBoardMessagesUseCase(boardRepo);

    await createUseCase.execute({ message: 'Recado 1', userId: 'user-1' });
    await createUseCase.execute({ message: 'Recado 2', userId: 'user-2' });

    const list = await listUseCase.execute();
    expect(list).toHaveLength(2);
  });
});
