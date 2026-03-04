import { supabase } from '@/lib/supabase'

type UsedPick = {
  golfer_name: string
  league_members: { name: string }
  tournaments: { name: string; start_date: string }
}

type MemberUsed = {
  member: string
  picks: { golfer: string; tournament: string }[]
}

const MEMBER_ORDER = ['Ben', 'Ty', 'JJ', 'Jake', 'Chris', 'Colin']

async function getUsedGolfers(): Promise<MemberUsed[]> {
  const { data, error } = await supabase
    .from('picks')
    .select(`
      golfer_name,
      league_members(name),
      tournaments(name, start_date)
    `)
    .order('start_date', { referencedTable: 'tournaments', ascending: true })

  if (error) throw error

  const byMember: Record<string, { golfer: string; tournament: string }[]> = {}

  for (const pick of (data as unknown) as UsedPick[]) {
    const name = pick.league_members.name
    if (!byMember[name]) byMember[name] = []
    byMember[name].push({
      golfer: pick.golfer_name,
      tournament: pick.tournaments.name,
    })
  }

  return MEMBER_ORDER
    .filter((m) => byMember[m])
    .map((member) => ({ member, picks: byMember[member] }))
}

export default async function GolfersPage() {
  const members = await getUsedGolfers()
  const totalUsed = members.reduce((sum, m) => sum + m.picks.length, 0)

  return (
    <main className="min-h-screen bg-stone-100">
      <div className="max-w-4xl mx-auto px-4 py-12">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Used Golfers</h1>
          <p className="text-slate-500 text-sm mt-1">2026 · {totalUsed} picks made across all members</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {members.map(({ member, picks }) => (
            <div key={member} className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">

              {/* Member header */}
              <div className="px-5 py-3 flex items-center justify-between border-b border-stone-100">
                <h2 className="font-semibold text-slate-900">{member}</h2>
                <span className="text-xs text-slate-400">{picks.length} used</span>
              </div>

              {/* Used golfers list */}
              <ul className="divide-y divide-stone-100">
                {picks.map(({ golfer, tournament }) => (
                  <li key={golfer} className="px-5 py-3 flex items-center justify-between hover:bg-stone-50 transition-colors">
                    <span className="text-sm font-medium text-slate-900">{golfer}</span>
                    <span className="text-xs text-slate-400 ml-4 text-right">{tournament}</span>
                  </li>
                ))}
              </ul>

            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
