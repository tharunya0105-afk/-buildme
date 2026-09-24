import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let _client: PrismaClient | null = null;
let _dbUrl: string | null = null;

export function setupDatabase(): string {
  if (_dbUrl) return _dbUrl;

  const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NOW_REGION
  );

  // If a custom remote DATABASE_URL is provided (e.g. Postgres / Turso / remote), use it directly
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && !envUrl.startsWith("file:")) {
    _dbUrl = envUrl;
    return _dbUrl;
  }

  // If running in a serverless environment (Vercel, AWS Lambda) with SQLite:
  // The root filesystem is read-only (/var/task), but /tmp is writable.
  if (isServerless) {
    const tmpDir = process.env.TEMP || "/tmp";
    const targetDbPath = path.join(tmpDir, "dev.db");

    let needsCopy = true;
    try {
      if (fs.existsSync(targetDbPath) && fs.statSync(targetDbPath).size > 1000) {
        needsCopy = false;
      }
    } catch {
      needsCopy = true;
    }

    if (needsCopy) {
      const candidates = [
        path.join(process.cwd(), "prisma", "dev.db"),
        path.join("/var/task", "prisma", "dev.db"),
        path.join(process.cwd(), "dev.db"),
        path.join("/var/task", "dev.db"),
        path.join(__dirname, "prisma", "dev.db"),
        path.join(__dirname, "..", "prisma", "dev.db"),
        path.join(__dirname, "..", "..", "prisma", "dev.db"),
        path.join(__dirname, "..", "..", "..", "prisma", "dev.db"),
      ];

      let copied = false;
      for (const src of candidates) {
        try {
          if (fs.existsSync(/*turbopackIgnore: true*/ src) && fs.statSync(/*turbopackIgnore: true*/ src).size > 1000) {
            fs.copyFileSync(src, targetDbPath);
            try {
              fs.chmodSync(targetDbPath, 0o666);
            } catch {
              // chmod may not be needed or supported in all environments
            }
            console.log(`[db] Successfully initialized database from ${src} to ${targetDbPath} (${fs.statSync(targetDbPath).size} bytes)`);
            copied = true;
            break;
          }
        } catch (err) {
          console.error(`[db] Error checking/copying ${src}:`, err);
        }
      }

      if (!copied) {
        console.error("[db] Could not find source prisma/dev.db in any expected directory.");
      }
    }

    _dbUrl = `file:${targetDbPath}`;
    process.env.DATABASE_URL = _dbUrl;
    return _dbUrl;
  }

  // Local development: resolve prisma/dev.db
  const localPrismaDb = path.join(process.cwd(), "prisma", "dev.db");
  if (fs.existsSync(localPrismaDb)) {
    _dbUrl = `file:${localPrismaDb}`;
    process.env.DATABASE_URL = _dbUrl;
    return _dbUrl;
  }

  _dbUrl = envUrl || "file:./dev.db";
  process.env.DATABASE_URL = _dbUrl;
  return _dbUrl;
}

// Proactively run setupDatabase at module load time so process.env.DATABASE_URL is ready
try {
  setupDatabase();
} catch (e) {
  console.error("[db] Error in top-level setupDatabase:", e);
}

function getClient(): PrismaClient {
  if (_client) return _client;

  const dbUrl = setupDatabase();

  try {
    _client = globalForPrisma.prisma ?? new PrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
      log: process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    });
    if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = _client;
  } catch (err) {
    console.error("[db] Error initializing PrismaClient with custom URL, falling back to default:", err);
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
      const v = (c as unknown as Record<string | symbol, unknown>)[prop];
      return typeof v === "function" ? v.bind(c) : v;
    },
  }
);
