'use client'

import { useEffect, useState } from 'react'

type Props = {
  name: string
  type: string
  startDate: string // "YYYY-MM-DD"
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

function getTimeLeft(targetDate: string) {
  const now  = Date.now()
  const end  = new Date(targetDate).getTime() // midnight UTC of start_date
  const diff = end - now

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

export default function CountdownBanner({ name, type, startDate }: Props) {
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft>>(null)

  useEffect(() => {
    // Set immediately so the client matches quickly
    setTimeLeft(getTimeLeft(startDate))
    const id = setInterval(() => setTimeLeft(getTimeLeft(startDate)), 1_000)
    return () => clearInterval(id)
  }, [startDate])

  // Hide if not yet hydrated or tournament already started
  if (!timeLeft) return null

  const { days, hours, minutes, seconds } = timeLeft

  return (
    <div className="bg-white border-b border-stone-200">
      <div className="max-w-4xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-0">

        {/* Left — label + tournament name + type badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">
            Next up
          </span>
          <span className="text-sm font-semibold text-slate-800">{name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_STYLES[type] ?? ''}`}>
            {TYPE_LABELS[type] ?? type}
          </span>
        </div>

        {/* Right — live countdown */}
        <div className="flex items-center gap-2.5 font-mono">
          {[
            { value: days,    unit: 'd' },
            { value: hours,   unit: 'h' },
            { value: minutes, unit: 'm' },
            { value: seconds, unit: 's' },
          ].map(({ value, unit }) => (
            <div key={unit} className="flex items-baseline gap-0.5">
              <span className="text-sm font-bold text-slate-900 tabular-nums">
                {pad(value)}
              </span>
              <span className="text-[11px] text-slate-400">{unit}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
