'use client'

import React from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
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
  lastCompletedLabel,
}: {
  data: ChartPoint[]
  members: string[]
  projectedLabel?: string
  lastCompletedLabel?: string
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

        {/* Light shaded region marking the projected zone */}
        {projectedLabel && lastCompletedLabel && (
          <ReferenceArea
            x1={lastCompletedLabel}
            x2={projectedLabel}
            fill="#f0fdf4"
            fillOpacity={0.7}
            stroke="none"
          />
        )}

        {/* Dashed border at the projected data point */}
        {projectedLabel && (
          <ReferenceLine
            x={projectedLabel}
            stroke="#a7f3d0"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            label={{
              value: '← projected',
              position: 'insideTopRight',
              fontSize: 9,
              fill: '#6ee7b7',
              fontFamily: 'var(--font-geist-mono)',
              dy: 4,
            }}
          />
        )}

        {members.map((member) => {
          const color = MEMBER_COLORS[member] ?? '#94a3b8'
          const hasProjected = !!(projectedLabel && lastCompletedLabel)

          // Confirmed data: projected point set to undefined so the solid line stops cleanly
          const confirmedData = hasProjected
            ? data.map(p => p.label === projectedLabel ? { ...p, [member]: undefined } : p)
            : data

          // Projected segment: only the two boundary points are defined
          const projSegData = hasProjected
            ? data.map(p =>
                p.label === lastCompletedLabel || p.label === projectedLabel
                  ? p
                  : { ...p, [member]: undefined }
              )
            : []

          return (
            <React.Fragment key={member}>
              {/* Solid confirmed line */}
              <Line
                type="monotone"
                dataKey={member}
                data={confirmedData}
                stroke={color}
                strokeWidth={2}
                dot={(props: any) => {
                  const { cx, cy } = props
                  return <circle key={`dot-${member}-${cx}`} cx={cx} cy={cy} r={3} fill={color} stroke="none" />
                }}
                activeDot={{ r: 5, strokeWidth: 0 }}
                legendType="circle"
              />
              {/* Muted dashed projected segment */}
              {hasProjected && (
                <Line
                  type="monotone"
                  dataKey={member}
                  data={projSegData}
                  stroke={color}
                  strokeWidth={1.5}
                  strokeOpacity={0.35}
                  strokeDasharray="5 4"
                  dot={(props: any) => {
                    const { cx, cy, payload } = props
                    if (payload.label !== projectedLabel) return <g key={`dot-proj-${member}-${cx}`} />
                    return (
                      <circle
                        key={`dot-proj-${member}-${cx}`}
                        cx={cx} cy={cy} r={4}
                        fill="white"
                        stroke={color}
                        strokeWidth={2}
                        strokeOpacity={0.5}
                      />
                    )
                  }}
                  legendType="none"
                  activeDot={false}
                  isAnimationActive={false}
                />
              )}
            </React.Fragment>
          )
        })}
      </LineChart>
    </ResponsiveContainer>
  )
}
