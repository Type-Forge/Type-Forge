import "server-only"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@/generated/prisma"

// Prisma 7 uses the query compiler, so a driver adapter is required at runtime.
// PrismaPg (node-postgres) is wire-compatible with standard Postgres AND Aurora
// PostgreSQL — switching to Aurora is only a DATABASE_URL change.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Add it to your .env file.")
  }
  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({ adapter })
}

// Reuse a single client across hot-reloads in development to avoid exhausting connections.
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
