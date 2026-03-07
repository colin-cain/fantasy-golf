import { supabase } from '@/lib/supabase'
import { getProjectedEarnings } from '@/lib/payoutTable'
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

type LiveCacheRow = {
  golfer_name: string
  position: string | null
}

type LivePick = {
  golfer_name: string
  league_members: { name: string }
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

/**
 * Fetches the in-progress tournament + current leaderboard positions + purse,
 * and returns projected earnings per member. Returns null when no live tournament.
 */
async function getLiveProjections(): Promise<{
  tournamentName: string
  purse: number
  projections: Record<string, number>  // member name → projected earnings
} | null> {
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name, purse')
    .eq('status', 'in_progress')
    .limit(1)
    .single()

  if (!tournament) return null

  // Fetch picks for this tournament
  const { data: picks } = await supabase
    .from('picks')
    .select('golfer_name, league_members(name)')
    .eq('tournament_id', tournament.id)

  if (!picks?.length) return null

  const golferNames = (picks as unknown as LivePick[]).map(p => p.golfer_name)

  // Fetch current positions from leaderboard cache
  const { data: cache } = await supabase
    .from('leaderboard_cache')
    .select('golfer_name, position')
    .in('golfer_name', golferNames)

  const positionMap = Object.fromEntries(
    ((cache ?? []) as LiveCacheRow[]).map(r => [r.golfer_name, r.position])
  )

  const purse = (tournament.purse as number) ?? 0

  // Map each member to their projected earnings via their golfer's current position
  const projections: Record<string, number> = {}
  for (const pick of picks as unknown as LivePick[]) {
    const memberName = pick.league_members.name
    const position = positionMap[pick.golfer_name] ?? null
    projections[memberName] = getProjectedEarnings(position, purse)
  }

  return { tournamentName: tournament.name, purse, projections }
}

const RANK_BADGE = [
  'bg-amber-400 text-white',                               // 1st — gold
  'bg-slate-300 text-slate-600',                           // 2nd — silver
  'bg-orange-800 text-orange-100',                         // 3rd — bronze
  'bg-stone-100 text-slate-400 border border-stone-200',   // 4th
  'bg-stone-100 text-slate-400 border border-stone-200',   // 5th
  'bg-stone-100 text-slate-400 border border-stone-200',   // 6th
]

// Muted filled variant — same hues as RANK_BADGE but softened, signals "projected not confirmed"
const RANK_BADGE_MUTED = [
  'bg-amber-100 text-amber-500',                           // 1st — muted gold
  'bg-slate-100 text-slate-400',                           // 2nd — muted silver
  'bg-orange-100 text-orange-600',                         // 3rd — muted bronze
  'bg-stone-100 text-slate-300',                           // 4th
  'bg-stone-100 text-slate-300',                           // 5th
  'bg-stone-100 text-slate-300',                           // 6th
]

function formatDollars(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}

export default async function HomePage() {
  const [standings, { chartData, weeklyData, members }, live] = await Promise.all([
    getStandings(),
    getChartData(),
    getLiveProjections(),
  ])

  // Enrich each standing with live projected + combined values
  const enriched = standings.map(s => ({
    ...s,
    projected: live?.projections[s.name] ?? 0,
    combined:  s.total_earnings + (live?.projections[s.name] ?? 0),
  }))

  // Always sort by realized earnings — keeps rank badges and row order stable
  const sorted = enriched

  const maxValue = sorted[0]?.total_earnings ?? 1

  // Projected rank map — where each member would land if combined earnings held
  const projectedRankMap = live
    ? new Map([...enriched].sort((a, b) => b.combined - a.combined).map((s, i) => [s.name, i + 1]))
    : new Map<string, number>()

  // Add a projected data point to both charts when a live tournament is running
  const completedCount = chartData.length
  const projectedLabel    = live ? `T${completedCount + 1}` : null
  const lastCompletedLabel = chartData[chartData.length - 1]?.label as string | undefined

  const enrichedChartData: ChartPoint[] = projectedLabel && live
    ? [
        ...chartData,
        {
          label:      projectedLabel,
          tournament: `${live.tournamentName} (Live)`,
          // Cumulative: each member's realized + projected
          ...Object.fromEntries(
            MEMBERS.map(m => {
              const realized = (chartData[chartData.length - 1]?.[m] as number) ?? 0
              return [m, realized + (live.projections[m] ?? 0)]
            })
          ),
        },
      ]
    : chartData

  const enrichedWeeklyData: ChartPoint[] = projectedLabel && live
    ? [
        ...weeklyData,
        {
          label:      projectedLabel,
          tournament: `${live.tournamentName} (Live)`,
          ...Object.fromEntries(
            MEMBERS.map(m => [m, live.projections[m] ?? 0])
          ),
        },
      ]
    : weeklyData

  return (
    <main className="min-h-screen bg-stone-100">
      <div className="max-w-4xl mx-auto px-4 py-12">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Season Standings</h1>
          <p className="text-slate-500 text-sm mt-1">
            2026 · Based on PGA Tour prize earnings
            {live && (
              <span className="ml-2 inline-flex items-center gap-1 text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                Projected from live results
              </span>
            )}
          </p>
        </div>

        {/* Standings table */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm md:table-fixed">
            <colgroup>
              {/* Rank: tighter on mobile */}
              <col className="w-9 md:w-12" />
              {/* Player / earnings: flexible */}
              <col />
              {/* Projected this week: fixed narrow on mobile */}
              {live && <col className="w-14 md:w-1/4" />}
              {/* Projected total: fixed narrow on mobile */}
              {live && <col className="w-[4.5rem] md:w-1/4" />}
            </colgroup>
            <thead>
              {live && (
                <tr className="bg-stone-50 text-xs uppercase tracking-widest text-slate-400">
                  <th colSpan={2} />
                  <th colSpan={2} className="px-2 md:px-5 pt-3 pb-0 text-center border-l border-stone-200 italic">
                    Projected
                  </th>
                </tr>
              )}
              <tr className="bg-stone-50 border-b border-stone-200 text-xs uppercase tracking-widest text-slate-400">
                <th className="px-2 md:px-4 py-3 text-left">#</th>
                <th className="px-2 md:px-4 py-3">
                  <div className="flex justify-between items-center">
                    <span>Player</span>
                    {/* Earnings label only when there are no extra projected columns */}
                    {!live && <span>Cumulative Earnings</span>}
                    {live && <span className="hidden md:inline">Cumulative Earnings</span>}
                  </div>
                </th>
                {live && (
                  <th className="px-1 md:px-4 py-3 text-right italic border-l border-stone-200">
                    <span className="md:hidden">Wk</span>
                    <span className="hidden md:inline">Current Week</span>
                  </th>
                )}
                {live && (
                  <th className="px-1 md:px-4 py-3 text-right italic">
                    <span className="md:hidden">Total</span>
                    <span className="hidden md:inline">Cumulative Earnings</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {sorted.map((member, index) => {
                const pct = Math.round((member.total_earnings / maxValue) * 100)

                // Movement arrow: current realized rank vs where they'd land on combined
                const realRank = index + 1
                const projRank = projectedRankMap.get(member.name) ?? realRank
                const delta = realRank - projRank  // positive = would move up

                return (
                  <tr key={member.name} className="hover:bg-stone-50 transition-colors">
                    <td className="px-2 md:px-4 py-3">
                      {/* Badge: slightly smaller on mobile */}
                      <div className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold ${RANK_BADGE[index] ?? 'bg-stone-100 text-slate-400'}`}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-2 md:px-4 py-3">
                      <div className="flex justify-between items-center gap-1">
                        <span className="font-medium text-slate-900">{member.name}</span>
                        {/* Short format on mobile (e.g. $1.2M), full on desktop */}
                        <span className="font-mono text-slate-900 font-semibold">
                          <span className="md:hidden">{formatDollars(member.total_earnings)}</span>
                          <span className="hidden md:inline">${member.total_earnings.toLocaleString()}</span>
                        </span>
                      </div>
                      {!live && (
                        <div className="mt-1.5 h-1 rounded-full bg-stone-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-400"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </td>
                    {live && (
                      <td className="px-1 md:px-4 py-3 text-right font-mono text-slate-400 text-xs italic border-l border-stone-200">
                        {member.projected > 0 ? `~${formatDollars(member.projected)}` : '—'}
                      </td>
                    )}
                    {live && (
                      <td className="px-1 md:px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 md:gap-2">
                          {/* Projected rank badge — muted fill signals "not yet confirmed" */}
                          <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[9px] md:text-[10px] font-bold ${RANK_BADGE_MUTED[projRank - 1] ?? 'bg-stone-100 text-slate-300'}`}>
                            {projRank}
                          </div>
                          {/* Rank movement arrow */}
                          {delta > 0 && (
                            <span className="text-[10px] md:text-[11px] font-semibold text-emerald-500 tabular-nums">
                              ↑{delta}
                            </span>
                          )}
                          {delta < 0 && (
                            <span className="text-[10px] md:text-[11px] font-semibold text-orange-400 tabular-nums">
                              ↓{Math.abs(delta)}
                            </span>
                          )}
                          {delta === 0 && (
                            <span className="text-[10px] md:text-[11px] text-slate-300">→</span>
                          )}
                          <span className="font-mono text-slate-400 italic">
                            ~{formatDollars(member.combined)}
                          </span>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
          {live && live.purse > 0 && (
            <p className="text-[11px] text-slate-400 text-right px-3 md:px-5 py-2.5 border-t border-stone-100">
              <span className="md:hidden">Projected · {live.tournamentName}</span>
              <span className="hidden md:inline">Projected based on current leaderboard position · {live.tournamentName} · ${live.purse.toLocaleString()} purse</span>
            </p>
          )}
          {live && live.purse === 0 && (
            <p className="text-[11px] text-slate-400 text-right px-5 py-2.5 border-t border-stone-100">
              Projections unavailable — purse not yet cached
            </p>
          )}
        </div>

        {/* Cumulative earnings chart */}
        {enrichedChartData.length > 0 && (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm px-5 pt-5 pb-3 mt-5">
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-4">Cumulative Earnings</p>
            <StandingsChart
              data={enrichedChartData}
              members={members}
              projectedLabel={projectedLabel ?? undefined}
              lastCompletedLabel={lastCompletedLabel}
            />
          </div>
        )}

        {/* Weekly earnings chart */}
        {enrichedWeeklyData.length > 0 && (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm px-5 pt-5 pb-3 mt-5">
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-4">Earnings by Tournament</p>
            <StandingsChart
              data={enrichedWeeklyData}
              members={members}
              projectedLabel={projectedLabel ?? undefined}
              lastCompletedLabel={lastCompletedLabel}
            />
          </div>
        )}

      </div>
    </main>
  )
}
