export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar will go here */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
