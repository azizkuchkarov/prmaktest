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
| `npm run dev:webpack` | Turbopack keshi buzilganda: dev server webpack bilan |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Production server (`next start`, port `PORT` yoki 3000) |
| `npm run db:deploy` | `prisma migrate deploy` (production DB) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run bot:link` | Telegram bot (telefon ulanishi + `/start` token). Env: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_API_SECRET`, `NEXT_PUBLIC_APP_URL` |

## Telegram bot (telefon → admin panel `telegramId`)

Loyihada **ikki qism** bor:

1. **Next.js API** — `POST /api/telegram/link-by-phone` va `POST /api/telegram/confirm-link` (Bearer `TELEGRAM_BOT_API_SECRET`).
2. **Oddiy bot skripti** — `scripts/telegram-link-bot.mjs`: foydalanuvchi `/start` beradi, bot telefon ulashni so‘raydi, kontakt kelgacha sayt API ga yuboradi; bazada `User.phone` topilsa, `telegramId` to‘ldiriladi (admin panelda ko‘rinadi).

Mahalliy ishga tushirish (Next ham ishlayotgan bo‘lsin, `localhost` bo‘lsa Telegram serveridan API ga urinib bo‘lmaydi — VPS yoki tunnel kerak):

```bash
npm run bot:link
```

Production VPS: `pm2` ichida **prmaktest-bot** (yoki `ecosystem.config.cjs` bilan birga ishga tushadi).

**Eslatma:** BotFather da webhook yoqilgan bo‘lsa, `getUpdates` (long polling) bilan ziddiyat bo‘lishi mumkin — webhook ni o‘chiring yoki skript o‘rniga webhook + server route yozing.

## VPS: Git + `npm ci` + build + PM2 (**prmaktest**)

**To‘liq qo‘llanma:** [docs/VPS-PRMAKTEST.md](./docs/VPS-PRMAKTEST.md) — papka nomi, `prmaktest` / `prmaktest-bot`, Nginx, `.env`.

Qisqacha yangilanish:

```bash
git pull
npm ci
npx prisma migrate deploy
npm run build
pm2 restart prmaktest
pm2 restart prmaktest-bot
```

**Birinchi marta** loyiha ildizidan: `pm2 start ecosystem.config.cjs` (sayt + bot birga).

**Birinchi marta** (qisqa)

1. Node.js **20+** o‘rnating.
2. PostgreSQL va `.env` — xususan `DATABASE_URL`, `NEXT_PUBLIC_APP_URL` (**https://**), kalitlar.
3. `npx prisma migrate deploy`, keyin `npm ci` va `npm run build`.
4. PM2: `pm2 start ecosystem.config.cjs` (jarayonlar: **prmaktest**, **prmaktest-bot**).

**Eslatmalar**

- **`NEXT_STANDALONE=1` shart emas** — `next start` uchun oddiy `npm run build` yetadi.
- **Nginx** — `proxy_pass` `http://127.0.0.1:3000`, SSL.

## Ishlash bilan bog‘liq qisqacha eslatmalar

- **Bosh sahifa** — global sozlamalar `unstable_cache` (tag: `admin-site-settings`, ~120 s). Admin Telegram chat saqlaganda `revalidateTag` bilan kesh yangilanadi.
- **Telegram fon vazifalari** — Next.js `after()`; Vercel talab qilmaydi.
- **`next.config.ts`** — `optimizePackageImports`, `removeConsole` (prod), `compress`, xavfsizlik headerlari.

### Turbopack / `.next` xatolari (`ENOENT build-manifest.json`, `.sst` topilmadi)

Bir vaqtning o‘zida ikkita `next dev`, yoki `.next` o‘chirib tashlangan paytda boshqa jarayon kesh yozayotgan bo‘lsa — Turbopack keshini buzadigan.

1. Barcha `next dev` / Cursor terminalidagi dev serverlarini toʻxtating.
2. Loyiha ildizida `.next` papkasini o‘chirib tashlang (`Remove-Item -Recurse .next` PowerShell da yoki qo‘lda).
3. Qayta: `npm run dev`. Agar muammo takrorlansa — `npm run dev:webpack` (webpack rejimi sababli sekinroq).

## Boshqa manbalar

- [Next.js hujjatlari](https://nextjs.org/docs)
- [Prisma deploy](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)
