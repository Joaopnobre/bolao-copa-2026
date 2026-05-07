import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

async function createPrismaClient(): Promise<PrismaClient> {
  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";

  if (url.startsWith("file:") || url.startsWith("libsql:")) {
    // SQLite / LibSQL
    const { PrismaLibSql } = await import("@prisma/adapter-libsql");
    const adapter = new PrismaLibSql({ url });
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  } else {
    // PostgreSQL
    const { PrismaPg } = await import("@prisma/adapter-pg");
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: url });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }
}

// Synchronous factory — works for both SQLite and PostgreSQL
function createPrismaSync(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";

  if (url.startsWith("file:") || url.startsWith("libsql:")) {
    const { PrismaLibSql } = require("@prisma/adapter-libsql");
    const adapter = new PrismaLibSql({ url });
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  } else {
    const { PrismaPg } = require("@prisma/adapter-pg");
    const { Pool } = require("pg");
    const pool = new Pool({ connectionString: url });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaSync();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
