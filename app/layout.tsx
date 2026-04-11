import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import { AuthProvider } from "./providers/auth-providers";
import "./globals.css";
import { MantineAppProvider } from "./providers/mantine-provider";
import { DatesProvider } from '@mantine/dates';

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
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

const themeInitScript = `
(() => {
  try {
    const storedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = storedTheme ? storedTheme === "dark" : prefersDark;
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.setAttribute(
      "data-mantine-color-scheme",
      isDark ? "dark" : "light"
    );
  } catch (_) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${manrope.variable} ${inter.variable} antialiased`}>
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
