// Prisma 7 configuration. The datasource URL lives here (not in schema.prisma),
// and .env is loaded explicitly via dotenv since Prisma 7 no longer auto-loads it.
import "dotenv/config"
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
})
