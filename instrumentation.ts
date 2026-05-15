/**
 * VPS / PM2: jarayon to‘xtaganda Prisma ulanishlarini yopish.
 * @see https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { registerNodeShutdownHooks } = await import("./instrumentation.node");
  registerNodeShutdownHooks();
}
