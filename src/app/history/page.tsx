import { supabase } from '@/lib/supabase'

type Pick = {
  golfer_name: string
  earnings: number
  league_members: { name: string }
}

type Tournament = {
  id: string
  name: string
  type: string
  start_date: string
  picks: Pick[]
}

const TYPE_STYLES: Record<string, string> = {
  major:     'bg-emerald-50 text-emerald-700 border border-emerald-200',
  signature: 'bg-orange-50 text-orange-600 border border-orange-200',
  regular:   'bg-indigo-50 text-indigo-600 border border-indigo-200',
}

const TYPE_LABELS: Record<string, string> = {
  major:     'Major',
  signature: 'Signature',
  regular:   'Regular',
}

const RANK_BADGE = [
  'bg-amber-400 text-white',                             // 1st — gold
  'bg-slate-300 text-slate-600',                         // 2nd — silver
  'bg-orange-800 text-orange-100',                       // 3rd — bronze
  'bg-stone-100 text-slate-400 border border-stone-200', // 4th+
]

function getRankBadge(rank: number) {
  return RANK_BADGE[rank] ?? RANK_BADGE[3]
}

async function getHistory(): Promise<Tournament[]> {
  const { data, error } = await supabase
    .from('tournaments')
    .select(`
      id, name, type, start_date,
      picks(
        golfer_name,
        earnings,
        league_members(name)
      )
    `)
    .eq('status', 'completed')
    .order('start_date', { ascending: true })

  if (error) throw error
  return (data as unknown) as Tournament[]
}

export default async function HistoryPage() {
  const tournaments = await getHistory()

  return (
    <main className="min-h-screen bg-stone-100">
      <div className="max-w-2xl mx-auto px-4 py-12">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tournament Results</h1>
          <p className="text-slate-500 text-sm mt-1">2026 · {tournaments.length} tournaments completed</p>
        </div>

        <div className="flex flex-col gap-5">
          {tournaments.map((tournament) => {
            const sortedPicks = [...tournament.picks].sort((a, b) => b.earnings - a.earnings)

            // Dense rank by earnings — ties share the same rank, $0 earners get null
            const uniqueEarnings = [...new Set(sortedPicks.map(p => p.earnings).filter(e => e > 0))]
              .sort((a, b) => b - a)
            const earningsRank = new Map(uniqueEarnings.map((e, i) => [e, i]))

            return (
              <div key={tournament.id} className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">

                {/* Tournament header */}
                <div className="px-5 py-4 flex items-center justify-between border-b border-stone-100">
                  <div>
                    <h2 className="font-semibold text-slate-900">{tournament.name}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(tournament.start_date).toLocaleDateString('en-US', {
                        month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'
                      })}
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${TYPE_STYLES[tournament.type]}`}>
                    {TYPE_LABELS[tournament.type]}
                  </span>
                </div>

                {/* Picks table */}
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-100 text-xs uppercase tracking-widest text-slate-400">
                      <th className="px-3 sm:px-5 py-2.5 text-left w-12">#</th>
                      <th className="px-3 sm:px-5 py-2.5 text-left">Member</th>
                      <th className="hidden sm:table-cell px-5 py-2.5 text-left">Golfer</th>
                      <th className="px-3 sm:px-5 py-2.5 text-right">Earnings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {sortedPicks.map((pick) => {
                      const rank = pick.earnings > 0 ? earningsRank.get(pick.earnings) ?? 3 : null
                      return (
                        <tr key={pick.league_members.name} className="hover:bg-stone-50 transition-colors">
                          <td className="px-3 sm:px-5 py-3">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${rank !== null ? getRankBadge(rank) : 'bg-stone-100 text-slate-300 border border-stone-200'}`}>
                              {rank !== null ? rank + 1 : '—'}
                            </div>
                          </td>
                          <td className="px-3 sm:px-5 py-3 font-medium text-slate-900">
                            {pick.league_members.name}
                            <span className="block text-xs text-slate-400 font-normal sm:hidden">{pick.golfer_name}</span>
                          </td>
                          <td className="hidden sm:table-cell px-5 py-3 text-slate-600">{pick.golfer_name}</td>
                          <td className={`px-3 sm:px-5 py-3 text-right font-mono font-semibold ${pick.earnings > 0 ? 'text-emerald-700' : 'text-slate-300'}`}>
                            {pick.earnings > 0 ? `$${pick.earnings.toLocaleString()}` : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
