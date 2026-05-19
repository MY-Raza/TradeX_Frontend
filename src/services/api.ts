// ---------------------------------------------------------------------------
// IMPORTANT – set VITE_API_URL in your Vercel project environment variables:
//   VITE_API_URL = https://<your-railway-app>.railway.app
//
// Without this, production calls will hit localhost and fail silently.
// ---------------------------------------------------------------------------

const BASE = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

if (import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
  console.warn(
    '[api.ts] VITE_API_URL is not set – using http://127.0.0.1:8000. ' +
    'Set this env var in Vercel for production.'
  );
}

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
export interface OHLCVCandle   { time: string; date: string; open: number; high: number; low: number; close: number; volume: number }
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
  getOHLCV:     (exchange: string, symbol: string, timeframe: string, startDate?: string, endDate?: string) => {
    const q = new URLSearchParams({ exchange, symbol, timeframe });
    if (startDate) q.set('start_date', startDate);
    if (endDate)   q.set('end_date', endDate);
    return req<OHLCVResponse>(`/data/ohlcv?${q}`);
  },
};

// ─── Strategies ──────────────────────────────────────────────────────────────

export interface StrategyListItem {
  name: string; symbol: string; time_horizon: string;
  indicators: string[]; patterns: string[]; pnl_sum: number | null;
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
  run_table_name: string | null;
}
export interface BacktestResponse {
  summary: BacktestSummary; ledger: LedgerEntry[];
  win_loss_data: WinLossPoint[]; pnl_data: PnLPoint[];
}

export interface LedgerRunMeta {
  run_id: number; table_name: string;
  strategy_name: string; exchange: string;
  start_date: string | null; end_date: string | null;
  take_profit: number; stop_loss: number;
  total_trades: number; win_rate: number;
  total_pnl_pct: number; final_balance: number;
  created_at: string;
}

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

  getStrategyRuns: (strategyName: string) =>
    req<LedgerRunMeta[]>(`/backtest/runs/${encodeURIComponent(strategyName)}`),

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

// ─── Strategy Generator ───────────────────────────────────────────────────────

/**
 * Per-indicator parameter override map.
 * Keys are indicator names (e.g. "RSI", "MACD").
 * Values are dicts of parameter name → numeric value.
 *
 * Example:
 *   { RSI: { period: 21 }, MACD: { fastperiod: 8, slowperiod: 21, signalperiod: 9 } }
 */
export type WindowConfig = Record<string, Record<string, number>>;

/**
 * Registry metadata for a single indicator, returned by
 * GET /strategy-generator/indicators.
 */
export interface IndicatorDetail {
  name: string;
  signal_type: string;
  inputs: string[];
  /** Logical parameter names → TA-Lib parameter names */
  params: Record<string, string>;
  /** Sensible default values for each parameter */
  default_params: Record<string, number>;
}

export interface IndicatorListResponse {
  count: number;
  indicators: IndicatorDetail[];
}

export interface PatternListResponse {
  count: number;
  patterns: string[];
}

/**
 * Request body for POST /strategy-generator/create.
 *
 * Dynamic signal fields are all optional.
 * Omitting indicators + patterns → legacy randomised path (backward-compatible).
 */
export interface CreateStrategyRequest {
  // Identity
  name: string;
  // Market
  timeframe: string;
  exchange: string;
  symbol: string;
  // Date range (optional)
  start_date?: string;
  end_date?: string;
  // Backtest params
  starting_balance?: number;
  take_profit?: number;
  stop_loss?: number;
  fee?: number;
  leverage?: number;
  slippage?: number;
  // Dynamic signal config (NEW) — omit all three for legacy mode
  indicators?: string[];
  patterns?: string[];
  window_config?: WindowConfig;
}

/**
 * Response from POST /strategy-generator/create.
 * Extends the old shape with signal provenance fields.
 */
export interface CreateStrategyResponse {
  // Identity
  strategy_id: string;
  display_name: string;
  timeframe: string;
  symbol: string;
  exchange: string;
  // Backtest
  summary: BacktestSummary;
  ledger: LedgerEntry[];
  win_loss_data: WinLossPoint[];
  pnl_data: PnLPoint[];
  // Signal provenance (new — always present, empty list/dict for legacy runs)
  indicators_used: string[];
  patterns_used: string[];
  windows_used: WindowConfig;
  // Status
  message: string;
}

export const strategyGeneratorApi = {
  /**
   * List all supported TA-Lib indicators with registry metadata.
   * Use to populate indicator selection UI and build valid window_config payloads.
   */
  getIndicators: () => req<IndicatorListResponse>('/strategy-generator/indicators'),

  /**
   * List all supported candlestick pattern names.
   */
  getPatterns: () => req<PatternListResponse>('/strategy-generator/patterns'),

  /**
   * List coins available on an exchange (for strategy creation form).
   */
  getCoins: (exchange: string) => req<CoinInfo[]>(`/strategy-generator/coins/${exchange}`),

  /**
   * Create a new trading strategy.
   * Pass indicators/patterns/window_config for the dynamic path,
   * or omit them all for legacy randomised mode.
   */
  create: (body: CreateStrategyRequest) =>
    req<CreateStrategyResponse>('/strategy-generator/create', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

// ─── Shared strategy normalization utilities ──────────────────────────────────

/**
 * Normalises a WindowConfig from either old flat format or new nested format.
 *
 * Old format (flat): { EMA_period: 50, RSI_period: 21 }
 * New format (nested): { EMA: { period: 50 }, RSI: { period: 21 } }
 *
 * Returns a canonical nested WindowConfig.
 */
export function normalizeWindowConfig(raw: Record<string, unknown>): WindowConfig {
  const result: WindowConfig = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Already nested: { EMA: { period: 50 } }
      result[key] = value as Record<string, number>;
    } else if (key.includes('_') && typeof value === 'number') {
      // Flat format: EMA_period → { EMA: { period: ... } }
      const underscoreIdx = key.indexOf('_');
      const indicator = key.slice(0, underscoreIdx).toUpperCase();
      const param = key.slice(underscoreIdx + 1);
      result[indicator] = { ...(result[indicator] ?? {}), [param]: value };
    }
  }
  return result;
}

/**
 * Merges user-provided window overrides on top of indicator default params.
 * Returns a complete WindowConfig with all defaults filled in.
 */
export function mergeWithDefaults(
  indicators: IndicatorDetail[],
  overrides: WindowConfig,
): WindowConfig {
  const result: WindowConfig = {};
  for (const ind of indicators) {
    result[ind.name] = {
      ...ind.default_params,
      ...(overrides[ind.name] ?? {}),
    };
  }
  return result;
}

// ─── AI ───────────────────────────────────────────────────────────────────────

export interface ToolExecution {
  tool_name: string;
  parameters: Record<string, any>;
  status: 'success' | 'error';
  error?: string | null;
  result_summary?: string | null;
}

export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  /** Populated on assistant messages to power the tool trace UI */
  tools_executed?: ToolExecution[];
}

export interface AIChatRequest {
  message: string;
  session_id?: string;
}

export interface AIChatResponse {
  session_id: string;
  reply: string;
  tools_executed: ToolExecution[];
  data: Record<string, any> | null;
}

export interface AIHistoryResponse {
  session_id: string;
  messages: AIChatMessage[];
  total: number;
}

export interface AIDeleteHistoryResponse {
  session_id: string;
  deleted: boolean;
  message: string;
}

export const aiApi = {
  /** Send a prompt and get an AI response (creates or continues a session) */
  chat: (body: AIChatRequest) =>
    req<AIChatResponse>('/ai/chat', { method: 'POST', body: JSON.stringify(body) }),

  /** Retrieve text-only conversation history for a session */
  getHistory: (sessionId: string) =>
    req<AIHistoryResponse>(`/ai/history/${encodeURIComponent(sessionId)}`),

  /** Clear conversation history for a session */
  deleteHistory: (sessionId: string) =>
    req<AIDeleteHistoryResponse>(`/ai/history/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
    }),
};