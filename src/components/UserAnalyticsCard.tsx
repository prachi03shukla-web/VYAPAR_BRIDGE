import React, { useState, useEffect } from 'react';
import { Eye, Heart, MessageCircle, Share2, Bookmark, BarChart2, TrendingUp, Sparkles, X, Users, Clock, Filter } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { formatDistanceToNow } from 'date-fns';

interface AnalyticsSummary {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalSaves: number;
  totalShares: number;
  totalViews: number;
}

interface PostData {
  id: string;
  title: string;
  type: string;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  views: number;
  createdAt: number;
}

interface TimelineLog {
  id: string;
  type: 'like' | 'comment' | 'share' | 'save';
  actorId: string;
  actorName: string;
  actorAvatar: string;
  postId: string;
  postTitle: string;
  commentText?: string;
  time: number;
}

interface AnalyticsResponse {
  summary: AnalyticsSummary;
  postsData: PostData[];
  timelineLogs: TimelineLog[];
}

export function UserAnalyticsCard({ userId }: { userId: string }) {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chart' | 'logs'>('chart');
  const [logFilter, setLogFilter] = useState<'all' | 'like' | 'comment' | 'share' | 'save'>('all');

  const fetchAnalytics = () => {
    if (!userId) return;
    fetch(`/api/users/${userId}/analytics`)
      .then(res => (res.ok && res.headers.get('content-type')?.includes('application/json')) ? res.json() : null)
      .then(resData => {
        if (resData) setData(resData);
        setLoading(false);
      })
      .catch(err => {
        console.warn('Error fetching user analytics:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAnalytics();
    // Refresh on custom events like like/comment/share
    const handleRefresh = () => fetchAnalytics();
    window.addEventListener('postDeleted', handleRefresh);
    window.addEventListener('reelDeleted', handleRefresh);
    return () => {
      window.removeEventListener('postDeleted', handleRefresh);
      window.removeEventListener('reelDeleted', handleRefresh);
    };
  }, [userId]);

  if (loading || !data) {
    return (
      <div className="mb-4 bg-gradient-to-r from-slate-900 via-zinc-900 to-slate-950 p-4 rounded-2xl border border-zinc-800 text-white shadow-xl animate-pulse">
        <div className="h-6 bg-zinc-800 rounded w-1/3 mb-3"></div>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-10 bg-zinc-800/60 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const { summary, postsData, timelineLogs } = data;

  const filteredLogs = timelineLogs.filter(log => {
    if (logFilter === 'all') return true;
    return log.type === logFilter;
  });

  return (
    <div className="mb-5 bg-gradient-to-r from-slate-900 via-zinc-900 to-slate-950 p-4 rounded-2xl border border-blue-900/50 text-white shadow-xl">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
              Post & Reel Engagement Chart <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </h3>
            <p className="text-[10px] text-zinc-400">Live stats across all your timeline posts</p>
          </div>
        </div>

        {/* Eye Button for Detailed Analytics */}
        <button
          onClick={() => {
            fetchAnalytics();
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl border border-blue-400/50 shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
          title="Click to see who liked, commented & shared"
        >
          <Eye className="w-4 h-4 text-cyan-300 animate-pulse" />
          <span>Eye Insights</span>
        </button>
      </div>

      {/* Summary Stat Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <div className="bg-zinc-800/80 border border-zinc-700/60 p-2 rounded-xl flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
            <Heart className="w-3.5 h-3.5 fill-red-500/20" />
          </div>
          <div>
            <div className="text-[10px] text-zinc-400 font-medium">Likes</div>
            <div className="text-xs font-black text-white">{summary.totalLikes}</div>
          </div>
        </div>

        <div className="bg-zinc-800/80 border border-zinc-700/60 p-2 rounded-xl flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <MessageCircle className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[10px] text-zinc-400 font-medium">Comments</div>
            <div className="text-xs font-black text-white">{summary.totalComments}</div>
          </div>
        </div>

        <div className="bg-zinc-800/80 border border-zinc-700/60 p-2 rounded-xl flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Share2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[10px] text-zinc-400 font-medium">Shares</div>
            <div className="text-xs font-black text-white">{summary.totalShares}</div>
          </div>
        </div>

        <div className="bg-zinc-800/80 border border-zinc-700/60 p-2 rounded-xl flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Bookmark className="w-3.5 h-3.5 fill-amber-500/20" />
          </div>
          <div>
            <div className="text-[10px] text-zinc-400 font-medium">Saves</div>
            <div className="text-xs font-black text-white">{summary.totalSaves}</div>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-zinc-800/80 border border-zinc-700/60 p-2 rounded-xl flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
            <Eye className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[10px] text-zinc-400 font-medium">Views</div>
            <div className="text-xs font-black text-white">{summary.totalViews}</div>
          </div>
        </div>
      </div>

      {/* Analytics Eye Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto" onClick={() => setIsModalOpen(false)}>
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl text-white flex flex-col my-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Eye className="w-5 h-5 text-cyan-300" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    Timeline Analytics & User Activity
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </h2>
                  <p className="text-xs text-zinc-400">See who liked, commented, shared, or saved your posts</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-zinc-800 bg-zinc-900/50 px-4 pt-2 gap-4">
              <button
                onClick={() => setActiveTab('chart')}
                className={`pb-3 px-2 font-bold text-xs sm:text-sm border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                  activeTab === 'chart'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <BarChart2 className="w-4 h-4" />
                <span>Post Metrics Chart</span>
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`pb-3 px-2 font-bold text-xs sm:text-sm border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                  activeTab === 'logs'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Who Interacted ({timelineLogs.length})</span>
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
              
              {/* TAB 1: CHARTS */}
              {activeTab === 'chart' && (
                <div className="space-y-6">
                  {/* Summary Metric Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl">
                      <div className="text-xs text-zinc-400 flex items-center gap-1.5 mb-1">
                        <Heart className="w-3.5 h-3.5 text-red-500" /> Total Likes
                      </div>
                      <div className="text-xl font-black text-white">{summary.totalLikes}</div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl">
                      <div className="text-xs text-zinc-400 flex items-center gap-1.5 mb-1">
                        <MessageCircle className="w-3.5 h-3.5 text-blue-400" /> Total Comments
                      </div>
                      <div className="text-xl font-black text-white">{summary.totalComments}</div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl">
                      <div className="text-xs text-zinc-400 flex items-center gap-1.5 mb-1">
                        <Share2 className="w-3.5 h-3.5 text-emerald-400" /> Total Shares
                      </div>
                      <div className="text-xl font-black text-white">{summary.totalShares}</div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl">
                      <div className="text-xs text-zinc-400 flex items-center gap-1.5 mb-1">
                        <Bookmark className="w-3.5 h-3.5 text-amber-400" /> Total Saves
                      </div>
                      <div className="text-xl font-black text-white">{summary.totalSaves}</div>
                    </div>
                  </div>

                  {/* Recharts Bar Chart */}
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-blue-400" /> Post-by-Post Engagement Breakdown
                    </h3>
                    {postsData.length > 0 ? (
                      <div className="h-64 sm:h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={postsData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                            <XAxis dataKey="title" stroke="#a1a1aa" fontSize={10} tickLine={false} />
                            <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                            <Bar dataKey="likes" name="Likes" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="comments" name="Comments" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="shares" name="Shares" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="saves" name="Saves" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="text-center py-10 text-zinc-500 text-xs">
                        No posts published yet. Create a post to see graph metrics!
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: INTERACTIVE LOGS */}
              {activeTab === 'logs' && (
                <div className="space-y-4">
                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                    <span className="text-xs text-zinc-400 font-bold flex items-center gap-1 shrink-0 mr-1">
                      <Filter className="w-3.5 h-3.5" /> Filter:
                    </span>
                    {(['all', 'like', 'comment', 'share', 'save'] as const).map(filter => (
                      <button
                        key={filter}
                        onClick={() => setLogFilter(filter)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer shrink-0 border ${
                          logFilter === filter
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {filter === 'all' ? 'All Activity' : filter + 's'}
                      </button>
                    ))}
                  </div>

                  {/* Activity Timeline List */}
                  <div className="space-y-2.5">
                    {filteredLogs.map(log => {
                      let badgeBg = 'bg-red-500/20 text-red-400 border-red-500/30';
                      let icon = <Heart className="w-3.5 h-3.5 fill-red-500/30" />;
                      let actionName = 'liked your post';

                      if (log.type === 'comment') {
                        badgeBg = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
                        icon = <MessageCircle className="w-3.5 h-3.5" />;
                        actionName = 'commented: ' + (log.commentText || '');
                      } else if (log.type === 'share') {
                        badgeBg = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
                        icon = <Share2 className="w-3.5 h-3.5" />;
                        actionName = 'shared your post';
                      } else if (log.type === 'save') {
                        badgeBg = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
                        icon = <Bookmark className="w-3.5 h-3.5 fill-amber-500/30" />;
                        actionName = 'saved your post';
                      }

                      return (
                        <div key={log.id} className="bg-zinc-900 border border-zinc-800/80 p-3.5 rounded-2xl flex items-center justify-between gap-3 hover:border-zinc-700 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden shrink-0">
                              <img src={log.actorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} alt={log.actorName} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate flex items-center gap-2">
                                <span className="text-blue-400">{log.actorName}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${badgeBg}`}>
                                  {icon} {log.type}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-300 truncate mt-0.5">{actionName}</p>
                              <div className="text-[10px] text-zinc-500 truncate mt-0.5 flex items-center gap-1">
                                <span>Target: "{log.postTitle}"</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-[10px] text-zinc-500 shrink-0 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(log.time, { addSuffix: true })}
                          </div>
                        </div>
                      );
                    })}

                    {filteredLogs.length === 0 && (
                      <div className="text-center py-10 text-zinc-500 text-xs">
                        No activity found for this filter.
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
