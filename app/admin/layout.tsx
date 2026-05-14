export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F1F5F9] bg-gradient-to-br from-[#F1F5F9] via-[#F8FAFC] to-violet-100/35 text-slate-900 antialiased">
      {children}
    </div>
  );
}
