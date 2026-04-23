import { useState, useEffect } from 'react';
import { Database, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { dataApi, ExchangeInfo, CoinInfo, OHLCVCandle, OHLCVResponse } from '../../../services/api';

const timeframes = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '1d', label: '1 Day' },
];

const Candlestick = (props: any) => {
  const { x, y, width, height, payload } = props;
  const { open, close, high, low } = payload;

  const isGrowing = close > open;
  const color = isGrowing ? '#0ECB81' : '#F6465D';
  const ratio = Math.abs(height / (open - close || 1));

  const candleWidth = Math.max(width * 0.6, 8);
  const centerX = x + width / 2;

  const topWick    = isGrowing ? y : y + height;
  const bottomWick = isGrowing ? y + height : y;
  const bodyTop    = Math.min(y, y + height);
  const bodyHeight = Math.abs(height);

  const highY = y - (high - (isGrowing ? close : open)) * ratio;
  const lowY  = y + (isGrowing ? open - low : close - low) * ratio + height;

  return (
    <g>
      <line x1={centerX} y1={highY}    x2={centerX} y2={topWick}    stroke={color} strokeWidth={1.5} />
      <line x1={centerX} y1={bottomWick} x2={centerX} y2={lowY}    stroke={color} strokeWidth={1.5} />
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
  // ── Dropdowns ────────────────────────────────────────────────────────────
  const [exchanges, setExchanges]   = useState<ExchangeInfo[]>([]);
  const [coins, setCoins]           = useState<CoinInfo[]>([]);
  const [exchange, setExchange]     = useState('');
  const [coin, setCoin]             = useState('');
  const [timeframe, setTimeframe]   = useState('1h');

  // ── UI state ─────────────────────────────────────────────────────────────
  const [isFetching, setIsFetching]   = useState(false);   // POST /data/fetch
  const [isLoadingChart, setIsLoadingChart] = useState(false); // GET /data/ohlcv
  const [showChart, setShowChart]     = useState(false);
  const [fetchMsg, setFetchMsg]       = useState('');
  const [error, setError]             = useState('');

  // ── Chart data ────────────────────────────────────────────────────────────
  const [ohlcvData, setOhlcvData]   = useState<OHLCVResponse | null>(null);

  // ── Load exchanges on mount ───────────────────────────────────────────────
  useEffect(() => {
    dataApi.getExchanges()
      .then(setExchanges)
      .catch(() => setError('Failed to load exchanges'));
  }, []);

  // ── Load coins when exchange changes ─────────────────────────────────────
  useEffect(() => {
    if (!exchange) { setCoins([]); setCoin(''); return; }
    dataApi.getCoins(exchange)
      .then(data => { setCoins(data); setCoin(''); })
      .catch(() => setError('Failed to load coins'));
  }, [exchange]);

  // ── Reload chart when timeframe changes (if data already fetched) ─────────
  useEffect(() => {
    if (!showChart || !exchange || !coin) return;
    loadChart();
  }, [timeframe]);

  const loadChart = async () => {
    setIsLoadingChart(true);
    setError('');
    try {
      const data = await dataApi.getOHLCV(exchange, coin, timeframe);
      setOhlcvData(data);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load chart data');
    } finally {
      setIsLoadingChart(false);
    }
  };

  const handleFetchData = async () => {
    if (!exchange || !coin) return;
    setIsFetching(true);
    setShowChart(false);
    setError('');
    setFetchMsg('');

    try {
      const res = await dataApi.fetchData({ exchange, symbol: coin });
      setFetchMsg(res.message);
      // Now load the chart
      await loadChart();
      setShowChart(true);
    } catch (e: any) {
      setError(e.message ?? 'Fetch failed');
    } finally {
      setIsFetching(false);
    }
  };

  const candlestickData = ohlcvData?.candles ?? [];

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

            {/* Coin */}
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Coin</label>
              <Select value={coin} onValueChange={setCoin} disabled={!exchange}>
                <SelectTrigger>
                  <SelectValue placeholder={exchange ? 'Select coin' : 'Select exchange first'} />
                </SelectTrigger>
                <SelectContent>
                  {coins.map((c) => (
                    <SelectItem key={c.symbol} value={c.symbol}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Timeframe */}
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

          {error && (
            <p className="text-sm text-red-500 bg-red-500/10 px-4 py-2 rounded-lg">{error}</p>
          )}
          {fetchMsg && !error && (
            <p className="text-sm text-green-500 bg-green-500/10 px-4 py-2 rounded-lg">{fetchMsg}</p>
          )}

          <Button
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
            onClick={handleFetchData}
            disabled={!exchange || !coin || isFetching}
          >
            {isFetching ? (
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
        {isFetching && (
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
                  {exchanges.find(e => e.id === exchange)?.label} – {coin.toUpperCase()}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showChart && !isFetching && ohlcvData && (
          <motion.div
            key={timeframe}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
                <CardTitle>
                  Candlestick Chart – {coin.toUpperCase()}
                  {isLoadingChart && <Loader2 className="inline w-4 h-4 ml-2 animate-spin text-blue-500" />}
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
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
                {/* Summary stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  {[
                    { label: 'Open',   value: `$${ohlcvData.open.toLocaleString()}`,    color: 'text-gray-900 dark:text-white' },
                    { label: 'High',   value: `$${ohlcvData.high.toLocaleString()}`,    color: 'text-green-500' },
                    { label: 'Low',    value: `$${ohlcvData.low.toLocaleString()}`,     color: 'text-red-500' },
                    { label: 'Close',  value: `$${ohlcvData.close.toLocaleString()}`,   color: 'text-gray-900 dark:text-white' },
                    { label: 'Volume', value: `${(ohlcvData.total_volume / 1_000_000).toFixed(2)}M`, color: 'text-blue-500' },
                  ].map((s) => (
                    <div key={s.label} className="p-4 bg-gray-50 dark:bg-[#0B0F19] rounded-xl">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                      <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  {/* Candlestick chart */}
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={candlestickData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                      <XAxis dataKey="time" stroke="#9CA3AF" style={{ fontSize: 12 }} tickLine={false} />
                      <YAxis
                        stroke="#9CA3AF"
                        domain={['dataMin - 100', 'dataMax + 100']}
                        style={{ fontSize: 12 }}
                        tickLine={false}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload as OHLCVCandle;
                          const up = d.close > d.open;
                          return (
                            <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg text-xs">
                              <p className="text-gray-400 mb-2">{d.time}</p>
                              {(['open', 'high', 'low', 'close'] as const).map((k) => (
                                <div key={k} className="flex justify-between gap-4">
                                  <span className="text-gray-400 capitalize">{k}:</span>
                                  <span className={`font-medium ${k === 'high' ? 'text-green-400' : k === 'low' ? 'text-red-400' : k === 'close' ? (up ? 'text-green-400' : 'text-red-400') : 'text-white'}`}>
                                    ${d[k].toLocaleString()}
                                  </span>
                                </div>
                              ))}
                              <div className="flex justify-between gap-4 pt-1 border-t border-gray-700 mt-1">
                                <span className="text-gray-400">Volume:</span>
                                <span className="text-cyan-400 font-medium">{(d.volume / 1_000_000).toFixed(2)}M</span>
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="close" shape={<Candlestick />} />
                    </ComposedChart>
                  </ResponsiveContainer>

                  {/* Volume chart */}
                  <ResponsiveContainer width="100%" height={120}>
                    <ComposedChart data={candlestickData} margin={{ top: 0, right: 10, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                      <XAxis dataKey="time" stroke="#9CA3AF" style={{ fontSize: 12 }} tickLine={false} />
                      <YAxis
                        stroke="#9CA3AF"
                        style={{ fontSize: 12 }}
                        tickLine={false}
                        tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload as OHLCVCandle;
                          return (
                            <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 shadow-lg text-xs">
                              <p className="text-gray-400">Volume: {(d.volume / 1_000_000).toFixed(2)}M</p>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="volume">
                        {candlestickData.map((entry, i) => (
                          <Cell key={`cell-${i}`} fill={entry.close > entry.open ? '#0ECB81' : '#F6465D'} opacity={0.5} />
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