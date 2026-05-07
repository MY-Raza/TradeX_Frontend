import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2, History, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import {
  backtestApi,
  BacktestStrategyOption,
  LedgerEntry,
  LedgerRunMeta,
  PaginatedLedger,
} from '../../../services/api';

// ── Constants ─────────────────────────────────────────────────────────────────

const LEDGER_PAGE_SIZE = 25;

// ── Shared helpers ────────────────────────────────────────────────────────────

function pnlColor(v: number) {
  return v > 0 ? 'text-green-400' : v < 0 ? 'text-red-400' : 'text-gray-400';
}

function fmt(v: number | null | undefined, decimals = 2, prefix = '') {
  if (v == null) return '–';
  const sign = v > 0 ? '+' : '';
  return `${prefix}${sign}${v.toFixed(decimals)}`;
}

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

// ── Ledger table row ──────────────────────────────────────────────────────────

function LedgerRow({ entry, prevBalance }: { entry: LedgerEntry; prevBalance?: number }) {
  const balanceUp = prevBalance === undefined ? null : entry.balance >= prevBalance;
  return (
    <TableRow className="hover:bg-white/[0.02] transition-colors">
      <TableCell className="text-xs whitespace-nowrap text-gray-400">{entry.date}</TableCell>
      <TableCell>
        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
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
      <TableCell>
        <span className={`text-xs font-medium ${reasonColor(entry.reason)}`}>
          {formatReason(entry.reason)}
        </span>
      </TableCell>
      <TableCell className="font-mono text-sm">${entry.price.toLocaleString()}</TableCell>
      <TableCell className={`font-mono text-sm ${entry.pnl !== null ? pnlColor(entry.pnl) : 'text-gray-500'}`}>
        {entry.pnl !== null ? fmt(entry.pnl) : '–'}
      </TableCell>
      <TableCell className="font-mono text-sm text-blue-400">
        {entry.pnl_sum !== null ? entry.pnl_sum.toFixed(2) : '–'}
      </TableCell>
      <TableCell className={`font-mono text-sm ${balanceUp === null ? '' : balanceUp ? 'text-green-500' : 'text-red-500'}`}>
        ${entry.balance.toLocaleString()}
      </TableCell>
    </TableRow>
  );
}

// ── Paginated ledger panel ────────────────────────────────────────────────────

function LedgerPanel({ run }: { run: LedgerRunMeta }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedLedger | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setPage(1);
  }, [run.run_id]);

  useEffect(() => {
    setIsLoading(true);
    setError('');
    backtestApi
      .getRunLedger(run.strategy_name, run.run_id, page, LEDGER_PAGE_SIZE)
      .then(setData)
      .catch(() => setError('Failed to load ledger entries.'))
      .finally(() => setIsLoading(false));
  }, [run.run_id, run.strategy_name, page]);

  const pnlPos = run.total_pnl_pct >= 0;

  return (
    <motion.div
      key={run.run_id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-white mb-2">
                {run.table_name}
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-gray-700 text-gray-300 text-xs">
                  {run.exchange.toUpperCase()}
                </Badge>
                {run.start_date ? (
                  <Badge variant="outline" className="border-gray-700 text-gray-300 text-xs">
                    {run.start_date.slice(0, 10)} → {run.end_date?.slice(0, 10) ?? 'now'}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-gray-700 text-gray-300 text-xs">
                    All data
                  </Badge>
                )}
                <Badge variant="outline" className="border-gray-700 text-gray-300 text-xs">
                  TP {run.take_profit}% · SL {run.stop_loss}%
                </Badge>
                <Badge className={`text-xs border ${pnlPos
                  ? 'bg-green-500/10 text-green-400 border-green-500/30'
                  : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                  PnL {pnlPos ? '+' : ''}{run.total_pnl_pct.toFixed(2)}%
                </Badge>
                <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">
                  {run.total_trades} trades · {run.win_rate.toFixed(1)}% WR
                </Badge>
                <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs">
                  ${run.final_balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} final
                </Badge>
              </div>
            </div>
            <span className="text-xs text-gray-500 shrink-0">
              {new Date(run.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading && (
            <div className="flex justify-center py-10">
              <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
            </div>
          )}
          {error && (
            <p className="text-sm text-red-500 bg-red-500/10 px-4 py-2 rounded-lg">{error}</p>
          )}

          {data && !isLoading && (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-800">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800 hover:bg-transparent">
                      <TableHead className="text-gray-400">Date</TableHead>
                      <TableHead className="text-gray-400">Type</TableHead>
                      <TableHead className="text-gray-400">Direction</TableHead>
                      <TableHead className="text-gray-400">Reason</TableHead>
                      <TableHead className="text-gray-400">Price</TableHead>
                      <TableHead className="text-gray-400">PnL</TableHead>
                      <TableHead className="text-gray-400">PnL Sum</TableHead>
                      <TableHead className="text-gray-400">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.entries.map((entry, i) => (
                      <LedgerRow key={i} entry={entry} prevBalance={i > 0 ? data.entries[i - 1].balance : undefined} />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data.pages > 1 && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-gray-500">
                    Page {data.page} of {data.pages} &nbsp;·&nbsp; {data.total} entries
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline" size="sm"
                      onClick={() => setPage(1)}
                      disabled={page <= 1}
                      className="text-xs px-2 h-8"
                    >
                      «
                    </Button>
                    <Button
                      variant="outline" size="sm"
                      onClick={() => setPage(p => p - 1)}
                      disabled={page <= 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium text-gray-300 min-w-[4.5rem] text-center">
                      {data.page} / {data.pages}
                    </span>
                    <Button
                      variant="outline" size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= data.pages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline" size="sm"
                      onClick={() => setPage(data.pages)}
                      disabled={page >= data.pages}
                      className="text-xs px-2 h-8"
                    >
                      »
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Run selector card ─────────────────────────────────────────────────────────

function RunSelector({
  strategyName,
  selectedRunId,
  onSelect,
}: {
  strategyName: string;
  selectedRunId: number | null;
  onSelect: (run: LedgerRunMeta) => void;
}) {
  const [runs, setRuns] = useState<LedgerRunMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsLoading(true);
    setError('');
    backtestApi
      .getStrategyRuns(strategyName)
      .then(setRuns)
      .catch(() => setError('Failed to load runs for this strategy.'))
      .finally(() => setIsLoading(false));
  }, [strategyName]);

  return (
    <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <History className="w-4 h-4 text-blue-400" />
          Saved Runs — <span className="font-mono text-blue-400 text-sm">{strategyName}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        )}
        {error && (
          <p className="text-sm text-red-500 bg-red-500/10 px-4 py-2 rounded-lg">{error}</p>
        )}
        {!isLoading && !error && runs.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No saved runs found for this strategy.
          </div>
        )}
        {!isLoading && runs.length > 0 && (
          <div className="space-y-2">
            {runs.map((run) => {
              const pos = run.total_pnl_pct >= 0;
              const isSelected = run.run_id === selectedRunId;
              return (
                <button
                  key={run.run_id}
                  onClick={() => onSelect(run)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-blue-500/60 bg-blue-500/5'
                      : 'border-gray-800 bg-[#0B0F19] hover:border-blue-500/30 hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{run.table_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {run.start_date
                        ? `${run.start_date.slice(0, 10)} → ${run.end_date?.slice(0, 10) ?? 'now'}`
                        : 'All data'
                      }
                      &nbsp;·&nbsp;TP {run.take_profit}% / SL {run.stop_loss}%
                      &nbsp;·&nbsp;{new Date(run.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <div className="text-right">
                      <p className={`text-sm font-bold ${pos ? 'text-green-400' : 'text-red-400'}`}>
                        {pos ? '+' : ''}{run.total_pnl_pct.toFixed(2)}%
                      </p>
                      <p className="text-xs text-gray-400">
                        {run.total_trades} trades · {run.win_rate.toFixed(1)}% WR
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-colors ${isSelected ? 'text-blue-400' : 'text-gray-600'}`} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main RunHistoryTab ────────────────────────────────────────────────────────

export function RunHistoryTab() {
  const [strategies, setStrategies] = useState<BacktestStrategyOption[]>([]);
  const [isLoadingStrats, setIsLoadingStrats] = useState(false);
  const [stratError, setStratError] = useState('');

  const [selectedStrategy, setSelectedStrategy] = useState('');
  const [selectedRun, setSelectedRun] = useState<LedgerRunMeta | null>(null);

  // Load strategy list on mount
  useEffect(() => {
    setIsLoadingStrats(true);
    backtestApi
      .getStrategies()
      .then(setStrategies)
      .catch(() => setStratError('Failed to load strategies.'))
      .finally(() => setIsLoadingStrats(false));
  }, []);

  // Reset run when strategy changes
  const handleStrategyChange = (name: string) => {
    setSelectedStrategy(name);
    setSelectedRun(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-blue-400" />
          Run History
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Browse and inspect all saved backtest runs
        </p>
      </div>

      {/* Strategy picker */}
      <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-base">Select Strategy</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingStrats ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          ) : stratError ? (
            <p className="text-sm text-red-500 bg-red-500/10 px-4 py-2 rounded-lg">{stratError}</p>
          ) : (
            <Select value={selectedStrategy} onValueChange={handleStrategyChange}>
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Choose a strategy to browse its runs…" />
              </SelectTrigger>
              <SelectContent>
                {strategies.map((s) => (
                  <SelectItem key={s.name} value={s.name}>
                    <span className="font-medium">{s.name}</span>
                    <span className="ml-2 text-xs text-gray-400">
                      {s.symbol.toUpperCase()} · {s.time_horizon}
                      {s.last_pnl_pct != null
                        ? ` · PnL ${s.last_pnl_pct >= 0 ? '+' : ''}${s.last_pnl_pct.toFixed(1)}%`
                        : ''}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Run list */}
      <AnimatePresence mode="wait">
        {selectedStrategy && (
          <motion.div
            key={selectedStrategy}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            <RunSelector
              strategyName={selectedStrategy}
              selectedRunId={selectedRun?.run_id ?? null}
              onSelect={setSelectedRun}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ledger panel */}
      <AnimatePresence mode="wait">
        {selectedRun && (
          <LedgerPanel key={selectedRun.run_id} run={selectedRun} />
        )}
      </AnimatePresence>

      {/* Empty prompt */}
      {!selectedStrategy && !isLoadingStrats && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-600 dark:text-gray-600 space-y-3">
          <History className="w-12 h-12" />
          <p className="text-sm">Select a strategy above to view its saved runs</p>
        </div>
      )}
    </motion.div>
  );
}