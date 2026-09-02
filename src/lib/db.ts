import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let _db: PrismaClient | undefined;

function getOrCreateClient(): PrismaClient {
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

// Lazy proxy: db.user.findUnique({}) → getOrCreateClient().user.findUnique({})
// Nothing happens at import time — connection opens on first real query.
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getOrCreateClient();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
