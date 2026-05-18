export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] w-full min-w-0 overflow-x-clip bg-gradient-to-b from-sky-50 via-white to-indigo-50/40 py-8 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:py-12">
      <div className="mx-auto w-full min-w-0 max-w-md pad-x-page">{children}</div>
    </div>
  );
}
