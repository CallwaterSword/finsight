// ── 金融数据模拟引擎 ──────────────────────────────────────────
// 几何布朗运动生成股价 + 技术指标计算 (MACD, RSI, MA, Bollinger)

export interface StockMeta {
  symbol: string
  name: string
  sector: string
  basePrice: number
  volatility: number
}

export interface IndexMeta {
  symbol: string
  name: string
  basePrice: number
  volatility: number
}

export interface PricePoint {
  date: string
  close: number
  ma5: number | null
  ma20: number | null
  ma60: number | null
  volume: number
  macd: number
  macdSignal: number
  macdHist: number
  rsi: number
  bbUpper: number
  bbLower: number
}

export interface StockDetail {
  symbol: string
  name: string
  sector: string
  price: number
  change: number
  changePct: number
  high52w: number
  low52w: number
  volume: number
  indicators: {
    ma5: number; ma20: number; ma60: number
    macd: number; macdSignal: number; macdHist: number
    rsi: number; rsiSignal: string; macdSignalLabel: string
    bbUpper: number; bbMid: number; bbLower: number
  }
  chartData: PricePoint[]
}

export interface Prediction {
  symbol: string
  currentPrice: number
  predictedDirection: 'up' | 'down'
  confidence: number
  predictions: Array<{ day: number; predictedPrice: number; changePct: number }>
  featureImportance: Array<{ feature: string; importance: number }>
}

// ── A 股股票池 ────────────────────────────────────────────────
export const STOCK_POOL: StockMeta[] = [
  { symbol: '000001.SZ', name: '平安银行',    sector: '金融',     basePrice: 12.50, volatility: 0.025 },
  { symbol: '000002.SZ', name: '万科A',       sector: '房地产',   basePrice: 18.30, volatility: 0.030 },
  { symbol: '000333.SZ', name: '美的集团',    sector: '家电',     basePrice: 65.80, volatility: 0.020 },
  { symbol: '000651.SZ', name: '格力电器',    sector: '家电',     basePrice: 42.50, volatility: 0.022 },
  { symbol: '000858.SZ', name: '五粮液',      sector: '消费',     basePrice: 168.00, volatility: 0.028 },
  { symbol: '002415.SZ', name: '海康威视',    sector: '科技',     basePrice: 35.60, volatility: 0.024 },
  { symbol: '002475.SZ', name: '立讯精密',    sector: '科技',     basePrice: 45.20, volatility: 0.035 },
  { symbol: '002714.SZ', name: '牧原股份',    sector: '农业',     basePrice: 55.80, volatility: 0.032 },
  { symbol: '300750.SZ', name: '宁德时代',    sector: '新能源',   basePrice: 245.00, volatility: 0.038 },
  { symbol: '300059.SZ', name: '东方财富',    sector: '金融科技', basePrice: 28.90, volatility: 0.036 },
  { symbol: '600036.SH', name: '招商银行',    sector: '金融',     basePrice: 38.20, volatility: 0.020 },
  { symbol: '600519.SH', name: '贵州茅台',    sector: '消费',     basePrice: 1880.00, volatility: 0.018 },
  { symbol: '600887.SH', name: '伊利股份',    sector: '消费',     basePrice: 32.80, volatility: 0.021 },
  { symbol: '600900.SH', name: '长江电力',    sector: '公用事业', basePrice: 22.50, volatility: 0.015 },
  { symbol: '601012.SH', name: '隆基绿能',    sector: '新能源',   basePrice: 38.50, volatility: 0.040 },
  { symbol: '601166.SH', name: '兴业银行',    sector: '金融',     basePrice: 20.80, volatility: 0.022 },
  { symbol: '601318.SH', name: '中国平安',    sector: '保险',     basePrice: 55.60, volatility: 0.025 },
  { symbol: '601398.SH', name: '工商银行',    sector: '金融',     basePrice: 5.80,  volatility: 0.012 },
  { symbol: '603259.SH', name: '药明康德',    sector: '医药',     basePrice: 78.50, volatility: 0.035 },
  { symbol: '688981.SH', name: '中芯国际',    sector: '半导体',   basePrice: 65.30, volatility: 0.042 },
]

export const MARKET_INDICES: IndexMeta[] = [
  { symbol: '000001.SH', name: '上证指数',  basePrice: 3150, volatility: 0.012 },
  { symbol: '399001.SZ', name: '深证成指',  basePrice: 10500, volatility: 0.015 },
  { symbol: '399006.SZ', name: '创业板指',  basePrice: 2100, volatility: 0.020 },
  { symbol: '000688.SH', name: '科创50',    basePrice: 950, volatility: 0.022 },
]

export const SECTORS = [...new Set(STOCK_POOL.map(s => s.sector))].sort()

// --- API client layer ---
// Tries backend API (FastAPI) first, falls back to client simulation
const API_BASE = '/api'

async function apiGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function fetchIndices() {
  const data = await apiGet<{indices: any[]; source: string}>('/indices')
  return data || null
}

export async function fetchStockList(sector?: string) {
  const params = sector && sector !== '全部' ? `?sector=${encodeURIComponent(sector)}` : ''
  const data = await apiGet<{stocks: any[]; source: string; sectors: string[]}>(`/stocks${params}`)
  return data || null
}

export async function fetchStockDetail(symbol: string, days = 120) {
  const data = await apiGet<any>(`/stocks/${encodeURIComponent(symbol)}?days=${days}`)
  return data || null
}

export async function fetchPrediction(symbol: string) {
  const data = await apiGet<any>(`/stocks/${encodeURIComponent(symbol)}/prediction`)
  return data || null
}

export async function fetchHotStocks(limit = 8) {
  const data = await apiGet<{hot_stocks: any[]}>(`/market/hot?limit=${limit}`)
  return data || null
}

export async function fetchPortfolio() {
  const data = await apiGet<any>('/portfolio')
  return data || null
}

export async function fetchPortfolioHistory(days = 60) {
  const data = await apiGet<any>(`/portfolio/history?days=${days}`)
  return data || null
}

// ── 简易 Seeded PRNG ──────────────────────────────────────────
class SeededRNG {
  private seed: number
  constructor(seed: number) { this.seed = seed % 2147483647 }
  next(): number {
    this.seed = (this.seed * 16807) % 2147483647
    return (this.seed - 1) / 2147483646
  }
  normal(mean = 0, std = 1): number {
    // Box-Muller transform
    const u1 = this.next()
    const u2 = this.next()
    return mean + std * Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2)
  }
}

// ── 股价模拟 ──────────────────────────────────────────────────
export function simulatePrices(
  basePrice: number, volatility: number, days: number, seed: number
): number[] {
  const rng = new SeededRNG(seed)
  const mu = 0.0003  // 日收益率
  const sigma = volatility
  const prices: number[] = [basePrice]

  for (let i = 1; i < days; i++) {
    // 几何布朗运动 + 微小自相关
    const prevRet = i > 1 ? Math.log(prices[i-1] / prices[i-2]) : 0
    const noise = rng.normal(0, sigma * 0.3)
    const ret = 0.7 * rng.normal(mu, sigma) + 0.3 * prevRet + 0.1 * noise
    const nextPrice = prices[i-1] * Math.exp(ret)
    prices.push(nextPrice)
  }
  return prices
}

// ── 技术指标计算 ──────────────────────────────────────────────
export function calcIndicators(prices: number[]): PricePoint[] {
  const n = prices.length
  const result: PricePoint[] = []

  // 移动平均
  const ma5: (number | null)[] = []
  const ma20: (number | null)[] = []
  const ma60: (number | null)[] = []

  for (let i = 0; i < n; i++) {
    ma5.push(i >= 4 ? avg(prices.slice(i-4, i+1)) : null)
    ma20.push(i >= 19 ? avg(prices.slice(i-19, i+1)) : null)
    ma60.push(i >= 59 ? avg(prices.slice(i-59, i+1)) : null)
  }

  // MACD
  const ema12 = ema(prices, 12)
  const ema26 = ema(prices, 26)
  const macdLine = ema12.map((v, i) => v - ema26[i])
  const macdSignal = ema(macdLine, 9)
  const macdHist = macdLine.map((v, i) => v - macdSignal[i])

  // RSI
  const rsiValues = calcRSI(prices, 14)

  // Bollinger Bands
  const bbMid = ma20
  const bbStd = bbMid.map((_, i) =>
    i >= 19 ? stdDev(prices.slice(i-19, i+1)) : 0
  )
  const bbUpper = bbMid.map((m, i) => (m ?? 0) + 2 * bbStd[i])
  const bbLower = bbMid.map((m, i) => (m ?? 0) - 2 * bbStd[i])

  // 模拟成交量
  const volumeRng = new SeededRNG(42)
  for (let i = 0; i < n; i++) {
    const ret = i > 0 ? Math.abs(prices[i] - prices[i-1]) / prices[i-1] : 0.01
    const vol = Math.round(5000000 * (1 + 5 * Math.min(ret * 10, 3)) * (0.5 + volumeRng.next()))

    const date = formatDate(i, n)
    result.push({
      date,
      close: round(prices[i], 2),
      ma5: ma5[i] !== null ? round(ma5[i]!, 2) : null,
      ma20: ma20[i] !== null ? round(ma20[i]!, 2) : null,
      ma60: ma60[i] !== null ? round(ma60[i]!, 2) : null,
      volume: vol,
      macd: round(macdLine[i], 4),
      macdSignal: round(macdSignal[i], 4),
      macdHist: round(macdHist[i], 4),
      rsi: round(rsiValues[i], 1),
      bbUpper: round(bbUpper[i], 2),
      bbLower: round(bbLower[i], 2),
    })
  }
  return result
}

// ── 辅助函数 ──────────────────────────────────────────────────
function avg(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function stdDev(arr: number[]): number {
  const m = avg(arr)
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length)
}

function ema(data: number[], period: number): number[] {
  const result: number[] = []
  const k = 2 / (period + 1)
  // SMA 初始化
  let emaVal = data.slice(0, period).reduce((a, b) => a + b, 0) / period
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(data[i]) // 暂用
    } else if (i === period - 1) {
      result.push(round(emaVal, 4))
    } else {
      emaVal = data[i] * k + emaVal * (1 - k)
      result.push(round(emaVal, 4))
    }
  }
  return result
}

function calcRSI(prices: number[], period: number): number[] {
  const rsi: number[] = []
  if (prices.length < 2) return prices.map(() => 50)

  let avgGain = 0, avgLoss = 0
  for (let i = 1; i <= period && i < prices.length; i++) {
    const diff = prices[i] - prices[i-1]
    if (diff > 0) avgGain += diff; else avgLoss -= diff
  }
  if (period > 0) {
    avgGain /= period; avgLoss /= period
  }

  for (let i = 0; i < prices.length; i++) {
    if (i < period) {
      rsi.push(50)
    } else if (i === period) {
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
      rsi.push(round(100 - 100 / (1 + rs), 1))
    } else {
      const diff = prices[i] - prices[i-1]
      avgGain = ((avgGain * (period - 1)) + (diff > 0 ? diff : 0)) / period
      avgLoss = ((avgLoss * (period - 1)) + (diff < 0 ? -diff : 0)) / period
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
      rsi.push(round(100 - 100 / (1 + rs), 1))
    }
  }
  return rsi
}

function formatDate(index: number, total: number): string {
  // 从 2025-01 开始模拟交易日
  const month = Math.floor(index / 22) % 12 + 1
  const day = (index % 22) + 1
  const year = 2025 + Math.floor(index / (22 * 12))
  return `${year}-${String(month).padStart(2, '0')}-${String(Math.min(day, 28)).padStart(2, '0')}`
}

function round(v: number, d: number): number {
  const f = Math.pow(10, d)
  return Math.round(v * f) / f
}

// ── API 函数 ──────────────────────────────────────────────────
export function getIndices() {
  return MARKET_INDICES.map(idx => {
    const prices = simulatePrices(idx.basePrice, idx.volatility, 10, hash(idx.symbol))
    const current = round(prices[prices.length-1], 2)
    const prev = prices[prices.length-2]
    return {
      symbol: idx.symbol,
      name: idx.name,
      price: current,
      change: round(current - prev, 2),
      changePct: round((current - prev) / prev * 100, 2),
    }
  })
}

export function getStockList(sector?: string, page = 1, pageSize = 20) {
  let pool = STOCK_POOL
  if (sector && sector !== '全部') pool = pool.filter(s => s.sector === sector)

  const stocks = pool.map(s => {
    const prices = simulatePrices(s.basePrice, s.volatility, 5, hash(s.symbol))
    const current = round(prices[prices.length-1], 2)
    const prev = prices[prices.length-2]
    const chgPct = round((current - prev) / prev * 100, 2)
    const vol = Math.round(5000000 * (1 + 5 * Math.abs(chgPct / 100)))
    return {
      symbol: s.symbol, name: s.name, sector: s.sector,
      price: current, change: round(current - prev, 2),
      changePct: chgPct, volume: vol,
    }
  })

  const start = (page - 1) * pageSize
  const end = start + pageSize
  return { stocks: stocks.slice(start, end), total: stocks.length, sectors: SECTORS }
}

export function getStockDetail(symbol: string, days = 120): StockDetail | null {
  const meta = STOCK_POOL.find(s => s.symbol === symbol)
  if (!meta) return null

  const prices = simulatePrices(meta.basePrice, meta.volatility, days, hash(symbol + '_detail'))
  const chartData = calcIndicators(prices)
  const last = chartData[chartData.length - 1]
  const prev = chartData[chartData.length - 2]

  const rsiSignal = last.rsi > 70 ? '超买' : last.rsi < 30 ? '超卖' : '中性'
  const macdSignalLabel = last.macd > last.macdSignal ? '金叉' : '死叉'

  return {
    symbol: meta.symbol, name: meta.name, sector: meta.sector,
    price: last.close,
    change: round(last.close - prev.close, 2),
    changePct: round((last.close - prev.close) / prev.close * 100, 2),
    high52w: round(Math.max(...prices), 2),
    low52w: round(Math.min(...prices), 2),
    volume: last.volume,
    indicators: {
      ma5: last.ma5 ?? 0, ma20: last.ma20 ?? 0, ma60: last.ma60 ?? 0,
      macd: last.macd, macdSignal: last.macdSignal, macdHist: last.macdHist,
      rsi: last.rsi, rsiSignal, macdSignalLabel,
      bbUpper: last.bbUpper, bbMid: last.ma20 ?? 0, bbLower: last.bbLower,
    },
    chartData,
  }
}

export function getPrediction(symbol: string): Prediction | null {
  const meta = STOCK_POOL.find(s => s.symbol === symbol)
  if (!meta) return null

  const prices = simulatePrices(meta.basePrice, meta.volatility, 200, hash(symbol + '_pred'))
  const indicators = calcIndicators(prices)

  // 简单线性回归预测（基于最近 60 日均线斜率）
  const recent = prices.slice(-60)
  const xMean = (60 - 1) / 2
  let num = 0, den = 0
  for (let i = 0; i < recent.length; i++) {
    num += (i - xMean) * (recent[i] - avg(recent))
    den += (i - xMean) ** 2
  }
  const slope = den !== 0 ? num / den : 0
  const direction = slope > 0 ? 'up' as const : 'down' as const
  const currentPrice = prices[prices.length - 1]

  // 置信度估算（基于 RSI 极端程度和趋势一致性）
  const lastRsi = indicators[indicators.length - 1].rsi
  const rsiConf = Math.abs(lastRsi - 50) / 50
  const trendConf = Math.min(1, Math.abs(slope) * 100)
  const confidence = round(Math.min(85, (rsiConf * 0.4 + trendConf * 0.6) * 100), 1)

  const predictions = []
  for (let i = 1; i <= 5; i++) {
    const stepChg = slope / currentPrice * (1 + (Math.random() - 0.5) * 0.3)
    const predPrice = currentPrice * (1 + stepChg) ** i
    predictions.push({
      day: i,
      predictedPrice: round(predPrice, 2),
      changePct: round(((predPrice / currentPrice) - 1) * 100, 2),
    })
  }

  return {
    symbol, currentPrice: round(currentPrice, 2),
    predictedDirection: direction,
    confidence,
    predictions,
    featureImportance: [
      { feature: 'MA趋势', importance: 0.35 },
      { feature: 'RSI动量', importance: 0.25 },
      { feature: 'MACD', importance: 0.20 },
      { feature: '成交量', importance: 0.12 },
      { feature: '波动率', importance: 0.08 },
    ],
  }
}

export function getHotStocks(limit = 8) {
  const shuffled = [...STOCK_POOL].sort(() => Math.random() - 0.5).slice(0, Math.min(limit * 2, STOCK_POOL.length))
  return shuffled.map(s => {
    const prices = simulatePrices(s.basePrice, s.volatility, 5, hash(s.symbol + '_hot'))
    const current = prices[prices.length - 1]
    const prev = prices[prices.length - 2]
    return {
      symbol: s.symbol, name: s.name,
      price: round(current, 2),
      changePct: round((current - prev) / prev * 100, 2),
      sector: s.sector,
    }
  }).sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct)).slice(0, limit)
}

export interface ScreenerFilter {
  sector?: string
  minPrice?: number
  maxPrice?: number
  minChange?: number
}

export function runScreener(filter: ScreenerFilter, limit = 20) {
  let pool = STOCK_POOL
  if (filter.sector && filter.sector !== '全部') pool = pool.filter(s => s.sector === filter.sector)

  const results = pool.map(s => {
    const prices = simulatePrices(s.basePrice, s.volatility, 5, hash(s.symbol + '_scr'))
    const current = prices[prices.length - 1]
    const prev = prices[prices.length - 2]
    const chgPct = round((current - prev) / prev * 100, 2)
    return { symbol: s.symbol, name: s.name, sector: s.sector, price: round(current, 2), changePct: chgPct }
  })

  return results
    .filter(r => {
      if (filter.minPrice !== undefined && r.price < filter.minPrice) return false
      if (filter.maxPrice !== undefined && r.price > filter.maxPrice) return false
      if (filter.minChange !== undefined && r.changePct < filter.minChange) return false
      return true
    })
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
    .slice(0, limit)
}

// ── 投资组合 ──────────────────────────────────────────────────
export interface Holding {
  symbol: string; name: string; shares: number; avgCost: number
  currentPrice: number; marketValue: number; pnl: number; pnlPct: number; weight: number
}

const DEFAULT_HOLDINGS = [
  { symbol: '600519.SH', name: '贵州茅台', shares: 100, avgCost: 1850.00 },
  { symbol: '300750.SZ', name: '宁德时代', shares: 500, avgCost: 230.00 },
  { symbol: '000333.SZ', name: '美的集团', shares: 1000, avgCost: 60.50 },
]

export function getPortfolio() {
  let totalValue = 0
  let totalCost = 0
  const holdings: Holding[] = DEFAULT_HOLDINGS.map(h => {
    const meta = STOCK_POOL.find(s => s.symbol === h.symbol)
    if (!meta) return null
    const prices = simulatePrices(meta.basePrice, meta.volatility, 20, hash(h.symbol + '_pf'))
    const currentPrice = prices[prices.length - 1]
    const marketValue = currentPrice * h.shares
    const costValue = h.avgCost * h.shares
    totalValue += marketValue
    totalCost += costValue
    return {
      ...h,
      currentPrice: round(currentPrice, 2),
      marketValue: round(marketValue, 2),
      pnl: round(marketValue - costValue, 2),
      pnlPct: round((marketValue - costValue) / costValue * 100, 2),
      weight: 0,
    }
  }).filter(Boolean) as Holding[]

  holdings.forEach(h => { h.weight = round((h.marketValue / totalValue) * 100, 2) })

  const prices = simulatePrices(100000, 0.03, 60, 999)
  const pfValues = prices.map(p => round(p, 2))
  const pfReturns = pfValues.map(v => round((v - pfValues[0]) / pfValues[0] * 100, 2))
  const dates = pfValues.map((_, i) => formatDate(i, 60))

  return {
    holdings,
    totalValue: round(totalValue, 2),
    totalCost: round(totalCost, 2),
    totalPnl: round(totalValue - totalCost, 2),
    totalPnlPct: round((totalValue - totalCost) / totalCost * 100, 2),
    history: { dates, values: pfValues, returnsPct: pfReturns },
  }
}

function hash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i)
    h = h & h
  }
  return Math.abs(h) || 1
}
