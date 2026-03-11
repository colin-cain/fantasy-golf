'use client'

import { useEffect, useState } from 'react'

type Props = {
  name: string
  type: string
  startDate: string         // "YYYY-MM-DD" — fallback if no picks_deadline
  teeTime: string | null    // actual first tee time — used by cron logic, not the countdown
  picksDeadline: string | null // ISO 8601 UTC — what the countdown counts down to
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

function resolveTarget(startDate: string, teeTime: string | null): string {
  if (teeTime) return teeTime
  return startDate + 'T12:00:00Z'
}

function getTimeLeft(target: string) {
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

export default function CountdownBanner({ name, type, startDate, teeTime, inProgress = false }: Props) {
  const target = resolveTarget(startDate, teeTime)
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft>>(null)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    setInitialized(true)
    setTimeLeft(getTimeLeft(target))
    const id = setInterval(() => setTimeLeft(getTimeLeft(target)), 1_000)
    return () => clearInterval(id)
  }, [target])

  if (!initialized) return null

  // Tee time has passed — hide banner for upcoming, show "In Progress" for in_progress
  if (!timeLeft && !inProgress) return null

  // Underway = DB says in_progress AND tee time has passed
  const underway = inProgress && !timeLeft

  return (
    <div className="bg-white border-b border-stone-200">
      <div className="max-w-4xl mx-auto px-4 py-2">

        {/* Row 1 — status label */}
        {underway ? (
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest font-medium text-emerald-600">In Progress</span>
          </div>
        ) : (
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium mb-0.5">Next up</p>
        )}

        {/* Row 2 — tournament name + badge + countdown */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold text-slate-800 truncate">{name}</span>
            <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_STYLES[type] ?? ''}`}>
              {TYPE_LABELS[type] ?? type}
            </span>
          </div>
          {timeLeft && (
            <div className="flex items-center gap-2.5 font-mono flex-shrink-0">
              {(timeLeft.days >= 1
                ? [
                    { value: timeLeft.days,    unit: 'd' },
                    { value: timeLeft.hours,   unit: 'h' },
                    { value: timeLeft.minutes, unit: 'm' },
                  ]
                : [
                    { value: timeLeft.hours,   unit: 'h' },
                    { value: timeLeft.minutes, unit: 'm' },
                    { value: timeLeft.seconds, unit: 's' },
                  ]
              ).map(({ value, unit }) => (
                <div key={unit} className="flex items-baseline gap-0.5">
                  <span className="text-sm font-bold text-slate-900 tabular-nums">{pad(value)}</span>
                  <span className="text-[11px] text-slate-400">{unit}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
