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
      case 'dashboard':
        return <DashboardTab />;
      case 'strategies':
        return <StrategiesTab />;
      case 'models':
        return <ModelsTab />;
      case 'backtest':
        return <BacktestTab />;
      case 'data':
        return <DataTab />;
      case 'sentiment':
        return <SentimentTab />;
      default:
        return <DashboardTab />;
    }
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-[#0B0F19]">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
