import { useState, useMemo } from 'react'
import {
  ResponsiveContainer, ComposedChart, Line, Bar, Area,
  XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine
} from 'recharts'
import type { PricePoint } from '../utils/stockData'

type ChartMode = 'price' | 'macd' | 'rsi'

interface Props {
  data: PricePoint[]
  indicators: {
    rsiSignal: string
    macdSignalLabel: string
    ma5: number
    ma20: number
    rsi: number
  }
}

export default function KLineChart({ data, indicators }: Props) {
  const [mode, setMode] = useState<ChartMode>('price')

  // 显示最近 60 个交易日
  const chartData = useMemo(() => data.slice(-60), [data])

  const priceMin = useMemo(() => Math.min(...chartData.map(d => d.close)), [chartData]) * 0.99
  const priceMax = useMemo(() => Math.max(...chartData.map(d => d.close)), [chartData]) * 1.01

  return (
    <div className="bg-gray-900/40 backdrop-blur-sm rounded-xl border border-gray-800/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800/30">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-gray-300">K线 & 技术指标</h3>
          <div className="flex gap-1 bg-gray-800/50 rounded-lg p-0.5">
            {(['price', 'macd', 'rsi'] as ChartMode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  mode === m
                    ? 'bg-blue-600/30 text-blue-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {m === 'price' ? '价格' : m === 'macd' ? 'MACD' : 'RSI'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>MA5 <span className="text-yellow-400/80 font-mono">{indicators.ma5.toFixed(2)}</span></span>
          <span>MA20 <span className="text-blue-400/80 font-mono">{indicators.ma20.toFixed(2)}</span></span>
          <span>RSI <span className={`font-mono ${
            indicators.rsi > 70 ? 'text-red-400' : indicators.rsi < 30 ? 'text-green-400' : 'text-gray-400'
          }`}>{indicators.rsi.toFixed(1)}</span></span>
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 py-3">
        {mode === 'price' && (
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis domain={[priceMin, priceMax]} tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v.toFixed(0)} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Area type="monotone" dataKey="close" stroke="none" fill="url(#priceGradient)" />
                {chartData[0]?.ma5 && <Line type="monotone" dataKey="ma5" stroke="#eab308" strokeWidth={1.5} dot={false} connectNulls />}
                {chartData[0]?.ma20 && <Line type="monotone" dataKey="ma20" stroke="#3b82f6" strokeWidth={1.5} dot={false} connectNulls />}
                <Line type="monotone" dataKey="close" stroke="#60a5fa" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {mode === 'macd' && (
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData.slice(-40)} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <ReferenceLine y={0} stroke="#374151" />
                <Bar dataKey="macdHist" fill="#6b7280" opacity={0.4}>
                  {chartData.slice(-40).map((entry, idx) => (
                    <rect key={idx} fill={entry.macdHist >= 0 ? '#ef4444' : '#22c55e'} />
                  ))}
                </Bar>
                <Line type="monotone" dataKey="macd" stroke="#60a5fa" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="macdSignal" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {mode === 'rsi' && (
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} />
                <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="4 4" strokeWidth={1.5} />
                <ReferenceLine y={50} stroke="#374151" strokeDasharray="2 2" />
                <Area type="monotone" dataKey="rsi" stroke="#a78bfa" strokeWidth={2} fill="#a78bfa" fillOpacity={0.1} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Signal summary */}
      <div className="flex items-center gap-4 px-5 py-2.5 border-t border-gray-800/30 bg-gray-900/20">
        <span className="text-xs text-gray-500">信号:</span>
        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
          indicators.rsi > 70
            ? 'bg-red-500/10 text-red-400'
            : indicators.rsi < 30
              ? 'bg-green-500/10 text-green-400'
              : 'bg-gray-500/10 text-gray-400'
        }`}>RSI {indicators.rsiSignal}</span>
        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
          indicators.macdSignalLabel === '金叉'
            ? 'bg-blue-500/10 text-blue-400'
            : 'bg-orange-500/10 text-orange-400'
        }`}>MACD {indicators.macdSignalLabel}</span>
      </div>
    </div>
  )
}
