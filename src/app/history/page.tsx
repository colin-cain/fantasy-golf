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
  major:     'bg-green-900 text-green-300 border border-green-700',
  signature: 'bg-yellow-900 text-yellow-300 border border-yellow-700',
  regular:   'bg-gray-800 text-gray-400 border border-gray-700',
}

const TYPE_LABELS: Record<string, string> = {
  major:     'Major',
  signature: 'Signature',
  regular:   'Regular',
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
  return data as Tournament[]
}

export default async function HistoryPage() {
  const tournaments = await getHistory()

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-12">

        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">Tournament History</h1>
          <p className="text-gray-400 mt-1">2026 Season · {tournaments.length} tournaments completed</p>
        </div>

        <div className="flex flex-col gap-6">
          {tournaments.map((tournament) => {
            const sortedPicks = [...tournament.picks].sort((a, b) => b.earnings - a.earnings)
            const winner = sortedPicks[0]

            return (
              <div key={tournament.id} className="rounded-xl border border-gray-800 overflow-hidden">

                {/* Tournament header */}
                <div className="bg-gray-900 px-5 py-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">{tournament.name}</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
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
                    <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-gray-800">
                      <th className="px-5 py-2.5 text-left">Member</th>
                      <th className="px-5 py-2.5 text-left">Golfer</th>
                      <th className="px-5 py-2.5 text-right">Earnings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {sortedPicks.map((pick) => {
                      const isWinner = pick.earnings === winner.earnings && winner.earnings > 0
                      return (
                        <tr key={pick.league_members.name} className="bg-gray-950 hover:bg-gray-900 transition-colors">
                          <td className="px-5 py-3 font-medium flex items-center gap-2">
                            {isWinner && <span className="text-yellow-400">🏆</span>}
                            {pick.league_members.name}
                          </td>
                          <td className="px-5 py-3 text-gray-300">{pick.golfer_name}</td>
                          <td className={`px-5 py-3 text-right font-mono ${pick.earnings > 0 ? 'text-green-400' : 'text-gray-600'}`}>
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
