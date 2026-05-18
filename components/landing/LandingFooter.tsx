export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50/80 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-6xl pad-x-page text-center text-sm text-slate-500">
        <p>© {new Date().getFullYear()} Prezident Test. Barcha huquqlar himoyalangan.</p>
      </div>
    </footer>
  );
}
