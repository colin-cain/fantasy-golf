import type { Metadata } from "next";
import { Geist, Geist_Mono, Bebas_Neue } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import NavLinks from "./components/NavLinks";
import CountdownBanner from "./components/CountdownBanner";
import FGLLogo from "./components/FGLLogo";
import { supabase } from "@/lib/supabase";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

export const metadata: Metadata = {
  title: "Fantasy Golf League",
  description: "2026 Fantasy Golf League",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Prefer an in-progress tournament; fall back to next upcoming
  const { data: live } = await supabase
    .from('tournaments')
    .select('name, type, start_date, tee_time')
    .eq('status', 'in_progress')
    .limit(1)
    .single()

  const { data: next } = !live ? await supabase
    .from('tournaments')
    .select('name, type, start_date, tee_time')
    .eq('status', 'upcoming')
    .order('start_date', { ascending: true })
    .limit(1)
    .single() : { data: null }

  const banner = live ?? next

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} antialiased`}>
        <nav className="bg-white border-b border-stone-200 px-4">
          <div className="max-w-4xl mx-auto flex flex-col items-start sm:flex-row sm:items-center sm:justify-between sm:h-14 py-3 sm:py-0 gap-2.5 sm:gap-0">

            {/* Logo lockup */}
            <FGLLogo className="h-9 w-auto" />

            <NavLinks />
          </div>
        </nav>
        {banner && (
          <CountdownBanner
            name={banner.name}
            type={banner.type}
            startDate={banner.start_date}
            teeTime={banner.tee_time ?? null}
            inProgress={!!live}
          />
        )}
        {children}
        <Analytics />
      </body>
    </html>
  );
}
