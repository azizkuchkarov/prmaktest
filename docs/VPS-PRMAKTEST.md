# VPS deploy — loyiha nomi: **prmaktest**

Quyidagi qo‘llanmada serverdagi papka, PM2 jarayonlari va buyruqlar **prmaktest** nomi bilan keladi. O‘zingiz boshqa path ishlatsangiz, faqat `cd` manzilini almashtiring.

---

## 1. Server tayyorlash

- **Ubuntu** (yoki boshqa Linux), **Node.js 20+** (`node -v`)
- **PostgreSQL** — baza yaratilgan, `DATABASE_URL` tayyor
- **Nginx** (tavsiya) + **SSL** (Certbot) — domen orqali HTTPS
- **Git** — repozitoriy klonlangan

Loyiha papkasi misol (o‘zingiz tanlang):

```text
/var/www/prmaktest
```

---

## 2. Birinchi marta: kod va muhit

```bash
cd /var/www/prmaktest
git clone <SIZNING_GIT_URL> .    # yoki allaqachon klonda bo'lsa: git pull
cp .env.example .env
nano .env                          # yoki vim
```

`.env` da production uchun **majburiy** taxminan:

- `DATABASE_URL` — PostgreSQL
- `NEXT_PUBLIC_APP_URL=https://sizning-domen.uz` (**https**, bot va cookie uchun muhim)
- `ADMIN_SECRET`, `ADMIN_PASSWORD`, `STUDENT_SESSION_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_API_SECRET`, `CLICK_*` (agar to‘lov bo‘lsa)

---

## 3. Birinchi deploy: migratsiya + build + PM2

```bash
cd /var/www/prmaktest
npm ci
npx prisma migrate deploy
npm run build
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup                        # tizim qayta yuklanganda PM2 avtomatik (ko'rsatma chiqadi)
```

PM2 da ikkita jarayon paydo bo‘ladi:

| PM2 nomi          | Vazifasi                          |
|-------------------|-----------------------------------|
| **prmaktest**     | Next.js production (`next start`) |
| **prmaktest-bot** | Telegram bot (`npm run bot:link`) |

Tekshiruv:

```bash
pm2 list
pm2 logs prmaktest --lines 50
pm2 logs prmaktest-bot --lines 50
```

Sayt brauzerda: `https://sizning-domen.uz`

---

## 4. Nginx (qisqa)

`proxy_pass` **127.0.0.1:3000** ga (yoki `.env` dagi `PORT`). SSL sertifikat Certbot bilan.

---

## 5. Keyingi yangilanishlar (har safar Git dan olganda)

```bash
cd /var/www/prmaktest
git pull
npm ci
npx prisma migrate deploy       # schema o'zgarmasa ham xavfsiz; o'zgamagan bo'lsa tez tugaydi
npm run build
pm2 restart prmaktest
pm2 restart prmaktest-bot
```

Agar **faqat bot kodi** o‘zgarsa (masalan `scripts/telegram-link-bot.mjs`), sayt build shart emas:

```bash
pm2 restart prmaktest-bot
```

Agar **faqat sayt** (Next) o‘zgarsa:

```bash
npm ci          # package.json o'zgarganda
npm run build
pm2 restart prmaktest
```

---

## 6. VPS da `npm run dev` ishlatilmaydi

- **`npm run dev`** — faqat kompyuteringizda ishlab chiqish uchun.
- Serverda doimiy ish **build + `pm2 restart prmaktest`** (`next start`).

---

## 7. Telegram bot eslatmalari

- Bot API chaqiruvlari **`NEXT_PUBLIC_APP_URL`** (HTTPS domen) orqali saytga boradi; lokal `localhost` productionda ishlatilmaydi.
- BotFather da **webhook** yoqilgan bo‘lsa, `getUpdates` (long polling) bilan ziddiyat bo‘lishi mumkin — webhookni o‘chiring yoki alohida strategiya tanlang.

---

## 8. Muammo bo‘lsa

```bash
pm2 logs prmaktest --err
pm2 logs prmaktest-bot --err
```

PostgreSQL: ulanish va migratsiya xatolarini `npx prisma migrate deploy` chiqishi bilan ko‘rasiz.
