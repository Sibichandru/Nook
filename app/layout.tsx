import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "./providers/auth-providers";
import "./globals.css";
import { MantineAppProvider } from "./providers/mantine-provider";
import { DatesProvider } from '@mantine/dates';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nook",
  description: "An App to Manage Personal Needs",
  openGraph: {
    title: 'Nook',
    description: 'An App to Manage Personal Needs',
    url: 'https://nookapp.in',
    siteName: 'Nook',
    images: [{ url: 'https://nookapp.in/og.png' }]
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
          <MantineAppProvider>
            <DatesProvider settings={{ locale: 'en' }}>
              <div className="app-root">{children}</div>
            </DatesProvider>
          </MantineAppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
