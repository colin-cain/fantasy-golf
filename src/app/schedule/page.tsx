import { supabase } from '@/lib/supabase'

type DraftSlot = {
  pick_position: number
  league_members: { name: string }
}

type Tournament = {
  id: string
  name: string
  type: string
  start_date: string
  status: string
  draft_order: DraftSlot[]
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

async function getSchedule(): Promise<Tournament[]> {
  const { data, error } = await supabase
    .from('tournaments')
    .select(`
      id, name, type, start_date, status,
      draft_order(
        pick_position,
        league_members(name)
      )
    `)
    .eq('season_year', 2026)
    .order('start_date', { ascending: true })

  if (error) throw error
  return data as Tournament[]
}

export default async function SchedulePage() {
  const tournaments = await getSchedule()

  const completed = tournaments.filter((t) => t.status === 'completed')
  const upcoming = tournaments.filter((t) => t.status !== 'completed')

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-12">

        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
          <p className="text-gray-400 mt-1">
            2026 Season · {completed.length} completed · {upcoming.length} remaining
          </p>
        </div>

        <div className="rounded-xl border border-gray-800 overflow-hidden divide-y divide-gray-800">
          {tournaments.map((t) => {
            const done = t.status === 'completed'
            const sortedDraft = [...(t.draft_order || [])].sort(
              (a, b) => a.pick_position - b.pick_position
            )

            return (
              <div key={t.id} className={`px-5 py-4 transition-colors ${done ? 'bg-gray-900/40' : 'hover:bg-gray-900'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {done && <span className="text-green-600 text-base">✓</span>}
                    <div>
                      <p className={`font-medium text-sm ${done ? 'text-gray-500' : 'text-white'}`}>{t.name}</p>
                      <p className={`text-xs mt-0.5 ${done ? 'text-gray-600' : 'text-gray-500'}`}>
                        {new Date(t.start_date).toLocaleDateString('en-US', {
                          month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'
                        })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${done ? 'bg-gray-800 text-gray-600 border border-gray-700' : TYPE_STYLES[t.type]}`}>
                    {TYPE_LABELS[t.type]}
                  </span>
                </div>

                {/* Draft order — only show for upcoming */}
                {!done && sortedDraft.length > 0 && (
                  <div className="flex items-center gap-2 mt-3 pl-0">
                    <span className="text-xs text-gray-600 mr-1">Draft order:</span>
                    {sortedDraft.map((slot, i) => (
                      <span key={slot.pick_position} className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">{slot.league_members.name}</span>
                        {i < sortedDraft.length - 1 && (
                          <span className="text-gray-700 text-xs">→</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </main>
  )
}
