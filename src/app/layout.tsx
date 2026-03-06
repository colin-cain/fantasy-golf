import type { Metadata } from "next";
import { Geist, Geist_Mono, Bebas_Neue } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import NavLinks from "./components/NavLinks";
import TournamentBanner from "./components/TournamentBanner";
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
    .select('id, name, type, start_date, tee_time')
    .eq('status', 'in_progress')
    .limit(1)
    .single()

  const { data: next } = !live ? await supabase
    .from('tournaments')
    .select('id, name, type, start_date, tee_time')
    .eq('status', 'upcoming')
    .order('start_date', { ascending: true })
    .limit(1)
    .single() : { data: null }

  const banner = live ?? next

  // When live, fetch picks + leaderboard cache for the ticker
  let tickerPicks: { member: string; golfer: string; position: string | null; total: string | null; thru: string | null; teeTime: string | null }[] = []
  if (live) {
    const { data: picks } = await supabase
      .from('picks')
      .select('golfer_name, league_members(name)')
      .eq('tournament_id', live.id)

    if (picks?.length) {
      const golferNames = picks.map((p: { golfer_name: string }) => p.golfer_name)
      const { data: cache } = await supabase
        .from('leaderboard_cache')
        .select('golfer_name, position, total, thru, tee_time')
        .in('golfer_name', golferNames)

      const cacheMap = Object.fromEntries(
        (cache ?? []).map((r: { golfer_name: string; position: string; total: string; thru: string; tee_time: string }) => [r.golfer_name, r])
      )

      tickerPicks = (picks as unknown as { golfer_name: string; league_members: { name: string } }[])
        .map(p => ({
          member:   p.league_members.name,
          golfer:   p.golfer_name,
          position: cacheMap[p.golfer_name]?.position ?? null,
          total:    cacheMap[p.golfer_name]?.total    ?? null,
          thru:     cacheMap[p.golfer_name]?.thru     ?? null,
          teeTime:  cacheMap[p.golfer_name]?.tee_time ?? null,
        }))
        .sort((a, b) => {
          const posA = parseInt(a.position?.replace('T', '') ?? '999')
          const posB = parseInt(b.position?.replace('T', '') ?? '999')
          return posA - posB
        })
    }
  }

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} antialiased`}>
        <nav className="bg-green-900 border-b border-green-800" style={{ paddingRight: 'max(1rem, calc((100vw - 56rem) / 2 + 1rem))' }}>
          <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between sm:h-14 py-3 sm:py-0 gap-2.5 sm:gap-0">

            {/* Logo lockup — w-[411px] matches tournament section so right edges align at same x */}
            <div className="w-[411px] flex-shrink-0 flex items-center">
              <FGLLogo className="h-9 w-auto ml-auto" />
            </div>

            <NavLinks />
          </div>
        </nav>
        {banner && (
          <TournamentBanner
            name={banner.name}
            type={banner.type}
            startDate={banner.start_date}
            teeTime={banner.tee_time ?? null}
            inProgress={!!live}
            picks={tickerPicks}
          />
        )}
        {children}
        <Analytics />
      </body>
    </html>
  );
}
