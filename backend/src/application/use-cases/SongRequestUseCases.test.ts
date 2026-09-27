import { describe, it, expect, beforeEach } from 'vitest';
import {
  CreateSongRequestUseCase,
  ListSongRequestsUseCase,
} from './SongRequestUseCases.js';
import { InMemorySongRequestRepository } from '../../test/in-memory-repositories.js';
import { AppError } from '../../domain/errors/AppError.js';

describe('SongRequestUseCases', () => {
  let songRepo: InMemorySongRequestRepository;

  beforeEach(() => {
    songRepo = new InMemorySongRequestRepository();
  });

  it('deve criar um pedido de música com sucesso', async () => {
    const createUseCase = new CreateSongRequestUseCase(songRepo);

    const song = await createUseCase.execute({
      songName: 'Porque Ele Vive',
      artist: 'Harpa Cristã',
      userId: 'user-123',
    });

    expect(song.id).toBeDefined();
    expect(song.songName).toBe('Porque Ele Vive');
    expect(song.artist).toBe('Harpa Cristã');
    expect(song.status).toBe('pending');
  });

  it('deve falhar se nome da música estiver vazio', async () => {
    const createUseCase = new CreateSongRequestUseCase(songRepo);

    await expect(
      createUseCase.execute({
        songName: '',
        userId: 'user-123',
      }),
    ).rejects.toThrow(AppError);
  });

  it('deve listar pedidos de música', async () => {
    const createUseCase = new CreateSongRequestUseCase(songRepo);
    const listUseCase = new ListSongRequestsUseCase(songRepo);

    await createUseCase.execute({ songName: 'Música 1', userId: 'user-1' });
    await createUseCase.execute({ songName: 'Música 2', userId: 'user-2' });

    const list = await listUseCase.execute();
    expect(list).toHaveLength(2);
  });
});
