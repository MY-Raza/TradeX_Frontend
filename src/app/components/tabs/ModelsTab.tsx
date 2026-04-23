import { useState, useEffect } from 'react';
import { Brain, Filter, Loader2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Pie, PieChart, Cell } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { modelsApi, ModelResultListItem, ModelResultDetail } from '../../../services/api';

const COLORS = ['#3B82F6', '#06B6D4', '#10B981', '#F59E0B'];
const PAGE_SIZE = 20;

const fmt   = (v: number | null | undefined, d = 2) => v === null || v === undefined ? '–' : v.toFixed(d);
const fmtPct = (v: number | null | undefined)        => v === null || v === undefined ? '–' : `${v.toFixed(2)}%`;

export function ModelsTab() {
  const [modelType, setModelType]           = useState<'ml' | 'dl' | 'all'>('all');
  const [search, setSearch]                 = useState('');
  const [page, setPage]                     = useState(1);
  const [pages, setPages]                   = useState(1);
  const [total, setTotal]                   = useState(0);

  const [mlModels, setMlModels]             = useState<ModelResultListItem[]>([]);
  const [dlModels, setDlModels]             = useState<ModelResultListItem[]>([]);
  const [displayModels, setDisplayModels]   = useState<ModelResultListItem[]>([]);
  const [selectedModel, setSelectedModel]   = useState<ModelResultListItem | null>(null);
  const [detail, setDetail]                 = useState<ModelResultDetail | null>(null);

  const [isLoading, setIsLoading]           = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError]                   = useState('');

  // ── Initial load: get all models ──────────────────────────────────────────
  useEffect(() => {
    setIsLoading(true);
    modelsApi.getAll()
      .then((data) => {
        setMlModels(data.ml);
        setDlModels(data.dl);
        const combined = [...data.ml, ...data.dl];
        setDisplayModels(combined);
        setTotal(combined.length);
        if (combined.length > 0) setSelectedModel(combined[0]);
      })
      .catch((e) => setError(e.message ?? 'Failed to load models'))
      .finally(() => setIsLoading(false));
  }, []);

  // ── Filter + search when type / search changes ────────────────────────────
  useEffect(() => {
    let base: ModelResultListItem[] = [];
    if (modelType === 'ml')  base = mlModels;
    else if (modelType === 'dl') base = dlModels;
    else base = [...mlModels, ...dlModels];

    if (search.trim()) {
      const q = search.toLowerCase();
      base = base.filter((m) => m.model_name.toLowerCase().includes(q));
    }
    setDisplayModels(base);
    setTotal(base.length);
    setPages(Math.max(1, Math.ceil(base.length / PAGE_SIZE)));
    setPage(1);
    if (base.length > 0 && (!selectedModel || !base.find(m => m.model_name === selectedModel?.model_name))) {
      setSelectedModel(base[0]);
    }
  }, [modelType, search, mlModels, dlModels]);

  // ── Load detail whenever selectedModel changes ────────────────────────────
  useEffect(() => {
    if (!selectedModel) { setDetail(null); return; }
    const type = mlModels.find(m => m.model_name === selectedModel.model_name) ? 'ml' : 'dl';
    setIsDetailLoading(true);
    modelsApi.getByName(type, selectedModel.model_name)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setIsDetailLoading(false));
  }, [selectedModel]);

  const paginated = displayModels.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getModelType = (m: ModelResultListItem) =>
    mlModels.find(x => x.model_name === m.model_name) ? 'ml' : 'dl';

  const tradeDistribution = selectedModel
    ? [
        { name: 'Long Trades',  value: selectedModel.long_trades  ?? 0 },
        { name: 'Short Trades', value: selectedModel.short_trades ?? 0 },
      ]
    : [];

  const winLossData = selectedModel
    ? [
        { name: 'Win Trades',  value: selectedModel.win_trades  ?? 0 },
        { name: 'Loss Trades', value: selectedModel.loss_trades ?? 0 },
      ]
    : [];

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
                const isSelected = selectedModel?.model_name === model.model_name;
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
                      className={`cursor-pointer transition-all h-full ${
                        isSelected
                          ? 'bg-gradient-to-br from-blue-500 to-cyan-400 text-white'
                          : 'bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800 hover:shadow-lg'
                      }`}
                      onClick={() => setSelectedModel(model)}
                    >
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-white/20' : 'bg-gradient-to-br from-purple-500 to-purple-600'
                          }`}>
                            <Brain className="w-6 h-6 text-white" />
                          </div>
                          <div className="min-w-0">
                            <CardTitle className={`text-sm break-all leading-tight ${isSelected ? 'text-white' : ''}`}>
                              {model.model_name}
                            </CardTitle>
                            <div className="flex gap-2 mt-1 flex-wrap">
                              <Badge className={isSelected ? 'bg-white/20 text-white border-white/40' : mType === 'ml' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'}>
                                {mType.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className={`text-sm ${isSelected ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>Long</p>
                            <p className="text-xl font-bold mt-1">{model.long_trades ?? '–'}</p>
                          </div>
                          <div>
                            <p className={`text-sm ${isSelected ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>Short</p>
                            <p className="text-xl font-bold mt-1">{model.short_trades ?? '–'}</p>
                          </div>
                        </div>

                        {model.win_rate !== null && (
                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Win Rate</span>
                                <span className="font-semibold">{fmtPct(model.win_rate)}</span>
                              </div>
                              <Progress value={model.win_rate ?? 0} className={isSelected ? 'bg-white/20' : ''} />
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Loss Rate</span>
                                <span className="font-semibold">{fmtPct(model.loss_rate)}</span>
                              </div>
                              <Progress value={model.loss_rate ?? 0} className={isSelected ? 'bg-white/20' : ''} />
                            </div>
                          </div>
                        )}

                        <div className="pt-3 border-t border-white/20 dark:border-gray-800 space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className={isSelected ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}>PnL</span>
                            <span className={`font-semibold ${(model.pnl ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {model.pnl !== null ? `${model.pnl >= 0 ? '+' : ''}${fmt(model.pnl)}` : '–'}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className={isSelected ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}>Max Drawdown</span>
                            <span className="font-semibold text-red-400">{fmtPct(model.max_drawdown_pct)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className={isSelected ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}>Max Consec. Wins</span>
                            <span className="font-semibold text-green-400">{model.max_consecutive_wins ?? '–'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className={isSelected ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}>Max Consec. Losses</span>
                            <span className="font-semibold text-red-400">{model.max_consecutive_losses ?? '–'}</span>
                          </div>
                        </div>
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

      {/* Detail charts for selected model */}
      {selectedModel && !isLoading && (
        <motion.div
          key={selectedModel.model_name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {isDetailLoading && (
            <Card className="lg:col-span-2 bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
              <CardContent className="p-8 flex justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </CardContent>
            </Card>
          )}

          {detail && !isDetailLoading && (
            <>
              {/* Full metrics */}
              <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
                <CardHeader>
                  <CardTitle>Full Metrics – {selectedModel.model_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      ['Gross Profit',    fmtPct(detail.gross_profit)],
                      ['Gross Loss',      fmtPct(detail.gross_loss)],
                      ['Net Profit',      fmtPct(detail.net_profit)],
                      ['Avg Trade PnL',   fmtPct(detail.avg_trade_pnl)],
                      ['Avg Win',         fmtPct(detail.avg_win)],
                      ['Avg Loss',        fmtPct(detail.avg_loss)],
                      ['Risk/Reward',     fmt(detail.risk_reward_ratio)],
                      ['Profit Factor',   fmt(detail.profit_factor)],
                      ['Sharpe Ratio',    fmt(detail.sharpe_ratio)],
                      ['Sortino Ratio',   fmt(detail.sortino_ratio)],
                      ['Breakeven',       String(detail.breakeven_trades ?? '–')],
                      ['Total Trades',    String(detail.total_trades   ?? '–')],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between p-2 bg-gray-50 dark:bg-[#0B0F19] rounded-lg">
                        <span className="text-gray-500 dark:text-gray-400">{label}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Trade Distribution pie */}
              <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
                <CardHeader>
                  <CardTitle>Trade Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={tradeDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {tradeDistribution.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Win vs Loss bar */}
              <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800 lg:col-span-2">
                <CardHeader>
                  <CardTitle>Win vs Loss Trades</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={winLossData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                      <XAxis dataKey="name" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                      />
                      <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}