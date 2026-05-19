import { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Send, Loader2, Trash2, Bot, User, ChevronDown,
  ChevronRight, CheckCircle2, XCircle, Wrench, RotateCcw,
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import { aiApi, AIChatMessage, ToolExecution } from '../../../services/api';

// ── Suggested prompts ──────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  'Select the best BTC strategy and run a backtest from 2024-01-01 to 2024-12-31',
  'List all ETH strategies sorted by timeframe',
  'Show me the current BTC sentiment',
  'Compare ML models and show the top performer',
  'What is the win rate of my top strategy on Binance?',
  // Strategy generation prompts (new dynamic architecture)
  'Generate a BTC strategy on Binance 1h using EMA, RSI and MACD with custom parameters',
  'Create an ETH strategy with CDLHAMMER and CDLENGULFING patterns on Binance 15m',
  'Build a BTC strategy using EMA period=50, RSI period=21 and run a backtest',
];

// ── Tool result: strategy creation detail ─────────────────────────────────
// Renders indicators_used / patterns_used / windows_used from a strategy
// creation tool call if present in the result data.

interface StrategyCreationDetail {
  indicators_used?: string[];
  patterns_used?: string[];
  windows_used?: Record<string, Record<string, number>>;
}

function StrategyCreationSummary({ data }: { data: StrategyCreationDetail }) {
  const hasIndicators = (data.indicators_used?.length ?? 0) > 0;
  const hasPatterns = (data.patterns_used?.length ?? 0) > 0;
  if (!hasIndicators && !hasPatterns) return null;

  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {data.indicators_used?.map(name => {
        const params = data.windows_used?.[name];
        const paramsStr = params
          ? Object.entries(params).map(([k, v]) => `${k}=${v}`).join(', ')
          : null;
        return (
          <span
            key={name}
            title={paramsStr ?? undefined}
            className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 border border-blue-500/20 text-blue-300"
          >
            {name}{paramsStr ? ` (${paramsStr})` : ''}
          </span>
        );
      })}
      {data.patterns_used?.map(name => (
        <span
          key={name}
          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 border border-amber-500/20 text-amber-300"
        >
          {name}
        </span>
      ))}
    </div>
  );
}

// ── Tool execution trace card ──────────────────────────────────────────────

function ToolTrace({ tools }: { tools: ToolExecution[] }) {
  const [expanded, setExpanded] = useState(false);

  if (tools.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        <Wrench className="w-3 h-3" />
        {tools.length} tool{tools.length > 1 ? 's' : ''} used
        {expanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-1.5">
              {tools.map((t, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[#0B0F19] border border-gray-800 text-xs"
                >
                  {t.status === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-blue-400">{t.tool_name}</span>
                    {t.result_summary && (
                      <p className="text-gray-400 mt-0.5 truncate">{t.result_summary}</p>
                    )}
                    {t.error && (
                      <p className="text-red-400 mt-0.5">{t.error}</p>
                    )}
                    {/* Render strategy creation signal detail when available */}
                    {t.tool_name === 'create_strategy' && t.status === 'success' &&
                      (t.parameters as StrategyCreationDetail).indicators_used && (
                      <StrategyCreationSummary data={t.parameters as StrategyCreationDetail} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Single message bubble ──────────────────────────────────────────────────

interface MessageBubbleProps {
  msg: AIChatMessage;
}

function MessageBubble({ msg }: MessageBubbleProps) {
  const isUser = msg.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-violet-600'
            : 'bg-gradient-to-br from-emerald-500 to-cyan-500'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Content */}
      <div className={`max-w-[78%] min-w-0 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere min-w-0 w-full ${
            isUser
              ? 'bg-gradient-to-br from-blue-600 to-violet-600 text-white rounded-tr-sm'
              : 'bg-white dark:bg-[#0F1420] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm'
          }`}
        >
          {msg.content}
        </div>

        {/* Tool trace (only for assistant messages with tools) */}
        {!isUser && msg.tools_executed && msg.tools_executed.length > 0 && (
          <ToolTrace tools={msg.tools_executed} />
        )}

        {/* Timestamp */}
        {msg.timestamp && (
          <span className="text-[10px] text-gray-500 mt-1 px-1">
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ── Typing indicator ───────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex gap-3"
    >
      <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-gradient-to-br from-emerald-500 to-cyan-500">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white dark:bg-[#0F1420] border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-gray-400"
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main AITab ─────────────────────────────────────────────────────────────

export function AITab() {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setInput('');
    setError('');

    // Optimistically add user message
    const userMsg: AIChatMessage = {
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await aiApi.chat({ message: trimmed, session_id: sessionId ?? undefined });

      // Store session id
      if (!sessionId) setSessionId(res.session_id);

      // Add assistant reply (attach tools for trace display)
      const assistantMsg: AIChatMessage = {
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toISOString(),
        tools_executed: res.tools_executed,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e: any) {
      setError(e.message ?? 'Failed to get a response');
      // Remove the optimistic user message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleClearSession = async () => {
    if (!sessionId) {
      setMessages([]);
      return;
    }
    setIsClearing(true);
    try {
      await aiApi.deleteHistory(sessionId);
    } catch {
      // best-effort
    } finally {
      setMessages([]);
      setSessionId(null);
      setError('');
      setIsClearing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 h-full flex flex-col"
    >
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </span>
            TradeX AI
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Natural-language interface to your trading platform
          </p>
        </div>

        {!isEmpty && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearSession}
            disabled={isClearing}
            className="gap-2 text-gray-500 hover:text-red-400 hover:border-red-400/50"
          >
            {isClearing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Clear chat
          </Button>
        )}
      </div>

      {/* Chat area */}
      <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800 flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 min-h-0"
        >
          <AnimatePresence mode="popLayout">
            {isEmpty && !isLoading ? (
              // ── Empty state ──────────────────────────────────────────────
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20 flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/10">
                  <Sparkles className="w-9 h-9 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Ask me anything about TradeX
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mb-8">
                  I can browse strategies, create custom signal strategies, run backtests,
                  analyse sentiment, compare models, and fetch OHLCV data — all from natural language.
                </p>

                {/* Suggested prompts */}
                <div className="flex flex-col gap-2 w-full max-w-lg">
                  {SUGGESTED_PROMPTS.map((prompt, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.06 }}
                      onClick={() => sendMessage(prompt)}
                      className="text-left px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0B0F19] hover:border-emerald-500/40 hover:bg-emerald-500/5 text-sm text-gray-700 dark:text-gray-300 transition-all group"
                    >
                      <span className="text-emerald-500 mr-2 group-hover:mr-3 transition-all">→</span>
                      {prompt}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              // ── Message list ────────────────────────────────────────────
              <div key="messages" className="space-y-5">
                {messages.map((msg, i) => (
                  <MessageBubble key={i} msg={msg} />
                ))}

                {/* Typing indicator */}
                <AnimatePresence>
                  {isLoading && <TypingIndicator key="typing" />}
                </AnimatePresence>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Error bar */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-6 mb-2"
            >
              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <span>{error}</span>
                <button onClick={() => setError('')} className="ml-3 hover:text-red-300">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input area */}
        <CardContent className="p-4 border-t border-gray-200 dark:border-gray-800">
          {/* Session badge */}
          {sessionId && (
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs font-mono">
                Session: {sessionId.slice(0, 8)}…
              </Badge>
              <button
                onClick={handleClearSession}
                className="text-xs text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> new session
              </button>
            </div>
          )}

          <div className="flex gap-3">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about strategies, backtests, models, sentiment…"
              disabled={isLoading}
              className="flex-1 bg-gray-50 dark:bg-[#0B0F19] border-gray-200 dark:border-gray-700 focus:border-emerald-500/50 focus:ring-emerald-500/20 text-sm"
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white shrink-0 px-4"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          <p className="text-[11px] text-gray-500 mt-2 text-center">
            Press Enter to send · conversation history is maintained per session
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}