import { supabase } from '@/lib/supabase'

type Standing = {
  name: string
  total_earnings: number
}

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

const RANK_STYLES = [
  'text-orange-600 font-bold',
  'text-indigo-600 font-bold',
  'text-emerald-700 font-bold',
  'text-slate-500',
  'text-slate-400',
  'text-slate-400',
]

export default async function HomePage() {
  const standings = await getStandings()

  return (
    <main className="min-h-screen bg-stone-100">
      <div className="max-w-2xl mx-auto px-4 py-12">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Season Standings</h1>
          <p className="text-slate-500 text-sm mt-1">2026 · based on PGA Tour prize earnings</p>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-xs uppercase tracking-widest text-slate-400">
                <th className="px-5 py-3 text-left w-12">#</th>
                <th className="px-5 py-3 text-left">Player</th>
                <th className="px-5 py-3 text-right">Earnings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {standings.map((member, index) => (
                <tr key={member.name} className="hover:bg-stone-50 transition-colors">
                  <td className={`px-5 py-4 font-mono text-sm ${RANK_STYLES[index] ?? 'text-slate-400'}`}>
                    {index + 1}
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-900">{member.name}</td>
                  <td className="px-5 py-4 text-right font-mono text-emerald-700 font-semibold">
                    ${member.total_earnings.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </main>
  )
}
