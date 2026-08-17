import React, { useState, useEffect } from 'react';
import { X, Eye, Heart, MessageCircle, Share2, Bookmark, Loader2 } from 'lucide-react';

interface SinglePostStatsModalProps {
  postId: string;
  onClose: () => void;
}

export function SinglePostStatsModal({ postId, onClose }: SinglePostStatsModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [failedAvatars, setFailedAvatars] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch(`/api/posts/${postId}/analytics`)
      .then(res => (res.ok && res.headers.get('content-type')?.includes('application/json')) ? res.json() : null)
      .then(resData => {
        if (resData) setData(resData);
        setLoading(false);
      })
      .catch(err => {
        console.warn('Failed to load post stats', err);
        setLoading(false);
      });
  }, [postId]);

  const getActorAvatar = (act: any) => {
    if (failedAvatars[act.id] || !act.actorAvatar || (typeof act.actorAvatar === 'string' && act.actorAvatar.includes('ui-avatars.com'))) {
      const defaultAvatars = [
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150',
        'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150'
      ];
      const key = String(act.actorId || act.actorName || '0');
      let hash = 0;
      for (let i = 0; i < key.length; i++) hash += key.charCodeAt(i);
      return defaultAvatars[hash % defaultAvatars.length];
    }
    return act.actorAvatar;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 sm:p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
              <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-zinc-100 leading-tight">
                Post View & Engagement Insights
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 truncate max-w-[200px] xs:max-w-[260px]">
                {data?.postTitle || `Post #${postId}`}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-500" />
            <p className="text-xs font-medium">Fetching real post analytics...</p>
          </div>
        ) : (
          <div className="mt-4 sm:mt-5 space-y-5">
            {/* Metric Cards Grid - Mobile Responsive Non-overlapping Layout */}
            <div className="grid grid-cols-5 gap-1 xs:gap-1.5 sm:gap-2 text-center">
              <div className="p-1.5 xs:p-2 sm:p-2.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl sm:rounded-2xl">
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mx-auto mb-0.5 sm:mb-1 text-blue-500" />
                <div className="text-sm xs:text-base font-extrabold text-blue-600 dark:text-blue-400 leading-tight">{data?.counts?.views || 0}</div>
                <div className="text-[8px] xs:text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-tighter truncate">Views</div>
              </div>

              <div className="p-1.5 xs:p-2 sm:p-2.5 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 rounded-xl sm:rounded-2xl">
                <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 mx-auto mb-0.5 sm:mb-1 text-rose-500 fill-rose-500" />
                <div className="text-sm xs:text-base font-extrabold text-rose-600 dark:text-rose-400 leading-tight">{data?.counts?.likes || 0}</div>
                <div className="text-[8px] xs:text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-tighter truncate">Likes</div>
              </div>

              <div className="p-1.5 xs:p-2 sm:p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-xl sm:rounded-2xl">
                <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mx-auto mb-0.5 sm:mb-1 text-emerald-500" />
                <div className="text-sm xs:text-base font-extrabold text-emerald-600 dark:text-emerald-400 leading-tight">{data?.counts?.comments || 0}</div>
                <div className="text-[8px] xs:text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-tighter truncate">Comments</div>
              </div>

              <div className="p-1.5 xs:p-2 sm:p-2.5 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 rounded-xl sm:rounded-2xl">
                <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mx-auto mb-0.5 sm:mb-1 text-purple-500" />
                <div className="text-sm xs:text-base font-extrabold text-purple-600 dark:text-purple-400 leading-tight">{data?.counts?.shares || 0}</div>
                <div className="text-[8px] xs:text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-tighter truncate">Shares</div>
              </div>

              <div className="p-1.5 xs:p-2 sm:p-2.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 rounded-xl sm:rounded-2xl">
                <Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4 mx-auto mb-0.5 sm:mb-1 text-amber-500" />
                <div className="text-sm xs:text-base font-extrabold text-amber-600 dark:text-amber-400 leading-tight">{data?.counts?.saves || 0}</div>
                <div className="text-[8px] xs:text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-tighter truncate">Saves</div>
              </div>
            </div>

            {/* User Interaction Timeline */}
            <div>
              <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
                <span>Who Interacted With This Post</span>
                <span className="text-[10px] sm:text-[11px] font-medium text-slate-500">{data?.interactions?.length || 0} activity logs</span>
              </h4>

              {(!data?.interactions || data.interactions.length === 0) ? (
                <div className="text-center py-8 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 text-xs text-slate-400">
                  No likes or comments recorded on this post yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {data.interactions.map((act: any) => (
                    <div 
                      key={act.id} 
                      className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800/80 gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <img 
                          src={getActorAvatar(act)} 
                          alt={act.actorName} 
                          onError={() => setFailedAvatars(prev => ({ ...prev, [act.id]: true }))}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover shrink-0 border border-slate-200 dark:border-zinc-700 bg-teal-600"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                            {act.actorName}
                          </div>
                          {act.commentText && (
                            <div className="text-[11px] text-slate-600 dark:text-zinc-300 italic mt-0.5 truncate max-w-[150px] xs:max-w-[200px] sm:max-w-[240px]">
                              "{act.commentText}"
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {act.type === 'like' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center gap-1">
                            <Heart className="w-3 h-3 fill-rose-500 shrink-0" /> <span className="hidden xs:inline">Liked</span>
                          </span>
                        )}
                        {act.type === 'comment' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <MessageCircle className="w-3 h-3 shrink-0" /> <span className="hidden xs:inline">Commented</span>
                          </span>
                        )}
                        {act.type === 'share' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center gap-1">
                            <Share2 className="w-3 h-3 shrink-0" /> <span className="hidden xs:inline">Shared</span>
                          </span>
                        )}
                        {act.type === 'save' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Bookmark className="w-3 h-3 shrink-0" /> <span className="hidden xs:inline">Saved</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
