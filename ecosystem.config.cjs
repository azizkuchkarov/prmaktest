/**
 * PM2 — loyiha papkasidan: pm2 start ecosystem.config.cjs
 * Yangilash: git pull && npm ci && npm run build && pm2 restart pmtest
 */
const path = require("path");

module.exports = {
  apps: [
    {
      name: "pmtest",
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
      // .env serverni o‘zi o‘qiydi (Next + Prisma); qo‘shimcha: PM2 da `env_file` yo‘q — o‘zgaruvchilarni shell / systemd da export qiling
    },
  ],
};
