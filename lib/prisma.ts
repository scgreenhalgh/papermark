import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

// Create a new PrismaClient instance with connection pooling configuration
const prisma = global.prisma || new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: process.env.POSTGRES_PRISMA_URL,
    },
  },
  // Add connection pooling configuration
  __internal: {
    engine: {
      connectionLimit: 5,
      connectionTimeout: 10000,
      pool: {
        min: 2,
        max: 10,
        idleTimeoutMillis: 30000,
      },
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

// Add error handling for connection issues with retry logic
prisma.$use(async (params, next) => {
  const maxRetries = 3;
  let retries = 0;

  while (true) {
    try {
      return await next(params);
    } catch (error) {
      if (error instanceof Error && 
          error.message.includes('prepared statement') && 
          retries < maxRetries) {
        retries++;
        // Wait for a short time before retrying
        await new Promise(resolve => setTimeout(resolve, 100 * retries));
        // Disconnect and reconnect
        await prisma.$disconnect();
        await prisma.$connect();
        continue;
      }
      throw error;
    }
  }
});

// Add a middleware to handle connection cleanup after each query
prisma.$use(async (params, next) => {
  const result = await next(params);
  // Clean up any prepared statements after each query
  if (process.env.NODE_ENV === 'production') {
    await prisma.$queryRaw`DEALLOCATE ALL`;
  }
  return result;
});

export default prisma;
