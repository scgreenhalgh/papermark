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

// Add middleware for error handling and connection cleanup
prisma.$extends({
  query: {
    $allOperations: async ({ args, query }) => {
      const maxRetries = 3;
      let retries = 0;

      while (true) {
        try {
          const result = await query(args);
          // Clean up prepared statements after each query in production/preview
          if (process.env.NODE_ENV !== 'development') {
            await prisma.$queryRaw`DEALLOCATE ALL`;
          }
          return result;
        } catch (error) {
          if (error instanceof Error && 
              error.message.includes('prepared statement') && 
              retries < maxRetries) {
            retries++;
            await new Promise(resolve => setTimeout(resolve, 100 * retries));
            await prisma.$disconnect();
            await prisma.$connect();
            continue;
          }
          throw error;
        }
      }
    }
  }
});

export default prisma;
