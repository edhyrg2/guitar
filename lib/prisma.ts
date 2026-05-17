import { PrismaClient } from "@prisma/client";
import type { SqlMigrationAwareDriverAdapterFactory } from "@prisma/driver-adapter-utils";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient | null;
};

const importModule = new Function(
  "specifier",
  "return import(specifier)"
) as <T>(specifier: string) => Promise<T>;

async function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    return null;
  }

  try {
    const { PrismaPg } = await importModule<{
      PrismaPg: new (config: { connectionString: string }) => SqlMigrationAwareDriverAdapterFactory;
    }>("@prisma/adapter-pg");

    return new PrismaClient({
      adapter: new PrismaPg({ connectionString }),
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  } catch {
    return null;
  }
}

export async function getPrismaClient() {
  if (globalForPrisma.prisma !== undefined) {
    return globalForPrisma.prisma;
  }

  const prisma = await createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
  }

  return prisma;
}
