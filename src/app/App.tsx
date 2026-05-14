import { useState, useEffect, useRef, useCallback } from 'react';
import { ThemeProvider } from 'next-themes';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardTab } from './components/tabs/DashboardTab';
import { StrategiesTab } from './components/tabs/StrategiesTab';
import { ModelsTab } from './components/tabs/ModelsTab';
import { BacktestTab } from './components/tabs/BacktestTab';
import { RunHistoryTab } from './components/tabs/RunHistoryTab';
import { DataTab } from './components/tabs/DataTab';
import { SentimentTab } from './components/tabs/SentimentTab';
import { CreateStrategyTab } from './components/tabs/CreateStrategyTab';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // ── Chart-area zoom isolation ─────────────────────────────────────────────
  const mainRef = useRef<HTMLElement>(null);

  const handleChartAreaWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
    }
  }, []);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleChartAreaWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleChartAreaWheel);
    };
  }, [handleChartAreaWheel]);
  // ─────────────────────────────────────────────────────────────────────────

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':        return <DashboardTab onTabChange={setActiveTab} />;
      case 'strategies':       return <StrategiesTab />;
      case 'models':           return <ModelsTab />;
      case 'backtest':         return <BacktestTab />;
      case 'run-history':      return <RunHistoryTab />;
      case 'data':             return <DataTab />;
      case 'sentiment':        return <SentimentTab />;
      case 'create-strategy':  return <CreateStrategyTab />;
      default:                 return <DashboardTab onTabChange={setActiveTab} />;
    }
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-[#0B0F19]">

        {/* Desktop sidebar (hidden on mobile) */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header — hidden on mobile */}
          <div className="hidden md:block">
            <Header />
          </div>

          <main
            ref={mainRef}
            className="flex-1 overflow-y-auto p-4 md:p-6 pt-[calc(3.5rem+1rem)] md:pt-6 pb-[calc(4rem+1rem)] md:pb-6"
          >
            {renderContent()}
          </main>
        </div>

      </div>
    </ThemeProvider>
  );
}