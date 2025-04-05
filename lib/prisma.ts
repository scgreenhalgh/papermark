import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient({
  log: ['query', 'error', 'warn'],
  datasources: {
    db: {
      url: process.env.POSTGRES_PRISMA_URL + "&connection_limit=5&pgbouncer=true&statement_cache_size=0"
    }
  }
});

if (process.env.NODE_ENV === "development") global.prisma = prisma;

export default prisma;
