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

  // Aggregate earnings by member
  const totals: Record<string, number> = {}
  for (const row of data as any[]) {
    const name = row.league_members.name
    totals[name] = (totals[name] || 0) + row.earnings
  }

  return Object.entries(totals)
    .map(([name, total_earnings]) => ({ name, total_earnings }))
    .sort((a, b) => b.total_earnings - a.total_earnings)
}

export default async function HomePage() {
  const standings = await getStandings()

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">Stop Crying Schrette</h1>
          <p className="text-gray-400 mt-1">2026 Fantasy Golf · Season Standings</p>
        </div>

        {/* Standings table */}
        <div className="rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-5 py-3 text-left w-10">Rank</th>
                <th className="px-5 py-3 text-left">Player</th>
                <th className="px-5 py-3 text-right">Earnings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {standings.map((member, index) => (
                <tr key={member.name} className="bg-gray-950 hover:bg-gray-900 transition-colors">
                  <td className="px-5 py-4 text-gray-500 font-mono">{index + 1}</td>
                  <td className="px-5 py-4 font-medium">{member.name}</td>
                  <td className="px-5 py-4 text-right font-mono text-green-400">
                    ${member.total_earnings.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-600 mt-4 text-right">Based on PGA Tour prize earnings</p>
      </div>
    </main>
  )
}
