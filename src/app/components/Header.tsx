import { Search, Bell, Moon, Sun, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0F1420] px-6 flex items-center justify-between">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search..."
            className="pl-10 bg-gray-50 dark:bg-[#0B0F19] border-gray-200 dark:border-gray-800"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
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

        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="w-5 h-5" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-blue-600">
            3
          </Badge>
        </Button>

        <Avatar className="h-9 w-9 cursor-pointer border-2 border-blue-500">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-400">
            <User className="w-4 h-4 text-white" />
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
