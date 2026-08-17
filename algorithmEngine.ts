// Instagram Feed Recommendation Algorithm Engine
// Implements Candidate Generation, Recency Decay, Engagement Scoring, Relationship Weights, Machine Learning Probabilities, and Feed Ranking.

export interface DbSchema {
  users: any[];
  posts: any[];
  comments: any[];
  messages: any[];
  follows: any[];
  likes: any[];
  saves: any[];
  views: any[];
  shares?: any[];
  notInterested?: any[];
  blocks: any[];
  [key: string]: any;
}

export interface FeedOptions {
  queryUserId?: string;
  admin?: boolean;
  limit?: number;
  page?: number;
}

/**
 * Generate a personalized, algorithmically ranked feed for a user.
 */
export function generateInstagramFeed(
  currentUserId: string | null | undefined,
  db: DbSchema,
  options: FeedOptions = {}
) {
  const notInterested = db.notInterested || [];
  const shares = db.shares || [];
  const stringUserId = currentUserId ? String(currentUserId) : null;

  // 1. Get blocked user IDs & Not Interested post IDs for current user
  let blockedUserIds: string[] = [];
  let notInterestedPostIds: string[] = [];

  if (stringUserId) {
    blockedUserIds = db.blocks
      .filter(b => String(b.blockerId) === stringUserId || String(b.blockedId) === stringUserId)
      .map(b => String(b.blockerId) === stringUserId ? String(b.blockedId) : String(b.blockerId));

    notInterestedPostIds = notInterested
      .filter(ni => String(ni.userId) === stringUserId)
      .map(ni => String(ni.postId));
  }

  // STEP 1: Candidate Generation (Filtering eligible raw posts)
  const candidatePosts = db.posts.filter(p => {
    const postUserId = String(p.userId);
    const postId = String(p.id);

    // Filter out blocked users
    if (blockedUserIds.includes(postUserId)) return false;

    // Filter out posts marked "Not Interested" by the current user
    if (notInterestedPostIds.includes(postId)) return false;

    // Filter by specific creator if requested (e.g. profile wall feed)
    if (options.queryUserId && postUserId !== String(options.queryUserId)) return false;

    // Filter by post status (approved unless admin mode)
    if (!options.admin && p.status && p.status !== 'approved') return false;

    return true;
  });

  // Guest Feed (no logged-in user context): rank by recency, engagement, and industry domain keyword boost
  if (!stringUserId) {
    const guestRanked = candidatePosts.map(post => {
      const postId = String(post.id);
      const likesCount = db.likes.filter(l => String(l.postId) === postId).length;
      const commentsCount = db.comments.filter(c => String(c.postId) === postId).length;
      const sharesCount = shares.filter(s => String(s.postId) === postId).length;
      const timeDiff = Date.now() - (post.createdAt || Date.now());
      const recencyScore = Math.max(0, 100 - (timeDiff / (1000 * 60 * 60)));
      const postRatings = (db as any).ratings ? (db as any).ratings.filter((r: any) => String(r.postId) === postId) : [];
      const totalStars = postRatings.reduce((sum: number, r: any) => sum + (r.stars || 0), 0);
      const avgRating = postRatings.length > 0 ? totalStars / postRatings.length : (post.averageRating || 4.5);
      const ratingBoost = (avgRating * (postRatings.length > 0 ? postRatings.length * 10 : 5));

      const engagementScore = (likesCount * 1.0) + (commentsCount * 2.0) + (sharesCount * 3.0) + ratingBoost;
      const industryBoost = calculateIndustryKeywordBoost(post, db);

      return {
        post: enrichPost(post, null, db),
        score: recencyScore + engagementScore + industryBoost
      };
    });

    guestRanked.sort((a, b) => b.score - a.score);
    const result = guestRanked.map(item => item.post);
    if (options.limit && options.limit > 0) {
      const page = options.page || 1;
      const start = (page - 1) * options.limit;
      return result.slice(start, start + options.limit);
    }
    return result;
  }

  // User's followed creators
  const followedUserIds = new Set(
    db.follows
      .filter(f => String(f.followerId) === stringUserId)
      .map(f => String(f.followingId))
  );

  // User's historical interactions (Liked, Saved, Shared, Commented post IDs)
  const userLikedPostIds = new Set(db.likes.filter(l => String(l.userId) === stringUserId).map(l => String(l.postId)));
  const userSavedPostIds = new Set(db.saves.filter(s => String(s.userId) === stringUserId).map(s => String(s.postId)));
  const userSharedPostIds = new Set(shares.filter(s => String(s.userId) === stringUserId).map(s => String(s.postId)));
  const userCommentedPostIds = new Set(db.comments.filter(c => String(c.userId) === stringUserId).map(c => String(c.postId)));

  // Hashtag Interest profile
  const userInterestHashtags = new Set<string>();
  db.posts.forEach(p => {
    const pId = String(p.id);
    if (userLikedPostIds.has(pId) || userSavedPostIds.has(pId) || userSharedPostIds.has(pId)) {
      if (p.hashtags) {
        p.hashtags.split(/\s+/).forEach((tag: string) => {
          if (tag) userInterestHashtags.add(tag.toLowerCase());
        });
      }
    }
  });

  // STEP 2 & 3: Feature Extraction & Scoring for each candidate post
  const scoredPosts = candidatePosts.map(post => {
    const postId = String(post.id);
    const creatorId = String(post.userId);
    const isFollowed = followedUserIds.has(creatorId);

    // Engagement Counts
    const likesCount = db.likes.filter(l => String(l.postId) === postId).length;
    const commentsCount = db.comments.filter(c => String(c.postId) === postId).length;
    const savesCount = db.saves.filter(s => String(s.postId) === postId).length;
    const sharesCount = shares.filter(s => String(s.postId) === postId).length;
    const viewsCount = db.views.filter(v => String(v.postId) === postId).length;

    // Factor A: Recency Score (Decay over time - brand new posts get up to 100 points)
    const postTime = post.createdAt || Date.now();
    const timeDiff = Date.now() - postTime;
    const timeScore = Math.max(0, 100 - (timeDiff / (1000 * 60 * 60))); // Decay 1 pt per hour

    // Factor B: Engagement Score (Weighted by importance: Like x1, Comment x2, Share x3, Save x3)
    const engagementScore = (likesCount * 1.0) + (commentsCount * 2.0) + (sharesCount * 3.0) + (savesCount * 3.0);

    // Factor C: Relationship Score (Past interactions with creator + Following boost)
    let pastInteractionsCount = 0;
    
    // Check past likes on creator's posts
    db.likes.forEach(l => {
      const p = db.posts.find(p => String(p.id) === String(l.postId));
      if (p && String(p.userId) === creatorId && String(l.userId) === stringUserId) {
        pastInteractionsCount++;
      }
    });

    // Check past comments on creator's posts
    db.comments.forEach(c => {
      const p = db.posts.find(p => String(p.id) === String(c.postId));
      if (p && String(p.userId) === creatorId && String(c.userId) === stringUserId) {
        pastInteractionsCount++;
      }
    });

    // Check direct messages between user and creator
    const dmCount = db.messages.filter(m =>
      (String(m.senderId) === stringUserId && String(m.receiverId) === creatorId) ||
      (String(m.senderId) === creatorId && String(m.receiverId) === stringUserId)
    ).length;

    pastInteractionsCount += dmCount;

    const relationshipScore = (isFollowed ? 15.0 : 0.0) + (pastInteractionsCount * 5.0);

    // Factor D: Predictive Machine Learning / Intent Factors
    let hashtagMatchCount = 0;
    if (post.hashtags) {
      post.hashtags.split(/\s+/).forEach((tag: string) => {
        if (tag && userInterestHashtags.has(tag.toLowerCase())) hashtagMatchCount++;
      });
    }

    const probLike = Math.min(1.0, (userLikedPostIds.has(postId) ? 1.0 : 0.2) + (hashtagMatchCount * 0.25));
    const probComment = Math.min(1.0, (userCommentedPostIds.has(postId) ? 1.0 : 0.1) + (commentsCount > 3 ? 0.2 : 0));
    const probShare = Math.min(1.0, (userSharedPostIds.has(postId) ? 1.0 : 0.05) + (sharesCount > 2 ? 0.25 : 0));
    const probSave = Math.min(1.0, (userSavedPostIds.has(postId) ? 1.0 : 0.08) + (hashtagMatchCount * 0.2));
    const probWatchTime = Math.min(1.0, Math.log10(viewsCount + 1) / 3.0);

    const mlPredictiveScore = (probLike * 1.0) + (probComment * 1.5) + (probShare * 3.0) + (probSave * 3.0) + (probWatchTime * 2.0);

    // Factor E: Industry & Business Keyword Relevance Boost (Tiles, Bathroom, Sanitaryware, Factory, Dealers, etc.)
    const industryBoost = calculateIndustryKeywordBoost(post, db);

    // Total Composite Feed Score
    const totalFeedScore = timeScore + engagementScore + relationshipScore + mlPredictiveScore + industryBoost;

    const enrichedPost = enrichPost(post, stringUserId, db);

    return {
      post: enrichedPost,
      feedScore: totalFeedScore
    };
  });

  // STEP 4: Ranking (Sort by feedScore descending)
  scoredPosts.sort((a, b) => b.feedScore - a.feedScore);

  const rankedResult = scoredPosts.map(item => item.post);

  // Pagination / Chunking support
  if (options.limit && options.limit > 0) {
    const page = options.page || 1;
    const start = (page - 1) * options.limit;
    return rankedResult.slice(start, start + options.limit);
  }

  return rankedResult;
}

// Target Industry & Firm Keywords for Algorithmic Prioritization across all Feeds
const INDUSTRY_KEYWORDS = [
  'shower', 'showerpanel', 'showerpanels', 'showerpannels', 'mixer', 'diverter', 'diverters',
  'bathroom', 'bathrooms', 'washbasin', 'basin', 'tap', 'faucet', 'commode', 'toilet', 'jacuzzi', 'bathtub', 'sanitary', 'sanitaryware', 'bathware',
  'hall', 'halls', 'room', 'rooms', 'lobby', 'elevation', 'elevations', 'elivations', 'gallery', 'gallry', 'lawn', 'terrace', 'terrist', 'chat', 'chhat', 'garden', 'roomwall', 'roomwalls', 'wall', 'walls', 'floor', 'floors', 'interior', 'exterior', 'facade', 'architecture',
  'dealer', 'dealers', 'distributor', 'distributors', 'factory', 'factories', 'tilescompany', 'tilescompny', 'llp', 'pvt.ltd', 'pvt ltd', 'ltd', 'trader', 'traders', 'wholesaler', 'manufacturer', 'showroom', 'agency', 'agencies',
  'ceramic', 'ceramics', 'gvt', 'pgvt', 'porcelain', 'vitrified', 'marbonite', 'slab', 'slabs', 'marble', 'granite', 'mosaic', 'tiles', 'tile', 'tileance'
];

/**
 * Calculate Industry Keyword & Firm Boosting Score to prioritize business-relevant posts
 */
export function calculateIndustryKeywordBoost(post: any, db: DbSchema): number {
  let boost = 0;
  const creator = db.users.find(u => String(u.id) === String(post.userId));

  const textToScan = [
    post.title || '',
    post.content || '',
    post.hashtags || '',
    creator?.name || '',
    creator?.companyName || '',
    creator?.businessType || '',
    creator?.bio || ''
  ].join(' ').toLowerCase();

  let matches = 0;
  for (const kw of INDUSTRY_KEYWORDS) {
    if (textToScan.includes(kw)) {
      matches++;
    }
  }

  if (matches > 0) {
    // Priority boost: +80 points for 1st keyword match, +25 points for each additional match (up to +250 max)
    boost = 80 + Math.min(170, (matches - 1) * 25);
  }

  return boost;
}

function enrichPost(post: any, stringUserId: string | null, db: DbSchema) {
  const postId = String(post.id);
  const shares = db.shares || [];
  const postRatings = (db as any).ratings ? (db as any).ratings.filter((r: any) => String(r.postId) === postId) : [];
  const totalStars = postRatings.reduce((sum: number, r: any) => sum + (r.stars || 0), 0);
  const averageRating = postRatings.length > 0 ? Number((totalStars / postRatings.length).toFixed(1)) : (post.averageRating || 4.8);
  const ratingsCount = postRatings.length > 0 ? postRatings.length : (post.ratingsCount || 0);

  return {
    ...post,
    user: db.users.find(u => String(u.id) === String(post.userId)),
    likesCount: db.likes.filter(l => String(l.postId) === postId).length,
    isLiked: stringUserId ? db.likes.some(l => String(l.postId) === postId && String(l.userId) === stringUserId) : false,
    savesCount: db.saves.filter(s => String(s.postId) === postId).length,
    savedCount: db.saves.filter(s => String(s.postId) === postId).length,
    isSaved: stringUserId ? db.saves.some(s => String(s.postId) === postId && String(s.userId) === stringUserId) : false,
    sharesCount: shares.filter(s => String(s.postId) === postId).length,
    isShared: stringUserId ? shares.some(s => String(s.postId) === postId && String(s.userId) === stringUserId) : false,
    isFollowing: stringUserId ? db.follows.some(f => String(f.followerId) === stringUserId && String(f.followingId) === String(post.userId)) : false,
    commentsCount: db.comments.filter(c => String(c.postId) === postId).length,
    viewsCount: db.views.filter(v => String(v.postId) === postId).length,
    averageRating,
    ratingsCount,
    music: post.musicId ? (db.music.find(m => String(m.id) === String(post.musicId)) || { title: post.musicTitle, artist: post.musicArtist, audioUrl: post.musicUrl }) : 
           (post.musicUrl ? { title: post.musicTitle, artist: post.musicArtist, audioUrl: post.musicUrl } : null)
  };
}
