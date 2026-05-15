import { prisma } from "@/lib/prisma";

async function graceful() {
  try {
    await prisma.$disconnect();
  } catch {
    /* ignore */
  }
}

export function registerNodeShutdownHooks(): void {
  process.once("SIGINT", graceful);
  process.once("SIGTERM", graceful);
}
