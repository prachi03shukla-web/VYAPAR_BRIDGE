// backendServices.ts

/**
 * Record a profile visit for a user
 * @param visitedUserId ID of the user whose profile was visited
 */
export const recordProfileVisit = async (visitedUserId: string, visitorId?: string) => {
  try {
    const res = await fetch(`/api/users/${visitedUserId}/profile-visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId })
    });
    if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
      return await res.json();
    }
  } catch (error) {
    console.warn("Error updating profile visits:", error);
  }
};

/**
 * Record a post view and increment dwell/watch time (in seconds)
 * @param postId ID of the post viewed
 * @param dwellTimeSeconds Dwell/watch time in seconds (default: 3s)
 * @param userId ID of the viewer
 */
export const recordPostView = async (postId: string, dwellTimeSeconds = 3, userId?: string) => {
  try {
    const res = await fetch(`/api/posts/${postId}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, dwellTime: dwellTimeSeconds })
    });
    if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
      return await res.json();
    }
  } catch (error) {
    console.warn("Error updating post view:", error);
  }
};
