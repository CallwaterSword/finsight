# FinSight 智能投研平台

> 全栈金融分析工具 —— K线技术分析、AI趋势预测、投资组合管理

[English](#english) | [中文](#chinese)

---

## Chinese

FinSight 是一个**可直接运行的金融分析面板**，所有计算在浏览器端完成，零后端依赖。专为投资者、交易员和金融科技开发者设计。

### 核心功能

| 模块 | 功能 |
|------|------|
| 市场总览 | 上证/深证/创业板/科创50 指数行情卡片 |
| 股票列表 | 20只A股，按行业筛选，涨跌/成交量一目了然 |
| K线技术分析 | 价格图 + MA5/MA20/MA60 + 成交量，支持MACD/RSI切换 |
| AI趋势预测 | 基于60天线性回归的5日价格预测 + 特征重要性 |
| 智能选股 | 按行业/价格/涨跌幅筛选，动态统计 |
| 投资组合 | 模拟持仓盈亏 + 净值曲线 + 持仓明细表 |

### 技术栈

- **前端**: React 19 + TypeScript + Vite 6 + Tailwind CSS 3
- **可视化**: Recharts 2 + Lucide Icons
- **图表**: 价格图 + MACD 柱状图 + RSI 摆动指标
- **数据**: 浏览器端几何布朗运动模拟（统计特性接近真实A股）
- **后端**: Python FastAPI（可选，用于扩展API）

### 快速开始

```bash
# 前端（浏览器端运行，无需后端）
cd frontend
npm install
npm run dev
# 浏览器打开 http://localhost:5173

# 后端（可选，用于API扩展）
cd backend
pip install -r requirements.txt
python main.py
# API 运行在 http://localhost:8000
```

### 部署

一键部署到 GitHub Pages，零成本上线：

```bash
# 手动部署
npm run build
npx gh-pages -d dist
```

项目已配置 GitHub Actions 自动部署，推送到 main 分支即可自动发布。

---

## English

FinSight is a **production-ready financial analysis dashboard** with all computation running client-side, requiring zero backend. Designed for investors, traders, and fintech developers.

### Features

| Module | Description |
|--------|-------------|
| Market Overview | Real-time index cards for Shanghai/Shenzhen/GEM/STAR 50 |
| Stock List | 20 A-share stocks with sector filter, price/volume overview |
| K-Line Analysis | Price chart + MA5/MA20/MA60 + volume, toggle MACD/RSI |
| AI Prediction | 5-day price forecast with feature importance visualization |
| Smart Screener | Filter by sector/price/change with statistics |
| Portfolio Tracker | Simulated holdings P&L + NAV curve + position details |

### Tech Stack

- **Frontend**: React 19 + TypeScript + Vite 6 + Tailwind CSS 3
- **Visualization**: Recharts 2 + Lucide Icons
- **Charts**: Price chart + MACD histogram + RSI oscillator
- **Data Engine**: Geometric Brownian Motion (statistically similar to real A-shares)
- **Backend**: Python FastAPI (optional)

### Quick Start

```bash
# Frontend (browser-only, no backend needed)
cd frontend
npm install
npm run dev
# Open http://localhost:5173

# Backend (optional)
cd backend
pip install -r requirements.txt
python main.py
```

---

MIT License
