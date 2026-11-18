import { PrismaClient } from "@prisma/client";
import { databaseUrl } from "./database-url";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// In development, if new models (e.g. faq) were generated while next dev was running,
// ensure we don't hold onto a stale cached client missing those models.
if (process.env.NODE_ENV !== "production" && globalForPrisma.prisma && !("faq" in globalForPrisma.prisma)) {
  globalForPrisma.prisma = undefined;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: databaseUrl(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
