"""
FinSight Backend API
Real stock data via yfinance, falls back to simulation.
"""
import uvicorn
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from datetime import datetime, timedelta
from typing import Optional
import numpy as np
import pandas as pd
import math
import traceback
import os

app = FastAPI(title="FinSight API", version="1.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

try:
    import yfinance as yf
    YFINANCE_AVAILABLE = True
except ImportError:
    pass
rng = np.random.default_rng(42)

STOCK_POOL = [
    {"symbol":"000001.SZ","name":"\u5e73\u5b89\u94f6\u884c","yahoo":"000001.SZ","base_price":12.50,"volatility":0.025,"sector":"\u91d1\u878d"},
    {"symbol":"000002.SZ","name":"\u4e07\u79d1A","yahoo":"000002.SZ","base_price":18.30,"volatility":0.030,"sector":"\u623f\u5730\u4ea7"},
    {"symbol":"000333.SZ","name":"\u7f8e\u7684\u96c6\u56e2","yahoo":"000333.SZ","base_price":65.80,"volatility":0.020,"sector":"\u5bb6\u7535"},
    {"symbol":"000651.SZ","name":"\u683c\u529b\u7535\u5668","yahoo":"000651.SZ","base_price":42.50,"volatility":0.022,"sector":"\u5bb6\u7535"},
    {"symbol":"000858.SZ","name":"\u4e94\u7cae\u6db2","yahoo":"000858.SZ","base_price":168.00,"volatility":0.028,"sector":"\u6d88\u8d39"},
    {"symbol":"002415.SZ","name":"\u6d77\u5eb7\u5a01\u89c6","yahoo":"002415.SZ","base_price":35.60,"volatility":0.024,"sector":"\u79d1\u6280"},
    {"symbol":"002475.SZ","name":"\u7acb\u8baf\u7cbe\u5bc6","yahoo":"002475.SZ","base_price":45.20,"volatility":0.035,"sector":"\u79d1\u6280"},
    {"symbol":"300750.SZ","name":"\u5b81\u5fb7\u65f6\u4ee3","yahoo":"300750.SZ","base_price":245.00,"volatility":0.038,"sector":"\u65b0\u80fd\u6e90"},
    {"symbol":"300059.SZ","name":"\u4e1c\u65b9\u8d22\u5bcc","yahoo":"300059.SZ","base_price":28.90,"volatility":0.036,"sector":"\u91d1\u878d\u79d1\u6280"},
    {"symbol":"600036.SS","name":"\u62db\u5546\u94f6\u884c","yahoo":"600036.SS","base_price":38.20,"volatility":0.020,"sector":"\u91d1\u878d"},
    {"symbol":"600519.SS","name":"\u8d35\u5dde\u8305\u53f0","yahoo":"600519.SS","base_price":1880.00,"volatility":0.018,"sector":"\u6d88\u8d39"},
    {"symbol":"600887.SS","name":"\u4f0a\u5229\u80a1\u4efd","yahoo":"600887.SS","base_price":32.80,"volatility":0.021,"sector":"\u6d88\u8d39"},
    {"symbol":"600900.SS","name":"\u957f\u6c5f\u7535\u529b","yahoo":"600900.SS","base_price":22.50,"volatility":0.015,"sector":"\u516c\u7528\u4e8b\u4e1a"},
    {"symbol":"601012.SS","name":"\u9686\u57fa\u7eff\u80fd","yahoo":"601012.SS","base_price":38.50,"volatility":0.040,"sector":"\u65b0\u80fd\u6e90"},
    {"symbol":"601166.SS","name":"\u5174\u4e1a\u94f6\u884c","yahoo":"601166.SS","base_price":20.80,"volatility":0.022,"sector":"\u91d1\u878d"},
    {"symbol":"601318.SS","name":"\u4e2d\u56fd\u5e73\u5b89","yahoo":"601318.SS","base_price":55.60,"volatility":0.025,"sector":"\u4fdd\u9669"},
    {"symbol":"601398.SS","name":"\u5de5\u5546\u94f6\u884c","yahoo":"601398.SS","base_price":5.80,"volatility":0.012,"sector":"\u91d1\u878d"},
    {"symbol":"603259.SS","name":"\u836f\u660e\u5eb7\u5fb7","yahoo":"603259.SS","base_price":78.50,"volatility":0.035,"sector":"\u533b\u836f"},
    {"symbol":"688981.SS","name":"\u4e2d\u82af\u56fd\u9645","yahoo":"688981.SS","base_price":65.30,"volatility":0.042,"sector":"\u534a\u5bfc\u4f53"},
]

MARKET_INDICES = [
    {"symbol":"000001.SS","name":"\u4e0a\u8bc1\u6307\u6570","yahoo":"000001.SS","base_price":3150,"volatility":0.012},
    {"symbol":"399001.SZ","name":"\u6df1\u8bc1\u6210\u6307","yahoo":"399001.SZ","base_price":10500,"volatility":0.015},
]

# ----------------------------------------------------------------
# Simulation engine (fallback)
# ----------------------------------------------------------------
def simulate_prices(base_price, volatility, days, seed=None):
    lrng = np.random.default_rng(seed)
    rets = 0.7 * lrng.normal(0.0003, volatility, days) + 0.3 * np.roll(lrng.normal(0.0003, volatility, days), 1)
    rets[0] = lrng.normal(0.0003, volatility)
    return np.exp(np.log(base_price) + np.cumsum(rets))

def calc_indicators(prices):
    df = pd.DataFrame({"close": prices})
    df["ma5"] = df["close"].rolling(5,1).mean()
    df["ma20"] = df["close"].rolling(20,1).mean()
    df["ma60"] = df["close"].rolling(60,1).mean()
    e12 = df["close"].ewm(span=12,adjust=False).mean()
    e26 = df["close"].ewm(span=26,adjust=False).mean()
    df["macd"] = e12 - e26
    df["macd_signal"] = df["macd"].ewm(span=9,adjust=False).mean()
    df["macd_hist"] = df["macd"] - df["macd_signal"]
    delta = df["close"].diff()
    g = delta.clip(lower=0); l = (-delta).clip(lower=0)
    ag = g.rolling(14,1).mean(); al = l.rolling(14,1).mean()
    df["rsi"] = 100 - 100/(1+ag/al.replace(0,np.nan)); df["rsi"] = df["rsi"].fillna(50)
    df["bb_mid"] = df["close"].rolling(20,1).mean()
    s = df["close"].rolling(20,1).std()
    df["bb_upper"] = df["bb_mid"]+2*s; df["bb_lower"] = df["bb_mid"]-2*s
    np.random.seed(42)
    df["volume"] = (5e6*(1+5*np.abs(np.diff(prices,prepend=prices[0])/prices))*(0.5+np.random.random(len(prices)))).astype(int)
    return df.fillna(method="bfill").fillna(method="ffill")

# ----------------------------------------------------------------
# Real data fetcher
# ----------------------------------------------------------------
def fetch_real_prices(symbol, days=120):
    if not YFINANCE_AVAILABLE:
        return None
    try:
        import yfinance as yf
        stock = yf.Ticker(symbol)
        hist = stock.history(period=f"{days}d")
        if len(hist) < 5:
            return None
        return hist["Close"].values.tolist()
    except:
        return None

def get_prices(stock, days, seed_suffix=""):
    real = fetch_real_prices(stock["yahoo"], days)
    if real and len(real) >= days * 0.5:
        return real, True
    return simulate_prices(stock["base_price"], stock["volatility"], days, seed=hash(stock["symbol"]+seed_suffix)%10000), False

# ----------------------------------------------------------------
# API: Market indices
# ----------------------------------------------------------------
@app.get("/api/indices")
def get_market_indices():
    results = []
    for idx in MARKET_INDICES:
        prices, real = get_prices(idx, 10, "_idx")
        c, pr = round(float(prices[-1]),2), float(prices[-2])
        results.append({"symbol":idx["symbol"],"name":idx["name"],"price":c,"change":round(c-pr,2),"change_pct":round((c-pr)/pr*100,2)})
    return {"indices":results,"source":"realtime" if YFINANCE_AVAILABLE else "simulated","updated":datetime.now().isoformat()}

# ----------------------------------------------------------------
# API: Stock list
# ----------------------------------------------------------------
@app.get("/api/stocks")
def list_stocks(sector:Optional[str]=None, page:int=Query(1,ge=1), page_size:int=Query(20,ge=1,le=100)):
    pool = [s for s in STOCK_POOL if not sector or sector=="\u5168\u90e8" or s["sector"]==sector]
    results = []
    for s in pool:
        prices, _ = get_prices(s, 5, "_list")
        c, pr = round(float(prices[-1]),2), float(prices[-2])
        cp = round((c-pr)/pr*100,2)
        results.append({"symbol":s["symbol"],"name":s["name"],"sector":s["sector"],"price":c,"change":round(c-pr,2),"change_pct":cp,"volume":int(5e6*(1+5*abs(cp/100)))})
    start = (page-1)*page_size
    return {"stocks":results[start:start+page_size],"total":len(results),"page":page,"page_size":page_size,"sectors":sorted(set(s["sector"] for s in STOCK_POOL)),"source":"realtime" if YFINANCE_AVAILABLE else "simulated"}

# ----------------------------------------------------------------
# API: Stock detail with indicators
# ----------------------------------------------------------------
@app.get("/api/stocks/{symbol}")
def get_stock_detail(symbol:str, days:int=Query(120,ge=30,le=500)):
    stock = next((s for s in STOCK_POOL if s["symbol"]==symbol), None)
    if not stock: raise HTTPException(404, f"Stock {symbol} not found")
    prices, real = get_prices(stock, days, "_detail")
    ind = calc_indicators(prices)
    cp, pp = float(prices[-1]), float(prices[-2])
    last = ind.iloc[-1]
    rsi_sig = "\u8d85\u5356" if last["rsi"]<30 else ("\u8d85\u4e70" if last["rsi"]>70 else "\u4e2d\u6027")
    macd_sig = "\u91d1\u53c9" if last["macd"]>last["macd_signal"] else "\u6b7b\u53c9"
    return {
        "symbol":stock["symbol"],"name":stock["name"],"sector":stock["sector"],
        "price":round(cp,2),"change":round(cp-pp,2),"change_pct":round((cp-pp)/pp*100,2),
        "high_52w":round(float(max(prices)),2),"low_52w":round(float(min(prices)),2),"volume":int(last["volume"]),
        "source":"realtime" if real else "simulated",
        "indicators":{
            "ma5":round(float(last["ma5"]),2),"ma20":round(float(last["ma20"]),2),"ma60":round(float(last["ma60"]),2),
            "macd":round(float(last["macd"]),4),"macd_signal":round(float(last["macd_signal"]),4),"macd_hist":round(float(last["macd_hist"]),4),
            "rsi":round(float(last["rsi"]),1),"rsi_signal":rsi_sig,"macd_signal_label":macd_sig,
            "bb_upper":round(float(last["bb_upper"]),2),"bb_mid":round(float(last["bb_mid"]),2),"bb_lower":round(float(last["bb_lower"]),2),
        },
        "chart_data":[{"date":f"2025-{(i//30)+1:02d}-{(i%28)+1:02d}","close":round(float(ind.iloc[i]["close"]),2),
            "ma5":round(float(ind.iloc[i]["ma5"]),2) if not pd.isna(ind.iloc[i]["ma5"]) else None,
            "ma20":round(float(ind.iloc[i]["ma20"]),2) if not pd.isna(ind.iloc[i]["ma20"]) else None,
            "ma60":round(float(ind.iloc[i]["ma60"]),2) if not pd.isna(ind.iloc[i]["ma60"]) else None,
            "volume":int(ind.iloc[i]["volume"]),"macd":round(float(ind.iloc[i]["macd"]),4),
            "macd_signal":round(float(ind.iloc[i]["macd_signal"]),4),"macd_hist":round(float(ind.iloc[i]["macd_hist"]),4),
            "rsi":round(float(ind.iloc[i]["rsi"]),1)} for i in range(len(ind))],
    }

# ----------------------------------------------------------------
# API: AI prediction
# ----------------------------------------------------------------
@app.get("/api/stocks/{symbol}/prediction")
def predict_stock(symbol:str):
    stock = next((s for s in STOCK_POOL if s["symbol"]==symbol), None)
    if not stock: raise HTTPException(404, f"Stock {symbol} not found")
    prices, real = get_prices(stock, 200, "_pred")
    df = calc_indicators(prices)
    cols = ["close","ma5","ma20","ma60","macd","macd_signal","rsi"]
    for c in cols:
        if c not in df.columns: df[c] = df["close"]
    df = df.fillna(method="bfill").fillna(method="ffill").fillna(0)
    df["target"] = df["close"].shift(-5)/df["close"]-1
    df = df.dropna().reset_index(drop=True)
    if len(df)<30: return {"error":"Insufficient data"}
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.preprocessing import StandardScaler
    Xs = StandardScaler().fit_transform(df[cols].values)
    m = RandomForestRegressor(n_estimators=100,max_depth=5,random_state=42)
    m.fit(Xs, df["target"].values)
    pr = float(m.predict(Xs[-1:].reshape(1,-1))[0])
    cp = float(df["close"].iloc[-1])
    oob = m.oob_score_ if hasattr(m,"oob_score_") and m.oob_score_ else 0.4
    conf = max(0,min(100,100*(1-oob if oob>0 else 0.4)))
    cur = cp; preds = []
    for i in range(5):
        sr=pr/5; nz=rng.normal(0,abs(sr)*0.3); cur*=(1+sr+nz)
        preds.append({"day":i+1,"predicted_price":round(float(cur),2),"change_pct":round(float(sr+nz)*100,2)})
    imp = sorted([{"feature":c,"importance":round(float(imp),4)} for c,imp in zip(cols,m.feature_importances_)],key=lambda x:x["importance"],reverse=True)
    return {"symbol":symbol,"current_price":round(cp,2),"predicted_direction":"up" if pr>0 else "down","confidence":round(abs(conf),1),"predictions":preds,"feature_importance":imp,"source":"realtime" if real else "simulated"}

# ----------------------------------------------------------------
# API: Hot stocks
# ----------------------------------------------------------------
@app.get("/api/market/hot")
def get_hot_stocks(limit:int=Query(8,ge=4,le=20)):
    import random; pool = random.sample(STOCK_POOL, min(limit*2, len(STOCK_POOL)))
    results = []
    for s in pool:
        prices, _ = get_prices(s, 5, "_hot")
        c, pr = round(float(prices[-1]),2), float(prices[-2])
        results.append({"symbol":s["symbol"],"name":s["name"],"price":c,"change_pct":round((c-pr)/pr*100,2),"sector":s["sector"]})
    results.sort(key=lambda x:abs(x["change_pct"]), reverse=True)
    return {"hot_stocks":results[:limit],"source":"realtime" if YFINANCE_AVAILABLE else "simulated"}

# ----------------------------------------------------------------
# API: Portfolio
# ----------------------------------------------------------------
PORTFOLIO = [
    {"symbol":"600519.SS","name":"\u8d35\u5dde\u8305\u53f0","shares":100,"avg_cost":1850.00},
    {"symbol":"300750.SZ","name":"\u5b81\u5fb7\u65f6\u4ee3","shares":500,"avg_cost":230.00},
    {"symbol":"000333.SZ","name":"\u7f8e\u7684\u96c6\u56e2","shares":1000,"avg_cost":60.50},
]

@app.get("/api/portfolio")
def get_portfolio():
    tv,tc = 0,0; hd=[]
    for h in PORTFOLIO:
        s = next((x for x in STOCK_POOL if x["symbol"]==h["symbol"]), None)
        if not s: continue
        prices,_ = get_prices(s, 20, "_pf")
        cp = float(prices[-1]); mv = cp*h["shares"]; cv = h["avg_cost"]*h["shares"]
        tv+=mv; tc+=cv
        hd.append({"symbol":h["symbol"],"name":h["name"],"shares":h["shares"],"avg_cost":h["avg_cost"],
            "current_price":round(cp,2),"market_value":round(mv,2),"pnl":round(mv-cv,2),
            "pnl_pct":round((mv-cv)/cv*100,2),"weight":0})
    for h in hd: h["weight"] = round(h["market_value"]/tv*100,2) if tv>0 else 0
    return {"holdings":hd,"total_value":round(tv,2),"total_cost":round(tc,2),"total_pnl":round(tv-tc,2),"total_pnl_pct":round((tv-tc)/tc*100,2)}

@app.get("/api/portfolio/history")
def get_portfolio_history(days:int=Query(60,ge=20,le=500)):
    dates,vals,bp = [],[],{}
    for h in PORTFOLIO:
        s = next((x for x in STOCK_POOL if x["symbol"]==h["symbol"]), None)
        if s: bp[h["symbol"]],_ = get_prices(s, days, "_pfh")
    for i in range(days):
        total = sum(float(bp[h["symbol"]][i])*h["shares"] for h in PORTFOLIO if h["symbol"] in bp)
        vals.append(round(total,2)); dates.append(f"2025-{(i//30)+1:02d}-{(i%28)+1:02d}")
    init = vals[0] if vals else 1
    return {"dates":dates,"values":vals,"returns_pct":[round((v-init)/init*100,2) for v in vals]}

# ----------------------------------------------------------------
# API: Screener
# ----------------------------------------------------------------
@app.get("/api/screener")
def stock_screener(sector:Optional[str]=None, min_price:Optional[float]=None, max_price:Optional[float]=None, min_change:Optional[float]=None, sort_by:str=Query("change_pct",regex="^(price|change_pct|volume)$"), order:str=Query("desc",regex="^(asc|desc)$"), limit:int=Query(20,ge=5,le=50)):
    pool = [s for s in STOCK_POOL if not sector or sector=="\u5168\u90e8" or s["sector"]==sector]
    results = []
    for s in pool:
        prices,_ = get_prices(s, 5, "_scr")
        c,pr = round(float(prices[-1]),2), float(prices[-2])
        cp = round((c-pr)/pr*100,2)
        if min_price and c<min_price: continue
        if max_price and c>max_price: continue
        if min_change is not None and cp<min_change: continue
        results.append({"symbol":s["symbol"],"name":s["name"],"sector":s["sector"],"price":c,"change_pct":cp,"volume":int(5e6*(1+5*abs(cp/100)))})
    results.sort(key=lambda x:x.get(sort_by,0)or 0, reverse=(order=="desc"))
    return {"results":results[:limit],"total":len(results)}

# ----------------------------------------------------------------
# API: Health check
# ----------------------------------------------------------------
@app.get("/api/health")
def health():
    return {"status":"ok","yfinance":YFINANCE_AVAILABLE,"time":datetime.now().isoformat()}

# Serve built frontend statics
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
    print(f"Serving frontend from: {frontend_dist}")


if __name__=="__main__":
    print(f"Starting FinSight API...")
    print(f"yfinance available: {YFINANCE_AVAILABLE}")
    if YFINANCE_AVAILABLE: print("Data source: REAL-TIME (yfinance)")
    else: print("Data source: SIMULATED (no yfinance detected)")
    uvicorn.run(app, host="0.0.0.0", port=8000)
