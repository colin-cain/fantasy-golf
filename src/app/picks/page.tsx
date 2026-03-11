import { supabaseAdmin as supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

type UsedPick = {
  golfer_name: string
  league_members: { name: string }
  tournaments: { id: string; name: string; start_date: string }
}

type MemberPick = {
  golfer: string
  tournament: string
  startDate: string
  pending?: boolean
}

type MemberUsed = {
  member: string
  picks: MemberPick[]
}

const MEMBER_ORDER = ['Ben', 'Ty', 'JJ', 'Jake', 'Chris', 'Colin']

const NUMBER_WORDS = ['zero','one','two','three','four','five','six','seven',
  'eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen',
  'sixteen','seventeen','eighteen','nineteen','twenty']

async function getData(): Promise<{ members: MemberUsed[]; completedCount: number }> {
  const [picksResult, inProgressResult] = await Promise.all([
    supabase
      .from('picks')
      .select(`
        golfer_name,
        league_members(name),
        tournaments(id, name, start_date)
      `)
      .order('start_date', { referencedTable: 'tournaments', ascending: true }),
    supabase
      .from('tournaments')
      .select('id, name')
      .in('status', ['in_progress', 'upcoming'])
      .order('start_date', { ascending: true })
      .limit(1)
      .single(),
  ])

  if (picksResult.error) throw picksResult.error

  const byMember: Record<string, MemberPick[]> = {}
  const pickedTournamentIds: Record<string, Set<string>> = {}

  for (const pick of (picksResult.data as unknown) as UsedPick[]) {
    const name = pick.league_members.name
    if (!byMember[name]) {
      byMember[name] = []
      pickedTournamentIds[name] = new Set()
    }
    byMember[name].push({ golfer: pick.golfer_name, tournament: pick.tournaments.name, startDate: pick.tournaments.start_date })
    pickedTournamentIds[name].add(pick.tournaments.id)
  }

  const inProgress = inProgressResult.data ?? null

  // Count distinct tournaments from actual (non-pending) picks
  const completedCount = new Set(
    Object.values(byMember).flat().map(p => p.tournament)
  ).size

  const members = MEMBER_ORDER
    .map(member => ({
      member,
      picks: [
        ...(byMember[member] ?? []).sort((a, b) => a.startDate.localeCompare(b.startDate)),
        ...(inProgress && !pickedTournamentIds[member]?.has(inProgress.id)
          ? [{ golfer: 'Pending', tournament: inProgress.name, startDate: '9999', pending: true }]
          : []),
      ],
    }))
    .filter(m => m.picks.length > 0)

  return { members, completedCount }
}

export default async function GolfersPage() {
  const { members, completedCount } = await getData()
  const countWord = NUMBER_WORDS[completedCount] ?? String(completedCount)

  return (
    <main className="min-h-screen bg-stone-100">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-12">

        <div className="mb-5 sm:mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pick History</h1>
          <p className="text-slate-500 text-sm mt-1">
            2026 · Picks through {countWord} tournament{completedCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {members.map(({ member, picks }) => {
            const usedCount = picks.filter(p => !p.pending).length
            return (
              <div key={member} className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">

                {/* Member header */}
                <div className="px-5 py-3 flex items-center justify-between border-b border-stone-100">
                  <h2 className="font-semibold text-slate-900">{member}</h2>
                  <span className="text-xs text-slate-400">{usedCount} used</span>
                </div>

                {/* Picks list */}
                <ul className="divide-y divide-stone-100">
                  {picks.map(({ golfer, tournament, pending }) => (
                    <li
                      key={tournament}
                      className={`px-5 py-3 flex items-center justify-between hover:bg-stone-50 transition-colors ${pending ? 'opacity-50' : ''}`}
                    >
                      <span className={`text-sm font-medium ${pending ? 'text-slate-400 italic' : 'text-slate-900'}`}>
                        {golfer}
                      </span>
                      <span className="text-xs text-slate-400 ml-4 text-right">{tournament}</span>
                    </li>
                  ))}
                </ul>

              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
