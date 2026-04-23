import { useState, useEffect } from 'react';
import { MessageSquare, Loader2, Coins, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import {
  sentimentApi,
  CoinOption,
  SentimentPost,
  SentimentComment,
  SentimentResultsResponse,
} from '../../../services/api';

type ActiveItem = SentimentPost | SentimentComment | null;

export function SentimentTab() {
  const [coins, setCoins]               = useState<CoinOption[]>([]);
  const [selectedCoin, setSelectedCoin] = useState('');

  const [isAnalyzing, setIsAnalyzing]   = useState(false);
  const [isFetchingCached, setIsFetchingCached] = useState(false);
  const [results, setResults]           = useState<SentimentResultsResponse | null>(null);
  const [error, setError]               = useState('');

  const [selectedType, setSelectedType] = useState<'post' | 'comment'>('post');
  const [selectedView, setSelectedView] = useState<'overall' | 'hourly'>('overall');
  const [activeItem, setActiveItem]     = useState<ActiveItem>(null);

  // ── Load supported coins ──────────────────────────────────────────────────
  useEffect(() => {
    sentimentApi.getCoins()
      .then((data) => {
        setCoins(data);
        if (data.length > 0) setSelectedCoin(data[0].id);
      })
      .catch(() => setError('Failed to load coins'));
  }, []);

  // ── When coin changes, try to load cached results ─────────────────────────
  useEffect(() => {
    if (!selectedCoin) return;
    setResults(null);
    setActiveItem(null);
    setError('');
    setIsFetchingCached(true);
    sentimentApi.getResults(selectedCoin)
      .then((data) => {
        setResults(data);
        pickFirstItem(data, selectedType);
      })
      .catch(() => {
        // 404 = not run yet → just clear, no error shown
        setResults(null);
      })
      .finally(() => setIsFetchingCached(false));
  }, [selectedCoin]);

  const pickFirstItem = (data: SentimentResultsResponse, type: 'post' | 'comment') => {
    if (type === 'post' && data.posts.length > 0)    setActiveItem(data.posts[0]);
    else if (type === 'comment' && data.comments.length > 0) setActiveItem(data.comments[0]);
    else setActiveItem(null);
  };

  const handleAnalyze = async () => {
    if (!selectedCoin) return;
    setIsAnalyzing(true);
    setError('');
    try {
      const res = await sentimentApi.run(selectedCoin);
      setResults(res.results);
      pickFirstItem(res.results, selectedType);
    } catch (e: any) {
      setError(e.message ?? 'Sentiment analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTypeChange = (type: 'post' | 'comment') => {
    setSelectedType(type);
    if (results) pickFirstItem(results, type);
  };

  const getSentimentColor = (sentiment: string) => {
    if (sentiment === 'Positive' || sentiment === 'positive')
      return 'bg-green-500/10 text-green-600 dark:text-green-400';
    if (sentiment === 'Negative' || sentiment === 'negative')
      return 'bg-red-500/10 text-red-600 dark:text-red-400';
    return 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
  };

  const labelOf  = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  const isPost   = (item: ActiveItem): item is SentimentPost    => item !== null && 'title'       in item;
  const isComment= (item: ActiveItem): item is SentimentComment => item !== null && 'text'        in item;

  const hourlyData = results
    ? (selectedType === 'post' ? results.hourly_posts : results.hourly_comments)
    : [];

  const displayItems: (SentimentPost | SentimentComment)[] = results
    ? (selectedType === 'post' ? results.posts : results.comments)
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Sentiment Analysis</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Reddit sentiment tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-56">
            <Select value={selectedCoin} onValueChange={setSelectedCoin}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4" />
                  <SelectValue placeholder="Select coin" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {coins.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.display}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reload cached */}
          {results && (
            <Button
              variant="outline"
              onClick={() => {
                setIsFetchingCached(true);
                sentimentApi.getResults(selectedCoin)
                  .then((data) => { setResults(data); pickFirstItem(data, selectedType); })
                  .catch(() => {})
                  .finally(() => setIsFetchingCached(false));
              }}
              disabled={isFetchingCached}
            >
              <RefreshCw className={`w-4 h-4 ${isFetchingCached ? 'animate-spin' : ''}`} />
            </Button>
          )}

          <Button
            className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600"
            onClick={handleAnalyze}
            disabled={isAnalyzing || !selectedCoin}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <MessageSquare className="w-5 h-5 mr-2" />
                Analyze Sentiment
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Loading */}
      <AnimatePresence>
        {(isAnalyzing || isFetchingCached) && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
            <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
              <CardContent className="p-12 flex flex-col items-center justify-center">
                <Loader2 className="w-16 h-16 text-purple-500 animate-spin mb-4" />
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {isAnalyzing ? 'Analyzing Reddit sentiment...' : 'Loading cached results...'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Processing posts and comments</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && !isAnalyzing && (
        <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
          <CardContent className="p-6 text-center">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* No data yet */}
      {!results && !isAnalyzing && !isFetchingCached && !error && selectedCoin && (
        <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No sentiment data yet for <strong>{selectedCoin.toUpperCase()}</strong>.
              Click <em>Analyze Sentiment</em> to run the pipeline.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <AnimatePresence>
        {results && !isAnalyzing && !isFetchingCached && (
          <motion.div
            key={selectedCoin}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Type / view selectors */}
            <div className="flex gap-4 flex-wrap">
              <Select value={selectedType} onValueChange={(v: any) => handleTypeChange(v)}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="post">Posts ({results.posts.length})</SelectItem>
                  <SelectItem value="comment">Comments ({results.comments.length})</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedView} onValueChange={(v: any) => setSelectedView(v)}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overall">Overall</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Post / comment list */}
              <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    {selectedType === 'post' ? 'Reddit Posts' : 'Reddit Comments'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-3 pr-4">
                      {displayItems.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-8">No {selectedType}s found.</p>
                      )}
                      {displayItems.map((item) => {
                        const isActive = activeItem && 'id' in item && activeItem && 'id' in activeItem
                          ? item.id === activeItem.id
                          : false;
                        const label   = isPost(item) ? item.title : (item as SentimentComment).text?.slice(0, 80) + '…';
                        const author  = item.author;
                        const sent    = item.sentiment;
                        const upvotes = isPost(item) ? item.upvotes : (item as SentimentComment).upvotes;
                        return (
                          <motion.div
                            key={item.id}
                            whileHover={{ scale: 1.02 }}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              isActive
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                                : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                            }`}
                            onClick={() => setActiveItem(item)}
                          >
                            <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1 line-clamp-2">{label}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{author}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={getSentimentColor(sent)}>{labelOf(sent)}</Badge>
                              <span className="text-xs text-gray-500">↑ {upvotes}</span>
                              {isPost(item) && (
                                <span className="text-xs text-gray-500">💬 {item.comments}</span>
                              )}
                              {item.subreddit && (
                                <span className="text-xs text-gray-400">r/{item.subreddit}</span>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Detail panel */}
              <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
                <CardHeader>
                  <CardTitle>Sentiment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!activeItem ? (
                    <p className="text-sm text-gray-500 text-center py-8">Select an item to see details.</p>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Label</span>
                        <Badge className={getSentimentColor(activeItem.sentiment)}>
                          {labelOf(activeItem.sentiment)}
                        </Badge>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Score</span>
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            {activeItem.score > 0 ? '+' : ''}{activeItem.score.toFixed(2)}
                          </span>
                        </div>
                        <Progress value={Math.abs(activeItem.score) * 100} />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Confidence</span>
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            {(activeItem.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={activeItem.confidence * 100} />
                      </div>

                      <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Upvotes</span>
                          <span className="font-medium text-gray-900 dark:text-white">{activeItem.upvotes}</span>
                        </div>
                        {isPost(activeItem) && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Comments</span>
                            <span className="font-medium text-gray-900 dark:text-white">{activeItem.comments}</span>
                          </div>
                        )}
                        {activeItem.subreddit && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Subreddit</span>
                            <span className="font-medium text-gray-900 dark:text-white">r/{activeItem.subreddit}</span>
                          </div>
                        )}
                        {isPost(activeItem) && activeItem.post_time && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Posted</span>
                            <span className="font-medium text-gray-900 dark:text-white text-xs">{activeItem.post_time}</span>
                          </div>
                        )}
                        {isComment(activeItem) && activeItem.comment_time && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Posted</span>
                            <span className="font-medium text-gray-900 dark:text-white text-xs">{activeItem.comment_time}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Analytics */}
              <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
                <CardHeader>
                  <CardTitle>{selectedView === 'overall' ? 'Overall Analytics' : 'Hourly Analytics'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {selectedView === 'overall' ? (
                    <>
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-500/10 dark:to-cyan-500/10 rounded-xl">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Mean Sentiment</p>
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                          {results.overall.mean_sentiment > 0 ? '+' : ''}{results.overall.mean_sentiment.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-50 dark:from-purple-500/10 dark:to-purple-500/10 rounded-xl">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Std Sentiment</p>
                        <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                          {results.overall.std_sentiment.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-green-50 to-green-50 dark:from-green-500/10 dark:to-green-500/10 rounded-xl">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Confidence Mean</p>
                        <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                          {(results.overall.confidence_mean * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-gray-50 dark:bg-[#0B0F19] rounded-xl text-center">
                          <p className="text-xs text-gray-500">Total Posts</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">{results.overall.total_posts}</p>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-[#0B0F19] rounded-xl text-center">
                          <p className="text-xs text-gray-500">Total Comments</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">{results.overall.total_comments}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={hourlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                        <XAxis dataKey="hour" stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                        <Line type="monotone" dataKey="sentiment"  stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', r: 4 }} name="Sentiment" />
                        <Line type="monotone" dataKey="confidence" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 3 }} name="Confidence" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}