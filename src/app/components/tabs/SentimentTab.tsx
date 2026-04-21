import { useState } from 'react';
import { MessageSquare, TrendingUp, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

const redditPosts = [
  {
    id: 1,
    title: 'BTC breaking through resistance!',
    author: 'u/cryptotrader',
    upvotes: 245,
    comments: 58,
    sentiment: 'Positive',
    score: 0.82,
    confidence: 0.91,
  },
  {
    id: 2,
    title: 'Market correction incoming?',
    author: 'u/analyst_pro',
    upvotes: 189,
    comments: 42,
    sentiment: 'Negative',
    score: -0.65,
    confidence: 0.78,
  },
  {
    id: 3,
    title: 'ETH 2.0 update discussion',
    author: 'u/eth_holder',
    upvotes: 312,
    comments: 76,
    sentiment: 'Neutral',
    score: 0.12,
    confidence: 0.64,
  },
];

const hourlySentiment = [
  { hour: '00:00', sentiment: 0.45, confidence: 0.72 },
  { hour: '04:00', sentiment: 0.62, confidence: 0.81 },
  { hour: '08:00', sentiment: 0.38, confidence: 0.68 },
  { hour: '12:00', sentiment: 0.71, confidence: 0.85 },
  { hour: '16:00', sentiment: 0.55, confidence: 0.76 },
  { hour: '20:00', sentiment: 0.68, confidence: 0.82 },
];

export function SentimentTab() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedType, setSelectedType] = useState('post');
  const [selectedView, setSelectedView] = useState('overall');
  const [selectedPost, setSelectedPost] = useState(redditPosts[0]);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setShowResults(false);

    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResults(true);
    }, 2000);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Positive':
        return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case 'Negative':
        return 'bg-red-500/10 text-red-600 dark:text-red-400';
      default:
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
    }
  };

  const overallStats = {
    meanSentiment: 0.58,
    stdSentiment: 0.15,
    confidenceMean: 0.78,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Sentiment Analysis</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Reddit sentiment tracking</p>
        </div>
        <Button
          className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
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

      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
              <CardContent className="p-12 flex flex-col items-center justify-center">
                <Loader2 className="w-16 h-16 text-purple-500 animate-spin mb-4" />
                <p className="text-lg font-medium text-gray-900 dark:text-white">Analyzing Reddit sentiment...</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Processing posts and comments</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showResults && !isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="flex gap-4">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="post">Post</SelectItem>
                  <SelectItem value="comment">Comment</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedView} onValueChange={setSelectedView}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overall">Overall</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Reddit Posts & Comments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-3 pr-4">
                      {redditPosts.map((post) => (
                        <motion.div
                          key={post.id}
                          whileHover={{ scale: 1.02 }}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedPost.id === post.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                              : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                          }`}
                          onClick={() => setSelectedPost(post)}
                        >
                          <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-2">
                            {post.title}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{post.author}</p>
                          <div className="flex items-center gap-2">
                            <Badge className={getSentimentColor(post.sentiment)}>
                              {post.sentiment}
                            </Badge>
                            <span className="text-xs text-gray-500">↑ {post.upvotes}</span>
                            <span className="text-xs text-gray-500">💬 {post.comments}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
                <CardHeader>
                  <CardTitle>Sentiment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Sentiment Label</span>
                      <Badge className={getSentimentColor(selectedPost.sentiment)} size="lg">
                        {selectedPost.sentiment}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Sentiment Score</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {selectedPost.score > 0 ? '+' : ''}{selectedPost.score.toFixed(2)}
                      </span>
                    </div>
                    <Progress
                      value={Math.abs(selectedPost.score) * 100}
                      className={selectedPost.score > 0 ? 'bg-green-500/20' : 'bg-red-500/20'}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Confidence</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {(selectedPost.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={selectedPost.confidence * 100} />
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Post Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Upvotes</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedPost.upvotes}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Comments</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedPost.comments}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-[#0F1420] border-gray-200 dark:border-gray-800">
                <CardHeader>
                  <CardTitle>
                    {selectedView === 'overall' ? 'Overall Analytics' : 'Hourly Analytics'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {selectedView === 'overall' ? (
                    <>
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-500/10 dark:to-cyan-500/10 rounded-xl">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Mean Sentiment</p>
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                          +{overallStats.meanSentiment.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-50 dark:from-purple-500/10 dark:to-purple-500/10 rounded-xl">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Std Sentiment</p>
                        <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                          {overallStats.stdSentiment.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-green-50 to-green-50 dark:from-green-500/10 dark:to-green-500/10 rounded-xl">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Confidence Mean</p>
                        <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                          {(overallStats.confidenceMean * 100).toFixed(0)}%
                        </p>
                      </div>
                    </>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={hourlySentiment}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                        <XAxis dataKey="hour" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="sentiment"
                          stroke="#3B82F6"
                          strokeWidth={3}
                          dot={{ fill: '#3B82F6', r: 4 }}
                          name="Sentiment"
                        />
                        <Line
                          type="monotone"
                          dataKey="confidence"
                          stroke="#10B981"
                          strokeWidth={2}
                          dot={{ fill: '#10B981', r: 3 }}
                          name="Confidence"
                        />
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
