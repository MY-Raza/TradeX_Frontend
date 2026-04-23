import { useState, useEffect } from 'react';
import { PlayCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import {
  backtestApi,
  dataApi,
  BacktestStrategyOption,
  ExchangeInfo,
  BacktestResponse,
} from '../../../services/api';

export function BacktestTab() {
  const [strategies, setStrategies]   = useState<BacktestStrategyOption[]>([]);
  const [exchanges, setExchanges]     = useState<ExchangeInfo[]>([]);
  const [strategy, setStrategy]       = useState('');
  const [exchange, setExchange]       = useState('');

  const [isLoading, setIsLoading]     = useState(false);
  const [isRunning, setIsRunning]     = useState(false);
  const [error, setError]             = useState('');
  const [result, setResult]           = useState<BacktestResponse | null>(null);

  // ── Load dropdowns ────────────────────────────────────────────────────────
  useEffect(() => {
    setIsLoading(true);
    Promise.all([backtestApi.getStrategies(), dataApi.getExchanges()])
      .then(([strats, excs]) => { setStrategies(strats); setExchanges(excs); })
      .catch(() => setError('Failed to load strategies / exchanges'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleRunBacktest = async () => {
    if (!strategy || !exchange) return;
    setIsRunning(true);
    setResult(null);
    setError('');

    try {
      const res = await backtestApi.run({ strategy_name: strategy, exchange });
      setResult(res);
    } catch (e: any) {
      setError(e.message ?? 'Backtest failed');
    } finally {
      setIsRunning(false);
    }
  };

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strategy */}
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
                          {s.tp ? ` · TP ${s.tp}%` : ''}
                          {s.sl ? ` · SL ${s.sl}%` : ''}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Exchange */}
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
          )}

          {error && (
            <p className="text-sm text-red-500 bg-red-500/10 px-4 py-2 rounded-lg">{error}</p>
          )}

          <Button
            className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
            onClick={handleRunBacktest}
            disabled={!strategy || !exchange || isRunning || isLoading}
          >
            {isRunning ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Running Backtest...
              </>
            ) : (
              <>
                <PlayCircle className="w-5 h-5 mr-2" />
                Run Backtest
              </>
            )}
          </Button>
        </CardContent>
      </Card>

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
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Analyzing historical data</p>
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
            {/* Summary cards */}
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Starting Balance', value: `$${summary.starting_balance.toLocaleString()}`, color: 'text-gray-900 dark:text-white' },
                  { label: 'Final Balance',    value: `$${summary.final_balance.toLocaleString()}`,    color: summary.final_balance >= summary.starting_balance ? 'text-green-500' : 'text-red-500' },
                  { label: 'Total PnL',        value: `${summary.total_pnl_pct >= 0 ? '+' : ''}${summary.total_pnl_pct.toFixed(2)}%`, color: summary.total_pnl_pct >= 0 ? 'text-green-500' : 'text-red-500' },
                  { label: 'Total Trades',     value: String(summary.total_trades), color: 'text-blue-500' },
                  { label: 'Win Rate',         value: `${summary.win_rate.toFixed(1)}%`, color: 'text-green-500' },
                  { label: 'Loss Rate',        value: `${summary.loss_rate.toFixed(1)}%`, color: 'text-red-500' },
                  { label: 'Max Consec. Wins', value: String(summary.max_consecutive_wins), color: 'text-green-500' },
                  { label: 'Max Consec. Losses', value: String(summary.max_consecutive_losses), color: 'text-red-500' },
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
                <CardHeader>
                  <CardTitle>Trades Won vs Lost</CardTitle>
                </CardHeader>
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
                <CardHeader>
                  <CardTitle>PnL per Trade</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={result.pnl_data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                      <XAxis dataKey="trade" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                      <Line
                        type="monotone"
                        dataKey="pnl"
                        stroke="#10B981"
                        strokeWidth={3}
                        dot={{ fill: '#10B981', r: 4 }}
                      />
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