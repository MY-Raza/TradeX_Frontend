import { useState, useEffect } from 'react';
import { Brain, Filter, Loader2, ChevronLeft, ChevronRight, Search, X, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip,
  CartesianGrid, Pie, PieChart, Cell,
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { modelsApi, ModelResultListItem, ModelResultDetail } from '../../../services/api';

const COLORS = ['#3B82F6', '#06B6D4', '#10B981', '#F59E0B'];
const PAGE_SIZE = 20;

const fmt    = (v: number | null | undefined, d = 2) => v === null || v === undefined ? '–' : v.toFixed(d);
const fmtPct = (v: number | null | undefined)         => v === null || v === undefined ? '–' : `${v.toFixed(2)}%`;

// ── Model Detail Modal ────────────────────────────────────────────────────────
function ModelModal({
  model,
  detail,
  isLoading,
  onClose,
}: {
  model: ModelResultListItem;
  detail: ModelResultDetail | null;
  isLoading: boolean;
  onClose: () => void;
}) {
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const tradeDistribution = [
    { name: 'Long Trades',  value: model.long_trades  ?? 0 },
    { name: 'Short Trades', value: model.short_trades ?? 0 },
  ];

  const winLossData = [
    { name: 'Win Trades',  value: model.win_trades  ?? 0 },
    { name: 'Loss Trades', value: model.loss_trades ?? 0 },
  ];

  const pnlPositive = (model.pnl ?? 0) >= 0;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleBackdrop}
        style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      >
        <motion.div
          className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0F1420] border border-gray-800 shadow-2xl"
          initial={{ scale: 0.92, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        >
          {/* Close button */}
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
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-white truncate">{model.model_name}</h2>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {model.win_rate !== null && (
                    <Badge className="bg-green-500/15 text-green-400 border-green-500/30 text-xs">
                      Win {fmtPct(model.win_rate)}
                    </Badge>
                  )}
                  <Badge className={`text-xs ${pnlPositive ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}`}>
                    PnL: {model.pnl !== null ? `${pnlPositive ? '+' : ''}${fmt(model.pnl)}` : '–'}
                  </Badge>
                  {model.max_drawdown_pct !== null && (
                    <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-xs">
                      Drawdown {fmtPct(model.max_drawdown_pct)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {isLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            )}

            {!isLoading && detail && (
              <>
                {/* Full Metrics Grid */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">Full Metrics</h3>
                  <div className="grid grid-cols-2 gap-2.5 text-sm">
                    {[
                      ['Gross Profit',    fmtPct(detail.gross_profit),   'positive'],
                      ['Gross Loss',      fmtPct(detail.gross_loss),     'negative'],
                      ['Net Profit',      fmtPct(detail.net_profit),     detail.net_profit !== null && detail.net_profit >= 0 ? 'positive' : 'negative'],
                      ['Avg Trade PnL',   fmtPct(detail.avg_trade_pnl),  detail.avg_trade_pnl !== null && detail.avg_trade_pnl >= 0 ? 'positive' : 'negative'],
                      ['Avg Win',         fmtPct(detail.avg_win),        'positive'],
                      ['Avg Loss',        fmtPct(detail.avg_loss),       'negative'],
                      ['Risk/Reward',     fmt(detail.risk_reward_ratio),  'neutral'],
                      ['Profit Factor',   fmt(detail.profit_factor),      'neutral'],
                      ['Sharpe Ratio',    fmt(detail.sharpe_ratio),       'neutral'],
                      ['Sortino Ratio',   fmt(detail.sortino_ratio),      'neutral'],
                      ['Breakeven',       String(detail.breakeven_trades ?? '–'), 'neutral'],
                      ['Total Trades',    String(detail.total_trades   ?? '–'),   'neutral'],
                    ].map(([label, value, sentiment]) => (
                      <div key={label} className="flex justify-between items-center p-2.5 bg-[#0B0F19] border border-gray-800 rounded-lg">
                        <span className="text-gray-400 text-xs">{label}</span>
                        <span className={`font-semibold text-sm ${
                          sentiment === 'positive' ? 'text-green-400' :
                          sentiment === 'negative' ? 'text-red-400' :
                          'text-white'
                        }`}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-[#0B0F19] border border-gray-800 rounded-xl">
                    <TrendingUp className="w-4 h-4 text-green-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Max Consec. Wins</p>
                      <p className="font-bold text-green-400">{model.max_consecutive_wins ?? '–'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-[#0B0F19] border border-gray-800 rounded-xl">
                    <TrendingDown className="w-4 h-4 text-red-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Max Consec. Losses</p>
                      <p className="font-bold text-red-400">{model.max_consecutive_losses ?? '–'}</p>
                    </div>
                  </div>
                </div>

                {/* Win/Loss rates */}
                {model.win_rate !== null && (
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-400">Win Rate</span>
                        <span className="font-semibold text-green-400">{fmtPct(model.win_rate)}</span>
                      </div>
                      <Progress value={model.win_rate ?? 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-400">Loss Rate</span>
                        <span className="font-semibold text-red-400">{fmtPct(model.loss_rate)}</span>
                      </div>
                      <Progress value={model.loss_rate ?? 0} className="h-2" />
                    </div>
                  </div>
                )}

                {/* Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Trade Distribution Pie */}
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3">Trade Distribution</h3>
                    <div className="p-4 bg-[#0B0F19] border border-gray-800 rounded-xl">
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={tradeDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={80}
                            dataKey="value"
                          >
                            {tradeDistribution.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0F1420', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Win vs Loss Bar */}
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3">Win vs Loss Trades</h3>
                    <div className="p-4 bg-[#0B0F19] border border-gray-800 rounded-xl">
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={winLossData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                          <XAxis dataKey="name" stroke="#6B7280" tick={{ fontSize: 11 }} />
                          <YAxis stroke="#6B7280" tick={{ fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0F1420', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                          />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                            {winLossData.map((_, i) => (
                              <Cell key={i} fill={i === 0 ? '#10B981' : '#EF4444'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Main Tab ──────────────────────────────────────────────────────────────────
export function ModelsTab() {
  const [modelType, setModelType] = useState<'ml' | 'dl' | 'all'>('all');
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [pages, setPages]         = useState(1);
  const [total, setTotal]         = useState(0);

  const [mlModels, setMlModels]           = useState<ModelResultListItem[]>([]);
  const [dlModels, setDlModels]           = useState<ModelResultListItem[]>([]);
  const [displayModels, setDisplayModels] = useState<ModelResultListItem[]>([]);

  // Modal state
  const [modalModel, setModalModel]               = useState<ModelResultListItem | null>(null);
  const [modalDetail, setModalDetail]             = useState<ModelResultDetail | null>(null);
  const [isModalDetailLoading, setIsModalDetailLoading] = useState(false);
  const [detailCache, setDetailCache]             = useState<Record<string, ModelResultDetail>>({});

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState('');

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    setIsLoading(true);
    modelsApi.getAll()
      .then((data) => {
        setMlModels(data.ml);
        setDlModels(data.dl);
        const combined = [...data.ml, ...data.dl];
        setDisplayModels(combined);
        setTotal(combined.length);
        setPages(Math.max(1, Math.ceil(combined.length / PAGE_SIZE)));
      })
      .catch((e) => setError(e.message ?? 'Failed to load models'))
      .finally(() => setIsLoading(false));
  }, []);

  // ── Filter + search ───────────────────────────────────────────────────────
  useEffect(() => {
    let base: ModelResultListItem[] = [];
    if (modelType === 'ml')       base = mlModels;
    else if (modelType === 'dl')  base = dlModels;
    else                          base = [...mlModels, ...dlModels];

    if (search.trim()) {
      const q = search.toLowerCase();
      base = base.filter((m) => m.model_name.toLowerCase().includes(q));
    }
    setDisplayModels(base);
    setTotal(base.length);
    setPages(Math.max(1, Math.ceil(base.length / PAGE_SIZE)));
    setPage(1);
  }, [modelType, search, mlModels, dlModels]);

  const paginated = displayModels.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getModelType = (m: ModelResultListItem) =>
    mlModels.find(x => x.model_name === m.model_name) ? 'ml' : 'dl';

  // ── Open modal ────────────────────────────────────────────────────────────
  const openModal = async (model: ModelResultListItem) => {
    setModalModel(model);
    setModalDetail(null);

    if (detailCache[model.model_name]) {
      setModalDetail(detailCache[model.model_name]);
      return;
    }

    const type = getModelType(model);
    setIsModalDetailLoading(true);
    try {
      const detail = await modelsApi.getByName(type, model.model_name);
      setDetailCache((prev) => ({ ...prev, [model.model_name]: detail }));
      setModalDetail(detail);
    } catch {
      /* show partial */
    } finally {
      setIsModalDetailLoading(false);
    }
  };

  const closeModal = () => {
    setModalModel(null);
    setModalDetail(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Models</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Analyze your trading models performance
            {total > 0 && <span className="ml-2 text-blue-500 font-medium">({total} models)</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search models..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-52"
            />
          </div>
          <div className="w-44">
            <Select value={modelType} onValueChange={(v: any) => setModelType(v)}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Models</SelectItem>
                <SelectItem value="ml">ML Models</SelectItem>
                <SelectItem value="dl">DL Models</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
          <CardContent className="p-8 text-center">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Model cards grid */}
      {!isLoading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {paginated.map((model, index) => {
                const mType = getModelType(model);
                return (
                  <motion.div
                    key={model.model_name}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                  >
                    <Card
                      className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800 hover:shadow-xl hover:border-blue-500/40 transition-all cursor-pointer group overflow-hidden"
                      onClick={() => openModal(model)}
                    >
                      <CardHeader className="pb-3 bg-gradient-to-br from-blue-600 to-cyan-500">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                              <Brain className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-sm font-semibold text-white line-clamp-1">
                                {model.model_name}
                              </CardTitle>
                              <Badge className="mt-1 bg-white/20 text-white border-0 text-xs">
                                {mType.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                          <span className="text-white/60 text-xs group-hover:text-white transition-colors">→</span>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-4 space-y-3 text-sm text-gray-600 dark:text-gray-400">
                        {model.win_rate !== null && (
                          <div className="space-y-1.5">
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Win Rate</span>
                                <span className="font-semibold text-green-500">{fmtPct(model.win_rate)}</span>
                              </div>
                              <Progress value={model.win_rate ?? 0} className="h-1.5" />
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Loss Rate</span>
                                <span className="font-semibold text-red-500">{fmtPct(model.loss_rate)}</span>
                              </div>
                              <Progress value={model.loss_rate ?? 0} className="h-1.5" />
                            </div>
                          </div>
                        )}

                        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>PnL</span>
                            <span className={`font-semibold ${(model.pnl ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {model.pnl !== null ? `${model.pnl >= 0 ? '+' : ''}${fmt(model.pnl)}` : '–'}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Max Drawdown</span>
                            <span className="font-semibold text-red-500">{fmtPct(model.max_drawdown_pct)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Consec. Wins / Losses</span>
                            <span className="font-semibold">
                              <span className="text-green-500">{model.max_consecutive_wins ?? '–'}</span>
                              {' / '}
                              <span className="text-red-500">{model.max_consecutive_losses ?? '–'}</span>
                            </span>
                          </div>
                        </div>

                        <p className="text-center text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                          Click to view full metrics & charts
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {paginated.length === 0 && (
            <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
              <CardContent className="p-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">No models found matching your filter.</p>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">Page {page} of {pages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= pages}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {modalModel && (
        <ModelModal
          model={modalModel}
          detail={modalDetail}
          isLoading={isModalDetailLoading}
          onClose={closeModal}
        />
      )}
    </motion.div>
  );
}