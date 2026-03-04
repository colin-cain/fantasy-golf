'use client'

import { useEffect, useState } from 'react'

type Props = {
  startDate: string
  teeTime: string | null
}

function resolveTarget(startDate: string, teeTime: string | null) {
  return teeTime ?? startDate + 'T12:00:00Z'
}

export default function TournamentStatusLabel({ startDate, teeTime }: Props) {
  const [underway, setUnderway] = useState(false)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const target = resolveTarget(startDate, teeTime)
    const check = () => setUnderway(new Date(target).getTime() <= Date.now())
    check()
    setInitialized(true)
    const id = setInterval(check, 10_000)
    return () => clearInterval(id)
  }, [startDate, teeTime])

  if (!initialized) return null

  return underway ? (
    <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 mb-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      In Progress
    </span>
  ) : (
    <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-medium mb-1.5">
      Next up
    </span>
  )
}
