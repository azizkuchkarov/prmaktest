export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] w-full min-w-0 overflow-x-hidden bg-gradient-to-b from-sky-50 via-white to-indigo-50/40 px-4 py-8 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-12">
      <div className="mx-auto w-full min-w-0 max-w-md">{children}</div>
    </div>
  );
}
