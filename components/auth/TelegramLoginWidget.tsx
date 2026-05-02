"use client";

import { useEffect, useRef } from "react";

type Props = {
  botUsername: string;
  authUrl: string;
};

/** Telegram Login Widget — `TELEGRAM_BOT_TOKEN` sozlangan bo'lishi kerak */
export function TelegramLoginWidget({ botUsername, authUrl }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.innerHTML = "";
    const s = document.createElement("script");
    s.src = "https://telegram.org/js/telegram-widget.js?22";
    s.async = true;
    s.setAttribute("data-telegram-login", botUsername);
    s.setAttribute("data-size", "large");
    s.setAttribute("data-auth-url", authUrl);
    s.setAttribute("data-request-access", "write");
    el.appendChild(s);

    return () => {
      el.innerHTML = "";
    };
  }, [botUsername, authUrl]);

  return <div ref={ref} className="min-h-[56px]" />;
}
