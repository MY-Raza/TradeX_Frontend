const BASE_URL = 'http://localhost:8000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ── Data ─────────────────────────────────────────────────────────────
export const api = {
  // Data tab
  getExchanges: () => request('/data/exchanges'),
  getCoins: (exchange: string) => request(`/data/coins/${exchange}`),
  fetchData: (body: object) => request('/data/fetch', { method: 'POST', body: JSON.stringify(body) }),
  getOHLCV: (exchange: string, symbol: string, timeframe: string) =>
    request(`/data/ohlcv?exchange=${exchange}&symbol=${symbol}&timeframe=${timeframe}`),

  // Strategies tab
  getStrategies: (params?: Record<string, string>) => {
    const q = new URLSearchParams(params).toString();
    return request(`/strategies${q ? '?' + q : ''}`);
  },
  getStrategyFilters: () => request('/strategies/filters'),
  getStrategy: (name: string) => request(`/strategies/${name}`),

  // Models tab
  getAllModels: () => request('/models'),
  getModels: (type: 'ml' | 'dl', params?: Record<string, string>) => {
    const q = new URLSearchParams(params).toString();
    return request(`/models/${type}${q ? '?' + q : ''}`);
  },
  getModel: (type: string, name: string) => request(`/models/${type}/${name}`),

  // Backtest tab
  getBacktestStrategies: () => request('/backtest/strategies'),
  runBacktest: (body: object) => request('/backtest/run', { method: 'POST', body: JSON.stringify(body) }),

  // Sentiment tab
  getSentimentCoins: () => request('/sentiment/coins'),
  runSentiment: (coin: string) => request('/sentiment/run', { method: 'POST', body: JSON.stringify({ coin }) }),
  getSentimentResults: (coin: string) => request(`/sentiment/results/${coin}`),
};