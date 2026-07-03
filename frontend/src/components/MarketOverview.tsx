import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { getIndices } from '../utils/stockData'

interface IndexData {
  symbol: string; name: string; price: number
  change: number; changePct: number
}

export default function MarketOverview() {
  const [indices, setIndices] = useState<IndexData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setIndices(getIndices())
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-24 bg-gray-900/50 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {indices.map(idx => {
        const isUp = idx.changePct >= 0
        return (
          <div
            key={idx.symbol}
            className="group bg-gray-900/60 backdrop-blur-sm rounded-xl p-4 card-glow transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{idx.name}</span>
              <span className={`flex items-center justify-center w-7 h-7 rounded-lg ${
                isUp ? 'bg-red-500/10' : 'bg-green-500/10'
              }`}>
                {isUp ? <TrendingUp size={14} className="text-red-500" /> : <TrendingDown size={14} className="text-green-500" />}
              </span>
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl font-semibold text-white tabular-nums font-mono">
                {idx.price.toFixed(2)}
              </span>
              <span className={`text-sm font-medium tabular-nums ${
                isUp ? 'text-red-400' : 'text-green-400'
              }`}>
                {isUp ? '+' : ''}{idx.changePct.toFixed(2)}%
              </span>
            </div>
            <div className={`text-xs mt-1 ${
              isUp ? 'text-red-400/70' : 'text-green-400/70'
            }`}>
              {isUp ? '+' : ''}{idx.change.toFixed(2)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
