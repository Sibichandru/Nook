import { redirect } from 'next/navigation';
import { getCurrentUserWithRole } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await getCurrentUserWithRole();

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'admin') {
    redirect('/403');
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {session.user.email}</p>
    </div>
  );
}
