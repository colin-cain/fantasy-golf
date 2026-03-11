import { supabaseAdmin as supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

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
  purse: number | null
  draft_order: DraftSlot[]
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

async function getSchedule(): Promise<Tournament[]> {
  const { data, error } = await supabase
    .from('tournaments')
    .select(`
      id, name, type, start_date, status, purse,
      draft_order(
        pick_position,
        league_members(name)
      )
    `)
    .eq('season_year', 2026)
    .order('start_date', { ascending: true })

  if (error) throw error
  return (data as unknown) as Tournament[]
}

export default async function SchedulePage() {
  const tournaments = await getSchedule()

  const completed = tournaments.filter((t) => t.status === 'completed')
  const upcoming = tournaments.filter((t) => t.status !== 'completed')

  return (
    <main className="min-h-screen bg-stone-100">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-12">

        <div className="mb-5 sm:mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Schedule</h1>
          <p className="text-slate-500 text-sm mt-1">
            2026 · {completed.length} completed · {upcoming.length} remaining
          </p>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden divide-y divide-stone-100">
          {tournaments.map((t) => {
            const done = t.status === 'completed'
            const sortedDraft = [...(t.draft_order || [])].sort(
              (a, b) => a.pick_position - b.pick_position
            )

            return (
              <div key={t.id} className={`pl-4 pr-5 py-4 transition-colors border-l-2 ${done ? 'bg-stone-50 border-l-emerald-300' : 'hover:bg-stone-50 border-l-transparent'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div>
                      <p className={`font-medium text-sm ${done ? 'text-slate-400' : 'text-slate-900'}`}>{t.name}</p>
                      <p className={`text-xs mt-0.5 ${done ? 'text-slate-300' : 'text-slate-400'}`}>
                        {new Date(t.start_date).toLocaleDateString('en-US', {
                          month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'
                        })}
                      </p>
                    </div>
                  </div>
                  <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${done ? 'bg-stone-100 text-slate-400 border border-stone-200' : TYPE_STYLES[t.type]}`}>
                    {TYPE_LABELS[t.type]}
                  </span>
                </div>

                {/* Purse */}
                <p className={`text-xs mt-2 ${done ? 'text-slate-300' : 'text-slate-400'}`}>
                  {t.purse != null && t.purse > 0 ? `$${t.purse.toLocaleString()} purse` : 'Purse TBD'}
                </p>

                {/* Draft order */}
                {sortedDraft.length > 0 && (
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-3">
                    <span className={`text-xs mr-1 ${done ? 'text-slate-300' : 'text-slate-500'}`}>Draft order:</span>
                    {sortedDraft.map((slot, i) => (
                      <span key={slot.pick_position} className="flex items-center gap-1">
                        <span className={`text-xs ${done ? 'text-slate-400' : 'text-slate-700'}`}>{slot.league_members.name}</span>
                        {i < sortedDraft.length - 1 && (
                          <span className={`text-xs ${done ? 'text-slate-300' : 'text-slate-400'}`}>→</span>
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
