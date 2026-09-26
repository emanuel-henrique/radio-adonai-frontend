import 'dotenv/config';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { authRoutes } from './interface/routes/auth.routes.js';
import { songRoutes } from './interface/routes/song.routes.js';
import { prayerRoutes } from './interface/routes/prayer.routes.js';
import { boardRoutes } from './interface/routes/board.routes.js';
import { IUserRepository } from './domain/repositories/IUserRepository.js';
import { ISongRequestRepository } from './domain/repositories/ISongRequestRepository.js';
import { IPrayerRequestRepository } from './domain/repositories/IPrayerRequestRepository.js';
import { IBoardMessageRepository } from './domain/repositories/IBoardMessageRepository.js';
import { PrismaUserRepository } from './infrastructure/repositories/PrismaUserRepository.js';
import { PrismaSongRequestRepository } from './infrastructure/repositories/PrismaSongRequestRepository.js';
import { PrismaPrayerRequestRepository } from './infrastructure/repositories/PrismaPrayerRequestRepository.js';
import { PrismaBoardMessageRepository } from './infrastructure/repositories/PrismaBoardMessageRepository.js';

export interface AppDependencies {
  userRepository?: IUserRepository;
  songRepository?: ISongRequestRepository;
  prayerRepository?: IPrayerRequestRepository;
  boardRepository?: IBoardMessageRepository;
  logger?: boolean;
}

/**
 * Cria e configura a instância da aplicação Fastify.
 *
 * Segue Clean Architecture e Princípios SOLID (especialmente DIP - Inversão de Dependência):
 * As rotas recebem seus contratos de repositório via Injeção de Dependência.
 * Em produção, utiliza repositórios do Prisma.
 * Em testes, permite injetar implementações em memória sem depender de banco de dados.
 */
export function buildApp(dependencies?: AppDependencies): FastifyInstance {
  const app = Fastify({
    logger: dependencies?.logger ?? false,
  });

  // CORS — permite o frontend acessar a API
  app.register(cors, {
    origin: [
      'http://localhost:3000',
      /\.vercel\.app$/, // Qualquer subdomínio da Vercel
    ],
    credentials: true,
  });

  // Rota de health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Resolver dependências dos repositórios
  const userRepo = dependencies?.userRepository ?? new PrismaUserRepository();
  const songRepo = dependencies?.songRepository ?? new PrismaSongRequestRepository();
  const prayerRepo = dependencies?.prayerRepository ?? new PrismaPrayerRequestRepository();
  const boardRepo = dependencies?.boardRepository ?? new PrismaBoardMessageRepository();

  // Registrar rotas conectando os casos de uso aos repositórios
  app.register(authRoutes(userRepo));
  app.register(songRoutes(songRepo));
  app.register(prayerRoutes(prayerRepo));
  app.register(boardRoutes(boardRepo));

  return app;
}
