import Link from "next/link";
import { UserRound } from "lucide-react";
import "./dashboard.css";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-shell">
      <header className="navbar">
        <Link href="/dashboard" className="logo">
          Nook
        </Link>

        <nav className="nav-actions">
          <ThemeToggle />
          <Link href="/dashboard" className="nav-icon">
            <UserRound />
          </Link>
        </nav>
      </header>
      <div className="dashboard-body flex h-[calc(100vh-56px)]">
        <aside className="w-64 bg-transparent border-r">
          <Sidebar />
        </aside>
        <main className="flex flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
