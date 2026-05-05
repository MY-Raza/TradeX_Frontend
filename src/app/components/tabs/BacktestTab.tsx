import { useState, useEffect } from 'react';
import { PlayCircle, Loader2, Calendar, ChevronLeft, ChevronRight, History, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import {
  backtestApi,
  dataApi,
  BacktestStrategyOption,
  ExchangeInfo,
  BacktestResponse,
  LedgerRunMeta,
  PaginatedLedger,
} from '../../../services/api';

// ── Ledger Run Detail Modal ───────────────────────────────────────────────────

const LEDGER_PAGE_SIZE = 50;

function RunLedgerModal({
  meta,
  onClose,
}: {
  meta: LedgerRunMeta;
  onClose: () => void;
}) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedLedger | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsLoading(true);
    setError('');
    backtestApi
      .getRunLedger(meta.strategy_name, meta.run_id, page, LEDGER_PAGE_SIZE)
      .then(setData)
      .catch(() => setError('Failed to load ledger'))
      .finally(() => setIsLoading(false));
  }, [meta.run_id, meta.strategy_name, page]);

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const pnlPositive = meta.total_pnl_pct >= 0;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleBackdrop}
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
    >
      <motion.div
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0F1420] border border-gray-800 shadow-2xl"
        initial={{ scale: 0.92, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 24 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-800 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold text-white">{meta.table_name}</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
              {meta.exchange.toUpperCase()}
            </Badge>
            {meta.start_date && (
              <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
                {meta.start_date.slice(0, 10)} → {meta.end_date?.slice(0, 10) ?? 'now'}
              </Badge>
            )}
            <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
              TP {meta.take_profit}% · SL {meta.stop_loss}%
            </Badge>
            <Badge
              className={`text-xs ${pnlPositive ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}`}
            >
              PnL {pnlPositive ? '+' : ''}{meta.total_pnl_pct.toFixed(2)}%
            </Badge>
            <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-xs">
              {meta.total_trades} trades · {meta.win_rate.toFixed(1)}% WR
            </Badge>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {data && !isLoading && (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>PnL</TableHead>
                      <TableHead>PnL Sum</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.entries.map((entry, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs whitespace-nowrap">{entry.date}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            entry.type === 'Buy'
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}>
                            {entry.type}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium ${entry.direction === 'long' ? 'text-green-500' : 'text-red-500'}`}>
                            {entry.direction}
                          </span>
                        </TableCell>
                        <TableCell>${entry.price.toLocaleString()}</TableCell>
                        <TableCell className={entry.pnl !== null ? (entry.pnl > 0 ? 'text-green-500' : entry.pnl < 0 ? 'text-red-500' : '') : ''}>
                          {entry.pnl !== null ? `${entry.pnl > 0 ? '+' : ''}${entry.pnl.toFixed(2)}` : '–'}
                        </TableCell>
                        <TableCell className="text-blue-500">
                          {entry.pnl_sum !== null ? entry.pnl_sum.toFixed(2) : '–'}
                        </TableCell>
                        <TableCell>${entry.balance.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-gray-500">{entry.reason ?? '–'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data.pages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-4">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-400">
                    Page {data.page} of {data.pages} &nbsp;·&nbsp; {data.total} entries
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= data.pages}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Run History Panel ─────────────────────────────────────────────────────────

function RunHistoryPanel({
  strategyName,
  onClose,
}: {
  strategyName: string;
  onClose: () => void;
}) {
  const [runs, setRuns] = useState<LedgerRunMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRun, setSelectedRun] = useState<LedgerRunMeta | null>(null);

  useEffect(() => {
    setIsLoading(true);
    backtestApi
      .getStrategyRuns(strategyName)
      .then(setRuns)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [strategyName]);

  return (
    <>
      <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Run History — {strategyName}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          )}
          {!isLoading && runs.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No saved runs found for this strategy.</p>
          )}
          {!isLoading && runs.length > 0 && (
            <div className="space-y-2">
              {runs.map((run) => {
                const pos = run.total_pnl_pct >= 0;
                return (
                  <div
                    key={run.run_id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#0B0F19] border border-gray-800 hover:border-blue-500/40 cursor-pointer transition-colors"
                    onClick={() => setSelectedRun(run)}
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{run.table_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {run.start_date ? `${run.start_date.slice(0, 10)} → ${run.end_date?.slice(0, 10) ?? 'now'}` : 'All data'} &nbsp;·&nbsp; TP {run.take_profit}% / SL {run.stop_loss}%
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <span className={`text-sm font-bold ${pos ? 'text-green-400' : 'text-red-400'}`}>
                        {pos ? '+' : ''}{run.total_pnl_pct.toFixed(2)}%
                      </span>
                      <span className="text-xs text-gray-400">{run.total_trades} trades</span>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AnimatePresence>
        {selectedRun && (
          <RunLedgerModal meta={selectedRun} onClose={() => setSelectedRun(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Main BacktestTab ──────────────────────────────────────────────────────────

export function BacktestTab() {
  const [strategies, setStrategies]   = useState<BacktestStrategyOption[]>([]);
  const [exchanges, setExchanges]     = useState<ExchangeInfo[]>([]);
  const [strategy, setStrategy]       = useState('');
  const [exchange, setExchange]       = useState('');

  // Date range
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');

  // TP / SL overrides (shown pre-filled from strategy, editable)
  const [takeProfit, setTakeProfit] = useState('1.0');
  const [stopLoss, setStopLoss]     = useState('1.0');

  const [isLoading, setIsLoading]     = useState(false);
  const [isRunning, setIsRunning]     = useState(false);
  const [error, setError]             = useState('');
  const [result, setResult]           = useState<BacktestResponse | null>(null);

  // Run history panel
  const [showHistory, setShowHistory] = useState(false);

  // ── Load dropdowns ──────────────────────────────────────────────────────
  useEffect(() => {
    setIsLoading(true);
    Promise.all([backtestApi.getStrategies(), dataApi.getExchanges()])
      .then(([strats, excs]) => { setStrategies(strats); setExchanges(excs); })
      .catch(() => setError('Failed to load strategies / exchanges'))
      .finally(() => setIsLoading(false));
  }, []);

  // Pre-fill TP/SL when strategy changes
  useEffect(() => {
    const s = strategies.find((s) => s.name === strategy);
    if (!s) return;
    setTakeProfit(s.last_run_tp?.toFixed(2) ?? s.tp ?? '1.0');
    setStopLoss(s.last_run_sl?.toFixed(2) ?? s.sl ?? '1.0');
  }, [strategy, strategies]);

  const handleRunBacktest = async () => {
    if (!strategy || !exchange) return;
    setIsRunning(true);
    setResult(null);
    setError('');
    setShowHistory(false);

    try {
      const res = await backtestApi.run({
        strategy_name: strategy,
        exchange,
        start_date: startDate || undefined,
        end_date:   endDate   || undefined,
        take_profit: parseFloat(takeProfit) || 1.0,
        stop_loss:   parseFloat(stopLoss)   || 1.0,
      });
      setResult(res);
    } catch (e: any) {
      setError(e.message ?? 'Backtest failed');
    } finally {
      setIsRunning(false);
    }
  };

  const selectedStrategy = strategies.find((s) => s.name === strategy);
  const summary = result?.summary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Backtest</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Test your strategies with historical data</p>
      </div>

      {/* Configuration */}
      <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* Row 1: Strategy + Exchange */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Strategy</label>
                  <Select value={strategy} onValueChange={setStrategy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      {strategies.map((s) => (
                        <SelectItem key={s.name} value={s.name}>
                          <span className="font-medium">{s.name}</span>
                          <span className="ml-2 text-xs text-gray-400">
                            {s.symbol.toUpperCase()} · {s.time_horizon}
                            {s.last_pnl_pct !== undefined && s.last_pnl_pct !== null
                              ? ` · PnL ${s.last_pnl_pct >= 0 ? '+' : ''}${s.last_pnl_pct.toFixed(1)}%`
                              : s.tp ? ` · TP ${s.tp}%` : ''}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Exchange</label>
                  <Select value={exchange} onValueChange={setExchange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select exchange" />
                    </SelectTrigger>
                    <SelectContent>
                      {exchanges.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Date range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Start Date
                    <span className="text-gray-500">(optional)</span>
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="dark:[color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> End Date
                    <span className="text-gray-500">(optional)</span>
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="dark:[color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Row 3: TP / SL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
                    Take Profit (%)
                    {selectedStrategy?.last_run_tp && (
                      <span className="ml-2 text-xs text-green-400">last: {selectedStrategy.last_run_tp}%</span>
                    )}
                  </label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.1"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    placeholder="e.g. 1.5"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
                    Stop Loss (%)
                    {selectedStrategy?.last_run_sl && (
                      <span className="ml-2 text-xs text-red-400">last: {selectedStrategy.last_run_sl}%</span>
                    )}
                  </label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.1"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    placeholder="e.g. 1.0"
                  />
                </div>
              </div>
            </>
          )}

          {error && (
            <p className="text-sm text-red-500 bg-red-500/10 px-4 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3">
            <Button
              className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
              onClick={handleRunBacktest}
              disabled={!strategy || !exchange || isRunning || isLoading}
            >
              {isRunning ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Running Backtest...</>
              ) : (
                <><PlayCircle className="w-5 h-5 mr-2" />Run Backtest</>
              )}
            </Button>

            {strategy && (
              <Button
                variant="outline"
                onClick={() => setShowHistory((v) => !v)}
                className="gap-2"
              >
                <History className="w-4 h-4" />
                History
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Run history panel */}
      <AnimatePresence>
        {showHistory && strategy && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <RunHistoryPanel strategyName={strategy} onClose={() => setShowHistory(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      <AnimatePresence>
        {isRunning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
              <CardContent className="p-12 flex flex-col items-center justify-center">
                <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
                <p className="text-lg font-medium text-gray-900 dark:text-white">Processing backtest...</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Generating signals and analysing historical data
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result && !isRunning && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Saved confirmation */}
            {summary?.run_table_name && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                <span className="font-semibold">✓ Saved as</span>
                <code className="font-mono bg-green-500/10 px-2 py-0.5 rounded text-green-300">
                  {summary.run_table_name}
                </code>
              </div>
            )}

            {/* Summary cards */}
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Starting Balance', value: `$${summary.starting_balance.toLocaleString()}`,    color: 'text-gray-900 dark:text-white' },
                  { label: 'Final Balance',    value: `$${summary.final_balance.toLocaleString()}`,       color: summary.final_balance >= summary.starting_balance ? 'text-green-500' : 'text-red-500' },
                  { label: 'Total PnL',        value: `${summary.total_pnl_pct >= 0 ? '+' : ''}${summary.total_pnl_pct.toFixed(2)}%`, color: summary.total_pnl_pct >= 0 ? 'text-green-500' : 'text-red-500' },
                  { label: 'Total Trades',     value: String(summary.total_trades),                       color: 'text-blue-500' },
                  { label: 'Win Rate',         value: `${summary.win_rate.toFixed(1)}%`,                  color: 'text-green-500' },
                  { label: 'Loss Rate',        value: `${summary.loss_rate.toFixed(1)}%`,                 color: 'text-red-500' },
                  { label: 'Max Consec. Wins', value: String(summary.max_consecutive_wins),               color: 'text-green-500' },
                  { label: 'Max Consec. Losses', value: String(summary.max_consecutive_losses),           color: 'text-red-500' },
                ].map((s) => (
                  <Card key={s.label} className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                      <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Ledger */}
            <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle>Ledger Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Direction</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>PnL</TableHead>
                        <TableHead>PnL Sum</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.ledger.map((entry, index) => (
                        <TableRow key={index}>
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
                          <TableCell>${entry.price.toLocaleString()}</TableCell>
                          <TableCell className={entry.pnl !== null ? (entry.pnl > 0 ? 'text-green-500' : entry.pnl < 0 ? 'text-red-500' : '') : ''}>
                            {entry.pnl !== null ? `${entry.pnl > 0 ? '+' : ''}${entry.pnl.toFixed(2)}` : '–'}
                          </TableCell>
                          <TableCell className="text-blue-500">
                            {entry.pnl_sum !== null ? entry.pnl_sum.toFixed(2) : '–'}
                          </TableCell>
                          <TableCell>${entry.balance.toLocaleString()}</TableCell>
                          <TableCell className="text-xs text-gray-500">{entry.reason ?? '–'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
                <CardHeader><CardTitle>Trades Won vs Lost</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
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
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={result.pnl_data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                      <XAxis dataKey="trade" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                      <Line type="monotone" dataKey="pnl" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}