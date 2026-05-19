/**
 * Telegram bot (long polling): /start → telefon ulash tugmasi →
 * POST /api/telegram/link-by-phone (telegramId + telefon bazada topiladi).
 *
 * Kabinetdan /start TOKEN ham ishlaydi → POST /api/telegram/confirm-link
 *
 * Ishga tushirish (Node 20+):
 *   node --env-file=.env scripts/telegram-link-bot.mjs
 * yoki:
 *   npm run bot:link
 *
 * Kerakli .env: TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_API_SECRET, NEXT_PUBLIC_APP_URL
 */

const TOKEN = (process.env.TELEGRAM_BOT_TOKEN ?? "").trim();
const API_SECRET = (process.env.TELEGRAM_BOT_API_SECRET ?? "").trim();

/** Windows da `localhost` ba'zan `::1` bo‘ladi, Node `127.0.0.1` kutadi — ECONNREFUSED. */
function normalizeBotApiBase(raw) {
  const s = raw.trim().replace(/\/+$/, "");
  try {
    const u = new URL(s);
    if (u.hostname === "localhost") {
      u.hostname = "127.0.0.1";
      return u.toString().replace(/\/+$/, "");
    }
  } catch {
    /* ignore */
  }
  return s;
}

const SITE = normalizeBotApiBase(
  process.env.TELEGRAM_LINK_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "",
);

if (!TOKEN) {
  console.error("[bot] TELEGRAM_BOT_TOKEN bo‘sh.");
  process.exit(1);
}
if (!API_SECRET || API_SECRET.length < 16) {
  console.error("[bot] TELEGRAM_BOT_API_SECRET kamida 16 belgi bo‘lishi kerak.");
  process.exit(1);
}
if (!SITE) {
  console.error("[bot] NEXT_PUBLIC_APP_URL yoki TELEGRAM_LINK_SITE_URL ko‘rsating (masalan https://testpm.uz).");
  process.exit(1);
}

const TG = `https://api.telegram.org/bot${TOKEN}`;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isUserBlockedTelegram(data) {
  if (data?.error_code !== 403) return false;
  const d = String(data.description ?? "").toLowerCase();
  return d.includes("blocked") || d.includes("user is deactivated");
}

async function tgPost(method, body) {
  const res = await fetch(`${TG}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!data.ok && !isUserBlockedTelegram(data)) {
    console.warn(`[bot] ${method}`, data);
  }
  return data;
}

function startArg(text) {
  if (typeof text !== "string") return null;
  const t = text.trim();
  if (!t.startsWith("/start")) return null;
  const parts = t.split(/\s+/);
  return parts.length > 1 ? parts[1].trim() : null;
}

let siteUnreachableLogged = false;

function logSiteUnreachableOnce(err) {
  if (siteUnreachableLogged) return;
  siteUnreachableLogged = true;
  const code = err?.cause?.code ?? err?.code ?? "";
  console.error("[bot] Sayt API ga ulanib bo‘lmadi" + (code ? ` (${code})` : "") + ".");
  console.error("[bot] 1) Boshqa terminalda `npm run dev` yoki `npm run start` ishga tushiring.");
  console.error("[bot] 2) `.env` da ichki chaqiruv uchun: TELEGRAM_LINK_SITE_URL=http://127.0.0.1:3000");
}

async function postSiteJson(path, payload) {
  try {
    const res = await fetch(`${SITE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_SECRET}`,
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    const looksJson = Boolean(text && text.trim().startsWith("{"));
    let body = {};
    try {
      body = looksJson ? JSON.parse(text) : {};
    } catch {
      body = { ok: false, error: "invalid_response", detail: `HTTP ${res.status}` };
    }
    if (!body.ok && typeof body.error !== "string") {
      if (res.status === 401) {
        body.error = "unauthorized";
      } else if (res.status >= 400) {
        body.error = looksJson ? "http_error" : "invalid_response";
        body.detail = `HTTP ${res.status}`;
      }
    }
    if (body.error === "http_error" && body.detail == null) {
      body.detail = `HTTP ${res.status}`;
    }
    siteUnreachableLogged = false;
    return { status: res.status, body };
  } catch (e) {
    logSiteUnreachableOnce(e);
    return { status: 0, body: { ok: false, error: "site_unreachable" } };
  }
}

async function callConfirmLink(token, telegramId, username) {
  return postSiteJson("/api/telegram/confirm-link", {
    token,
    telegramId,
    ...(username ? { username } : {}),
  });
}

async function callLinkByPhone(phone, telegramId, username) {
  return postSiteJson("/api/telegram/link-by-phone", {
    phone,
    telegramId,
    ...(username ? { username } : {}),
  });
}

const MSG_ASK_CONTACT =
  "Salom! Platformadagi akkauntingizni bog‘lash uchun quyidagi tugmani bosing va " +
  "ro‘yxatdan o‘tgan telefon raqamingizni yuboring (boshqa raqam ishlamaydi).";

const KEYBOARD = {
  keyboard: [[{ text: "📱 Telefon raqamimni yuborish", request_contact: true }]],
  resize_keyboard: true,
  one_time_keyboard: true,
};

const REMOVE_KEYBOARD = { remove_keyboard: true };

function replyLinkByPhoneError(status, err, detail) {
  if (status === 404 || err === "user_not_found") {
    return "❌ Bu telefon saytda ro‘yxatdan o‘tmagan. Avval saytda ro‘yxatdan o‘ting, shu raqamni kiriting.";
  }
  if (err === "invalid_phone") {
    return "❌ Telefon raqamni tushunmadim. Qaytadan tugma orqali yuboring.";
  }
  if (err === "telegram_already_linked") {
    return "❌ Bu Telegram akkaunt boshqa foydalanuvchiga bog‘langan.";
  }
  if (err === "phone_already_linked_other_telegram") {
    return "❌ Sizning platformadagi akkauntingiz allaqachon boshqa Telegramga ulangan. Admin yordamida.";
  }
  if (err === "site_unreachable") {
    return "❌ Sayt hozir javob bermayapti. Keyinroq urinib ko‘ring (server ishga tushgan bo‘lishi kerak).";
  }
  if (err === "unauthorized") {
    return "❌ Bot va sayt maxfiy kaliti mos emas. VPS da .env dagi TELEGRAM_BOT_API_SECRET bilan Bearer bir xil bo‘lsin; prmaktest va prmaktest-bot ni qayta ishga tushiring.";
  }
  if (err === "not_configured") {
    return "❌ Saytda TELEGRAM_BOT_API_SECRET kamida 16 belgi emas yoki .env o‘qilmayapti. Sayt jarayonini (prmaktest) tekshiring.";
  }
  if (err === "invalid_response") {
    return (
      "❌ Sayt HTML/noto‘g‘ri javob qaytardi (Nginx 502/proxy). " +
      (detail ? detail + " " : "") +
      "/api/telegram/link-by-phone domen orqali ochiqmi — admin tekshirsin."
    );
  }
  if (err === "http_error") {
    return `❌ Sayt xatosi: ${detail || "HTTP " + status}. Keyinroq urinib ko‘ring.`;
  }
  return "❌ Bog‘lanmadi. Keyinroq qayta urinib ko‘ring yoki admin bilan bog‘laning.";
}

let offset = 0;

async function handleMessage(msg) {
  const chatId = msg.chat?.id;
  if (chatId == null) return;

  const from = msg.from;
  const tid = from?.id != null ? String(from.id) : null;
  const username = typeof from?.username === "string" ? from.username : undefined;

  if (msg.contact?.phone_number && tid) {
    const phone = msg.contact.phone_number;
    const { status, body } = await callLinkByPhone(phone, tid, username);
    if (body?.error === "site_unreachable") {
      await tgPost("sendMessage", {
        chat_id: chatId,
        text: replyLinkByPhoneError(status, "site_unreachable", undefined),
        reply_markup: REMOVE_KEYBOARD,
      });
      return;
    }
    if (body?.ok === true) {
      await tgPost("sendMessage", {
        chat_id: chatId,
        text: "✅ Telegram akkauntingiz platformaga bog‘landi. Kabinetga qaytishingiz mumkin.",
        reply_markup: REMOVE_KEYBOARD,
      });
      return;
    }
    const err = typeof body?.error === "string" ? body.error : "";
    const detail = typeof body?.detail === "string" ? body.detail : undefined;
    await tgPost("sendMessage", {
      chat_id: chatId,
      text: replyLinkByPhoneError(status, err, detail),
      reply_markup: REMOVE_KEYBOARD,
    });
    return;
  }

  const arg = startArg(msg.text);
  if (arg && tid) {
    const { status, body } = await callConfirmLink(arg, tid, username);
    if (body?.error === "site_unreachable") {
      await tgPost("sendMessage", {
        chat_id: chatId,
        text: replyLinkByPhoneError(status, "site_unreachable", undefined),
        reply_markup: REMOVE_KEYBOARD,
      });
      return;
    }
    if (status === 200 && body?.ok === true) {
      await tgPost("sendMessage", {
        chat_id: chatId,
        text: "✅ Kabinet orqali bergan havola orqali bog‘landingiz.",
        reply_markup: REMOVE_KEYBOARD,
      });
      return;
    }
    if (body?.error === "telegram_already_linked") {
      await tgPost("sendMessage", {
        chat_id: chatId,
        text: "❌ Bu Telegram akkaunt boshqa foydalanuvchiga bog‘langan.",
        reply_markup: REMOVE_KEYBOARD,
      });
      return;
    }
    if (status === 404 || body?.error === "token_not_found") {
      await tgPost("sendMessage", {
        chat_id: chatId,
        text: "❌ Havola eskirgan yoki yaroqsiz. Kabinetdan yangi havola oling.",
        reply_markup: KEYBOARD,
      });
      return;
    }
    await tgPost("sendMessage", {
      chat_id: chatId,
      text: replyLinkByPhoneError(
        status,
        typeof body?.error === "string" ? body.error : "",
        typeof body?.detail === "string" ? body.detail : undefined,
      ),
      reply_markup: KEYBOARD,
    });
    return;
  }

  if ((msg.text && msg.text.startsWith("/start")) || msg.text === "/help") {
    await tgPost("sendMessage", {
      chat_id: chatId,
      text: MSG_ASK_CONTACT,
      reply_markup: KEYBOARD,
    });
  }
}

async function handleUpdate(update) {
  if (update.message) await handleMessage(update.message);
}

async function loop() {
  console.log("[bot] Ishga tushdi. Sayt:", SITE);
  for (;;) {
    try {
      const url = `${TG}/getUpdates?offset=${offset}&timeout=50`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.ok) {
        console.warn("[bot] getUpdates", data);
        await sleep(3000);
        continue;
      }
      for (const u of data.result ?? []) {
        offset = u.update_id + 1;
        await handleUpdate(u);
      }
    } catch (e) {
      console.error("[bot]", e);
      await sleep(3000);
    }
  }
}

loop();
