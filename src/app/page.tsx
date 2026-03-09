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
  roundStatus: string | null
} | null> {
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name, purse, round_status')
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

  return { tournamentName: tournament.name, purse, projections, roundStatus: (tournament.round_status as string | null) ?? null }
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

function Dollars({ n, prefix = '' }: { n: number; prefix?: string }) {
  return <>{prefix}${n.toLocaleString()}</>
}

export default async function HomePage() {
  const [standings, { chartData, weeklyData, members }, liveReal] = await Promise.all([
    getStandings(),
    getChartData(),
    getLiveProjections(),
  ])

  // TEMP: mock live data for projected standings preview — remove before merging
  const mockProjections = Object.fromEntries(
    standings.map((s, i) => [s.name, [1_440_000, 864_000, 540_000, 360_000, 270_000, 198_000][i] ?? 0])
  )
  const live = liveReal ?? {
    tournamentName: 'The Players Championship',
    purse: 25_000_000,
    projections: mockProjections,
    roundStatus: 'In Progress',
  }

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
          </p>
        </div>

        {/* Actual standings table */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-100 flex items-center gap-2">
            <span className="w-1.5 h-1.5 flex-shrink-0 invisible" />
            <span className="text-xs uppercase tracking-widest text-slate-400 font-medium max-w-[7rem] sm:max-w-none">Current Standings</span>
          </div>
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col className="w-[28%]" />
              <col />
              <col className="w-[26%]" />
            </colgroup>
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-xs uppercase tracking-widest text-slate-400">
                <th className="px-2 sm:px-4 py-3 text-left tracking-tight">Position</th>
                <th className="px-2 sm:px-4 py-3 text-left tracking-tight">Player</th>
                <th className="px-2 sm:px-5 py-3 text-right leading-tight tracking-tight">Cumulative Earnings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {sorted.map((member, index) => {
                const pct = Math.round((member.total_earnings / maxValue) * 100)
                return (
                  <tr key={member.name} className="hover:bg-stone-50 transition-colors">
                    <td className="px-2 sm:px-4 py-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${RANK_BADGE[index] ?? 'bg-stone-100 text-slate-400'}`}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-3">
                      <span className="font-medium text-slate-900">{member.name}</span>
                      {!live && (
                        <div className="mt-1.5 h-1 rounded-full bg-stone-100 overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-400" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </td>
                    <td className="px-2 sm:px-5 py-3 text-right font-mono text-slate-900 font-semibold text-xs sm:text-sm">
                      <Dollars n={member.total_earnings} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Projected standings card — only shown during a live tournament */}
        {live && (() => {
          const projectedSorted = [...enriched].sort((a, b) => b.combined - a.combined)
          const actualRankMap = new Map(sorted.map((m, i) => [m.name, i + 1]))
          return (
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden mt-5">
              <div className="px-5 py-3 border-b border-stone-100 flex items-center gap-2">
                {live.roundStatus === 'Suspended'
                  ? <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  : <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                }
                <span className="text-xs uppercase tracking-widest text-slate-400 font-medium">Projected Standings</span>
                <div className="ml-auto flex items-center gap-2 text-[11px] text-slate-400">
                  {live.roundStatus === 'Suspended' && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200 font-medium uppercase tracking-wide text-[10px]">Suspended</span>
                  )}
                  <span>{live.tournamentName}{live.purse > 0 ? ` · $${(live.purse / 1_000_000).toFixed(0)}M purse` : ''}</span>
                </div>
              </div>
              <table className="w-full text-sm table-fixed">
                <colgroup>
                  <col className="w-[17%]" />
                  <col className="w-[26%]" />
                  <col className="w-[24%]" />
                  <col className="w-[33%]" />
                </colgroup>
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-xs uppercase tracking-widest text-slate-400">
                    <th className="px-2 sm:px-4 py-3 text-left tracking-tight">Position</th>
                    <th className="px-2 sm:px-4 py-3 text-left tracking-tight">Player</th>
                    <th className="px-2 sm:px-5 py-3 text-right leading-tight tracking-tight">This Week</th>
                    <th className="px-2 sm:px-5 py-3 text-right leading-tight tracking-tight">Cumulative Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {projectedSorted.map((member, index) => {
                    const projRank = index + 1
                    const actualRank = actualRankMap.get(member.name) ?? projRank
                    const delta = actualRank - projRank  // positive = moving up
                    return (
                      <tr key={member.name} className="hover:bg-stone-50 transition-colors">
                        <td className="px-2 sm:px-4 py-3">
                          <div className="flex items-center gap-1">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${RANK_BADGE_MUTED[index] ?? 'bg-stone-100 text-slate-300'}`}>
                              {projRank}
                            </div>
                            {delta > 0 && <span className="text-xs font-semibold text-emerald-500">↑{delta}</span>}
                            {delta < 0 && <span className="text-xs font-semibold text-orange-400">↓{Math.abs(delta)}</span>}
                            {delta === 0 && <span className="text-xs text-slate-300">–</span>}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-3">
                          <span className="font-medium text-slate-900">{member.name}</span>
                        </td>
                        <td className="px-2 sm:px-5 py-3 text-right font-mono text-slate-400 italic text-xs sm:text-sm">
                          {member.projected > 0 ? <Dollars n={member.projected} /> : '—'}
                        </td>
                        <td className="px-2 sm:px-5 py-3 text-right font-mono text-slate-700 font-semibold italic text-xs sm:text-sm">
                          <Dollars n={member.combined} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <p className="text-[11px] text-slate-400 px-5 py-2.5 border-t border-stone-100">
                Projected based on current leaderboard position · updates automatically
              </p>
            </div>
          )
        })()}

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
