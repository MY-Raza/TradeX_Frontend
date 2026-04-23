import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, TrendingUp, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { motion, AnimatePresence } from 'motion/react';
import {
  strategiesApi,
  StrategyListItem,
  StrategyDetail,
  StrategyFilterOptions,
} from '../../../services/api';

const PAGE_SIZE = 20;

export function StrategiesTab() {
  const [searchQuery, setSearchQuery]     = useState('');
  const [symbolFilter, setSymbolFilter]   = useState('all');
  const [horizonFilter, setHorizonFilter] = useState('all');
  const [expandedName, setExpandedName]   = useState<string | null>(null);
  const [detailMap, setDetailMap]         = useState<Record<string, StrategyDetail>>({});

  const [strategies, setStrategies]   = useState<StrategyListItem[]>([]);
  const [filters, setFilters]         = useState<StrategyFilterOptions>({ symbols: [], time_horizons: [] });
  const [total, setTotal]             = useState(0);
  const [pages, setPages]             = useState(1);
  const [page, setPage]               = useState(1);
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState('');

  // ── Load filter options once ──────────────────────────────────────────────
  useEffect(() => {
    strategiesApi.getFilters()
      .then(setFilters)
      .catch(() => {/* non-fatal */});
  }, []);

  // ── Fetch strategies (debounced on search) ───────────────────────────────
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

  // Re-fetch when filters change
  useEffect(() => { fetchStrategies(1); }, [fetchStrategies]);

  // ── Debounce search input ─────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => fetchStrategies(1), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ── Load detail when a strategy is expanded ───────────────────────────────
  const handleExpand = async (name: string, open: boolean) => {
    setExpandedName(open ? name : null);
    if (open && !detailMap[name]) {
      try {
        const detail = await strategiesApi.getByName(name);
        setDetailMap((prev) => ({ ...prev, [name]: detail }));
      } catch {/* show partial data */}
    }
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

      {/* Loading spinner */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
          <CardContent className="p-8 text-center">
            <p className="text-red-500">{error}</p>
            <Button className="mt-4" onClick={() => fetchStrategies(page)}>Retry</Button>
          </CardContent>
        </Card>
      )}

      {/* Strategy list */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {strategies.map((strategy, index) => {
              const detail = detailMap[strategy.name];
              return (
                <motion.div
                  key={strategy.name}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                >
                  <Collapsible
                    open={expandedName === strategy.name}
                    onOpenChange={(open) => handleExpand(strategy.name, open)}
                  >
                    <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all">
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-[#0B0F19] transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shrink-0">
                                <TrendingUp className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white break-all">
                                  {strategy.name}
                                </h3>
                                <div className="flex gap-2 mt-1 flex-wrap">
                                  <Badge variant="outline">{strategy.symbol.toUpperCase()}</Badge>
                                  <Badge variant="outline">{strategy.time_horizon}</Badge>
                                  {strategy.pnl_sum !== null && (
                                    <Badge className={strategy.pnl_sum >= 0 ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}>
                                      PnL: {strategy.pnl_sum >= 0 ? '+' : ''}{fmt(strategy.pnl_sum)}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <ChevronDown
                              className={`w-5 h-5 text-gray-400 transition-transform shrink-0 ${
                                expandedName === strategy.name ? 'rotate-180' : ''
                              }`}
                            />
                          </div>

                          {/* Indicator / pattern badges */}
                          {(strategy.indicators.length > 0 || strategy.patterns.length > 0) && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {strategy.indicators.map((ind) => (
                                <Badge key={ind} className="bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                  {ind.toUpperCase()}
                                </Badge>
                              ))}
                              {strategy.patterns.map((pat) => (
                                <Badge key={pat} className="bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                  {pat}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardHeader>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <CardContent className="pt-0 space-y-4">
                          {!detail ? (
                            <div className="flex justify-center py-4">
                              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                            </div>
                          ) : (
                            <>
                              {/* TP / SL */}
                              {(detail.tp || detail.sl) && (
                                <div className="grid grid-cols-2 gap-4">
                                  {detail.tp && (
                                    <div className="p-3 bg-green-500/10 rounded-xl">
                                      <p className="text-xs text-gray-500 dark:text-gray-400">Take Profit</p>
                                      <p className="text-lg font-bold text-green-600 dark:text-green-400">{detail.tp}%</p>
                                    </div>
                                  )}
                                  {detail.sl && (
                                    <div className="p-3 bg-red-500/10 rounded-xl">
                                      <p className="text-xs text-gray-500 dark:text-gray-400">Stop Loss</p>
                                      <p className="text-lg font-bold text-red-600 dark:text-red-400">{detail.sl}%</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Indicator details */}
                              {Object.keys(detail.indicator_details).length > 0 && (
                                <div className="p-4 bg-gray-50 dark:bg-[#0B0F19] rounded-xl">
                                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">
                                    Indicator Parameters
                                  </h4>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {Object.entries(detail.indicator_details).map(([ind, params]) => (
                                      <div key={ind} className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase mb-1">{ind}</p>
                                        {Object.keys(params).length === 0 ? (
                                          <p className="text-xs text-gray-500">No parameters</p>
                                        ) : (
                                          Object.entries(params).map(([k, v]) => (
                                            <p key={k} className="text-xs text-gray-600 dark:text-gray-400">
                                              {k}: <span className="font-medium text-gray-900 dark:text-white">{v ?? '–'}</span>
                                            </p>
                                          ))
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Active patterns */}
                              {detail.patterns.length > 0 && (
                                <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl">
                                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">Active Patterns</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {detail.patterns.map((p) => (
                                      <Badge key={p} className="bg-purple-500/10 text-purple-600 dark:text-purple-400">{p}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchStrategies(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchStrategies(page + 1)}
            disabled={page >= pages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </motion.div>
  );
}