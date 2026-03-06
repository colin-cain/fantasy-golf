'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'

export type ChartPoint = Record<string, string | number>

const MEMBER_COLORS: Record<string, string> = {
  Ben:   '#f97316', // orange
  Ty:    '#ef4444', // red
  JJ:    '#3b82f6', // blue
  Jake:  '#10b981', // emerald
  Chris: '#8b5cf6', // violet
  Colin: '#06b6d4', // cyan
}

function formatDollars(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  const tournament = payload[0]?.payload?.tournament ?? label
  const isProjected = typeof tournament === 'string' && tournament.includes('(Live)')
  const sorted = [...payload].sort((a, b) => b.value - a.value)

  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-lg px-4 py-3 text-xs font-mono min-w-[180px]">
      <p className="text-slate-500 mb-2 font-sans text-[11px] uppercase tracking-widest">{tournament}</p>
      {isProjected && (
        <p className="text-[10px] text-emerald-500 mb-1.5 font-sans">Projected · in progress</p>
      )}
      {sorted.map((entry: any) => (
        <div key={entry.dataKey} className="flex justify-between gap-4 py-0.5">
          <span style={{ color: entry.color }} className="font-semibold">{entry.dataKey}</span>
          <span className="text-slate-700">
            {isProjected ? '~' : ''}{formatDollars(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function StandingsChart({
  data,
  members,
  projectedLabel,
}: {
  data: ChartPoint[]
  members: string[]
  projectedLabel?: string
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fontFamily: 'var(--font-geist-mono)', fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatDollars}
          tick={{ fontSize: 11, fontFamily: 'var(--font-geist-mono)', fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          width={56}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, fontFamily: 'var(--font-geist-mono)', paddingTop: 12 }}
        />

        {/* Dashed vertical line separating completed from projected data */}
        {projectedLabel && (
          <ReferenceLine
            x={projectedLabel}
            stroke="#d1fae5"
            strokeWidth={2}
            strokeDasharray="5 4"
            label={{
              value: 'Live →',
              position: 'insideTopLeft',
              fontSize: 9,
              fill: '#6ee7b7',
              fontFamily: 'var(--font-geist-mono)',
              dy: -4,
            }}
          />
        )}

        {members.map((member) => (
          <Line
            key={member}
            type="monotone"
            dataKey={member}
            stroke={MEMBER_COLORS[member] ?? '#94a3b8'}
            strokeWidth={2}
            dot={(props: any) => {
              const { cx, cy, payload } = props
              const isProjected = projectedLabel && payload.label === projectedLabel
              if (isProjected) {
                // Open/hollow dot for projected point
                return (
                  <circle
                    key={`dot-${member}-${cx}`}
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill="white"
                    stroke={MEMBER_COLORS[member] ?? '#94a3b8'}
                    strokeWidth={2}
                  />
                )
              }
              return (
                <circle
                  key={`dot-${member}-${cx}`}
                  cx={cx}
                  cy={cy}
                  r={3}
                  fill={MEMBER_COLORS[member] ?? '#94a3b8'}
                  stroke="none"
                />
              )
            }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
