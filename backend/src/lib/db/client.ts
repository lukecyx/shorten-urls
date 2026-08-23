import { env } from "~/config";
import { fetchSecret } from "~/services/utils";
import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Prisma Client singleton for Lambda environments.
 *
 * The client is initialized at module level (outside the handler)
 * so it persists across warm Lambda invocations, avoiding new
 * connection overhead on every request.
 *
 * Connection pooling configuration should be set in DATABASE_URL:
 * postgresql://user:pass@host:5432/db?connection_limit=5&pool_timeout=10
 */

// Global variable to store the client instance
let prisma: PrismaClient | null = null;

/**
 * Get or create the singleton Prisma Client instance.
 *
 * @returns PrismaClient instance
 */
export async function getDb(): Promise<PrismaClient> {
  if (!prisma) {
    const DB_URL =
      env.databaseUrl ?? (await fetchSecret(process.env.DB_SECRET_ARN!));
    const adapter = new PrismaPg({
      connectionString: DB_URL,
    });

    prisma = new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });
  }
  return prisma;
}

/**
 * Disconnect from the database.
 * Useful for cleanup in tests or graceful shutdown.
 */
export async function disconnectDb(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}
