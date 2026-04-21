import { TrendingUp, Brain, PlayCircle, Database, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { motion } from 'motion/react';

const kpiData = [
  { label: 'Total Strategies', value: '24', icon: TrendingUp, change: '+12%', color: 'blue' },
  { label: 'Total Models', value: '8', icon: Brain, change: '+3%', color: 'purple' },
  { label: 'Backtests Run', value: '156', icon: PlayCircle, change: '+28%', color: 'green' },
  { label: 'Active Data Sources', value: '5', icon: Database, change: '0%', color: 'cyan' },
];

const profitData = [
  { date: 'Jan', profit: 12000 },
  { date: 'Feb', profit: 19000 },
  { date: 'Mar', profit: 15000 },
  { date: 'Apr', profit: 25000 },
  { date: 'May', profit: 22000 },
  { date: 'Jun', profit: 30000 },
];

const recentActivity = [
  { action: 'Backtest completed', strategy: 'MA Crossover', time: '5 min ago', status: 'success' },
  { action: 'Model trained', model: 'LSTM Predictor', time: '1 hour ago', status: 'success' },
  { action: 'Strategy created', strategy: 'RSI Momentum', time: '2 hours ago', status: 'info' },
  { action: 'Data fetched', source: 'Binance BTC/USDT', time: '3 hours ago', status: 'info' },
];

export function DashboardTab() {
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
                      <p className={`text-sm mt-1 ${kpi.change.startsWith('+') ? 'text-green-500' : 'text-gray-500'}`}>
                        {kpi.change} from last month
                      </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Profit/Loss Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={profitData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis dataKey="date" stroke="#9CA3AF" />
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
                  dataKey="profit"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-[#0B0F19] transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.status === 'success' ? 'bg-green-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.action}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {activity.strategy || activity.model || activity.source}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

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
              <Plus className="w-5 h-5 mr-2" />
              Run Backtest
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
