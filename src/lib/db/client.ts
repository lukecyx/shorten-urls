import { PrismaClient } from "../../generated/prisma/client";

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
export function getDb(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
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

// Initialize the client at module level for Lambda
export const db = getDb();
