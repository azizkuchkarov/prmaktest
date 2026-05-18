import Link from "next/link";
import { ArrowLeft, Headphones, ShieldAlert } from "lucide-react";
import { getSupportSettingsForAdminForm, saveSupportTelegramSettings } from "./actions";
import { SupportTelegramForm } from "./SupportTelegramForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSupportSettingsForAdminForm();
  if (!settings) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50/80 p-6 text-sm text-red-900">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <p>Kirish rad etildi. Qayta kiring.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:text-violet-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Boshqaruv
        </Link>
        <div className="mt-4 flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-violet-500/30">
            <Headphones className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Kabinet 24/7 yordam</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              O&apos;quvchilar kabinetidagi <strong>24/7 Yordam</strong> tugmasi orqali yuborilgan xabarlar shu
              Telegram chatiga keladi. Bot siz bilan yoki guruhda suhbat boshlagan bo&apos;lishi kerak.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-md shadow-slate-200/40 backdrop-blur-sm sm:p-8">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Telegram chat ID</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Shaxsiy chat uchun odatda musbat son (masalan <span className="font-mono text-xs">123456789</span>).
          Guruh yoki kanal uchun bot qo&apos;shilgan kanal ID odatda manfiy (
          <span className="font-mono text-xs">-100...</span>).
        </p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-slate-500">
          <li>
            <code className="font-mono">TELEGRAM_BOT_TOKEN</code> aktiv bo&apos;lishi kerak (xabar yuborish uchun).
          </li>
          <li>Bo&apos;sh qoldirsangiz, kabinetda yordam tugmasi ochilmaydi.</li>
        </ul>

        <div className="mt-6">
          <SupportTelegramForm
            defaultChatId={settings.supportTelegramChatId}
            saveAction={saveSupportTelegramSettings}
          />
        </div>
      </div>
    </div>
  );
}
