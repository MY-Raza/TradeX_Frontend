import { useState } from 'react';
import { PlayCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

const strategies = ['MA Crossover', 'RSI Momentum', 'Bollinger Breakout', 'VWAP Reversion'];
const exchanges = ['Binance', 'Coinbase', 'Kraken', 'Bybit'];

const ledgerData = [
  { date: '2026-04-01', type: 'Buy', price: 68500, quantity: 0.1, pnl: 0 },
  { date: '2026-04-02', type: 'Sell', price: 69200, quantity: 0.1, pnl: 70 },
  { date: '2026-04-03', type: 'Buy', price: 68800, quantity: 0.15, pnl: 0 },
  { date: '2026-04-04', type: 'Sell', price: 70100, quantity: 0.15, pnl: 195 },
  { date: '2026-04-05', type: 'Buy', price: 69900, quantity: 0.12, pnl: 0 },
];

const winLossData = [
  { name: 'Trades Won', value: 28 },
  { name: 'Trades Lost', value: 12 },
];

const pnlData = [
  { trade: 1, pnl: 150 },
  { trade: 2, pnl: -80 },
  { trade: 3, pnl: 220 },
  { trade: 4, pnl: 180 },
  { trade: 5, pnl: -120 },
  { trade: 6, pnl: 310 },
  { trade: 7, pnl: 90 },
  { trade: 8, pnl: -50 },
];

export function BacktestTab() {
  const [strategy, setStrategy] = useState('');
  const [exchange, setExchange] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleRunBacktest = () => {
    if (!strategy || !exchange) return;

    setIsRunning(true);
    setShowResults(false);

    setTimeout(() => {
      setIsRunning(false);
      setShowResults(true);
    }, 2000);
  };

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

      <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Strategy</label>
              <Select value={strategy} onValueChange={setStrategy}>
                <SelectTrigger>
                  <SelectValue placeholder="Select strategy" />
                </SelectTrigger>
                <SelectContent>
                  {strategies.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
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
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
            onClick={handleRunBacktest}
            disabled={!strategy || !exchange || isRunning}
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

      <AnimatePresence>
        {showResults && !isRunning && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
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
                        <TableHead>Price</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>PnL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ledgerData.map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell>{entry.date}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              entry.type === 'Buy'
                                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                : 'bg-red-500/10 text-red-600 dark:text-red-400'
                            }`}>
                              {entry.type}
                            </span>
                          </TableCell>
                          <TableCell>${entry.price.toLocaleString()}</TableCell>
                          <TableCell>{entry.quantity}</TableCell>
                          <TableCell className={entry.pnl > 0 ? 'text-green-500' : entry.pnl < 0 ? 'text-red-500' : ''}>
                            {entry.pnl > 0 ? '+' : ''}${entry.pnl}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
                <CardHeader>
                  <CardTitle>Trades Won vs Lost</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={winLossData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                      <XAxis dataKey="name" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                        }}
                      />
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
                    <LineChart data={pnlData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                      <XAxis dataKey="trade" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                        }}
                      />
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
