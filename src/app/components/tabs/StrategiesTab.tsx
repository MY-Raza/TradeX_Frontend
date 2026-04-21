import { useState } from 'react';
import { Search, ChevronDown, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { motion, AnimatePresence } from 'motion/react';

const strategiesData = [
  {
    id: 1,
    name: 'MA Crossover',
    symbol: 'BTC/USDT',
    timeHorizon: '4H',
    indicators: ['SMA 20', 'SMA 50'],
    patterns: ['Golden Cross', 'Death Cross'],
    description: 'Moving average crossover strategy for trend following',
    entryRules: 'Buy when SMA 20 crosses above SMA 50',
    exitRules: 'Sell when SMA 20 crosses below SMA 50',
  },
  {
    id: 2,
    name: 'RSI Momentum',
    symbol: 'ETH/USDT',
    timeHorizon: '1H',
    indicators: ['RSI 14', 'MACD'],
    patterns: ['Oversold', 'Overbought'],
    description: 'RSI-based momentum strategy',
    entryRules: 'Buy when RSI < 30 and MACD bullish',
    exitRules: 'Sell when RSI > 70',
  },
  {
    id: 3,
    name: 'Bollinger Breakout',
    symbol: 'BTC/USDT',
    timeHorizon: '15M',
    indicators: ['BB(20,2)', 'Volume'],
    patterns: ['Breakout', 'Squeeze'],
    description: 'Bollinger band breakout strategy',
    entryRules: 'Buy when price breaks upper band with high volume',
    exitRules: 'Sell when price touches middle band',
  },
  {
    id: 4,
    name: 'VWAP Reversion',
    symbol: 'SOL/USDT',
    timeHorizon: '5M',
    indicators: ['VWAP', 'ATR'],
    patterns: ['Mean Reversion'],
    description: 'Mean reversion around VWAP',
    entryRules: 'Buy when price 2 ATR below VWAP',
    exitRules: 'Sell at VWAP',
  },
];

export function StrategiesTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [symbolFilter, setSymbolFilter] = useState('all');
  const [horizonFilter, setHorizonFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filteredStrategies = strategiesData.filter((strategy) => {
    const matchesSearch = strategy.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSymbol = symbolFilter === 'all' || strategy.symbol === symbolFilter;
    const matchesHorizon = horizonFilter === 'all' || strategy.timeHorizon === horizonFilter;
    return matchesSearch && matchesSymbol && matchesHorizon;
  });

  const symbols = Array.from(new Set(strategiesData.map((s) => s.symbol)));
  const horizons = Array.from(new Set(strategiesData.map((s) => s.timeHorizon)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Strategies</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your trading strategies</p>
      </div>

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
            <Select value={symbolFilter} onValueChange={setSymbolFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Symbol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Symbols</SelectItem>
                {symbols.map((symbol) => (
                  <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={horizonFilter} onValueChange={setHorizonFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Time Horizon" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Timeframes</SelectItem>
                {horizons.map((horizon) => (
                  <SelectItem key={horizon} value={horizon}>{horizon}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredStrategies.map((strategy, index) => (
            <motion.div
              key={strategy.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Collapsible
                open={expandedId === strategy.id}
                onOpenChange={(open) => setExpandedId(open ? strategy.id : null)}
              >
                <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-[#0B0F19] transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {strategy.name}
                            </h3>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline">{strategy.symbol}</Badge>
                              <Badge variant="outline">{strategy.timeHorizon}</Badge>
                            </div>
                          </div>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            expandedId === strategy.id ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {strategy.indicators.map((indicator) => (
                          <Badge key={indicator} className="bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            {indicator}
                          </Badge>
                        ))}
                        {strategy.patterns.map((pattern) => (
                          <Badge key={pattern} className="bg-purple-500/10 text-purple-600 dark:text-purple-400">
                            {pattern}
                          </Badge>
                        ))}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CardContent className="pt-0 space-y-4">
                        <div className="p-4 bg-gray-50 dark:bg-[#0B0F19] rounded-xl">
                          <p className="text-sm text-gray-600 dark:text-gray-300">{strategy.description}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl">
                            <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">Entry Rules</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{strategy.entryRules}</p>
                          </div>
                          <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl">
                            <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">Exit Rules</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{strategy.exitRules}</p>
                          </div>
                        </div>
                      </CardContent>
                    </motion.div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredStrategies.length === 0 && (
        <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">No strategies found matching your filters.</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
