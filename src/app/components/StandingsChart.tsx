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

  // Normalize dataKeys: strip _proj suffix, deduplicate by member name
  const seen = new Set<string>()
  const entries = [...payload]
    .map((e: any) => ({ ...e, memberName: String(e.dataKey).replace(/_proj$/, '') }))
    .filter((e: any) => {
      if (seen.has(e.memberName)) return false
      seen.add(e.memberName)
      return true
    })
    .sort((a: any, b: any) => b.value - a.value)

  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-lg px-4 py-3 text-xs font-mono min-w-[180px]">
      <p className="text-slate-500 mb-2 font-sans text-[11px] uppercase tracking-widest">{tournament}</p>
      {isProjected && (
        <p className="text-[10px] text-emerald-500 mb-1.5 font-sans">Projected · in progress</p>
      )}
      {entries.map((entry: any) => (
        <div key={entry.memberName} className="flex justify-between gap-4 py-0.5">
          <span style={{ color: entry.color }} className="font-semibold">{entry.memberName}</span>
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
  const hasProjected = !!(projectedLabel && lastCompletedLabel)

  // Pre-process into a single dataset to avoid x-axis duplication.
  // The dashed _proj line only gets values at exactly two points:
  //   lastCompletedLabel (start) and projectedLabel (end).
  // This guarantees the dashed segment appears ONLY between those two points —
  // no historical overlap, no bleed-through from SVG layering imprecision.
  const chartData = hasProjected
    ? data.map(p => {
        if (p.label === projectedLabel) {
          // Projected endpoint: only _proj values so the solid line stops cleanly here
          const out: ChartPoint = { label: p.label, tournament: p.tournament }
          for (const m of members) out[`${m}_proj`] = p[m]
          return out
        }
        if (p.label === lastCompletedLabel) {
          // Last completed point: anchor for the dashed segment start
          const out: ChartPoint = { ...p }
          for (const m of members) out[`${m}_proj`] = p[m]
          return out
        }
        // All other historical points: no _proj values
        return p
      })
    : data

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
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

        {members.map((member) => {
          const color = MEMBER_COLORS[member] ?? '#94a3b8'
          return (
            <React.Fragment key={member}>
              {/* Solid confirmed line — all completed tournaments */}
              <Line
                type="monotone"
                dataKey={member}
                stroke={color}
                strokeWidth={2}
                dot={(props: any) => {
                  const { cx, cy } = props
                  // Guard against NaN cy (undefined value at projected point renders at y=0)
                  if (typeof cy !== 'number' || isNaN(cy)) return <g key={`dot-${member}-${cx}`} />
                  return <circle key={`dot-${member}-${cx}`} cx={cx} cy={cy} r={3} fill={color} stroke="none" />
                }}
                activeDot={{ r: 5, strokeWidth: 0 }}
                legendType="circle"
              />
              {/* Dashed projected segment — only lastCompleted → projected (2 points) */}
              {hasProjected && (
                <Line
                  type="monotone"
                  dataKey={`${member}_proj`}
                  stroke={color}
                  strokeWidth={1.5}
                  strokeOpacity={0.45}
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
