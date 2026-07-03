import { useState, useEffect, useMemo } from 'react'
import { Search, Filter, TrendingUp, TrendingDown } from 'lucide-react'
import { runScreener, SECTORS, type ScreenerFilter } from '../utils/stockData'

interface ScreenerResult {
  symbol: string; name: string; sector: string
  price: number; changePct: number
}

export default function StockScreener() {
  const [results, setResults] = useState<ScreenerResult[]>([])
  const [sector, setSector] = useState('全部')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [onlyRising, setOnlyRising] = useState(false)

  useEffect(() => {
    const filter: ScreenerFilter = {}
    if (sector !== '全部') filter.sector = sector
    if (minPrice) filter.minPrice = parseFloat(minPrice)
    if (maxPrice) filter.maxPrice = parseFloat(maxPrice)
    if (onlyRising) filter.minChange = 0
    setResults(runScreener(filter, 50))
  }, [sector, minPrice, maxPrice, onlyRising])

  const stats = useMemo(() => {
    if (results.length === 0) return { rising: 0, falling: 0, avgChange: 0 }
    const rising = results.filter(r => r.changePct >= 0).length
    const falling = results.filter(r => r.changePct < 0).length
    const avgChange = results.reduce((s, r) => s + r.changePct, 0) / results.length
    return { rising, falling, avgChange: avgChange.toFixed(2) }
  }, [results])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-gray-900/40 backdrop-blur-sm rounded-xl border border-gray-800/50 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-blue-400" />
          <span className="text-sm font-medium text-gray-300">筛选条件</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={sector}
            onChange={e => setSector(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50"
          >
            <option value="全部">全部行业</option>
            {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex items-center gap-1">
            <input
              type="number"
              placeholder="最低价"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-gray-600 text-sm">-</span>
            <input
              type="number"
              placeholder="最高价"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <label className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 cursor-pointer hover:bg-gray-750 transition-colors">
            <input
              type="checkbox"
              checked={onlyRising}
              onChange={e => setOnlyRising(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500/30"
            />
            <span className="text-sm text-gray-400">仅上涨</span>
          </label>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-gray-500 px-1">
        <span>共 <span className="text-gray-300 font-medium">{results.length}</span> 只股票</span>
        <span className="w-1 h-1 rounded-full bg-gray-700" />
        <span>上涨 <span className="text-red-400 font-medium">{stats.rising}</span></span>
        <span>下跌 <span className="text-green-400 font-medium">{stats.falling}</span></span>
        <span>平均涨幅 <span className={`font-medium ${+stats.avgChange >= 0 ? 'text-red-400' : 'text-green-400'}`}>{stats.avgChange}%</span></span>
      </div>

      {/* Results Grid */}
      {results.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Search size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">没有符合条件的股票</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {results.map(r => {
            const isUp = r.changePct >= 0
            return (
              <div
                key={r.symbol}
                className="bg-gray-900/40 rounded-xl px-4 py-3 border border-gray-800/50 hover:border-gray-700/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <div className="text-sm font-medium text-gray-200">{r.name}</div>
                    <div className="text-xs text-gray-500">{r.symbol}</div>
                  </div>
                  <span className="text-xs text-gray-600 bg-gray-800/50 px-2 py-0.5 rounded-full">{r.sector}</span>
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-lg font-semibold text-white font-mono">{r.price.toFixed(2)}</span>
                  <span className={`flex items-center gap-1 text-sm font-medium ${
                    isUp ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {isUp ? '+' : ''}{r.changePct.toFixed(2)}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
