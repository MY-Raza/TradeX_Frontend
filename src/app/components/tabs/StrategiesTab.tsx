import { useState, useEffect, useCallback } from 'react';
import {
  Search, ChevronLeft, ChevronRight, TrendingUp, Loader2, X,
  ShieldCheck, Target, History, BarChart2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { motion, AnimatePresence } from 'motion/react';
import {
  strategiesApi,
  backtestApi,
  StrategyListItem,
  StrategyDetail,
  StrategyFilterOptions,
  LedgerRunMeta,
  PaginatedLedger,
} from '../../../services/api';

const PAGE_SIZE = 20;
const LEDGER_PAGE_SIZE = 50;

// ── Paginated Ledger View (inside modal) ──────────────────────────────────────

function LedgerView({
  run,
  onBack,
}: {
  run: LedgerRunMeta;
  onBack: () => void;
}) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedLedger | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsLoading(true);
    setError('');
    backtestApi
      .getRunLedger(run.strategy_name, run.run_id, page, LEDGER_PAGE_SIZE)
      .then(setData)
      .catch(() => setError('Failed to load ledger entries'))
      .finally(() => setIsLoading(false));
  }, [run.run_id, run.strategy_name, page]);

  const pnlPos = run.total_pnl_pct >= 0;

  return (
    <div className="space-y-4">
      {/* Back button + run header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-400 hover:text-white">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to runs
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
          {run.exchange.toUpperCase()}
        </Badge>
        {run.start_date && (
          <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
            {run.start_date.slice(0, 10)} → {run.end_date?.slice(0, 10) ?? 'now'}
          </Badge>
        )}
        <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
          TP {run.take_profit}% · SL {run.stop_loss}%
        </Badge>
        <Badge className={`text-xs ${pnlPos ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}`}>
          PnL {pnlPos ? '+' : ''}{run.total_pnl_pct.toFixed(2)}%
        </Badge>
        <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-xs">
          {run.total_trades} trades · {run.win_rate.toFixed(1)}% WR
        </Badge>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {data && !isLoading && (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-800">
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

          {data.pages > 1 && (
            <div className="flex items-center justify-center gap-4">
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
  );
}

// ── Run history list ──────────────────────────────────────────────────────────

function RunHistoryList({
  strategyName,
  onSelect,
}: {
  strategyName: string;
  onSelect: (run: LedgerRunMeta) => void;
}) {
  const [runs, setRuns] = useState<LedgerRunMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    backtestApi
      .getStrategyRuns(strategyName)
      .then(setRuns)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [strategyName]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-6">
        No backtest runs saved yet for this strategy.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {runs.map((run) => {
        const pos = run.total_pnl_pct >= 0;
        return (
          <div
            key={run.run_id}
            className="flex items-center justify-between p-3 rounded-xl bg-[#0B0F19] border border-gray-800 hover:border-blue-500/40 cursor-pointer transition-colors group"
            onClick={() => onSelect(run)}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{run.table_name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {run.start_date
                  ? `${run.start_date.slice(0, 10)} → ${run.end_date?.slice(0, 10) ?? 'now'}`
                  : 'All data'}{' '}
                · TP {run.take_profit}% / SL {run.stop_loss}%
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-3">
              <span className={`text-sm font-bold ${pos ? 'text-green-400' : 'text-red-400'}`}>
                {pos ? '+' : ''}{run.total_pnl_pct.toFixed(2)}%
              </span>
              <span className="text-xs text-gray-400">{run.total_trades} trades</span>
              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Strategy Detail Modal ─────────────────────────────────────────────────────

type ModalView = 'detail' | 'runs' | 'ledger';

function StrategyModal({
  strategy,
  detail,
  isLoading,
  onClose,
}: {
  strategy: StrategyListItem;
  detail: StrategyDetail | null;
  isLoading: boolean;
  onClose: () => void;
}) {
  const fmt = (v: number | null | undefined) =>
    v === null || v === undefined ? '–' : v.toFixed(2);

  const [view, setView] = useState<ModalView>('detail');
  const [selectedRun, setSelectedRun] = useState<LedgerRunMeta | null>(null);

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const pnlPositive = (strategy.pnl_sum ?? 0) >= 0;

  // ── Backtest stats from strategy list item ────────────────────────────
  const hasBacktestStats =
    strategy.last_pnl_pct !== null && strategy.last_pnl_pct !== undefined;
  const btPnlPositive = (strategy.last_pnl_pct ?? 0) >= 0;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleBackdrop}
        style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      >
        <motion.div
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0F1420] border border-gray-800 shadow-2xl"
          initial={{ scale: 0.92, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-white truncate">{strategy.name}</h2>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  <Badge variant="outline" className="border-gray-600 text-gray-300">
                    {strategy.symbol.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="border-gray-600 text-gray-300">
                    {strategy.time_horizon}
                  </Badge>
                  {strategy.pnl_sum !== null && (
                    <Badge className={pnlPositive ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}>
                      PnL: {pnlPositive ? '+' : ''}${fmt(strategy.pnl_sum)}
                    </Badge>
                  )}
                  {/* Most-recent backtest stats */}
                  {hasBacktestStats && (
                    <Badge className={btPnlPositive ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}>
                      <BarChart2 className="w-3 h-3 mr-1" />
                      BT {btPnlPositive ? '+' : ''}{strategy.last_pnl_pct!.toFixed(2)}%
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Indicator & Pattern badges */}
            {(strategy.indicators.length > 0 || strategy.patterns.length > 0) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {strategy.indicators.map((ind) => (
                  <Badge key={ind} className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">
                    {ind.toUpperCase()}
                  </Badge>
                ))}
                {strategy.patterns.map((pat) => (
                  <Badge key={pat} className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs">
                    {pat.toUpperCase()}
                  </Badge>
                ))}
              </div>
            )}

            {/* Tab strip */}
            <div className="flex gap-1 mt-5">
              {(['detail', 'runs'] as ModalView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => { setView(v); setSelectedRun(null); }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    view === v || (view === 'ledger' && v === 'runs')
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {v === 'detail' ? 'Details' : 'Backtest Runs'}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* ── DETAIL VIEW ─────────────────────────────────────────────── */}
            {view === 'detail' && (
              <>
                {isLoading && (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  </div>
                )}

                {detail && !isLoading && (
                  <>
                    {/* Most-recent backtest stats banner */}
                    {hasBacktestStats && (
                      <div className="grid grid-cols-3 gap-3 p-4 bg-[#0B0F19] border border-gray-800 rounded-xl">
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">Last BT PnL</p>
                          <p className={`text-lg font-bold ${btPnlPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {btPnlPositive ? '+' : ''}{strategy.last_pnl_pct!.toFixed(2)}%
                          </p>
                        </div>
                        {strategy.last_run_tp !== null && strategy.last_run_tp !== undefined && (
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">Last TP</p>
                            <p className="text-lg font-bold text-green-400">{strategy.last_run_tp}%</p>
                          </div>
                        )}
                        {strategy.last_run_sl !== null && strategy.last_run_sl !== undefined && (
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">Last SL</p>
                            <p className="text-lg font-bold text-red-400">{strategy.last_run_sl}%</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TP / SL */}
                    {(detail.tp || detail.sl) && (
                      <div className="grid grid-cols-2 gap-4">
                        {detail.tp && (
                          <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                            <Target className="w-5 h-5 text-green-400 shrink-0" />
                            <div>
                              <p className="text-xs text-gray-400">Take Profit</p>
                              <p className="text-2xl font-bold text-green-400">{detail.tp}%</p>
                            </div>
                          </div>
                        )}
                        {detail.sl && (
                          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <ShieldCheck className="w-5 h-5 text-red-400 shrink-0" />
                            <div>
                              <p className="text-xs text-gray-400">Stop Loss</p>
                              <p className="text-2xl font-bold text-red-400">{detail.sl}%</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Indicator Parameters */}
                    {Object.keys(detail.indicator_details).length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-white mb-3">Indicator Parameters</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {Object.entries(detail.indicator_details).map(([ind, params]) => (
                            <div
                              key={ind}
                              className="p-3 bg-[#0B0F19] border border-gray-800 rounded-xl hover:border-blue-500/40 transition-colors"
                            >
                              <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1.5">{ind}</p>
                              {Object.keys(params).length === 0 ? (
                                <p className="text-xs text-gray-500 italic">No parameters</p>
                              ) : (
                                Object.entries(params).map(([k, v]) => (
                                  <p key={k} className="text-xs text-gray-400">
                                    {k}: <span className="font-semibold text-white">{v ?? '–'}</span>
                                  </p>
                                ))
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Active Patterns */}
                    {detail.patterns.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-white mb-3">Active Patterns</h3>
                        <div className="flex flex-wrap gap-2 p-4 bg-[#0B0F19] border border-gray-800 rounded-xl">
                          {detail.patterns.map((p) => (
                            <Badge key={p} className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                              {p.toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* ── RUNS / LEDGER VIEW ───────────────────────────────────────── */}
            {(view === 'runs' || view === 'ledger') && (
              <>
                {view === 'runs' && (
                  <RunHistoryList
                    strategyName={strategy.name}
                    onSelect={(run) => {
                      setSelectedRun(run);
                      setView('ledger');
                    }}
                  />
                )}
                {view === 'ledger' && selectedRun && (
                  <LedgerView
                    run={selectedRun}
                    onBack={() => { setView('runs'); setSelectedRun(null); }}
                  />
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Main Tab ──────────────────────────────────────────────────────────────────
export function StrategiesTab() {
  const [searchQuery, setSearchQuery]     = useState('');
  const [symbolFilter, setSymbolFilter]   = useState('all');
  const [horizonFilter, setHorizonFilter] = useState('all');

  const [strategies, setStrategies]   = useState<StrategyListItem[]>([]);
  const [filters, setFilters]         = useState<StrategyFilterOptions>({ symbols: [], time_horizons: [] });
  const [total, setTotal]             = useState(0);
  const [pages, setPages]             = useState(1);
  const [page, setPage]               = useState(1);
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState('');

  const [modalStrategy, setModalStrategy]       = useState<StrategyListItem | null>(null);
  const [modalDetail, setModalDetail]           = useState<StrategyDetail | null>(null);
  const [isModalDetailLoading, setIsModalDetailLoading] = useState(false);
  const [detailCache, setDetailCache]           = useState<Record<string, StrategyDetail>>({});

  useEffect(() => {
    strategiesApi.getFilters()
      .then(setFilters)
      .catch(() => {});
  }, []);

  const fetchStrategies = useCallback(async (p = 1) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await strategiesApi.list({
        symbol:       symbolFilter !== 'all' ? symbolFilter : undefined,
        time_horizon: horizonFilter !== 'all' ? horizonFilter : undefined,
        search:       searchQuery || undefined,
        page:         p,
        page_size:    PAGE_SIZE,
      });
      setStrategies(res.results);
      setTotal(res.total);
      setPages(res.pages);
      setPage(res.page);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load strategies');
    } finally {
      setIsLoading(false);
    }
  }, [symbolFilter, horizonFilter, searchQuery]);

  useEffect(() => { fetchStrategies(1); }, [fetchStrategies]);

  useEffect(() => {
    const t = setTimeout(() => fetchStrategies(1), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const openModal = async (strategy: StrategyListItem) => {
    setModalStrategy(strategy);
    setModalDetail(null);

    if (detailCache[strategy.name]) {
      setModalDetail(detailCache[strategy.name]);
      return;
    }

    setIsModalDetailLoading(true);
    try {
      const detail = await strategiesApi.getByName(strategy.name);
      setDetailCache((prev) => ({ ...prev, [strategy.name]: detail }));
      setModalDetail(detail);
    } catch {
      /* show partial */
    } finally {
      setIsModalDetailLoading(false);
    }
  };

  const closeModal = () => {
    setModalStrategy(null);
    setModalDetail(null);
  };

  const fmt = (v: number | null | undefined) =>
    v === null || v === undefined ? '–' : v.toFixed(2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Strategies</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your trading strategies
          {total > 0 && <span className="ml-2 text-blue-500 font-medium">({total} total)</span>}
        </p>
      </div>

      {/* Filters */}
      <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search strategies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={symbolFilter} onValueChange={(v) => { setSymbolFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Symbol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Symbols</SelectItem>
                {filters.symbols.map((s) => (
                  <SelectItem key={s} value={s}>{s.toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={horizonFilter} onValueChange={(v) => { setHorizonFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Time Horizon" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Timeframes</SelectItem>
                {filters.time_horizons.map((h) => (
                  <SelectItem key={h} value={h}>{h}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        </div>
      )}

      {error && !isLoading && (
        <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
          <CardContent className="p-8 text-center">
            <p className="text-red-500">{error}</p>
            <Button className="mt-4" onClick={() => fetchStrategies(page)}>Retry</Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {strategies.map((strategy, index) => {
              const hasBacktest =
                strategy.last_pnl_pct !== null && strategy.last_pnl_pct !== undefined;
              const btPos = (strategy.last_pnl_pct ?? 0) >= 0;

              return (
                <motion.div
                  key={strategy.name}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                >
                  <Card
                    className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800 hover:shadow-lg hover:border-blue-500/40 transition-all cursor-pointer group"
                    onClick={() => openModal(strategy)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
                            <TrendingUp className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white break-all">
                              {strategy.name}
                            </h3>
                            <div className="flex gap-2 mt-1 flex-wrap">
                              <Badge variant="outline" className="text-xs">{strategy.symbol.toUpperCase()}</Badge>
                              <Badge variant="outline" className="text-xs">{strategy.time_horizon}</Badge>
                              {strategy.pnl_sum !== null && (
                                <Badge className={`text-xs ${strategy.pnl_sum >= 0 ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                                  PnL: {strategy.pnl_sum >= 0 ? '+' : ''}${fmt(strategy.pnl_sum)}
                                </Badge>
                              )}
                              {/* Most-recent backtest badge */}
                              {hasBacktest && (
                                <Badge className={`text-xs ${btPos ? 'bg-green-500/10 text-green-500 dark:text-green-400' : 'bg-red-500/10 text-red-500 dark:text-red-400'}`}>
                                  <BarChart2 className="w-3 h-3 mr-1 inline" />
                                  BT {btPos ? '+' : ''}{strategy.last_pnl_pct!.toFixed(2)}%
                                  {strategy.last_run_tp ? ` · TP ${strategy.last_run_tp}%` : ''}
                                  {strategy.last_run_sl ? ` · SL ${strategy.last_run_sl}%` : ''}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500 group-hover:text-blue-400 transition-colors shrink-0 ml-2">
                          View details →
                        </span>
                      </div>

                      {(strategy.indicators.length > 0 || strategy.patterns.length > 0) && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {strategy.indicators.slice(0, 8).map((ind) => (
                            <Badge key={ind} className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs">
                              {ind.toUpperCase()}
                            </Badge>
                          ))}
                          {strategy.patterns.slice(0, 4).map((pat) => (
                            <Badge key={pat} className="bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs">
                              {pat.toUpperCase()}
                            </Badge>
                          ))}
                          {(strategy.indicators.length + strategy.patterns.length) > 12 && (
                            <Badge className="bg-gray-500/10 text-gray-400 text-xs">
                              +{strategy.indicators.length + strategy.patterns.length - 12} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {strategies.length === 0 && (
            <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
              <CardContent className="p-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">No strategies found matching your filters.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && pages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="sm" onClick={() => fetchStrategies(page - 1)} disabled={page <= 1}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {pages}
          </span>
          <Button variant="outline" size="sm" onClick={() => fetchStrategies(page + 1)} disabled={page >= pages}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Modal */}
      {modalStrategy && (
        <StrategyModal
          strategy={modalStrategy}
          detail={modalDetail}
          isLoading={isModalDetailLoading}
          onClose={closeModal}
        />
      )}
    </motion.div>
  );
}