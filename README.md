# Prezident test platformasi (Next.js + PostgreSQL + Prisma)

O‘quvchi kabineti, admin panel, CLICK to‘lovi, Telegram, reyting.

## Lokal ishga tushirish

```bash
npm install
cp .env.example .env
# DATABASE_URL va maxfiy kalitlarni to‘ldiring
npx prisma migrate dev
npm run dev
```

Brauzer: [http://localhost:3000](http://localhost:3000)

## Skriptlar

| Skript | Vazifasi |
|--------|----------|
| `npm run dev` | Rivojlanish serveri |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Production server (`next start`, port `PORT` yoki 3000) |
| `npm run db:deploy` | `prisma migrate deploy` (production DB) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

## VPS: Git + `npm ci` + build + PM2

Serverda loyiha papkasi ichida (masalan `/var/www/pmtest`) odatiy yangilanish:

```bash
git pull
npm ci
npm run build
pm2 restart pmtest
```

**Birinchi marta**

1. Node.js **20+** o‘rnating.
2. PostgreSQL va `.env` (serverda `cp .env.example .env` yoki muhit o‘zgaruvchilari) — xususan `DATABASE_URL`, `NEXT_PUBLIC_APP_URL` (productionda `https://...`), admin/o‘quvchi maxfiy kalitlar.
3. Migratsiya: `npx prisma migrate deploy` (keyin schema o‘zgarganda ham shu buyruq).
4. Build: `npm ci` va `npm run build`.
5. PM2:
   - Loyiha ildizidan: `pm2 start ecosystem.config.cjs`
   - Yoki avvalroq: `pm2 start npm --name pmtest -- run start`

**Eslatmalar**

- **`NEXT_STANDALONE=1` shart emas** — u faqat `.next/standalone` + alohida `node server.js` uchun. Siz `next start` ishlatasiz, oddiy `npm run build` yetadi.
- **Schema o‘zgarganda** pull dan keyin: `npx prisma migrate deploy`, keyin `npm run build`, keyin `pm2 restart`.
- **Nginx** orqali `proxy_pass` `http://127.0.0.1:3000`, SSL (Certbot).

## Ishlash bilan bog‘liq qisqacha eslatmalar

- **Bosh sahifa** — global sozlamalar `unstable_cache` (tag: `admin-site-settings`, ~120 s). Admin Telegram chat saqlaganda `revalidateTag` bilan kesh yangilanadi.
- **Telegram fon vazifalari** — Next.js `after()`; Vercel talab qilmaydi.
- **`next.config.ts`** — `optimizePackageImports`, `removeConsole` (prod), `compress`, xavfsizlik headerlari.

## Boshqa manbalar

- [Next.js hujjatlari](https://nextjs.org/docs)
- [Prisma deploy](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)
