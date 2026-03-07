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
  Customized,
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

// Draws the projected segment for each member as a custom cubic bezier via
// Recharts' <Customized> component. Computes the exit slope of each solid line
// at lastCompleted (slope of the final confirmed segment) and uses it as the
// bezier's initial tangent — guaranteeing C1 continuity (smooth join, no kink).
function ProjectedSegmentsRenderer({
  xAxisMap,
  yAxisMap,
  members,
  chartData,
  lastCompletedLabel,
  projectedLabel,
}: any) {
  const xAxis = Object.values(xAxisMap as Record<string, any>)[0]
  const yAxis = Object.values(yAxisMap as Record<string, any>)[0]
  if (!xAxis?.scale || !yAxis?.scale) return null

  const lastIdx = (chartData as ChartPoint[]).findIndex((p) => p.label === lastCompletedLabel)
  const projPoint = (chartData as ChartPoint[]).find((p) => p.label === projectedLabel)
  if (lastIdx < 0 || !projPoint) return null

  const lastPoint = chartData[lastIdx] as ChartPoint
  const prevPoint = lastIdx > 0 ? (chartData[lastIdx - 1] as ChartPoint) : null

  // scalePoint (used by Recharts for categorical LineChart axes) has bandwidth() = 0
  const halfBand = (xAxis.scale.bandwidth?.() ?? 0) / 2
  const x1 = (xAxis.scale(lastCompletedLabel) as number) + halfBand
  const x2 = (xAxis.scale(projectedLabel) as number) + halfBand

  return (
    <g>
      {(members as string[]).map((member) => {
        const color = MEMBER_COLORS[member] ?? '#94a3b8'

        const y1Raw = lastPoint[member]
        const y2Raw = projPoint[`${member}_proj`]
        if (typeof y1Raw !== 'number' || typeof y2Raw !== 'number') return null

        const y1 = yAxis.scale(y1Raw) as number
        const y2 = yAxis.scale(y2Raw) as number
        if (isNaN(y1) || isNaN(y2)) return null

        // Exit slope at lastCompleted = slope of the preceding confirmed segment.
        // Recharts' monotone sets the endpoint slope to the slope of the last segment,
        // so matching it here gives perfect C1 continuity.
        let slope = 0
        if (prevPoint) {
          const xPrev = (xAxis.scale(prevPoint.label) as number) + halfBand
          const yPrevRaw = prevPoint[member]
          if (typeof yPrevRaw === 'number') {
            const yPrev = yAxis.scale(yPrevRaw) as number
            if (!isNaN(yPrev) && x1 !== xPrev) {
              slope = (y1 - yPrev) / (x1 - xPrev)
            }
          }
        }

        // Cubic bezier: CP1 follows the exit tangent, CP2 arrives horizontally
        const dx = (x2 - x1) / 3
        const cp1x = x1 + dx
        const cp1y = y1 + slope * dx
        const cp2x = x2 - dx
        const cp2y = y2
        const d = `M${x1},${y1} C${cp1x},${cp1y} ${cp2x},${cp2y} ${x2},${y2}`

        return (
          <g key={member}>
            <path
              d={d}
              stroke={color}
              strokeWidth={1.5}
              strokeOpacity={0.45}
              strokeDasharray="5 4"
              fill="none"
            />
            {/* Hollow dot at the projected endpoint */}
            <circle
              cx={x2}
              cy={y2}
              r={4}
              fill="white"
              stroke={color}
              strokeWidth={2}
              strokeOpacity={0.5}
            />
          </g>
        )
      })}
    </g>
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

  // The solid lines use member keys. At the projected label we omit member values
  // so the solid line stops cleanly at lastCompleted. We store _proj values at the
  // projected label solely so ProjectedSegmentsRenderer can read the projected Y.
  const chartData = hasProjected
    ? data.map((p) => {
        if (p.label === projectedLabel) {
          const out: ChartPoint = { label: p.label, tournament: p.tournament }
          for (const m of members) out[`${m}_proj`] = p[m]
          return out
        }
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
            <Line
              key={member}
              type="monotone"
              dataKey={member}
              stroke={color}
              strokeWidth={2}
              dot={(props: any) => {
                const { cx, cy } = props
                // Guard: undefined value at projected point renders at y=0 in SVG
                if (typeof cy !== 'number' || isNaN(cy)) return <g key={`dot-${member}-${cx}`} />
                return <circle key={`dot-${member}-${cx}`} cx={cx} cy={cy} r={3} fill={color} stroke="none" />
              }}
              activeDot={{ r: 5, strokeWidth: 0 }}
              legendType="circle"
            />
          )
        })}

        {/* Custom bezier projected segments — drawn on top of solid lines.
            Uses C1 continuity so each dashed segment flows smoothly from
            where its solid line ends, with no kink at the junction. */}
        {hasProjected && (
          <Customized
            component={({ xAxisMap, yAxisMap }: any) => (
              <ProjectedSegmentsRenderer
                xAxisMap={xAxisMap}
                yAxisMap={yAxisMap}
                members={members}
                chartData={chartData}
                lastCompletedLabel={lastCompletedLabel}
                projectedLabel={projectedLabel}
              />
            )}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}
