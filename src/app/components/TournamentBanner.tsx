'use client'

import CountdownBanner from './CountdownBanner'

type TickerPick = {
  member: string
  golfer: string
  position: string | null
  total: string | null
  roundScore: string | null
  thru: string | null
  teeTime: string | null
}

type Props = {
  name: string
  type: string
  startDate: string
  teeTime: string | null
  inProgress: boolean
  picks?: TickerPick[]
}

const TYPE_STYLES: Record<string, string> = {
  major:     'bg-emerald-100 text-emerald-700 border border-emerald-200',
  signature: 'bg-orange-100 text-orange-600 border border-orange-200',
  regular:   'bg-indigo-100 text-indigo-600 border border-indigo-200',
}

const TYPE_LABELS: Record<string, string> = {
  major:     'Major',
  signature: 'Signature',
  regular:   'Regular',
}

export default function TournamentBanner({ name, type, startDate, teeTime, inProgress, picks = [] }: Props) {

  // ── Live ticker mode ──────────────────────────────────────────────────────
  if (inProgress && picks.length > 0) {
    return (
      <div className="w-full bg-white border-b border-stone-200 overflow-hidden">
        <style>{`
          @keyframes fgl-ticker {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .fgl-ticker-track {
            animation: fgl-ticker 32s linear infinite;
          }
        `}</style>
        <div className="flex items-stretch h-10">

          {/* Fixed left: LIVE + tournament name + type badge — single line */}
          <div className="flex-shrink-0 flex items-center gap-2 px-4 w-[411px] overflow-hidden border-r border-stone-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <span className="text-emerald-700 text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap flex-shrink-0">In Progress</span>
            <span className="ml-2 text-zinc-700 text-xs font-medium whitespace-nowrap">{name}</span>
            {TYPE_LABELS[type] && (
              <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-medium leading-none ${TYPE_STYLES[type] ?? ''}`}>
                {TYPE_LABELS[type]}
              </span>
            )}
          </div>

          {/* Scrolling ticker track */}
          <div className="flex-1 overflow-hidden flex items-center">
            <div className="fgl-ticker-track flex items-stretch whitespace-nowrap">
              {[...picks, ...picks].map(({ member, golfer, position, total, roundScore, thru, teeTime }, i) => {
                const lastName = golfer.split(' ').slice(1).join(' ') || golfer
                const scoreColor = total?.startsWith('-') ? 'text-red-600' : 'text-zinc-900'
                const roundColor = roundScore?.startsWith('-') ? 'text-red-500' : 'text-zinc-400'
                const notStarted = !thru || thru === '0'
                const tsMs = teeTime ? parseInt(teeTime) : NaN
                const formattedTeeTime = !isNaN(tsMs) && tsMs > 0
                  ? new Date(tsMs).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
                  : (teeTime ?? '–')
                const thruDisplay = notStarted ? formattedTeeTime : thru
                return [
                  <span key={`item-${i}`} className="inline-flex items-center gap-2 px-5">
                    <span className="font-mono text-zinc-400 text-xs">{position ?? '–'}</span>
                    <span className="text-slate-800 text-xs font-semibold">{lastName}</span>
                    <span className="text-zinc-500 text-xs font-medium">({member})</span>
                    <span className={`font-mono font-bold text-xs ${scoreColor}`}>{total ?? '–'}</span>
                    {roundScore && <span className={`font-mono text-xs ${roundColor}`}>({roundScore})</span>}
                    <span className="text-zinc-400 text-xs">{thruDisplay}</span>
                  </span>,
                  <span key={`sep-${i}`} className="inline-block w-px h-4 bg-stone-200 self-center flex-shrink-0" />,
                ]
              })}
            </div>
          </div>

        </div>
      </div>
    )
  }

  // ── Countdown mode ────────────────────────────────────────────────────────
  return (
    <CountdownBanner
      name={name}
      type={type}
      startDate={startDate}
      teeTime={teeTime}
      inProgress={inProgress}
    />
  )
}
