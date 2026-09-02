import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let _db: PrismaClient | undefined;

export function getDb(): PrismaClient {
  if (!_db) {
    _db = globalForPrisma.prisma ?? new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });
    if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = _db;
  }
  return _db;
}

// Backward-compatible lazy export — connects only when first accessed at runtime
export const db = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return (getDb() as any)[prop];
  },
});
