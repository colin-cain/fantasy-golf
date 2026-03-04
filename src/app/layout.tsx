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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <nav className="bg-white border-b border-stone-200 px-4">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between sm:h-14 py-3 sm:py-0 gap-2.5 sm:gap-0">
            <span className="text-sm font-bold text-slate-900 tracking-tight">⛳ FGL&apos;26</span>
            <div className="flex items-center gap-4 sm:gap-6">
              <Link href="/" className="text-xs uppercase tracking-widest text-slate-500 hover:text-orange-600 transition-colors">
                Standings
              </Link>
              <Link href="/history" className="text-xs uppercase tracking-widest text-slate-500 hover:text-orange-600 transition-colors">
                Results
              </Link>
              <Link href="/golfers" className="text-xs uppercase tracking-widest text-slate-500 hover:text-orange-600 transition-colors">
                Picks
              </Link>
              <Link href="/schedule" className="text-xs uppercase tracking-widest text-slate-500 hover:text-orange-600 transition-colors">
                Schedule
              </Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
