import { useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardTab } from './components/tabs/DashboardTab';
import { StrategiesTab } from './components/tabs/StrategiesTab';
import { ModelsTab } from './components/tabs/ModelsTab';
import { BacktestTab } from './components/tabs/BacktestTab';
import { DataTab } from './components/tabs/DataTab';
import { SentimentTab } from './components/tabs/SentimentTab';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':   return <DashboardTab />;
      case 'strategies':  return <StrategiesTab />;
      case 'models':      return <ModelsTab />;
      case 'backtest':    return <BacktestTab />;
      case 'data':        return <DataTab />;
      case 'sentiment':   return <SentimentTab />;
      default:            return <DashboardTab />;
    }
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-[#0B0F19]">

        {/* Desktop sidebar (hidden on mobile) */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header — hidden on mobile (top bar is inside Sidebar) */}
          <div className="hidden md:block">
            <Header />
          </div>

          {/* Main content
              mobile: pt-14 (top bar) + pb-16 (bottom tab bar)
              desktop: no extra padding needed */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 pt-[calc(3.5rem+1rem)] md:pt-6 pb-[calc(4rem+1rem)] md:pb-6">
            {renderContent()}
          </main>
        </div>

      </div>
    </ThemeProvider>
  );
}