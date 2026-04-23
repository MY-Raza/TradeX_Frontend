import { useState } from 'react';
import { Brain, TrendingUp, TrendingDown, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Bar, BarChart, Pie, PieChart, Cell } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

const modelsData = [
  {
    id: 1,
    name: 'LSTM Predictor',
    type: 'dl',
    longTrades: 145,
    shortTrades: 98,
    winTrades: 152,
    lossTrades: 91,
    winRate: 62.5,
    lossRate: 37.5,
    maxDrawdown: -12.5,
    maxConsecutiveWins: 8,
    maxConsecutiveLosses: 5,
  },
  {
    id: 2,
    name: 'Random Forest',
    type: 'ml',
    longTrades: 210,
    shortTrades: 156,
    winTrades: 228,
    lossTrades: 138,
    winRate: 62.3,
    lossRate: 37.7,
    maxDrawdown: -15.2,
    maxConsecutiveWins: 11,
    maxConsecutiveLosses: 6,
  },
  {
    id: 3,
    name: 'Gradient Boost',
    type: 'ml',
    longTrades: 178,
    shortTrades: 134,
    winTrades: 198,
    lossTrades: 114,
    winRate: 63.5,
    lossRate: 36.5,
    maxDrawdown: -10.8,
    maxConsecutiveWins: 9,
    maxConsecutiveLosses: 4,
  },
  {
    id: 4,
    name: 'Transformer Model',
    type: 'dl',
    longTrades: 192,
    shortTrades: 143,
    winTrades: 215,
    lossTrades: 120,
    winRate: 64.2,
    lossRate: 35.8,
    maxDrawdown: -11.3,
    maxConsecutiveWins: 10,
    maxConsecutiveLosses: 5,
  },
  {
    id: 5,
    name: 'CNN Price Action',
    type: 'dl',
    longTrades: 163,
    shortTrades: 121,
    winTrades: 178,
    lossTrades: 106,
    winRate: 62.7,
    lossRate: 37.3,
    maxDrawdown: -13.8,
    maxConsecutiveWins: 7,
    maxConsecutiveLosses: 6,
  },
  {
    id: 6,
    name: 'XGBoost Classifier',
    type: 'ml',
    longTrades: 234,
    shortTrades: 189,
    winTrades: 268,
    lossTrades: 155,
    winRate: 63.4,
    lossRate: 36.6,
    maxDrawdown: -14.5,
    maxConsecutiveWins: 12,
    maxConsecutiveLosses: 7,
  },
];

const performanceData = [
  { month: 'Jan', return: 5.2 },
  { month: 'Feb', return: 8.1 },
  { month: 'Mar', return: -2.3 },
  { month: 'Apr', return: 12.5 },
  { month: 'May', return: 6.8 },
  { month: 'Jun', return: 15.2 },
];

export function ModelsTab() {
  const [selectedModel, setSelectedModel] = useState(modelsData[0]);
  const [modelType, setModelType] = useState<string>('all');

  const filteredModels = modelsData.filter((model) => {
    if (modelType === 'all') return true;
    return model.type === modelType;
  });

  const tradeDistribution = [
    { name: 'Long Trades', value: selectedModel.longTrades },
    { name: 'Short Trades', value: selectedModel.shortTrades },
  ];

  const winLossData = [
    { name: 'Win Trades', value: selectedModel.winTrades },
    { name: 'Loss Trades', value: selectedModel.lossTrades },
  ];

  const COLORS = ['#3B82F6', '#06B6D4', '#10B981', '#F59E0B'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Models</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Analyze your trading models performance</p>
        </div>
        <div className="w-48">
          <Select value={modelType} onValueChange={setModelType}>
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <SelectValue placeholder="Filter by type" />
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredModels.map((model, index) => (
          <motion.div
            key={model.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card
              className={`cursor-pointer transition-all ${
                selectedModel.id === model.id
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-400 text-white'
                  : 'bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800 hover:shadow-lg'
              }`}
              onClick={() => setSelectedModel(model)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    selectedModel.id === model.id ? 'bg-white/20' : 'bg-gradient-to-br from-purple-500 to-purple-600'
                  }`}>
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className={selectedModel.id === model.id ? 'text-white' : ''}>
                      {model.name}
                    </CardTitle>
                    <div className="flex gap-2 mt-1">
                      <Badge className={`${
                        selectedModel.id === model.id
                          ? 'bg-white/20 text-white border-white/40'
                          : model.type === 'ml'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                      }`}>
                        {model.type.toUpperCase()}
                      </Badge>
                      <Badge className={`${
                        selectedModel.id === model.id
                          ? 'bg-white/20 text-white border-white/40'
                          : 'bg-green-500/10 text-green-600 dark:text-green-400'
                      }`}>
                        Active
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-sm ${selectedModel.id === model.id ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                      Long Trades
                    </p>
                    <p className="text-2xl font-bold mt-1">{model.longTrades}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${selectedModel.id === model.id ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                      Short Trades
                    </p>
                    <p className="text-2xl font-bold mt-1">{model.shortTrades}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Win Rate</span>
                      <span className="font-semibold">{model.winRate}%</span>
                    </div>
                    <Progress
                      value={model.winRate}
                      className={selectedModel.id === model.id ? 'bg-white/20' : ''}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Loss Rate</span>
                      <span className="font-semibold">{model.lossRate}%</span>
                    </div>
                    <Progress
                      value={model.lossRate}
                      className={selectedModel.id === model.id ? 'bg-white/20' : ''}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/20 dark:border-gray-800 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className={selectedModel.id === model.id ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}>
                      Max Drawdown
                    </span>
                    <span className="font-semibold text-red-500">{model.maxDrawdown}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={selectedModel.id === model.id ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}>
                      Max Consecutive Wins
                    </span>
                    <span className="font-semibold text-green-500">{model.maxConsecutiveWins}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={selectedModel.id === model.id ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}>
                      Max Consecutive Losses
                    </span>
                    <span className="font-semibold text-red-500">{model.maxConsecutiveLosses}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        </AnimatePresence>
      </div>

      {filteredModels.length === 0 && (
        <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">No models found matching your filter.</p>
          </CardContent>
        </Card>
      )}

      <motion.div
        key={selectedModel.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Performance Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis dataKey="month" stroke="#9CA3AF" />
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
                  dataKey="return"
                  stroke="#06B6D4"
                  strokeWidth={3}
                  dot={{ fill: '#06B6D4', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Trade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tradeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tradeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800 lg:col-span-2">
          <CardHeader>
            <CardTitle>Win vs Loss Trades</CardTitle>
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
      </motion.div>
    </motion.div>
  );
}
