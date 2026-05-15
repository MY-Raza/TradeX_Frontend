import { Moon, Sun, Sparkles } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';

interface HeaderProps {
  onOpenAI?: () => void;
  isAIActive?: boolean;
}

export function Header({ onOpenAI, isAIActive }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0F1420] px-6 flex items-center justify-end gap-3">
      {/* AI button */}
      <Button
        variant={isAIActive ? 'default' : 'outline'}
        size="sm"
        onClick={onOpenAI}
        className={
          isAIActive
            ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white border-0 gap-2'
            : 'gap-2 border-gray-200 dark:border-gray-700 hover:border-emerald-500/50 hover:text-emerald-500 dark:hover:text-emerald-400'
        }
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-medium">TradeX AI</span>
      </Button>

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="rounded-full"
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </Button>
    </header>
  );
}