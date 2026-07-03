import { useState, useEffect, useCallback, useMemo } from 'react'
import { X, TrendingUp, TrendingDown, BarChart3, Activity, AlertTriangle, RefreshCw } from 'lucide-react'
import Navbar from './components/Navbar'
import MarketOverview from './components/MarketOverview'
import KLineChart from './components/KLineChart'
import StockScreener from './components/StockScreener'
import PortfolioPanel from './components/PortfolioPanel'
import {
  getStockList, getStockDetail, getPrediction, getHotStocks,
  STOCK_POOL, SECTORS, type StockDetail, type Prediction
} from './utils/stockData'

type Tab = 'dashboard' | 'screener' | 'portfolio'

// ── 股票详情弹窗 ──────────────────────────────────────────────
function StockDetailModal({
  symbol, onClose,
}: {
  symbol: string
  onClose: () => void
}) {
  const [detail, setDetail] = useState<StockDetail | null>(null)
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(true)
  const [loadingPred, setLoadingPred] = useState(true)
  const [showPrediction, setShowPrediction] = useState(false)

  useEffect(() => {
    setLoadingDetail(true)
    setLoadingPred(true)
    // Simulate async load
    const t1 = setTimeout(() => {
      setDetail(getStockDetail(symbol))
      setLoadingDetail(false)
    }, 300)
    const t2 = setTimeout(() => {
      setPrediction(getPrediction(symbol))
      setLoadingPred(false)
    }, 500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [symbol])

  const isUp = detail ? detail.changePct >= 0 : true

  if (!detail && loadingDetail) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-gray-900 rounded-2xl p-8 animate-pulse w-full max-w-3xl mx-4">
          <div className="h-6 bg-gray-800 rounded w-1/3 mb-6" />
          <div className="h-64 bg-gray-800 rounded-xl mb-4" />
          <div className="h-12 bg-gray-800 rounded" />
        </div>
      </div>
    )
  }

  if (!detail) return null

  const priceMin = Math.min(...detail.chartData.map(d => d.close)) * 0.99
  const priceMax = Math.max(...detail.chartData.map(d => d.close)) * 1.01

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm py-8">
      <div className="bg-gray-900 rounded-2xl w-full max-w-4xl mx-4 my-auto animate-fade-in border border-gray-800/50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/30">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white">{detail.name}</h2>
                <span className="text-xs text-gray-500 font-mono">{detail.symbol}</span>
                <span className="text-xs text-gray-600 bg-gray-800/50 px-2 py-0.5 rounded-full">{detail.sector}</span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-2xl font-semibold text-white font-mono">{detail.price.toFixed(2)}</span>
                <span className={`flex items-center gap-1 text-sm font-medium ${
                  isUp ? 'text-red-400' : 'text-green-400'
                }`}>
                  {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {isUp ? '+' : ''}{detail.changePct.toFixed(2)}%
                </span>
                <span className={`text-xs ${isUp ? 'text-red-400/70' : 'text-green-400/70'}`}>
                  {isUp ? '+' : ''}{detail.change.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Key stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: '52周高', value: detail.high52w.toFixed(2) },
              { label: '52周低', value: detail.low52w.toFixed(2) },
              { label: '成交量', value: (detail.volume / 10000).toFixed(0) + '万' },
              { label: '市值', value: '--' },
            ].map(s => (
              <div key={s.label} className="bg-gray-800/30 rounded-lg px-3 py-2">
                <div className="text-xs text-gray-500 mb-0.5">{s.label}</div>
                <div className="text-sm font-medium text-gray-300 font-mono">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <KLineChart data={detail.chartData} indicators={detail.indicators} />

          {/* AI Prediction Section */}
          {showPrediction && (
            <div className="bg-gray-800/20 rounded-xl border border-gray-800/50 p-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <Activity size={16} className="text-purple-400" />
                <span className="text-sm font-medium text-gray-300">AI 趋势预测</span>
                {loadingPred ? (
                  <span className="text-xs text-gray-500">计算中...</span>
                ) : prediction && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    prediction.predictedDirection === 'up'
                      ? 'bg-red-500/10 text-red-400'
                      : 'bg-green-500/10 text-green-400'
                  }`}>
                    置信度 {prediction.confidence.toFixed(1)}%
                  </span>
                )}
              </div>

              {prediction && (
                <>
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {prediction.predictions.map(p => (
                      <div key={p.day} className="bg-gray-800/40 rounded-lg p-2.5 text-center">
                        <div className="text-xs text-gray-500 mb-1">第{p.day}日</div>
                        <div className="text-sm font-semibold text-white font-mono">{p.predictedPrice.toFixed(2)}</div>
                        <div className={`text-xs font-medium ${p.changePct >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {p.changePct >= 0 ? '+' : ''}{p.changePct.toFixed(2)}%
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-2">特征重要性</div>
                    <div className="space-y-1.5">
                      {prediction.featureImportance.map(f => (
                        <div key={f.feature} className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 w-16">{f.feature}</span>
                          <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                              style={{ width: `${f.importance * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 font-mono w-10 text-right">
                            {(f.importance * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Toggle prediction */}
          <button
            onClick={() => setShowPrediction(v => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-xl text-sm font-medium transition-colors"
          >
            <RefreshCw size={14} />
            {showPrediction ? '隐藏 AI 预测' : '查看 AI 趋势预测'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 行情面板卡片 ──────────────────────────────────────────────
function StockCard({
  symbol, name, sector, price, change, changePct, volume, onClick
}: {
  symbol: string; name: string; sector: string
  price: number; change: number; changePct: number; volume: number
  onClick: () => void
}) {
  const isUp = changePct >= 0
  return (
    <div
      onClick={onClick}
      className="bg-gray-900/40 backdrop-blur-sm rounded-xl px-4 py-3.5 border border-gray-800/50 hover:border-gray-700/50 hover:bg-gray-900/60 cursor-pointer transition-all duration-200 card-glow"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-sm font-medium text-gray-200">{name}</div>
          <div className="text-xs text-gray-500 font-mono mt-0.5">{symbol}</div>
        </div>
        <span className="text-xs text-gray-600 bg-gray-800/50 px-2 py-0.5 rounded-full">{sector}</span>
      </div>
      <div className="flex items-baseline justify-between mt-2">
        <span className="text-lg font-semibold text-white font-mono">{price.toFixed(2)}</span>
        <div className="text-right">
          <span className={`flex items-center gap-1 text-sm font-medium ${
            isUp ? 'text-red-400' : 'text-green-400'
          }`}>
            {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {isUp ? '+' : ''}{changePct.toFixed(2)}%
          </span>
          <div className="text-xs text-gray-600 mt-0.5">{
            volume >= 10000000
              ? (volume / 100000000).toFixed(1) + '亿'
              : (volume / 10000).toFixed(0) + '万'
          }</div>
        </div>
      </div>
    </div>
  )
}

// ── 主应用 ────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [sectorFilter, setSectorFilter] = useState('全部')
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [stocks, setStocks] = useState<Array<any>>([])
  const [hotStocks, setHotStocks] = useState<Array<any>>([])
  const [loading, setLoading] = useState(true)

  const loadStocks = useCallback(() => {
    setLoading(true)
    const data = getStockList(sectorFilter === '全部' ? undefined : sectorFilter)
    setStocks(data.stocks)
    setHotStocks(getHotStocks(6))
    setLoading(false)
  }, [sectorFilter])

  useEffect(() => { loadStocks() }, [loadStocks])

  const handleStockClick = (symbol: string) => {
    setSelectedSymbol(symbol)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Market Indices */}
            <div className="animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={18} className="text-blue-400" />
                <h1 className="text-lg font-semibold text-white">市场指数</h1>
              </div>
              <MarketOverview />
            </div>

            {/* Hot stocks */}
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-purple-400" />
                  <h2 className="text-lg font-semibold text-white">热门股票</h2>
                </div>
                <span className="text-xs text-gray-500">今日活跃</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {hotStocks.map(s => (
                  <div
                    key={s.symbol}
                    onClick={() => handleStockClick(s.symbol)}
                    className="bg-gray-900/40 rounded-xl px-3 py-3 border border-gray-800/50 hover:border-gray-700/50 cursor-pointer transition-all"
                  >
                    <div className="text-sm font-medium text-gray-200 truncate">{s.name}</div>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">{s.symbol.slice(0, 8)}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-semibold text-white font-mono">{s.price.toFixed(2)}</span>
                      <span className={`text-xs font-medium ${s.changePct >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {s.changePct >= 0 ? '+' : ''}{s.changePct.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stock list */}
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-green-400" />
                  <h2 className="text-lg font-semibold text-white">全部股票</h2>
                </div>
                <select
                  value={sectorFilter}
                  onChange={e => setSectorFilter(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50"
                >
                  <option value="全部">全部行业</option>
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="h-24 bg-gray-900/50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {stocks.map(s => (
                      <StockCard
                        key={s.symbol}
                        {...s}
                        onClick={() => handleStockClick(s.symbol)}
                      />
                    ))}
                  </div>
                  {stocks.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                      <AlertTriangle size={32} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm">该行业暂无数据</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'screener' && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 size={18} className="text-blue-400" />
              <h1 className="text-lg font-semibold text-white">智能选股</h1>
            </div>
            <StockScreener />
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 mb-5">
              <Activity size={18} className="text-emerald-400" />
              <h1 className="text-lg font-semibold text-white">投资组合</h1>
            </div>
            <PortfolioPanel />
          </div>
        )}
      </main>

      {/* Stock detail modal */}
      {selectedSymbol && (
        <StockDetailModal
          symbol={selectedSymbol}
          onClose={() => setSelectedSymbol(null)}
        />
      )}
    </div>
  )
}
