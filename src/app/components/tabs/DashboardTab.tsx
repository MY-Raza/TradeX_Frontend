import { useState, useEffect } from 'react';
import { TrendingUp, Brain, PlayCircle, Database, Plus, Loader2, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import { motion } from 'motion/react';
import {
  strategiesApi,
  modelsApi,
  backtestApi,
  dataApi,
  StrategyListItem,
  ModelResultListItem,
} from '../../../services/api';

interface DashboardData {
  totalStrategies: number;
  totalModels: number;
  totalExchanges: number;
  topStrategies: StrategyListItem[];
  topModels: ModelResultListItem[];
  pnlChartData: { name: string; pnl: number }[];
  winRateData: { name: string; winRate: number }[];
}

export function DashboardTab() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const [strategiesRes, modelsRes, exchangesRes] = await Promise.all([
          strategiesApi.list({ page: 1, page_size: 100 }),
          modelsApi.getAll(),
          dataApi.getExchanges(),
        ]);

        // Top 5 strategies by pnl_sum (non-null, descending)
        const sortedStrategies = [...strategiesRes.results]
          .filter((s) => s.pnl_sum !== null)
          .sort((a, b) => (b.pnl_sum ?? 0) - (a.pnl_sum ?? 0))
          .slice(0, 5);

        // All models combined
        const allModels = [...modelsRes.ml, ...modelsRes.dl];

        // Top 5 models by pnl (non-null, descending)
        const topModels = [...allModels]
          .filter((m) => m.pnl !== null)
          .sort((a, b) => (b.pnl ?? 0) - (a.pnl ?? 0))
          .slice(0, 5);

        // PnL chart: top strategies pnl_sum
        const pnlChartData = sortedStrategies.map((s) => ({
          name: s.name.length > 14 ? s.name.slice(0, 14) + '…' : s.name,
          pnl: parseFloat((s.pnl_sum ?? 0).toFixed(2)),
        }));

        // Win rate chart: top models win_rate
        const winRateData = topModels
          .filter((m) => m.win_rate !== null)
          .map((m) => ({
            name: m.model_name.length > 14 ? m.model_name.slice(0, 14) + '…' : m.model_name,
            winRate: parseFloat(((m.win_rate ?? 0) * 100).toFixed(1)),
          }));

        setData({
          totalStrategies: strategiesRes.total,
          totalModels: modelsRes.total_ml + modelsRes.total_dl,
          totalExchanges: exchangesRes.length,
          topStrategies: sortedStrategies,
          topModels,
          pnlChartData,
          winRateData,
        });
      } catch (e: any) {
        setError(e.message ?? 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-32 space-y-4"
      >
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-gray-500 dark:text-gray-400">Loading dashboard...</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-32"
      >
        <p className="text-red-500 bg-red-500/10 px-6 py-3 rounded-lg">{error}</p>
      </motion.div>
    );
  }

  const kpiData = [
    {
      label: 'Total Strategies',
      value: String(data?.totalStrategies ?? 0),
      icon: TrendingUp,
      color: 'blue',
    },
    {
      label: 'Total Models',
      value: String(data?.totalModels ?? 0),
      icon: Brain,
      color: 'purple',
    },
    {
      label: 'Active Exchanges',
      value: String(data?.totalExchanges ?? 0),
      icon: Database,
      color: 'cyan',
    },
    {
      label: 'Top Strategy PnL',
      value:
        data?.topStrategies[0]?.pnl_sum != null
          ? `${data.topStrategies[0].pnl_sum >= 0 ? '+' : ''}${data.topStrategies[0].pnl_sum.toFixed(2)}`
          : '–',
      icon: data?.topStrategies[0]?.pnl_sum != null && data.topStrategies[0].pnl_sum >= 0
        ? TrendingUp
        : TrendingDown,
      color:
        data?.topStrategies[0]?.pnl_sum != null && data.topStrategies[0].pnl_sum >= 0
          ? 'green'
          : 'red',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Overview of your trading platform</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{kpi.label}</p>
                      <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{kpi.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl bg-${kpi.color}-500/10`}>
                      <Icon className={`w-6 h-6 text-${kpi.color}-500`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Strategies PnL */}
        <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Top Strategies by PnL</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.pnlChartData && data.pnlChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.pnlChartData} layout="vertical" margin={{ left: 8, right: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis type="number" stroke="#9CA3AF" tickFormatter={(v) => `${v}`} />
                  <YAxis type="category" dataKey="name" stroke="#9CA3AF" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                    formatter={(v: number) => [`${v >= 0 ? '+' : ''}${v}`, 'PnL']}
                  />
                  <Bar
                    dataKey="pnl"
                    radius={[0, 6, 6, 0]}
                    fill="#3B82F6"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
                No strategy PnL data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Models Win Rate */}
        <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Top Models by Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.winRateData && data.winRateData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.winRateData} layout="vertical" margin={{ left: 8, right: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis type="number" stroke="#9CA3AF" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" stroke="#9CA3AF" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                    formatter={(v: number) => [`${v}%`, 'Win Rate']}
                  />
                  <Bar dataKey="winRate" radius={[0, 6, 6, 0]} fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
                No model win rate data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Strategies + Top Models side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Strategies Table */}
        <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Top Performing Strategies</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.topStrategies && data.topStrategies.length > 0 ? (
              <div className="space-y-3">
                {data.topStrategies.map((s, i) => (
                  <div
                    key={s.name}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-[#0B0F19] hover:bg-gray-100 dark:hover:bg-[#111827] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400 w-5">#{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{s.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {s.symbol.toUpperCase()} · {s.time_horizon}
                          {s.indicators.length > 0 && ` · ${s.indicators.slice(0, 2).join(', ')}`}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        (s.pnl_sum ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {s.pnl_sum !== null
                        ? `${s.pnl_sum >= 0 ? '+' : ''}${s.pnl_sum.toFixed(2)}`
                        : '–'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-6">No strategies available</p>
            )}
          </CardContent>
        </Card>

        {/* Top Models Table */}
        <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Top Performing Models</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.topModels && data.topModels.length > 0 ? (
              <div className="space-y-3">
                {data.topModels.map((m, i) => (
                  <div
                    key={m.model_name}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-[#0B0F19] hover:bg-gray-100 dark:hover:bg-[#111827] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400 w-5">#{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{m.model_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {m.total_trades != null ? `${m.total_trades} trades` : ''}
                          {m.win_rate != null ? ` · ${(m.win_rate * 100).toFixed(1)}% win rate` : ''}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        (m.pnl ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {m.pnl !== null
                        ? `${m.pnl >= 0 ? '+' : ''}${m.pnl.toFixed(2)}`
                        : '–'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-6">No model data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-20 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600">
              <Plus className="w-5 h-5 mr-2" />
              Create Strategy
            </Button>
            <Button className="h-20 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600">
              <Plus className="w-5 h-5 mr-2" />
              Train Model
            </Button>
            <Button className="h-20 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600">
              <PlayCircle className="w-5 h-5 mr-2" />
              Run Backtest
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}