import { useState } from 'react';
import { Database, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

const exchanges = ['Binance', 'Mt5 Trader', 'Kraken', 'Bybit'];
const coins = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT'];
const timeframes = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '1d', label: '1 Day' },
];

const chartDataByTimeframe: Record<string, any[]> = {
  '1m': [
    { time: '09:00', open: 70800, high: 70950, low: 70750, close: 70900, volume: 125000 },
    { time: '09:01', open: 70900, high: 71100, low: 70880, close: 71050, volume: 138000 },
    { time: '09:02', open: 71050, high: 71200, low: 71000, close: 71150, volume: 142000 },
    { time: '09:03', open: 71150, high: 71180, low: 70950, close: 71000, volume: 156000 },
    { time: '09:04', open: 71000, high: 71250, low: 70980, close: 71200, volume: 163000 },
    { time: '09:05', open: 71200, high: 71350, low: 71150, close: 71300, volume: 148000 },
    { time: '09:06', open: 71300, high: 71320, low: 71100, close: 71150, volume: 132000 },
    { time: '09:07', open: 71150, high: 71400, low: 71120, close: 71350, volume: 175000 },
    { time: '09:08', open: 71350, high: 71500, low: 71300, close: 71450, volume: 182000 },
    { time: '09:09', open: 71450, high: 71550, low: 71400, close: 71500, volume: 159000 },
    { time: '09:10', open: 71500, high: 71600, low: 71450, close: 71550, volume: 167000 },
    { time: '09:11', open: 71550, high: 71700, low: 71520, close: 71650, volume: 194000 },
  ],
  '5m': [
    { time: '09:00', open: 70800, high: 71200, low: 70750, close: 71100, volume: 625000 },
    { time: '09:05', open: 71100, high: 71400, low: 71050, close: 71300, volume: 680000 },
    { time: '09:10', open: 71300, high: 71600, low: 71250, close: 71500, volume: 720000 },
    { time: '09:15', open: 71500, high: 71800, low: 71450, close: 71700, volume: 755000 },
    { time: '09:20', open: 71700, high: 71750, low: 71500, close: 71600, volume: 685000 },
    { time: '09:25', open: 71600, high: 71900, low: 71550, close: 71850, volume: 820000 },
    { time: '09:30', open: 71850, high: 72100, low: 71800, close: 72000, volume: 890000 },
    { time: '09:35', open: 72000, high: 72050, low: 71750, close: 71800, volume: 735000 },
    { time: '09:40', open: 71800, high: 72200, low: 71780, close: 72100, volume: 925000 },
    { time: '09:45', open: 72100, high: 72300, low: 72050, close: 72200, volume: 840000 },
    { time: '09:50', open: 72200, high: 72250, low: 71900, close: 72000, volume: 715000 },
    { time: '09:55', open: 72000, high: 72400, low: 71980, close: 72300, volume: 965000 },
  ],
  '15m': [
    { time: '09:00', open: 70800, high: 71400, low: 70750, close: 71300, volume: 1850000 },
    { time: '09:15', open: 71300, high: 71900, low: 71250, close: 71700, volume: 2125000 },
    { time: '09:30', open: 71700, high: 72100, low: 71650, close: 72000, volume: 2340000 },
    { time: '09:45', open: 72000, high: 72300, low: 71950, close: 72200, volume: 2180000 },
    { time: '10:00', open: 72200, high: 72500, low: 72100, close: 72400, volume: 2520000 },
    { time: '10:15', open: 72400, high: 72450, low: 72000, close: 72100, volume: 2015000 },
    { time: '10:30', open: 72100, high: 72600, low: 72050, close: 72500, volume: 2780000 },
    { time: '10:45', open: 72500, high: 72800, low: 72450, close: 72700, volume: 2950000 },
    { time: '11:00', open: 72700, high: 72750, low: 72400, close: 72500, volume: 2240000 },
    { time: '11:15', open: 72500, high: 73000, low: 72480, close: 72900, volume: 3125000 },
    { time: '11:30', open: 72900, high: 73100, low: 72800, close: 73000, volume: 2890000 },
    { time: '11:45', open: 73000, high: 73200, low: 72950, close: 73100, volume: 2675000 },
  ],
  '1h': [
    { time: '00:00', open: 68500, high: 69200, low: 68300, close: 68900, volume: 12500000 },
    { time: '01:00', open: 68900, high: 69500, low: 68600, close: 69100, volume: 13800000 },
    { time: '02:00', open: 69100, high: 70200, low: 68900, close: 70000, volume: 15200000 },
    { time: '03:00', open: 70000, high: 70800, low: 69500, close: 69800, volume: 14200000 },
    { time: '04:00', open: 69800, high: 70500, low: 69200, close: 70200, volume: 16800000 },
    { time: '05:00', open: 70200, high: 71000, low: 70000, close: 70800, volume: 17500000 },
    { time: '06:00', open: 70800, high: 71200, low: 70300, close: 70500, volume: 16200000 },
    { time: '07:00', open: 70500, high: 71500, low: 70400, close: 71200, volume: 18800000 },
    { time: '08:00', open: 71200, high: 71800, low: 70900, close: 71500, volume: 19500000 },
    { time: '09:00', open: 71500, high: 72200, low: 71200, close: 71100, volume: 17200000 },
    { time: '10:00', open: 71100, high: 71600, low: 70600, close: 71400, volume: 18400000 },
    { time: '11:00', open: 71400, high: 72000, low: 71300, close: 71800, volume: 19200000 },
  ],
  '4h': [
    { time: 'Apr 20 00:00', open: 68500, high: 70200, low: 68300, close: 70000, volume: 52500000 },
    { time: 'Apr 20 04:00', open: 70000, high: 71000, low: 69200, close: 70800, volume: 58500000 },
    { time: 'Apr 20 08:00', open: 70800, high: 71800, low: 70300, close: 71500, volume: 64500000 },
    { time: 'Apr 20 12:00', open: 71500, high: 72200, low: 70600, close: 71800, volume: 54800000 },
    { time: 'Apr 20 16:00', open: 71800, high: 72500, low: 71500, close: 72300, volume: 61200000 },
    { time: 'Apr 20 20:00', open: 72300, high: 73000, low: 71900, close: 72800, volume: 67800000 },
    { time: 'Apr 21 00:00', open: 72800, high: 73500, low: 72500, close: 73200, volume: 63500000 },
    { time: 'Apr 21 04:00', open: 73200, high: 73200, low: 72100, close: 72400, volume: 58900000 },
    { time: 'Apr 21 08:00', open: 72400, high: 73800, low: 72300, close: 73500, volume: 72400000 },
    { time: 'Apr 21 12:00', open: 73500, high: 74200, low: 73300, close: 74000, volume: 68200000 },
    { time: 'Apr 21 16:00', open: 74000, high: 74500, low: 73700, close: 74300, volume: 65700000 },
    { time: 'Apr 21 20:00', open: 74300, high: 75000, low: 74200, close: 74800, volume: 71500000 },
  ],
  '1d': [
    { time: 'Apr 15', open: 65000, high: 66500, low: 64500, close: 66200, volume: 425000000 },
    { time: 'Apr 16', open: 66200, high: 67800, low: 65900, close: 67500, volume: 458000000 },
    { time: 'Apr 17', open: 67500, high: 68900, low: 67200, close: 68500, volume: 482000000 },
    { time: 'Apr 18', open: 68500, high: 69500, low: 67800, close: 69200, volume: 445000000 },
    { time: 'Apr 19', open: 69200, high: 70500, low: 68900, close: 70200, volume: 512000000 },
    { time: 'Apr 20', open: 70200, high: 72200, low: 69900, close: 71800, volume: 565000000 },
    { time: 'Apr 21', open: 71800, high: 75000, low: 71500, close: 74800, volume: 623000000 },
  ],
};

const Candlestick = (props: any) => {
  const { x, y, width, height, payload, index } = props;
  const { open, close, high, low } = payload;

  const isGrowing = close > open;
  const color = isGrowing ? '#0ECB81' : '#F6465D';
  const ratio = Math.abs(height / (open - close));

  const candleWidth = Math.max(width * 0.6, 8);
  const centerX = x + width / 2;

  const topWick = isGrowing ? y : y + height;
  const bottomWick = isGrowing ? y + height : y;
  const bodyTop = Math.min(y, y + height);
  const bodyHeight = Math.abs(height);

  const highY = y - (high - (isGrowing ? close : open)) * ratio;
  const lowY = y + (isGrowing ? open - low : close - low) * ratio + height;

  return (
    <g>
      <line
        x1={centerX}
        y1={highY}
        x2={centerX}
        y2={topWick}
        stroke={color}
        strokeWidth={1.5}
      />
      <line
        x1={centerX}
        y1={bottomWick}
        x2={centerX}
        y2={lowY}
        stroke={color}
        strokeWidth={1.5}
      />
      <rect
        x={centerX - candleWidth / 2}
        y={bodyTop}
        width={candleWidth}
        height={Math.max(bodyHeight, 1)}
        fill={color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

export function DataTab() {
  const [exchange, setExchange] = useState('');
  const [coin, setCoin] = useState('');
  const [timeframe, setTimeframe] = useState('1h');
  const [isLoading, setIsLoading] = useState(false);
  const [showChart, setShowChart] = useState(false);

  const candlestickData = chartDataByTimeframe[timeframe] || chartDataByTimeframe['1h'];

  const handleFetchData = () => {
    if (!exchange || !coin) return;

    setIsLoading(true);
    setShowChart(false);

    setTimeout(() => {
      setIsLoading(false);
      setShowChart(true);
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Data</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Fetch and analyze market data</p>
      </div>

      <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle>Data Source</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Coin</label>
              <Select value={coin} onValueChange={setCoin}>
                <SelectTrigger>
                  <SelectValue placeholder="Select coin" />
                </SelectTrigger>
                <SelectContent>
                  {coins.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Timeframe</label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeframes.map((tf) => (
                    <SelectItem key={tf.value} value={tf.value}>{tf.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
            onClick={handleFetchData}
            disabled={!exchange || !coin || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Fetching Data...
              </>
            ) : (
              <>
                <Database className="w-5 h-5 mr-2" />
                Fetch Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
              <CardContent className="p-12 flex flex-col items-center justify-center">
                <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
                <p className="text-lg font-medium text-gray-900 dark:text-white">Fetching market data...</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {exchange} - {coin}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showChart && !isLoading && (
          <motion.div
            key={timeframe}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Candlestick Chart - {coin}</CardTitle>
                <div className="flex items-center gap-2">
                  {timeframes.map((tf) => (
                    <button
                      key={tf.value}
                      onClick={() => setTimeframe(tf.value)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                        timeframe === tf.value
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {tf.value.toUpperCase()}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 dark:bg-[#0B0F19] rounded-xl">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Open</p>
                    <p className="text-lg font-bold mt-1 text-gray-900 dark:text-white">
                      ${candlestickData[0].open.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-[#0B0F19] rounded-xl">
                    <p className="text-xs text-gray-500 dark:text-gray-400">High</p>
                    <p className="text-lg font-bold mt-1 text-green-500">
                      ${Math.max(...candlestickData.map(d => d.high)).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-[#0B0F19] rounded-xl">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Low</p>
                    <p className="text-lg font-bold mt-1 text-red-500">
                      ${Math.min(...candlestickData.map(d => d.low)).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-[#0B0F19] rounded-xl">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Close</p>
                    <p className="text-lg font-bold mt-1 text-gray-900 dark:text-white">
                      ${candlestickData[candlestickData.length - 1].close.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-[#0B0F19] rounded-xl">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Volume</p>
                    <p className="text-lg font-bold mt-1 text-blue-500">
                      {(candlestickData.reduce((sum, d) => sum + d.volume, 0) / 1000000).toFixed(2)}M
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={candlestickData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                      <XAxis
                        dataKey="time"
                        stroke="#9CA3AF"
                        style={{ fontSize: '12px' }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        domain={['dataMin - 500', 'dataMax + 500']}
                        style={{ fontSize: '12px' }}
                        tickLine={false}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const isGrowing = data.close > data.open;
                            return (
                              <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
                                <p className="text-xs text-gray-400 mb-2">{data.time}</p>
                                <div className="space-y-1 text-xs">
                                  <div className="flex justify-between gap-4">
                                    <span className="text-gray-400">Open:</span>
                                    <span className="text-white font-medium">${data.open.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between gap-4">
                                    <span className="text-gray-400">High:</span>
                                    <span className="text-green-400 font-medium">${data.high.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between gap-4">
                                    <span className="text-gray-400">Low:</span>
                                    <span className="text-red-400 font-medium">${data.low.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between gap-4">
                                    <span className="text-gray-400">Close:</span>
                                    <span className={`font-medium ${isGrowing ? 'text-green-400' : 'text-red-400'}`}>
                                      ${data.close.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between gap-4 pt-1 border-t border-gray-700">
                                    <span className="text-gray-400">Volume:</span>
                                    <span className="text-cyan-400 font-medium">
                                      {(data.volume / 1000000).toFixed(2)}M
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="close"
                        shape={<Candlestick />}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>

                  <ResponsiveContainer width="100%" height={120}>
                    <ComposedChart data={candlestickData} margin={{ top: 0, right: 10, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                      <XAxis
                        dataKey="time"
                        stroke="#9CA3AF"
                        style={{ fontSize: '12px' }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        style={{ fontSize: '12px' }}
                        tickLine={false}
                        tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 shadow-lg">
                                <p className="text-xs text-gray-400">Volume: {(data.volume / 1000000).toFixed(2)}M</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="volume" fill="url(#colorVolume)">
                        {candlestickData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.close > entry.open ? '#0ECB81' : '#F6465D'}
                            opacity={0.5}
                          />
                        ))}
                      </Bar>
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
