import { redirect } from 'next/navigation';
import { getCurrentUserWithRole } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await getCurrentUserWithRole();

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'admin') {
    redirect('/access-denied');
  }

  return (
    <div
      className="dashboard-content w-full"
      style={{
        backgroundColor: "hsl(var(--sidebar-background))",
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>
        Admin Dashboard
      </h1>
      <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.95rem" }}>
        Welcome, {session?.user?.email}
      </p>
    </div>
  );
}
