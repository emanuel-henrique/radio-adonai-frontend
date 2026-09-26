import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client.js';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

// Configura WebSocket no ambiente Node.js para o driver Neon Serverless
neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

let prismaInstance: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (prismaInstance) return prismaInstance;
  if (globalForPrisma.prisma) {
    prismaInstance = globalForPrisma.prisma;
    return prismaInstance;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('A variável de ambiente DATABASE_URL não foi definida.');
  }

  const adapter = new PrismaNeon({ connectionString });

  prismaInstance = new PrismaClient({ adapter: adapter as any });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaInstance;
  }

  return prismaInstance;
}

/**
 * Instância lazy do Prisma Client conectada ao Neon PostgreSQL.
 * Só inicializa a conexão quando a primeira query ao banco for executada.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
