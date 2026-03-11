'use client'

import { useEffect, useState } from 'react'

type Props = {
  name: string
  type: string
  startDate: string         // "YYYY-MM-DD" — fallback if no picks_deadline
  teeTime: string | null    // ISO 8601 UTC — tee-time countdown target
  picksDeadline: string | null // ISO 8601 UTC — picks-due countdown target
  inProgress?: boolean      // true when status = in_progress in the DB
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

type TimeLeft = { days: number; hours: number; minutes: number; seconds: number }

function getTimeLeft(target: string | null): TimeLeft | null {
  if (!target) return null
  const diff = new Date(target).getTime() - Date.now()
  if (diff <= 0) return null
  return {
    days:    Math.floor(diff / 86_400_000),
    hours:   Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000)  / 60_000),
    seconds: Math.floor((diff % 60_000)     / 1_000),
  }
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

// Show d/h/m when more than a day away; h/m/s when under a day
function CountdownDigits({ t }: { t: TimeLeft }) {
  const units = t.days > 0
    ? [{ value: t.days, unit: 'd' }, { value: t.hours, unit: 'h' }, { value: t.minutes, unit: 'm' }]
    : [{ value: t.hours, unit: 'h' }, { value: t.minutes, unit: 'm' }, { value: t.seconds, unit: 's' }]
  return (
    <div className="flex items-baseline gap-1 font-mono">
      {units.map(({ value, unit }) => (
        <div key={unit} className="flex items-baseline gap-0.5">
          <span className="text-sm font-bold text-slate-900 tabular-nums">{pad(value)}</span>
          <span className="text-[11px] text-slate-400">{unit}</span>
        </div>
      ))}
    </div>
  )
}

export default function CountdownBanner({ name, type, startDate, teeTime, picksDeadline, inProgress = false }: Props) {
  const picksTarget = picksDeadline ?? (startDate + 'T01:00:00Z')

  const [picksLeft, setPicksLeft] = useState<TimeLeft | null>(null)
  const [teeLeft,   setTeeLeft]   = useState<TimeLeft | null>(null)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    setInitialized(true)
    function tick() {
      setPicksLeft(getTimeLeft(picksTarget))
      setTeeLeft(getTimeLeft(teeTime))
    }
    tick()
    const id = setInterval(tick, 1_000)
    return () => clearInterval(id)
  }, [picksTarget, teeTime])

  if (!initialized) return null

  // Hide banner once tee time passes (unless DB says in_progress)
  if (!teeLeft && !inProgress) return null

  const underway = inProgress && !teeLeft

  return (
    <div className="bg-white border-b border-stone-200">
      <div className="max-w-4xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">

        {/* Left — status label + tournament name + type badge */}
        <div className="flex items-center gap-2 flex-wrap">
          {underway ? (
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-medium text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              In Progress
            </span>
          ) : (
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">
              Next up
            </span>
          )}
          <span className="text-sm font-semibold text-slate-800">{name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_STYLES[type] ?? ''}`}>
            {TYPE_LABELS[type] ?? type}
          </span>
        </div>

        {/* Right — picks-due + tee-time countdowns */}
        {(picksLeft || teeLeft) && (
          <div className="flex items-center gap-3">
            {picksLeft && (
              <div className="flex flex-col items-end">
                <span className="text-[9px] uppercase tracking-widest text-slate-400 font-medium leading-tight">Picks due</span>
                <CountdownDigits t={picksLeft} />
              </div>
            )}
            {picksLeft && teeLeft && (
              <div className="w-px h-7 bg-stone-200 flex-shrink-0" />
            )}
            {teeLeft && (
              <div className="flex flex-col items-end">
                <span className="text-[9px] uppercase tracking-widest text-slate-400 font-medium leading-tight">Tee time</span>
                <CountdownDigits t={teeLeft} />
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
