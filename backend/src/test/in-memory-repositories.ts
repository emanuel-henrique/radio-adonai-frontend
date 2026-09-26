import { IUserRepository } from '../domain/repositories/IUserRepository.js';
import { ISongRequestRepository } from '../domain/repositories/ISongRequestRepository.js';
import { IPrayerRequestRepository } from '../domain/repositories/IPrayerRequestRepository.js';
import { IBoardMessageRepository } from '../domain/repositories/IBoardMessageRepository.js';
import { User } from '../domain/entities/User.js';
import { SongRequest } from '../domain/entities/SongRequest.js';
import { PrayerRequest } from '../domain/entities/PrayerRequest.js';
import { BoardMessage } from '../domain/entities/BoardMessage.js';

export class InMemoryUserRepository implements IUserRepository {
  public users: User[] = [];

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((u) => u.id === id) || null;
  }

  async create(data: { name: string; email: string; passwordHash: string }): Promise<User> {
    const user: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    return user;
  }
}

export class InMemorySongRequestRepository implements ISongRequestRepository {
  public songs: (SongRequest & { user: { name: string } })[] = [];

  async create(data: { songName: string; artist?: string; userId: string }): Promise<SongRequest> {
    const song: SongRequest & { user: { name: string } } = {
      id: `song-${Date.now()}`,
      songName: data.songName,
      artist: data.artist || null,
      status: 'pending',
      userId: data.userId,
      createdAt: new Date(),
      user: { name: 'Test User' },
    };
    this.songs.unshift(song);
    return song;
  }

  async findAll(limit: number): Promise<(SongRequest & { user: { name: string } })[]> {
    return this.songs.slice(0, limit);
  }
}

export class InMemoryPrayerRequestRepository implements IPrayerRequestRepository {
  public prayers: (PrayerRequest & { user: { name: string } })[] = [];

  async create(data: { message: string; userId: string }): Promise<PrayerRequest> {
    const prayer: PrayerRequest & { user: { name: string } } = {
      id: `prayer-${Date.now()}`,
      message: data.message,
      status: 'pending',
      userId: data.userId,
      createdAt: new Date(),
      user: { name: 'Test User' },
    };
    this.prayers.unshift(prayer);
    return prayer;
  }

  async findAll(limit: number): Promise<(PrayerRequest & { user: { name: string } })[]> {
    return this.prayers.slice(0, limit);
  }
}

export class InMemoryBoardMessageRepository implements IBoardMessageRepository {
  public messages: (BoardMessage & { user: { name: string } })[] = [];

  async create(data: { message: string; userId: string }): Promise<BoardMessage> {
    const item: BoardMessage & { user: { name: string } } = {
      id: `board-${Date.now()}`,
      message: data.message,
      approved: true, // true para aparecer nas consultas de teste
      userId: data.userId,
      createdAt: new Date(),
      user: { name: 'Test User' },
    };
    this.messages.unshift(item);
    return item;
  }

  async findApproved(limit: number): Promise<(BoardMessage & { user: { name: string } })[]> {
    return this.messages.filter((m) => m.approved).slice(0, limit);
  }
}
