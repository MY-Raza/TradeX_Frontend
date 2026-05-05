const BASE = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

// ─── Data ────────────────────────────────────────────────────────────────────

export interface ExchangeInfo  { id: string; label: string }
export interface CoinInfo      { symbol: string; label: string }
export interface OHLCVCandle   { time: string; open: number; high: number; low: number; close: number; volume: number }
export interface OHLCVResponse {
  exchange: string; symbol: string; timeframe: string;
  candles: OHLCVCandle[]; total_rows: number;
  open: number; high: number; low: number; close: number; total_volume: number;
}
export interface FetchResponse { exchange: string; symbol: string; rows_saved: number; message: string }
export interface LastDateResponse { exchange: string; symbol: string; last_date: string | null }

export const dataApi = {
  getExchanges: ()                                     => req<ExchangeInfo[]>('/data/exchanges'),
  getCoins:     (exchange: string)                     => req<CoinInfo[]>(`/data/coins/${exchange}`),
  getLastDate:  (exchange: string, symbol: string)     => req<LastDateResponse>(`/data/last-date?exchange=${exchange}&symbol=${symbol}`),
  fetchData:    (body: { exchange: string; symbol: string; start_date?: string; end_date?: string }) =>
    req<FetchResponse>('/data/fetch', { method: 'POST', body: JSON.stringify(body) }),
  getOHLCV:     (exchange: string, symbol: string, timeframe: string) =>
    req<OHLCVResponse>(`/data/ohlcv?exchange=${exchange}&symbol=${symbol}&timeframe=${timeframe}`),
};

// ─── Strategies ──────────────────────────────────────────────────────────────

export interface StrategyListItem {
  name: string; symbol: string; time_horizon: string;
  indicators: string[]; patterns: string[]; pnl_sum: number | null;
  // Most-recent backtest stats (populated by backtest_service after a run)
  last_pnl_pct: number | null; last_run_tp: number | null; last_run_sl: number | null;
}
export interface StrategyDetail extends StrategyListItem {
  tp: string | null; sl: string | null;
  indicator_details: Record<string, Record<string, number | null>>;
}
export interface PaginatedStrategies {
  total: number; page: number; page_size: number; pages: number;
  results: StrategyListItem[];
}
export interface StrategyFilterOptions { symbols: string[]; time_horizons: string[] }

export const strategiesApi = {
  getFilters: () => req<StrategyFilterOptions>('/strategies/filters'),
  list: (params: { symbol?: string; time_horizon?: string; search?: string; page?: number; page_size?: number }) => {
    const q = new URLSearchParams();
    if (params.symbol)       q.set('symbol', params.symbol);
    if (params.time_horizon) q.set('time_horizon', params.time_horizon);
    if (params.search)       q.set('search', params.search);
    if (params.page)         q.set('page', String(params.page));
    if (params.page_size)    q.set('page_size', String(params.page_size));
    return req<PaginatedStrategies>(`/strategies?${q}`);
  },
  getByName: (name: string) => req<StrategyDetail>(`/strategies/${encodeURIComponent(name)}`),
};

// ─── Models ───────────────────────────────────────────────────────────────────

export interface ModelResultListItem {
  model_name: string; pnl: number | null;
  total_trades: number | null; long_trades: number | null; short_trades: number | null;
  win_trades: number | null; loss_trades: number | null;
  win_rate: number | null; loss_rate: number | null;
  max_drawdown: number | null; max_drawdown_pct: number | null;
  max_consecutive_wins: number | null; max_consecutive_losses: number | null;
}
export interface ModelResultDetail extends ModelResultListItem {
  breakeven_trades: number | null; gross_profit: number | null; gross_loss: number | null;
  net_profit: number | null; avg_trade_pnl: number | null;
  avg_win: number | null; avg_loss: number | null;
  risk_reward_ratio: number | null; profit_factor: number | null;
  sharpe_ratio: number | null; sortino_ratio: number | null;
}
export interface PaginatedModelResults {
  total: number; page: number; page_size: number; pages: number;
  model_type: 'ml' | 'dl'; results: ModelResultListItem[];
}
export interface AllModelsResponse {
  ml: ModelResultListItem[]; dl: ModelResultListItem[];
  total_ml: number; total_dl: number;
}

export const modelsApi = {
  getAll:     ()                   => req<AllModelsResponse>('/models'),
  getTypes:   ()                   => req<{ types: string[] }>('/models/types'),
  list:       (type: string, params?: { search?: string; page?: number; page_size?: number }) => {
    const q = new URLSearchParams();
    if (params?.search)     q.set('search', params.search);
    if (params?.page)       q.set('page', String(params.page));
    if (params?.page_size)  q.set('page_size', String(params.page_size));
    return req<PaginatedModelResults>(`/models/${type}?${q}`);
  },
  getByName:  (type: string, name: string) =>
    req<ModelResultDetail>(`/models/${type}/${encodeURIComponent(name)}`),
};

// ─── Backtest ─────────────────────────────────────────────────────────────────

export interface BacktestStrategyOption {
  name: string; symbol: string; time_horizon: string;
  tp: string | null; sl: string | null;
  last_pnl_pct: number | null; last_run_tp: number | null; last_run_sl: number | null;
}
export interface LedgerEntry {
  date: string; type: string; price: number;
  pnl: number | null; pnl_sum: number | null;
  balance: number; direction: string; reason: string | null;
}
export interface WinLossPoint  { name: string; value: number }
export interface PnLPoint      { trade: number; pnl: number }
export interface BacktestSummary {
  strategy_name: string; exchange: string; symbol: string;
  starting_balance: number; final_balance: number; total_pnl_pct: number;
  total_trades: number; win_trades: number; loss_trades: number;
  win_rate: number; loss_rate: number;
  max_consecutive_wins: number; max_consecutive_losses: number;
}
export interface BacktestResponse {
  summary: BacktestSummary; ledger: LedgerEntry[];
  win_loss_data: WinLossPoint[]; pnl_data: PnLPoint[];
}

// Saved-run metadata (GET /backtest/runs/{strategy})
export interface LedgerRunMeta {
  run_id: number; table_name: string;
  strategy_name: string; exchange: string;
  start_date: string | null; end_date: string | null;
  take_profit: number; stop_loss: number;
  total_trades: number; win_rate: number;
  total_pnl_pct: number; final_balance: number;
  created_at: string;
}

// Paginated ledger (GET /backtest/runs/{strategy}/{run_id}/ledger)
export interface PaginatedLedger {
  run_meta: LedgerRunMeta;
  entries: LedgerEntry[];
  page: number; page_size: number; total: number; pages: number;
}

export const backtestApi = {
  getStrategies: () => req<BacktestStrategyOption[]>('/backtest/strategies'),

  run: (body: {
    strategy_name: string; exchange: string;
    start_date?: string; end_date?: string;
    starting_balance?: number; take_profit?: number; stop_loss?: number;
    buy_after_minutes?: number; fee?: number; leverage?: number; slippage?: number;
  }) => req<BacktestResponse>('/backtest/run', { method: 'POST', body: JSON.stringify(body) }),

  // GET /backtest/runs/{strategy_name}  – list of saved runs
  getStrategyRuns: (strategyName: string) =>
    req<LedgerRunMeta[]>(`/backtest/runs/${encodeURIComponent(strategyName)}`),

  // GET /backtest/runs/{strategy_name}/{run_id}/ledger  – paginated ledger
  getRunLedger: (strategyName: string, runId: number, page = 1, pageSize = 50) => {
    const q = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    return req<PaginatedLedger>(
      `/backtest/runs/${encodeURIComponent(strategyName)}/${runId}/ledger?${q}`
    );
  },
};

// ─── Sentiment ────────────────────────────────────────────────────────────────

export interface CoinOption    { id: string; display: string }
export interface SentimentPost {
  id: string; title: string; author: string; upvotes: number; comments: number;
  sentiment: string; score: number; confidence: number;
  subreddit: string | null; post_time: string | null;
}
export interface SentimentComment {
  id: string; text: string; author: string; upvotes: number;
  sentiment: string; score: number; confidence: number;
  subreddit: string | null; comment_time: string | null;
}
export interface HourlyPoint   { hour: string; sentiment: number; confidence: number; std_sentiment?: number; post_count?: number }
export interface OverallStats  { mean_sentiment: number; std_sentiment: number; confidence_mean: number; total_posts: number; total_comments: number }
export interface SentimentResultsResponse {
  coin: string; posts: SentimentPost[]; comments: SentimentComment[];
  hourly_posts: HourlyPoint[]; hourly_comments: HourlyPoint[];
  overall: OverallStats;
}
export interface SentimentRunResponse { coin: string; message: string; results: SentimentResultsResponse }

export const sentimentApi = {
  getCoins:   ()           => req<CoinOption[]>('/sentiment/coins'),
  run:        (coin: string) => req<SentimentRunResponse>('/sentiment/run', { method: 'POST', body: JSON.stringify({ coin }) }),
  getResults: (coin: string) => req<SentimentResultsResponse>(`/sentiment/results/${coin}`),
};