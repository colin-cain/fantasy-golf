import { supabase } from '@/lib/supabase'
import StandingsChart, { ChartPoint } from './components/StandingsChart'

type Standing = {
  name: string
  total_earnings: number
}

type TournamentWithPicks = {
  name: string
  start_date: string
  picks: { earnings: number; league_members: { name: string } }[]
}

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

async function getChartData(): Promise<{ chartData: ChartPoint[]; members: string[] }> {
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

  return { chartData, members: MEMBERS }
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
  const [standings, { chartData, members }] = await Promise.all([
    getStandings(),
    getChartData(),
  ])
  const maxEarnings = standings[0]?.total_earnings ?? 1

  return (
    <main className="min-h-screen bg-stone-100">
      <div className="max-w-2xl mx-auto px-4 py-12">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Season Standings</h1>
          <p className="text-slate-500 text-sm mt-1">2026 · Based on PGA Tour prize earnings</p>
        </div>

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

        {/* Earnings over time chart */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm px-5 pt-5 pb-3 mt-5">
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-4">Cumulative Earnings</p>
            <StandingsChart data={chartData} members={members} />
          </div>
        )}

      </div>
    </main>
  )
}
