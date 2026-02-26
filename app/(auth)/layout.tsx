import { ThemeToggle } from '@/components/ThemeToggle';
import './auth.css'
import '@/app/globals.css'

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
        <div className="flex justify-end absolute top-4 right-5">
        <ThemeToggle />
        </div>
        <div className="min-h-screen flex items-center justify-center auth-layout">
                {children}
            </div>
        </>
    );
}
