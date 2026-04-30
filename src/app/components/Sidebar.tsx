import { useState } from 'react';
import { LayoutDashboard, TrendingUp, Brain, PlayCircle, Database, MessageSquare, X, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    setMobileOpen(false);
  };

  return (
    <>
      {/* ── Desktop Sidebar ──────────────────────────────────────────────────── */}
      <div className="hidden md:flex w-64 bg-white dark:bg-[#0F1420] border-r border-gray-200 dark:border-gray-800 flex-col shrink-0">
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
                onClick={() => handleTabChange(item.id)}
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

      {/* ── Mobile: Top bar with hamburger ───────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white dark:bg-[#0F1420] border-b border-gray-200 dark:border-gray-800 flex items-center px-4 gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
          TradeX
        </h1>
      </div>

      {/* ── Mobile: Drawer overlay ────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-white dark:bg-[#0F1420] border-r border-gray-200 dark:border-gray-800 flex flex-col"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
                    TradeX
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Trading Platform</p>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all relative ${
                        isActive
                          ? 'text-blue-600 dark:text-cyan-400'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="mobile-sidebar-active"
                          className="absolute inset-0 bg-blue-50 dark:bg-blue-500/10 rounded-xl"
                          transition={{ type: 'spring', duration: 0.4 }}
                        />
                      )}
                      <Icon className="w-5 h-5 relative z-10" />
                      <span className="relative z-10 font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Mobile: Bottom Tab Bar ────────────────────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#0F1420] border-t border-gray-200 dark:border-gray-800 flex items-center justify-around px-1 h-16">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className="flex flex-col items-center justify-center gap-1 flex-1 py-2 relative"
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-tab-active"
                  className="absolute inset-x-1 inset-y-0 bg-blue-50 dark:bg-blue-500/10 rounded-xl"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                className={`w-5 h-5 relative z-10 transition-colors ${
                  isActive ? 'text-blue-600 dark:text-cyan-400' : 'text-gray-400 dark:text-gray-500'
                }`}
              />
              <span
                className={`text-[10px] font-medium relative z-10 transition-colors leading-none ${
                  isActive ? 'text-blue-600 dark:text-cyan-400' : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}