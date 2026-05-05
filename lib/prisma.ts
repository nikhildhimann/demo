import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const prismaClientSingleton = () => {
  const pool = new pg.Pool({ 
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.DATABASE_POOL_MAX || 10),
    connectionTimeoutMillis: Number(process.env.DATABASE_CONNECTION_TIMEOUT_MS || 30000),
    idleTimeoutMillis: Number(process.env.DATABASE_IDLE_TIMEOUT_MS || 10000),
    allowExitOnIdle: process.env.NODE_ENV !== "production",
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    transactionOptions: {
      maxWait: Number(process.env.PRISMA_TRANSACTION_MAX_WAIT_MS || 20000),
      timeout: Number(process.env.PRISMA_TRANSACTION_TIMEOUT_MS || 30000),
    },
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
