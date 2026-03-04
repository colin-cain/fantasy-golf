'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'

export type WeeklyPoint = Record<string, string | number>

const MEMBER_COLORS: Record<string, string> = {
  Ben:   '#f97316',
  Ty:    '#ef4444',
  JJ:    '#3b82f6',
  Jake:  '#10b981',
  Chris: '#8b5cf6',
  Colin: '#06b6d4',
}

function formatDollars(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  const tournament = payload[0]?.payload?.tournament ?? label
  const sorted = [...payload].filter(e => e.value > 0).sort((a, b) => b.value - a.value)

  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-lg px-4 py-3 text-xs font-mono min-w-[180px]">
      <p className="text-slate-500 mb-2 font-sans text-[11px] uppercase tracking-widest">{tournament}</p>
      {sorted.length === 0 && (
        <p className="text-slate-400">No earnings</p>
      )}
      {sorted.map((entry: any) => (
        <div key={entry.dataKey} className="flex justify-between gap-4 py-0.5">
          <span style={{ color: entry.color }} className="font-semibold">{entry.dataKey}</span>
          <span className="text-slate-700">{formatDollars(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function WeeklyChart({
  data,
  members,
}: {
  data: WeeklyPoint[]
  members: string[]
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }} barCategoryGap="30%">
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
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f5f5f4' }} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, fontFamily: 'var(--font-geist-mono)', paddingTop: 12 }}
        />
        {members.map((member, i) => (
          <Bar
            key={member}
            dataKey={member}
            stackId="a"
            fill={MEMBER_COLORS[member] ?? '#94a3b8'}
            radius={i === members.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
