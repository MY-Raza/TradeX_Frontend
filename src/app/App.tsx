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

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // ── Chart-area zoom isolation ─────────────────────────────────────────────
  // Ref attached to the <main> element that wraps tab content.
  // A non-passive wheel listener intercepts ctrl+wheel and trackpad pinch
  // gestures only while the cursor is inside this element, preventing the
  // browser from zooming the page. The chart's own onWheel handler still
  // receives the event and performs chart-level zoom as normal.
  const mainRef = useRef<HTMLElement>(null);

  const handleChartAreaWheel = useCallback((e: WheelEvent) => {
    // ctrlKey is set by browsers for both ctrl+wheel AND trackpad pinch.
    // Intercepting it here stops page zoom while the chart's React onWheel
    // handler (which fires on the same event) continues to work normally.
    if (e.ctrlKey) {
      e.preventDefault();
    }
  }, []);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    // { passive: false } is required — without it the browser ignores
    // preventDefault() for wheel events entirely.
    el.addEventListener('wheel', handleChartAreaWheel, { passive: false });

    return () => {
      el.removeEventListener('wheel', handleChartAreaWheel);
    };
  }, [handleChartAreaWheel]);
  // ─────────────────────────────────────────────────────────────────────────

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':   return <DashboardTab onTabChange={setActiveTab} />;
      case 'strategies':  return <StrategiesTab />;
      case 'models':      return <ModelsTab />;
      case 'backtest':    return <BacktestTab />;
      case 'run-history': return <RunHistoryTab />;
      case 'data':        return <DataTab />;
      case 'sentiment':   return <SentimentTab />;
      default:            return <DashboardTab onTabChange={setActiveTab} />;
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
              desktop: no extra padding needed
              mainRef scopes the non-passive wheel listener to this area only */}
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