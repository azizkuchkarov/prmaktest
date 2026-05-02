import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex min-h-0 flex-1 flex-col">
        <main className="flex-1 overflow-auto p-6 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
