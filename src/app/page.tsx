import { supabase } from '@/lib/supabase'
import StandingsChart, { ChartPoint } from './components/StandingsChart'

export const dynamic = 'force-dynamic'

type Standing = {
  name: string
  total_earnings: number
}

type TournamentWithPicks = {
  name: string
  start_date: string
  picks: { earnings: number; league_members: { name: string } }[]
}

type LivePick = {
  member: string
  golfer: string
  position: string | null
  total: string | null
  thru: string | null
  round: number | null
}

type LiveData = {
  tournamentName: string
  round: number | null
  roundStatus: string | null
  picks: LivePick[]
} | null

const MEMBERS = ['Ben', 'Ty', 'JJ', 'Jake', 'Chris', 'Colin']

async function getStandings(): Promise<Standing[]> {
  const { data, error } = await supabase
    .from('picks')
    .select('league_members(name), earnings')

  if (error) throw error

  const totals: Record<string, number> = {}
  for (const row of data as any[]) {
    const name = row.league_members.name
    totals[name] = (totals[name] || 0) + row.earnings
  }

  return Object.entries(totals)
    .map(([name, total_earnings]) => ({ name, total_earnings }))
    .sort((a, b) => b.total_earnings - a.total_earnings)
}

async function getChartData(): Promise<{ chartData: ChartPoint[]; weeklyData: ChartPoint[]; members: string[] }> {
  const { data, error } = await supabase
    .from('tournaments')
    .select(`
      name, start_date,
      picks(
        earnings,
        league_members(name)
      )
    `)
    .eq('status', 'completed')
    .order('start_date', { ascending: true })

  if (error) throw error

  const tournaments = (data as unknown) as TournamentWithPicks[]

  const cumulative: Record<string, number> = {}
  MEMBERS.forEach(m => (cumulative[m] = 0))

  const chartData: ChartPoint[] = tournaments.map((t, i) => {
    for (const pick of t.picks) {
      const name = pick.league_members.name
      cumulative[name] = (cumulative[name] ?? 0) + pick.earnings
    }
    return {
      label: `T${i + 1}`,
      tournament: t.name,
      ...Object.fromEntries(MEMBERS.map(m => [m, cumulative[m] ?? 0])),
    }
  })

  // Weekly: each tournament's individual earnings (not cumulative)
  const weeklyData: ChartPoint[] = tournaments.map((t, i) => ({
    label: `T${i + 1}`,
    tournament: t.name,
    ...Object.fromEntries(
      MEMBERS.map(m => [m, t.picks.find(p => p.league_members.name === m)?.earnings ?? 0])
    ),
  }))

  return { chartData, weeklyData, members: MEMBERS }
}

async function getLiveData(): Promise<LiveData> {
  // Find in-progress tournament
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name')
    .eq('status', 'in_progress')
    .limit(1)
    .single()

  if (!tournament) return null

  // Get picks for this tournament
  const { data: picks } = await supabase
    .from('picks')
    .select('golfer_name, league_members(name)')
    .eq('tournament_id', tournament.id)

  if (!picks?.length) return null

  // Get cached leaderboard data for these golfers
  const golferNames = picks.map((p: { golfer_name: string }) => p.golfer_name)
  const { data: cache } = await supabase
    .from('leaderboard_cache')
    .select('golfer_name, position, total, thru, round')
    .in('golfer_name', golferNames)

  const cacheMap = Object.fromEntries(
    (cache ?? []).map((r: { golfer_name: string; position: string; total: string; thru: string; round: number }) =>
      [r.golfer_name, r]
    )
  )

  // Get round/status from any cached row for this tournament
  const { data: meta } = await supabase
    .from('leaderboard_cache')
    .select('round')
    .eq('tournament_id', tournament.id)
    .limit(1)
    .single()

  const livePicks: LivePick[] = (picks as { golfer_name: string; league_members: { name: string } }[]).map(p => {
    const live = cacheMap[p.golfer_name]
    return {
      member:   p.league_members.name,
      golfer:   p.golfer_name,
      position: live?.position ?? null,
      total:    live?.total    ?? null,
      thru:     live?.thru     ?? null,
      round:    live?.round    ?? null,
    }
  }).sort((a, b) => {
    // Sort by position (numerically), with non-numeric positions last
    const posA = parseInt(a.position?.replace('T', '') ?? '999')
    const posB = parseInt(b.position?.replace('T', '') ?? '999')
    return posA - posB
  })

  return {
    tournamentName: tournament.name,
    round: meta?.round ?? null,
    roundStatus: null,
    picks: livePicks,
  }
}

const RANK_BADGE = [
  'bg-amber-400 text-white',                               // 1st — gold
  'bg-slate-300 text-slate-600',                           // 2nd — silver
  'bg-orange-800 text-orange-100',                         // 3rd — bronze
  'bg-stone-100 text-slate-400 border border-stone-200',   // 4th
  'bg-stone-100 text-slate-400 border border-stone-200',   // 5th
  'bg-stone-100 text-slate-400 border border-stone-200',   // 6th
]

export default async function HomePage() {
  const [standings, { chartData, weeklyData, members }, liveData] = await Promise.all([
    getStandings(),
    getChartData(),
    getLiveData(),
  ])
  const maxEarnings = standings[0]?.total_earnings ?? 1

  return (
    <main className="min-h-screen bg-stone-100">
      <div className="max-w-2xl mx-auto px-4 py-12">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Season Standings</h1>
          <p className="text-slate-500 text-sm mt-1">2026 · Based on PGA Tour prize earnings</p>
        </div>

        {/* Live scores card — only shown during an in-progress tournament */}
        {liveData && (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden mb-5">
            {/* Header */}
            <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs uppercase tracking-widest text-slate-500 font-medium">
                  This Week
                </span>
                <span className="text-xs text-slate-400">· {liveData.tournamentName}</span>
              </div>
              {liveData.round && (
                <span className="text-xs text-slate-400">Round {liveData.round}</span>
              )}
            </div>

            {/* Pick rows */}
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-100 text-xs uppercase tracking-widest text-slate-400">
                  <th className="px-5 py-2.5 text-left">Player</th>
                  <th className="px-5 py-2.5 text-left">Golfer</th>
                  <th className="px-5 py-2.5 text-center">Pos</th>
                  <th className="px-5 py-2.5 text-center">Score</th>
                  <th className="px-5 py-2.5 text-center">Thru</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {liveData.picks.map(({ member, golfer, position, total, thru }) => (
                  <tr key={member} className="hover:bg-stone-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-800">{member}</td>
                    <td className="px-5 py-3 text-slate-600">{golfer}</td>
                    <td className="px-5 py-3 text-center">
                      {position
                        ? <span className="font-mono text-sm font-semibold text-slate-700">{position}</span>
                        : <span className="text-slate-300">–</span>
                      }
                    </td>
                    <td className="px-5 py-3 text-center">
                      {total
                        ? <span className={`font-mono text-sm font-semibold ${
                            total.startsWith('-') ? 'text-emerald-600' :
                            total === 'E' ? 'text-slate-600' : 'text-red-500'
                          }`}>{total}</span>
                        : <span className="text-slate-300">–</span>
                      }
                    </td>
                    <td className="px-5 py-3 text-center font-mono text-xs text-slate-400">
                      {thru ?? '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Standings table */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-xs uppercase tracking-widest text-slate-400">
                <th className="px-5 py-3 text-left w-14">#</th>
                <th className="px-5 py-3 text-left">Player</th>
                <th className="px-5 py-3 text-right">Earnings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {standings.map((member, index) => {
                const pct = Math.round((member.total_earnings / maxEarnings) * 100)
                return (
                  <tr key={member.name} className="hover:bg-stone-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${RANK_BADGE[index] ?? 'bg-stone-100 text-slate-400'}`}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-900">{member.name}</td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-mono text-emerald-700 font-semibold">
                        ${member.total_earnings.toLocaleString()}
                      </span>
                      <div className="mt-1.5 h-1 rounded-full bg-stone-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Cumulative earnings chart */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm px-5 pt-5 pb-3 mt-5">
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-4">Cumulative Earnings</p>
            <StandingsChart data={chartData} members={members} />
          </div>
        )}

        {/* Weekly earnings chart */}
        {weeklyData.length > 0 && (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm px-5 pt-5 pb-3 mt-5">
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-4">Earnings by Tournament</p>
            <StandingsChart data={weeklyData} members={members} />
          </div>
        )}

      </div>
    </main>
  )
}
