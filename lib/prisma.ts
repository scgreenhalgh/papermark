import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: process.env.POSTGRES_PRISMA_URL,
    },
  },
});

// Ensure proper cleanup on serverless function termination
if (process.env.NODE_ENV === "development") {
  global.prisma = prisma;
} else {
  // In production, ensure we clean up connections
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

// Add error handling for connection issues
prisma.$use(async (params, next) => {
  try {
    return await next(params);
  } catch (error) {
    if (error instanceof Error && error.message.includes('prepared statement')) {
      // If we get a prepared statement error, try to reconnect
      await prisma.$disconnect();
      await prisma.$connect();
      return await next(params);
    }
    throw error;
  }
});

export default prisma;
