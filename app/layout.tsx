import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./providers/auth-providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MPN",
  description: "An App to Manage Personal Needs",
  openGraph: {
    title: 'My Site',
    description: 'Welcome to My Site',
    url: 'https://example.com',
    siteName: 'My Site',
    images: [{ url: 'https://example.com/og.png' }]
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <div className="app-root">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
