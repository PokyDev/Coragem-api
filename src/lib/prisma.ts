import { PrismaClient } from '@prisma/client';
import { config } from './config';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: config.server.nodeEnv === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });

if (config.server.nodeEnv !== 'production') {
  globalForPrisma.prisma = prisma;
}