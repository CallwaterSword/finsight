import { useState, useEffect } from 'react'
import { Wallet, TrendingUp, TrendingDown, Plus, ArrowUpRight, DollarSign } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { getPortfolio, type Holding } from '../utils/stockData'

interface PortfolioData {
  holdings: Holding[]
  totalValue: number; totalCost: number
  totalPnl: number; totalPnlPct: number
  history: { dates: string[]; values: number[]; returnsPct: number[] }
}

export default function PortfolioPanel() {
  const [data, setData] = useState<PortfolioData | null>(null)

  useEffect(() => {
    setData(getPortfolio())
  }, [])

  if (!data) return null

  const isUp = data.totalPnl >= 0

  const chartData = data.history.dates.map((d, i) => ({
    date: d,
    value: data.history.values[i],
    returns: data.history.returnsPct[i],
  }))

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gray-900/40 backdrop-blur-sm rounded-xl p-4 border border-gray-800/50 card-glow">
          <div className="text-xs text-gray-500 mb-1">总资产</div>
          <div className="text-2xl font-semibold text-white font-mono">
            {data.totalValue.toLocaleString()}
          </div>
        </div>
        <div className="bg-gray-900/40 backdrop-blur-sm rounded-xl p-4 border border-gray-800/50 card-glow">
          <div className="text-xs text-gray-500 mb-1">总成本</div>
          <div className="text-2xl font-semibold text-gray-300 font-mono">
            {data.totalCost.toLocaleString()}
          </div>
        </div>
        <div className="bg-gray-900/40 backdrop-blur-sm rounded-xl p-4 border border-gray-800/50 card-glow">
          <div className="text-xs text-gray-500 mb-1">盈亏</div>
          <div className={`text-2xl font-semibold font-mono ${isUp ? 'text-red-400' : 'text-green-400'}`}>
            {isUp ? '+' : ''}{data.totalPnl.toLocaleString()}
          </div>
        </div>
        <div className="bg-gray-900/40 backdrop-blur-sm rounded-xl p-4 border border-gray-800/50 card-glow">
          <div className="text-xs text-gray-500 mb-1">收益率</div>
          <div className={`text-2xl font-semibold font-mono ${isUp ? 'text-red-400' : 'text-green-400'}`}>
            {isUp ? '+' : ''}{data.totalPnlPct.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Portfolio value chart */}
      <div className="bg-gray-900/40 backdrop-blur-sm rounded-xl border border-gray-800/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-300">组合净值曲线</h3>
          <span className="text-xs text-gray-500">近 60 个交易日</span>
        </div>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isUp ? '#ef4444' : '#22c55e'} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={isUp ? '#ef4444' : '#22c55e'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Area type="monotone" dataKey="returns" stroke={isUp ? '#ef4444' : '#22c55e'} strokeWidth={2} fill="url(#pnlGradient)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Holdings table */}
      <div className="bg-gray-900/40 backdrop-blur-sm rounded-xl border border-gray-800/50 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800/30">
          <h3 className="text-sm font-medium text-gray-300">持仓明细</h3>
          <span className="text-xs text-gray-500">{data.holdings.length} 只</span>
        </div>
        <div className="divide-y divide-gray-800/30">
          {data.holdings.map(h => (
            <div key={h.symbol} className="px-5 py-3.5 hover:bg-gray-800/20 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
                    <DollarSign size={14} className="text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-200">{h.name}</div>
                    <div className="text-xs text-gray-500">{h.symbol}</div>
                  </div>
                </div>
                <span className="text-xs text-gray-600 bg-gray-800/50 px-2 py-0.5 rounded-full">
                  权重 {h.weight.toFixed(1)}%
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 text-xs">
                <div>
                  <span className="text-gray-500">持仓</span>
                  <div className="text-gray-300 font-mono">{h.shares}</div>
                </div>
                <div>
                  <span className="text-gray-500">成本价</span>
                  <div className="text-gray-300 font-mono">{h.avgCost.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-gray-500">现价</span>
                  <div className="text-gray-300 font-mono">{h.currentPrice.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-gray-500">市值</span>
                  <div className="text-gray-300 font-mono">{h.marketValue.toFixed(0)}</div>
                </div>
                <div>
                  <span className="text-gray-500">盈亏</span>
                  <div className={`font-mono ${h.pnl >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {h.pnl >= 0 ? '+' : ''}{h.pnlPct.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
