import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatTime } from '../lib/format'
import type { DualMetricPoint, MetricPoint } from '../lib/types'

export function Sparkline({
  data,
  color = '#22c55e',
  formatter,
}: {
  data: MetricPoint[]
  color?: string
  formatter?: (v: number) => string
}) {
  return (
    <div className="h-16 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`g-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="t" hide />
          <YAxis hide domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
            labelFormatter={(t) => formatTime(Number(t))}
            formatter={(v) => [formatter ? formatter(Number(v)) : String(v), '']}
          />
          <Area type="monotone" dataKey="v" stroke={color} fill={`url(#g-${color.replace('#', '')})`} strokeWidth={1.6} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function DualSparkline({
  data,
  aLabel,
  bLabel,
  formatter,
}: {
  data: DualMetricPoint[]
  aLabel: string
  bLabel: string
  formatter?: (v: number) => string
}) {
  return (
    <div className="h-20 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey="t" hide />
          <YAxis hide />
          <Tooltip
            contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
            labelFormatter={(t) => formatTime(Number(t))}
            formatter={(v, name) => [formatter ? formatter(Number(v)) : String(v), name === 'a' ? aLabel : bLabel]}
          />
          <Area type="monotone" dataKey="a" stroke="#38bdf8" fill="#38bdf822" strokeWidth={1.5} isAnimationActive={false} />
          <Area type="monotone" dataKey="b" stroke="#a78bfa" fill="#a78bfa22" strokeWidth={1.5} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
