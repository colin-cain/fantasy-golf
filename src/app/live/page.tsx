import { supabase } from '@/lib/supabase'
import Link from 'next/link'

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

async function getLiveTournament(): Promise<Tournament | null> {
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
    .eq('status', 'in_progress')
    .limit(1)
    .single()

  if (error || !data) return null
  return (data as unknown) as Tournament
}

export default async function LivePage() {
  const tournament = await getLiveTournament()

  if (!tournament) {
    return (
      <main className="min-h-screen bg-stone-100">
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <p className="text-4xl mb-4">⛳</p>
          <h1 className="text-xl font-semibold text-slate-700">No tournament in progress</h1>
          <p className="text-slate-400 text-sm mt-2">Check the{' '}
            <Link href="/schedule" className="text-orange-500 hover:underline">schedule</Link>
            {' '}for upcoming events.
          </p>
        </div>
      </main>
    )
  }

  const sortedPicks = [...tournament.picks].sort(
    (a, b) => b.earnings - a.earnings
  )

  const hasSomeEarnings = sortedPicks.some(p => p.earnings > 0)

  return (
    <main className="min-h-screen bg-stone-100">
      <div className="max-w-2xl mx-auto px-4 py-12">

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              In Progress
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{tournament.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-500 text-sm">
              {new Date(tournament.start_date).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'
              })}
            </p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_STYLES[tournament.type]}`}>
              {TYPE_LABELS[tournament.type]}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100 text-xs uppercase tracking-widest text-slate-400">
                <th className="px-5 py-2.5 text-left">Member</th>
                <th className="px-5 py-2.5 text-left">Golfer</th>
                {hasSomeEarnings && (
                  <th className="px-5 py-2.5 text-right">Earnings</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {sortedPicks.map((pick) => (
                <tr key={pick.league_members.name} className="hover:bg-stone-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-900">
                    {pick.league_members.name}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {pick.golfer_name}
                  </td>
                  {hasSomeEarnings && (
                    <td className={`px-5 py-3.5 text-right font-mono font-semibold ${pick.earnings > 0 ? 'text-emerald-700' : 'text-slate-300'}`}>
                      {pick.earnings > 0 ? `$${pick.earnings.toLocaleString()}` : '—'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {!hasSomeEarnings && (
            <p className="text-xs text-slate-400 text-center py-3 border-t border-stone-100">
              Earnings will appear here once the tournament wraps up
            </p>
          )}
        </div>

      </div>
    </main>
  )
}
