import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stop Crying Schrette",
  description: "2026 Fantasy Golf League",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-white`}>
        <nav className="border-b border-gray-800 px-4">
          <div className="max-w-2xl mx-auto flex items-center gap-6 h-14">
            <Link href="/" className="text-sm font-medium hover:text-green-400 transition-colors">
              Standings
            </Link>
            <Link href="/history" className="text-sm font-medium hover:text-green-400 transition-colors">
              Tournament History
            </Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
