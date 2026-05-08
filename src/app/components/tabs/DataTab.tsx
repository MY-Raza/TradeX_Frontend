import { useState, useEffect, useCallback, useRef } from 'react';
import { Database, Loader2, CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { dataApi, ExchangeInfo, CoinInfo, OHLCVCandle, OHLCVResponse } from '../../../services/api';

// Fixed timeframe — 1-minute candles only
const FIXED_TIMEFRAME = '1m';

// Candlestick shape for Recharts <Bar>.
const Candlestick = (props: any) => {
  const { x, y, width, height, background, payload, value, explicitDomain } = props;

  if (!payload || !background || !explicitDomain) return null;

  const { open, close, high, low } = payload;
  if (open == null || close == null || high == null || low == null) return null;

  const [domainMin, domainMax] = explicitDomain as [number, number];
  if (domainMax === domainMin) return null;

  const chartTop    = background.y as number;
  const chartHeight = background.height as number;

  const toPixelY = (price: number) =>
    chartTop + chartHeight - ((price - domainMin) / (domainMax - domainMin)) * chartHeight;

  const isGrowing  = close >= open;
  const color      = isGrowing ? '#0ECB81' : '#F6465D';
  const centerX    = x + width / 2;
  const candleW    = Math.max(width * 0.65, 1.5);

  const highPx  = toPixelY(high);
  const lowPx   = toPixelY(low);
  const openPx  = toPixelY(open);
  const closePx = toPixelY(close);

  const bodyTop    = Math.min(openPx, closePx);
  const bodyBottom = Math.max(openPx, closePx);
  const bodyHeight = Math.max(bodyBottom - bodyTop, 1);

  return (
    <g>
      <line x1={centerX} y1={highPx}    x2={centerX} y2={bodyTop}    stroke={color} strokeWidth={0.8} />
      <line x1={centerX} y1={bodyBottom} x2={centerX} y2={lowPx}     stroke={color} strokeWidth={0.8} />
      <rect
        x={centerX - candleW / 2}
        y={bodyTop}
        width={candleW}
        height={bodyHeight}
        fill={color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

// Returns today's date as YYYY-MM-DD
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DataTab() {
  // ── Dropdowns ────────────────────────────────────────────────────────────
  const [exchanges, setExchanges]   = useState<ExchangeInfo[]>([]);
  const [coins, setCoins]           = useState<CoinInfo[]>([]);
  const [exchange, setExchange]     = useState('');
  const [coin, setCoin]             = useState('');

  // ── Fetch date range (used by the "Fetch Data" button) ───────────────────
  const [startDate, setStartDate]   = useState('2024-01-01');
  const [endDate, setEndDate]       = useState(todayStr());
  const [startDateLocked, setStartDateLocked] = useState(false);
  const [lastDbDate, setLastDbDate] = useState<string | null>(null);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [isFetching, setIsFetching]         = useState(false);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [isCheckingDb, setIsCheckingDb]     = useState(false);
  const [showChart, setShowChart]           = useState(false);
  const [fetchMsg, setFetchMsg]             = useState('');
  const [error, setError]                   = useState('');

  // ── Chart data ────────────────────────────────────────────────────────────
  const [ohlcvData, setOhlcvData] = useState<OHLCVResponse | null>(null);

  // ── Zoom / pan state ──────────────────────────────────────────────────────
  const MIN_VISIBLE_CANDLES = 20;
  const [visibleStartIndex, setVisibleStartIndex] = useState(0);
  const [visibleEndIndex, setVisibleEndIndex]     = useState(0);
  const isDragging   = useRef(false);
  const dragStartX   = useRef(0);
  const dragStartIdx = useRef(0);

  // ── Chart date filter — sent to the API on change ─────────────────────────
  const [chartFromDate, setChartFromDate] = useState('');
  const [chartToDate, setChartToDate]     = useState('');

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

  // ── Core chart loader — accepts an explicit date range ───────────────────
  const loadChart = useCallback(async (
    exch: string,
    sym: string,
    fromDate?: string,
    toDate?: string,
  ) => {
    setIsLoadingChart(true);
    setError('');
    try {
      const data = await dataApi.getOHLCV(exch, sym, FIXED_TIMEFRAME, fromDate, toDate);
      setOhlcvData(data);
      setShowChart(true);
    } catch (e: any) {
      setOhlcvData(null);
      setShowChart(false);
      if (!e.message?.toLowerCase().includes('fetch data first') &&
          !e.message?.toLowerCase().includes('not found')) {
        setError(e.message ?? 'Failed to load chart data');
      }
    } finally {
      setIsLoadingChart(false);
    }
  }, []);

  // ── When coin changes: check DB for last date, then auto-load chart ───────
  useEffect(() => {
    if (!exchange || !coin) {
      setShowChart(false);
      setOhlcvData(null);
      setStartDateLocked(false);
      setLastDbDate(null);
      setChartFromDate('');
      setChartToDate('');
      return;
    }

    setError('');
    setFetchMsg('');
    setShowChart(false);
    setChartFromDate('');
    setChartToDate('');
    setIsCheckingDb(true);

    dataApi.getLastDate(exchange, coin)
      .then(res => {
        if (res.last_date) {
          const lockedDate = res.last_date.slice(0, 10);
          setStartDate(lockedDate);
          setStartDateLocked(true);
          setLastDbDate(lockedDate);
          // Auto-load chart from 1 day before the DB's last date so the
          // initial view always shows a full day of candles (e.g. if today is
          // May 8, we load from May 7 → gives yesterday + today candles).
          const prevDay = new Date(lockedDate);
          prevDay.setDate(prevDay.getDate() - 1);
          const prevDayStr = prevDay.toISOString().slice(0, 10);
          setIsCheckingDb(false);
          loadChart(exchange, coin, prevDayStr, undefined);
        } else {
          setStartDateLocked(false);
          setLastDbDate(null);
          setIsCheckingDb(false);
        }
      })
      .catch(() => {
        setStartDateLocked(false);
        setLastDbDate(null);
        setIsCheckingDb(false);
      });
  }, [exchange, coin]);

  // ── Re-fetch when chart date filter changes ───────────────────────────────
  useEffect(() => {
    if (!exchange || !coin) return;
    // Allow loading even if chart not yet shown — this is how DB data first appears
    if (!chartFromDate && !chartToDate) return;
    loadChart(exchange, coin, chartFromDate || undefined, chartToDate || undefined);
  }, [chartFromDate, chartToDate]);

  const handleFetchData = async () => {
    if (!exchange || !coin) return;
    setIsFetching(true);
    setError('');
    setFetchMsg('');

    try {
      const res = await dataApi.fetchData({
        exchange,
        symbol: coin,
        start_date: startDate,
        end_date: endDate,
      });
      setFetchMsg(res.message);
      // Reload chart after fetch, keeping any active date filter
      await loadChart(exchange, coin, chartFromDate || undefined, chartToDate || undefined);
      // Refresh last-date info
      dataApi.getLastDate(exchange, coin)
        .then(r => {
          if (r.last_date) {
            const lockedDate = r.last_date.slice(0, 10);
            setStartDate(lockedDate);
            setStartDateLocked(true);
            setLastDbDate(lockedDate);
          }
        })
        .catch(() => {});
    } catch (e: any) {
      setError(e.message ?? 'Fetch failed');
    } finally {
      setIsFetching(false);
    }
  };

  const handleChartDateReset = () => {
    setChartFromDate('');
    setChartToDate('');
    // Effect will trigger re-fetch with no date filter
  };

  // All candles come pre-filtered from the API — no client-side slicing needed
  const candlestickData = ohlcvData?.candles ?? [];

  // ── Initialise / reset visible window when data changes ──────────────────
  useEffect(() => {
    if (candlestickData.length === 0) return;
    setVisibleStartIndex(0);
    setVisibleEndIndex(candlestickData.length - 1);
  }, [candlestickData.length]);

  // ── Derive the slice currently on screen ─────────────────────────────────
  const visibleCandles = candlestickData.slice(visibleStartIndex, visibleEndIndex + 1);

  // ── Dynamic Y-domain based only on visible candles ────────────────────────
  const yDomain: [number, number] = (() => {
    const data = visibleCandles.length ? visibleCandles : candlestickData;
    if (!data.length) return [0, 1];
    const minPrice = Math.min(...data.map((c: any) => c.low));
    const maxPrice = Math.max(...data.map((c: any) => c.high));
    const range    = maxPrice - minPrice;
    const pad      = range * 0.025;          // tighter padding → larger candles
    return [minPrice - pad, maxPrice + pad];
  })();

  // ── Mouse wheel zoom ──────────────────────────────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const total   = candlestickData.length;
    if (!total) return;

    const visibleCount = visibleEndIndex - visibleStartIndex + 1;
    const zoomFactor   = e.deltaY > 0 ? 1.15 : 0.87;   // scroll-down = zoom out, scroll-up = zoom in
    const newCount     = Math.round(visibleCount * zoomFactor);
    const clampedCount = Math.min(Math.max(newCount, MIN_VISIBLE_CANDLES), total);

    // Keep zoom centred around mouse cursor position within the chart
    const rect        = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const ratio       = (e.clientX - rect.left) / rect.width;
    const centerIdx   = visibleStartIndex + Math.round(ratio * visibleCount);

    let newStart = Math.round(centerIdx - ratio * clampedCount);
    let newEnd   = newStart + clampedCount - 1;

    // Clamp to dataset bounds
    if (newStart < 0) { newStart = 0; newEnd = clampedCount - 1; }
    if (newEnd >= total) { newEnd = total - 1; newStart = Math.max(0, newEnd - clampedCount + 1); }

    setVisibleStartIndex(newStart);
    setVisibleEndIndex(newEnd);
  }, [candlestickData.length, visibleStartIndex, visibleEndIndex]);

  // ── Drag / pan ────────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    isDragging.current   = true;
    dragStartX.current   = e.clientX;
    dragStartIdx.current = visibleStartIndex;
  }, [visibleStartIndex]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const total        = candlestickData.length;
    if (!total) return;

    const visibleCount = visibleEndIndex - visibleStartIndex + 1;
    const rect         = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const pxPerCandle  = rect.width / visibleCount;
    const deltaPx      = e.clientX - dragStartX.current;
    const deltaCandles = Math.round(-deltaPx / pxPerCandle);

    let newStart = dragStartIdx.current + deltaCandles;
    let newEnd   = newStart + visibleCount - 1;

    if (newStart < 0)       { newStart = 0; newEnd = visibleCount - 1; }
    if (newEnd >= total)    { newEnd = total - 1; newStart = total - visibleCount; }

    setVisibleStartIndex(newStart);
    setVisibleEndIndex(newEnd);
  }, [candlestickData.length, visibleEndIndex, visibleStartIndex]);

  const handleMouseUp = useCallback(() => { isDragging.current = false; }, []);
  const handleMouseLeave = useCallback(() => { isDragging.current = false; }, []);

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
          {/* Row 1: Exchange + Coin */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          {/* Row 2: Start date + End date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Start Date</label>
                {startDateLocked && (
                  <span className="text-xs bg-blue-500/15 text-blue-500 border border-blue-500/30 rounded px-2 py-0.5 flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    Auto-set from DB
                  </span>
                )}
              </div>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                disabled={startDateLocked || isCheckingDb}
                className={`w-full h-10 px-3 rounded-md border text-sm bg-white dark:bg-[#0B0F19]
                  text-gray-900 dark:text-white transition-colors
                  ${startDateLocked
                    ? 'border-blue-500/40 opacity-70 cursor-not-allowed'
                    : 'border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'}`}
              />
              {startDateLocked && lastDbDate && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Continuing from last DB entry: <span className="text-blue-400 font-medium">{lastDbDate}</span>
                </p>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                min={startDate}
                className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-700
                  text-sm bg-white dark:bg-[#0B0F19] text-gray-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
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
            disabled={!exchange || !coin || isFetching || isCheckingDb}
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

      {/* Fetching loader */}
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

      {/* Chart loading skeleton */}
      <AnimatePresence>
        {isLoadingChart && !isFetching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
              <CardContent className="p-12 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading chart...</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chart */}
      <AnimatePresence>
        {showChart && !isFetching && !isLoadingChart && ohlcvData && (
          <motion.div
            key={`${exchange}-${coin}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
                <CardTitle>
                  Candlestick Chart – {coin.toUpperCase()}
                  <span className="ml-2 text-sm font-normal text-gray-400 dark:text-gray-500">1m</span>
                </CardTitle>

                {/* ── Chart date range filter — triggers API re-fetch ─── */}
                <div className="flex items-center gap-2 flex-wrap">
                  <CalendarIcon className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">From</label>
                    <input
                      type="date"
                      value={chartFromDate}
                      max={chartToDate || undefined}
                      onChange={e => setChartFromDate(e.target.value)}
                      className="h-8 px-2 rounded-md border border-gray-300 dark:border-gray-700
                        text-xs bg-white dark:bg-[#0B0F19] text-gray-900 dark:text-white
                        focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">To</label>
                    <input
                      type="date"
                      value={chartToDate}
                      min={chartFromDate || undefined}
                      onChange={e => setChartToDate(e.target.value)}
                      className="h-8 px-2 rounded-md border border-gray-300 dark:border-gray-700
                        text-xs bg-white dark:bg-[#0B0F19] text-gray-900 dark:text-white
                        focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                  {(chartFromDate || chartToDate) && (
                    <button
                      onClick={handleChartDateReset}
                      className="h-8 px-2 rounded-md border border-gray-300 dark:border-gray-700
                        text-xs text-gray-500 dark:text-gray-400 hover:text-red-400 hover:border-red-400
                        bg-white dark:bg-[#0B0F19] transition-colors"
                      title="Reset filter"
                    >
                      ✕ Reset
                    </button>
                  )}
                  <span className="text-xs text-blue-400 whitespace-nowrap">
                    {visibleCandles.length}/{candlestickData.length} candle{candlestickData.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </CardHeader>

              <CardContent>
                {/* Summary stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  {[
                    { label: 'Open',   value: `$${ohlcvData.open.toLocaleString()}`,         color: 'text-gray-900 dark:text-white' },
                    { label: 'High',   value: `$${ohlcvData.high.toLocaleString()}`,          color: 'text-green-500' },
                    { label: 'Low',    value: `$${ohlcvData.low.toLocaleString()}`,           color: 'text-red-500' },
                    { label: 'Close',  value: `$${ohlcvData.close.toLocaleString()}`,         color: 'text-gray-900 dark:text-white' },
                    { label: 'Volume', value: ohlcvData.total_volume.toLocaleString(),        color: 'text-blue-500' },
                  ].map((s) => (
                    <div key={s.label} className="p-4 bg-gray-50 dark:bg-[#0B0F19] rounded-xl">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                      <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 min-w-0 overflow-hidden">
                  {candlestickData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-gray-500">
                      <CalendarIcon className="w-10 h-10 mb-3 opacity-40" />
                      <p className="text-sm font-medium">No candles in selected range</p>
                      <button
                        onClick={handleChartDateReset}
                        className="mt-3 text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2"
                      >
                        Reset date filter
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Zoom/pan wrapper — handles wheel + drag events.
                          Candle width adapts to the visible count so candles
                          stay readable at any zoom level. */}
                      {(() => {
                        const Y_AXIS_W      = 70;
                        const CHART_HEIGHT  = 600;
                        const visibleCount  = visibleCandles.length || 1;
                        // Keep a minimum canvas width; each visible candle gets
                        // at least 8 px so wicks render properly even zoomed out.
                        const MIN_CANDLE_PX = 8;
                        const canvasW = Math.max(visibleCount * MIN_CANDLE_PX + Y_AXIS_W, 600);

                        return (
                          <div
                            style={{ overflowX: 'auto', overflowY: 'hidden', cursor: isDragging.current ? 'grabbing' : 'grab', userSelect: 'none', maxWidth: '100%' }}
                            className="w-full"
                            onWheel={handleWheel}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseLeave}
                          >
                            {/* Zoom level hint */}
                            <div className="flex justify-end items-center gap-3 mb-1 px-1">
                              <span className="text-xs text-gray-500 dark:text-gray-500 select-none">
                                🔍 {visibleCount} candles visible · scroll to zoom · drag to pan
                              </span>
                            </div>

                            {/* Candlestick chart */}
                            <div style={{ width: '100%' }}>
                              <ComposedChart
                                width={canvasW}
                                height={CHART_HEIGHT}
                                data={visibleCandles}
                                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                                style={{ transition: 'all 0.1s ease' }}
                              >
                                <CartesianGrid
                                  stroke="#1f2937"
                                  strokeDasharray="0"
                                  opacity={0.25}
                                />
                                <XAxis dataKey="time" hide />
                                <YAxis
                                  stroke="#9CA3AF"
                                  domain={yDomain}
                                  style={{ fontSize: 12 }}
                                  tickLine={false}
                                  tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                                />
                                <Tooltip
                                  content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null;
                                    const d = payload[0].payload as any;
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
                                          <span className="text-cyan-400 font-medium">{d.volume.toLocaleString()}</span>
                                        </div>
                                      </div>
                                    );
                                  }}
                                />
                                <Bar
                                  dataKey="close"
                                  shape={(barProps: any) => <Candlestick {...barProps} explicitDomain={yDomain} />}
                                  isAnimationActive={false}
                                  background={{ fill: 'transparent' }}
                                />
                              </ComposedChart>
                            </div>

                            {/* Volume chart — same data slice */}
                            <div style={{ width: '100%' }}>
                              <ComposedChart
                                width={canvasW}
                                height={120}
                                data={visibleCandles}
                                margin={{ top: 0, right: 10, left: 10, bottom: 10 }}
                                style={{ transition: 'all 0.1s ease' }}
                              >
                                <CartesianGrid
                                  stroke="#1f2937"
                                  strokeDasharray="0"
                                  opacity={0.25}
                                />
                                <XAxis
                                  dataKey="time"
                                  stroke="#9CA3AF"
                                  style={{ fontSize: 11 }}
                                  tickLine={false}
                                  interval={Math.ceil(visibleCount / 12)}
                                />
                                <YAxis
                                  stroke="#9CA3AF"
                                  style={{ fontSize: 12 }}
                                  tickLine={false}
                                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`}
                                />
                                <Tooltip
                                  content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null;
                                    const d = payload[0].payload as any;
                                    return (
                                      <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 shadow-lg text-xs">
                                        <p className="text-gray-400 mb-1">{d.time}</p>
                                        <p className="text-cyan-400">Volume: {d.volume.toLocaleString()}</p>
                                      </div>
                                    );
                                  }}
                                />
                                <Bar dataKey="volume">
                                  {visibleCandles.map((entry: any, i: number) => (
                                    <Cell key={`cell-${i}`} fill={entry.close > entry.open ? '#0ECB81' : '#F6465D'} opacity={0.5} />
                                  ))}
                                </Bar>
                              </ComposedChart>
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}