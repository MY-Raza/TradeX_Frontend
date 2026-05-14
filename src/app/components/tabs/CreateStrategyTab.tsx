import { useState, useEffect } from 'react';
import {
  Sparkles, Loader2, Calendar, ChevronLeft, ChevronRight,
  CheckCircle2, TrendingUp, TrendingDown, BarChart3, Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import {
  Bar, BarChart, Line, LineChart,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { dataApi, CoinInfo, ExchangeInfo } from '../../../services/api';

// ─── API types ────────────────────────────────────────────────────────────────

interface LedgerEntry {
  date: string; type: string; price: number;
  pnl: number | null; pnl_sum: number | null;
  balance: number; direction: string; reason: string | null;
}

interface BacktestSummary {
  strategy_name: string; exchange: string; symbol: string;
  starting_balance: number; final_balance: number; total_pnl_pct: number;
  total_trades: number; win_trades: number; loss_trades: number;
  win_rate: number; loss_rate: number;
  max_consecutive_wins: number; max_consecutive_losses: number;
  run_table_name: string | null;
}

interface CreateStrategyResponse {
  strategy_id: string; display_name: string;
  timeframe: string; symbol: string; exchange: string;
  summary: BacktestSummary;
  ledger: LedgerEntry[];
  win_loss_data: { name: string; value: number }[];
  pnl_data: { trade: number; pnl: number }[];
  message: string;
}

const BASE = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

async function createStrategy(body: object): Promise<CreateStrategyResponse> {
  const res = await fetch(`${BASE}/strategy-generator/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? res.statusText);
  }
  return res.json();
}

async function getCoins(exchange: string): Promise<CoinInfo[]> {
  const res = await fetch(`${BASE}/strategy-generator/coins/${exchange}`);
  if (!res.ok) return [];
  return res.json();
}

// ─── Ledger helpers ──────────────────────────────────────────────────────────

function formatReason(reason: string | null | undefined): string {
  if (!reason) return '–';
  switch (reason) {
    case 'take_profit':      return 'TP';
    case 'stop_loss':        return 'SL';
    case 'direction_change': return 'Dir.Change';
    case 'end_of_backtest':  return 'End';
    default:                 return reason;
  }
}

function reasonColor(reason: string | null | undefined): string {
  switch (reason) {
    case 'take_profit':      return 'text-green-500';
    case 'direction_change': return 'text-yellow-400';
    case 'stop_loss':        return 'text-red-500';
    case 'end_of_backtest':  return 'text-sky-300';
    default:                 return 'text-gray-500';
  }
}

// ─── Inline Ledger ────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

function InlineLedger({ ledger }: { ledger: LedgerEntry[] }) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(ledger.length / PAGE_SIZE));
  const slice = ledger.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle>Trade Ledger</CardTitle>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {ledger.length} total entries
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>PnL</TableHead>
                <TableHead>PnL Sum</TableHead>
                <TableHead>Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.map((entry, i) => {
                const globalIndex = (page - 1) * PAGE_SIZE + i;
                const prev = globalIndex > 0 ? ledger[globalIndex - 1] : undefined;
                const balanceUp = prev === undefined ? null : entry.balance >= prev.balance;
                return (
                  <TableRow key={i}>
                    <TableCell className="text-xs whitespace-nowrap">{entry.date}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        entry.type === 'Buy'
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}>
                        {entry.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium ${entry.direction === 'long' ? 'text-green-500' : 'text-red-500'}`}>
                        {entry.direction}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium ${reasonColor(entry.reason)}`}>
                        {formatReason(entry.reason)}
                      </span>
                    </TableCell>
                    <TableCell>${entry.price.toLocaleString()}</TableCell>
                    <TableCell className={entry.pnl !== null ? (entry.pnl > 0 ? 'text-green-500' : entry.pnl < 0 ? 'text-red-500' : '') : ''}>
                      {entry.pnl !== null ? `${entry.pnl > 0 ? '+' : ''}${entry.pnl.toFixed(2)}` : '–'}
                    </TableCell>
                    <TableCell className="text-blue-500">
                      {entry.pnl_sum !== null ? entry.pnl_sum.toFixed(2) : '–'}
                    </TableCell>
                    <TableCell className={balanceUp === null ? '' : balanceUp ? 'text-green-500' : 'text-red-500'}>
                      ${entry.balance.toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-gray-500">
              Page {page} of {pages} &nbsp;·&nbsp; showing {slice.length} of {ledger.length} entries
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page <= 1} className="text-xs px-2">«</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium text-gray-300 min-w-[4rem] text-center">{page} / {pages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= pages}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(pages)} disabled={page >= pages} className="text-xs px-2">»</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TIMEFRAMES = ['1h', '15m', '5m'];

export function CreateStrategyTab() {
  // Form state
  const [name, setName]           = useState('');
  const [timeframe, setTimeframe] = useState('1h');
  const [exchange, setExchange]   = useState('');
  const [symbol, setSymbol]       = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');
  const [takeProfit, setTakeProfit] = useState('3.0');
  const [stopLoss, setStopLoss]     = useState('1.0');
  const [startingBalance, setStartingBalance] = useState('1000');

  // Data
  const [exchanges, setExchanges] = useState<ExchangeInfo[]>([]);
  const [coins, setCoins]         = useState<CoinInfo[]>([]);

  // UI state
  const [isLoadingExchanges, setIsLoadingExchanges] = useState(true);
  const [isLoadingCoins, setIsLoadingCoins]         = useState(false);
  const [isCreating, setIsCreating]                 = useState(false);
  const [error, setError]                           = useState('');
  const [result, setResult]                         = useState<CreateStrategyResponse | null>(null);

  // Load exchanges on mount
  useEffect(() => {
    dataApi.getExchanges()
      .then(setExchanges)
      .catch(() => setError('Failed to load exchanges'))
      .finally(() => setIsLoadingExchanges(false));
  }, []);

  // Load coins when exchange changes
  useEffect(() => {
    if (!exchange) { setCoins([]); setSymbol(''); return; }
    setIsLoadingCoins(true);
    setSymbol('');
    getCoins(exchange)
      .then(setCoins)
      .finally(() => setIsLoadingCoins(false));
  }, [exchange]);

  const canCreate = name.trim() && timeframe && exchange && symbol && !isCreating;

  const handleCreate = async () => {
    if (!canCreate) return;
    setIsCreating(true);
    setResult(null);
    setError('');

    try {
      const res = await createStrategy({
        name: name.trim(),
        timeframe,
        exchange,
        symbol,
        start_date: startDate || undefined,
        end_date:   endDate   || undefined,
        starting_balance: parseFloat(startingBalance) || 1000,
        take_profit: parseFloat(takeProfit) || 3.0,
        stop_loss:   parseFloat(stopLoss)   || 1.0,
      });
      setResult(res);
    } catch (e: any) {
      setError(e.message ?? 'Strategy creation failed');
    } finally {
      setIsCreating(false);
    }
  };

  const summary = result?.summary;
  const pnlPositive = (summary?.total_pnl_pct ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-blue-500" />
            Create Strategy
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Generate a randomised indicator strategy, backtest it, and save it to your registry
          </p>
        </div>
      </div>

      {/* Configuration Card */}
      <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            Strategy Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {isLoadingExchanges ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* Row 1: Name + Timeframe */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block font-medium">
                    Strategy Name <span className="text-red-400">*</span>
                  </label>
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. My BTC Momentum Strategy"
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This name will be shown in your strategy registry and run history
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block font-medium">
                    Timeframe <span className="text-red-400">*</span>
                  </label>
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEFRAMES.map(tf => (
                        <SelectItem key={tf} value={tf}>
                          <span className="font-mono font-medium">{tf}</span>
                          <span className="ml-2 text-xs text-gray-400">
                            {tf === '1h' ? '1-hour candles' : tf === '15m' ? '15-minute candles' : '5-minute candles'}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Exchange + Symbol */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block font-medium">
                    Exchange <span className="text-red-400">*</span>
                  </label>
                  <Select value={exchange} onValueChange={setExchange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select exchange" />
                    </SelectTrigger>
                    <SelectContent>
                      {exchanges.map(ex => (
                        <SelectItem key={ex.id} value={ex.id}>{ex.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block font-medium">
                    Coin / Symbol <span className="text-red-400">*</span>
                  </label>
                  <Select value={symbol} onValueChange={setSymbol} disabled={!exchange || isLoadingCoins}>
                    <SelectTrigger>
                      {isLoadingCoins
                        ? <span className="flex items-center gap-2 text-gray-400"><Loader2 className="w-3.5 h-3.5 animate-spin" />Loading…</span>
                        : <SelectValue placeholder={exchange ? 'Select coin' : 'Select exchange first'} />
                      }
                    </SelectTrigger>
                    <SelectContent>
                      {coins.map(c => (
                        <SelectItem key={c.symbol} value={c.symbol}>
                          <span className="font-mono font-medium">{c.symbol.toUpperCase()}</span>
                          <span className="ml-2 text-xs text-gray-400">{c.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 3: Date range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5" /> Start Date
                    <span className="text-gray-500 font-normal">(optional)</span>
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="dark:[color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5" /> End Date
                    <span className="text-gray-500 font-normal">(optional)</span>
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="dark:[color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Row 4: TP / SL / Balance */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block font-medium">
                    Take Profit (%)
                  </label>
                  <Input
                    type="number" min="0.01" step="0.1"
                    value={takeProfit}
                    onChange={e => setTakeProfit(e.target.value)}
                    placeholder="e.g. 3.0"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block font-medium">
                    Stop Loss (%)
                  </label>
                  <Input
                    type="number" min="0.01" step="0.1"
                    value={stopLoss}
                    onChange={e => setStopLoss(e.target.value)}
                    placeholder="e.g. 1.0"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block font-medium">
                    Starting Balance ($)
                  </label>
                  <Input
                    type="number" min="1" step="100"
                    value={startingBalance}
                    onChange={e => setStartingBalance(e.target.value)}
                    placeholder="e.g. 1000"
                  />
                </div>
              </div>
            </>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 bg-red-500/10 px-4 py-3 rounded-lg border border-red-500/20">
              {error}
            </p>
          )}

          {/* Create Button */}
          <Button
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-semibold text-base"
            onClick={handleCreate}
            disabled={!canCreate}
          >
            {isCreating ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating strategy & running backtest…</>
            ) : (
              <><Sparkles className="w-5 h-5 mr-2" />Create Strategy</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Loading state */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
          >
            <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
              <CardContent className="p-12 flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                  <Sparkles className="w-6 h-6 text-violet-400 absolute -top-1 -right-1 animate-pulse" />
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  Building your strategy…
                </p>
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center space-y-1">
                  <p>Randomising indicators · Running signal combiner · Executing backtest</p>
                  <p className="text-xs">This may take 15–60 seconds depending on the date range</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result && !isCreating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Success banner */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Strategy created successfully</p>
                <p className="text-xs text-green-400/80 mt-0.5">
                  {result.display_name}
                  {' · '}{result.symbol.toUpperCase()} · {result.timeframe} · {result.exchange}
                  {result.summary.run_table_name && ' · run saved'}
                </p>
              </div>
            </div>

            {/* Summary KPIs */}
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Starting Balance',
                    value: `$${summary.starting_balance.toLocaleString()}`,
                    color: 'text-gray-900 dark:text-white',
                    icon: null,
                  },
                  {
                    label: 'Final Balance',
                    value: `$${summary.final_balance.toLocaleString()}`,
                    color: summary.final_balance >= summary.starting_balance ? 'text-green-500' : 'text-red-500',
                    icon: summary.final_balance >= summary.starting_balance ? TrendingUp : TrendingDown,
                  },
                  {
                    label: 'Total PnL',
                    value: `${pnlPositive ? '+' : ''}${summary.total_pnl_pct.toFixed(2)}%`,
                    color: pnlPositive ? 'text-green-500' : 'text-red-500',
                    icon: pnlPositive ? TrendingUp : TrendingDown,
                  },
                  {
                    label: 'Total Trades',
                    value: String(summary.total_trades),
                    color: 'text-blue-500',
                    icon: BarChart3,
                  },
                  {
                    label: 'Win Rate',
                    value: `${summary.win_rate.toFixed(1)}%`,
                    color: 'text-green-500',
                    icon: null,
                  },
                  {
                    label: 'Loss Rate',
                    value: `${summary.loss_rate.toFixed(1)}%`,
                    color: 'text-red-500',
                    icon: null,
                  },
                  {
                    label: 'Max Consec. Wins',
                    value: String(summary.max_consecutive_wins),
                    color: 'text-green-500',
                    icon: null,
                  },
                  {
                    label: 'Max Consec. Losses',
                    value: String(summary.max_consecutive_losses),
                    color: 'text-red-500',
                    icon: null,
                  },
                ].map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
                        <CardContent className="p-4">
                          <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                            {Icon && <Icon className={`w-4 h-4 ${s.color}`} />}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
                <CardHeader><CardTitle>Trades Won vs Lost</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={result.win_loss_data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                      <XAxis dataKey="name" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                      <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
                <CardHeader><CardTitle>PnL per Trade</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={result.pnl_data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                      <XAxis dataKey="trade" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                      <Line type="monotone" dataKey="pnl" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Ledger */}
            <InlineLedger ledger={result.ledger} />

            {/* Create another button */}
            <div className="flex justify-center pb-4">
              <Button
                variant="outline"
                onClick={() => { setResult(null); setError(''); setName(''); }}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Create Another Strategy
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}