import { db, auth } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';

export interface FirestorePost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole?: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  category: string;
  price?: number;
  city?: string;
  state?: string;
  likesCount?: number;
  viewsCount?: number;
  createdAt: any;
}

export interface FirestoreInquiry {
  id?: string;
  userId?: string;
  userName?: string;
  userPhone?: string;
  requirement: string;
  category: string;
  city?: string;
  createdAt: any;
}

// 1. Posts Management
export async function syncPostToFirestore(postData: any) {
  try {
    const postId = postData.id ? String(postData.id) : `post_${Date.now()}`;
    const postRef = doc(db, 'posts', postId);
    await setDoc(postRef, {
      ...postData,
      id: postId,
      updatedAt: serverTimestamp(),
      createdAt: postData.createdAt || new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    console.warn('Firestore syncPost note:', error);
    return false;
  }
}

export async function fetchPostsFromFirestore(): Promise<any[]> {
  try {
    const q = query(collection(db, 'posts'), limit(50));
    const snap = await getDocs(q);
    const posts: any[] = [];
    snap.forEach((docSnap) => {
      posts.push({ ...docSnap.data(), id: docSnap.id });
    });
    return posts;
  } catch (error) {
    console.warn('Firestore fetchPosts note:', error);
    return [];
  }
}

// 2. Users Management
export async function syncUserToFirestore(userData: any) {
  try {
    const userId = userData.id ? String(userData.id) : `user_${Date.now()}`;
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...userData,
      id: userId,
      lastActive: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.warn('Firestore syncUser note:', error);
    return false;
  }
}

// 3. Inquiries / Requirements
export async function submitRequirementToFirestore(reqData: FirestoreInquiry) {
  try {
    await addDoc(collection(db, 'requirements'), {
      ...reqData,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.warn('Firestore submitRequirement note:', error);
    return false;
  }
}

// 4. Platform Feedback / Rating
export async function submitFeedbackToFirestore(feedbackData: any) {
  try {
    await addDoc(collection(db, 'feedback'), {
      ...feedbackData,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.warn('Firestore submitFeedback note:', error);
    return false;
  }
}

// 5. Payment & UTR Submissions
export async function submitPaymentUTRToFirestore(paymentData: {
  userId: string;
  userName?: string;
  userPhone?: string;
  plan: string;
  membershipType: string;
  utr: string;
  amount: number;
}) {
  try {
    const paymentId = `pay_${Date.now()}`;
    const payRef = doc(db, 'payments', paymentId);
    await setDoc(payRef, {
      ...paymentData,
      id: paymentId,
      status: 'pending',
      submittedAt: serverTimestamp(),
      createdAt: new Date().toISOString()
    });

    // Also update user pendingPayment in Firestore
    if (paymentData.userId) {
      const userRef = doc(db, 'users', String(paymentData.userId));
      await setDoc(userRef, {
        pendingPayment: {
          id: paymentId,
          plan: paymentData.plan,
          membershipType: paymentData.membershipType,
          utr: paymentData.utr,
          status: 'pending',
          submittedAt: Date.now()
        }
      }, { merge: true });
    }

    return { success: true, paymentId };
  } catch (error) {
    console.warn('Firestore payment submission note:', error);
    return { success: true, paymentId: `pay_${Date.now()}` };
  }
}

// 6. Admin Settings & Master Secret Key Sync
export async function getAdminSettingsFromFirestore() {
  try {
    const settingsRef = doc(db, 'system', 'adminSettings');
    const snap = await getDoc(settingsRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (error) {
    console.warn('Firestore getAdminSettings note:', error);
  }
  return null;
}

export async function saveAdminSettingsToFirestore(settingsData: any) {
  try {
    const settingsRef = doc(db, 'system', 'adminSettings');
    await setDoc(settingsRef, {
      ...settingsData,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.warn('Firestore saveAdminSettings note:', error);
    return false;
  }
}

// 7. Post & Reel Interactions Direct Firestore Handlers (Client-Side Compatible)
export async function likePostInFirestore(postId: string | number, userId: string | number, wasLiked: boolean) {
  try {
    const postRef = doc(db, 'posts', String(postId));
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
      const data = postSnap.data();
      const currentLikes = typeof data.likesCount === 'number' ? data.likesCount : 0;
      const likedBy = Array.isArray(data.likedBy) ? data.likedBy : [];
      let newCount = currentLikes;
      let newLikedBy = [...likedBy];

      if (wasLiked) {
        newCount = Math.max(0, currentLikes - 1);
        newLikedBy = newLikedBy.filter(id => String(id) !== String(userId));
      } else {
        newCount = currentLikes + 1;
        if (!newLikedBy.includes(String(userId))) {
          newLikedBy.push(String(userId));
        }
      }

      await updateDoc(postRef, {
        likesCount: newCount,
        likedBy: newLikedBy,
        updatedAt: serverTimestamp()
      });

      return { success: true, isLiked: !wasLiked, likesCount: newCount };
    } else {
      const newCount = wasLiked ? 0 : 1;
      const newLikedBy = wasLiked ? [] : [String(userId)];
      await setDoc(postRef, {
        id: String(postId),
        likesCount: newCount,
        likedBy: newLikedBy,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return { success: true, isLiked: !wasLiked, likesCount: newCount };
    }
  } catch (err) {
    console.warn('Firestore likePost note:', err);
    return null;
  }
}

export async function savePostInFirestore(postId: string | number, userId: string | number, wasSaved: boolean) {
  try {
    const postRef = doc(db, 'posts', String(postId));
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
      const data = postSnap.data();
      const currentSaved = typeof data.savedCount === 'number' ? data.savedCount : 0;
      const savedBy = Array.isArray(data.savedBy) ? data.savedBy : [];
      let newCount = currentSaved;
      let newSavedBy = [...savedBy];

      if (wasSaved) {
        newCount = Math.max(0, currentSaved - 1);
        newSavedBy = newSavedBy.filter(id => String(id) !== String(userId));
      } else {
        newCount = currentSaved + 1;
        if (!newSavedBy.includes(String(userId))) {
          newSavedBy.push(String(userId));
        }
      }

      await updateDoc(postRef, {
        savedCount: newCount,
        savedBy: newSavedBy,
        updatedAt: serverTimestamp()
      });

      return { success: true, isSaved: !wasSaved, savedCount: newCount };
    } else {
      const newCount = wasSaved ? 0 : 1;
      const newSavedBy = wasSaved ? [] : [String(userId)];
      await setDoc(postRef, {
        id: String(postId),
        savedCount: newCount,
        savedBy: newSavedBy,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return { success: true, isSaved: !wasSaved, savedCount: newCount };
    }
  } catch (err) {
    console.warn('Firestore savePost note:', err);
    return null;
  }
}

export async function addCommentToFirestore(postId: string | number, commentData: any) {
  try {
    const commentsRef = collection(db, 'posts', String(postId), 'comments');
    const newComment = {
      ...commentData,
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    };
    const docRef = await addDoc(commentsRef, newComment);

    const postRef = doc(db, 'posts', String(postId));
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
      const currentCount = postSnap.data().commentsCount || 0;
      await updateDoc(postRef, { commentsCount: currentCount + 1 });
    } else {
      await setDoc(postRef, { id: String(postId), commentsCount: 1 }, { merge: true });
    }

    return { id: docRef.id, ...newComment };
  } catch (err) {
    console.warn('Firestore addComment note:', err);
    return null;
  }
}

export async function fetchCommentsFromFirestore(postId: string | number) {
  try {
    const commentsRef = collection(db, 'posts', String(postId), 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    const comments: any[] = [];
    snap.forEach((docSnap) => {
      comments.push({ id: docSnap.id, ...docSnap.data() });
    });
    return comments;
  } catch (err) {
    console.warn('Firestore fetchComments note:', err);
    return [];
  }
}

export async function followUserInFirestore(targetUserId: string | number, followerId: string | number) {
  try {
    const targetRef = doc(db, 'users', String(targetUserId));
    const targetSnap = await getDoc(targetRef);
    const targetData = targetSnap.exists() ? targetSnap.data() : {};
    const followers = Array.isArray(targetData.followers) ? targetData.followers : [];

    const isFollowing = followers.includes(String(followerId));
    let newFollowers = [...followers];

    if (isFollowing) {
      newFollowers = newFollowers.filter(id => String(id) !== String(followerId));
    } else {
      newFollowers.push(String(followerId));
    }

    await setDoc(targetRef, { followers: newFollowers }, { merge: true });

    return { success: true, isFollowing: !isFollowing, followersCount: newFollowers.length };
  } catch (err) {
    console.warn('Firestore followUser note:', err);
    return null;
  }
}

export async function recordViewInFirestore(postId: string | number) {
  try {
    const postRef = doc(db, 'posts', String(postId));
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
      const currentViews = postSnap.data().viewsCount || 0;
      await updateDoc(postRef, { viewsCount: currentViews + 1 });
      return currentViews + 1;
    } else {
      await setDoc(postRef, { id: String(postId), viewsCount: 1 }, { merge: true });
      return 1;
    }
  } catch (err) {
    return null;
  }
}

export async function recordShareInFirestore(postId: string | number) {
  try {
    const postRef = doc(db, 'posts', String(postId));
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
      const currentShares = postSnap.data().sharesCount || 0;
      await updateDoc(postRef, { sharesCount: currentShares + 1 });
      return currentShares + 1;
    } else {
      await setDoc(postRef, { id: String(postId), sharesCount: 1 }, { merge: true });
      return 1;
    }
  } catch (err) {
    return null;
  }
}

export async function authenticateUserInFirestore(usernameOrPhone: string, passwordInput: string, role?: string) {
  try {
    const cleanInput = usernameOrPhone.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    if (!cleanInput) {
      return { success: false, error: 'Kripya username ya mobile number enter karein.' };
    }

    // Query Firestore users collection
    const usersRef = collection(db, 'users');
    const snap = await getDocs(usersRef);
    let matchedUser: any = null;

    snap.forEach((docSnap) => {
      const u = docSnap.data();
      const uName = (u.username || '').trim().toLowerCase();
      const uPhone = (u.phone || '').trim();
      const uEmail = (u.email || '').trim().toLowerCase();
      const uId = String(u.id || '').trim().toLowerCase();

      if (uName === cleanInput || uPhone === cleanInput || uEmail === cleanInput || uId === cleanInput) {
        matchedUser = { ...u, id: docSnap.id };
      }
    });

    if (matchedUser) {
      // If password field exists on user document, verify it
      if (matchedUser.password && matchedUser.password !== cleanPassword) {
        return { success: false, error: '❌ Galat Password! Kripya Sahi Password Enter Karein.' };
      }
      return { success: true, user: matchedUser };
    }

    // Check localStorage fallback for registered accounts on this device
    const localUserStr = localStorage.getItem('user') || localStorage.getItem('Vyapar Bridge_user');
    if (localUserStr) {
      try {
        const localUser = JSON.parse(localUserStr);
        const lName = (localUser.username || '').trim().toLowerCase();
        const lPhone = (localUser.phone || '').trim();
        const lEmail = (localUser.email || '').trim().toLowerCase();

        if (lName === cleanInput || lPhone === cleanInput || lEmail === cleanInput) {
          if (localUser.password && localUser.password !== cleanPassword) {
            return { success: false, error: '❌ Galat Password! Kripya Sahi Password Enter Karein.' };
          }
          return { success: true, user: localUser };
        }
      } catch (e) {}
    }

    return { 
      success: false, 
      error: '❌ Yeh ID Registered Nahi Hai! Kripya Pehle "Register New Account" Button Par Click Karke Register Karein.' 
    };
  } catch (err) {
    console.warn('Firestore authenticateUser note:', err);
    return { 
      success: false, 
      error: '❌ Connection Issue. Yeh ID Registered Nahi Hai! Kripya Pehle Register Karein.' 
    };
  }
}

// 8. Block User & Not Interested Firestore Synchronization
export async function blockUserInFirestore(blockerId: string | number, targetUserId: string | number) {
  try {
    const userRef = doc(db, 'users', String(blockerId));
    const userSnap = await getDoc(userRef);
    const existingBlocked = userSnap.exists() && Array.isArray(userSnap.data().blockedUsers)
      ? userSnap.data().blockedUsers
      : [];
    
    if (!existingBlocked.includes(String(targetUserId))) {
      const updatedBlocked = [...existingBlocked, String(targetUserId)];
      await setDoc(userRef, { blockedUsers: updatedBlocked }, { merge: true });
    }
    return true;
  } catch (err) {
    console.warn('Firestore blockUser note:', err);
    return false;
  }
}

export async function markPostNotInterestedInFirestore(userId: string | number, postId: string | number) {
  try {
    const userRef = doc(db, 'users', String(userId));
    const userSnap = await getDoc(userRef);
    const existingNotInterested = userSnap.exists() && Array.isArray(userSnap.data().notInterestedPosts)
      ? userSnap.data().notInterestedPosts
      : [];
    
    if (!existingNotInterested.includes(String(postId))) {
      const updatedNotInterested = [...existingNotInterested, String(postId)];
      await setDoc(userRef, { notInterestedPosts: updatedNotInterested }, { merge: true });
    }
    return true;
  } catch (err) {
    console.warn('Firestore markPostNotInterested note:', err);
    return false;
  }
}

export async function getUsersBlockedAndNotInterestedFromFirestore(userId: string | number) {
  try {
    const userRef = doc(db, 'users', String(userId));
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        blockedUsers: Array.isArray(data.blockedUsers) ? data.blockedUsers.map(String) : [],
        notInterestedPosts: Array.isArray(data.notInterestedPosts) ? data.notInterestedPosts.map(String) : []
      };
    }
  } catch (err) {
    console.warn('Firestore getUsersBlockedAndNotInterested note:', err);
  }
  return { blockedUsers: [], notInterestedPosts: [] };
}

export async function clearDefaultDataFromFirestore() {
  try {
    // Delete default posts from Firestore
    const defaultPostIds = ['post_b2b_101', 'post_b2b_102', 'post_b2b_103', 'post_b2b_104'];
    for (const pId of defaultPostIds) {
      try { await deleteDoc(doc(db, 'posts', pId)); } catch (e) {}
    }
    // Delete default users from Firestore
    const defaultUserIds = ['factory_balaji_1', 'dealer_apex_2', 'factory_somany_style_3', 'factory_royal_ceramic_4'];
    for (const uId of defaultUserIds) {
      try { await deleteDoc(doc(db, 'users', uId)); } catch (e) {}
    }
    return true;
  } catch (err) {
    console.warn('Firestore clearDefaultData note:', err);
    return false;
  }
}



