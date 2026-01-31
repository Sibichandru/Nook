import Link from 'next/link';
import { UserRound } from 'lucide-react'
import './dashboard.css'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-shell">
      <header className="navbar">
        <Link href="/dashboard" className="logo">
          MyOS
        </Link>

        <nav className="nav-actions">
          <ThemeToggle />
          <Link href="/dashboard" className="nav-icon">
            <UserRound />
          </Link>
        </nav>
      </header>

      <main className="dashboard-content">
        {children}
      </main>
    </div>
  );
}
