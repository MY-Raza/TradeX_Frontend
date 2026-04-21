import { LayoutDashboard, TrendingUp, Brain, PlayCircle, Database, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'strategies', label: 'Strategies', icon: TrendingUp },
  { id: 'models', label: 'Models', icon: Brain },
  { id: 'backtest', label: 'Backtest', icon: PlayCircle },
  { id: 'data', label: 'Data', icon: Database },
  { id: 'sentiment', label: 'Sentiment', icon: MessageSquare },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <div className="w-64 bg-white dark:bg-[#0F1420] border-r border-gray-200 dark:border-gray-800 flex flex-col">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
          TradeX
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Trading Platform</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative ${
                isActive
                  ? 'text-blue-600 dark:text-cyan-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-blue-50 dark:bg-blue-500/10 rounded-xl"
                  transition={{ type: 'spring', duration: 0.5 }}
                />
              )}
              <Icon className="w-5 h-5 relative z-10" />
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
