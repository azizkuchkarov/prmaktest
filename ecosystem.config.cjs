/**
 * PM2 — loyiha ildizidan: pm2 start ecosystem.config.cjs
 * Sayt: prmaktest | Bot: prmaktest-bot
 *
 * Yangilash: git pull && npm ci && npx prisma migrate deploy && npm run build
 *            pm2 restart prmaktest && pm2 restart prmaktest-bot
 */
const path = require("path");

module.exports = {
  apps: [
    {
      name: "prmaktest",
      cwd: __dirname,
      script: path.join(__dirname, "node_modules", "next", "dist", "bin", "next"),
      args: "start",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "800M",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
    {
      name: "prmaktest-bot",
      cwd: __dirname,
      script: "npm",
      args: "run bot:link",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "200M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
