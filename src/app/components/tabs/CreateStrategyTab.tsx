import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, Loader2, Calendar, ChevronLeft, ChevronRight,
  CheckCircle2, TrendingUp, TrendingDown, BarChart3, Zap,
  Plus, X, ChevronDown, Settings2, FlaskConical,
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
import {
  dataApi, ExchangeInfo,
  strategyGeneratorApi, CreateStrategyResponse, IndicatorDetail, WindowConfig,
} from '../../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LedgerEntry {
  date: string; type: string; price: number;
  pnl: number | null; pnl_sum: number | null;
  balance: number; direction: string; reason: string | null;
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

// ─── Window Params Editor ─────────────────────────────────────────────────────
// Renders per-indicator parameter inputs driven by the registry metadata.

interface WindowParamsEditorProps {
  indicator: IndicatorDetail;
  values: Record<string, number>;
  onChange: (indicatorName: string, params: Record<string, number>) => void;
}

function WindowParamsEditor({ indicator, values, onChange }: WindowParamsEditorProps) {
  const paramEntries = Object.entries(indicator.default_params);
  if (paramEntries.length === 0) return null;

  const handleChange = (paramName: string, raw: string) => {
    const num = parseFloat(raw);
    if (!isNaN(num) && num > 0) {
      onChange(indicator.name, { ...values, [paramName]: num });
    }
  };

  return (
    <div className="mt-2 pl-3 border-l-2 border-blue-500/20 space-y-2">
      <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">
        {indicator.name} Parameters
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {paramEntries.map(([paramName, defaultVal]) => (
          <div key={paramName}>
            <label className="text-[11px] text-gray-500 block mb-1 font-mono">{paramName}</label>
            <Input
              type="number"
              min="1"
              step="1"
              value={values[paramName] ?? defaultVal}
              onChange={e => handleChange(paramName, e.target.value)}
              className="h-7 text-xs font-mono"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Signal Configuration Section ────────────────────────────────────────────
// Handles indicator/pattern selection and their nested window configs.
// Mode can be 'auto' (legacy random) or 'custom' (dynamic).

type SignalMode = 'auto' | 'custom';

interface SignalConfigSectionProps {
  mode: SignalMode;
  onModeChange: (m: SignalMode) => void;
  allIndicators: IndicatorDetail[];
  allPatterns: string[];
  selectedIndicators: string[];
  selectedPatterns: string[];
  windowConfig: WindowConfig;
  onIndicatorsChange: (names: string[]) => void;
  onPatternsChange: (names: string[]) => void;
  onWindowConfigChange: (cfg: WindowConfig) => void;
  isLoadingRegistry: boolean;
}

function SignalConfigSection({
  mode, onModeChange,
  allIndicators, allPatterns,
  selectedIndicators, selectedPatterns,
  windowConfig,
  onIndicatorsChange, onPatternsChange, onWindowConfigChange,
  isLoadingRegistry,
}: SignalConfigSectionProps) {
  const [patternSearch, setPatternSearch] = useState('');
  const [showPatterns, setShowPatterns] = useState(false);

  const filteredPatterns = allPatterns.filter(p =>
    p.toLowerCase().includes(patternSearch.toLowerCase())
  );

  const toggleIndicator = (name: string) => {
    if (selectedIndicators.includes(name)) {
      onIndicatorsChange(selectedIndicators.filter(n => n !== name));
      // Remove its window config entry too
      const next = { ...windowConfig };
      delete next[name];
      onWindowConfigChange(next);
    } else {
      onIndicatorsChange([...selectedIndicators, name]);
      // Seed window config with defaults
      const ind = allIndicators.find(i => i.name === name);
      if (ind && Object.keys(ind.default_params).length > 0) {
        onWindowConfigChange({ ...windowConfig, [name]: { ...ind.default_params } });
      }
    }
  };

  const togglePattern = (name: string) => {
    if (selectedPatterns.includes(name)) {
      onPatternsChange(selectedPatterns.filter(n => n !== name));
    } else {
      onPatternsChange([...selectedPatterns, name]);
    }
  };

  const handleWindowParamChange = (indicatorName: string, params: Record<string, number>) => {
    onWindowConfigChange({ ...windowConfig, [indicatorName]: params });
  };

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onModeChange('auto')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
            mode === 'auto'
              ? 'bg-violet-500/10 border-violet-500/40 text-violet-400'
              : 'border-gray-700 text-gray-500 hover:border-gray-500'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Auto (randomised)
        </button>
        <button
          type="button"
          onClick={() => onModeChange('custom')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
            mode === 'custom'
              ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
              : 'border-gray-700 text-gray-500 hover:border-gray-500'
          }`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          Custom signals
        </button>
      </div>

      {mode === 'auto' && (
        <p className="text-xs text-gray-500 bg-violet-500/5 border border-violet-500/10 px-3 py-2 rounded-lg">
          The backend will automatically select and combine indicators for you.
        </p>
      )}

      <AnimatePresence>
        {mode === 'custom' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-5 pt-1">
              {isLoadingRegistry ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading indicator registry…
                </div>
              ) : (
                <>
                  {/* ── Indicators ── */}
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1.5 font-medium">
                      <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
                      Indicators
                      {selectedIndicators.length > 0 && (
                        <Badge className="ml-1 bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">
                          {selectedIndicators.length} selected
                        </Badge>
                      )}
                    </label>

                    {/* Indicator chips */}
                    <div className="flex flex-wrap gap-2">
                      {allIndicators.map(ind => {
                        const active = selectedIndicators.includes(ind.name);
                        return (
                          <button
                            key={ind.name}
                            type="button"
                            onClick={() => toggleIndicator(ind.name)}
                            className={`px-3 py-1 rounded-full text-xs font-mono font-medium border transition-all ${
                              active
                                ? 'bg-blue-500/15 border-blue-500/50 text-blue-300'
                                : 'border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
                            }`}
                          >
                            {active && <span className="mr-1">✓</span>}
                            {ind.name}
                          </button>
                        );
                      })}
                    </div>

                    {/* Window param editors for selected indicators */}
                    {selectedIndicators.length > 0 && (
                      <div className="mt-3 space-y-3">
                        {selectedIndicators.map(name => {
                          const ind = allIndicators.find(i => i.name === name);
                          if (!ind || Object.keys(ind.default_params).length === 0) return null;
                          return (
                            <WindowParamsEditor
                              key={name}
                              indicator={ind}
                              values={windowConfig[name] ?? ind.default_params}
                              onChange={handleWindowParamChange}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ── Patterns ── */}
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1.5 font-medium">
                      <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
                      Candlestick Patterns
                      {selectedPatterns.length > 0 && (
                        <Badge className="ml-1 bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">
                          {selectedPatterns.length} selected
                        </Badge>
                      )}
                    </label>

                    {/* Selected pattern tags */}
                    {selectedPatterns.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {selectedPatterns.map(p => (
                          <span
                            key={p}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-amber-500/10 border border-amber-500/30 text-amber-300"
                          >
                            {p}
                            <button type="button" onClick={() => togglePattern(p)} className="hover:text-red-400 transition-colors">
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Pattern picker toggle */}
                    <button
                      type="button"
                      onClick={() => setShowPatterns(v => !v)}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-all"
                    >
                      <Plus className="w-3 h-3" />
                      {showPatterns ? 'Hide patterns' : 'Add patterns'}
                      <ChevronDown className={`w-3 h-3 transition-transform ${showPatterns ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {showPatterns && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.18 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 p-3 rounded-lg border border-gray-800 bg-[#0B0F19] space-y-2">
                            <Input
                              value={patternSearch}
                              onChange={e => setPatternSearch(e.target.value)}
                              placeholder="Search patterns…"
                              className="h-7 text-xs"
                            />
                            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                              {filteredPatterns.map(p => {
                                const active = selectedPatterns.includes(p);
                                return (
                                  <button
                                    key={p}
                                    type="button"
                                    onClick={() => togglePattern(p)}
                                    className={`px-2 py-0.5 rounded-full text-[11px] font-mono border transition-all ${
                                      active
                                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                                        : 'border-gray-700 text-gray-500 hover:border-amber-500/30 hover:text-amber-300'
                                    }`}
                                  >
                                    {p}
                                  </button>
                                );
                              })}
                              {filteredPatterns.length === 0 && (
                                <p className="text-xs text-gray-600 py-1">No patterns match</p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Validation hint */}
                  {selectedIndicators.length === 0 && selectedPatterns.length === 0 && (
                    <p className="text-xs text-amber-500/80 bg-amber-500/5 border border-amber-500/10 px-3 py-2 rounded-lg">
                      Select at least one indicator or pattern, or switch to Auto mode.
                    </p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Signal Provenance Badge List ────────────────────────────────────────────
// Shown in the results section when dynamic mode was used.

function SignalProvenanceBadges({ result }: { result: CreateStrategyResponse }) {
  const hasSignals = result.indicators_used.length > 0 || result.patterns_used.length > 0;
  if (!hasSignals) return null;

  return (
    <div className="px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/15 space-y-2">
      <p className="text-xs font-medium text-gray-400">Signals used in this strategy</p>
      <div className="flex flex-wrap gap-1.5">
        {result.indicators_used.map(name => {
          const params = result.windows_used[name];
          const paramsStr = params
            ? Object.entries(params).map(([k, v]) => `${k}=${v}`).join(', ')
            : null;
          return (
            <span
              key={name}
              title={paramsStr ?? undefined}
              className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-blue-500/10 border border-blue-500/20 text-blue-300"
            >
              {name}{paramsStr ? ` (${paramsStr})` : ''}
            </span>
          );
        })}
        {result.patterns_used.map(name => (
          <span
            key={name}
            className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-amber-500/10 border border-amber-500/20 text-amber-300"
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TIMEFRAMES = ['1h', '15m', '5m'];

export function CreateStrategyTab() {
  // ── Form state ──────────────────────────────────────────────────────────────
  const [name, setName]           = useState('');
  const [timeframe, setTimeframe] = useState('1h');
  const [exchange, setExchange]   = useState('');
  const [symbol, setSymbol]       = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');
  const [takeProfit, setTakeProfit] = useState('3.0');
  const [stopLoss, setStopLoss]     = useState('1.0');
  const [startingBalance, setStartingBalance] = useState('1000');

  // ── Signal config state ─────────────────────────────────────────────────────
  const [signalMode, setSignalMode]               = useState<SignalMode>('auto');
  const [allIndicators, setAllIndicators]         = useState<IndicatorDetail[]>([]);
  const [allPatterns, setAllPatterns]             = useState<string[]>([]);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);
  const [selectedPatterns, setSelectedPatterns]   = useState<string[]>([]);
  const [windowConfig, setWindowConfig]           = useState<WindowConfig>({});
  const [isLoadingRegistry, setIsLoadingRegistry] = useState(false);

  // ── Exchange / coin state ───────────────────────────────────────────────────
  const [exchanges, setExchanges] = useState<ExchangeInfo[]>([]);
  const [coins, setCoins]         = useState<{ symbol: string; label: string }[]>([]);

  // ── UI state ────────────────────────────────────────────────────────────────
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
    strategyGeneratorApi.getCoins(exchange)
      .then(setCoins)
      .finally(() => setIsLoadingCoins(false));
  }, [exchange]);

  // Load indicator/pattern registry when custom mode is first activated
  useEffect(() => {
    if (signalMode !== 'custom' || allIndicators.length > 0) return;
    setIsLoadingRegistry(true);
    Promise.all([
      strategyGeneratorApi.getIndicators(),
      strategyGeneratorApi.getPatterns(),
    ])
      .then(([indRes, patRes]) => {
        setAllIndicators(indRes.indicators);
        setAllPatterns(patRes.patterns);
      })
      .catch(() => setError('Failed to load indicator registry'))
      .finally(() => setIsLoadingRegistry(false));
  }, [signalMode, allIndicators.length]);

  // ── Validation ──────────────────────────────────────────────────────────────
  const signalConfigValid = signalMode === 'auto' ||
    selectedIndicators.length > 0 || selectedPatterns.length > 0;

  const canCreate = Boolean(
    name.trim() && timeframe && exchange && symbol && !isCreating && signalConfigValid
  );

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleCreate = useCallback(async () => {
    if (!canCreate) return;
    setIsCreating(true);
    setResult(null);
    setError('');

    try {
      const payload = {
        name: name.trim(),
        timeframe,
        exchange,
        symbol,
        start_date: startDate || undefined,
        end_date:   endDate   || undefined,
        starting_balance: parseFloat(startingBalance) || 1000,
        take_profit: parseFloat(takeProfit) || 3.0,
        stop_loss:   parseFloat(stopLoss)   || 1.0,
        // Dynamic signal fields — omitted in auto mode for full backend compat
        ...(signalMode === 'custom' && {
          indicators: selectedIndicators,
          patterns:   selectedPatterns,
          window_config: Object.keys(windowConfig).length > 0 ? windowConfig : undefined,
        }),
      };
      const res = await strategyGeneratorApi.create(payload);
      setResult(res);
    } catch (e: any) {
      setError(e.message ?? 'Strategy creation failed');
    } finally {
      setIsCreating(false);
    }
  }, [
    canCreate, name, timeframe, exchange, symbol, startDate, endDate,
    startingBalance, takeProfit, stopLoss,
    signalMode, selectedIndicators, selectedPatterns, windowConfig,
  ]);

  const summary = result?.summary;
  const pnlPositive = (summary?.total_pnl_pct ?? 0) >= 0;

  // Loading description adapts to mode
  const loadingDescription = signalMode === 'custom'
    ? 'Applying custom signals · Running voting combiner · Executing backtest'
    : 'Randomising indicators · Running signal combiner · Executing backtest';

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
            Generate an indicator strategy, backtest it, and save it to your registry
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

              {/* Row 5: Signal Configuration (NEW) */}
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-1.5 font-medium">
                  <Settings2 className="w-3.5 h-3.5 text-blue-400" />
                  Signal Configuration
                </label>
                <SignalConfigSection
                  mode={signalMode}
                  onModeChange={setSignalMode}
                  allIndicators={allIndicators}
                  allPatterns={allPatterns}
                  selectedIndicators={selectedIndicators}
                  selectedPatterns={selectedPatterns}
                  windowConfig={windowConfig}
                  onIndicatorsChange={setSelectedIndicators}
                  onPatternsChange={setSelectedPatterns}
                  onWindowConfigChange={setWindowConfig}
                  isLoadingRegistry={isLoadingRegistry}
                />
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
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating strategy &amp; running backtest…</>
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
                  <p>{loadingDescription}</p>
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

            {/* Signal provenance (only shown for dynamic strategies) */}
            <SignalProvenanceBadges result={result} />

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
                onClick={() => {
                  setResult(null);
                  setError('');
                  setName('');
                  setSelectedIndicators([]);
                  setSelectedPatterns([]);
                  setWindowConfig({});
                }}
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