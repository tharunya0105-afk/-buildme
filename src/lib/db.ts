import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let _client: PrismaClient | null = null;

function getClient(): PrismaClient {
  if (_client) return _client;
  try {
    _client = globalForPrisma.prisma ?? new PrismaClient({
      log: process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    });
    if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = _client;
  } catch {
    _client = new PrismaClient();
  }
  return _client;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db: any = new Proxy(
  {},
  {
    get(_t, prop) {
      const c = getClient();
      const v = (c as Record<string | symbol, unknown>)[prop];
      return typeof v === "function" ? v.bind(c) : v;
    },
  }
);
