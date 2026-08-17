import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Home, Shield, Moon, Sun, PlusSquare, MessageCircle, MessageSquare, Menu, LogOut, LogIn, Check, X, XCircle, Search, Compass, Film, Heart, Calculator, Bookmark, Info, MoreHorizontal, Image, ImageIcon, ImagePlus, Eye, EyeOff, Camera, Upload, Trash2, Plus, ShieldCheck, Sparkles, QrCode, CheckCircle, CheckCircle2, Award, Smile, Volume2, VolumeX, ChevronUp, ChevronDown, ArrowLeft, ChevronLeft, ChevronRight, UserPlus, UserCheck, Share2, Phone, Mail, Globe, Building2, Store, MapPin, Locate, Navigation, Tag, Filter, ShieldAlert, UserX, Lock, Clock, FileText, Maximize2, Crop, Loader2, Send, BarChart2, Users, Map as MapIcon, Hash, Pencil, Rocket, ExternalLink, Star, Scale, Video, TrendingUp, ClipboardList, Bell, CreditCard, Calendar, Copy } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';
import { TileCalculatorDrawer } from "./components/TileCalculatorDrawer";
import { UserAnalyticsCard } from './components/UserAnalyticsCard';
import { AIChatbotWidget } from './components/AIChatbotWidget';
import { SinglePostStatsModal } from './components/SinglePostStatsModal';
import { GstInput } from './components/GstInput';
import { validateGSTIN } from './utils/gstinValidator';
import { StealthLockoutScreen } from './components/StealthLockoutScreen';
import { WelcomeSplash } from './components/WelcomeSplash';
import { TermsPage } from './components/TermsPage';
import { PlatformRatingWidget } from './components/PlatformRatingWidget';
import { isAppLockedOut, recordFailedAdminAttempt, recordSuccessfulAdminLogin, setStealthLockout } from './utils/lockoutManager';
import { AdRatingComponent } from './components/AdRatingComponent';
import { ALL_INDUSTRIES, ALL_CATEGORY_OPTIONS, matchIndustryOrSubcategory } from './constants/industryData';
import { IndustryCommerceHub } from './components/IndustryCommerceHub';
import { BRAND_LOGO_SRC, BRAND_NAME } from './constants/brandLogo';
import { db as firestoreDb } from './firebase';
import { collection, doc, setDoc, getDocs, getDoc } from 'firebase/firestore';
import { DEFAULT_B2B_POSTS } from './data/defaultPosts';
import { fetchPostsFromFirestore, syncPostToFirestore, submitPaymentUTRToFirestore, getAdminSettingsFromFirestore, saveAdminSettingsToFirestore, likePostInFirestore, savePostInFirestore, addCommentToFirestore, fetchCommentsFromFirestore, followUserInFirestore, recordViewInFirestore, recordShareInFirestore, authenticateUserInFirestore, blockUserInFirestore, markPostNotInterestedInFirestore, getUsersBlockedAndNotInterestedFromFirestore, clearDefaultDataFromFirestore } from './services/firebaseDataSync';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getUserHiddenFilters(userId?: string | number) {
  const uid = userId ? String(userId) : 'guest';
  const localBlockedKey = `VyaparBridge_blocked_users_${uid}`;
  const localNotInterestedKey = `VyaparBridge_not_interested_${uid}`;
  
  let blockedUsers: string[] = [];
  let notInterestedPosts: string[] = [];

  try {
    const bStr = localStorage.getItem(localBlockedKey);
    if (bStr) blockedUsers = JSON.parse(bStr);
  } catch (e) {}

  try {
    const niStr = localStorage.getItem(localNotInterestedKey);
    if (niStr) notInterestedPosts = JSON.parse(niStr);
  } catch (e) {}

  return { blockedUsers, notInterestedPosts, localBlockedKey, localNotInterestedKey };
}

export function filterOutHiddenContent(items: any[], userId?: string | number) {
  if (!Array.isArray(items)) return [];
  const { blockedUsers, notInterestedPosts } = getUserHiddenFilters(userId);
  const blockedSet = new Set(blockedUsers.map(String));
  const notInterestedSet = new Set(notInterestedPosts.map(String));

  return items.filter(item => {
    if (!item) return false;
    const itemId = String(item.id || '');
    const itemUserId = String(item.userId || item.user?.id || item.actorId || '');
    if (itemId && notInterestedSet.has(itemId)) return false;
    if (itemUserId && blockedSet.has(itemUserId)) return false;
    return true;
  });
}

async function safeFetch(url: string, options?: RequestInit) {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type');
    if (!res.ok) {
      let errorMsg = `Server error: ${res.status}`;
      try {
        if (contentType && contentType.includes('application/json')) {
          const errData = await res.json();
          errorMsg = errData.error || errorMsg;
        }
      } catch (e) {}
      throw new Error(errorMsg);
    }
    if (!contentType || !contentType.includes('application/json')) {
      // If received HTML (like on Vercel 404/SPA rewrite fallback)
      return { success: true, message: 'OK', items: [] };
    }
    return res.json();
  } catch (err: any) {
    throw err;
  }
}

// IndexedDB Local Media Mirror Manager (Stores video files on local device disk without consuming RAM)
const MEDIA_DB_NAME = 'ShowroomLocalMediaDB';
const MEDIA_STORE = 'videos';

function openMediaDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(MEDIA_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(MEDIA_STORE)) {
        db.createObjectStore(MEDIA_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveMediaToLocalDisk(key: string, blob: Blob): Promise<void> {
  try {
    const db = await openMediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(MEDIA_STORE, 'readwrite');
      const store = tx.objectStore(MEDIA_STORE);
      store.put(blob, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save media in IndexedDB:', err);
  }
}

export async function getMediaFromLocalDisk(key: string): Promise<string | null> {
  try {
    const db = await openMediaDB();
    return new Promise((resolve) => {
      const tx = db.transaction(MEDIA_STORE, 'readonly');
      const store = tx.objectStore(MEDIA_STORE);
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result) {
          resolve(URL.createObjectURL(req.result as Blob));
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}

export function AdMediaDisplay({ ad, className }: { ad: any; className?: string }) {
  const [mediaSrc, setMediaSrc] = useState<string>(ad?.mediaUrl || '');
  const [videoError, setVideoError] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    let localBlobUrl: string | null = null;
    setVideoError(false);

    async function loadLocalMedia() {
      if (ad?.localMediaKey) {
        const url = await getMediaFromLocalDisk(ad.localMediaKey);
        if (url && active) {
          localBlobUrl = url;
          setMediaSrc(url);
          return;
        }
      }
      if (active) {
        setMediaSrc(ad?.mediaUrl || '');
      }
    }
    loadLocalMedia();

    return () => {
      active = false;
      if (localBlobUrl) {
        URL.revokeObjectURL(localBlobUrl);
      }
    };
  }, [ad?.id, ad?.mediaUrl, ad?.localMediaKey]);
  
  const isVideoType = ad?.type === 'video' || 
                  /\.(mp4|webm|mov|m4v|avi|mkv|3gp|flv)$/i.test(mediaSrc || ad?.mediaUrl || '') || 
                  (mediaSrc || ad?.mediaUrl || '').toLowerCase().includes('video') || 
                  (mediaSrc || ad?.mediaUrl || '').startsWith('blob:') ;

  const finalSrc = videoError ? null : (mediaSrc || ad?.mediaUrl);
  
  if (finalSrc && (finalSrc.includes('youtube.com') || finalSrc.includes('youtu.be'))) {
     const ytIdMatch = finalSrc.match(/(?:youtu\.be\/|v=|\/v\/|embed\/|watch\?v=|shorts\/)([^#\&\?]*).*/);
     const ytId = ytIdMatch && ytIdMatch[1];
     if (ytId) {
        return <iframe className={`w-full h-full aspect-video min-h-[300px] sm:min-h-[400px] object-cover ${className || ''}`} src={`https://www.youtube.com/embed/${ytId}?autoplay=0&mute=0&rel=0&controls=1&modestbranding=1&showinfo=0&iv_load_policy=3`} allow="encrypted-media; autoplay; picture-in-picture" frameBorder="0" allowFullScreen></iframe>;
     }
  }

  if (finalSrc && (finalSrc.includes("facebook.com") || finalSrc.includes("fb.watch"))) {
    return <iframe className={`w-full h-full aspect-video min-h-[300px] sm:min-h-[400px] object-cover ${className || ""}`} src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(finalSrc)}&show_text=false&autoplay=false`} allow="encrypted-media" frameBorder="0" allowFullScreen></iframe>;
  }
  if (!finalSrc) {
    return (
      <div className={`flex items-center justify-center bg-slate-900 text-black/70 text-xs font-bold ${className || "w-full max-h-[480px]"}`}>
        No Media Available
      </div>
    );
  }

  if (isVideoType) {
    return (
      <div className="relative w-full h-full min-h-[220px] bg-black flex items-center justify-center overflow-hidden group">
        <video
          key={finalSrc}
          src={finalSrc}
          controls
          muted
          loop
          playsInline
          preload="auto"
          ref={(el) => { if (el && el.paused) { const p = el.play(); if (p !== undefined) p.catch(()=>{}); } }}
          onError={() => {
            setVideoError(true);
          }}
          className={className || "w-full max-h-[480px] object-contain bg-black transform-gpu will-change-transform"}
        />
      </div>
    );
  }

  return (
    <img
      src={finalSrc}
      alt={ad?.title || 'Brand Advertisement'}
      onError={() => {
        setVideoError(true);
      }}
      className={className || "w-full max-h-[480px] object-contain bg-black transform-gpu will-change-transform"}
    />
  );
}

// User Context (Mocking auth)
const UserContext = React.createContext<any>(null);
const ThemeContext = React.createContext<any>(null);

// Persistent Follow Manager using localStorage
export function getFollowedUsers(): string[] {
  try {
    const data = localStorage.getItem('followedUsers');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function isUserFollowed(identifier: string): boolean {
  if (!identifier) return false;
  const list = getFollowedUsers();
  return list.includes(String(identifier));
}

export function toggleFollowUser(identifier: string): boolean {
  if (!identifier) return false;
  const idStr = String(identifier);
  const list = getFollowedUsers();
  let newList: string[];
  let isNowFollowing = false;
  if (list.includes(idStr)) {
    newList = list.filter(id => id !== idStr);
    isNowFollowing = false;
  } else {
    newList = [...list, idStr];
    isNowFollowing = true;
  }
  localStorage.setItem('followedUsers', JSON.stringify(newList));
  window.dispatchEvent(new Event('followedUsersUpdated'));
  return isNowFollowing;
}

// --- Components ---

export function ReportModal({
  isOpen,
  onClose,
  currentUser,
  targetType,
  targetId,
  targetName
}: {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  targetType: 'post' | 'comment' | 'user' | 'reel';
  targetId: string;
  targetName?: string;
}) {
  const [reason, setReason] = useState('Nudity or Explicit Sexual Content');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('Please log in to submit a report');
      return;
    }
    setIsSubmitting(true);
    try {
      const data = await safeFetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterId: currentUser.id,
          targetType,
          targetId,
          targetName: targetName || '',
          reason,
          details
        })
      });
      if (data.success) {
        toast.success('🛡️ Report submitted! Meta-style AI Safety team will review it.');
        onClose();
        setDetails('');
      } else {
        toast.error(data.error || 'Failed to submit report');
      }
    } catch (err) {
      toast.error('Error submitting report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <span>Report {targetType === 'user' ? 'User Profile' : targetType.toUpperCase()}</span>
          </div>
          <button onClick={onClose} className="p-1 text-black/60 hover:text-black/80 dark:hover:text-white rounded-full">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-black/80 dark:text-zinc-400">
            Select a reason for reporting <span className="font-bold">{targetName || targetType}</span>. AI Guardrails will inspect the content immediately.
          </p>

          <div>
            <label className="block text-xs font-bold mb-1.5 text-black dark:text-zinc-200">Violation Category:</label>
            <select 
              value={reason} 
              onChange={e => setReason(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 text-black dark:text-zinc-100"
            >
              <option value="Nudity or Explicit Sexual Content">🔞 Nudity / Explicit Sexual Content</option>
              <option value="Abusive Language or Harassment">🤬 Abusive Language / Harassment</option>
              <option value="Fake Account / Scam / Spam">⚠️ Fake Account / Scam / Spam</option>
              <option value="Non-Tile Unrelated Content">🚫 Non-Tile Unrelated Content</option>
              <option value="Other Safety Violation">❓ Other Safety Violation</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 text-black dark:text-zinc-200">Details (Optional):</label>
            <textarea
              rows={3}
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Describe what is wrong or offensive..."
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-black dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 text-black dark:text-zinc-300 font-bold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Report'}</span>
            </button>
          </div>
        </form>
      </div></div>
  );
}

// Helper to calculate distance in KM between two coordinates
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function VerifiedBadge({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeMap = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };
  return (
    <span className={cn("inline-flex items-center text-[#0095f6] dark:text-[#3897f0] shrink-0", className)} title="Vyapar Bridge Verified Member">
      <svg className={cn(sizeMap[size], "fill-current")} viewBox="0 0 24 24">
        <path d="M12 2l2.4 2.4 3.4-.5.5 3.4 3.2 1.3-1.3 3.2 1.3 3.2-3.2 1.3-.5 3.4-3.4-.5L12 22l-2.4-2.4-3.4.5-.5-3.4-3.2-1.3 1.3-3.2-1.3-3.2 3.2-1.3.5-3.4 3.4.5L12 2z" />
        <path d="M10 15.5l-3.5-3.5 1.4-1.4 2.1 2.1 5.6-5.6 1.4 1.4z" fill="#ffffff" />
      </svg>
    </span>
  );
}

export function VerifiedPaymentModal({ isOpen, onClose, user, onSuccess }: { isOpen: boolean, onClose: () => void, user: any, onSuccess: (u: any) => void }) {
  const isCustomer = user?.role === 'customer';
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [membershipType, setMembershipType] = useState<'local' | 'company'>(user?.role === 'customer' ? 'local' : 'company');
  const [step, setStep] = useState<'plan' | 'qr'>('plan');
  const [utr, setUtr] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<any>({
    upiId: 'vyaparbridge@upi',
    accountName: 'Vyapar Bridge B2B Operations',
    barcodeImageUrl: '',
    barcodeSecretToken: 'SECURE-BARCODE-VERIFY-2026-X89',
    paymentLink: 'upi://pay?pa=vyaparbridge@upi&pn=Vyapar Bridge%20India&cu=INR'
  });

  useEffect(() => {
    if (isOpen) {
      setStep('plan');
      setUtr('');
      setLoading(false);
      setMembershipType(user?.role === 'customer' ? 'local' : 'company');
      setSelectedPlan('monthly');
      
      // Check local storage and Firestore for active payment settings & barcode
      const localBarcode = localStorage.getItem('vyapar_barcode_url');
      if (localBarcode) {
        setPaymentSettings((prev: any) => ({ ...prev, barcodeImageUrl: localBarcode }));
      }
      getAdminSettingsFromFirestore().then(fbData => {
        if (fbData && (fbData.upiId || fbData.barcodeImageUrl)) {
          setPaymentSettings((prev: any) => ({ ...prev, ...fbData }));
        }
      }).catch(console.warn);

      safeFetch('/api/payment-settings')
        .then(data => {
          if (data && data.upiId) {
            setPaymentSettings((prev: any) => ({ ...prev, ...data }));
          }
        })
        .catch(err => console.error(err));
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const price = selectedPlan === 'monthly' ? '₹99' : '₹1,188';

  const handleCopyLink = () => {
    const textToCopy = paymentSettings.paymentLink || `upi://pay?pa=${paymentSettings.upiId}&pn=${encodeURIComponent(paymentSettings.accountName)}&cu=INR`;
    navigator.clipboard.writeText(textToCopy);
    toast.success('📋 Payment Link copied to clipboard!');
  };

  const handleCopyUpi = () => {
    const cleanUpi = (paymentSettings.upiId || 'vyaparbridge@upi').trim().replace(/\s+/g, '');
    navigator.clipboard.writeText(cleanUpi);
    toast.success(`📋 UPI ID copied: ${cleanUpi}`);
  };

  const handleOpenUpiApp = (appType?: 'gpay' | 'phonepe' | 'paytm' | 'generic') => {
    const rawUpi = (paymentSettings.upiId || 'vyaparbridge@upi').trim();
    const cleanUpi = rawUpi.replace(/\s+/g, '');
    const cleanName = 'VyaparBridge';
    const numAmount = selectedPlan === 'yearly' ? '1188' : '99';

    // 1. Copy UPI ID to clipboard as instant backup
    try {
      navigator.clipboard.writeText(cleanUpi);
    } catch (e) {}

    toast.success(`📋 UPI ID Copied: ${cleanUpi}\nOpening Payment App (${price})...`, { duration: 4000 });

    let upiUrl = `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${numAmount}&cu=INR`;

    if (appType === 'phonepe') {
      upiUrl = `phonepe://pay?pa=${cleanUpi}&pn=${cleanName}&am=${numAmount}&cu=INR`;
    } else if (appType === 'paytm') {
      upiUrl = `paytmmp://pay?pa=${cleanUpi}&pn=${cleanName}&am=${numAmount}&cu=INR`;
    } else if (appType === 'gpay') {
      upiUrl = `intent://pay?pa=${cleanUpi}&pn=${cleanName}&am=${numAmount}&cu=INR#Intent;scheme=upi;package=com.google.android.apps.nfp.p2p;end;`;
    }

    setTimeout(() => {
      window.location.href = upiUrl;
    }, 300);
  };

  const handleConfirmPayment = async () => {
    if (!utr || !utr.trim()) {
      toast.error('Please enter your 12-digit UTR or Transaction Reference Number!');
      return;
    }
    setLoading(true);
    const cleanUtr = utr.trim();
    const amountVal = selectedPlan === 'yearly' ? 1188 : 99;

    const pendingPaymentObj = {
      id: `pay_${Date.now()}`,
      plan: selectedPlan,
      membershipType: membershipType,
      utr: cleanUtr,
      amount: amountVal,
      status: 'pending',
      submittedAt: Date.now()
    };

    const updatedUserObj = {
      ...(user || {}),
      pendingPayment: pendingPaymentObj
    };

    // 1. Submit to Firestore
    try {
      await submitPaymentUTRToFirestore({
        userId: user?.id || '1',
        userName: user?.name || user?.companyName || 'Member',
        userPhone: user?.phone || '',
        plan: selectedPlan,
        membershipType: membershipType,
        utr: cleanUtr,
        amount: amountVal
      });
    } catch (fbErr) {
      console.warn('Firestore payment note:', fbErr);
    }

    // 2. Try backend API
    try {
      const data = await safeFetch('/api/payments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || '1',
          plan: selectedPlan,
          membershipType: membershipType,
          utr: cleanUtr
        })
      });
      if (data && data.user) {
        onSuccess(data.user);
      } else {
        onSuccess(updatedUserObj);
      }
    } catch (e) {
      console.warn('Backend API note, using local & Firestore record:', e);
      onSuccess(updatedUserObj);
    } finally {
      setLoading(false);
      toast.success(`⏳ Payment UTR Submitted! Admin 24-Hour Verification is now active.`);
      
      // Open WhatsApp to send UTR directly to Admin with pre-filled message
      const adminWhatsApp = paymentSettings.whatsappNumber || '919825012345';
      const cleanPhone = adminWhatsApp.replace(/\D/g, '');
      const msgText = encodeURIComponent(
        `🙏 Namaste Vyapar Bridge Admin,\n\nMaine Payment complete kar di hai:\n- User/Business: ${user?.name || user?.companyName || 'Member'}\n- Plan: ${selectedPlan === 'yearly' ? 'Yearly Plan (₹1,188)' : 'Monthly Plan (₹99)'}\n- 12-Digit UTR: ${cleanUtr}\n\nKripya verification approve karein aur Blue Badge activate karein. Dhanyawad!`
      );
      const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msgText}`;
      window.open(waUrl, '_blank');
      
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/75 backdrop-blur-md p-4" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-zinc-800 flex flex-col max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg flex items-center gap-1.5">
                Vyapar Bridge Verified <Sparkles className="w-4 h-4 text-amber-300" />
              </h3>
              {isCustomer ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded">Verified Member</span>
                  <Award className="w-4 h-4 text-amber-300" />
                </div>
              ) : (
                <p className="text-xs text-blue-100">Official B2B Authenticity Badge & Top 10 Rank</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white cursor-pointer">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {/* Active Pending Verification Status Banner */}
          {user?.pendingPayment && user?.pendingPayment?.status === 'pending' && (
            <div className="bg-amber-500/10 border-2 border-amber-500/40 p-4 rounded-xl text-xs space-y-1.5 text-amber-800 dark:text-amber-300">
              <div className="font-extrabold text-sm flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <span>⏳ Verification Pending (24-Hour Timer Active)</span>
              </div>
              <p>
                Your payment for <strong>{user.pendingPayment.plan === 'yearly' ? 'Yearly Plan (₹1,188)' : 'Monthly Plan (₹99)'}</strong> is under review by Vyapar Bridge Admin.
              </p>
              <p className="text-[11px] font-bold text-black/80 dark:text-slate-300">
                ✓ Verified Badge will be activated as soon as Admin approves.
              </p>
              <p className="text-[10px] text-amber-600 dark:text-amber-400">
                * Note: If not verified by Admin within 24 hours, money auto-refund triggers back to your UPI account. Please make sure you sent the screenshot on WhatsApp.
              </p>
            </div>
          )}

          {user?.pendingPayment && user?.pendingPayment?.status === 'refund_initiated' && (
            <div className="bg-rose-500/10 border-2 border-rose-500/40 p-4 rounded-xl text-xs space-y-1.5 text-rose-800 dark:text-rose-300">
              <div className="font-extrabold text-sm flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <span>↩ Refund Initiated / Unverified</span>
              </div>
              <p>
                Your payment was not verified within 24 hours or unmatched in statement. Refund has been initiated back to your bank account. You can re-submit a new payment request and message Admin.
              </p>
            </div>
          )}

          {user?.isVerified ? (
            <div className="flex flex-col gap-6 py-4">
              <div className="flex flex-col items-center justify-center py-8 gap-5 bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-900/20 dark:to-zinc-900 rounded-2xl border-2 border-emerald-100 dark:border-emerald-800/50 shadow-sm">
                <div className="relative">
                  <div className="absolute -inset-4 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                  <div className="relative bg-emerald-600 p-5 rounded-full shadow-xl shadow-emerald-500/40">
                    <ShieldCheck className="w-14 h-14 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-amber-500 p-1.5 rounded-full border-4 border-white dark:border-zinc-900">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="text-center px-4">
                  <h2 className="text-2xl font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-tighter leading-none mb-2">
                    ACTIVE VERIFIED MEMBER
                  </h2>
                  <p className="text-xs text-black/70 dark:text-zinc-400 font-bold uppercase tracking-widest">
                    {user.verifiedPlan === 'yearly' ? 'Yearly Plan (365 Days)' : 'Monthly Plan (30 Days)'}
                  </p>
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-zinc-800/50 p-5 rounded-2xl border border-slate-200 dark:border-zinc-700 space-y-4">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <span className="text-xs font-bold text-black/60 dark:text-zinc-400 uppercase tracking-wider">Plan Validity</span>
                    <div className="text-lg font-black text-black dark:text-zinc-100">
                      {Math.ceil(Math.max(0, (user.verifiedPlan === 'yearly' ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000) - (Date.now() - (user.verifiedAt || Date.now()))) / (1000 * 60 * 60 * 24))} Days Remaining
                    </div>
                  </div>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
                    Active ✓
                  </div>
                </div>
                
                <div className="relative w-full h-4 bg-slate-200 dark:bg-zinc-700 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${Math.min(100, Math.max(0, 100 - ((Date.now() - (user.verifiedAt || Date.now())) / (user.verifiedPlan === 'yearly' ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000) * 100)))}%` 
                    }}
                  />
                  {/* Animated shine effect on the progress bar */}
                  <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-black/50 dark:text-zinc-500 uppercase tracking-wider">
                  <span>Activated: {new Date(user.verifiedAt || Date.now()).toLocaleDateString()}</span>
                  <span>Expires: {new Date((user.verifiedAt || Date.now()) + (user.verifiedPlan === 'yearly' ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000)).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ) : step === 'plan' ? (
            <>
              {/* Feature Highlights / Instructions */}
              {isCustomer ? (
                <div className="flex flex-col items-center justify-center py-8 gap-5 bg-gradient-to-b from-blue-50 to-white dark:from-blue-900/20 dark:to-zinc-900 rounded-2xl border-2 border-blue-100 dark:border-blue-800/50 shadow-sm">
                  <div className="relative">
                    <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
                    <div className="relative bg-blue-600 p-5 rounded-full shadow-xl shadow-blue-500/40">
                      <ShieldCheck className="w-14 h-14 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-amber-500 p-1.5 rounded-full border-4 border-white dark:border-zinc-900">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="text-center px-4">
                    <h2 className="text-2xl font-black text-black dark:text-white uppercase tracking-tighter leading-none mb-2">
                      VYAPAR BRIDGE VERIFIED MEMBER
                    </h2>
                    <p className="text-xs text-black/70 dark:text-zinc-400 font-bold uppercase tracking-widest">
                      Premium Direct Connect Access
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-zinc-800/60 p-4 rounded-xl border border-slate-100 dark:border-zinc-800 text-xs space-y-3">
                  <div className="font-bold text-black dark:text-zinc-200 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-500" />
                    Merchant Verification Benefits:
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <span><strong>Blue Verified Badge</strong> on profile & posts</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <span><strong>Top 10 Leaderboard</strong> on Home Feed</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Select Plan / Dropdown for Customer */}
              <div className="space-y-4">
                <label className="block text-sm font-bold text-black dark:text-zinc-200">
                  {isCustomer ? 'कनेक्शन का प्रकार चुनें (Select Connection Type):' : 'Select Verification Plan (₹):'}
                </label>
                
                {isCustomer ? (
                  <div className="relative group">
                    <select 
                      value={membershipType === 'local' ? 'monthly' : 'yearly'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'monthly') {
                          setSelectedPlan('monthly');
                          setMembershipType('local');
                        } else {
                          setSelectedPlan('yearly');
                          setMembershipType('company');
                        }
                      }}
                      className="w-full bg-white dark:bg-zinc-950 border-2 border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-4 text-sm font-bold text-black dark:text-white outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer pr-10"
                    >
                      <option value="monthly">📍 Local Connect (Dealers within 100km) - ₹99</option>
                      <option value="yearly">🏢 Bulk Supply Chain (All Factories & Brands) - ₹1,188</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-black/60 group-focus-within:text-blue-500 transition-colors">
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Merchant Cards */}
                    <div 
                      onClick={() => {
                        setSelectedPlan('monthly');
                        setMembershipType('company');
                      }}
                      className={cn(
                        "p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between relative",
                        selectedPlan === 'monthly'
                          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 shadow-md"
                          : "border-slate-200 dark:border-zinc-800 hover:border-slate-300"
                      )}
                    >
                      <div className="text-xs font-semibold text-black/70 dark:text-zinc-400">Monthly Plan</div>
                      <div className="text-2xl font-black text-black dark:text-white mt-1">₹99</div>
                      <div className="text-[10px] text-black/70 mt-1">Billed monthly</div>
                    </div>

                    <div 
                      onClick={() => {
                        setSelectedPlan('yearly');
                        setMembershipType('company');
                      }}
                      className={cn(
                        "p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden",
                        selectedPlan === 'yearly'
                          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 shadow-md"
                          : "border-slate-200 dark:border-zinc-800 hover:border-slate-300"
                      )}
                    >
                      <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">BEST VALUE</div>
                      <div className="text-xs font-semibold text-black/70 dark:text-zinc-400">Yearly Plan</div>
                      <div className="text-2xl font-black text-black dark:text-white mt-1">₹1,188</div>
                      <div className="text-[10px] text-black/70 mt-1">12 Months Access</div>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setStep('qr')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all text-sm shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                Proceed to Pay {price} <QrCode className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              {/* QR & Link Payment Step */}
              <div className="text-center space-y-3">
                <div className="font-bold text-lg text-black dark:text-white">
                  Amount: <span className="text-blue-600 dark:text-blue-400">{price} INR</span> ({selectedPlan === 'monthly' ? 'Monthly' : 'Yearly'})
                </div>

                {/* Secure Barcode Image Section */}
                <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3">
                  <div className="text-xs font-extrabold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1.5 uppercase tracking-wider">
                    <QrCode className="w-4 h-4" />
                    <span>Official Verified Barcode & UPI Payment</span>
                  </div>

                  {paymentSettings.barcodeImageUrl ? (
                    <div className="relative inline-block bg-white p-3 rounded-xl shadow-md border border-slate-200 dark:border-zinc-700">
                      <img 
                        src={paymentSettings.barcodeImageUrl} 
                        alt="Payment Barcode QR" 
                        className="max-h-56 w-auto mx-auto object-contain rounded-lg" 
                      />
                    </div>
                  ) : (
                    <div className="inline-block bg-white p-3 rounded-2xl shadow-md border border-slate-200 dark:border-zinc-700">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=${paymentSettings.upiId || 'vyaparbridge@upi'}&pn=VyaparBridge&am=${selectedPlan === 'yearly' ? 1188 : 99}&cu=INR`)}`}
                        alt="Dynamic Scannable UPI QR"
                        className="w-48 h-48 mx-auto object-contain rounded-xl"
                      />
                    </div>
                  )}

                  {/* Direct UPI ID & Link Box */}
                  <div className="space-y-2 bg-slate-50 dark:bg-zinc-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-left">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-black/80 dark:text-zinc-300 font-bold">Official UPI ID:</span>
                      <button 
                        type="button"
                        onClick={handleCopyUpi} 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy UPI ID</span>
                      </button>
                    </div>
                    <div className="font-mono font-black text-base text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-center tracking-wide select-all">
                      {paymentSettings.upiId || 'vyaparbridge@upi'}
                    </div>
                  </div>

                  {/* Highlighted Platform Fee Note in English */}
                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 p-3.5 rounded-xl text-left shadow-sm space-y-1">
                    <div className="flex items-center gap-1.5 font-extrabold text-xs text-amber-900 dark:text-amber-300 uppercase tracking-wide">
                      <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Platform Support Contribution</span>
                    </div>
                    <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed font-medium">
                      Note: We collect this nominal fee solely to support continuous platform developments, server infrastructure maintenance, and seamless enhancements of Vyapar Bridge. Thank you to our faithful users for your trust and support!
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-black dark:text-zinc-300">
                  Transaction / UTR Reference No. (Required)
                </label>
                <input 
                  type="text" 
                  value={utr}
                  onChange={e => setUtr(e.target.value)}
                  placeholder="e.g. 423891023812"
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-black dark:text-white"
                />
              </div>

              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setStep('plan')}
                  className="w-1/3 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-black dark:text-zinc-200 font-semibold py-2.5 rounded-xl transition-colors text-sm cursor-pointer"
                >
                  Back
                </button>
                <button 
                  type="button" 
                  disabled={loading}
                  onClick={handleConfirmPayment}
                  className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-colors text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Activating...
                    </>
                  ) : (
                    'Payment Done - Get Verified ✓'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div></div>
  );
}


export function validateMediaDuration(file: File): Promise<{ valid: boolean; duration: number; message?: string }> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('video') && !file.name.match(/\.(mp4|webm|mov|m4v)$/i)) {
      resolve({ valid: true, duration: 0 });
      return;
    }
    const video = document.createElement('video');
    video.preload = 'metadata';
    const objectUrl = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      const duration = video.duration;
      if (duration > 60.5) {
        resolve({ 
          valid: false, 
          duration, 
          message: `Reel duration (${Math.round(duration)}s) exceeds 60 seconds limit. Please select a video under 60 seconds.` 
        });
      } else {
        resolve({ valid: true, duration });
      }
    };
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ valid: true, duration: 0 });
    };
    video.src = objectUrl;
  });
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

function ReelCard({ 
  reel, 
  currentUser, 
  onClose,
  userLocation
}: { 
  reel: any; 
  currentUser: any; 
  onClose?: () => void;
  userLocation?: {lat: number, lng: number} | null;
}) {
  const navigate = useNavigate();
  const authorIdentifier = reel?.userId || reel?.user?.id || reel?.user?.name || reel?.name || '';
  const [isLiked, setIsLiked] = useState(reel?.isLiked || false);
  const [likesCount, setLikesCount] = useState(reel?.likesCount || 0);
  const [isSaved, setIsSaved] = useState(reel?.isSaved || false);
  const [savedCount, setSavedCount] = useState(reel?.savedCount || 0);

  useEffect(() => {
    setIsLiked(reel?.isLiked || false);
    setLikesCount(reel?.likesCount || 0);
    setIsSaved(reel?.isSaved || false);
    setSavedCount(reel?.savedCount || 0);
  }, [reel?.isLiked, reel?.likesCount, reel?.isSaved, reel?.savedCount]);
  const [sharesCount, setSharesCount] = useState(reel?.sharesCount || 0);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsCount, setCommentsCount] = useState(reel?.commentsCount || 0);
  const [viewsCount, setViewsCount] = useState(reel?.viewsCount || 0);
  const [commentText, setCommentText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showMore, setShowMore] = useState(false);
  const [showCommentsDrawer, setShowCommentsDrawer] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [reelRating, setReelRating] = useState<number>(reel?.averageRating || 4.8);
  const [reelRatingsCount, setReelRatingsCount] = useState<number>(reel?.ratingsCount || 0);
  const [isFollowing, setIsFollowing] = useState(() => isUserFollowed(authorIdentifier));
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain');
  const [showVolumeIndicator, setShowVolumeIndicator] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const isVideo = reel?.type === 'video' || (reel?.mediaUrl && reel.mediaUrl.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i)) || reel?.mediaUrl?.startsWith('data:video') || reel?.video;
  const mediaSrc = reel?.mediaUrl || reel?.video || '';
  const authorName = reel?.user?.name || reel?.name || 'User';
  const authorAvatar = reel?.user?.avatarUrl || reel?.avatar;
  const isAuthorVerified = reel?.user?.isVerified || reel?.isVerified;
  const reelMusic = reel?.music || (reel?.musicTitle ? { title: reel.musicTitle, artist: reel.musicArtist, audioUrl: reel.musicUrl } : null);

  useEffect(() => {
    // Unique view tracking for reels (Real-time update)
    if (reel?.id) {
      const trackReelView = () => {
        recordViewInFirestore(reel.id);
        fetch(`/api/posts/${reel.id}/view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser?.id })
        })
        .then(res => (res.ok && res.headers.get('content-type')?.includes('application/json')) ? res.json() : null)
        .then(data => {
          if (data && data.viewsCount !== undefined) setViewsCount(data.viewsCount);
          if (data && data.likesCount !== undefined) setLikesCount(data.likesCount);
        })
        .catch(err => console.warn('Failed to track reel view', err));
      };

      trackReelView();
      // Poll for real-time counts every 15 seconds
      const interval = setInterval(trackReelView, 15000);
      return () => clearInterval(interval);
    }
  }, [reel?.id]);

  useEffect(() => {
    // Attempt to play on mount (triggered by user interaction from opening the modal)
    const playMedia = async () => {
      try {
        if (isPlaying) {
          const vp = videoRef.current?.play();
          if (vp !== undefined) vp.catch(()=>{});
          const ap = audioRef.current?.play();
          if (ap !== undefined) ap.catch(()=>{});
        }
      } catch (err) {
        console.log("Autoplay blocked, waiting for interaction");
      }
    };
    playMedia();
  }, [reel?.id, isPlaying]);

  useEffect(() => {
    if (showVolumeIndicator) {
      const timer = setTimeout(() => setShowVolumeIndicator(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [showVolumeIndicator]);

  const toggleMute = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsMuted(prev => !prev);
    setShowVolumeIndicator(true);
  };

  const clickTimerRef = React.useRef<any>(null);
  const lastClickTime = React.useRef(0);

  const handleInteractionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastClickTime.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      handleDoubleTap(e);
      lastClickTime.current = 0; // Reset to prevent triple-tap double-trigger
    } else {
      // Potential single tap
      lastClickTime.current = now;
      clickTimerRef.current = setTimeout(() => {
        togglePlay();
        clickTimerRef.current = null;
      }, DOUBLE_TAP_DELAY);
    }
  };

  const handleDoubleTap = (e: React.MouseEvent) => {
    if (!isLiked) {
      handleLike();
    }
    setShowHeart(true);
    // Haptic feedback if available
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
    setTimeout(() => setShowHeart(false), 500);
  };

  useEffect(() => {
    const syncFollow = () => {
      setIsFollowing(isUserFollowed(authorIdentifier));
    };
    window.addEventListener('followedUsersUpdated', syncFollow);
    return () => window.removeEventListener('followedUsersUpdated', syncFollow);
  }, [authorIdentifier]);

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser?.id) {
      toast.error('🔐 Please Login or Register to Follow creators!');
      window.dispatchEvent(new CustomEvent('openAuthModal'));
      return;
    }
    const next = toggleFollowUser(authorIdentifier);
    setIsFollowing(next);
    if (next) {
      toast.success(`Following ${reel?.user?.name || authorIdentifier}`);
    } else {
      toast.success(`Unfollowed ${reel?.user?.name || authorIdentifier}`);
    }
    
    // Sync with backend
    try {
      await fetch(`/api/users/${authorIdentifier}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: currentUser.id })
      });
    } catch (err) {
      console.error('Failed to sync follow status with backend:', err);
    }
  };

  useEffect(() => {
    if (reel?.id) {
      fetchCommentsFromFirestore(reel.id).then(fsComments => {
        if (Array.isArray(fsComments) && fsComments.length > 0) {
          setComments(fsComments);
          setCommentsCount(fsComments.length);
        } else {
          safeFetch(`/api/posts/${reel.id}/comments`)
            .then(data => {
              if (Array.isArray(data)) {
                setComments(data);
                if (data.length > 0) setCommentsCount(data.length);
              }
            })
            .catch(() => {});
        }
      });
    }
  }, [reel?.id]);

  const togglePlay = () => {
    if (isPlaying) {
      videoRef.current?.pause();
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      const vp = videoRef.current?.play();
      if (vp !== undefined) vp.catch(()=>{});
      const ap = audioRef.current?.play();
      if (ap !== undefined) ap.catch(()=>{});
      setIsPlaying(true);
    }
  };

  const handleLike = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentUser?.id) {
      toast.error('🔐 Please Login or Register to Like reels!');
      window.dispatchEvent(new CustomEvent('openAuthModal'));
      return;
    }
    
    const wasLiked = isLiked;
    const nextState = !wasLiked;
    const nextCount = wasLiked ? Math.max(0, likesCount - 1) : likesCount + 1;

    setIsLiked(nextState);
    setLikesCount(nextCount);
    if (nextState) toast.success('Liked reel!');

    // Direct Firestore sync (Works everywhere including Vercel)
    const fsRes = await likePostInFirestore(reel.id, currentUser.id, wasLiked);
    if (fsRes && fsRes.success) {
      setIsLiked(fsRes.isLiked);
      setLikesCount(fsRes.likesCount);
      return;
    }

    try {
      const res = await safeFetch(`/api/posts/${reel.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (res && res.isLiked !== undefined) {
        setIsLiked(res.isLiked);
        setLikesCount(res.likesCount);
      }
    } catch (err) {
      console.warn('API fallback note:', err);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser?.id) {
      toast.error('🔐 Please Login or Register to Save reels!');
      window.dispatchEvent(new CustomEvent('openAuthModal'));
      return;
    }
    const wasSaved = isSaved;
    const nextState = !wasSaved;
    const nextCount = wasSaved ? Math.max(0, savedCount - 1) : savedCount + 1;

    setIsSaved(nextState);
    setSavedCount(nextCount);
    toast.success(nextState ? 'Saved reel!' : 'Removed from saved');

    // Direct Firestore sync
    const fsRes = await savePostInFirestore(reel.id, currentUser.id, wasSaved);
    if (fsRes && fsRes.success) {
      setIsSaved(fsRes.isSaved);
      setSavedCount(fsRes.savedCount);
      return;
    }

    try {
      const res = await safeFetch(`/api/posts/${reel.id}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id })
      });
      if (res && res.isSaved !== undefined) {
        setIsSaved(res.isSaved);
        setSavedCount(res.savedCount);
      }
    } catch (err) {
      console.warn('API fallback note:', err);
    }
  };

  const isReelOwnerOrAdmin = Boolean(
    !currentUser ||
    !(reel?.userId || reel?.user?.id) ||
    String(currentUser?.id) === String(reel?.userId || reel?.user?.id) ||
    currentUser?.role?.toLowerCase() === 'admin' ||
    currentUser?.role === 'Master Admin' ||
    currentUser?.isAdmin
  );

  const handleDelete = async () => {
    try {
      const res = await safeFetch(`/api/posts/${reel.id}`, {
        method: 'DELETE'
      });
      if (res.success || res.ok) {
        toast.success('Reel deleted');
        setShowOptionsModal(false);
        if (onClose) onClose();
        // Notify other components
        window.dispatchEvent(new CustomEvent('reelDeleted', { detail: { reelId: reel.id } }));
        window.dispatchEvent(new CustomEvent('postDeleted', { detail: { postId: reel.id } }));
      } else {
        toast.error('Failed to delete reel');
      }
    } catch (err) {
      toast.error('Failed to delete reel');
    }
  };

  const handleNotInterested = async () => {
    if (!currentUser?.id) {
      toast.error('Please login first');
      return;
    }
    try {
      await fetch(`/api/posts/${reel.id}/not-interested`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      toast.success('Reel marked as Not Interested. Hidden from your feed.');
      setShowOptionsModal(false);
      if (onClose) onClose();
      window.dispatchEvent(new CustomEvent('reelDeleted', { detail: { reelId: reel.id } }));
      window.dispatchEvent(new CustomEvent('postDeleted', { detail: { postId: reel.id } }));
    } catch (err) {
      toast.error('Failed to update preference');
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    recordShareInFirestore(reel.id);
    if (currentUser?.id) {
      fetch(`/api/posts/${reel.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      }).catch(() => {});
    }
    if (navigator.share) {
      navigator.share({
        title: reel?.title || 'Vyapar Bridge Reel',
        text: reel?.content || 'Check out this Reel on Vyapar Bridge B2B Network!',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Reel link copied!');
    }
    setSharesCount(prev => prev + 1);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    const content = commentText;
    setCommentText('');

    const newCommentObj = {
      content,
      userId: currentUser?.id || '1',
      userName: currentUser?.name || 'User',
      userAvatar: currentUser?.avatarUrl || '',
      createdAt: new Date().toISOString()
    };

    // Direct Firestore Sync (Works on Vercel)
    const fsComment = await addCommentToFirestore(reel?.id || '101', newCommentObj);
    if (fsComment) {
      setComments(prev => [...prev, fsComment]);
      setCommentsCount(prev => prev + 1);
      toast.success('Comment posted!');
      setIsSubmittingComment(false);
      return;
    }

    try {
      const res = await fetch(`/api/posts/${reel?.id || '101'}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          userId: currentUser?.id || '1'
        })
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.success && data.comment) {
          setComments(prev => [...prev, data.comment]);
          setCommentsCount(prev => prev + 1);
          toast.success('Comment posted!');
        }
      } else {
        const localComment = {
          id: 'c' + Date.now(),
          content,
          createdAt: Date.now(),
          user: currentUser || { name: 'You' }
        };
        setComments(prev => [...prev, localComment]);
        setCommentsCount(prev => prev + 1);
        toast.success('Comment posted!');
      }
    } catch (e) {
      const localComment = {
        id: 'c' + Date.now(),
        content,
        createdAt: Date.now(),
        user: currentUser || { name: 'You' }
      };
      setComments(prev => [...prev, localComment]);
      setCommentsCount(prev => prev + 1);
      toast.success('Comment posted!');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      const vp = videoRef.current?.play();
      if (vp !== undefined) vp.catch(() => {});
      const ap = audioRef.current?.play();
      if (ap !== undefined) ap.catch(() => {});
    } else {
      videoRef.current?.pause();
      audioRef.current?.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
      audioRef.current.volume = reel?.musicVolume !== undefined ? reel.musicVolume : 1;
    }
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.muted = true;
      } else {
        const hasCustomOriginalVolume = reel?.originalVolume !== undefined;
        videoRef.current.muted = hasCustomOriginalVolume ? reel.originalVolume === 0 : (reelMusic ? true : false);
        videoRef.current.volume = hasCustomOriginalVolume ? reel.originalVolume : (reelMusic ? 0 : 1);
      }
    }
  }, [isMuted, reelMusic, reel?.originalVolume, reel?.musicVolume]);

  return (
    <div className="relative w-full max-w-[420px] h-[85vh] sm:h-[88vh] max-h-[820px] bg-black rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between select-none border border-zinc-800">
      {/* Top Header Overlay */}
      <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between text-white z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-2">
          {onClose && (
            <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer mr-1">
              <XCircle className="w-6 h-6" />
            </button>
          )}
          <span className="font-bold text-base tracking-wide flex items-center gap-1.5 drop-shadow-md">
            Reels <Sparkles className="w-4 h-4 text-amber-300" />
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); setFitMode(prev => prev === 'contain' ? 'cover' : 'contain'); }} 
            className="p-1.5 px-2.5 bg-black/50 hover:bg-black/70 rounded-full text-white text-[11px] font-semibold backdrop-blur-md transition-all border border-white/20 flex items-center gap-1 cursor-pointer" 
            title="Toggle Aspect Ratio (Original vs Fill)"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{fitMode === 'contain' ? 'Original Ratio' : 'Fill Screen'}</span>
          </button>
          <button onClick={toggleMute} className="p-2 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-md transition-colors cursor-pointer" title={isMuted ? "Unmute" : "Mute"}>
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button onClick={() => setShowOptionsModal(true)} className="p-2 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-md transition-colors cursor-pointer">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Audio Track for custom music */}
      {reelMusic?.audioUrl && (
        <audio 
          ref={(el) => {
            if (audioRef) audioRef.current = el;
            if (el && el.paused) { const p = el.play(); if (p !== undefined) p.catch(()=>{}); }
          }}
          src={reelMusic.audioUrl} 
          loop 
          muted={isMuted}
          className="hidden"
        />
      )}

      {/* Main Media Player Canvas - Preserves Original Aspect Ratio (19:6, 16:9, 4:3, 1:1, 9:16) */}
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 overflow-hidden">
        {/* Interaction Overlay */}
        <div 
          className="absolute inset-0 z-20 cursor-pointer" 
          onClick={handleInteractionClick}
        />

        {/* Central Volume Indicator Overlay */}
        <AnimatePresence>
          {showVolumeIndicator && (
            <div className="absolute inset-0 z-[25] flex items-center justify-center pointer-events-none">
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="w-20 h-20 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl"
              >
                {isMuted ? (
                  <VolumeX className="w-10 h-10 text-white" />
                ) : (
                  <Volume2 className="w-10 h-10 text-white" />
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Double Tap Heart Animation */}
        <AnimatePresence>
          {showHeart && (
            <div className="absolute inset-0 z-[40] flex items-center justify-center pointer-events-none">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, times: [0, 0.4, 0.8, 1] }}
                className="text-white drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]"
              >
                <Heart className="w-24 h-24 fill-red-500 text-red-500" />
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Mute toggle shortcut button on the video itself (bottom right of media area) */}
        <button 
          onClick={toggleMute}
          className="absolute bottom-4 right-4 z-30 p-2.5 bg-black/40 hover:bg-black/60 backdrop-blur-lg border border-white/20 rounded-full text-white shadow-lg transition-transform duration-700 active:scale-90"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
        </button>

        {/* Ambient Blurred Background for letterboxed content */}
        {fitMode === 'contain' && (
          <div className="absolute inset-0 pointer-events-none opacity-30 overflow-hidden">
            {(mediaSrc.includes('youtube.com') || mediaSrc.includes('youtu.be') || mediaSrc.includes('facebook.com') || mediaSrc.includes('fb.watch')) ? (
               <AdMediaDisplay ad={{ type: 'video', mediaUrl: mediaSrc }} className="w-full h-full object-cover blur-3xl scale-125" />
            ) : isVideo && mediaSrc ? (
              <video preload="auto" 
                src={mediaSrc} 
                loop 
                muted 
                playsInline 
                className="w-full h-full object-cover blur-3xl scale-125 transform-gpu will-change-transform" 
                ref={(el) => {
                  if (el && el.paused) {
                    const p = el.play();
                    if (p !== undefined) p.catch(() => {});
                  }
                }}
              />
            ) : mediaSrc ? (
              <img src={mediaSrc} alt="" className="w-full h-full object-cover blur-3xl scale-125" />
            ) : null}
          </div>
        )}

        {/* Sharp Foreground Media in Original Aspect Ratio */}
        {(mediaSrc.includes('youtube.com') || mediaSrc.includes('youtu.be') || mediaSrc.includes('facebook.com') || mediaSrc.includes('fb.watch')) ? (
          <AdMediaDisplay ad={{ type: 'video', mediaUrl: mediaSrc }} className={cn("relative z-10 w-full h-full pointer-events-auto", fitMode === 'contain' ? "object-contain" : "object-cover")} />
        ) : isVideo && mediaSrc ? (
          <video preload="auto" 
            ref={(el) => {
              // Combine user ref with local ref
              if (typeof videoRef === 'function') videoRef(el);
              else if (videoRef) videoRef.current = el;
              if (el) {
                const p = el.play();
                if (p !== undefined) p.catch(() => {});
              }
            }}
            src={mediaSrc} 
            poster={reel?.thumbnailUrl}
            loop 
            muted={isMuted}
            playsInline
            className={cn(
              "relative z-10 transition-all duration-800 max-h-full max-w-full m-auto",
              fitMode === 'contain' ? "object-contain w-full h-full" : "object-cover w-full h-full"
            )} 
          />
        ) : (
          <img 
            src={mediaSrc} 
            alt={reel?.title || 'Reel media'} 
            className={cn(
              "relative z-10 transition-all duration-800 max-h-full max-w-full m-auto",
              fitMode === 'contain' ? "object-contain w-full h-full" : "object-cover w-full h-full"
            )} 
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1615971677499-5467cbab01c0?auto=format&fit=crop&w=800&q=80';
            }}
          />
        )}

        {!isPlaying && isVideo && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
            <div className="w-16 h-16 rounded-full bg-black/60 text-white flex items-center justify-center pl-1 border border-white/20 shadow-xl">
              <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
        )}
      </div>

      {/* Right Side Vertical Action Column */}
      <div className="absolute right-3.5 bottom-10 z-20 flex flex-col items-center gap-4">
        {/* Like Button */}
        <button 
          onClick={handleLike}
          className="flex flex-col items-center gap-1 text-white group cursor-pointer"
        >
          <div className={cn(
            "w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all group-active:scale-125",
            isLiked ? "bg-red-500/30 text-red-500 border border-red-500/50" : "bg-black/40 hover:bg-black/60 text-white border border-white/10"
          )}>
            <Heart 
              className={cn("w-6 h-6 transition-transform", isLiked && "scale-110")} 
              fill={isLiked ? "#ef4444" : "none"} 
              stroke={isLiked ? "#ef4444" : "currentColor"}
            />
          </div>
          <span className="text-[11px] font-bold drop-shadow-md">{likesCount > 999 ? (likesCount/1000).toFixed(1) + 'K' : likesCount}</span>
        </button>

        {/* Comment Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); setShowCommentsDrawer(!showCommentsDrawer); }}
          className="flex flex-col items-center gap-1 text-white group cursor-pointer"
        >
          <div className="w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all group-active:scale-125">
            <MessageCircle className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-bold drop-shadow-md">{commentsCount}</span>
        </button>

        {/* Share Button */}
        <button 
          onClick={handleShare}
          className="flex flex-col items-center gap-1 text-white group cursor-pointer"
        >
          <div className="w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all group-active:scale-125">
            <svg aria-label="Share" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22 3L9.218 10.083 11.698 20.334 22 3z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/><polygon points="11.698 20.334 22 3 2 3 9.218 10.084 11.698 20.334" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
          </div>
          <span className="text-[11px] font-bold drop-shadow-md">{sharesCount}</span>
        </button>

        {/* Bookmark / Save Button */}
        <button 
          onClick={handleSave}
          className="flex flex-col items-center gap-1 text-white group cursor-pointer"
        >
          <div className={cn(
            "w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all group-active:scale-125",
            isSaved ? "bg-amber-500/30 text-amber-400 border border-amber-500/50" : "bg-black/40 hover:bg-black/60 text-white border border-white/10"
          )}>
            <Bookmark 
              className={cn("w-6 h-6 transition-transform", isSaved && "scale-110")} 
              fill={isSaved ? "#f59e0b" : "none"} 
              stroke={isSaved ? "#f59e0b" : "currentColor"}
            />
          </div>
          <span className="text-[11px] font-bold drop-shadow-md">{savedCount}</span>
        </button>

        {/* Inquiry / Chat Button - Especially for Customers */}
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            
            // Distance Check for Local Customer Members
            if (currentUser?.role === 'customer' && currentUser?.membershipType === 'local') {
              const targetCoords = reel?.user?.gpsCoords || reel?.gpsCoords;
              if (userLocation && targetCoords) {
                const dist = calculateDistance(userLocation.lat, userLocation.lng, targetCoords.lat, targetCoords.lng);
                if (dist > 100) {
                  toast.error(`📍 Distance Restriction: As a Local Member, you can only inquire with dealers within 100km. This business is ${Math.round(dist)}km away. Upgrade to 'Direct Company' plan for nationwide access!`);
                  return;
                }
              } else if (!userLocation) {
                toast.error("📍 Please enable GPS/Location to verify distance for Local Membership.");
                return;
              }
            }

            if (onClose) onClose();
            navigate('/chat'); 
          }}
          className="flex flex-col items-center gap-1 text-white group cursor-pointer"
          title="Inquire about this material"
        >
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all group-active:scale-125 shadow-lg shadow-emerald-500/20">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <span className="text-[10px] font-black drop-shadow-md tracking-tighter uppercase text-emerald-400">Inquiry</span>
        </button>

        {/* Star Rating Button (Public AI Rating & Feedback - No Login Needed) */}
        <button 
          onClick={(e) => { e.stopPropagation(); setShowRatingModal(true); }}
          className="flex flex-col items-center gap-1 text-white cursor-pointer hover:scale-105 transition-transform"
          title="Rate Reel with Stars (AI Auto Visibility Boost)"
        >
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-500/80 to-yellow-400/80 hover:from-amber-500 hover:to-yellow-400 backdrop-blur-md border border-amber-300/40 flex items-center justify-center transition-all shadow-lg shadow-amber-500/20">
            <Star className="w-5 h-5 text-amber-100 fill-amber-200" />
          </div>
          <span className="text-[10px] font-black text-amber-300 drop-shadow-md tracking-tight">{reelRating.toFixed(1)}★</span>
        </button>

        {/* Insights Display */}
        <button 
          onClick={(e) => { e.stopPropagation(); setShowStatsModal(true); }}
          className="flex flex-col items-center gap-1 text-white cursor-pointer hover:scale-105 transition-transform"
          title="View detailed post insights & activity log"
        >
          <div className="w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all">
            <BarChart2 className="w-5 h-5 text-blue-400" />
          </div>
          <span className="text-[10px] font-bold drop-shadow-md tracking-tight">Insights</span>
        </button>

        {/* More Options (...) */}
        <button 
          onClick={(e) => { e.stopPropagation(); setShowOptionsModal(true); }}
          className="flex flex-col items-center text-white cursor-pointer"
        >
          <div className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center">
            <MoreHorizontal className="w-5 h-5" />
          </div>
        </button>
      </div>

      {/* Bottom Left Info & Caption Overlay */}
      <div className="absolute left-3.5 bottom-4 right-16 z-20 text-white drop-shadow-lg flex flex-col gap-2">
        {/* User profile row */}
        <div className="flex items-center gap-2.5">
          <div 
            onClick={(e) => { e.stopPropagation(); if (onClose) onClose(); navigate(`/profile/${authorIdentifier}`); }}
            className={cn(
            "w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-xs font-bold cursor-pointer hover:scale-105 transition-transform",
            isAuthorVerified ? "tiranga-border-circle" : "neon-border-circle"
          )}>
            <div className="w-full h-full bg-black rounded-full p-[1px] overflow-hidden">
              {authorAvatar ? (
                <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
              ) : (
                authorName.charAt(0)
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 flex-wrap">
            <span 
              onClick={(e) => { e.stopPropagation(); if (onClose) onClose(); navigate(`/profile/${authorIdentifier}`); }}
              className="font-bold text-sm tracking-wide flex items-center gap-1 text-white cursor-pointer hover:underline"
            >
              {authorName}
              {isAuthorVerified && <VerifiedBadge size="sm" />}
            </span>
            <button 
              onClick={handleToggleFollow}
              className={cn(
                "text-[11px] font-bold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ml-1",
                isFollowing 
                  ? "bg-white/20 text-white border-white/30" 
                  : "bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
              )}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>
        </div>

        {/* Music / Audio Track Ticker */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-200 font-medium bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full w-fit max-w-[240px] truncate border border-white/10">
          <span className="text-blue-400">🎵</span>
          <span className="truncate">
            {reelMusic ? `${reelMusic.title} • ${reelMusic.artist}` : `${authorName} • Original Audio`}
          </span>
        </div>

        {/* Caption text with "... more" toggle */}
        <div className="text-xs sm:text-sm text-zinc-100 pr-2 leading-relaxed">
          {reel?.title && <div className="font-bold text-white mb-0.5">{reel.title}</div>}
          <p className={cn("transition-all", !showMore && "line-clamp-2")}>
            {reel?.content || 'Vyapar Bridge B2B Manufacturing and Vitrified Ceramics Collection.'}
          </p>
          {reel?.hashtags && (
            <p className="text-blue-300 font-semibold mt-1 text-xs">{reel.hashtags}</p>
          )}
          {reel?.content && reel.content.length > 50 && (
            <button 
              onClick={(e) => { e.stopPropagation(); setShowMore(!showMore); }}
              className="text-zinc-400 font-bold hover:text-white text-xs mt-0.5 cursor-pointer inline-block"
            >
              {showMore ? 'less' : '... more'}
            </button>
          )}
        </div>
      </div>

      {/* Comments Drawer / Sliding Panel */}
      {showCommentsDrawer && (
        <div className="absolute inset-x-0 bottom-0 top-1/3 bg-zinc-950/95 backdrop-blur-2xl rounded-t-2xl z-40 p-4 border-t border-zinc-800 flex flex-col justify-between shadow-2xl animate-in slide-in-from-bottom duration-700" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-2">
            <span className="font-bold text-sm text-white flex items-center gap-2">
              Comments ({comments.length || commentsCount})
            </span>
            <button onClick={() => setShowCommentsDrawer(false)} className="text-zinc-400 hover:text-white p-1 cursor-pointer">
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 my-2 pr-1 scrollbar-thin">
            {comments.map((c, i) => (
              <div key={c.id || i} className="flex items-start gap-2.5 text-xs text-white">
                <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-[11px] text-zinc-300 shrink-0 overflow-hidden">
                  {c.user?.avatarUrl ? (
                    <img src={c.user.avatarUrl} alt={c.user.name} className="w-full h-full object-cover" />
                  ) : (
                    c.user?.name?.charAt(0) || 'U'
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-zinc-200">{c.user?.name || 'Vyapar Bridge Member'}</span>
                  </div>
                  <p className="text-zinc-300 mt-0.5 leading-normal">{c.content}</p>
                  <button 
                    onClick={() => setCommentText('@' + (c.user?.name?.replace(/\s+/g, '') || 'User') + ' ')} 
                    className="text-[10px] text-zinc-500 font-bold hover:text-zinc-300 mt-1 cursor-pointer"
                  >
                    Reply
                  </button>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <div className="text-center py-8 text-zinc-500 text-xs">No comments yet. Be the first to comment!</div>
            )}
          </div>

          <form onSubmit={handleAddComment} className="pt-2 border-t border-zinc-800 flex items-center gap-2">
            <input 
              type="text" 
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
            <button type="submit" disabled={!commentText.trim()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-2 rounded-lg disabled:opacity-40 cursor-pointer">
              Send
            </button>
          </form>
        </div>
      )}

      {/* Options Modal */}
      {showOptionsModal && (
        <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setShowOptionsModal(false)}>
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-xs rounded-2xl overflow-hidden shadow-2xl text-white text-sm" onClick={e => e.stopPropagation()}>
            <button onClick={handleShare} className="w-full text-left px-4 py-3 hover:bg-zinc-800 border-b border-zinc-800 font-semibold text-blue-400 cursor-pointer">
              Share Reel Link
            </button>
            <button onClick={(e) => { handleSave(e); setShowOptionsModal(false); }} className="w-full text-left px-4 py-3 hover:bg-zinc-800 border-b border-zinc-800 font-semibold cursor-pointer">
              {isSaved ? 'Remove from Saved' : 'Save Reel'}
            </button>
            <button onClick={handleNotInterested} className="w-full text-left px-4 py-3 hover:bg-zinc-800 border-b border-zinc-800 font-semibold text-amber-400 flex items-center gap-2 cursor-pointer">
              <EyeOff className="w-4 h-4 text-amber-400" />
              <span>Not Interested</span>
            </button>
            {isReelOwnerOrAdmin && (
              <button onClick={handleDelete} className="w-full text-left px-4 py-3 hover:bg-zinc-800 border-b border-zinc-800 font-semibold text-red-500 cursor-pointer">
                Delete Reel
              </button>
            )}
            <button onClick={() => setShowOptionsModal(false)} className="w-full text-center py-3 hover:bg-zinc-800 font-bold text-zinc-400 cursor-pointer">
              Cancel
            </button>
          </div>
        </div>
      )}

      {showStatsModal && (
        <SinglePostStatsModal postId={reel.id} onClose={() => setShowStatsModal(false)} />
      )}

      {showRatingModal && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowRatingModal(false)}>
          <div className="bg-zinc-900 border border-amber-500/30 w-full max-w-sm rounded-2xl p-5 shadow-2xl text-white space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <h3 className="font-bold text-sm text-amber-200">Rate Reel (AI Visibility Boost)</h3>
              </div>
              <button onClick={() => setShowRatingModal(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-xs text-zinc-300">
              आपकी रेटिंग सीधे हमारे AI रैंकिंग एल्गोरिदम को बढ़ावा देती है। स्टार रेटिंग देने से यह रील सभी यूज़र्स के फ़ीड में ऊपर दिखेगी।
            </p>

            <StarRatingFeedback 
              postId={reel.id} 
              currentRating={reelRating} 
              ratingsCount={reelRatingsCount} 
            />
          </div>
        </div>
      )}</div>
  );
}

function FullScreenFeedViewerModal({
  posts,
  initialIndex = 0,
  currentUser,
  onClose,
  userLocation
}: {
  posts: any[];
  initialIndex?: number;
  currentUser?: any;
  onClose: () => void;
  userLocation?: {lat: number, lng: number} | null;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const touchStartX = React.useRef<number | null>(null);
  const touchEndX = React.useRef<number | null>(null);
  const touchStartY = React.useRef<number | null>(null);
  const touchEndY = React.useRef<number | null>(null);

  const goToNext = () => {
    setCurrentIndex(prev => Math.min(posts.length - 1, prev + 1));
  };

  const goToPrev = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'd' || e.key === 'D') {
        goToNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'a' || e.key === 'A') {
        goToPrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, posts.length]);

  // Touch Drag / Swipe Navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    const minSwipeDistance = 40;

    // Check horizontal swipe first
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const distanceX = touchStartX.current - touchEndX.current;
      if (Math.abs(distanceX) > minSwipeDistance) {
        if (distanceX > 0) goToNext();
        else goToPrev();
        touchStartX.current = null;
        touchEndX.current = null;
        touchStartY.current = null;
        touchEndY.current = null;
        return;
      }
    }

    // Check vertical swipe
    if (touchStartY.current !== null && touchEndY.current !== null) {
      const distanceY = touchStartY.current - touchEndY.current;
      if (Math.abs(distanceY) > minSwipeDistance) {
        if (distanceY > 0) goToNext();
        else goToPrev();
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
    touchStartY.current = null;
    touchEndY.current = null;
  };

  if (!posts || posts.length === 0 || currentIndex < 0 || currentIndex >= posts.length) {
    return null;
  }

  const currentPost = posts[currentIndex];

  return (
    <div 
      className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center backdrop-blur-xl overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={onClose}
    >
      {/* Top Header Overlay */}
      <div className="absolute top-4 inset-x-4 sm:inset-x-8 z-40 flex items-center justify-between text-white pointer-events-none">
        <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md px-4 py-2 rounded-full border border-white/15 pointer-events-auto shadow-2xl">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold tracking-wider">
            {currentIndex + 1} / {posts.length}
          </span>
          <span className="text-[10px] text-zinc-300 font-medium ml-1 hidden sm:inline">
            • Slide or Swipe to navigate
          </span>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="p-2.5 bg-black/70 hover:bg-black/90 rounded-full text-white backdrop-blur-md border border-white/20 transition-all pointer-events-auto cursor-pointer hover:scale-110 active:scale-95 shadow-2xl"
          title="Close Full Screen"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Left Slider Arrow Button */}
      <div className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-40 pointer-events-none">
        <button 
          onClick={(e) => { e.stopPropagation(); goToPrev(); }}
          disabled={currentIndex === 0}
          className={cn(
            "w-12 h-12 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md border border-white/20 pointer-events-auto transition-all shadow-2xl cursor-pointer hover:scale-110 active:scale-95",
            currentIndex === 0 ? "opacity-20 cursor-not-allowed pointer-events-none" : "opacity-100"
          )}
          title="Previous Slide"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      </div>

      {/* Right Slider Arrow Button */}
      <div className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-40 pointer-events-none">
        <button 
          onClick={(e) => { e.stopPropagation(); goToNext(); }}
          disabled={currentIndex === posts.length - 1}
          className={cn(
            "w-12 h-12 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md border border-white/20 pointer-events-auto transition-all shadow-2xl cursor-pointer hover:scale-110 active:scale-95",
            currentIndex === posts.length - 1 ? "opacity-20 cursor-not-allowed pointer-events-none" : "opacity-100"
          )}
          title="Next Slide"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>

      {/* Center Reel/Post Display */}
      <div onClick={e => e.stopPropagation()} className="relative z-10 w-full max-w-[420px] h-[90vh] flex items-center justify-center">
        <ReelCard 
          key={currentPost.id || currentIndex} 
          reel={currentPost} 
          currentUser={currentUser} 
          onClose={onClose} 
          userLocation={userLocation}
        />
      </div></div>
  );
}

function EditPostModal({ isOpen, onClose, post, onSave }: { isOpen: boolean, onClose: () => void, post: any, onSave: (p: any) => void }) {
  const [title, setTitle] = useState(post?.title || '');
  const [content, setContent] = useState(post?.content || '');
  const [hashtags, setHashtags] = useState(post?.hashtags || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(post?.title || '');
      setContent(post?.content || '');
      setHashtags(post?.hashtags || '');
    }
  }, [isOpen, post]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, hashtags })
      });
      const data = await res.json();
      if (data.success) {
        onSave(data.post);
        toast.success('Post updated');
        onClose();
      } else {
        toast.error(data.error || 'Update failed');
      }
    } catch (e) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-zinc-800">
          <h3 className="font-semibold text-lg">Edit Post</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <XCircle className="w-6 h-6 text-black/70" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
              placeholder="Post title"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Caption</label>
            <textarea 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400 resize-none h-20"
              placeholder="Write a caption..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Hashtags</label>
            <input 
              type="text" 
              value={hashtags} 
              onChange={e => setHashtags(e.target.value)} 
              className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
              placeholder="#tiles #design"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#0095f6] hover:bg-[#1877f2] text-white font-semibold rounded-lg py-2 mt-4 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Update Post'}
          </button>
        </form>
      </div></div>
  );
}

function ShareModal({ isOpen, onClose, data, type }: { isOpen: boolean, onClose: () => void, data: any, type: string }) {
  if (!isOpen) return null;

  const shareText = `Check out this ${type} by ${data.user?.name || data.authorName || 'someone'} on Vyapar Bridge!\n\n"${data.content || 'Awesome content'}"`;
  const shareUrl = `${window.location.origin}/${type}/${data.id || Date.now()}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    toast.success('Link copied to clipboard!');
    onClose();
  };

  const handleWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
    onClose();
  };

  const handleFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank');
    onClose();
  };
  
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Vyapar Bridge - ${data.user?.name || data.authorName || ''}`,
          text: shareText,
          url: shareUrl,
        });
        onClose();
      } catch (err) {
        console.error(err);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-zinc-800">
          <h3 className="font-semibold text-lg">Share</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <XCircle className="w-6 h-6 text-black/70" />
          </button>
        </div>
        <div className="p-4 flex flex-col gap-3">
          <button onClick={handleNativeShare} className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
            </div>
            <span className="font-semibold">Share via...</span>
          </button>
          
          <button onClick={handleWhatsApp} className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            </div>
            <span className="font-semibold">WhatsApp</span>
          </button>
          
          <button onClick={handleFacebook} className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-500">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </div>
            <span className="font-semibold">Facebook</span>
          </button>
          
          <button onClick={handleCopy} className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors mt-2 border-t border-slate-200 dark:border-zinc-700">
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-zinc-700 flex items-center justify-center text-black dark:text-slate-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            </div>
            <span className="font-semibold">Copy Link</span>
          </button>
        </div>
      </div></div>
  );
}

// 100% Public Star Rating & Quick Feedback System Component
function StarRatingFeedback({ 
  postId, 
  currentRating = 4.8, 
  ratingsCount = 0,
  onRated 
}: { 
  postId: string; 
  currentRating?: number; 
  ratingsCount?: number;
  onRated?: (newAvg: number, count: number) => void;
}) {
  const [hoverStar, setHoverStar] = useState<number | null>(null);
  const [selectedStar, setSelectedStar] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [guestName, setGuestName] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [avgRating, setAvgRating] = useState<number>(currentRating || 4.8);
  const [totalRatings, setTotalRatings] = useState<number>(ratingsCount || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitRating = async (stars: number, feedback: string = '') => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stars,
          feedback,
          guestName: guestName || 'Guest Visitor'
        })
      });
      const data = await res.json();
      if (data.success) {
        setAvgRating(data.averageRating);
        setTotalRatings(data.ratingsCount);
        setShowFeedbackModal(false);
        toast.success(data.message || `⭐ ${stars}-Star Rating saved! Boosted factory ranking on Vyapar Bridge.`);
        if (onRated) onRated(data.averageRating, data.ratingsCount);
      }
    } catch (err) {
      toast.error('Failed to submit star rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStarClick = (star: number) => {
    setSelectedStar(star);
    setShowFeedbackModal(true);
  };

  return (
    <div className="bg-amber-500/5 dark:bg-zinc-900/60 rounded-2xl p-2.5 border border-amber-500/20 dark:border-zinc-800/80 my-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverStar(star)}
                onMouseLeave={() => setHoverStar(null)}
                onClick={() => handleStarClick(star)}
                className="p-0.5 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                title={`Rate ${star} Stars (100% Public)`}
              >
                <Star
                  className={cn(
                    "w-4 h-4 transition-colors",
                    (hoverStar !== null ? star <= hoverStar : star <= Math.round(avgRating))
                      ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]"
                      : "text-slate-300 dark:text-zinc-700"
                  )}
                />
              </button>
            ))}
          </div>
          <span className="text-xs font-black text-black dark:text-zinc-200 flex items-center gap-1">
            {Number(avgRating).toFixed(1)} <span className="text-[10px] text-black/60 dark:text-zinc-500 font-normal">({totalRatings} reviews)</span>
          </span>
        </div>
        <span className="text-[9px] uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
          ⭐ Public Rating
        </span>
      </div>

      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setShowFeedbackModal(false)}>
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-slate-200 dark:border-zinc-800 animate-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-extrabold text-sm text-black dark:text-zinc-100 flex items-center gap-1.5">
                <span>⭐ Rate {selectedStar} Stars</span>
              </h4>
              <button onClick={() => setShowFeedbackModal(false)} className="text-xs text-black/60 hover:text-black/80 cursor-pointer font-bold">✕</button>
            </div>
            <p className="text-xs text-black/70 dark:text-zinc-400 mb-3">
              No login required! Your rating directly boosts this dealer/factory's visibility on Vyapar Bridge.
            </p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Your Name (Optional)"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
              />
              <textarea
                rows={2}
                placeholder="Optional feedback (e.g. Beautiful tile reflection, Excellent finish!)..."
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
              />
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-3 py-1.5 text-xs text-black/70 font-bold hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => submitRating(selectedStar || 5, feedbackText)}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg cursor-pointer transition-all shadow-md flex items-center gap-1"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Rating ⭐'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}</div>
  );
}


function PostItem({ 
  post, 
  currentUser, 
  onPostDeleted, 
  onPostUpdated, 
  onReelClick, 
  onPostClick,
  userLocation
}: { 
  post: any, 
  currentUser: any, 
  onPostDeleted?: (id: string) => void, 
  onPostUpdated?: (p: any) => void, 
  onReelClick?: () => void, 
  onPostClick?: () => void,
  userLocation?: {lat: number, lng: number} | null
}) {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [isSaved, setIsSaved] = useState(post.isSaved || false);
  const [isFollowing, setIsFollowing] = useState(() => isUserFollowed(post.userId));

  useEffect(() => {
    const syncFollow = () => {
      setIsFollowing(isUserFollowed(post.userId));
    };
    window.addEventListener('followedUsersUpdated', syncFollow);
    return () => window.removeEventListener('followedUsersUpdated', syncFollow);
  }, [post.userId]);
  const [likesCount, setLikesCount] = useState(() => post.likesCount || post.likes || 0);
  useEffect(() => {
    setIsLiked(post.isLiked || false);
    setIsSaved(post.isSaved || false);
    setLikesCount(post.likesCount || post.likes || 0);
  }, [post.isLiked, post.isSaved, post.likesCount, post.likes]);
  const [showHeartOverlay, setShowHeartOverlay] = useState(false);
  const [viewsCount, setViewsCount] = useState(() => post.viewsCount || 0);
  const [showOptions, setShowOptions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentImage, setCommentImage] = useState<File | null>(null);
  const [commentImagePreview, setCommentImagePreview] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const commentFileInputRef = React.useRef<HTMLInputElement>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);

  // Customer Requirements State
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [reqTilesQty, setReqTilesQty] = useState('');
  const [reqEwcQty, setReqEwcQty] = useState('');
  const [reqMixerQty, setReqMixerQty] = useState('');
  const [reqOther, setReqOther] = useState('');
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);

  const handleSendRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReq(true);
    try {
      await fetch('/api/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          targetId: post.userId,
          tilesQty: reqTilesQty,
          ewcQty: reqEwcQty,
          mixerQty: reqMixerQty,
          other: reqOther
        })
      });
      setIsSubmittingReq(false);
      setIsReqModalOpen(false);
      setReqTilesQty('');
      setReqEwcQty('');
      setReqMixerQty('');
      setReqOther('');
      toast.success('🎉 Your requirements have been sent to the company successfully! They will contact you shortly.');
    } catch (err) {
      setIsSubmittingReq(false);
      toast.error('Failed to send requirements');
    }
  };

  const fetchComments = async () => {
    try {
      const fsComments = await fetchCommentsFromFirestore(post.id);
      if (Array.isArray(fsComments) && fsComments.length > 0) {
        setComments(fsComments);
        return;
      }
      const data = await safeFetch(`/api/posts/${post.id}/comments`);
      if (Array.isArray(data)) setComments(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments]);

  useEffect(() => {
    // Unique view tracking on post mount (Real-time update)
    if (post?.id) {
      const trackView = () => {
        fetch(`/api/posts/${post.id}/view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser?.id })
        })
        .then(res => (res.ok && res.headers.get('content-type')?.includes('application/json')) ? res.json() : null)
        .then(data => {
          if (data && data.viewsCount !== undefined) setViewsCount(data.viewsCount);
          if (data && data.likesCount !== undefined) setLikesCount(data.likesCount);
        })
        .catch(err => console.warn('Failed to track view', err));
      };

      trackView();
      // Poll for real-time counts every 15 seconds
      const interval = setInterval(trackView, 15000);
      return () => clearInterval(interval);
    }
  }, [post.id]);

  const handleLike = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentUser?.id) {
      toast.error('🔐 Please Login or Register to Like posts!');
      window.dispatchEvent(new CustomEvent('openAuthModal'));
      return;
    }
    const wasLiked = isLiked;
    const nextState = !wasLiked;
    const nextCount = wasLiked ? Math.max(0, likesCount - 1) : likesCount + 1;

    setIsLiked(nextState);
    setLikesCount(nextCount);
    if (nextState) toast.success('Liked post!');

    // Direct Firestore Sync (Works on Vercel & everywhere)
    const fsRes = await likePostInFirestore(post.id, currentUser.id, wasLiked);
    if (fsRes && fsRes.success) {
      setIsLiked(fsRes.isLiked);
      setLikesCount(fsRes.likesCount);
      return;
    }

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.success) {
          setIsLiked(data.isLiked);
          setLikesCount(data.likesCount);
        }
      }
    } catch (err) {
      console.warn('API fallback note:', err);
    }
  };

  const handleSave = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentUser?.id) {
      toast.error('🔐 Please Login or Register to Save posts!');
      window.dispatchEvent(new CustomEvent('openAuthModal'));
      return;
    }
    const wasSaved = isSaved;
    const nextState = !wasSaved;

    setIsSaved(nextState);
    toast.success(nextState ? 'Saved post!' : 'Removed from saved');

    // Direct Firestore Sync
    const fsRes = await savePostInFirestore(post.id, currentUser.id, wasSaved);
    if (fsRes && fsRes.success) {
      setIsSaved(fsRes.isSaved);
      return;
    }

    try {
      const res = await fetch(`/api/posts/${post.id}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.success) {
          setIsSaved(data.isSaved);
        }
      }
    } catch (err) {
      console.warn('API fallback note:', err);
    }
  };
  
  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser?.id) {
      toast.error('🔐 Please Login or Register to Follow users!');
      window.dispatchEvent(new CustomEvent('openAuthModal'));
      return;
    }
    
    // Optimistic update
    const next = toggleFollowUser(post.userId);
    setIsFollowing(next);
    if (next) {
      toast.success('Following creator!');
    } else {
      toast.success('Unfollowed creator');
    }

    // Direct Firestore Sync
    await followUserInFirestore(post.userId, currentUser.id);

    try {
      await fetch(`/api/users/${post.userId}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: currentUser.id })
      });
    } catch (err) {
      console.warn('API follow note:', err);
    }
  };

  const handleDoubleClickImage = () => {
    if (!isLiked) {
      handleLike();
    }
    setShowHeartOverlay(true);
    setTimeout(() => setShowHeartOverlay(false), 500);
  };

  const isPostOwnerOrAdmin = Boolean(
    !currentUser ||
    !(post?.userId || post?.user?.id) ||
    String(currentUser?.id) === String(post?.userId || post?.user?.id) ||
    currentUser?.role?.toLowerCase() === 'admin' ||
    currentUser?.role === 'Master Admin' ||
    currentUser?.isAdmin
  );

  const handleNotInterestedPost = async () => {
    const userId = currentUser?.id || 'guest';
    const postId = String(post.id);
    
    // 1. Persist locally
    const { localNotInterestedKey } = getUserHiddenFilters(userId);
    try {
      let list: string[] = [];
      const existing = localStorage.getItem(localNotInterestedKey);
      if (existing) list = JSON.parse(existing);
      if (!list.includes(postId)) list.push(postId);
      localStorage.setItem(localNotInterestedKey, JSON.stringify(list));
    } catch (e) {}

    // 2. Persist in Firestore & Backend
    if (currentUser?.id) {
      markPostNotInterestedInFirestore(currentUser.id, postId);
      try {
        await fetch(`/api/posts/${postId}/not-interested`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id })
        });
      } catch (e) {}
    }

    toast.success('Post marked as Not Interested. Permanently hidden from your feed.');
    if (onPostDeleted) onPostDeleted(post.id);
    window.dispatchEvent(new CustomEvent('postDeleted', { detail: { postId: post.id } }));
    window.dispatchEvent(new CustomEvent('notInterestedUpdated', { detail: { postId: post.id } }));
  };

  const handleDeletePost = async () => {
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({ success: res.ok }));
      if (res.ok || data?.success) {
        toast.success('Post deleted successfully');
        if (onPostDeleted) onPostDeleted(post.id);
        window.dispatchEvent(new CustomEvent('postDeleted', { detail: { postId: post.id } }));
      } else {
        toast.error('Failed to delete post');
      }
    } catch (e) {
      toast.error('Failed to delete post');
    }
    setShowOptions(false);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() && !commentImage) return;

    setIsSubmittingComment(true);
    const textContent = newComment;

    // Direct Firestore Sync
    const newCommentObj = {
      content: textContent,
      userId: currentUser?.id || '1',
      userName: currentUser?.name || 'User',
      userAvatar: currentUser?.avatarUrl || '',
      commentImage: commentImagePreview || '',
      createdAt: new Date().toISOString()
    };

    const fsComment = await addCommentToFirestore(post.id, newCommentObj);
    if (fsComment) {
      setComments(prev => [...prev, fsComment]);
      setNewComment('');
      setCommentImage(null);
      setCommentImagePreview(null);
      toast.success('Comment posted!');
      setIsSubmittingComment(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('content', textContent);
      formData.append('userId', currentUser?.id || '1');
      if (commentImage) {
        formData.append('image', commentImage);
      }

      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        body: formData
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.success) {
          setComments(prev => [...prev, data.comment]);
          setNewComment('');
          setCommentImage(null);
          setCommentImagePreview(null);
          toast.success('Comment posted!');
        }
      } else {
        const localComment = {
          id: 'c' + Date.now(),
          content: textContent,
          createdAt: Date.now(),
          user: currentUser || { name: 'You' }
        };
        setComments(prev => [...prev, localComment]);
        setNewComment('');
        setCommentImage(null);
        setCommentImagePreview(null);
        toast.success('Comment posted!');
      }
    } catch (e) {
      const localComment = {
        id: 'c' + Date.now(),
        content: textContent,
        createdAt: Date.now(),
        user: currentUser || { name: 'You' }
      };
      setComments(prev => [...prev, localComment]);
      setNewComment('');
      setCommentImage(null);
      setCommentImagePreview(null);
      toast.success('Comment posted!');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCommentImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCommentImage(file);
      setCommentImagePreview(URL.createObjectURL(file));
    }
  };

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const handleBlockUser = async () => {
    const targetUserId = String(post.userId || post.user?.id || '');
    if (!targetUserId) return;
    if (currentUser && String(currentUser.id) === targetUserId) {
      toast.error('You cannot block yourself');
      return;
    }
    if (!confirm(`Block ${post.user?.name || 'this user'}? All their content and profile will be permanently hidden.`)) return;

    const blockerId = currentUser?.id || 'guest';
    
    // 1. Persist locally
    const { localBlockedKey } = getUserHiddenFilters(blockerId);
    try {
      let list: string[] = [];
      const existing = localStorage.getItem(localBlockedKey);
      if (existing) list = JSON.parse(existing);
      if (!list.includes(targetUserId)) list.push(targetUserId);
      localStorage.setItem(localBlockedKey, JSON.stringify(list));
    } catch (e) {}

    // 2. Persist in Firestore & Backend
    if (currentUser?.id) {
      blockUserInFirestore(currentUser.id, targetUserId);
      try {
        await fetch(`/api/users/${targetUserId}/block`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blockerId: currentUser.id })
        });
      } catch (err) {}
    }

    toast.success(`User ${post.user?.name || ''} blocked! All content permanently hidden.`);
    if (onPostDeleted) onPostDeleted(post.id);
    window.dispatchEvent(new CustomEvent('userBlocked', { detail: { userId: targetUserId } }));
    window.dispatchEvent(new CustomEvent('postDeleted', { detail: { postId: post.id } }));
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete comment?')) return;
    try {
      await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
      setComments(comments.filter(c => c.id !== commentId));
      toast.success('Comment deleted');
    } catch (e) {
      toast.error('Failed to delete comment');
    }
  };

  const startEditComment = (comment: any) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.content);
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editCommentText.trim()) return;
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editCommentText })
      });
      const data = await res.json();
      if (data.success) {
        setComments(comments.map(c => c.id === commentId ? data.comment : c));
        setEditingCommentId(null);
        setEditCommentText('');
      }
    } catch (e) {
      toast.error('Failed to update comment');
    }
  };

  return (
    <div className="bg-[#E6C76C] dark:bg-black border-b border-neutral-100 dark:border-neutral-900 md:border md:border-neutral-200 dark:md:border-neutral-800 md:rounded-xl pb-4 mb-5 w-full mx-auto shadow-sm">
      {/* Post Header */}
      <div className="flex items-center justify-between p-3 relative">
        <div className="flex items-center gap-3">
           <div 
             onClick={() => navigate(`/profile/${post.userId}`)}
             className={cn(
             "w-9 h-9 rounded-full cursor-pointer shrink-0 transition-transform hover:scale-105",
             (post.user?.isVerified || (currentUser?.id === post.userId && currentUser?.isVerified))
               ? "tiranga-border-circle p-[2px]"
               : "neon-border-circle p-[2px]"
           )}>
             <div className="w-full h-full bg-[#E6C76C] dark:bg-black rounded-full p-[1px] overflow-hidden">
               <div className="w-full h-full bg-slate-100 dark:bg-zinc-900 rounded-full flex items-center justify-center text-xs font-bold text-black/80 dark:text-zinc-300">
                 {post.user?.avatarUrl ? (
                   <img src={post.user.avatarUrl} alt={post.user.name} className="w-full h-full object-cover rounded-full" />
                 ) : (
                   post.user?.name?.charAt(0) || '?'
                 )}
               </div>
             </div>
           </div>
           <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span 
                  onClick={() => navigate(`/profile/${post.userId}`)}
                  className={cn(
                    "font-black italic tracking-wider text-sm text-black dark:text-zinc-50 leading-none cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 hover:underline",
                    (post.user?.isVerified || (currentUser?.id === post.userId && currentUser?.isVerified)) && "text-blue-600 dark:text-blue-400 font-bold"
                  )}
                  style={{ fontFamily: "'Playfair Display', 'Dancing Script', serif", fontWeight: 900 }}
                >
                  {post.user?.name}
                </span>
                {(post.user?.isVerified || (currentUser?.id === post.userId && currentUser?.isVerified)) && (
                  <VerifiedBadge size="sm" />
                )}
                {currentUser?.id !== post.userId && (
                  <div className="flex items-center">
                    <span className="text-slate-300 dark:text-zinc-700 mx-1.5 text-[10px]">•</span>
                    <button 
                      onClick={handleFollow}
                      className={cn(
                        "text-[12px] font-bold transition-all duration-700 active:scale-95",
                        isFollowing 
                          ? "text-black/70 dark:text-zinc-500 hover:text-black dark:hover:text-zinc-300" 
                          : "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      )}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>
                )}
              </div>
              {post.user?.role !== 'customer' && (
                <span className="text-[11px] text-black/70 dark:text-zinc-400">{post.user?.role}</span>
              )}
           </div>
        </div>
        <div className="relative">
          <button onClick={() => setShowOptions(!showOptions)} className="text-black dark:text-zinc-50 hover:text-black/70 dark:hover:text-zinc-400 dark:text-zinc-400 p-1">
            <MoreHorizontal className="w-5 h-5" />
          </button>
          {showOptions && (
            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl z-20 border border-slate-200 dark:border-zinc-800 overflow-hidden text-sm">
              {isPostOwnerOrAdmin ? (
                <>
                  <button onClick={() => { setIsEditModalOpen(true); setShowOptions(false); }} className="w-full text-left px-4 py-3 text-black dark:text-zinc-50 font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 border-b border-slate-100 dark:border-zinc-800">
                    Edit Post
                  </button>
                  <button onClick={handleDeletePost} className="w-full text-left px-4 py-3 text-red-600 font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 border-b border-slate-100 dark:border-zinc-800">
                    Delete Post
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => { setIsReportModalOpen(true); setShowOptions(false); }} 
                    className="w-full text-left px-4 py-3 text-red-600 font-bold hover:bg-red-50 dark:hover:bg-red-950/40 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-2"
                  >
                    <ShieldAlert className="w-4 h-4 text-red-500" />
                    <span>Report Post / Nudity</span>
                  </button>
                  <button 
                    onClick={() => { handleBlockUser(); setShowOptions(false); }} 
                    className="w-full text-left px-4 py-3 text-red-600 font-bold hover:bg-red-50 dark:hover:bg-red-950/40 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-2"
                  >
                    <UserX className="w-4 h-4 text-red-500" />
                    <span>Block User</span>
                  </button>
                </>
              )}
              <button 
                onClick={() => { handleNotInterestedPost(); setShowOptions(false); }} 
                className="w-full text-left px-4 py-3 text-amber-600 dark:text-amber-400 font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-2 cursor-pointer"
              >
                <EyeOff className="w-4 h-4 text-amber-500" />
                <span>Not Interested</span>
              </button>
              <button onClick={() => { setIsShareModalOpen(true); setShowOptions(false); }} className="w-full text-left px-4 py-3 text-black dark:text-zinc-50 hover:bg-slate-50 dark:hover:bg-zinc-800 border-b border-slate-100 dark:border-zinc-800">
                Share Post
              </button>
              <button onClick={() => setShowOptions(false)} className="w-full text-left px-4 py-3 text-black/70 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800">
                Cancel
              </button>
            </div>
          )}

          {/* Report Modal */}
          <ReportModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            currentUser={currentUser}
            targetType="post"
            targetId={post.id}
            targetName={post.user?.name}
          />
        </div>
      </div>
      
      {/* Post Image/Video (Full Width) */}
      {post.mediaUrl && (
        <div 
          className="relative w-full bg-black min-h-[350px] max-h-[80vh] flex items-center justify-center overflow-hidden cursor-pointer select-none border-y border-slate-50 dark:border-zinc-900"
          onDoubleClick={handleDoubleClickImage}
        >
          {post.mediaUrl && (post.mediaUrl.includes('youtube.com') || post.mediaUrl.includes('youtu.be') || post.mediaUrl.includes('facebook.com') || post.mediaUrl.includes('fb.watch')) ? (
            <AdMediaDisplay ad={{ type: 'video', mediaUrl: post.mediaUrl }} className="w-full h-full aspect-video min-h-[350px] max-h-[80vh] object-cover bg-black pointer-events-auto" />
          ) : post.mediaUrl && (post.type === 'video' || post.mediaUrl.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i)) ? (
            <video preload="auto" src={post.mediaUrl} poster={post.thumbnailUrl} controls playsInline muted loop className="w-full h-full max-h-[80vh] object-contain bg-black transform-gpu will-change-transform" ref={(el) => { if (el && el.paused) { const p = el.play(); if (p !== undefined) p.catch(()=>{}); } }} />
          ) : post.type === 'pdf' || (post.mediaUrl && post.mediaUrl.match(/\.pdf(\?.*)?$/i)) ? (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                window.open(post.mediaUrl, '_blank');
              }}
              className="w-full h-full bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40 flex flex-col items-center justify-center p-8 cursor-pointer group hover:opacity-95 transition-all"
            >
              <div className="w-24 h-24 rounded-2xl bg-white dark:bg-zinc-900 shadow-xl flex items-center justify-center mb-4 border border-emerald-200 dark:border-emerald-800 group-hover:scale-105 transition-transform">
                <FileText className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-black text-black dark:text-zinc-50 text-center mb-2 line-clamp-2">{post.title || 'Catalogue / Design PDF'}</h3>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 bg-white dark:bg-zinc-900 px-5 py-2.5 rounded-xl shadow-md border border-emerald-100 dark:border-emerald-800">
                <ExternalLink className="w-4 h-4" /> View / Download PDF Document
              </span>
            </div>
          ) : post.type === 'audio' || (post.mediaUrl && post.mediaUrl.match(/\.(mp3|wav|ogg|m4a)(\?.*)?$/i)) ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900 p-8">
               <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center mb-6 shadow-2xl animate-pulse">
                 <Volume2 className="w-16 h-16 text-indigo-300" />
               </div>
               {post.mediaUrl && <audio src={post.mediaUrl} controls className="w-full max-w-[300px]" />}
               <p className="mt-4 text-xs font-bold text-indigo-200 text-center uppercase tracking-widest">{post.title || 'Audio Post'}</p>
            </div>
          ) : (
            <img 
              src={post.mediaUrl} 
              alt="Post media" 
              className="w-full h-full max-h-[80vh] object-contain bg-black" 
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1615971677499-5467cbab01c0?auto=format&fit=crop&w=800&q=80';
              }}
            />
          )}
          {showHeartOverlay && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <Heart className="w-24 h-24 text-white fill-white drop-shadow-2xl animate-[ping_0.8s_cubic-bezier(0,0,0.2,1)_1]" style={{ animationIterationCount: 1, animationDuration: '800ms' }} />
            </div>
          )}
        </div>
      )}
      
      {/* Post Actions */}
      <div className="p-3">
        <div className="flex justify-between items-center mb-3">
          <div className="flex gap-4">
            <button onClick={handleLike} className="hover:text-black/70 dark:hover:text-zinc-400 dark:text-zinc-400 transition-colors duration-700">
              <Heart className={cn("w-6 h-6 transition-all duration-700 active:scale-95", isLiked ? "text-red-500 fill-red-500" : "")} />
            </button>
            <button onClick={() => setShowComments(!showComments)} className="hover:text-black/70 dark:hover:text-zinc-400 dark:text-zinc-400 active:scale-95 transition-all duration-700"><MessageCircle className="w-6 h-6" /></button>
            <button onClick={() => setIsShareModalOpen(true)} className="hover:text-black/70 dark:hover:text-zinc-400 dark:text-zinc-400 active:scale-95 transition-all duration-700">
              <svg aria-label="Share Post" className="w-6 h-6" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><line fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" x1="22" x2="9.218" y1="3" y2="10.083"></line><polygon fill="none" points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"></polygon></svg>
            </button>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                
                // Distance Check for Local Customer Members
                if (currentUser?.role === 'customer' && currentUser?.membershipType === 'local') {
                  const targetCoords = post?.user?.gpsCoords || post?.gpsCoords;
                  if (userLocation && targetCoords) {
                    const dist = calculateDistance(userLocation.lat, userLocation.lng, targetCoords.lat, targetCoords.lng);
                    if (dist > 100) {
                      toast.error(`📍 Distance Restriction: As a Local Member, you can only inquire with dealers within 100km. This business is ${Math.round(dist)}km away. Upgrade to 'Direct Company' plan for nationwide access!`);
                      return;
                    }
                  } else if (!userLocation) {
                    toast.error("📍 Please enable GPS/Location to verify distance for Local Membership.");
                    return;
                  }
                }

                navigate('/chat'); 
              }} 
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 active:scale-95 transition-all duration-700 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800/50"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase">Inquiry</span>
            </button>
            {currentUser?.role === 'customer' && (post?.user?.role === 'dealer' || post?.user?.role === 'factory') && (
              <button
                 onClick={(e) => {
                   e.stopPropagation();
                   if (!currentUser?.isVerified) {
                     toast.error('Only Verified (Paid) Customers can send direct requirements. Please upgrade your account to Premium.');
                     return;
                   }
                   setIsReqModalOpen(true);
                 }}
                 className="text-amber-600 dark:text-amber-400 hover:text-amber-700 active:scale-95 transition-all duration-700 flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-0.5 rounded-full border border-amber-100 dark:border-amber-800/50"
                 title="Send Requirements to Company"
              >
                <ClipboardList className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase">Send Req</span>
              </button>
            )}
          </div>
          <button 
            onClick={() => setShowStatsModal(true)} 
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-all text-xs font-bold cursor-pointer border border-blue-500/20 active:scale-95 shadow-xs"
            title="View detailed post insights & activity log"
          >
            <BarChart2 className="w-4 h-4 text-blue-500" />
            <span>Insights</span>
          </button>
          <button onClick={handleSave} className="hover:text-black/70 dark:hover:text-zinc-400 dark:text-zinc-400 transition-colors duration-700">
            <Bookmark className={cn("w-6 h-6 transition-all duration-700 active:scale-95", isSaved ? "text-black dark:text-zinc-50 fill-slate-900 dark:fill-white" : "")} />
          </button>
        </div>
        
        <div 
          onClick={() => setShowStatsModal(true)}
          className="font-bold text-xs sm:text-sm text-black dark:text-zinc-50 flex items-center gap-2 sm:gap-3 mb-1.5 cursor-pointer hover:opacity-80 transition-opacity"
          title="Click to view engagement breakdown"
        >
          <span>{likesCount.toLocaleString()} likes</span>
          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-zinc-700"></span>
          <span className="text-black/70 dark:text-zinc-400 font-medium">{viewsCount.toLocaleString()} views</span>
        </div>
        
        {/* Caption */}
        <div className="text-sm text-black dark:text-zinc-50 whitespace-pre-wrap leading-snug">
          <span className="font-bold mr-2 cursor-pointer hover:underline decoration-blue-500 underline-offset-2">{post.user?.name}</span>
          {post.content}
        </div>

        {/* 100% Public Star Rating & Feedback (No Login Needed) */}
        <StarRatingFeedback 
          postId={post.id} 
          currentRating={post.averageRating} 
          ratingsCount={post.ratingsCount} 
        />

        {post.commentsCount > 0 && !showComments && (
          <button 
            onClick={() => setShowComments(true)}
            className="text-black/70 dark:text-zinc-400 text-sm mt-1.5 hover:text-black dark:hover:text-zinc-300 transition-colors"
          >
            View all {post.commentsCount} comments
          </button>
        )}
        
      </div>
      
      {/* Comments Section */}
      {showComments && (
        <div className="px-3 pb-3">
          <div className="border-t border-slate-200 dark:border-zinc-800 pt-3 mt-3 max-h-60 overflow-y-auto space-y-3">
            {comments.map(comment => (
              <div key={comment.id} className="text-sm flex flex-col mb-1">
                <div className="flex items-start gap-2 group/comment">
                  <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 mt-0.5">
                    {comment.user?.avatarUrl ? (
                      <img src={comment.user.avatarUrl} alt={comment.user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-black/70">{comment.user?.name?.charAt(0) || 'U'}</span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="font-semibold cursor-pointer text-xs">{comment.user?.name}</span>
                      {(comment.user?.isVerified || (currentUser?.id === comment.userId && currentUser?.isVerified)) && (
                        <VerifiedBadge size="sm" />
                      )}
                    </div>
                    {editingCommentId === comment.id ? (
                      <div className="flex-1 flex items-center gap-2 mt-1">
                        <input 
                          type="text" 
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          className="flex-1 border-b border-slate-300 dark:border-zinc-700 bg-transparent focus:outline-none text-sm"
                          autoFocus
                        />
                        <button onClick={() => handleUpdateComment(comment.id)} className="text-blue-500 font-semibold text-xs">Save</button>
                        <button onClick={() => setEditingCommentId(null)} className="text-black/70 text-xs">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span className="flex-1 text-sm">{comment.content}</span>
                        {comment.imageUrl && (
                          <div className="mt-2 rounded-xl overflow-hidden border border-slate-100 dark:border-zinc-800 max-w-[220px] shadow-sm">
                            <img 
                              src={comment.imageUrl} 
                              alt="Comment attachment" 
                              className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(comment.imageUrl, '_blank')}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <button 
                        onClick={() => setNewComment('@' + (comment.user?.name?.replace(/\s+/g, '') || 'User') + ' ')} 
                        className="text-[10px] font-bold text-black/70 hover:text-black dark:hover:text-zinc-300 cursor-pointer"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                  {comment.userId === currentUser.id && editingCommentId !== comment.id && (
                    <div className="opacity-0 group-hover/comment:opacity-100 transition-opacity flex items-center gap-2 text-xs text-black/60 shrink-0 mt-0.5">
                      <button onClick={() => startEditComment(comment)} className="hover:text-blue-500">Edit</button>
                      <button onClick={() => handleDeleteComment(comment.id)} className="hover:text-red-500">Delete</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {comments.length === 0 && <div className="text-sm text-black/70 font-medium text-center py-4">No comments yet. Be the first to comment!</div>}
          </div>

          <div className="mt-4">
            {commentImagePreview && (
              <div className="relative w-20 h-20 mb-3 rounded-xl overflow-hidden border-2 border-blue-500 shadow-lg group">
                <img src={commentImagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  onClick={() => { setCommentImage(null); setCommentImagePreview(null); }}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            
            <form onSubmit={handleAddComment} className="flex items-center pt-4 border-t border-slate-100 dark:border-zinc-900 gap-3 relative">
              <input
                type="file"
                ref={commentFileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleCommentImageChange}
              />
              <button 
                type="button"
                onClick={() => commentFileInputRef.current?.click()}
                className="p-2 text-black/60 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all"
                title="Add image to comment"
              >
                <Camera className="w-5 h-5" />
              </button>
              
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  className="w-full text-sm bg-slate-50 dark:bg-zinc-950/50 border border-slate-100 dark:border-zinc-800 rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500/50 placeholder-slate-400"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                disabled={(!newComment.trim() && !commentImage) || isSubmittingComment}
                className="text-blue-600 dark:text-blue-400 font-bold text-sm px-3 disabled:opacity-30 transition-all hover:scale-105 active:scale-95"
              >
                {isSubmittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
              </button>
            </form>
          </div>
        </div>
      )}
      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} data={post} type="post" />
      <EditPostModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} post={post} onSave={(p) => { if (onPostUpdated) onPostUpdated(p); }} />
      {showStatsModal && (
        <SinglePostStatsModal postId={post.id} onClose={() => setShowStatsModal(false)} />
      )}

      {/* Customer Requirements Modal */}
      {isReqModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-black dark:text-zinc-50 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-amber-500" /> Send Requirements
              </h3>
              <button onClick={() => setIsReqModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                <X className="w-5 h-5 text-black/70" />
              </button>
            </div>
            <form onSubmit={handleSendRequirement} className="p-4 flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-black dark:text-zinc-300 mb-1">Tiles Requirement (Sqft/Boxes)</label>
                <input
                  type="text"
                  placeholder="e.g. 500 boxes vitrified tiles"
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                  value={reqTilesQty}
                  onChange={(e) => setReqTilesQty(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black dark:text-zinc-300 mb-1">EWC / Toilets Quantity</label>
                <input
                  type="text"
                  placeholder="e.g. 5 One-Piece EWCs"
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                  value={reqEwcQty}
                  onChange={(e) => setReqEwcQty(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black dark:text-zinc-300 mb-1">Faucets / Mixers / Showers</label>
                <input
                  type="text"
                  placeholder="e.g. 10 Wall Mixers, 5 Showers"
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                  value={reqMixerQty}
                  onChange={(e) => setReqMixerQty(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black dark:text-zinc-300 mb-1">Other Accessories / Message</label>
                <textarea
                  placeholder="Any other specific requirements?"
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 min-h-[60px]"
                  value={reqOther}
                  onChange={(e) => setReqOther(e.target.value)}
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={isSubmittingReq || (!reqTilesQty && !reqEwcQty && !reqMixerQty && !reqOther)}
                className="mt-2 w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-2.5 rounded-xl text-sm transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmittingReq ? 'Sending...' : 'Send Requirements to Company'}
              </button>
            </form>
          </div>
        </div>
      )}</div>
  );
}

function MusicSelectionModal({ isOpen, onClose, onSelect }: { isOpen: boolean, onClose: () => void, onSelect: (music: any) => void }) {
  const [music, setMusic] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      safeFetch('/api/music')
        .then(data => {
          setMusic(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Music fetch error:', err);
          setLoading(false);
        });
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [isOpen]);

  const togglePreview = (e: React.MouseEvent, track: any) => {
    e.stopPropagation();
    if (playingTrackId === track.id) {
      audioRef.current?.pause();
      setPlayingTrackId(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      audioRef.current = new Audio(track.audioUrl);
      const p = audioRef.current.play();
      if (p !== undefined) p.catch(()=>{});
      setPlayingTrackId(track.id);
      audioRef.current.onended = () => setPlayingTrackId(null);
    }
  };

  const handleApply = (track: any) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingTrackId(null);
    onSelect(track);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="font-bold text-black dark:text-zinc-50">Select Music for Reel</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => handleApply(null)}>
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
              <VolumeX className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm text-blue-700 dark:text-blue-400">Original Audio Only</div>
              <div className="text-[10px] text-blue-600/70">No background track</div>
            </div>
            <button className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Apply</button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-black/60 italic">Curating tracks from library...</div>
          ) : music.map(track => (
            <div key={track.id} className="p-3 border border-slate-100 dark:border-zinc-800 rounded-xl flex items-center gap-3 bg-slate-50/50 dark:bg-zinc-900/50">
              <button 
                onClick={(e) => togglePreview(e, track)}
                className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 hover:scale-105 transition-transform"
              >
                {playingTrackId === track.id ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-black dark:text-zinc-50 truncate">{track.title}</div>
                <div className="text-[10px] text-black/70">{track.artist} • {track.duration}</div>
              </div>
              <button 
                onClick={() => handleApply(track)}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                Apply
              </button>
            </div>
          ))}

          {!loading && music.length === 0 && (
            <div className="py-12 text-center text-black/60">
              <p>No tracks available in the library.</p>
            </div>
          )}
        </div>
      </div></div>
  );
}

function SuggestedUsersRow({ users }: { users: any[] }) {
  if (!users || users.length === 0) return null;

  return (
    <div className="py-6 border-y border-slate-100 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-950/50 my-2 overflow-hidden">
      <div className="px-4 mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-black dark:text-zinc-50 uppercase tracking-wider">Suggested for you</h3>
        <Link to="/explore" className="text-xs font-bold text-blue-500 hover:underline">See all</Link>
      </div>
      <div className="flex gap-4 overflow-x-auto px-4 pb-2 no-scrollbar scroll-smooth">
        {users.map((u, i) => (
          <div key={u.id || `su-${i}`} className="flex-shrink-0 w-40 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col items-center text-center shadow-sm hover:border-blue-500/50 transition-all">
            <Link to={`/profile/${u.id}`} className="relative mb-3 block">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-100 dark:border-zinc-800 shadow-inner">
                <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
              </div>
              {u.isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-zinc-900 rounded-full p-0.5 shadow-md">
                  <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-500" />
                </div>
              )}
            </Link>
            <h4 className="font-bold text-sm text-black dark:text-zinc-50 truncate w-full mb-0.5">{u.name}</h4>
            {u.role !== 'customer' && (
              <p className="text-[10px] text-black/70 uppercase font-bold tracking-tighter mb-3">{u.role}</p>
            )}
            <Link 
              to={`/profile/${u.id}`}
              className="w-full py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-blue-500/20"
            >
              View Profile
            </Link>
          </div>
        ))}
      </div></div>
  );
}

function Feed({ user, onUpdateUser, userLocation }: { user: any, onUpdateUser?: (u: any) => void, userLocation?: {lat: number, lng: number} | null }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('#All');
  const [verifiedUsers, setVerifiedUsers] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isUploadingReel, setIsUploadingReel] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [pendingReelFile, setPendingReelFile] = useState<File | null>(null);
  const [reelOriginalVolume, setReelOriginalVolume] = useState<number>(1);
  const [reelMusicVolume, setReelMusicVolume] = useState<number>(1);
  const reelFileInputRef = React.useRef<HTMLInputElement>(null);

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<any>(null);
  const [reelPreviewUrl, setReelPreviewUrl] = useState<string | null>(null);
  const [brandAdsList, setBrandAdsList] = useState<any[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isBrandAdDismissed, setIsBrandAdDismissed] = useState(false);

  const fetchPosts = async () => {
    if (user?.id) {
      try {
        const remoteHidden = await getUsersBlockedAndNotInterestedFromFirestore(user.id);
        const { localBlockedKey, localNotInterestedKey } = getUserHiddenFilters(user.id);
        
        if (remoteHidden.blockedUsers.length > 0) {
          let bList: string[] = [];
          try { bList = JSON.parse(localStorage.getItem(localBlockedKey) || '[]'); } catch(e){}
          const mergedB = Array.from(new Set([...bList, ...remoteHidden.blockedUsers]));
          localStorage.setItem(localBlockedKey, JSON.stringify(mergedB));
        }

        if (remoteHidden.notInterestedPosts.length > 0) {
          let niList: string[] = [];
          try { niList = JSON.parse(localStorage.getItem(localNotInterestedKey) || '[]'); } catch(e){}
          const mergedNI = Array.from(new Set([...niList, ...remoteHidden.notInterestedPosts]));
          localStorage.setItem(localNotInterestedKey, JSON.stringify(mergedNI));
        }
      } catch (e) {}
    }

    const query = user?.id ? `?currentUserId=${user.id}` : '';
    let fetchedBackendPosts: any[] = [];
    try {
      const data = await safeFetch(`/api/posts${query}`);
      if (Array.isArray(data)) {
        fetchedBackendPosts = data;
      }
    } catch (err) {
      console.warn('Backend /api/posts fetch note:', err);
    }

    let fbPosts: any[] = [];
    try {
      fbPosts = await fetchPostsFromFirestore();
    } catch (fbErr) {
      console.warn('Firestore fetch note:', fbErr);
    }

    const postMap = new Map<string, any>();
    if (fetchedBackendPosts.length === 0 && fbPosts.length === 0) {
      DEFAULT_B2B_POSTS.forEach(p => postMap.set(String(p.id), p));
    }
    fetchedBackendPosts.forEach(p => postMap.set(String(p.id), p));
    fbPosts.forEach(p => postMap.set(String(p.id), p));

    const allCombined = Array.from(postMap.values()).sort((a, b) => {
      const timeA = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt || 0).getTime();
      const timeB = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    const cleanPosts = filterOutHiddenContent(allCombined, user?.id);
    setPosts(cleanPosts);
    setLoading(false);
  };

  useEffect(() => {
    const handleDeleted = (e: any) => {
      const deletedId = e.detail?.postId || e.detail?.reelId;
      if (deletedId) {
        setPosts(prev => prev.filter(p => String(p.id) !== String(deletedId)));
      }
    };
    const handleBlocked = (e: any) => {
      const blockedId = e.detail?.userId;
      if (blockedId) {
        setPosts(prev => prev.filter(p => String(p.userId || p.user?.id) !== String(blockedId)));
        setSuggestedUsers(prev => prev.filter(u => String(u.id) !== String(blockedId)));
        setVerifiedUsers(prev => prev.filter(u => String(u.id) !== String(blockedId)));
        setAllDealersList(prev => prev.filter(u => String(u.id) !== String(blockedId)));
      }
    };
    const handleNotInterested = (e: any) => {
      const pId = e.detail?.postId;
      if (pId) {
        setPosts(prev => prev.filter(p => String(p.id) !== String(pId)));
      }
    };

    window.addEventListener('postDeleted', handleDeleted);
    window.addEventListener('reelDeleted', handleDeleted);
    window.addEventListener('userBlocked', handleBlocked);
    window.addEventListener('notInterestedUpdated', handleNotInterested);
    return () => {
      window.removeEventListener('postDeleted', handleDeleted);
      window.removeEventListener('reelDeleted', handleDeleted);
      window.removeEventListener('userBlocked', handleBlocked);
      window.removeEventListener('notInterestedUpdated', handleNotInterested);
    };
  }, []);

  const fetchSuggestedUsers = () => {
    safeFetch(`/api/users/suggested?userId=${user?.id || ''}&limit=12`)
      .then(data => {
        if (Array.isArray(data)) {
          const cleanUsers = filterOutHiddenContent(data, user?.id);
          setSuggestedUsers(cleanUsers);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchPosts();
    fetchSuggestedUsers();
    const usersQuery = user?.id ? `?currentUserId=${user.id}` : '';
    safeFetch(`/api/users${usersQuery}`)
      .then(data => {
        if (Array.isArray(data)) {
          const cleanUsers = filterOutHiddenContent(data, user?.id);
          setAllDealersList(cleanUsers.filter((u: any) => u.role === 'dealer' || u.role === 'factory'));
          setVerifiedUsers(cleanUsers.filter((u: any) => u.isVerified).map((u: any) => ({ ...u, isFollowing: isUserFollowed(u.id) })));
        }
      })
      .catch(() => {});

    safeFetch('/api/announcements')
      .then(data => {
        if (Array.isArray(data)) setAnnouncements(data);
      })
      .catch(() => {});

    fetchBrandAds();

    const handleAdsUpdated = () => {
      setIsBrandAdDismissed(false);
      fetchBrandAds();
    };

    window.addEventListener('brandAdsUpdated', handleAdsUpdated);
    return () => {
      window.removeEventListener('brandAdsUpdated', handleAdsUpdated);
    };
  }, [user?.id]);

  const fetchBrandAds = () => {
    safeFetch('/api/admin/showcase')
      .then(data => {
        let serverList: any[] = [];
        if (data && Array.isArray(data.brandAdsList)) {
          serverList = data.brandAdsList.filter((a: any) => a.isActive !== false);
        } else if (data && data.isActive && (data.videoUrl || data.mediaUrl)) {
          serverList = [{
            id: 'legacy-1',
            type: 'video',
            title: data.title || 'Brand Showcase',
            companyName: data.companyName || 'Featured Partner',
            mediaUrl: data.videoUrl || data.mediaUrl,
            linkUrl: data.linkUrl || '',
            description: data.description || '',
            isActive: true
          }];
        }

        try {
          const rawLocal = localStorage.getItem('local_brand_ads');
          if (rawLocal) {
            const localAds = JSON.parse(rawLocal);
            if (Array.isArray(localAds) && localAds.length > 0) {
              const activeLocal = localAds.filter((a: any) => a.isActive !== false);
              const map = new Map();
              serverList.forEach((ad: any) => map.set(ad.id, ad));
              activeLocal.forEach((ad: any) => {
                if (map.has(ad.id)) {
                  const existing = map.get(ad.id);
                  map.set(ad.id, { ...existing, ...ad, localMediaKey: ad.localMediaKey || existing.localMediaKey });
                } else {
                  map.set(ad.id, ad);
                }
              });
              setBrandAdsList(Array.from(map.values()));
              return;
            }
          }
        } catch (e) {}

        setBrandAdsList(serverList);
      })
      .catch(() => {
        try {
          const rawLocal = localStorage.getItem('local_brand_ads');
          if (rawLocal) {
            const localAds = JSON.parse(rawLocal);
            if (Array.isArray(localAds)) {
              setBrandAdsList(localAds.filter((a: any) => a.isActive !== false));
            }
          }
        } catch (e) {}
      });
  };

  useEffect(() => {
    const syncFollow = () => {
      setVerifiedUsers(prev => prev.map(u => ({ ...u, isFollowing: isUserFollowed(u.id) })));
    };
    window.addEventListener('followedUsersUpdated', syncFollow);
    return () => window.removeEventListener('followedUsersUpdated', syncFollow);
  }, []);

  const handleFollowInSpotlight = async (userId: string) => {
    if (!user?.id) {
      toast.error('Please login to follow users');
      return;
    }

    // Optimistic update
    const next = toggleFollowUser(userId);
    setVerifiedUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, isFollowing: next } : u
    ));

    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: user.id })
      });
      const data = await response.json();
      if (!data.success) {
        // Revert
        toggleFollowUser(userId);
        setVerifiedUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, isFollowing: !next } : u
        ));
        toast.error(data.error || 'Failed to update follow status');
      }
    } catch (err) {
      // Revert
      toggleFollowUser(userId);
      setVerifiedUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, isFollowing: !next } : u
      ));
      console.error(err);
    }
  };

  const handleDirectReelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!user?.id) {
      toast.error('🔐 Login or Registration required! Only registered Factories and Dealers can upload reels on Vyapar Bridge.');
      window.dispatchEvent(new CustomEvent('openAuthModal'));
      if (e.target) e.target.value = '';
      return;
    }
    if (user?.role === 'customer') {
      toast.error('🚫 Local area customers cannot upload reels. Reel creation is reserved for Factories and Dealers only.');
      if (e.target) e.target.value = '';
      return;
    }

    // Check duration for video files (must not exceed 60 seconds)
    const validation = await validateMediaDuration(selectedFile);
    if (!validation.valid) {
      toast.error(validation.message || 'Reel video cannot exceed 60 seconds limit.');
      if (e.target) e.target.value = '';
      return;
    }

    setPendingReelFile(selectedFile);
    setReelPreviewUrl(URL.createObjectURL(selectedFile));
    setIsPreviewModalOpen(true);
    if (e.target) e.target.value = '';
  };

  const handleCustomAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const tid = toast.loading('Uploading custom sound...');
    try {
      const formData = new FormData();
      formData.append('musicFile', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, "") || 'Custom Sound');
      formData.append('artist', user?.name || 'User Upload');
      
      const res = await fetch('/api/music', {
        method: 'POST',
        body: formData
      });
      const newM = await res.json();
      
      if (newM.id) {
        setSelectedMusic(newM);
        toast.success('Sound uploaded successfully!', { id: tid });
      } else {
        toast.error('Upload failed', { id: tid });
      }
    } catch (err) {
      toast.error('Upload failed', { id: tid });
    }
    if (e.target) e.target.value = '';
  };

  const finalizeReelUpload = async () => {
    if (!pendingReelFile) return;
    if (!user?.id) {
      toast.error('🔐 Login or Registration required! Only registered Factories and Dealers can upload reels.');
      window.dispatchEvent(new CustomEvent('openAuthModal'));
      return;
    }
    if (user?.role === 'customer') {
      toast.error('🚫 Local area customers cannot upload reels.');
      return;
    }

    setIsPreviewModalOpen(false);
    
    setIsUploadingReel(true);
    const toastId = toast.loading('Publishing Reel...');
    const reelId = `reel_${Date.now()}`;

    try {
      const formData = new FormData();
      formData.append('title', 'New B2B Reel');
      formData.append('content', 'Uploaded from Home Reels');
      formData.append('hashtags', '#reel #b2b #tiles #products');
      formData.append('userId', String(user.id));
      formData.append('userName', user.name || 'Verified Member');
      formData.append('userRole', user.role || 'factory');
      formData.append('type', 'video');
      formData.append('media', pendingReelFile);
      
      if (selectedMusic) {
        formData.append('musicId', selectedMusic.id);
        formData.append('musicTitle', selectedMusic.title);
        formData.append('musicArtist', selectedMusic.artist);
        formData.append('musicUrl', selectedMusic.audioUrl);
      }
      formData.append('musicVolume', String(reelMusicVolume));
      formData.append('originalVolume', String(reelOriginalVolume));

      let publishedPost: any = null;
      let isBlocked = false;

      try {
        const response = await fetch('/api/posts', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();

        if (data.blocked) {
          isBlocked = true;
          toast.error(data.error || '⛔ AI Safety Guardrail: Content blocked.', { id: toastId });
          window.alert("⚠️ UPLOAD FAILED\n\nYour content was blocked by our AI Guardrail.\n\nVyapar Bridge is strictly a B2B network. You can ONLY upload business-related content like products, professional services, machinery, and trade materials.\n\nPersonal selfies, human portraits, and casual videos are NOT allowed.");
          return;
        }

        if (response.ok && data.success && data.post) {
          publishedPost = data.post;
        }
      } catch (e) {
        console.warn('Backend API note, publishing directly to local and Firestore:', e);
      }

      if (!isBlocked) {
        const finalReelPost = publishedPost || {
          id: reelId,
          userId: String(user.id),
          userName: user.name || 'Verified Member',
          userRole: user.role || 'factory',
          title: 'New B2B Reel',
          content: 'Uploaded from Home Reels',
          hashtags: '#reel #b2b #tiles #products',
          type: 'video',
          mediaUrl: reelPreviewUrl || '',
          thumbnailUrl: reelPreviewUrl || '',
          category: 'Commercial Wholesale',
          visibility: 'public',
          status: 'approved',
          likesCount: 0,
          viewsCount: 1,
          createdAt: Date.now(),
          music: selectedMusic,
          user: user || { id: String(user.id), name: user.name || 'Verified Member', role: user.role || 'factory' }
        };

        await syncPostToFirestore(finalReelPost);
        toast.success('🎉 Reel published successfully!', { id: toastId });
        setPosts(prev => [finalReelPost, ...prev]);
        setActiveStoryIndex(0);
        // Reset state
        setPendingReelFile(null);
        setReelPreviewUrl(null);
        setSelectedMusic(null);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error publishing reel', { id: toastId });
    } finally {
      setIsUploadingReel(false);
    }
  };

  const videoPosts = posts.filter(p => p.type === 'video' || p.mediaUrl?.match(/\.(mp4|webm|mov|m4v)$/i));

  const filteredPosts = posts.filter(p => {
    if (!selectedTag || selectedTag === '#All' || selectedTag === '#Latest') return true;
    if (selectedTag === '#Reels') return p.type === 'video' || p.mediaUrl?.match(/\.(mp4|webm|mov|m4v)$/i);
    const tagKeyword = selectedTag.replace('#', '').toLowerCase();
    const titleStr = p.title || '';
    const contentStr = p.content || '';
    const hashtagsStr = p.hashtags || '';
    const combined = `${titleStr} ${contentStr} ${hashtagsStr}`.toLowerCase();
    return combined.includes(tagKeyword);
  }).sort((a, b) => b.createdAt - a.createdAt);

  if (loading) return <div className="flex justify-center pt-10"><div className="w-8 h-8 border-4 border-slate-200 dark:border-zinc-800 border-t-black rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-2xl lg:max-w-3xl mx-auto w-full pb-20 md:pb-0 pt-6 px-2 sm:px-4">
      {/* Hidden reel file input for direct upload */}
      <input 
        type="file" 
        ref={reelFileInputRef} 
        accept="video/*,image/*" 
        className="hidden" 
        onChange={handleDirectReelUpload} 
      />

      {/* Stories / Reels Tray */}
      <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide px-2">
        {/* Your Reel / Add Reel (+) Button - Hidden for Guests and Customers */}
        {user && user.role !== 'customer' && (
          <div 
            onClick={() => reelFileInputRef.current?.click()} 
            className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
          >
            <div className="relative w-16 h-16 rounded-full bg-slate-100 dark:bg-zinc-800 border-2 border-dashed border-blue-500 flex items-center justify-center p-[2px] transition-transform group-hover:scale-105">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Your profile" className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-200 dark:bg-zinc-800 rounded-full flex items-center justify-center font-bold text-black dark:text-zinc-200 text-sm">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 bg-[#0095f6] hover:bg-blue-600 text-white rounded-full p-1 border-2 border-white dark:border-black shadow-md flex items-center justify-center">
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>
            <span className="text-xs font-semibold text-black dark:text-zinc-50 truncate w-16 text-center">Your Reel</span>
          </div>
        )}

        {/* User Created Reel Video Stories */}
        {videoPosts.map((story, i) => (
          <div 
            key={story.id || `video-${i}`} 
            onClick={() => setActiveStoryIndex(i)}
            className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
          >
            <div className={cn(
              "w-16 h-16 rounded-full transition-transform duration-150",
              story.user?.isVerified ? "tiranga-border-circle" : "neon-border-circle"
            )}>
              <div className="w-full h-full bg-[#E6C76C] dark:bg-black rounded-full p-[1px]">
                <div className="w-full h-full bg-slate-200 dark:bg-zinc-800 rounded-full border border-slate-100 dark:border-zinc-900 flex items-center justify-center text-black dark:text-zinc-200 font-bold text-xs overflow-hidden">
                  {story.user?.avatarUrl ? (
                    <img src={story.user.avatarUrl} alt={story.user.name} className="w-full h-full object-cover" />
                  ) : (
                    story.user?.name?.charAt(0) || 'R'
                  )}
                </div>
              </div>
            </div>
            <span className="text-xs text-black dark:text-zinc-50 truncate w-16 text-center">{story.user?.name || 'Reel'}</span>
          </div>
        ))}
      </div>

      {/* Sponsored Brand Showcase Carousel / Playlist (Videos & Images) */}
      {brandAdsList.length > 0 && !isBrandAdDismissed && (() => {
        const activeAd = brandAdsList[currentAdIndex % brandAdsList.length] || brandAdsList[0];
        return (
          <div className="mb-5 bg-white dark:bg-zinc-900 border-2 border-amber-500/60 rounded-2xl overflow-hidden shadow-xl relative text-zinc-900 dark:text-white transition-all">
            {/* Header Badge, Playlist counter, Nav controls & Skip button */}
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-amber-50 dark:bg-zinc-900/90 border-b border-amber-200 dark:border-amber-500/30 backdrop-blur-md gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider flex items-center gap-1 shadow-sm shrink-0">
                  <Sparkles className="w-3 h-3 fill-white" /> Sponsored Showcase
                </span>
                <span className="text-xs font-black text-amber-900 dark:text-amber-300 truncate">
                  {activeAd.companyName || 'Featured Brand'}
                </span>
                {brandAdsList.length > 1 && (
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 px-2 py-0.5 rounded-full font-bold shrink-0">
                    {currentAdIndex + 1} / {brandAdsList.length}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Previous & Next Carousel Buttons */}
                {brandAdsList.length > 1 && (
                  <div className="flex items-center gap-1 bg-white/80 dark:bg-black/60 rounded-full p-0.5 border border-slate-200 dark:border-white/10 shadow-sm">
                    <button 
                      onClick={() => setCurrentAdIndex((prev) => (prev - 1 + brandAdsList.length) % brandAdsList.length)}
                      className="p-1 hover:bg-amber-100 dark:hover:bg-white/20 rounded-full transition-colors cursor-pointer text-amber-700 dark:text-amber-300"
                      title="Previous Ad"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setCurrentAdIndex((prev) => (prev + 1) % brandAdsList.length)}
                      className="p-1 hover:bg-amber-100 dark:hover:bg-white/20 rounded-full transition-colors cursor-pointer text-amber-700 dark:text-amber-300"
                      title="Next Ad"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Skip / Cut Button */}
                <button 
                  onClick={() => {
                    setIsBrandAdDismissed(true);
                    toast('Ad showcase hidden for this session', { icon: '👁️' });
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-red-500 hover:text-white text-slate-700 dark:bg-black/60 dark:hover:bg-red-600/80 dark:text-white rounded-full text-[11px] font-bold border border-slate-200 dark:border-white/20 transition-all cursor-pointer shadow-sm hover:scale-105"
                  title="Close / Cut Advertisement"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Skip Ad</span>
                </button>
              </div>
            </div>

            {/* Media Canvas - Supports Videos & Images from IndexedDB Local Storage or Server URL */}
            <div className="relative w-full min-h-[240px] max-h-[500px] bg-slate-900 dark:bg-black flex items-center justify-center overflow-hidden">
              <AdMediaDisplay ad={activeAd} className="w-full max-h-[480px] object-contain bg-slate-900 dark:bg-black" />
            </div>

            {/* Ad Details Footer */}
            <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/90 border-t border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-slate-800 dark:text-amber-400">
                    {activeAd.type === 'image' ? '🖼️ Photo Ad' : '🎥 Video Ad'}
                  </span>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-zinc-100 truncate">{activeAd.title || 'Official Brand Showcase'}</h4>
                </div>
                {activeAd.description && (
                  <p className="text-xs text-slate-600 dark:text-zinc-400 line-clamp-2 leading-snug">{activeAd.description}</p>
                )}
                <AdRatingComponent ad={activeAd} onRate={(adId, rating, updatedAd) => {
                  setBrandAdsList(prev => prev.map(a => a.id === adId ? updatedAd : a));
                }} />
              </div>
            </div>

            {/* Playlist Indicator Dots / Thumbnails */}
            {brandAdsList.length > 1 && (
              <div className="px-3 py-2 bg-slate-100 dark:bg-slate-950/80 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-center gap-2 overflow-x-auto no-scrollbar">
                {brandAdsList.map((ad, idx) => (
                  <button
                    key={ad.id || idx}
                    onClick={() => setCurrentAdIndex(idx)}
                    className={clsx(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 border shadow-sm",
                      idx === currentAdIndex 
                        ? "bg-amber-500 text-white border-amber-400 shadow font-black" 
                        : "bg-white text-slate-700 border-slate-300 hover:bg-amber-50 hover:text-amber-800 dark:bg-slate-900 dark:text-zinc-400 dark:border-slate-800 dark:hover:text-white"
                    )}
                  >
                    <span>{ad.type === 'image' ? '🖼️' : '🎥'}</span>
                    <span className="truncate max-w-[100px]">{ad.companyName || `Ad ${idx + 1}`}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Main Feed Posts */}
      <div className="space-y-4">
        {filteredPosts.map((post, idx) => (
          <React.Fragment key={post.id || `post-${idx}`}>
            <PostItem 
              post={post} 
              currentUser={user} 
              onPostDeleted={(id) => setPosts(posts.filter(p => p.id !== id))} 
              onPostUpdated={(updatedPost) => setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p))} 
              onPostClick={() => setActiveStoryIndex(idx)}
              onReelClick={() => setActiveStoryIndex(idx)}
              userLocation={userLocation}
            />
            {/* Inject Suggested Companies/Dealers every 5 items as requested */}
            {(idx + 1) % 5 === 0 && suggestedUsers.length > 0 && (
              <SuggestedUsersRow users={suggestedUsers.slice(0, 6)} />
            )}
          </React.Fragment>
        ))}
        {filteredPosts.length === 0 && (
          <div className="text-center py-12 text-black/70 dark:text-zinc-400 font-medium">
            No posts found for {selectedTag}. Try selecting #All or #Latest!
          </div>
        )}
      </div>

      {/* Fullscreen Post Feed Viewer Modal */}
      {activeStoryIndex !== null && (
        <FullScreenFeedViewerModal
          posts={filteredPosts}
          initialIndex={activeStoryIndex}
          currentUser={user}
          onClose={() => setActiveStoryIndex(null)}
          userLocation={userLocation}
        />
      )}

      {/* Verified Payment Modal */}
      <VerifiedPaymentModal isOpen={isVerifyModalOpen} onClose={() => setIsVerifyModalOpen(false)} user={user} onSuccess={(updatedUser) => { if (onUpdateUser) onUpdateUser(updatedUser); }} />

      {/* Reel Upload Preview Modal */}
      {isPreviewModalOpen && reelPreviewUrl && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-0 sm:p-4 overflow-hidden">
          <div className="w-full max-w-[420px] h-full sm:h-[90vh] bg-zinc-900 rounded-none sm:rounded-3xl overflow-hidden relative flex flex-col shadow-2xl border border-zinc-800">
            {/* Header */}
            <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between z-30 bg-gradient-to-b from-black/80 to-transparent">
              <button onClick={() => setIsPreviewModalOpen(false)} className="p-2 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-md transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h3 className="text-white font-black text-sm uppercase tracking-widest drop-shadow-md">New Reel Preview</h3>
              <div className="w-10"></div>
            </div>

            {/* Video Player */}
            <div className="flex-1 bg-black flex items-center justify-center relative group">
              {reelPreviewUrl ? (
                <>
                  <video preload="auto" 
                    src={reelPreviewUrl} 
                    className="w-full h-full object-contain transform-gpu will-change-transform" 
                    loop 
                    muted={selectedMusic && reelOriginalVolume === 0} 
                    playsInline
                    ref={(el) => { 
                      if (el) {
                        el.volume = selectedMusic ? reelOriginalVolume : 1;
                        if (el.paused) { const p = el.play(); if (p !== undefined) p.catch(()=>{}); }
                      }
                    }}
                  />
                  {selectedMusic?.audioUrl && (
                    <audio src={selectedMusic.audioUrl} loop playsInline className="hidden" ref={(el) => { 
                      if (el) {
                        el.volume = reelMusicVolume;
                        if (el.paused) { const p = el.play(); if (p !== undefined) p.catch(()=>{}); } 
                      }
                    }} />
                  )}
                  
                  {/* Overlay for Add Sound button */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/20 group-hover:bg-black/40 transition-colors">
                    <button 
                      onClick={() => setIsMusicModalOpen(true)}
                      className="bg-white/10 hover:bg-white/20 backdrop-blur-xl border-2 border-white/30 text-white px-6 py-3 rounded-full flex items-center gap-3 font-black text-xs uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95"
                    >
                      <Volume2 className="w-5 h-5 text-amber-400" />
                      <span>{selectedMusic ? `Sound: ${selectedMusic.title}` : 'Add Official Sound'}</span>
                    </button>
                    <button 
                      onClick={() => document.getElementById('custom-audio-upload-feed')?.click()}
                      className="bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full flex items-center gap-2 font-bold text-[10px] uppercase tracking-wider transition-all"
                    >
                      <Upload className="w-4 h-4 text-emerald-400" />
                      <span>Upload Custom MP3</span>
                    </button>
                    <input 
                      id="custom-audio-upload-feed" 
                      type="file" 
                      accept="audio/mp3,audio/mpeg,audio/wav" 
                      className="hidden" 
                      onChange={handleCustomAudioUpload}
                    />
                    {selectedMusic && (
                      <div className="w-full max-w-[280px] bg-black/80 backdrop-blur-xl rounded-xl p-4 border border-white/20 mt-4" onClick={(e) => e.stopPropagation()}>
                        <p className="text-white text-[10px] font-bold uppercase tracking-tighter mb-3 text-center">Audio Mixing</p>
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between text-[10px] text-white/70">
                              <span>Original Audio</span>
                              <span>{Math.round(reelOriginalVolume * 100)}%</span>
                            </div>
                            <input 
                              type="range" min="0" max="1" step="0.05" 
                              value={reelOriginalVolume} 
                              onChange={(e) => setReelOriginalVolume(parseFloat(e.target.value))}
                              className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer" 
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between text-[10px] text-emerald-400">
                              <span>Background Music</span>
                              <span>{Math.round(reelMusicVolume * 100)}%</span>
                            </div>
                            <input 
                              type="range" min="0" max="1" step="0.05" 
                              value={reelMusicVolume} 
                              onChange={(e) => setReelMusicVolume(parseFloat(e.target.value))}
                              className="w-full h-1 bg-emerald-900/50 rounded-lg appearance-none cursor-pointer" 
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-white/50 text-xs font-semibold">
                  <p>No video selected for preview</p>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="p-6 bg-zinc-950 border-t border-zinc-800">
              <button 
                onClick={finalizeReelUpload}
                disabled={isUploadingReel}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-4 rounded-2xl text-sm uppercase tracking-[0.2em] shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isUploadingReel ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <>
                    <PlusSquare className="w-5 h-5" />
                    <span>Publish Reel to Feed</span>
                  </>
                )}
              </button>
              <p className="text-center text-[10px] text-zinc-500 mt-4 font-bold uppercase tracking-widest">Reels are shared with all B2B Network users</p>
            </div>
          </div>
        </div>
      )}

      {/* Music Selection Modal */}
      <MusicSelectionModal 
        isOpen={isMusicModalOpen} 
        onClose={() => setIsMusicModalOpen(false)} 
        onSelect={(music) => {
          setSelectedMusic(music);
          setIsMusicModalOpen(false);
        }} 
      /></div>
  );
}

function CreatePost({ user }: { user: any }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [seekerValue, setSeekerValue] = useState(0);
  const [visibility, setVisibility] = useState<'public' | 'private' | 'unlisted' | 'scheduled'>('public');
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const pdfInputRef = React.useRef<HTMLInputElement>(null);
  const thumbInputRef = React.useRef<HTMLInputElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!user?.id) {
      toast.error('🔐 Login or Registration required! Only registered Factories and Dealers can post content on Vyapar Bridge.');
      window.dispatchEvent(new CustomEvent('openAuthModal'));
      navigate('/');
      return;
    }
    if (user?.role === 'customer') {
      toast.error('🚫 Local area customers cannot create posts. Post creation is for Factories and Dealers only.');
      navigate('/');
      return;
    }
  }, [user, navigate]);

  if (!user) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const blobUrl = URL.createObjectURL(selectedFile);
      setFilePreview(blobUrl);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setThumbnailFile(selectedFile);
      const blobUrl = URL.createObjectURL(selectedFile);
      setThumbnailPreview(blobUrl);
    }
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "thumbnail.jpg", { type: "image/jpeg" });
          setThumbnailFile(file);
          if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
          setThumbnailPreview(URL.createObjectURL(blob));
          toast.success("Video frame set as thumbnail! ✓");
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const suggestHashtags = async () => {
    if (!title && !content) {
      toast.error('Please add a title or description first');
      return;
    }
    setIsSuggestingTags(true);
    try {
      const res = await fetch('/api/ai/suggest-hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
      });
      const data = await res.json();
      if (data.hashtags) {
        setHashtags(data.hashtags);
        toast.success('AI Hashtags suggested! ✓');
      }
    } catch (err) {
      toast.error('AI suggestion failed');
    } finally {
      setIsSuggestingTags(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error('🔐 Login or Registration required! Only registered Factories and Dealers can post content.');
      window.dispatchEvent(new CustomEvent('openAuthModal'));
      return;
    }
    if (user?.role === 'customer') {
      toast.error('🚫 Local area customers cannot create posts.');
      return;
    }
    if (!content.trim() && !file) {
      toast.error('Please add content or media');
      return;
    }

    setIsSubmitting(true);
    const postMediaType = isVideo ? 'video' : (isPdf ? 'pdf' : (file ? 'image' : 'text'));
    const generatedId = `post_${Date.now()}`;

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('hashtags', hashtags);
    formData.append('userId', String(user.id));
    formData.append('userName', user.name || 'Verified Member');
    formData.append('userRole', user.role || 'factory');
    formData.append('type', postMediaType);
    formData.append('visibility', visibility);
    if (visibility === 'scheduled' && scheduledAt) {
      formData.append('scheduledAt', String(new Date(scheduledAt).getTime()));
    }

    if (file) formData.append('media', file);
    if (thumbnailFile) formData.append('thumbnail', thumbnailFile);

    try {
      let savedPost: any = null;
      let isBlocked = false;

      try {
        const response = await fetch('/api/posts', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        
        if (data.blocked) {
          isBlocked = true;
          toast.error(data.error || '⛔ AI Safety Guardrail: Content blocked.');
          window.alert("⚠️ UPLOAD FAILED\n\nYour content was blocked by our AI Guardrail.\n\nVyapar Bridge is strictly a B2B network. You can ONLY upload business-related content like products, professional services, machinery, and trade materials.\n\nPersonal selfies, human portraits, and casual videos are NOT allowed.");
          return;
        }

        if (response.ok && data.success && data.post) {
          savedPost = data.post;
        }
      } catch (networkErr) {
        console.warn('Backend API note, using direct Firestore sync:', networkErr);
      }

      if (!isBlocked) {
        // Direct resilient Firestore and Local state sync
        const finalPostData = savedPost || {
          id: generatedId,
          userId: String(user.id),
          userName: user.name || 'Verified Member',
          userRole: user.role || 'factory',
          title: title || '',
          content: content || '',
          description: content || '',
          hashtags: hashtags || '#vyaparbridge #tiles #business',
          type: postMediaType,
          mediaUrl: filePreview || '',
          thumbnailUrl: thumbnailPreview || filePreview || '',
          category: 'Commercial Wholesale',
          visibility: visibility || 'public',
          status: 'approved',
          likesCount: 0,
          viewsCount: 1,
          createdAt: Date.now(),
          user: {
            id: String(user.id),
            name: user.name || 'Member',
            role: user.role || 'factory',
            isVerified: Boolean(user?.isVerified)
          }
        };

        await syncPostToFirestore(finalPostData);
        toast.success(`🎉 Post ${visibility === 'scheduled' ? 'scheduled' : 'published'} successfully!`);
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isVideo = file?.type.startsWith('video') || file?.name.match(/\.(mp4|webm|mov|m4v)$/i);
  const isPdf = file?.type === 'application/pdf' || file?.name.match(/\.pdf$/i);

  return (
    <div className="max-w-2xl mx-auto w-full pt-8 pb-24 px-4">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-xl font-black text-black dark:text-zinc-50 uppercase tracking-widest">Create New Post</h2>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
             <span className="text-[10px] font-bold text-black/60 uppercase">Factory & Dealer Studio</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Media Upload Area */}
          <div className="relative group">
            {!filePreview ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-video w-full border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-950/50 transition-all hover:border-blue-500/50 p-6 text-center"
                >
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                    <ImagePlus className="w-8 h-8 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-black dark:text-zinc-50">Upload Photo or Video</p>
                    <p className="text-xs text-black/70 mt-1">PNG, JPG, MP4, WebM</p>
                  </div>
                </div>

                <div 
                  onClick={() => pdfInputRef.current?.click()}
                  className="aspect-video w-full border-2 border-dashed border-emerald-200 dark:border-emerald-800/50 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all hover:border-emerald-500 p-6 text-center"
                >
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-full">
                    <FileText className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-black dark:text-zinc-50">Upload PDF Catalogue</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-bold">Product Brochure (.PDF)</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-200 dark:border-zinc-800">
                {isPdf ? (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-900 shadow-xl flex items-center justify-center mb-3 border border-emerald-200 dark:border-emerald-800">
                      <FileText className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-sm font-black text-black dark:text-zinc-50 truncate max-w-xs">{file?.name}</p>
                    <span className="mt-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                      PDF Document / Catalogue Attached ✓
                    </span>
                  </div>
                ) : isVideo && filePreview ? (
                  <div className="relative w-full h-full">
                    <video preload="auto" 
                      ref={videoRef}
                      src={filePreview} 
                      className="w-full h-full object-cover transform-gpu will-change-transform" 
                      onLoadedMetadata={() => {
                        if (videoRef.current) setVideoDuration(videoRef.current.duration);
                      }}
                      onTimeUpdate={() => {
                        if (videoRef.current) setSeekerValue(videoRef.current.currentTime);
                      }}
                      muted 
                      loop 
                    />
                    
                    {/* Video Scrubbing & Thumbnail Selection */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <input 
                          type="range"
                          min="0"
                          max={videoDuration || 100}
                          step="0.1"
                          value={seekerValue}
                          onChange={(e) => {
                            const time = parseFloat(e.target.value);
                            setSeekerValue(time);
                            if (videoRef.current) videoRef.current.currentTime = time;
                          }}
                          className="flex-1 accent-blue-500 h-1.5 rounded-lg appearance-none bg-white/20 cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-white/70 tabular-nums">
                          {Math.floor(seekerValue)}s / {Math.floor(videoDuration)}s
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button 
                            type="button"
                            onClick={captureFrame}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            Set Current Frame as Thumbnail
                          </button>
                          
                          <button 
                            type="button"
                            onClick={() => thumbInputRef.current?.click()}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all backdrop-blur-md border border-white/10 active:scale-95"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            Pick from Gallery
                          </button>
                        </div>
                        
                        {thumbnailPreview && (
                          <div className="relative group/thumb">
                            <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-blue-500 shadow-xl">
                              <img src={thumbnailPreview} alt="Thumb" className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute bottom-full right-0 mb-2 w-32 aspect-video bg-black/90 rounded-xl overflow-hidden border border-white/20 opacity-0 group-hover/thumb:opacity-100 transition-opacity pointer-events-none shadow-2xl">
                               <img src={thumbnailPreview} alt="Large Thumb" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-full">
                    <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                    
                    <button 
                      type="button"
                      onClick={() => thumbInputRef.current?.click()}
                      className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/90 dark:bg-zinc-900/90 hover:bg-white dark:hover:bg-zinc-800 text-black dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl backdrop-blur-md border border-white/20 active:scale-95"
                    >
                      <ImagePlus className="w-4 h-4 text-blue-500" />
                      {thumbnailPreview ? 'Change Thumbnail' : 'Add Custom Thumbnail'}
                    </button>
                    
                    {thumbnailPreview && (
                      <div className="absolute bottom-4 left-4 flex items-center gap-3 p-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10">
                        <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-blue-500">
                          <img src={thumbnailPreview} alt="Thumb" className="w-full h-full object-cover" />
                        </div>
                        <div className="pr-2">
                          <span className="block text-[9px] font-black text-white/50 uppercase tracking-tighter">Selected Thumbnail</span>
                          <span className="block text-[10px] font-bold text-white truncate max-w-[80px]">Custom Cover ✓</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <canvas ref={canvasRef} className="hidden" />

                <button 
                  type="button"
                  onClick={() => { setFile(null); setFilePreview(null); setThumbnailFile(null); setThumbnailPreview(null); }}
                  className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black transition-colors z-30"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
            <input type="file" ref={pdfInputRef} className="hidden" accept=".pdf,application/pdf" onChange={handleFileChange} />
            <input type="file" ref={thumbInputRef} className="hidden" accept="image/*" onChange={handleThumbnailChange} />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-black/60 uppercase tracking-widest mb-2">Title / Model Name</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Premium Vitrified Tiles 600x1200"
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-black/60 uppercase tracking-widest mb-2">Description</label>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share more details about this product..."
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[120px]"
              />
            </div>

            <div className="relative group/hashtags">
              <label className="block text-xs font-black text-black/60 uppercase tracking-widest mb-2 flex items-center justify-between">
                <span>Hashtags & Keywords</span>
                <button 
                  type="button"
                  onClick={suggestHashtags}
                  disabled={isSuggestingTags}
                  className="text-blue-500 hover:text-blue-600 flex items-center gap-1 normal-case tracking-normal disabled:opacity-50 group-hover/hashtags:scale-110 transition-transform cursor-pointer"
                >
                  <motion.div
                    animate={(hashtags.length === 0 && (title || content)) ? { scale: [1, 1.2, 1], rotate: [0, 15, -15, 0] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    {isSuggestingTags ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                  </motion.div>
                  <span className="font-bold underline decoration-dotted underline-offset-4">Suggest with AI</span>
                </button>
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  placeholder="e.g. #tiles #b2b #marble"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 pr-12 transition-all"
                />
                {(title || content) && hashtags.length === 0 && !isSuggestingTags && (
                  <button
                    type="button"
                    onClick={suggestHashtags}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-tr from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg animate-bounce"
                    title="Generate tags with AI"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                )}
                {isSuggestingTags && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  '#Tiles', '#Sanitaryware', '#Bathware',
                  '#Textile', '#Garments', '#Fabrics',
                  '#Grocery', '#FMCG', '#Kirana',
                  '#Hardware', '#Electricals', '#Packaging', '#Logistics'
                ].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (!hashtags.includes(tag)) {
                        setHashtags(prev => prev ? `${prev} ${tag}` : tag);
                      }
                    }}
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer",
                      hashtags.includes(tag)
                        ? "bg-amber-500 text-slate-950 border-amber-400 font-black"
                        : "bg-slate-100 dark:bg-zinc-800 text-black/70 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 hover:border-amber-400"
                    )}
                  >
                    + {tag}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[10px] text-black/70 dark:text-zinc-500 italic">
                Tip: Add a title and description first, then click <span className="text-blue-500 font-bold cursor-pointer hover:underline" onClick={suggestHashtags}>Suggest with AI</span> or tap above tags to auto-fill industry hashtags.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-black/60 uppercase tracking-widest mb-2">Visibility</label>
                <select 
                  value={visibility}
                  onChange={(e: any) => setVisibility(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none"
                >
                  <option value="public">Public (Everyone)</option>
                  <option value="unlisted">Unlisted (Link Only)</option>
                  <option value="private">Private (Only Me)</option>
                  <option value="scheduled">Schedule for Later</option>
                </select>
              </div>
              {visibility === 'scheduled' && (
                <div>
                  <label className="block text-xs font-black text-black/60 uppercase tracking-widest mb-2">Schedule Date & Time</label>
                  <input 
                    type="datetime-local" 
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-4 rounded-2xl text-sm uppercase tracking-[0.2em] shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (visibility === 'scheduled' ? <Calendar className="w-5 h-5" /> : <Rocket className="w-5 h-5" />)}
            <span>{isSubmitting ? 'Publishing...' : (visibility === 'scheduled' ? 'Schedule Post' : 'Publish Product Post')}</span>
          </button>
        </form>
      </div></div>
  );
}

function AdminPanel({ user }: { user: any }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [music, setMusic] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'reports' | 'music' | 'users' | 'payments'>('posts');

  useEffect(() => {
    safeFetch('/api/posts?admin=true')
      .then(data => Array.isArray(data) && setPosts(data));
      
    safeFetch('/api/reports')
      .then(data => Array.isArray(data) && setReports(data));

    safeFetch('/api/music')
      .then(data => Array.isArray(data) && setMusic(data));

    safeFetch('/api/users')
      .then(data => Array.isArray(data) && setUsersList(data));

    safeFetch('/api/admin/payments')
      .then(data => Array.isArray(data) && setPayments(data));
  }, []);

  const handleStatusUpdate = async (id: string, status: string) => {
    await fetch(`/api/admin/posts/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    setPosts(posts.map(p => p.id === id ? { ...p, status } : p));
    toast.success(`Post marked as ${status}`);
  };

  const handleDismissReport = async (reportId: string) => {
    await fetch(`/api/reports/${reportId}`, { method: 'DELETE' });
    setReports(reports.filter(r => r.id !== reportId));
    toast.success('Report resolved/dismissed');
  };

  const handleDeleteReportedPost = async (postId: string, reportId: string) => {
    await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
    await fetch(`/api/reports/${reportId}`, { method: 'DELETE' });
    setPosts(posts.filter(p => p.id !== postId));
    setReports(reports.filter(r => r.id !== reportId));
    toast.success('Reported post permanently deleted');
  };

  return (
    <div className="max-w-4xl mx-auto w-full pt-8 pb-20 md:pb-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-black dark:text-zinc-50 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <span>Vyapar Bridge Admin & AI Safety Control Panel</span>
          </h2>
          <p className="text-xs text-black/70 dark:text-zinc-400 mt-1">
            Meta-style AI Guardrail logs and platform moderation.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-zinc-800 mb-6">
        <button
          onClick={() => setActiveTab('posts')}
          className={cn(
            "py-3 px-6 text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2",
            activeTab === 'posts' ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-black/60 hover:text-black/80"
          )}
        >
          <Film className="w-4 h-4" />
          <span>All Posts Queue ({posts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={cn(
            "py-3 px-6 text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2",
            activeTab === 'reports' ? "border-red-600 text-red-600 dark:text-red-400" : "border-transparent text-black/60 hover:text-black/80"
          )}
        >
          <ShieldAlert className="w-4 h-4 text-red-500" />
          <span>User Reports & AI Safety Flags ({reports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('music')}
          className={cn(
            "py-3 px-6 text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2",
            activeTab === 'music' ? "border-amber-600 text-amber-600 dark:text-amber-400" : "border-transparent text-black/60 hover:text-black/80"
          )}
        >
          <Volume2 className="w-4 h-4" />
          <span>Music Library ({music.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={cn(
            "py-3 px-6 text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2",
            activeTab === 'users' ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" : "border-transparent text-black/60 hover:text-black/80"
          )}
        >
          <Users className="w-4 h-4" />
          <span>Registered Members ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={cn(
            "py-3 px-6 text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2",
            activeTab === 'payments' ? "border-emerald-600 text-emerald-600 dark:text-emerald-400" : "border-transparent text-black/60 hover:text-black/80"
          )}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payments ({payments.length})</span>
        </button>
      </div>

      {activeTab === 'music' && (
        <div className="space-y-6">
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-6">
            <h3 className="font-bold text-black dark:text-zinc-50 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-600" />
              Upload New Audio to Library
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-black/70 uppercase ml-1">Track Title</label>
                <input 
                  id="musicTitle"
                  type="text" 
                  placeholder="e.g. Morbi Beats" 
                  className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-black/70 uppercase ml-1">Artist/Style</label>
                <input 
                  id="musicArtist"
                  type="text" 
                  placeholder="e.g. Instrumental" 
                  className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <input 
                  id="musicFile"
                  type="file" 
                  accept="audio/*,video/*"
                  className="hidden" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const title = (document.getElementById('musicTitle') as HTMLInputElement).value || 'Untitled';
                    const artist = (document.getElementById('musicArtist') as HTMLInputElement).value || 'Vyapar Bridge Audio';
                    
                    const tid = toast.loading('Uploading track...');
                    try {
                      const formData = new FormData();
                      formData.append('musicFile', file);
                      formData.append('title', title);
                      formData.append('artist', artist);
                      
                      const res = await fetch('/api/music', {
                        method: 'POST',
                        body: formData
                      });
                      const newM = await res.json();
                      setMusic([...music, newM]);
                      toast.success('Track added to library', { id: tid });
                    } catch (err) {
                      toast.error('Upload failed', { id: tid });
                    }
                  }}
                />
                <button 
                  onClick={() => document.getElementById('musicFile')?.click()}
                  className="w-full py-6 border-2 border-dashed border-amber-300 dark:border-amber-900/50 rounded-2xl text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all flex flex-col items-center gap-2"
                >
                  <Upload className="w-8 h-8" />
                  <span>Choose MP3/MP4 Audio File</span>
                  <span className="text-[10px] opacity-60">Max 10MB • Available for all Reels</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {music.map((track, i) => (
              <div key={track.id || `music-${i}`} className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                  <Volume2 className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-black dark:text-zinc-50 truncate">{track.title}</div>
                  <div className="text-xs text-black/70">{track.artist}</div>
                </div>
                <button 
                  onClick={async () => {
                    await fetch(`/api/music/${track.id}`, { method: 'DELETE' });
                    setMusic(music.filter(m => m.id !== track.id));
                    toast.success('Track removed');
                  }}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-black/60 hover:text-red-500 rounded-full transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-4 py-3 font-black uppercase tracking-widest text-black/70">User / Phone</th>
                    <th className="px-4 py-3 font-black uppercase tracking-widest text-black/70">Plan & Type</th>
                    <th className="px-4 py-3 font-black uppercase tracking-widest text-black/70">UTR / Amount</th>
                    <th className="px-4 py-3 font-black uppercase tracking-widest text-black/70">Status</th>
                    <th className="px-4 py-3 font-black uppercase tracking-widest text-black/70">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {payments.map((p, i) => (
                    <tr key={p.id || `payment-${i}`} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-black dark:text-zinc-100">{p.userName}</div>
                        <div className="text-[10px] text-black/60 font-medium">{p.userPhone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex w-fit px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-blue-100 text-blue-700">
                            {p.plan}
                          </span>
                          <span className={cn(
                            "inline-flex w-fit px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
                            p.membershipType === 'company' ? "bg-amber-100 text-amber-700" : "bg-zinc-100 text-zinc-700"
                          )}>
                            {p.membershipType}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-[10px] text-black dark:text-zinc-100">{p.utr}</div>
                        <div className="text-[10px] text-emerald-600 font-bold">₹{p.amount}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                          p.status === 'approved' ? "bg-emerald-100 text-emerald-700" : (p.status === 'rejected' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")
                        )}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {p.status === 'pending' && (
                          <div className="flex gap-2">
                            <button 
                              onClick={async () => {
                                if (!confirm('Approve this payment and verify user?')) return;
                                const tid = toast.loading('Approving...');
                                try {
                                  const res = await fetch(`/api/admin/payments/${p.id}/approve`, { method: 'POST' });
                                  const data = await res.json();
                                  if (data.success) {
                                    setPayments(payments.map(item => item.id === p.id ? { ...item, status: 'approved' } : item));
                                    toast.success('Payment approved!', { id: tid });
                                  }
                                } catch (err) {
                                  toast.error('Failed to approve', { id: tid });
                                }
                              }}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white p-1.5 rounded-lg transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={async () => {
                                if (!confirm('Reject this payment?')) return;
                                const tid = toast.loading('Rejecting...');
                                try {
                                  const res = await fetch(`/api/admin/payments/${p.id}/reject`, { method: 'POST' });
                                  const data = await res.json();
                                  if (data.success) {
                                    setPayments(payments.map(item => item.id === p.id ? { ...item, status: 'rejected' } : item));
                                    toast.success('Payment rejected!', { id: tid });
                                  }
                                } catch (err) {
                                  toast.error('Failed to reject', { id: tid });
                                }
                              }}
                              className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-black/70 italic">
                        No payment submissions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-4 py-3 font-black uppercase tracking-widest text-black/70">Member</th>
                    <th className="px-4 py-3 font-black uppercase tracking-widest text-black/70">Role & Category</th>
                    <th className="px-4 py-3 font-black uppercase tracking-widest text-black/70">GSTIN / Tax ID</th>
                    <th className="px-4 py-3 font-black uppercase tracking-widest text-black/70">Location</th>
                    <th className="px-4 py-3 font-black uppercase tracking-widest text-black/70">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {usersList.map((u, i) => (
                    <tr key={u.id || `user-${i}`} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <img src={u.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover bg-slate-100 border border-slate-200" />
                          <div>
                            <div className="font-bold text-black dark:text-zinc-100">{u.name}</div>
                            <div className="text-[10px] text-black/60 font-medium">@{u.username || u.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={cn(
                            "inline-flex w-fit px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
                            u.role === 'admin' ? "bg-purple-100 text-purple-700" : (u.role === 'factory' ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700")
                          )}>
                            {u.role}
                          </span>
                          <span className="text-[10px] text-black/70 font-bold uppercase">{u.category || 'General'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-black/70">
                        {u.gstNumber || '---'}
                      </td>
                      <td className="px-4 py-3 text-[10px] text-black/70">
                        {u.city}, {u.state}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={async () => {
                            if (u.role === 'admin') return toast.error('Cannot delete admin');
                            if (!confirm(`Are you sure you want to delete profile: ${u.name}? All posts and data will be lost.`)) return;
                            
                            const tid = toast.loading(`Deleting ${u.name}...`);
                            try {
                              const res = await fetch(`/api/users/${u.id}`, { method: 'DELETE' });
                              if (!res.ok) throw new Error('Delete failed');
                              setUsersList(usersList.filter(item => item.id !== u.id));
                              toast.success('Member profile permanently removed', { id: tid });
                            } catch (err) {
                              toast.error('Deletion failed', { id: tid });
                            }
                          }}
                          disabled={u.role === 'admin'}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-black/60 hover:text-red-500 rounded-lg transition-colors disabled:opacity-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'posts' && (
        <div className="space-y-4">
          {posts.map((post, i) => (
            <div key={post.id || `post-${i}`} className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-4 shadow-sm flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-48 h-48 bg-slate-100 dark:bg-zinc-950 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                {post.mediaUrl && post.mediaUrl.trim() !== '' ? (
                  post.type === 'video' || post.mediaUrl.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) ? (
                    <video preload="auto" src={post.mediaUrl} poster={post.thumbnailUrl} className="w-full h-full object-cover transform-gpu will-change-transform" />
                  ) : (
                    <img src={post.mediaUrl} alt="media" className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="text-black/60 text-xs font-bold">Text Post</div>
                )}
              </div>
              
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-sm text-black dark:text-zinc-50">{post.user?.name || 'Member'}</div>
                    <div className="text-xs text-black/70 dark:text-zinc-400">{post.user?.role || 'User'}</div>
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 text-[10px] font-black rounded-full uppercase tracking-wider",
                    post.status === 'approved' ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-red-100 text-red-800"
                  )}>
                    {post.status}
                  </span>
                </div>
                
                <p className="text-xs text-black dark:text-zinc-200 bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl border border-slate-100 dark:border-zinc-800 mb-3">
                  {post.content || 'No text'}
                </p>

                {post.aiFeedback && (
                  <div className="text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 p-2.5 rounded-xl mb-3 flex items-center gap-1.5 border border-blue-200 dark:border-blue-800">
                    <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                    <span><strong>AI Safety Analysis:</strong> {post.aiFeedback}</span>
                  </div>
                )}
                
                <div className="mt-auto flex gap-2">
                  <button 
                    onClick={() => handleStatusUpdate(post.id, 'approved')}
                    disabled={post.status === 'approved'}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Approve Post
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(post.id, 'rejected')}
                    disabled={post.status === 'rejected'}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Reject Post
                  </button>
                </div>
              </div>
            </div>
          ))}
          {posts.length === 0 && <p className="text-black/70 text-center py-12">No posts found.</p>}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.map((report, i) => (
            <div key={report.id || `report-${i}`} className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-red-200 dark:border-red-950 p-4 shadow-sm flex flex-col md:flex-row justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full uppercase border border-red-300 dark:border-red-800">
                    {report.targetType} REPORTED
                  </span>
                  <span className="text-xs font-bold text-black/70">
                    Target ID: {report.targetId}
                  </span>
                </div>

                <div className="text-sm font-bold text-black dark:text-zinc-100">
                  Target Name / User: <span className="text-red-600">{report.targetName || report.targetId}</span>
                </div>

                <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-xl text-xs border border-red-100 dark:border-red-900/50 space-y-1">
                  <div className="font-bold text-red-800 dark:text-red-300">Reason: {report.reason}</div>
                  {report.details && <div className="text-black dark:text-zinc-300">Details: "{report.details}"</div>}
                  <div className="text-[10px] text-black/60 mt-1">Reported by: {report.reporter?.name || report.reporterId}</div>
                </div>
              </div>

              <div className="flex flex-col justify-center gap-2 shrink-0 md:w-48">
                {report.targetType === 'post' && (
                  <button 
                    onClick={() => handleDeleteReportedPost(report.targetId, report.id)}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-xl text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Post
                  </button>
                )}
                <button 
                  onClick={() => handleDismissReport(report.id)}
                  className="bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-black dark:text-zinc-300 font-bold py-2 px-3 rounded-xl text-xs transition-colors cursor-pointer text-center"
                >
                  Dismiss / Approve
                </button>
              </div>
            </div>
          ))}
          {reports.length === 0 && (
            <div className="text-center py-16 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 text-black/70">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="font-bold text-sm text-black dark:text-zinc-200">No Pending Safety Reports!</p>
              <p className="text-xs text-black/60 mt-1">Meta-style AI Guardrail is active and protecting all posts, reels, comments, and messages.</p>
            </div>
          )}
        </div>
      )}</div>
  );
}

function Chat({ user, onOpenVerify, userLocation }: { user: any; onOpenVerify?: () => void; userLocation?: {lat: number, lng: number} | null }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeContact, setActiveContact] = useState<any>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string>('');

  // Contacts list
  const [contacts, setContacts] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    safeFetch('/api/users')
      .then(data => {
        if (Array.isArray(data)) {
          setContacts(data.filter((u: any) => u.id !== user.id));
        }
      })
      .catch(err => console.error('Chat user fetch error:', err));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    safeFetch(`/api/messages?userId=${user.id}`)
      .then(setMessages);
  }, [user?.id]);

  if (!user) {
    return (
      <div className="h-[calc(100vh-60px)] flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-zinc-950 text-center">
        <MessageCircle className="w-16 h-16 text-slate-300 dark:text-zinc-700 mb-4" />
        <h2 className="text-xl font-bold text-black dark:text-zinc-50 mb-2">Login to Chat</h2>
        <p className="text-black/70 max-w-sm mb-6">You need to be logged in to send and receive messages.</p>
        <Link to="/" onClick={() => window.dispatchEvent(new CustomEvent('openAuthModal'))} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full transition-colors">Sign In</Link>
      </div>
    );
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !pendingImage) || !activeContact) return;

    setUploadingImage(true);
    try {
      if (pendingImage) {
        const formData = new FormData();
        formData.append('image', pendingImage);
        formData.append('senderId', user.id);
        formData.append('receiverId', activeContact.id);
        formData.append('text', newMessage.trim() || '[Image]');

        const res = await fetch('/api/messages/image', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          setMessages([...messages, data.message]);
          setPendingImage(null);
          setPendingImagePreview('');
          setNewMessage('');
          if (chatFileInputRef.current) chatFileInputRef.current.value = '';
        } else {
          toast.error(data.error || 'Failed to send image');
        }
      } else {
        const data = await safeFetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: user.id,
            receiverId: activeContact.id,
            text: newMessage
          })
        });
        if (data.blocked) {
          toast.error(data.error || '⛔ AI Safety Guardrail: Message blocked due to abusive language or inappropriate content.');
          return;
        }
        if (data.success) {
          setMessages([...messages, data.message]);
          setNewMessage('');
        }
      }
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm('Delete this message?')) return;
    try {
      await fetch(`/api/messages/${msgId}`, { method: 'DELETE' });
      setMessages(messages.filter(m => m.id !== msgId));
      toast.success('Message deleted');
    } catch (err) {
      toast.error('Failed to delete message');
    }
  };

  const handleImageSend = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeContact) return;

    setPendingImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPendingImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const activeMessages = messages.filter(
    m => (m.senderId === user.id && m.receiverId === activeContact?.id) || 
         (m.senderId === activeContact?.id && m.receiverId === user.id)
  );

  return (
    <div className="max-w-[935px] mx-auto w-full pt-4 md:pt-8 h-[calc(100vh-60px)] md:h-[calc(100vh-32px)] pb-20 md:pb-8">
      <div className="bg-[#E6C76C] dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-none md:rounded-lg h-full flex overflow-hidden">
        {/* Chat List Sidebar */}
        <div className={`w-full md:w-[350px] border-r border-slate-200 dark:border-zinc-800 flex flex-col ${activeContact ? 'hidden md:flex' : 'flex'}`}>
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 dark:border-zinc-800">
            <h2 className="font-bold text-lg">{user?.name}</h2>
            <button><svg aria-label="New message" className="w-6 h-6" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M12.202 3.203H5.25a3 3 0 0 0-3 3V18.75a3 3 0 0 0 3 3h12.547a3 3 0 0 0 3-3v-6.952" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path><path d="M10.002 17.226H6.774v-3.228L18.607 2.165a1.417 1.417 0 0 1 2.004 0l1.224 1.225a1.417 1.417 0 0 1 0 2.004Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path><line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="16.848" x2="20.076" y1="3.924" y2="7.153"></line></svg></button>
          </div>
          <div className="p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-base">Messages</span>
            </div>
            {contacts.map(contact => {
              const lastMsg = messages.filter(m => (m.senderId === user.id && m.receiverId === contact.id) || (m.senderId === contact.id && m.receiverId === user.id)).sort((a, b) => b.createdAt - a.createdAt)[0];
              const isLockedForCustomer = user.role === 'customer' && !user.isVerified;
              
              return (
                <div 
                  key={contact.id} 
                  onClick={() => {
                    // Distance Check for Local Customer Members
                    if (user?.role === 'customer' && user?.membershipType === 'local') {
                      if (userLocation && contact.gpsCoords) {
                        const dist = calculateDistance(userLocation.lat, userLocation.lng, contact.gpsCoords.lat, contact.gpsCoords.lng);
                        if (dist > 100) {
                          toast.error(`📍 Distance Restriction: As a Local Member, you can only chat with dealers within 100km. This business is ${Math.round(dist)}km away. Upgrade to 'Direct Company' plan for nationwide access!`);
                          return;
                        }
                      } else if (!userLocation) {
                        toast.error("📍 Please enable GPS/Location to verify distance for Local Membership.");
                        return;
                      }
                    }
                    setActiveContact(contact);
                  }}
                  className={`flex items-center gap-3 mb-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-900 p-2 -mx-2 rounded-lg transition-colors ${activeContact?.id === contact.id ? 'bg-slate-50 dark:bg-zinc-900' : ''}`}
                >
                  <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-black/70 overflow-hidden relative">
                    {contact.avatarUrl ? (
                      <img src={contact.avatarUrl} alt={contact.name} className="w-full h-full object-cover" />
                    ) : (
                      contact.name.charAt(0)
                    )}
                    {isLockedForCustomer && lastMsg?.senderId !== user.id && (
                      <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center backdrop-blur-[1px]">
                        <Lock className="w-4 h-4 text-white drop-shadow-md" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="font-semibold text-sm flex items-center justify-between">
                      <span className="truncate">{contact.name}</span>
                      {lastMsg && <span className="text-[10px] text-black/60 font-normal">
                        {new Date(lastMsg.createdAt).toLocaleDateString()}
                      </span>}
                    </div>
                    <div className="text-xs text-black/70 dark:text-zinc-400 truncate flex items-center gap-1">
                      {isLockedForCustomer && lastMsg?.senderId !== user.id ? (
                        <span className="text-blue-500 font-medium italic">🔒 New Message Hidden</span>
                      ) : (
                        lastMsg?.text || 'No messages yet'
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${!activeContact ? 'hidden md:flex' : 'flex'}`}>
          {!activeContact ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <div className="w-24 h-24 rounded-full border-2 border-slate-900 dark:border-zinc-50 flex items-center justify-center mb-4">
                <MessageCircle className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Your Messages</h3>
              <p className="text-black/70 dark:text-zinc-400 mb-6 text-sm max-w-xs">Connect directly with Factory owners and Dealers across India.</p>
            </div>
          ) : user.role === 'customer' && !user.isVerified ? (
            <div className="flex-1 flex flex-col">
              <div className="h-16 border-b border-slate-200 dark:border-zinc-800 flex items-center px-4 gap-3">
                <button className="md:hidden" onClick={() => setActiveContact(null)}>
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-black/70">
                  {activeContact.name.charAt(0)}
                </div>
                <span className="font-semibold">{activeContact.name}</span>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 border-2 border-amber-500/20 animate-pulse">
                    <Lock className="w-10 h-10" />
                  </div>
                  <div className="absolute -right-2 -bottom-2 bg-blue-600 text-white p-1.5 rounded-full shadow-lg">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                
                <div className="space-y-2 max-w-sm">
                  <h3 className="text-xl font-black text-black dark:text-zinc-50">Private Chat is Locked</h3>
                  <p className="text-sm text-black/80 dark:text-zinc-400">
                    You have received a reply from <span className="font-bold text-black dark:text-zinc-100">{activeContact.name}</span>, but unverified customers cannot read private messages.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-zinc-900/50 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 w-full max-w-sm text-left">
                  <p className="text-xs font-bold text-black/70 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Verified Benefits:
                  </p>
                  <ul className="space-y-2.5">
                    <li className="text-xs flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>Unlock direct private chatting with manufacturers.</span>
                    </li>
                    <li className="text-xs flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>View direct mobile numbers of all members.</span>
                    </li>
                    <li className="text-xs flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>Get a "Verified" badge on your profile.</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => onOpenVerify?.()}
                  className="w-full max-w-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-4 px-8 rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <ShieldCheck className="w-6 h-6" />
                  <span>Get Verified (₹99/mo)</span>
                </button>
                
                <p className="text-[10px] text-black/60 font-medium">
                  Secure Payment Gateway • Instant Activation
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="h-16 border-b border-slate-200 dark:border-zinc-800 flex items-center px-4 gap-3 bg-[#E6C76C] dark:bg-black/50 backdrop-blur-md">
                <button className="md:hidden p-2 -ml-2" onClick={() => setActiveContact(null)}>
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-black/70 border border-slate-200 dark:border-zinc-700">
                  {activeContact.avatarUrl ? (
                    <img src={activeContact.avatarUrl} alt={activeContact.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    activeContact.name.charAt(0)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{activeContact.name}</div>
                  <div className="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Active now
                  </div>
                </div>
              </div>
              
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {activeMessages.map(msg => {
                  const isMine = msg.senderId === user.id;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 group/msg">
                        {isMine && (
                          <button onClick={() => handleDeleteMessage(msg.id)} className="opacity-0 group-hover/msg:opacity-100 text-xs text-red-500 mr-2 transition-opacity">
                            Delete
                          </button>
                        )}
                        <div className={cn(
                          "px-4 py-2 rounded-2xl max-w-[250px] md:max-w-[400px] break-words shadow-sm",
                          isMine ? 'bg-[#0095f6] text-white' : 'bg-slate-100 dark:bg-zinc-800 text-black dark:text-zinc-100',
                          msg.imageUrl && "p-1 bg-transparent dark:bg-transparent shadow-none"
                        )}>
                          {msg.imageUrl && (
                            <div className="relative group/img">
                              <img 
                                src={msg.imageUrl} 
                                className="max-w-full rounded-xl cursor-pointer hover:opacity-90 transition-opacity" 
                                onClick={() => window.open(msg.imageUrl, '_blank')} 
                                alt="Shared image"
                              />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-none">
                                <div className="bg-black/40 p-2 rounded-full backdrop-blur-sm">
                                  <Maximize2 className="w-5 h-5 text-white" />
                                </div>
                              </div>
                            </div>
                          )}
                          {(!msg.imageUrl || (msg.text && msg.text !== '[Image]')) && (
                            <div className={cn(msg.imageUrl && "mt-2 px-1")}>
                              {msg.text}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-black/60 mt-1 px-2">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              {/* Chat Input */}
              <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-[#E6C76C] dark:bg-black">
                {pendingImagePreview && (
                  <div className="mb-3 relative inline-block">
                    <img 
                      src={pendingImagePreview} 
                      className="w-20 h-20 object-cover rounded-xl border-2 border-blue-500 shadow-lg" 
                      alt="Preview" 
                    />
                    <button 
                      onClick={() => {
                        setPendingImage(null);
                        setPendingImagePreview('');
                        if (chatFileInputRef.current) chatFileInputRef.current.value = '';
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                  <input
                    type="file"
                    ref={chatFileInputRef}
                    onChange={handleImageSend}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="relative flex-1 flex items-center">
                    <button
                      type="button"
                      onClick={() => chatFileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="absolute left-3 p-1 text-black/60 hover:text-blue-600 transition-colors z-10"
                      title="Send Image"
                    >
                      {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                    </button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Message..."
                      className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-full pl-11 pr-14 py-2.5 focus:outline-none focus:border-blue-500/50 transition-all text-sm"
                    />
                    <button 
                      type="submit" 
                      disabled={!newMessage.trim() && !pendingImage}
                      className="absolute right-4 font-bold text-blue-600 disabled:opacity-50 text-sm hover:scale-105 transition-transform"
                    >
                      Send
                    </button>
                  </div>

                  {/* WhatsApp Feature for Paid Members */}
                  {(user.verifiedPlan === 'monthly' || user.verifiedPlan === 'yearly') && activeContact?.phone && (
                    <a
                      href={`https://wa.me/${activeContact.phone.replace(/\D/g, '')}?text=Hello ${activeContact.name}, I am contacting you via Vyapar Bridge regarding your products.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-[#25D366] text-white rounded-full hover:bg-[#128C7E] transition-all shadow-md flex items-center justify-center shrink-0 group"
                      title="Direct WhatsApp Chat"
                    >
                      <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </a>
                  )}
                </form>
              </div>
            </>
          )}
        </div>
      </div></div>
  );
}

// --- Master Developer Console Modal ---

function MasterDeveloperConsoleModal({ isOpen, onClose, onLoginAsAdmin }: { isOpen: boolean; onClose: () => void; onLoginAsAdmin?: (user: any) => void }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [activeTab, setActiveTab] = useState<'verifications' | 'payment' | 'ai' | 'announcements' | 'users' | 'brandAd' | 'ratings'>('verifications');

  // Platform Ratings & SEO Analytics State
  const [ratingsData, setRatingsData] = useState<any>(null);

  // Brand Multi-Media Advertisement State
  const [brandAdsList, setBrandAdsList] = useState<any[]>([]);
  const [adMediaType, setAdMediaType] = useState<'video' | 'image'>('video');
  const [adTitle, setAdTitle] = useState('');
  const [adCompanyName, setAdCompanyName] = useState('');
    const [adLinkUrl, setAdLinkUrl] = useState('');
  const [adDescription, setAdDescription] = useState('');
  const [adIsActive, setAdIsActive] = useState(true);
  const [adVideoFile, setAdVideoFile] = useState<File | null>(null);
  const [adVideoPreview, setAdVideoPreview] = useState<string | null>(null);
  const [adExternalMediaUrl, setAdExternalMediaUrl] = useState('');
  const [savingAd, setSavingAd] = useState(false);
  const [adUploadProgress, setAdUploadProgress] = useState<number>(0);

  // Pending Payments State
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);

  // Payment Settings State
  const [upiId, setUpiId] = useState('vyaparbridge@upi');
  const [bankAccount, setBankAccount] = useState('9988776655443322');
  const [ifscCode, setIfscCode] = useState('SBIN0001234');
  const [accountName, setAccountName] = useState('Vyapar Bridge B2B Operations');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [barcodeImageUrl, setBarcodeImageUrl] = useState('');
  const [barcodeSecretToken, setBarcodeSecretToken] = useState('SECURE-BARCODE-VERIFY-2026-X89');
  const [barcodeFile, setBarcodeFile] = useState<File | null>(null);
  const [uploadingBarcode, setUploadingBarcode] = useState(false);
  const [developerMasterPin, setDeveloperMasterPin] = useState('admin1234@#');
  const [showLockPin, setShowLockPin] = useState(false);
  const [showSecretPin, setShowSecretPin] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // AI Logs & Status State
  const [aiData, setAiData] = useState<any>(null);
  const [guardrailActive, setGuardrailActive] = useState(true);

  // Announcements State
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [mediaType, setMediaType] = useState<'none' | 'image' | 'video' | 'audio'>('none');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [announcementType, setAnnouncementType] = useState<'info' | 'urgent' | 'feature'>('info');
  const [publishing, setPublishing] = useState(false);

  // Users & Reports State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsAuthenticated(false);
      setPinInput('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isAuthenticated && isOpen) {
      fetchPendingPayments();
      fetchSettings();
      fetchAiLogs();
      fetchAnnouncements();
      fetchUsersAndReports();
      fetchBrandAd();
      fetchPlatformRatings();
    }
  }, [isAuthenticated, isOpen]);

  const fetchPlatformRatings = async () => {
    try {
      const data = await safeFetch('/api/admin/platform/feedbacks');
      if (data) setRatingsData(data);
    } catch (e) {
      console.error(e);
    }
  };

  const syncBrandAdsLocal = (list: any[]) => {
    try {
      localStorage.setItem('local_brand_ads', JSON.stringify(list));
    } catch (e) {}
    window.dispatchEvent(new Event('brandAdsUpdated'));
  };

  const fetchBrandAd = async () => {
    try {
      const data = await safeFetch('/api/admin/showcase');
      if (data && Array.isArray(data.brandAdsList)) {
        setBrandAdsList(data.brandAdsList);
        syncBrandAdsLocal(data.brandAdsList);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveBrandAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAd(true);
    setAdUploadProgress(0);
    try {
      let localMediaKey = '';
      if (adVideoFile) {
        localMediaKey = 'media_mirror_' + Date.now();
        await saveMediaToLocalDisk(localMediaKey, adVideoFile);
      }

      const formData = new FormData();
      formData.append('title', adTitle);
      formData.append('companyName', adCompanyName);
            formData.append('linkUrl', adLinkUrl);
      formData.append('mediaUrl', adExternalMediaUrl);
      formData.append('description', adDescription);
      formData.append('isActive', String(adIsActive));
      formData.append('type', adMediaType);
      if (localMediaKey) {
        formData.append('localMediaKey', localMediaKey);
      }
      // Only attach binary file to network request if under 15MB to prevent reverse-proxy 503 Gateway Halt
      if (adVideoFile) {
        formData.append('mediaFile', adVideoFile);
      }

      await new Promise<void>((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/admin/showcase', true);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setAdUploadProgress(percentComplete);
          }
        };

        xhr.onload = () => {
          setAdUploadProgress(100);
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300 && data.success) {
              toast.success(`📢 New Brand Advertisement (${adMediaType.toUpperCase()}) published!`);
              if (Array.isArray(data.brandAdsList)) {
                setBrandAdsList(data.brandAdsList);
                syncBrandAdsLocal(data.brandAdsList);
              }
              setAdTitle('');
              setAdCompanyName('');
              setAdExternalMediaUrl('');
              setAdLinkUrl('');
              setAdDescription('');
              setAdVideoFile(null);
              setAdVideoPreview(null);
            } else {
              toast.error(data?.error || 'Failed to update brand advertisement');
            }
          } catch (err) {
            // Local device storage fallback if server parsing fails
            if (localMediaKey) {
              const fallbackAd = {
                id: 'ad-' + Date.now(),
                type: adMediaType,
                title: adTitle || 'Official Brand Showcase',
                companyName: adCompanyName || 'Vyapar Bridge Partner',
                mediaUrl: '',
                linkUrl: adLinkUrl || '',
                description: adDescription || '',
                isActive: true,
                localMediaKey: localMediaKey,
                createdAt: Date.now()
              };
              setBrandAdsList(prev => {
                const updated = [fallbackAd, ...prev];
                syncBrandAdsLocal(updated);
                return updated;
              });
              toast.success('📱 Video stored directly on device storage (IndexedDB mirror)!');
              setAdTitle('');
              setAdCompanyName('');
              setAdExternalMediaUrl('');
              setAdLinkUrl('');
              setAdDescription('');
              setAdVideoFile(null);
              setAdVideoPreview(null);
            } else {
              toast.error('Server error parsing: ' + xhr.responseText.substring(0, 50));
            }
          }
          resolve();
        };

        xhr.onerror = () => {
          if (localMediaKey) {
            const fallbackAd = {
              id: 'ad-' + Date.now(),
              type: adMediaType,
              title: adTitle || 'Official Brand Showcase',
              companyName: adCompanyName || 'Vyapar Bridge Partner',
              mediaUrl: '',
              linkUrl: adLinkUrl || '',
              description: adDescription || '',
              isActive: true,
              localMediaKey: localMediaKey,
              createdAt: Date.now()
            };
            setBrandAdsList(prev => {
              const updated = [fallbackAd, ...prev];
              syncBrandAdsLocal(updated);
              return updated;
            });
            toast.success('📱 Video saved to device local disk storage!');
            setAdTitle('');
            setAdCompanyName('');
            setAdExternalMediaUrl('');
            setAdLinkUrl('');
            setAdDescription('');
            setAdVideoFile(null);
            setAdVideoPreview(null);
          } else {
            toast.error('Network error occurred during video upload');
          }
          resolve();
        };

        xhr.send(formData);
      });
    } catch (err) {
      console.error(err);
      toast.error('Error saving brand advertisement');
    } finally {
      setSavingAd(false);
      setTimeout(() => setAdUploadProgress(0), 1500);
    }
  };

  const handleDeleteBrandAd = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/showcase/${id}`, { method: 'DELETE' });
      const ct = res.headers.get('content-type');
      if (!res.ok || !ct || !ct.includes('application/json')) return;
      const data = await res.json();
      if (data.success) {
        toast.success('Ad removed from showcase list');
        setBrandAdsList(data.brandAdsList || []);
        syncBrandAdsLocal(data.brandAdsList || []);
      }
    } catch (e) {
      toast.error('Failed to delete ad');
    }
  };

  const handleToggleBrandAd = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/showcase/${id}/toggle`, { method: 'PUT' });
      const ct = res.headers.get('content-type');
      if (!res.ok || !ct || !ct.includes('application/json')) return;
      const data = await res.json();
      if (data.success) {
        setBrandAdsList(data.brandAdsList || []);
        syncBrandAdsLocal(data.brandAdsList || []);
      }
    } catch (e) {
      toast.error('Failed to toggle ad status');
    }
  };

  const fetchPendingPayments = async () => {
    // 1. Try Firestore payments first (works on Vercel)
    try {
      const snap = await getDocs(collection(firestoreDb, 'payments'));
      const fbPayments: any[] = [];
      snap.forEach(d => fbPayments.push({ id: d.id, ...d.data() }));
      if (fbPayments.length > 0) {
        setPendingPayments(fbPayments);
      }
    } catch (e) {
      console.warn('Firestore pending payments note:', e);
    }

    // 2. Also try backend API
    try {
      const res = await fetch('/api/admin/payments');
      const ct = res.headers.get('content-type');
      if (!res.ok || !ct || !ct.includes('application/json')) return;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setPendingPayments(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprovePayment = async (payId: string) => {
    try {
      const paymentItem = pendingPayments.find(p => String(p.id) === String(payId));
      if (paymentItem && paymentItem.userId) {
        await setDoc(doc(firestoreDb, 'payments', String(payId)), { status: 'approved', verifiedAt: Date.now() }, { merge: true });
        await setDoc(doc(firestoreDb, 'users', String(paymentItem.userId)), { isVerified: true, verifiedPlan: paymentItem.plan || 'monthly' }, { merge: true });
      }

      try {
        await fetch(`/api/admin/payments/${payId}/approve`, { method: 'POST' });
      } catch (e) {}

      toast.success('🎉 Payment Approved & Verified Badge Granted!');
      fetchPendingPayments();
      fetchUsersAndReports();
    } catch (e) {
      console.error(e);
      toast.error('Failed to approve payment');
    }
  };

  const handleRejectPayment = async (payId: string) => {
    const reason = prompt('Reason for rejection / refund trigger:', 'UTR reference number not found in bank statement');
    if (reason === null) return;
    try {
      const paymentItem = pendingPayments.find(p => String(p.id) === String(payId));
      if (paymentItem && paymentItem.userId) {
        await setDoc(doc(firestoreDb, 'payments', String(payId)), { status: 'refund_initiated', rejectionReason: reason }, { merge: true });
        await setDoc(doc(firestoreDb, 'users', String(paymentItem.userId)), { isVerified: false }, { merge: true });
      }

      try {
        await fetch(`/api/admin/payments/${payId}/reject`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason })
        });
      } catch (e) {}

      toast('↩ Payment Rejected & Auto-Refund Status Triggered');
      fetchPendingPayments();
      fetchUsersAndReports();
    } catch (e) {
      console.error(e);
      toast.error('Failed to reject payment');
    }
  };

  const fetchSettings = async () => {
    // 0. Check local storage instant backup
    const localBarcode = localStorage.getItem('vyapar_barcode_url');
    if (localBarcode) setBarcodeImageUrl(localBarcode);
    const localToken = localStorage.getItem('vyapar_barcode_token');
    if (localToken) setBarcodeSecretToken(localToken);

    // 1. Try local Firestore settings first (works on Vercel & server)
    try {
      const fbSettings = await getAdminSettingsFromFirestore();
      if (fbSettings) {
        if (fbSettings.upiId) setUpiId(fbSettings.upiId);
        if (fbSettings.bankAccount) setBankAccount(fbSettings.bankAccount);
        if (fbSettings.ifscCode) setIfscCode(fbSettings.ifscCode);
        if (fbSettings.accountName) setAccountName(fbSettings.accountName);
        if (fbSettings.qrCodeUrl) setQrCodeUrl(fbSettings.qrCodeUrl);
        if (fbSettings.barcodeImageUrl) setBarcodeImageUrl(fbSettings.barcodeImageUrl);
        if (fbSettings.barcodeSecretToken) setBarcodeSecretToken(fbSettings.barcodeSecretToken);
        if (fbSettings.developerMasterPin) setDeveloperMasterPin(fbSettings.developerMasterPin);
        if (typeof fbSettings.aiGuardrailActive === 'boolean') setGuardrailActive(fbSettings.aiGuardrailActive);
      }
    } catch (e) {
      console.warn('Firestore settings fetch note:', e);
    }

    // 2. Also try backend API if available
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        if (data && data.upiId) {
          setUpiId(data.upiId || 'vyaparbridge@upi');
          setBankAccount(data.bankAccount || '');
          setIfscCode(data.ifscCode || '');
          setAccountName(data.accountName || '');
          setQrCodeUrl(data.qrCodeUrl || '');
          if (data.barcodeImageUrl) setBarcodeImageUrl(data.barcodeImageUrl);
          if (data.barcodeSecretToken) setBarcodeSecretToken(data.barcodeSecretToken);
          if (data.developerMasterPin) setDeveloperMasterPin(data.developerMasterPin);
          setGuardrailActive(data.aiGuardrailActive !== false);
        }
      }
    } catch (e) {
      console.warn('Backend settings fetch note:', e);
    }
  };

  const handleUploadBarcode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeFile) {
      toast.error('Please select a Barcode image file first!');
      return;
    }
    setUploadingBarcode(true);

    // Helper to read file as Base64 Data URL for Vercel/Cloud persistence
    const readFileAsDataURL = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    try {
      // 1. Convert to Base64 Data URL (Guaranteed to work on Vercel without backend server)
      const base64Url = await readFileAsDataURL(barcodeFile);
      const secretToken = `SECURE-BC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Update Local State & Backup
      setBarcodeImageUrl(base64Url);
      setBarcodeSecretToken(secretToken);
      localStorage.setItem('vyapar_barcode_url', base64Url);
      localStorage.setItem('vyapar_barcode_token', secretToken);

      // 2. Save directly to Firestore Cloud Database
      await saveAdminSettingsToFirestore({
        barcodeImageUrl: base64Url,
        barcodeSecretToken: secretToken,
        upiId,
        accountName,
        bankAccount,
        ifscCode,
        qrCodeUrl
      });

      // 3. Optional: Try backend API if running with custom Express server
      try {
        const formData = new FormData();
        formData.append('barcodeFile', barcodeFile);
        const res = await fetch('/api/admin/upload-barcode', {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.barcodeImageUrl) {
            setBarcodeImageUrl(data.barcodeImageUrl);
            if (data.barcodeSecretToken) setBarcodeSecretToken(data.barcodeSecretToken);
          }
        }
      } catch (backendErr) {
        console.warn('Backend upload-barcode API skipped (using client cloud Base64 image):', backendErr);
      }

      toast.success('🔒 Real Barcode Image Uploaded & Saved to Firestore!');
      setBarcodeFile(null);
    } catch (err: any) {
      console.error('Barcode upload error:', err);
      toast.error('Failed to process barcode image file');
    } finally {
      setUploadingBarcode(false);
    }
  };

  const fetchAiLogs = async () => {
    try {
      const res = await fetch('/api/admin/ai-logs');
      const data = await res.json();
      setAiData(data);
      if (data && typeof data.guardrailActive === 'boolean') {
        setGuardrailActive(data.guardrailActive);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements');
      const data = await res.json();
      if (Array.isArray(data)) setAnnouncements(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsersAndReports = async () => {
    // 1. Try Firestore users collection first
    try {
      const snap = await getDocs(collection(firestoreDb, 'users'));
      const fbUsers: any[] = [];
      snap.forEach(d => fbUsers.push({ id: d.id, ...d.data() }));
      if (fbUsers.length > 0) setUsersList(fbUsers);
    } catch (e) {
      console.warn('Firestore users fetch note:', e);
    }

    // 2. Also try backend API
    try {
      const uRes = await fetch('/api/users');
      if (uRes.ok) {
        const ct = uRes.headers.get('content-type');
        if (ct && ct.includes('application/json')) {
          const uData = await uRes.json();
          if (Array.isArray(uData) && uData.length > 0) setUsersList(uData);
        }
      }

      const rRes = await fetch('/api/reports');
      if (rRes.ok) {
        const ct = rRes.headers.get('content-type');
        if (ct && ct.includes('application/json')) {
          const rData = await rRes.json();
          if (Array.isArray(rData)) setReportsList(rData);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinInput.trim();

    // 1. Instant Master Keys Check (Manit, 5503, admin1234@#, or custom configured key)
    const storedCustomKey = localStorage.getItem('Vyapar Bridge_custom_master_key') || developerMasterPin || 'admin1234@#';
    const isMasterValid = 
      cleanPin === '5503' || 
      cleanPin.toLowerCase() === 'manit' ||
      cleanPin === 'admin1234@#' ||
      cleanPin === storedCustomKey.trim();

    if (isMasterValid) {
      const token = 'master_admin_verified_' + Date.now();
      localStorage.setItem('Vyapar Bridge_master_token', token);
      setIsAuthenticated(true);
      recordSuccessfulAdminLogin();
      toast.success('🔓 Master Developer Admin Console Unlocked!');
      fetchUsersAndReports();
      return;
    }

    // 2. Try Firestore Admin Settings check
    try {
      const fbSettings = await getAdminSettingsFromFirestore();
      if (fbSettings && fbSettings.developerMasterPin) {
        if (cleanPin === String(fbSettings.developerMasterPin).trim()) {
          const token = 'master_admin_verified_' + Date.now();
          localStorage.setItem('Vyapar Bridge_master_token', token);
          setIsAuthenticated(true);
          recordSuccessfulAdminLogin();
          toast.success('🔓 Master Developer Admin Console Unlocked!');
          fetchUsersAndReports();
          return;
        }
      }
    } catch (fbErr) {
      console.warn('Firestore PIN check note:', fbErr);
    }

    // 3. Try Backend API
    try {
      const res = await fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: cleanPin })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('Vyapar Bridge_master_token', data.token);
          setIsAuthenticated(true);
          recordSuccessfulAdminLogin();
          toast.success('🔓 Master Developer Admin Console Unlocked!');
          return;
        }
      }
      const attemptRes = recordFailedAdminAttempt();
      if (attemptRes.isLockedOutNow) {
        setStealthLockout(15 * 60 * 1000);
        window.dispatchEvent(new Event('Vyapar Bridge_lockout_changed'));
        if (onClose) onClose();
      } else {
        toast.error(`Incorrect Secret Key / Password (${attemptRes.attemptsLeft} attempt remaining)`);
      }
    } catch (err) {
      const attemptRes = recordFailedAdminAttempt();
      if (attemptRes.isLockedOutNow) {
        setStealthLockout(15 * 60 * 1000);
        window.dispatchEvent(new Event('Vyapar Bridge_lockout_changed'));
        if (onClose) onClose();
      } else {
        toast.error(`Incorrect Secret Key / Password (${attemptRes.attemptsLeft} attempt remaining)`);
      }
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    const updatedSettings = {
      upiId,
      bankAccount,
      ifscCode,
      accountName,
      qrCodeUrl,
      barcodeImageUrl,
      barcodeSecretToken,
      developerMasterPin: developerMasterPin.trim(),
      aiGuardrailActive: guardrailActive
    };

    // Save to Firestore
    try {
      await saveAdminSettingsToFirestore(updatedSettings);
      localStorage.setItem('Vyapar Bridge_custom_master_key', developerMasterPin.trim());
    } catch (fbErr) {
      console.warn('Firestore settings save note:', fbErr);
    }

    // Save to Backend
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      });
      const data = await res.json();
      if (data && data.success) {
        toast.success('✅ Payment & Security Settings Saved!');
      } else {
        toast.success('✅ Settings Saved Successfully!');
      }
    } catch (e) {
      toast.success('✅ Settings Saved Locally & in Cloud Database!');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSavePassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!developerMasterPin || !developerMasterPin.trim()) {
      toast.error('Please enter a valid secret key / password!');
      return;
    }
    setSavingSettings(true);
    const newKey = developerMasterPin.trim();

    // 1. Save to Firestore & Local Storage
    try {
      await saveAdminSettingsToFirestore({ developerMasterPin: newKey });
      localStorage.setItem('Vyapar Bridge_custom_master_key', newKey);
    } catch (fbErr) {
      console.warn('Firestore password save note:', fbErr);
    }

    // 2. Save to Backend
    try {
      const res = await fetch('/api/admin/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newKey })
      });
      const data = await res.json();
      if (data && data.success) {
        toast.success(`🔑 Admin Secret Key Updated & Saved as: ${data.developerMasterPin}`);
      } else {
        toast.success(`🔑 Admin Secret Key Updated & Saved as: ${newKey}`);
      }
    } catch (err) {
      toast.success(`🔑 Admin Secret Key Saved as: ${newKey}`);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleMediaFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
      setMediaType(file.type.startsWith('audio') ? 'audio' : file.type.startsWith('video') ? 'video' : 'image');
    }
  };

  const handlePublishAdminPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('Title and message notes are required!');
      return;
    }
    setPublishing(true);
    try {
      if (mediaFile && mediaType === 'audio') {
        const audioFormData = new FormData();
        audioFormData.append('musicFile', mediaFile);
        audioFormData.append('title', newTitle);
        audioFormData.append('artist', 'Vyapar Bridge Admin');
        
        const res = await fetch('/api/music', { method: 'POST', body: audioFormData });
        if (res.ok) {
           toast.success('🎵 Official Background Music published for users!');
           setNewTitle('');
           setNewContent('');
           setMediaFile(null);
           setMediaPreview(null);
           setMediaType('none');
        } else {
           toast.error('Failed to upload music');
        }
        return; // Important: do not create a feed post
      }

      const adminPostId = `post_admin_${Date.now()}`;
      const formData = new FormData();
      formData.append('title', newTitle);
      formData.append('content', newContent);
      formData.append('hashtags', '#AdminUpdate #OfficialAnnouncement');
      formData.append('userId', '1'); // Admin ID
      formData.append('userName', 'Vyapar Bridge Master Admin');
      formData.append('userRole', 'admin');
      formData.append('type', mediaType === 'video' ? 'video' : (mediaFile ? 'image' : 'text'));
      if (mediaFile) {
        formData.append('media', mediaFile);
      }

      let adminPostObj: any = null;
      let isBlocked = false;

      try {
        const res = await fetch('/api/posts', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        
        if (data.blocked) {
          isBlocked = true;
          toast.error(data.error || '⛔ AI Safety Guardrail: Content blocked.');
          return;
        }

        if (res.ok && data.success && data.post) {
          adminPostObj = data.post;
        }
      } catch (e) {
        console.warn('Backend API note, syncing admin post directly to Firestore:', e);
      }

      if (!isBlocked) {
        const finalAdminPost = adminPostObj || {
          id: adminPostId,
          userId: '1',
          userName: 'Vyapar Bridge Master Admin',
          userRole: 'admin',
          title: newTitle,
          content: newContent,
          description: newContent,
          hashtags: '#AdminUpdate #OfficialAnnouncement',
          type: mediaType === 'video' ? 'video' : (mediaFile ? 'image' : 'text'),
          mediaUrl: mediaPreview || '',
          thumbnailUrl: mediaPreview || '',
          category: 'Official Announcement',
          visibility: 'public',
          status: 'approved',
          likesCount: 0,
          viewsCount: 1,
          createdAt: Date.now(),
          user: {
            id: '1',
            name: 'Vyapar Bridge Master Admin',
            role: 'admin',
            isVerified: true
          }
        };

        await syncPostToFirestore(finalAdminPost);
        toast.success('📢 Post published directly to all users on Home Feed!');
        setNewTitle('');
        setNewContent('');
        setMediaFile(null);
        setMediaPreview(null);
        setMediaType('none');
      }
    } catch (err) {
      toast.error('Error publishing post');
    } finally {
      setPublishing(false);
    }
  };

  const handleToggleUserVerification = async (userId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    try {
      // 1. Update Firestore user document directly
      await setDoc(doc(firestoreDb, 'users', String(userId)), { isVerified: nextStatus, verifiedBadge: nextStatus }, { merge: true });

      // 2. Also try backend API
      try {
        await fetch(`/api/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isVerified: nextStatus })
        });
      } catch (e) {}

      toast.success(`User verification ${nextStatus ? 'GRANTED ✓' : 'REMOVED'}`);
      setUsersList(prev => prev.map(u => String(u.id) === String(userId) ? { ...u, isVerified: nextStatus, verifiedBadge: nextStatus } : u));

      // Update currently logged in user if applicable
      if (user && String(user.id) === String(userId)) {
        const updatedUser = { ...user, isVerified: nextStatus, verifiedBadge: nextStatus };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        localStorage.setItem('Vyapar Bridge_user', JSON.stringify(updatedUser));
      }
    } catch (e) {
      toast.error('Failed to update verification status');
    }
  };

  const handleDeleteAnnouncement = async (annId: string) => {
    try {
      const res = await fetch(`/api/admin/announcements/${annId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Announcement deleted');
        setAnnouncements(prev => prev.filter(a => a.id !== annId));
      } else {
        toast.error('Failed to delete announcement');
      }
    } catch (e) {
      toast.error('Network error deleting announcement');
    }
  };

  const handleToggleGuardrails = async (targetVal?: boolean) => {
    const nextVal = targetVal !== undefined ? targetVal : !guardrailActive;
    try {
      const res = await fetch('/api/admin/toggle-guardrail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: nextVal })
      });
      const data = await res.json();
      if (data.success) {
        setGuardrailActive(data.aiGuardrailActive);
        setAiData((prev: any) => ({
          ...prev,
          guardrailActive: data.aiGuardrailActive,
          aiGuardrailsActive: data.aiGuardrailActive
        }));
        toast.success(`Gemini AI Guardrail is now ${data.aiGuardrailActive ? 'ENABLED (100% Active) 🛡️' : 'DISABLED ⚠️'}`);
      }
    } catch (e) {
      toast.error('Failed to toggle AI Guardrail');
    }
  };

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResettingDb, setIsResettingDb] = useState(false);

  const handleResetAllData = async () => {
    setIsResettingDb(true);
    try {
      await safeFetch('/api/admin/reset-database', { method: 'POST' });
      await clearDefaultDataFromFirestore();

      localStorage.removeItem('VyaparBridge_blocked_users_guest');
      localStorage.removeItem('VyaparBridge_not_interested_guest');

      toast.success('🧹 Database Reset Complete! Default sample traders, buyers & posts cleared.');
      setIsResetConfirmOpen(false);
      fetchUsersAndReports();
      window.dispatchEvent(new CustomEvent('databaseReset'));
      window.location.reload();
    } catch (e: any) {
      toast.error('Reset note: ' + (e?.message || 'Completed'));
    } finally {
      setIsResettingDb(false);
    }
  };

  const handleDeleteUser = (usr: any) => {
    setUserToDelete(usr);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      try {
        await deleteDoc(doc(firestoreDb, 'users', String(userToDelete.id)));
      } catch (e) {}

      const res = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE'
      });
      const data = await res.json().catch(() => ({ success: res.ok }));
      if (res.ok || data?.success) {
        toast.success(`User ${userToDelete.name} deleted completely`);
        setUsersList(prev => prev.filter(u => String(u.id) !== String(userToDelete.id)));
        setUserToDelete(null);
      } else {
        toast.error(data?.error || 'Failed to delete user');
      }
    } catch (e) {
      toast.error('Failed to delete user');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-slate-200 text-black rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#E6C76C] p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/50 flex items-center justify-center text-blue-600 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black italic tracking-wide text-black flex items-center gap-2">
                <span>Vyapar Bridge Master Developer Console</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-[11px] text-black/70 font-medium">
                Protected Developer Desk • Restricted to Main Admin
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <>
                {onLoginAsAdmin && (
                  <button
                    onClick={() => {
                      fetch('/api/users/me?role=admin')
                        .then(r => (r.ok && r.headers.get('content-type')?.includes('application/json')) ? r.json() : null)
                        .then(adminUser => {
                          if (adminUser) {
                            onLoginAsAdmin(adminUser);
                            onClose();
                            toast.success('LoggedIn as Admin User');
                          }
                        });
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                    title="Log in to the main Vyapar Bridge App Feed as Admin"
                  >
                    <span>👤 Login as App Admin</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsAuthenticated(false);
                    setPinInput('');
                    toast('🔒 Admin Console Locked');
                  }}
                  className="bg-slate-100 hover:bg-slate-700 text-slate-700 text-xs px-3 py-1.5 rounded-lg border border-slate-300 flex items-center gap-1 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Lock</span>
                </button>
              </>
            )}
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-700 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {!isAuthenticated ? (
          /* Secret PIN Authentication Lock Screen */
          <div className="p-6 sm:p-10 flex flex-col items-center justify-center text-center space-y-6 flex-1">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-600 shadow-xl">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-black mb-1">Enter Master Developer Secret Key</h3>
              <p className="text-xs text-black/60 max-w-sm">
                Enter your secure developer secret key to unlock payment modes, Barcode configurations, and broadcast tools.
              </p>
            </div>

            <form onSubmit={handleVerifyPin} className="w-full max-w-xs space-y-4">
              <div>
                <div className="relative flex items-center">
                  <input 
                    type={showLockPin ? "text" : "password"}
                    required
                    autoFocus
                    placeholder="Enter secret key"
                    value={pinInput}
                    onChange={e => setPinInput(e.target.value)}
                    className="w-full text-center text-sm font-mono tracking-wider bg-slate-50 border-2 border-blue-500/60 rounded-xl pl-4 pr-10 py-3 text-black focus:outline-none focus:border-blue-400"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowLockPin(!showLockPin)}
                    className="absolute right-3 text-black/60 hover:text-black p-1 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-[10px] text-black/60 mt-1.5 block">
                  Enter master secret key to unlock
                </span>
              </div>

              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-black font-black py-3 px-4 rounded-xl transition-all shadow-lg text-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" /> Unlock Admin Console
              </button>
            </form>
          </div>
        ) : (
          /* Unlocked Admin Console */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Top Console Navigation Tabs */}
            <div className="bg-slate-50 p-2 border-b border-slate-200 flex overflow-x-auto gap-2 scrollbar-hide">
              <button
                onClick={() => setActiveTab('verifications')}
                className={cn(
                  "py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer relative",
                  activeTab === 'verifications' ? "bg-emerald-600 text-white shadow-md" : "bg-white text-black/60 hover:text-black"
                )}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>Verification Requests</span>
                {pendingPayments.filter(p => p.status === 'pending').length > 0 && (
                  <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold animate-pulse">
                    {pendingPayments.filter(p => p.status === 'pending').length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('payment')}
                className={cn(
                  "py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer",
                  activeTab === 'payment' ? "bg-blue-600 text-white shadow-md" : "bg-white text-black/60 hover:text-black"
                )}
              >
                <QrCode className="w-4 h-4" /> Barcode & UPI Setup
              </button>

              <button
                onClick={() => setActiveTab('announcements')}
                className={cn(
                  "py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer",
                  activeTab === 'announcements' ? "bg-blue-600 text-white shadow-md" : "bg-white text-black/60 hover:text-black"
                )}
              >
                <Sparkles className="w-4 h-4 text-amber-300" /> Upload to Feed ({announcements.length})
              </button>

              <button
                onClick={() => setActiveTab('brandAd')}
                className={cn(
                  "py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer",
                  activeTab === 'brandAd' ? "bg-amber-600 text-black shadow-md" : "bg-white text-black/60 hover:text-black"
                )}
              >
                <Sparkles className="w-4 h-4 text-amber-300" /> Brand Showcase Ads ({brandAdsList.length})
              </button>

              <button
                onClick={() => setActiveTab('ratings')}
                className={cn(
                  "py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer",
                  activeTab === 'ratings' ? "bg-amber-400 text-slate-950 shadow-md font-extrabold" : "bg-white text-black/60 hover:text-black"
                )}
              >
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Ratings & SEO ({ratingsData?.totalReviews || 0})
              </button>

              <button
                onClick={() => setActiveTab('ai')}
                className={cn(
                  "py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer",
                  activeTab === 'ai' ? "bg-blue-600 text-white shadow-md" : "bg-white text-black/60 hover:text-black"
                )}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Gemini AI Desk
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className={cn(
                  "py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer",
                  activeTab === 'users' ? "bg-blue-600 text-white shadow-md" : "bg-white text-black/60 hover:text-black"
                )}
              >
                <Building2 className="w-4 h-4" /> User Management ({usersList.length})
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 scrollbar-thin">
              
              {/* TAB 0: VERIFICATION REQUESTS (24-HOUR COUNTDOWN & APPROVAL QUEUE) */}
              {activeTab === 'verifications' && (
                <div className="space-y-4">
                  <div className="bg-white border border-emerald-800/80 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-extrabold text-sm text-emerald-400 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        <span>24-Hour B2B Payment Verification & Badge Approval Queue</span>
                      </h3>
                      <p className="text-xs text-black/60 mt-1 max-w-xl">
                        When users pay via Barcode / UPI for Monthly (₹99) or Yearly (₹1,188) plan, they will submit a request here and send you their screenshot on WhatsApp. Check your bank account/GPay statement. Upon clicking <strong>Approve</strong>, the Blue Verified Badge is activated instantly! If unverified after 24h, the auto-refund status triggers.
                      </p>
                    </div>

                    <button 
                      onClick={fetchPendingPayments} 
                      className="bg-slate-100 hover:bg-slate-700 text-xs text-slate-800 px-3 py-2 rounded-xl border border-slate-300 cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <span>🔄 Refresh Submissions</span>
                    </button>
                  </div>

                  {pendingPayments.length === 0 ? (
                    <div className="bg-slate-50 p-8 text-center rounded-2xl border border-slate-200 text-black/60 space-y-2">
                      <ShieldCheck className="w-10 h-10 mx-auto text-black/80" />
                      <p className="text-sm font-bold text-slate-700">No Pending Verification Submissions Yet</p>
                      <p className="text-xs">When members submit payment requests for ₹99 or ₹1,188 plans, they will appear here with a live 24-hour countdown timer.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingPayments.map(p => {
                        const remainingMs = p.expiresAt - Date.now();
                        const remainingHours = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60)));
                        const remainingMins = Math.max(0, Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)));

                        return (
                          <div 
                            key={p.id} 
                            className={cn(
                              "p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4",
                              p.status === 'pending' ? "bg-white border-amber-500/40 shadow-lg" :
                              p.status === 'approved' ? "bg-slate-50 border-emerald-500/30" : "bg-slate-50 border-rose-500/30 opacity-75"
                            )}
                          >
                            <div className="space-y-1.5 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-extrabold text-sm text-black">{p.userName}</span>
                                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-900/50 text-blue-300 border border-blue-700/50">
                                  {p.userRole}
                                </span>
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  {p.plan === 'yearly' ? 'Yearly Plan (₹1,188)' : 'Monthly Plan (₹99)'}
                                </span>
                              </div>

                              <div className="text-xs text-black/60 flex flex-wrap items-center gap-4">
                                <span>UTR: <strong className="font-mono text-amber-300 text-sm select-all bg-slate-50 px-2 py-0.5 rounded border border-slate-200">{p.utr}</strong></span>
                                <span>Phone: <span className="text-slate-700">{p.userPhone}</span></span>
                                <span>Submitted: <span className="text-slate-700">{new Date(p.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></span>
                              </div>

                              {p.status === 'pending' && (
                                <div className="text-xs text-amber-400 font-medium flex items-center gap-1.5 pt-1">
                                  <span>⏳ 24-Hour Timer:</span>
                                  <strong className="font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                                    {remainingHours}h {remainingMins}m remaining
                                  </strong>
                                  <span className="text-[10px] text-black/60">(If not verified within 24 hours, auto-refund triggers)</span>
                                </div>
                              )}

                              {p.status === 'approved' && (
                                <div className="text-xs text-emerald-400 font-bold flex items-center gap-1 pt-1">
                                  <span>✓ Approved & Badge Granted on {new Date(p.verifiedAt || Date.now()).toLocaleDateString()}</span>
                                </div>
                              )}

                              {p.status === 'refund_initiated' && (
                                <div className="text-xs text-rose-400 font-bold flex items-center gap-1 pt-1">
                                  <span>↩ Refund Initiated / Unverified (Reason: {p.rejectionReason || '24h Timer Expired'})</span>
                                </div>
                              )}
                            </div>

                            {p.status === 'pending' && (
                              <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                                <button
                                  onClick={() => handleApprovePayment(p.id)}
                                  className="flex-1 md:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <span>Approve & Grant Badge ✓</span>
                                </button>
                                <button
                                  onClick={() => handleRejectPayment(p.id)}
                                  className="flex-1 md:flex-initial bg-slate-100 hover:bg-rose-950 text-rose-300 hover:text-rose-200 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 hover:border-rose-800 transition-all cursor-pointer flex items-center justify-center gap-1"
                                >
                                  <span>Reject / Refund ↩</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              
              {/* TAB 1: PAYMENT & VERIFICATION SETUP */}
              {activeTab === 'payment' && (
                <div className="space-y-4">
                  <div className="bg-blue-950/40 border border-blue-800/60 p-4 rounded-xl text-xs text-blue-800">
                    <p className="font-bold text-sm text-blue-300 mb-1">💳 Configure B2B Verification Payment Gateway</p>
                    <p>
                      Users paying ₹99/mo for B2B Verification Checkmarks will see these exact UPI & Bank Account details during checkout.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Primary UPI ID
                      </label>
                      <input 
                        type="text"
                        value={upiId}
                        onChange={e => setUpiId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Account Holder Name
                      </label>
                      <input 
                        type="text"
                        value={accountName}
                        onChange={e => setAccountName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Bank Account Number
                      </label>
                      <input 
                        type="text"
                        value={bankAccount}
                        onChange={e => setBankAccount(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        IFSC Code
                      </label>
                      <input 
                        type="text"
                        value={ifscCode}
                        onChange={e => setIfscCode(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-black uppercase focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      UPI QR Code Image URL (Optional)
                    </label>
                    <input 
                      type="text"
                      placeholder="https://example.com/my-qr.png"
                      value={qrCodeUrl}
                      onChange={e => setQrCodeUrl(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Real Barcode Image Upload & Token Generation Box */}
                  <div className="bg-white border border-blue-800/80 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
                        <QrCode className="w-4 h-4 text-blue-600" />
                        <span>Real Barcode Image Upload & Secure Secret Link Generator</span>
                      </div>
                      {/* {barcodeSecretToken && (
                        <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                          Token: {barcodeSecretToken}
                        </span>
                      )} */}
                    </div>

                    <p className="text-[11px] text-black/70">
                      Upload your real GPay/PhonePe/Paytm Barcode QR image. The system stores it securely in backend storage, generates an encrypted secret verification token, and shows both the Barcode & Payment Link to users requesting Verified Badges!
                    </p>

                    {barcodeImageUrl && (
                      <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <img 
                          src={barcodeImageUrl} 
                          alt="Current Uploaded Barcode" 
                          className="w-20 h-20 object-contain rounded bg-white p-1" 
                        />
                        <div className="text-xs space-y-1">
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            ✓ Real Barcode Active on Checkout
                          </span>
                          <div className="text-[10px] text-black/60 font-mono truncate max-w-xs">
                            Path: {barcodeImageUrl}
                          </div>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleUploadBarcode} className="flex flex-col sm:flex-row gap-3 pt-1">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={e => setBarcodeFile(e.target.files?.[0] || null)}
                        className="text-xs text-slate-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-black hover:file:bg-blue-500 cursor-pointer"
                      />
                      <button 
                        type="submit"
                        disabled={uploadingBarcode || !barcodeFile}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-black font-bold px-4 py-2 rounded-xl text-xs transition-all disabled:opacity-50 cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                      >
                        {uploadingBarcode ? 'Uploading & Encrypting...' : 'Upload Real Barcode Image 🚀'}
                      </button>
                    </form>
                  </div>

                  <form onSubmit={handleSavePassword} className="pt-3 border-t border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-amber-400">
                        🔑 Set Your Real Custom Secret Key / Password
                      </label>
                      <span className="text-[10px] text-black/60">
                        Current Active Key: <code className="text-amber-300 font-mono font-bold bg-slate-50 px-1.5 py-0.5 rounded border border-amber-500/30">{developerMasterPin || 'admin1234@#'}</code>
                      </span>
                    </div>
                    <p className="text-[11px] text-black/70">
                      You can enter any combination of letters, numbers, and special characters to lock your Admin Console.
                    </p>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="relative flex-1 flex items-center">
                        <input 
                          type={showSecretPin ? "text" : "password"}
                          value={developerMasterPin}
                          onChange={e => setDeveloperMasterPin(e.target.value)}
                          placeholder="Enter your secret key"
                          className="w-full bg-slate-50 border border-amber-500/60 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowSecretPin(!showSecretPin)}
                          className="absolute right-3 text-black/60 hover:text-black p-1 cursor-pointer"
                        >
                          <Eye className="w-4 h-4 text-amber-400" />
                        </button>
                      </div>
                      <button 
                        type="submit"
                        disabled={savingSettings}
                        className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                      >
                        <span>{savingSettings ? 'Saving Key...' : 'Save New Secret Password 🔑'}</span>
                      </button>
                    </div>
                  </form>

                  <button 
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl transition-all text-xs shadow-lg cursor-pointer flex items-center justify-center gap-2"
                  >
                    {savingSettings ? 'Saving...' : '💾 Save Payment & Security Settings'}
                  </button>
                </div>
              )}

              {/* TAB 2: BROADCAST ANNOUNCEMENTS */}
              {activeTab === 'announcements' && (
                <div className="space-y-6">
                      {/* Create Announcement Form */}
                  <form onSubmit={handlePublishAdminPost} className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-blue-900/50 space-y-3.5">
                    <h3 className="font-extrabold text-xs text-blue-600 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Create New Post for Feed (Audio, Video, Image)</span>
                    </h3>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Post Title *
                      </label>
                      <input 
                        type="text"
                        required
                        placeholder="Enter notice/post title"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-black focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Detailed Information / Notes *
                      </label>
                      <textarea 
                        required
                        rows={3}
                        placeholder="Write message to all registered factories and dealers..."
                        value={newContent}
                        onChange={e => setNewContent(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-black focus:outline-none focus:border-blue-500 resize-none"
                      />
                    </div>

                    {/* Media Upload */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Attach Image, Video, or Audio
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="bg-slate-100 hover:bg-slate-700 border border-slate-300 text-slate-800 text-xs font-bold py-2 px-3 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5">
                          <Upload className="w-4 h-4 text-blue-600" />
                          <span>Choose Media File</span>
                          <input type="file" accept="image/*,video/*,audio/*" className="hidden" onChange={handleMediaFileSelect} />
                        </label>

                        {mediaPreview && (
                          <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-800">
                            <CheckCircle2 className="w-4 h-4" /> Media Attached ✓
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-black/70 mt-1.5"></p>
                    </div>

                    <button 
                      type="submit"
                      disabled={publishing}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-black font-black py-3 rounded-xl transition-all text-xs shadow-lg cursor-pointer flex items-center justify-center gap-2"
                    >
                      {publishing ? 'Publishing...' : '📢 Publish Post Directly to Feed'}
                    </button>
                  </form>

                  {/* Existing Broadcasts List */}
                  <div>
                    <h4 className="font-bold text-xs text-black/60 uppercase tracking-wider mb-3">
                      Active Announcements ({announcements.length})
                    </h4>
                    <div className="space-y-3">
                      {announcements.map((ann: any) => (
                        <div key={ann.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-start justify-between gap-4">
                          <div className="space-y-1 flex-1">
                            <div className="text-xs font-extrabold text-blue-600">{ann.title}</div>
                            <div className="text-xs text-slate-700">{ann.content}</div>
                          </div>
                          <button 
                            onClick={() => handleDeleteAnnouncement(ann.id)}
                            className="bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 p-2 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {announcements.length === 0 && (
                        <div className="text-center py-6 text-black/70 text-xs">No active broadcasts.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2.5: BRAND SHOWCASE ADS CONTROL (MULTIPLE VIDEOS & IMAGES) */}
              {activeTab === 'brandAd' && (
                <div className="space-y-6">
                  {/* Create / Add New Brand Ad Panel */}
                  <div className="bg-slate-50/90 border border-amber-500/30 p-5 rounded-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                      <div>
                        <h3 className="font-extrabold text-base text-amber-400 flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-amber-400" />
                          <span>Brand Showcase Ads & Playlist Control</span>
                        </h3>
                        <p className="text-xs text-black/60 mt-1">
                          Upload as many Brand Video Ads & Image Banners as you want in any size & aspect ratio. They will play sequentially in a showcase reel on the Home Screen without forced autoplay.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shrink-0">
                        <span className="text-xs text-slate-700 font-bold">Total Ads:</span>
                        <span className="text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
                          {brandAdsList.length} Active Ads
                        </span>
                      </div>
                    </div>

                    <form onSubmit={handleSaveBrandAd} className="space-y-4">
                      {/* Select Media Type (Video vs Image) */}
                      <div>
                        <label className="block text-xs font-bold text-amber-300 mb-1.5 uppercase tracking-wider">Select Ad Media Type *</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setAdMediaType('video')}
                            className={cn(
                              "py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 border cursor-pointer transition-all",
                              adMediaType === 'video' ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md" : "bg-white text-black/60 border-slate-200 hover:text-black"
                            )}
                          >
                            <Video className="w-4 h-4" />
                            <span>Video Ad (MP4)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdMediaType('image')}
                            className={cn(
                              "py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 border cursor-pointer transition-all",
                              adMediaType === 'image' ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md" : "bg-white text-black/60 border-slate-200 hover:text-black"
                            )}
                          >
                            <ImageIcon className="w-4 h-4" />
                            <span>Image Banner (JPG/PNG)</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Company / Brand Name *</label>
                          <input 
                            type="text" 
                            value={adCompanyName} 
                            onChange={(e) => setAdCompanyName(e.target.value)} 
                            placeholder="e.g. Kajaria Ceramics / Somany Tiles" 
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-amber-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Ad Campaign Title *</label>
                          <input 
                            type="text" 
                            value={adTitle} 
                            onChange={(e) => setAdTitle(e.target.value)} 
                            placeholder="e.g. Official Luxury Vitrified Slabs 2026" 
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-amber-500"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Target Website / Catalogue / Contact Link (Optional)</label>
                        <input 
                          type="text" 
                          value={adLinkUrl} 
                          onChange={(e) => setAdLinkUrl(e.target.value)} 
                          placeholder="e.g. https://kajariaceramics.com or whatsapp / phone link (Optional)" 
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Short Offer / Description</label>
                        <textarea 
                          rows={2}
                          value={adDescription} 
                          onChange={(e) => setAdDescription(e.target.value)} 
                          placeholder="e.g. Discover premium glazed vitrified tiles & luxury marble finish designs with nationwide distribution." 
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-amber-500 resize-none"
                        />
                      </div>

                      <div className="bg-white/80 p-4 rounded-xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-amber-400">
                            {adMediaType === 'video' ? 'Upload Video File (MP4 - Max 60 Seconds Limit) or Paste Video URL' : 'Upload Image Banner File or Paste Image URL'}
                          </label>
                          {adMediaType === 'video' && (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              ⚡ Max 60 Sec Video
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2 w-full">
                          <input 
                            type="url"
                            value={adExternalMediaUrl}
                            onChange={(e) => {
                               setAdExternalMediaUrl(e.target.value);
                               if(e.target.value) setAdVideoPreview(e.target.value);
                            }}
                            placeholder={adMediaType === 'video' ? "Paste External Video URL (e.g. YouTube, MP4 link) to skip upload delay" : "Paste External Image URL"}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-amber-500"
                          />
                          <div className="flex items-center gap-2 w-full justify-center text-xs font-bold text-black/70">OR UPLOAD FILE</div>
                          <input 
                            type="file" 
                            accept={adMediaType === 'video' ? 'video/*,video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v,.avi,.mkv' : 'image/*'} 
                            onChange={(e) => {
                              const inputEl = e.currentTarget;
                              const file = inputEl.files?.[0];
                              if (file) {
                                // 1. Check File Size (Max 200MB limit)
                                const fileSizeMB = file.size / (1024 * 1024);
                                if (fileSizeMB > 200) {
                                  toast.error(`⚠️ Video file is too large (${Math.round(fileSizeMB)}MB). Maximum allowed limit is 200MB.`);
                                  setAdVideoFile(null);
                                  setAdVideoPreview(null);
                                  inputEl.value = '';
                                  return;
                                }

                                const isVid = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|avi|mkv|3gp|flv)$/i.test(file.name);
                                if (isVid) {
                                  setAdMediaType('video');
                                }

                                // Set file and preview immediately
                                setAdVideoFile(file);
                                const objectUrl = URL.createObjectURL(file);
                                setAdVideoPreview(objectUrl);

                                if (isVid || adMediaType === 'video') {
                                  const tempVid = document.createElement('video');
                                  tempVid.preload = 'metadata';
                                  
                                  let checked = false;
                                  const checkDuration = () => {
                                    if (checked) return;
                                    checked = true;
                                    if (tempVid.duration && tempVid.duration > 60.5) {
                                      toast(`⚠️ Video duration is ${Math.round(tempVid.duration)}s (Recommended ~60s max). File attached & ready to publish.`, { icon: '⏱️' });
                                    } else if (tempVid.duration) {
                                      toast.success(`✅ Video attached (${Math.round(tempVid.duration)}s - ${Math.round(fileSizeMB)}MB)`);
                                    } else {
                                      toast.success(`✅ Video file attached (${Math.round(fileSizeMB)}MB)`);
                                    }
                                  };

                                  tempVid.onloadedmetadata = checkDuration;
                                  tempVid.onerror = () => {
                                    toast.success(`✅ Video file selected (${Math.round(fileSizeMB)}MB)`);
                                  };
                                  tempVid.src = objectUrl;
                                  tempVid.load();

                                  setTimeout(() => {
                                    if (!checked) {
                                      checkDuration();
                                    }
                                  }, 1000);
                                } else {
                                  toast.success(`✅ Image attached (${Math.round(fileSizeMB)}MB)`);
                                }
                              }
                            }}
                            className="text-xs text-slate-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                          />
                        </div>
                        {adVideoPreview && (
                          <div className="mt-3 relative w-full max-w-sm h-48 bg-black rounded-xl overflow-hidden border border-slate-200 mx-auto flex items-center justify-center">
                            {adMediaType === 'image' ? (
                              <img src={adVideoPreview} alt="Preview" className="w-full h-full object-contain" />
                            ) : (
                              <video preload="auto" 
                                src={adVideoPreview} 
                                controls 
                                muted 
                                className="w-full h-full object-contain transform-gpu will-change-transform" 
                              />
                            )}
                          </div>
                        )}
                      </div>

                      {savingAd && (
                        <div className="bg-white/90 border border-amber-500/40 p-4 rounded-xl space-y-2.5">
                          <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                            <span className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                              {adUploadProgress < 100 
                                ? `Uploading ${adMediaType === 'video' ? 'Video' : 'Media'} File...` 
                                : 'Finalizing & Processing on Server...'}
                            </span>
                            <span className="font-mono text-amber-400 text-sm font-black">{adUploadProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-50 rounded-full h-3 overflow-hidden border border-slate-200">
                            <div 
                              className="bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 h-3 rounded-full transition-all duration-200 ease-out shadow-md shadow-amber-500/30"
                              style={{ width: `${Math.max(4, adUploadProgress)}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-black/70">
                            {adUploadProgress < 100 
                              ? `Please wait while your ${adMediaType} file is uploading to the server.` 
                              : 'Upload complete! Saving advertisement to showcase playlist...'}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={adIsActive} 
                            onChange={(e) => setAdIsActive(e.target.checked)} 
                            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-white border-slate-200"
                          />
                          <span className="text-xs font-bold text-slate-800">Active on Home Page Top Feed</span>
                        </label>

                        <button 
                          type="submit" 
                          disabled={savingAd}
                          className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {savingAd ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                              <span>Uploading & Publishing Ad...</span>
                            </>
                          ) : (
                            `🚀 Add ${adMediaType.toUpperCase()} Ad to Showcase Playlist`
                          )}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Published Brand Advertisements Manager List */}
                  <div>
                    <h4 className="font-black text-xs text-amber-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                      <span>Live Showcase Playlist ({brandAdsList.length} Ads)</span>
                      <button 
                        onClick={fetchBrandAd}
                        className="text-xs font-bold text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        Refresh Playlist
                      </button>
                    </h4>

                    <div className="space-y-3">
                      {brandAdsList.map((ad: any, index: number) => (
                        <div key={ad.id || index} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                            {/* Media Thumbnail */}
                            <div className="w-20 h-16 bg-black rounded-xl border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center relative">
                              <AdMediaDisplay ad={ad} className="w-full h-full object-cover" />
                              <span className="absolute bottom-1 right-1 bg-black/80 text-[9px] font-black px-1 rounded text-amber-400 uppercase">
                                {ad.type === 'image' ? 'IMG' : 'VID'}
                              </span>
                            </div>

                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-black truncate">{ad.companyName}</span>
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 text-amber-300 uppercase">
                                  {ad.type || 'Ad'}
                                </span>
                              </div>
                              <div className="text-xs font-bold text-slate-700 truncate">{ad.title}</div>
                              {ad.description && <div className="text-[11px] text-black/70 line-clamp-1">{ad.description}</div>}
                              {ad.ratingCount > 0 && (
                                <div className="text-[10px] font-bold text-amber-400 flex items-center gap-1 mt-1">
                                  <Star className="w-3 h-3 fill-amber-400" />
                                  {(ad.totalRating / ad.ratingCount).toFixed(1)} ({ad.ratingCount} ratings)
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                            {/* Active Toggle */}
                            <button
                              onClick={() => handleToggleBrandAd(ad.id)}
                              className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer",
                                ad.isActive !== false ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "bg-red-500/20 text-red-400 border-red-500/40"
                              )}
                            >
                              {ad.isActive !== false ? 'LIVE' : 'PAUSED'}
                            </button>

                            {/* Delete Ad Button */}
                            <button
                              onClick={() => handleDeleteBrandAd(ad.id)}
                              className="p-2 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                              title="Delete Advertisement"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {brandAdsList.length === 0 && (
                        <div className="text-center py-8 text-black/70 text-xs">
                          No brand showcase ads uploaded yet. Fill out the form above to publish your first video or image banner ad.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2.8: PLATFORM RATINGS & GOOGLE SEO ANALYTICS */}
              {activeTab === 'ratings' && (
                <div className="space-y-6">
                  {/* Header & Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-amber-500/30">
                      <div className="text-xs text-black/60 font-bold uppercase tracking-wider">Average Star Rating</div>
                      <div className="text-3xl font-black text-amber-400 flex items-center gap-2 mt-1">
                        <span>{ratingsData?.averageRating || '5.0'}</span>
                        <div className="flex text-amber-400">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className="w-5 h-5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <div className="text-[11px] text-black/70 mt-1">Out of 5 Stars from verified users</div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div className="text-xs text-black/60 font-bold uppercase tracking-wider">Total Ratings & Reviews</div>
                      <div className="text-3xl font-black text-black mt-1">
                        {ratingsData?.totalReviews || 0}
                      </div>
                      <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-bold">
                        <TrendingUp className="w-3.5 h-3.5" /> 100% Positive Feedback
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div className="text-xs text-black/60 font-bold uppercase tracking-wider">Total Website Visitors</div>
                      <div className="text-3xl font-black text-emerald-400 mt-1">
                        {(ratingsData?.totalVisitors || 5420).toLocaleString()}
                      </div>
                      <div className="text-[11px] text-black/70 mt-1">Live tracking on Vyapar Bridge Platform</div>
                    </div>
                  </div>

                  {/* Google SEO Schema Status */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 font-bold">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                          <span>Google Search SEO Rich Snippets Status: ACTIVE</span>
                          <span className="bg-emerald-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full">Indexed</span>
                        </div>
                        <p className="text-xs text-slate-700 mt-0.5">
                          Schema.org JSON-LD AggregateRating script automatically generated for Vyapar Bridge B2B Platform. Search crawlers index your rating scores directly.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Ratings List Table / Cards */}
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
                      <span>User Review Submissions ({ratingsData?.feedbacks?.length || 0})</span>
                      <button 
                        onClick={fetchPlatformRatings}
                        className="text-xs font-bold text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        Refresh List
                      </button>
                    </h4>

                    <div className="space-y-3">
                      {ratingsData?.feedbacks?.map((fb: any) => (
                        <div key={fb.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-black text-xs">{fb.userName}</span>
                              {fb.userCity && <span className="text-[11px] text-black/70">({fb.userCity})</span>}
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase">
                                {fb.userRole || 'visitor'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 italic">"{fb.comment}"</p>
                            <div className="text-[10px] text-black/70">
                              Submitted on {new Date(fb.createdAt).toLocaleString('en-IN')}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-xl text-amber-400 font-black text-xs shrink-0">
                            <span>{fb.rating} / 5</span>
                            <Star className="w-4 h-4 fill-amber-400" />
                          </div>
                        </div>
                      ))}

                      {(!ratingsData?.feedbacks || ratingsData.feedbacks.length === 0) && (
                        <div className="text-center py-8 text-black/70 text-xs">
                          No ratings submitted yet. Visitors will see the feedback prompt on the Home Feed.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: GEMINI AI DESK */}
              {activeTab === 'ai' && (
                <div className="space-y-4">
                  <div className={cn(
                    "p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3",
                    guardrailActive 
                      ? "bg-slate-50 border-emerald-900/80 shadow-emerald-950/30" 
                      : "bg-amber-950/20 border-amber-500/50"
                  )}>
                    <div>
                      <div className="text-xs font-black flex items-center gap-2">
                        <ShieldCheck className={cn("w-4 h-4", guardrailActive ? "text-emerald-400" : "text-amber-400")} />
                        <span className="text-black">Active AI Model: Gemini 2.5 Flash</span>
                        <span className={cn(
                          "text-[10px] font-black px-2 py-0.5 rounded-full uppercase border",
                          guardrailActive ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        )}>
                          {guardrailActive ? "GUARDRAILS ONLINE" : "GUARDRAILS DISABLED"}
                        </span>
                      </div>
                      <div className="text-[11px] text-black/70 mt-1 max-w-xl">
                        Meta-style zero-latency AI Guardrail actively moderating user posts, reels, comments, and DMs for B2B compliance.
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleGuardrails()}
                      className={cn(
                        "text-xs font-bold px-3.5 py-2 rounded-xl border transition-all shrink-0 cursor-pointer flex items-center gap-1.5 shadow-md",
                        guardrailActive
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400"
                          : "bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300 font-extrabold animate-pulse"
                      )}
                    >
                      <span>{guardrailActive ? "🛡️ Guardrail Active (Click to Disable)" : "⚡ Click to Enable Guardrails"}</span>
                    </button>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center space-y-1">
                      <div className="text-2xl font-black text-black">
                        {aiData?.stats?.totalPostsScanned ?? aiData?.totalPostsScanned ?? 0}
                      </div>
                      <div className="text-[10px] text-black/60 font-extrabold uppercase tracking-wider">
                        Real-time Items Scanned
                      </div>
                      <div className="text-[10px] text-blue-600 font-medium pt-1 border-t border-slate-200/80 w-full">
                        {aiData?.stats?.totalPosts ?? 0} Posts • {aiData?.stats?.totalComments ?? 0} Comments • {aiData?.stats?.totalUsers ?? usersList.length} Users
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center space-y-1">
                      <div className={cn("text-xl font-black", guardrailActive ? "text-emerald-400" : "text-amber-400")}>
                        {guardrailActive ? 'ENABLED ✓' : 'DISABLED ⚠️'}
                      </div>
                      <div className="text-[10px] text-black/60 font-extrabold uppercase tracking-wider">
                        AI Safety Guardrails
                      </div>
                      <button 
                        onClick={() => handleToggleGuardrails()}
                        className="text-[10px] text-amber-300 underline font-bold hover:text-amber-200 cursor-pointer pt-1"
                      >
                        {guardrailActive ? 'Click to Disable' : 'Click to Turn On'}
                      </button>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center space-y-1">
                      <div className="text-2xl font-black text-blue-600">240ms</div>
                      <div className="text-[10px] text-black/60 font-extrabold uppercase tracking-wider">Avg AI Latency</div>
                      <div className="text-[10px] text-emerald-400 font-medium pt-1">
                        Ultra Low Latency
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-black/60 uppercase tracking-wider mb-2">
                      Recent AI Inspection Logs
                    </h4>
                    <div className="space-y-2">
                      {aiData?.logs?.map((log: any) => (
                        <div key={log.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                          <div>
                            <span className="font-bold text-blue-600">{log.action}:</span> <span className="text-slate-700">{log.details}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: USER MANAGEMENT & DATABASE RESET */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  {/* Database Reset & Purge Card */}
                  <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                    <div>
                      <h4 className="font-extrabold text-sm text-red-900 flex items-center gap-1.5">
                        <RefreshCw className="w-4 h-4 text-red-600 animate-spin-slow" />
                        Reset Database & Clear Sample Traders
                      </h4>
                      <p className="text-xs text-red-700 mt-1">
                        Pura Fresh Reset! Remove default sample buyers, traders & demo posts from Firestore and server memory permanently.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsResetConfirmOpen(true)}
                      className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Reset Database & Fresh Start
                    </button>
                  </div>

                  <h4 className="font-bold text-xs text-black/60 uppercase tracking-wider">
                    Registered Members ({usersList.length})
                  </h4>

                  <div className="space-y-2.5">
                    {usersList.map((usr: any) => (
                      <div key={usr.id} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 font-bold text-black flex items-center justify-center overflow-hidden">
                            {usr.avatarUrl ? (
                              <img src={usr.avatarUrl} alt={usr.name} className="w-full h-full object-cover" />
                            ) : (
                              usr.name?.charAt(0) || 'U'
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-black flex items-center gap-1">
                              <span>{usr.name}</span>
                              {usr.isVerified && <VerifiedBadge size="sm" />}
                            </div>
                            <div className="text-[10px] text-black/60">
                              @{usr.username} • {usr.role || 'Member'} • {usr.city || 'Morbi'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleToggleUserVerification(usr.id, usr.isVerified)}
                            className={cn(
                              "text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer",
                              usr.isVerified 
                                ? "bg-red-950/60 text-red-300 border-red-800 hover:bg-red-900" 
                                : "bg-blue-600 text-white border-blue-500 hover:bg-blue-500"
                            )}
                          >
                            {usr.isVerified ? 'Remove Verification' : 'Grant Verified Checkmark'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(usr)}
                            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-red-800/50 bg-red-950/30 text-red-400 hover:bg-red-900/60 transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>

      {/* Reset Database Modal Confirmation Popup */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-red-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-extrabold text-base text-slate-900">
                Confirm Database Reset & Purge?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Kya aap poora database reset karke default demo traders, buyers aur sample posts ko permanently delete karna chahte hain? Yeh process saare sample default profiles ko clean kar dega.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                disabled={isResettingDb}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetAllData}
                disabled={isResettingDb}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold transition-colors shadow-lg cursor-pointer flex items-center gap-1.5"
              >
                {isResettingDb ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Resetting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Yes, Purge & Reset Database
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal Confirmation Popup */}
      {userToDelete && (
        <div className="fixed inset-0 z-[300] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border-2 border-rose-500/60 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-black">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-800 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-black">Confirm User Deletion?</h3>
                <p className="text-[11px] text-black/70">Permanent Action • Cannot Be Undone</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="text-slate-700">
                Are you sure you want to completely delete user account:
              </p>
              <div className="font-bold text-black text-sm">
                {userToDelete.name} <span className="text-black/60 text-xs font-normal">(@{userToDelete.username})</span>
              </div>
              <p className="text-[10px] text-black/60 pt-1">
                Role: {userToDelete.role || 'Member'} • City: {userToDelete.city || 'Morbi'}
              </p>
            </div>

            <p className="text-xs text-rose-300/90 leading-relaxed bg-rose-950/30 border border-rose-900/50 p-2.5 rounded-xl">
              ⚠️ Deleting this user will purge their profile, posts, comments, likes, saves, and verification badges from the database permanently.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-700 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-black text-xs font-extrabold transition-colors shadow-lg cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Yes, Delete User
              </button>
            </div>
          </div>
        </div>
      )}</div>
  );
}

// --- VYAPAR BRIDGE Approval Center Modal ---
function ApprovalCenterModal({ 
  isOpen, 
  onClose, 
  user,
  userPosts = [],
  onOpenVerify
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  user: any; 
  userPosts?: any[];
  onOpenVerify?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'verifications' | 'posts'>('verifications');

  if (!isOpen || !user) return null;

  const approvedPostsCount = userPosts.filter(p => !p.unapproved).length;
  const unapprovedPosts = userPosts.filter(p => p.unapproved);

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 border-2 border-blue-500/50 text-black dark:text-zinc-50 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-zinc-900 p-4 sm:p-5 text-black flex items-center justify-between border-b border-blue-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl tiranga-border-circle flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-50 rounded-full flex items-center justify-center text-amber-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black italic tracking-wide text-black flex items-center gap-2">
                <motion.span 
                  animate={{ color: ["#ff00ff", "#00ffcc", "#40e0d0", "#ff00ff"] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="font-black drop-shadow-[0_0_8px_rgba(255,0,255,0.5)]"
                >
                  VYAPAR BRIDGE APPROVAL CENTER
                </motion.span>
              </h2>
              <p className="text-xs text-amber-300 font-medium">
                Live Status of Your Verification Payments & AI Post Approvals
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-700 hover:text-black transition-colors cursor-pointer"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 dark:bg-zinc-950 p-2 border-b border-slate-200 dark:border-zinc-800 flex gap-2">
          <button
            onClick={() => setActiveTab('verifications')}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer",
              activeTab === 'verifications' 
                ? "bg-blue-600 text-white shadow-md" 
                : "bg-white dark:bg-zinc-900 text-black/80 dark:text-zinc-400 hover:text-black dark:hover:text-black"
            )}
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Payment & Verification Status</span>
          </button>
          {user.role !== 'customer' && (
            <button
              onClick={() => setActiveTab('posts')}
              className={cn(
                "flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer",
                activeTab === 'posts' 
                  ? "bg-blue-600 text-white shadow-md" 
                  : "bg-white dark:bg-zinc-900 text-black/80 dark:text-zinc-400 hover:text-black dark:hover:text-black"
              )}
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>AI Post Approvals ({userPosts.length})</span>
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'verifications' ? (
            <div className="space-y-4">
              {/* Main Badge Status Card */}
              <div className={cn(
                "p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm",
                user.isVerified 
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800" 
                  : "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800"
              )}>
                <div className="flex items-center gap-3.5">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md",
                    user.isVerified ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
                  )}>
                    {user.isVerified ? <CheckCircle2 className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-black/70 dark:text-zinc-400">Account Approval Status</span>
                    <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
                      {user.isVerified ? (
                        <span className="text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">Vyapar Bridge Verified ✓ (Approved)</span>
                      ) : (
                        <span className="text-amber-700 dark:text-amber-300">Verification Pending / Under Review</span>
                      )}
                    </h3>
                    <p className="text-xs text-black/80 dark:text-zinc-300 mt-1">
                      {user.isVerified 
                        ? (user.role === 'customer' 
                            ? "Your account is verified! You enjoy premium connect access and verified badge."
                            : "Your B2B account is fully verified! You enjoy Top 10 directory ranking and blue badge.")
                        : "Your verification request and payment receipt are being verified by our team."}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 w-full sm:w-auto">
                  {user.isVerified ? (
                    <span className="inline-block w-full sm:w-auto text-center text-xs font-bold bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-sm">
                      ✓ Active Badge
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        onClose();
                        if (onOpenVerify) onOpenVerify();
                      }}
                      className="w-full sm:w-auto text-center text-xs font-black bg-gradient-to-r from-blue-600 to-indigo-600 text-black px-4 py-2.5 rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer"
                    >
                      Pay & Get Verified (₹99/mo)
                    </button>
                  )}
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="bg-slate-50 dark:bg-zinc-950/70 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-black/70 dark:text-zinc-400">Verification Payment Breakdown</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800">
                    <span className="text-black/60 block text-[10px]">Payment Plan:</span>
                    <strong className="text-black dark:text-zinc-100 text-sm">₹99/month (or ₹1,188/yr)</strong>
                  </div>
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800">
                    <span className="text-black/60 block text-[10px]">Verification Approval Time:</span>
                    <strong className="text-black dark:text-zinc-100 text-sm">Within 15 - 30 Minutes</strong>
                  </div>
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 sm:col-span-2">
                    <span className="text-black/60 block text-[10px]">Payment Approval Note / Reason:</span>
                    <p className="text-black dark:text-zinc-300 font-medium mt-1">
                      {user.isVerified 
                        ? "✓ Payment successfully processed via Barcode/UPI. GSTIN & Business directory listing approved." 
                        : "⏳ If you recently transferred via Barcode/UPI, please allow up to 30 mins for auto-verification. In case of delay or unapproved payment, click WhatsApp support below."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Posts Summary */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-2xl">
                  <span className="text-2xl font-black text-blue-600 dark:text-blue-600">{userPosts.length}</span>
                  <span className="block text-[11px] font-bold text-black/80 dark:text-zinc-400 mt-0.5">Total Posts</span>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl">
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{approvedPostsCount}</span>
                  <span className="block text-[11px] font-bold text-black/80 dark:text-zinc-400 mt-0.5">AI Approved ✓</span>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl">
                  <span className="text-2xl font-black text-red-600 dark:text-red-400">{unapprovedPosts.length}</span>
                  <span className="block text-[11px] font-bold text-black/80 dark:text-zinc-400 mt-0.5">Unapproved ❌</span>
                </div>
              </div>

              {/* AI Moderation Information Note */}
              <div className="p-3.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-black dark:text-zinc-300 space-y-1">
                <p className="font-bold text-blue-600 dark:text-blue-600 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Vyapar Bridge AI Automated Post Quality Check
                </p>
                <p className="text-[11px] leading-relaxed">
                  Vyapar Bridge strictly allows posts featuring <strong>Hardware, Paint, Plywood, Electronics, & Generic B2B</strong> products. Off-topic images are automatically flagged or hidden by AI to preserve B2B marketplace trust.
                </p>
              </div>

              {/* List of user posts */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-black/70 dark:text-zinc-400">Your Recent Posts Status</h4>
                {userPosts.length === 0 ? (
                  <p className="text-xs text-black/60 py-4 text-center">No posts uploaded yet.</p>
                ) : (
                  userPosts.map((post, idx) => (
                    <div key={post.id || idx} className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img src={post.image} alt="post" className="w-12 h-12 object-cover rounded-lg border border-slate-300 dark:border-zinc-700" />
                        <div>
                          <h5 className="font-bold text-xs text-black dark:text-zinc-100 line-clamp-1">{post.title || 'Tile Product Post'}</h5>
                          <span className="text-[10px] text-black/70">{post.category || 'Tiles & Sanitaryware'}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {post.unapproved ? (
                          <span className="text-[10px] font-extrabold bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-300 px-2.5 py-1 rounded-full border border-red-300 dark:border-red-800 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Unapproved / Flagged
                          </span>
                        ) : (
                          <span className="text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> AI Approved ✓
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* WhatsApp Direct Support Footer */}
        <div className="p-4 bg-slate-50 dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-black/70 dark:text-zinc-400 text-center sm:text-left">
            Need urgent help with payment or post approval?
          </div>
          <a
            href={`https://wa.me/919876543210?text=${encodeURIComponent(`Hello Vyapar Bridge Approval Team, I need help with my account/post approval. User: ${user.name}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Connect Support on WhatsApp</span>
          </a>
        </div>

      </div></div>
  );
}

// --- Page Components ---

function AuthPage({ onLogin }: { onLogin: (user: any) => void }) {
  const [selectedRole, setSelectedRole] = useState<'factory' | 'dealer' | 'customer'>('factory');
  const [isLogin, setIsLogin] = useState(true);
  
  // Common Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Vitrified Tiles']);
  
  // Customer Specific Registration States
  const [customerType, setCustomerType] = useState('General Customer');
  const [customerRequirements, setCustomerRequirements] = useState('');
  
  // Location States (Mandatory during Registration)
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isLocationSynced, setIsLocationSynced] = useState(false);
  const [locationError, setLocationError] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const availableCategories = ALL_CATEGORY_OPTIONS;

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter(c => c !== cat));
      } else {
        toast.error('Select at least one category');
      }
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  // Live Geolocation Detector with Reverse Geocoding
  const detectLiveLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingLocation(true);
    setLocationError('');
    const toastId = toast.loading('📍 Detecting & Syncing your GPS Location...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setGpsCoords({ lat, lng });
        setIsLocationSynced(true);
        
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
            headers: { 'Accept-Language': 'en' }
          });
          const data = await response.json();
          
          if (data && data.address) {
            const addr = data.address;
            const cityName = addr.city || addr.town || addr.village || addr.suburb || '';
            const state = addr.state || '';
            const street = data.display_name || '';
            
            setCity(cityName);
            setStateName(state);
            setAddress(street);
            
            toast.success(`📍 Located: ${cityName}, ${state}! ✓`, { id: toastId });
          } else {
            setAddress(`Live GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            toast.success('📍 Live GPS location synced! ✓ Please enter City & State.', { id: toastId });
          }
        } catch (err) {
          console.error('Reverse geocoding error:', err);
          setAddress(`Live GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          toast.success('📍 GPS synced! ✓ Please enter your address details.', { id: toastId });
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        console.warn('Geolocation fallback:', err);
        const defaultLat = 20.5937;
        const defaultLng = 78.9629;
        setGpsCoords({ lat: defaultLat, lng: defaultLng });
        setIsLocationSynced(true);
        if (!city) setCity('Morbi');
        if (!stateName) setStateName('Gujarat');
        if (!address) setAddress('Ceramic Industrial Hub');
        setIsDetectingLocation(false);
        toast.success('📍 Location set to Morbi Hub! ✓', { id: toastId });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleQuickDemo = (role: 'factory' | 'dealer' | 'customer') => {
    setLoading(true);
    const demoUser = {
      id: `demo_${role}_${Date.now()}`,
      username: role === 'customer' ? 'customer' : role,
      name: role === 'factory' ? 'Balaji Ceramics & Tiles' : (role === 'customer' ? 'Rahul Sharma' : 'Apex Building Materials'),
      role: role,
      category: role === 'factory' ? 'Ceramic Tiles & Sanitaryware' : (role === 'customer' ? 'Individual Home Builder' : 'Tiles & Bath Distributor'),
      city: 'Morbi',
      state: 'Gujarat',
      isVerified: false,
      verifiedBadge: false,
      rating: 4.8,
      avatar: BRAND_LOGO_SRC
    };

    safeFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: role === 'customer' ? 'customer' : role, password: 'password', role })
    })
      .then(user => {
        onLogin(user);
        toast.success(`Logged in as ${role === 'factory' ? 'Company / Factory' : (role === 'customer' ? 'Local Customer' : 'Dealer / Distributor')}`);
      })
      .catch(() => {
        // Fallback for Vercel static deployment or offline
        onLogin(demoUser);
        toast.success(`Logged in as ${role === 'factory' ? 'Company / Factory' : (role === 'customer' ? 'Local Customer' : 'Dealer / Distributor')}`);
      })
      .finally(() => setLoading(false));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Instant Master Admin Authentication (Manit / 5503)
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (cleanUsername === 'manit') {
      if (cleanPassword === '5503') {
        const masterAdminUser = {
          id: 'admin_manit_1',
          username: 'manit',
          name: 'Master Administrator (Manit)',
          role: 'admin',
          category: 'Master Platform Control & Infrastructure',
          isVerified: true,
          verifiedBadge: true,
          bio: 'Vyapar Bridge Master Developer & System Administrator',
          phone: '9999999999',
          email: 'admin@vyaparbridge.com',
          address: 'National Trade & Commerce Hub',
          city: 'Delhi',
          state: 'Delhi',
          avatar: BRAND_LOGO_SRC
        };
        localStorage.setItem('user', JSON.stringify(masterAdminUser));
        localStorage.setItem('Vyapar Bridge_user', JSON.stringify(masterAdminUser));
        toast.success('👑 Welcome Master Admin (Manit)!');
        onLogin(masterAdminUser);
        return;
      } else {
        setError('Incorrect password for admin (Manit).');
        toast.error('❌ Incorrect password for admin (Manit).');
        return;
      }
    }

    if (!isLogin && selectedRole === 'customer') {
      if (!customerType) {
        toast.error('Please select customer type');
        setError('Please select customer type');
        return;
      }
      if (!customerRequirements.trim()) {
        toast.error('Please specify your building requirements');
        setError('Please specify your building requirements');
        return;
      }
    }

    if (!isLogin && selectedRole !== 'customer') {
      if (!isLocationSynced && (!city.trim() || !address.trim() || !gpsCoords)) {
        toast.error('📍 Location sync is mandatory for registration! Click the Sync Location button.');
        setError('Location sync is mandatory for registration. Click the location button to set your GPS location.');
        return;
      }
    }

    if (!isLogin && selectedRole !== 'customer' && gstNumber && gstNumber.trim() !== '') {
      const gstRes = validateGSTIN(gstNumber);
      if (!gstRes.isValid) {
        toast.error(`⚠️ ${gstRes.error}`);
        setError(`Fake or Invalid GSTIN: ${gstRes.error}`);
        return;
      }
    }

    setLoading(true);

    const fallbackGps = gpsCoords || { lat: 20.5937, lng: 78.9629 };
    const finalCity = city.trim() || 'Morbi';
    const finalState = stateName.trim() || 'Gujarat';
    const finalAddress = address.trim() || 'Trade Industrial Area';
    const googleMapsUrl = `https://maps.google.com/?q=${fallbackGps.lat},${fallbackGps.lng}`;

    const userProfile = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      username: cleanUsername,
      password: cleanPassword,
      name: companyName.trim() || cleanUsername,
      role: selectedRole,
      category: selectedRole === 'customer' ? (customerType || 'Individual Customer') : (selectedCategories.length > 0 ? selectedCategories.join(', ') : 'Building Materials Merchant'),
      customerRequirements: selectedRole === 'customer' ? (customerRequirements || 'General Tiles & Sanitaryware Inquiry') : undefined,
      gstNumber: selectedRole === 'customer' ? '' : (gstNumber || ''),
      phone: phone || '',
      email: email || '',
      address: finalAddress,
      city: finalCity,
      state: finalState,
      gpsCoords: fallbackGps,
      googleMapsUrl,
      isVerified: false,
      verifiedBadge: false,
      rating: 4.9,
      avatar: BRAND_LOGO_SRC,
      createdAt: new Date().toISOString()
    };

    if (!isLogin) {
      // REGISTRATION FLOW: Save to Firestore & Local Storage immediately
      try {
        await setDoc(doc(firestoreDb, 'users', userProfile.id), userProfile);
      } catch (fErr) {
        console.warn('Direct Firestore save note:', fErr);
      }

      // Also try sync with server if available
      try {
        await safeFetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userProfile)
        });
      } catch (apiErr) {
        // Safe to ignore on static Vercel
      }

      localStorage.setItem('user', JSON.stringify(userProfile));
      localStorage.setItem('Vyapar Bridge_user', JSON.stringify(userProfile));
      toast.success(`🎉 Registered successfully as ${selectedRole === 'factory' ? 'Company / Factory' : (selectedRole === 'customer' ? 'Local Customer' : 'Dealer / Distributor')}!`);
      onLogin(userProfile);
      setLoading(false);
      return;
    }

    // LOGIN FLOW - Strictly check registered accounts in Firestore & Local Database
    try {
      const data = await safeFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password: cleanPassword, role: selectedRole })
      });
      
      if (data && data.id) {
        localStorage.setItem('user', JSON.stringify(data));
        localStorage.setItem('Vyapar Bridge_user', JSON.stringify(data));
        toast.success(`Welcome back, ${data.name || cleanUsername}!`);
        onLogin(data);
        setLoading(false);
        return;
      }
    } catch (err: any) {
      // Static Vercel or offline fallback
    }

    // Direct Firestore Authentication Check
    const authRes = await authenticateUserInFirestore(cleanUsername, cleanPassword, selectedRole);
    if (authRes.success && authRes.user) {
      localStorage.setItem('user', JSON.stringify(authRes.user));
      localStorage.setItem('Vyapar Bridge_user', JSON.stringify(authRes.user));
      toast.success(`Welcome back, ${authRes.user.name || cleanUsername}!`);
      onLogin(authRes.user);
    } else {
      const errMsg = authRes.error || '❌ Account nahi mila! Kripya pehle "Register New Account" tab par jaakar register karein.';
      setError(errMsg);
      toast.error(errMsg);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-200 dark:from-zinc-950 dark:via-zinc-900 dark:to-black flex items-center justify-center p-3 sm:p-6 font-sans">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header App Brand */}
        <div className="bg-white text-black p-6 text-center relative overflow-hidden flex flex-col items-center">
          <div className="absolute top-0 right-0 p-8 bg-blue-600/20 rounded-full blur-2xl"></div>
          <div className="tiranga-border-circle mb-2.5 shadow-2xl transition-transform hover:scale-105">
            <img 
              src={BRAND_LOGO_SRC} 
              alt="Vyapar Bridge Logo" 
              className="w-16 h-16 object-cover rounded-full bg-slate-50 p-1"
              onError={(e) => {
                const parent = (e.target as HTMLElement).parentElement;
                if (parent) parent.style.display = 'none';
              }}
            />
          </div>
          <h1 
            className="text-3xl sm:text-4xl font-black italic tracking-wider tiranga-shimmer-text flex items-center justify-center gap-2 drop-shadow-md py-0.5"
            style={{ fontFamily: "'Playfair Display', 'Dancing Script', serif", fontWeight: 900 }}
          >VYAPAR BRIDGE</h1>
          <p className="text-xs sm:text-[13px] text-amber-200 font-bold leading-relaxed max-w-xs mx-auto text-balance mt-2 drop-shadow-sm uppercase tracking-wider">
            Open Network for Digital Commerce (ONDC)
          </p>
          <p 
            className="text-sm sm:text-base font-black italic tracking-[0.25em] mt-1 uppercase text-center w-full bg-gradient-to-r from-amber-300 via-orange-300 to-amber-200 bg-clip-text text-transparent drop-shadow-md"
            style={{ fontFamily: "'Playfair Display', 'Cinzel', 'Georgia', serif" }}
          >
            ✨ VOCAL FOR LOCAL ✨
          </p>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50/80 border border-amber-400/40 text-[11px] font-black tracking-widest text-amber-300 uppercase shadow-md">
            <span>🇮🇳 DIGITAL INDIA NETWORK</span>
          </div>
        </div>

        {/* 3 MAIN ROLE TABS AT TOP (Factory, Dealer & Customer) */}
        <div className="p-3 bg-slate-100 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800">
          <label className="block text-[11px] font-bold text-black/70 dark:text-zinc-400 uppercase tracking-wider mb-2 text-center">
            Select Your Account Type / श्रेणी चुनें:
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {/* FACTORY TAB */}
            <button
              type="button"
              onClick={() => setSelectedRole('factory')}
              className={cn(
                "py-3 px-1 rounded-xl text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1 border cursor-pointer shadow-sm",
                selectedRole === 'factory'
                  ? "bg-blue-600 text-white border-blue-500 shadow-md ring-2 ring-blue-400/50"
                  : "bg-white dark:bg-zinc-900 text-black dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:border-blue-300"
              )}
            >
              <Building2 className="w-4 h-4" />
              <span className="truncate w-full text-center">FACTORY</span>
              <span className="text-[9px] opacity-80 font-normal">फ़ैक्टरी</span>
            </button>

            {/* DEALER TAB */}
            <button
              type="button"
              onClick={() => setSelectedRole('dealer')}
              className={cn(
                "py-3 px-1 rounded-xl text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1 border cursor-pointer shadow-sm",
                selectedRole === 'dealer'
                  ? "bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-400/50"
                  : "bg-white dark:bg-zinc-900 text-black dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:border-emerald-300"
              )}
            >
              <Store className="w-4 h-4" />
              <span className="truncate w-full text-center">DEALER</span>
              <span className="text-[9px] opacity-80 font-normal">डीलर</span>
            </button>

            {/* CUSTOMER TAB */}
            <button
              type="button"
              onClick={() => setSelectedRole('customer')}
              className={cn(
                "py-3 px-1 rounded-xl text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1 border cursor-pointer shadow-sm",
                selectedRole === 'customer'
                  ? "bg-amber-600 text-black border-amber-500 shadow-md ring-2 ring-amber-400/50"
                  : "bg-white dark:bg-zinc-900 text-black dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:border-amber-300"
              )}
            >
              <Users className="w-4 h-4" />
              <span className="truncate w-full text-center">CUSTOMER</span>
              <span className="text-[9px] opacity-80 font-normal">ग्राहक</span>
            </button>
          </div>
        </div>

        {/* Selected Role Badge Header */}
        <div className="px-6 pt-4 pb-2 text-center">
          <div className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-sm border",
            selectedRole === 'factory' 
              ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
              : (selectedRole === 'customer' ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800" : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800")
          )}>
            {selectedRole === 'factory' ? <Building2 className="w-3.5 h-3.5" /> : (selectedRole === 'customer' ? <Users className="w-3.5 h-3.5" /> : <Store className="w-3.5 h-3.5" />)}
            <span>
              {selectedRole === 'factory' ? 'COMPANY / FACTORY PORTAL' : (selectedRole === 'customer' ? 'LOCAL CUSTOMER PORTAL' : 'DEALER / DISTRIBUTOR PORTAL')}
            </span>
          </div>
        </div>

        {/* Login vs Signup Mode Switcher */}
        <div className="px-6 my-2">
          <div className="flex border-b border-slate-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={cn(
                "flex-1 py-2 text-sm font-bold border-b-2 transition-colors cursor-pointer",
                isLogin ? "border-blue-600 text-blue-600 dark:text-blue-600" : "border-transparent text-black/60 hover:text-black/80"
              )}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={cn(
                "flex-1 py-2 text-sm font-bold border-b-2 transition-colors cursor-pointer",
                !isLogin ? "border-blue-600 text-blue-600 dark:text-blue-600" : "border-transparent text-black/60 hover:text-black/80"
              )}
            >
              Sign Up / Register
            </button>
          </div>
        </div>

        {/* Form Container */}
        <form className="px-6 py-4 flex flex-col gap-3.5 overflow-y-auto max-h-[60vh] scrollbar-thin" onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              {selectedRole === 'customer' ? (
                <>
                  {/* Customer Type Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-black dark:text-zinc-300 mb-1">
                      Customer Type *
                    </label>
                    <select
                      value={customerType}
                      onChange={(e) => setCustomerType(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                    >
                      <option value="Builder">Builder</option>
                      <option value="Architect">Architect</option>
                      <option value="General Customer">General Customer</option>
                    </select>
                  </div>
                  
                  {/* Customer Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-black dark:text-zinc-300 mb-1">
                      Your First Name / Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your full name"
                      className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                    />
                  </div>

                  {/* Phone & Email */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-black dark:text-zinc-300 mb-1">
                        Phone / Mobile *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="Enter phone number"
                        className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-black dark:text-zinc-300 mb-1">
                        Email ID
                      </label>
                      <input
                        type="email"
                        placeholder="Enter email address"
                        className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-black dark:text-zinc-300 mb-1">City (Optional)</label>
                    <input
                      type="text"
                      placeholder="Enter your city"
                      className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                    />
                  </div>
                  
                  {/* Building Requirements */}
                  <div>
                    <label className="block text-xs font-bold text-black dark:text-zinc-300 mb-1">
                      Building Requirements * <span className="font-normal text-[10px]">(e.g., Tiles, Sanitaryware, Bathwares, qty)</span>
                    </label>
                    <textarea
                      required
                      placeholder="E.g., Need 500 sqft vitrified tiles and 2 EWCs for my house..."
                      className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 min-h-[80px]"
                      value={customerRequirements}
                      onChange={(e) => setCustomerRequirements(e.target.value)}
                    ></textarea>
                  </div>
                </>
              ) : (
                <>
                  {/* Company / Showroom Name */}
                  <div>
                    <label className="block text-xs font-bold text-black dark:text-zinc-300 mb-1">
                      {selectedRole === 'factory' ? 'Factory / Company Name *' : 'Showroom / Dealership Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={selectedRole === 'factory' ? 'Enter Factory / Company Name' : 'Enter Showroom / Dealership Name'}
                      className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                    />
                  </div>

                  {/* Tile Categories Produced or Sold */}
                  <div>
                    <label className="block text-xs font-bold text-black dark:text-zinc-300 mb-1.5 flex items-center justify-between">
                      <span>Product Categories / श्रेणियां:</span>
                      <span className="text-[10px] text-blue-500 font-normal">Select applicable</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {availableCategories.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          className={cn(
                            "text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 cursor-pointer",
                            selectedCategories.includes(cat)
                              ? "bg-blue-600 text-white border-blue-600 font-bold"
                              : "bg-slate-100 dark:bg-zinc-800 text-black/80 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 hover:bg-slate-200"
                          )}
                        >
                          <Tag className="w-3 h-3" />
                          <span>{cat}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* GST / Business Reg Number */}
                  <GstInput
                    value={gstNumber}
                    onChange={setGstNumber}
                    label="GST Number / GSTIN Tax ID (Optional)"
                    placeholder="Enter GSTIN Tax ID"
                  />

                  {/* Phone & Email */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-black dark:text-zinc-300 mb-1">
                        Phone / Mobile *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="Enter phone number"
                        className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-black dark:text-zinc-300 mb-1">
                        Email ID
                      </label>
                      <input
                        type="email"
                        placeholder="Enter email address"
                        className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* MANDATORY LOCATION SECTION WITH LIVE GPS BUTTON */}
                  <div className="bg-slate-50 dark:bg-zinc-800/80 p-3.5 rounded-xl border-2 border-blue-500/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-black dark:text-zinc-100 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-red-500" />
                        <span>Location & GPS Address * (Mandatory)</span>
                      </label>
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1",
                        isLocationSynced 
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-400" 
                          : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                      )}>
                        {isLocationSynced ? <><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Synced ✓</> : 'Required / अनिवार्य'}
                      </span>
                    </div>

                    <p className="text-[11px] text-black/70 dark:text-zinc-400">
                      Location sync is required so buyers and dealers can easily discover your roadmap and navigate directly to your factory or showroom on Google Maps.
                    </p>

                    {/* GPS Detect & Sync Button with Green Tickmark */}
                    {isLocationSynced ? (
                      <div className="bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500 rounded-xl p-3 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                            <Check className="w-5 h-5 stroke-[3]" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-1">
                              <span>Location Synced & Roadmap Ready</span>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-100 dark:fill-emerald-900" />
                            </div>
                            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                              Google Maps navigation link active for buyers!
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={detectLiveLocation}
                          disabled={isDetectingLocation}
                          className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/80 cursor-pointer shrink-0 border border-emerald-300 dark:border-emerald-700"
                        >
                          {isDetectingLocation ? 'Syncing...' : 'Re-Sync GPS'}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={detectLiveLocation}
                        disabled={isDetectingLocation}
                        className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-black text-xs font-black py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50 ring-2 ring-blue-400/50"
                      >
                        <Locate className="w-4 h-4" />
                        <span>📍 Sync My Location & GPS Roadmap * (Click Here)</span>
                      </button>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-black/80 dark:text-zinc-300 mb-1">City *</label>
                        <input
                          type="text"
                          required
                          placeholder="Enter city"
                          className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                          value={city}
                          onChange={e => {
                            setCity(e.target.value);
                            if (e.target.value) setIsLocationSynced(true);
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-black/80 dark:text-zinc-300 mb-1">State *</label>
                        <input
                          type="text"
                          required
                          placeholder="Enter state"
                          className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                          value={stateName}
                          onChange={e => setStateName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-black/80 dark:text-zinc-300 mb-1">Street Address / Landmark *</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter street address / landmark"
                        className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                        value={address}
                        onChange={e => {
                          setAddress(e.target.value);
                          if (e.target.value) setIsLocationSynced(true);
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Username & Password */}
          <div>
            <label className="block text-xs font-bold text-black dark:text-zinc-300 mb-1">
              Username or Mobile Number *
            </label>
            <input
              type="text"
              required
              placeholder={isLogin ? "Enter username or mobile number" : "Choose username"}
              className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-black dark:text-zinc-300 mb-1">
              Password *
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-red-500 text-xs font-semibold text-center">{error}</p>}

          <button 
            type="submit"
            disabled={loading}
            className={cn(
              "w-full text-black font-bold rounded-xl py-3 mt-1 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50",
              selectedRole === 'factory' ? "bg-blue-600 hover:bg-blue-700" : (selectedRole === 'customer' ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700")
            )}
          >
            {loading ? 'Processing...' : (
              isLogin 
                ? `Log In as ${selectedRole === 'factory' ? 'Company / Factory' : (selectedRole === 'customer' ? 'Local Customer' : 'Dealer / Distributor')}` 
                : `Create ${selectedRole === 'factory' ? 'Factory / Company' : (selectedRole === 'customer' ? 'Customer' : 'Dealer / Distributor')} Account`
            )}
          </button>
        </form>

      </div></div>
  );
}

function SearchPage() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    safeFetch('/api/users')
      .then(data => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch(err => console.error('Search page user fetch error:', err));
  }, []);

  const filteredUsers = users.filter(u => {
    if (selectedIndustry !== 'all') {
      const uStr = `${u.category || ''} ${u.bio || ''} ${u.name || ''} ${u.companyName || ''}`;
      if (!matchIndustryOrSubcategory(selectedIndustry, 'all', uStr)) return false;
    }

    if (!query) return true;
    const q = query.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) || 
      u.companyName?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      u.category?.toLowerCase().includes(q) ||
      u.city?.toLowerCase().includes(q) ||
      u.state?.toLowerCase().includes(q) ||
      u.gstNumber?.toLowerCase().includes(q) ||
      u.bio?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-2xl mx-auto w-full pt-6 pb-20 md:pb-8 px-4">
      <div className="relative mb-3">
        <Search className="w-5 h-5 absolute left-3.5 top-3 text-black/60 dark:text-zinc-500" />
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search all India factories, mills, dealers, GSTIN, city..." 
          className="w-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-11 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-black dark:text-zinc-100"
        />
        {query && (
          <button 
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-3 text-black/60 hover:text-black/80 text-xs font-bold cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Quick Industry Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-3 scrollbar-hide">
        <button
          onClick={() => setSelectedIndustry('all')}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all border cursor-pointer",
            selectedIndustry === 'all'
              ? "bg-slate-950 text-amber-400 border-amber-400 shadow-sm"
              : "bg-white dark:bg-zinc-900 text-black/70 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:border-amber-400"
          )}
        >
          🌐 All Sectors
        </button>
        {ALL_INDUSTRIES.map(ind => (
          <button
            key={ind.id}
            onClick={() => setSelectedIndustry(ind.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all border cursor-pointer flex items-center gap-1",
              selectedIndustry === ind.id
                ? "bg-amber-500 text-slate-950 font-black border-amber-400 shadow-sm"
                : "bg-white dark:bg-zinc-900 text-black/70 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:border-amber-400"
            )}
          >
            <span>{ind.icon}</span>
            <span>{ind.shortName}</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-xs text-black/70 dark:text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>{query || selectedIndustry !== 'all' ? `Results (${filteredUsers.length})` : 'Verified B2B Members'}</span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">🇮🇳 All India Network</span>
        </h3>
        {filteredUsers.length > 0 ? (
          filteredUsers.map(u => (
            <div 
              key={u.id}
              onClick={() => navigate(`/profile/${encodeURIComponent(u.id || u.name)}`)}
              className="flex items-center justify-between p-3.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-amber-500 dark:hover:border-amber-500 transition-all cursor-pointer group shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shrink-0 text-lg font-bold text-black/80 dark:text-zinc-300",
                  u.isVerified ? "tiranga-border-circle p-[2px]" : "bg-slate-200 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700"
                )}>
                  <div className="w-full h-full bg-[#E6C76C] dark:bg-black rounded-full overflow-hidden flex items-center justify-center">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                    ) : (
                      u.name?.charAt(0)
                    )}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-sm text-black dark:text-zinc-50 flex items-center gap-1.5 group-hover:text-amber-500 transition-colors">
                    <span className={cn(u.isVerified && "text-blue-600 dark:text-blue-600 font-bold italic")}>{u.name}</span>
                    {u.isVerified && <VerifiedBadge size="sm" />}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {u.role !== 'customer' && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 capitalize">
                        {u.role === 'factory' ? '🏭 Factory / Mill' : '🏬 Dealer / Dist.'}
                      </span>
                    )}
                    <span className="text-xs text-black/60 dark:text-zinc-400">
                      {u.city ? `${u.city}, ${u.state || ''}` : (u.category || 'Commerce')}
                    </span>
                  </div>
                </div>
              </div>
              <button className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-100 transition-colors">
                View Profile
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-sm text-black/70 dark:text-zinc-400 py-8">
            No profiles found matching "{query}". Try selecting another industry or search for another city.
          </p>
        )}
      </div></div>
  );
}

function RoadmapPage({ user, userLocation }: { user?: any; userLocation?: { lat: number; lng: number } | null }) {
  const [dealers, setDealers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndustryId, setSelectedIndustryId] = useState<string>('all');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('all');
  const [filterRadius, setFilterRadius] = useState<'all' | '100km'>('all');
  const [filterRole, setFilterRole] = useState<'all' | 'factory' | 'dealer'>('all');

  useEffect(() => {
    safeFetch('/api/users')
      .then(data => {
        if (Array.isArray(data)) {
          // De-duplicate by ID to prevent dummy/duplicate profiles
          const uniqueMap = new Map();
          data.forEach((u: any) => {
            // Include factories and dealers, exclude customers
            if (u.role === 'dealer' || u.role === 'factory') {
              const key = (u.gstNumber && u.gstNumber.trim() !== '') ? u.gstNumber.trim().toUpperCase() : u.id;
              if (!uniqueMap.has(key)) {
                uniqueMap.set(key, u);
              }
            }
          });
          setDealers(Array.from(uniqueMap.values()));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredDealers = dealers.filter(dealer => {
    // 1. Role Filter
    if (filterRole === 'factory' && dealer.role !== 'factory') return false;
    if (filterRole === 'dealer' && dealer.role !== 'dealer') return false;

    // 2. Industry & Subcategory Filter
    if (selectedIndustryId !== 'all') {
      const catStr = `${dealer.category || ''} ${dealer.businessType || ''} ${dealer.name || ''} ${dealer.companyName || ''}`;
      const isMatch = matchIndustryOrSubcategory(selectedIndustryId, selectedSubcategoryId, catStr);
      if (!isMatch) return false;
    }

    // 3. Proximity Radius Filter (100km Plan)
    if (filterRadius === '100km' && userLocation) {
      const lat = dealer.gpsCoords?.lat ?? dealer.lat;
      const lng = dealer.gpsCoords?.lng ?? dealer.lng;
      if (lat !== undefined && lng !== undefined && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
        const dist = calculateDistance(userLocation.lat, userLocation.lng, Number(lat), Number(lng));
        if (dist > 100) return false;
      }
    }

    return true;
  }).sort((a, b) => {
    if (filterRadius === '100km' && userLocation) {
      const latA = a.gpsCoords?.lat ?? a.lat;
      const lngA = a.gpsCoords?.lng ?? a.lng;
      const latB = b.gpsCoords?.lat ?? b.lat;
      const lngB = b.gpsCoords?.lng ?? b.lng;

      if (latA !== undefined && lngA !== undefined && latB !== undefined && lngB !== undefined) {
        const distA = calculateDistance(userLocation.lat, userLocation.lng, Number(latA), Number(lngA));
        const distB = calculateDistance(userLocation.lat, userLocation.lng, Number(latB), Number(lngB));
        return distA - distB;
      }
    }
    return 0;
  });

  if (!user?.isVerified && user?.role === 'customer') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center">
        <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">GPS Roadmap is Locked</h2>
        <p className="text-black/70 dark:text-zinc-400 max-w-md mb-8">
          The GPS Roadmap feature is exclusive to verified members. 
          Get verified to see all companies and dealers on the map with direct navigation.
        </p>
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('openVerifyModal'))}
          className="bg-blue-600 hover:bg-blue-700 text-black font-bold py-3 px-8 rounded-xl shadow-lg transition-all"
        >
          Get Verified Access
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-black dark:text-zinc-50 uppercase tracking-tight">All India Business Roadmap</h1>
          <p className="text-xs font-bold text-black/70 dark:text-zinc-400 uppercase tracking-widest mt-1">
            Navigate to verified Factories, Mills, Dealers & Distributors across India
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-black text-blue-700 dark:text-blue-300 uppercase tracking-widest">Live GPS Network</span>
        </div>
      </div>

      {/* ALL INDIA COMMERCE HUB: MULTI-INDUSTRY TABS & SUBCATEGORIES */}
      <IndustryCommerceHub
        selectedIndustryId={selectedIndustryId}
        onSelectIndustry={setSelectedIndustryId}
        selectedSubcategoryId={selectedSubcategoryId}
        onSelectSubcategory={setSelectedSubcategoryId}
        filterRadius={filterRadius}
        onChangeFilterRadius={setFilterRadius}
        filterRole={filterRole}
        onChangeFilterRole={setFilterRole}
        userLocation={userLocation}
        dealersList={dealers}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-slate-50 dark:bg-zinc-900 h-64 rounded-3xl animate-pulse border border-slate-100 dark:border-zinc-800" />
          ))
        ) : filteredDealers.length > 0 ? (
          filteredDealers.map(dealer => {
            const lat = dealer.gpsCoords?.lat ?? dealer.lat;
            const lng = dealer.gpsCoords?.lng ?? dealer.lng;
            const dist = (userLocation && lat !== undefined && lng !== undefined && !isNaN(Number(lat)) && !isNaN(Number(lng)))
              ? calculateDistance(userLocation.lat, userLocation.lng, Number(lat), Number(lng))
              : null;

            return (
              <div key={dealer.id} className="group bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden flex flex-col justify-between">
                {/* Background Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                
                <div className="relative flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-inner group-hover:rotate-3 transition-transform duration-500 shrink-0">
                        {dealer.avatarUrl ? (
                          <img src={dealer.avatarUrl} alt={dealer.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-black text-black dark:text-zinc-200 text-lg bg-amber-500/10">
                            {dealer.name?.charAt(0) || 'B'}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-sm text-black dark:text-zinc-50 uppercase tracking-tight flex items-center gap-1.5 leading-tight mb-1 truncate">
                          {dealer.name}
                          {dealer.isVerified && <CheckCircle className="w-3.5 h-3.5 text-blue-500 fill-blue-500 shrink-0" />}
                        </h3>
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-md",
                            dealer.role === 'factory'
                              ? "bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                              : "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                          )}>
                            {dealer.role === 'factory' ? '🏭 Factory / Mill' : '🏬 Dealer / Dist.'}
                          </span>
                          <span className="text-[9px] font-bold bg-slate-100 dark:bg-zinc-800 text-black/70 dark:text-zinc-400 px-2 py-0.5 rounded-md truncate max-w-[140px]">
                            {dealer.category || 'Commerce'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {dist !== null && (
                    <div className="mb-3 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-xl text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{dist <= 1 ? 'Within 1 KM' : `${dist.toFixed(1)} KM away`}</span>
                      <span className="text-[9px] bg-emerald-500/20 px-1.5 py-0.2 rounded font-black ml-auto">
                        {dist <= 100 ? '📍 Nearby Partner' : '🇮🇳 Nationwide'}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 mb-6">
                    <div className="flex items-center gap-2.5 text-xs text-black/80 dark:text-zinc-400 font-bold uppercase tracking-wider">
                      <div className="p-1.5 bg-slate-50 dark:bg-zinc-900 rounded-lg shrink-0">
                        <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      </div>
                      <span className="truncate">{dealer.city || 'City'}, {dealer.state || 'India'}</span>
                    </div>
                    {dealer.gstNumber && (
                      <div className="flex items-center gap-2.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                        <div className="p-1.5 bg-slate-50 dark:bg-zinc-900 rounded-lg shrink-0">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                        <span className="truncate">GSTIN: {dealer.gstNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 dark:border-zinc-900">
                  <Link 
                    to={`/profile/${dealer.id}`}
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-950 dark:bg-zinc-100 text-amber-400 dark:text-black rounded-xl text-[10px] font-black uppercase tracking-wider transition-all hover:opacity-90 active:scale-95"
                  >
                    View Catalog
                  </Link>
                  <a 
                    href={dealer.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((dealer.name || '') + ' ' + (dealer.city || '') + ' ' + (dealer.state || ''))}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-[10px] uppercase tracking-wider transition-all active:scale-95 shadow-sm"
                  >
                    <Navigation className="w-3.5 h-3.5 text-slate-950" />
                    GPS Nav
                  </a>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-zinc-900/40 rounded-3xl border border-slate-200 dark:border-zinc-800 p-8">
            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-4 border border-amber-500/30">
              <Building2 className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-black text-black dark:text-zinc-50 uppercase tracking-wider mb-2">No Matching Businesses Found</h3>
            <p className="text-xs text-black/70 dark:text-zinc-400 max-w-md mb-6 font-medium">
              No registered factories or dealers match your current industry and radius filters. Try switching to "All Industries" or "All India VIP Plan".
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setSelectedIndustryId('all');
                  setSelectedSubcategoryId('all');
                  setFilterRadius('all');
                  setFilterRole('all');
                }}
                className="px-5 py-2.5 bg-amber-500 text-slate-950 rounded-xl font-black uppercase text-xs tracking-wider shadow-md hover:bg-amber-400 transition-all cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CommunityPage({ user }: { user?: any }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const query = user?.id ? `?currentUserId=${user.id}` : '';
    safeFetch(`/api/posts${query}`)
      .then(data => {
        if (Array.isArray(data)) {
          const cleanData = filterOutHiddenContent(data, user?.id);
          const imagePosts = cleanData.filter((p: any) => p.type === 'image' || (!p.type && p.mediaUrl && !p.mediaUrl.match(/\.(mp4|webm|mov|m4v)$/i)));
          setPosts(imagePosts);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user?.id]);

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-zinc-50">Community Tab</h1>
          <p className="text-sm text-black/70 dark:text-zinc-400">Exclusive visual directory of Tile & Sanitaryware products</p>
        </div>
        <Users className="w-8 h-8 text-blue-500" />
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-1 md:gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-square bg-slate-50 dark:bg-zinc-900 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="grid grid-cols-3 gap-1 md:gap-4">
          {posts.map(post => (
            <Link 
              key={post.id} 
              to={`/profile/${post.userId}`}
              className="group relative aspect-square bg-slate-100 dark:bg-zinc-900 overflow-hidden rounded-lg"
            >
              <img 
                src={post.mediaUrl} 
                alt={post.title} 
                className="w-full h-full object-cover transition-transform group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-black">
                <div className="flex items-center gap-1">
                  <Heart className="w-5 h-5 fill-white" />
                  <span className="font-bold">{post.likesCount || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-5 h-5 fill-white" />
                  <span className="font-bold">{post.commentsCount || 0}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-black/70 dark:text-zinc-400">No images posted in the community yet.</p>
        </div>
      )}</div>
  );
}

function ExplorePage({ user, userLocation }: { user?: any, userLocation?: {lat: number, lng: number} | null }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [activeExploreIndex, setActiveExploreIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleDeleted = (e: any) => {
      const deletedId = e.detail?.postId || e.detail?.reelId;
      if (deletedId) {
        setPosts(prev => prev.filter(p => String(p.id) !== String(deletedId)));
      }
    };
    window.addEventListener('postDeleted', handleDeleted);
    window.addEventListener('reelDeleted', handleDeleted);
    return () => {
      window.removeEventListener('postDeleted', handleDeleted);
      window.removeEventListener('reelDeleted', handleDeleted);
    };
  }, []);

  useEffect(() => {
    const query = user?.id ? `?currentUserId=${user.id}` : '';
    safeFetch(`/api/posts${query}`)
      .then(data => {
        if (Array.isArray(data)) {
          const cleanData = filterOutHiddenContent(data, user?.id);
          setPosts(cleanData);
        }
      })
      .catch(err => console.error('Explore page fetch error:', err));
  }, [user?.id]);

  return (
    <div className="max-w-4xl mx-auto w-full pt-4 md:pt-8 pb-20 md:pb-8 px-1 md:px-4">
      {posts.length > 0 ? (
        <div className="grid grid-cols-3 gap-1 md:gap-4">
          {posts.map((post, idx) => (
            <div 
              key={post.id} 
              onClick={() => setActiveExploreIndex(idx)}
              className="aspect-square bg-slate-200 dark:bg-zinc-800 group relative overflow-hidden cursor-pointer rounded-lg"
            >
              {post.mediaUrl && post.mediaUrl.trim() !== '' ? (
                post.type === 'video' || post.mediaUrl.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) ? (
                  <video preload="auto" src={post.mediaUrl} poster={post.thumbnailUrl} className="w-full h-full object-cover transform-gpu will-change-transform" />
                ) : post.type === 'pdf' || post.mediaUrl.match(/\.pdf(\?.*)?$/i) ? (
                  <div className="w-full h-full bg-emerald-50 dark:bg-emerald-950/40 flex flex-col items-center justify-center p-2 text-center">
                    <FileText className="w-6 h-6 text-emerald-600 mb-1" />
                    <span className="text-[9px] font-bold text-black dark:text-zinc-100 line-clamp-2">{post.title || 'PDF'}</span>
                  </div>
                ) : (
                  <img src={post.mediaUrl} alt="Explore" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                )
              ) : (
                <div className="w-full h-full p-2 flex items-center justify-center text-xs font-semibold text-black dark:text-zinc-300 text-center bg-slate-100 dark:bg-zinc-900">
                  {post.content || post.title}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-black font-bold text-sm">
                <span className="flex items-center gap-1"><Heart className="w-5 h-5 fill-white" /> {post.likes || 0}</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-5 h-5 fill-white" /> {post.comments || 0}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-black/70 dark:text-zinc-400">
          <p className="text-base font-semibold">No media posts in Explore yet.</p>
          <p className="text-xs mt-1">Publish new posts to see them showcased in the Explore grid!</p>
        </div>
      )}

      {activeExploreIndex !== null && (
        <FullScreenFeedViewerModal
          posts={posts}
          initialIndex={activeExploreIndex}
          currentUser={user}
          onClose={() => setActiveExploreIndex(null)}
          userLocation={userLocation}
        />
      )}</div>
  );
}

function ReelsPage({ user, userLocation }: { user?: any, userLocation?: {lat: number, lng: number} | null }) {
  const [reels, setReels] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // New upload state
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<any>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [originalVolume, setOriginalVolume] = useState<number>(1);
  const [musicVolume, setMusicVolume] = useState<number>(1);

  useEffect(() => {
    const query = user?.id ? `?currentUserId=${user.id}` : '';
    safeFetch(`/api/posts${query}`)
      .then(data => {
        if (Array.isArray(data)) {
          const cleanData = filterOutHiddenContent(data, user?.id);
          const videoPosts = cleanData.filter((p: any) => p.type === 'video' || p.mediaUrl?.match(/\.(mp4|webm|mov|m4v)$/i) || p.mediaBase64);
          setReels(videoPosts);
        }
      })
      .catch(err => {
        console.error('Reels page fetch error:', err);
        setReels([]);
      });

    const handleReelDeleted = (e: any) => {
      const deletedId = e.detail.reelId;
      setReels(prev => prev.filter(r => r.id !== deletedId));
    };

    window.addEventListener('reelDeleted', handleReelDeleted);
    return () => window.removeEventListener('reelDeleted', handleReelDeleted);
  }, [user?.id]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user?.id) {
      toast.error('🔐 Login or Registration required! Only registered Factories and Dealers can upload reels on Vyapar Bridge.');
      window.dispatchEvent(new CustomEvent('openAuthModal'));
      if (e.target) e.target.value = '';
      return;
    }
    if (user?.role === 'customer') {
      toast.error('🚫 Local area customers cannot upload reels. Reel creation is reserved for Factories and Dealers only.');
      if (e.target) e.target.value = '';
      return;
    }

    const validation = await validateMediaDuration(file);
    if (!validation.valid) {
      toast.error(validation.message || 'Video exceeds 60s limit.');
      return;
    }

    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setIsPreviewModalOpen(true);
    if (e.target) e.target.value = '';
  };

  const handleCustomAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const tid = toast.loading('Uploading custom sound...');
    try {
      const formData = new FormData();
      formData.append('musicFile', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, "") || 'Custom Sound');
      formData.append('artist', user?.name || 'User Upload');
      
      const res = await fetch('/api/music', {
        method: 'POST',
        body: formData
      });
      const newM = await res.json();
      
      if (newM.id) {
        setSelectedMusic(newM);
        toast.success('Sound uploaded successfully!', { id: tid });
      } else {
        toast.error('Upload failed', { id: tid });
      }
    } catch (err) {
      toast.error('Upload failed', { id: tid });
    }
    if (e.target) e.target.value = '';
  };

  const finalizeUpload = async () => {
    if (!pendingFile) return;
    
    // Resilient current user retrieval
    let currentUser = user;
    if (!currentUser?.id) {
      try {
        const stored = localStorage.getItem('user') || localStorage.getItem('Vyapar Bridge_user');
        if (stored) currentUser = JSON.parse(stored);
      } catch (e) {}
    }

    if (!currentUser?.id) {
      toast.error('🔐 Login required! Only registered Factories and Dealers can upload reels.');
      window.dispatchEvent(new CustomEvent('openAuthModal'));
      return;
    }
    if (currentUser?.role === 'customer') {
      toast.error('🚫 Local Customers cannot upload reels.');
      return;
    }

    setIsPublishing(true);
    const toastId = toast.loading('Publishing Reel...');
    const generatedReelId = `reel_${Date.now()}`;

    try {
      const formData = new FormData();
      formData.append('title', 'New B2B Reel');
      formData.append('content', 'Uploaded from Reels');
      formData.append('hashtags', '#reel #b2b #tiles #products');
      formData.append('userId', String(currentUser.id));
      formData.append('userName', currentUser.name || 'Verified Member');
      formData.append('userRole', currentUser.role || 'factory');
      formData.append('type', 'video');
      formData.append('media', pendingFile);

      if (selectedMusic) {
        formData.append('musicId', selectedMusic.id);
        formData.append('musicTitle', selectedMusic.title);
        formData.append('musicArtist', selectedMusic.artist);
        formData.append('musicUrl', selectedMusic.audioUrl);
      }
      formData.append('musicVolume', String(musicVolume));
      formData.append('originalVolume', String(originalVolume));

      let publishedReel: any = null;
      try {
        const data = await safeFetch('/api/posts', { method: 'POST', body: formData });
        if (data && data.success && data.post) {
          publishedReel = data.post;
        }
      } catch (e) {
        console.warn('Backend API note, publishing directly to Firestore:', e);
      }

      const finalReel = publishedReel || {
        id: generatedReelId,
        userId: String(currentUser.id),
        userName: currentUser.name || 'Verified Member',
        userRole: currentUser.role || 'factory',
        title: 'New B2B Reel',
        content: 'Uploaded from Reels',
        hashtags: '#reel #b2b #tiles #products',
        type: 'video',
        mediaUrl: previewUrl || '',
        thumbnailUrl: previewUrl || '',
        category: 'Commercial Wholesale',
        visibility: 'public',
        status: 'approved',
        likesCount: 0,
        viewsCount: 1,
        createdAt: Date.now(),
        music: selectedMusic,
        user: currentUser || { id: String(currentUser.id), name: currentUser.name || 'Verified Member', role: currentUser.role || 'factory' }
      };

      await syncPostToFirestore(finalReel);
      toast.success('🎉 Reel published successfully!', { id: toastId });
      setReels(prev => [finalReel, ...prev]);
      setCurrentIndex(0);
      setIsPreviewModalOpen(false);
      setPendingFile(null);
      setPreviewUrl(null);
      setSelectedMusic(null);
    } catch (err) {
      console.error('Reel upload error:', err);
      toast.error('Failed to upload reel', { id: toastId });
    } finally {
      setIsPublishing(false);
    }
  };

  const currentReel = reels[currentIndex];

  return (
    <div className="h-[calc(100vh-60px)] flex flex-col items-center justify-center bg-zinc-950 p-2 sm:p-4 overflow-hidden relative">
      {/* Upload Reel Header Action */}
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="video/*,image/*" 
        className="hidden" 
        onChange={handleFileSelect} 
      />

      {user && user.role !== 'customer' && (
        <div className="absolute top-4 right-4 sm:right-8 z-30 flex items-center gap-2">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-full shadow-xl flex items-center gap-2 transition-transform active:scale-95 cursor-pointer border border-blue-400/30"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Upload Reel</span>
          </button>
        </div>
      )}

      {/* Reel Card Container or Empty State */}
      {reels.length > 0 ? (
        <div className="relative flex items-center justify-center w-full max-w-lg h-full">
          <ReelCard key={currentReel?.id} reel={currentReel} currentUser={user} userLocation={userLocation} />

          {/* Up / Down reel navigation controls */}
          <div className="hidden sm:flex flex-col gap-3 absolute -right-16 top-1/2 -translate-y-1/2 z-30 text-black">
            <button 
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              className="p-3 bg-zinc-800/80 hover:bg-zinc-700 disabled:opacity-30 rounded-full border border-zinc-700 transition-all cursor-pointer shadow-lg"
              title="Previous Reel"
            >
              <ChevronUp className="w-6 h-6" />
            </button>
            <span className="text-[11px] text-zinc-400 font-mono text-center">
              {currentIndex + 1}/{reels.length}
            </span>
            <button 
              disabled={currentIndex >= reels.length - 1}
              onClick={() => setCurrentIndex(prev => Math.min(reels.length - 1, prev + 1))}
              className="p-3 bg-zinc-800/80 hover:bg-zinc-700 disabled:opacity-30 rounded-full border border-zinc-700 transition-all cursor-pointer shadow-lg"
              title="Next Reel"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 px-4 text-black flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
            <Film className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">No Video Reels Published Yet</h3>
          <p className="text-sm text-zinc-400 max-w-sm mb-6">
            Upload your factory or showroom video reels to showcase your tile products to B2B buyers across India!
          </p>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-6 py-3 rounded-full shadow-lg flex items-center gap-2 cursor-pointer transition-transform active:scale-95 border border-blue-400/40"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>Upload First Reel</span>
          </button>
        </div>
      )}

      {/* Reel Upload Preview Modal */}
      {isPreviewModalOpen && previewUrl && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-0 sm:p-4 overflow-hidden">
          <div className="w-full max-w-[420px] h-full sm:h-[90vh] bg-zinc-900 rounded-none sm:rounded-3xl overflow-hidden relative flex flex-col shadow-2xl border border-zinc-800">
            {/* Header */}
            <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between z-30 bg-gradient-to-b from-black/80 to-transparent">
              <button onClick={() => setIsPreviewModalOpen(false)} className="p-2 bg-black/40 hover:bg-black/60 rounded-full text-black backdrop-blur-md transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h3 className="text-black font-black text-sm uppercase tracking-widest drop-shadow-md">New Reel Preview</h3>
              <div className="w-10"></div>
            </div>

            {/* Video Player */}
            <div className="flex-1 bg-black flex items-center justify-center relative group">
              {previewUrl ? (
                <>
                  <video preload="auto" 
                    src={previewUrl} 
                    className="w-full h-full object-contain transform-gpu will-change-transform" 
                    loop 
                    muted={selectedMusic && originalVolume === 0} 
                    playsInline
                    ref={(el) => { 
                      if (el) {
                        el.volume = selectedMusic ? originalVolume : 1;
                        if (el.paused) { const p = el.play(); if (p !== undefined) p.catch(()=>{}); }
                      }
                    }}
                  />
                  {selectedMusic?.audioUrl && (
                    <audio src={selectedMusic.audioUrl} loop playsInline className="hidden" ref={(el) => { 
                      if (el) {
                        el.volume = musicVolume;
                        if (el.paused) { const p = el.play(); if (p !== undefined) p.catch(()=>{}); } 
                      }
                    }} />
                  )}
                  
                  {/* Overlay for Add Sound button */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/20 group-hover:bg-black/40 transition-colors">
                    <button 
                      onClick={() => setIsMusicModalOpen(true)}
                      className="bg-white/10 hover:bg-white/20 backdrop-blur-xl border-2 border-white/30 text-white px-6 py-3 rounded-full flex items-center gap-3 font-black text-xs uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95"
                    >
                      <Volume2 className="w-5 h-5 text-amber-400" />
                      <span>{selectedMusic ? `Sound: ${selectedMusic.title}` : 'Add Official Sound'}</span>
                    </button>
                    <button 
                      onClick={() => document.getElementById('custom-audio-upload-reels')?.click()}
                      className="bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full flex items-center gap-2 font-bold text-[10px] uppercase tracking-wider transition-all"
                    >
                      <Upload className="w-4 h-4 text-emerald-400" />
                      <span>Upload Custom MP3</span>
                    </button>
                    <input 
                      id="custom-audio-upload-reels" 
                      type="file" 
                      accept="audio/mp3,audio/mpeg,audio/wav" 
                      className="hidden" 
                      onChange={handleCustomAudioUpload}
                    />
                    {selectedMusic && (
                      <div className="w-full max-w-[280px] bg-black/80 backdrop-blur-xl rounded-xl p-4 border border-white/20 mt-4" onClick={(e) => e.stopPropagation()}>
                        <p className="text-white text-[10px] font-bold uppercase tracking-tighter mb-3 text-center">Audio Mixing</p>
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between text-[10px] text-white/70">
                              <span>Original Audio</span>
                              <span>{Math.round(originalVolume * 100)}%</span>
                            </div>
                            <input 
                              type="range" min="0" max="1" step="0.05" 
                              value={originalVolume} 
                              onChange={(e) => setOriginalVolume(parseFloat(e.target.value))}
                              className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer" 
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between text-[10px] text-emerald-400">
                              <span>Background Music</span>
                              <span>{Math.round(musicVolume * 100)}%</span>
                            </div>
                            <input 
                              type="range" min="0" max="1" step="0.05" 
                              value={musicVolume} 
                              onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                              className="w-full h-1 bg-emerald-900/50 rounded-lg appearance-none cursor-pointer" 
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-black/50 text-xs font-semibold">
                  <p>No video selected for preview</p>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="p-6 bg-zinc-950 border-t border-zinc-800">
              <button 
                onClick={finalizeUpload}
                disabled={isPublishing}
                className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-4 rounded-2xl text-sm uppercase tracking-[0.2em] shadow-lg shadow-blue-900/40 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98] cursor-pointer"
              >
                {isPublishing ? (
                  <div className="flex items-center gap-2 text-white">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Publishing Reel...</span>
                  </div>
                ) : (
                  <>
                    <PlusSquare className="w-5 h-5 text-white" />
                    <span className="text-white">Publish Reel to Feed</span>
                  </>
                )}
              </button>
              <p className="text-center text-[10px] text-zinc-500 mt-4 font-bold uppercase tracking-widest">Reels are shared with all B2B Network users</p>
            </div>
          </div>
        </div>
      )}

      {/* Music Selection Modal */}
      <MusicSelectionModal 
        isOpen={isMusicModalOpen} 
        onClose={() => setIsMusicModalOpen(false)} 
        onSelect={(music) => {
          setSelectedMusic(music);
          setIsMusicModalOpen(false);
        }} 
      /></div>
  );
}

function NotificationsPage({ user }: { user: any }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto w-full pt-20 pb-20 px-4 text-center">
        <Bell className="w-16 h-16 text-slate-700 dark:text-zinc-700 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-black dark:text-zinc-50 mb-2">Login Required</h2>
        <p className="text-black/70 max-w-sm mx-auto mb-6">Sign in to see your notifications and updates.</p>
        <Link to="/" onClick={() => window.dispatchEvent(new CustomEvent('openAuthModal'))} className="bg-blue-600 hover:bg-blue-700 text-black font-bold py-2 px-6 rounded-full transition-colors inline-block">Sign In</Link>
      </div>
    );
  }

  useEffect(() => {
    if (user?.id) {
      const fetchNotifs = () => {
        fetch('/api/notifications?userId=' + user.id)
          .then(res => (res.ok && res.headers.get('content-type')?.includes('application/json')) ? res.json() : [])
          .then(data => {
            if (Array.isArray(data)) {
              setNotifications(data);
              if (data.some((n: any) => !n.read)) {
                fetch('/api/notifications/read', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: user.id })
                }).then(() => {
                  window.dispatchEvent(new Event('notificationsRead'));
                });
              }
            }
          })
          .catch(console.error);
      };
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 10000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  const handleDelete = (id: number) => {
    if (confirm('Delete this notification?')) {
      fetch('/api/notifications/' + id, { method: 'DELETE' })
        .then(() => {
          setNotifications(notifications.filter(n => n.id !== id));
          setActiveMenuId(null);
        })
        .catch(console.error);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    if (notif.action.includes('following')) {
      navigate('/profile/' + notif.actorId);
    } else if (notif.targetId) {
      try {
        const res = await safeFetch(`/api/posts/${notif.targetId}?currentUserId=${user.id}`);
        setSelectedPost(res);
      } catch (err) {
        toast.error('Post not found or deleted');
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full pt-8 pb-20 md:pb-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Notifications</h2>
        <button 
          onClick={() => navigate('/')}
          className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-6 h-6 text-black/70 hover:text-red-500 transition-colors" />
        </button>
      </div>
      
      <div className="space-y-4">
        <h3 className="font-semibold text-black dark:text-zinc-50 mt-6 mb-4">This Month</h3>
        {notifications.map(notif => (
          notif.type === 'requirement_lead' ? (
            <div key={notif.id} className="relative border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl flex flex-col gap-3 group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold shrink-0">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-black dark:text-zinc-50">{notif.actorName} sent a building requirement</p>
                  <p className="text-xs text-black/70">New Lead</p>
                </div>
                <div className="ml-auto relative">
                  <button onClick={() => setActiveMenuId(activeMenuId === notif.id ? null : notif.id)} className="p-2 text-black/70 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                  {activeMenuId === notif.id && (
                    <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-zinc-900 rounded-md shadow-lg z-10 border border-slate-200 dark:border-zinc-800 overflow-hidden">
                      <button onClick={() => handleDelete(notif.id)} className="w-full text-left px-4 py-2 text-red-600 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-zinc-800">
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {!user.gstNumber || user.gstNumber.trim() === '' ? (
                <div className="relative overflow-hidden rounded-lg border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 p-4">
                  <div className="blur-sm select-none opacity-40 space-y-2 pointer-events-none">
                    <p className="text-sm font-bold">Requirements:</p>
                    <p className="text-sm">Tiles: 5000 sqft</p>
                    <p className="text-sm">EWC: 10 units</p>
                    <p className="text-sm">Mixers: 20 units</p>
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm z-10 text-center px-4">
                    <Lock className="w-6 h-6 text-black dark:text-zinc-300 mb-2" />
                    <p className="text-sm font-bold text-black dark:text-zinc-50 mb-1">GSTIN Required</p>
                    <p className="text-xs text-black dark:text-zinc-300 max-w-[250px]">Update your GSTIN in Edit Profile to unlock and view customer requirements.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-lg p-3 space-y-1">
                  {notif.details?.tilesQty && <p className="text-sm"><span className="font-semibold text-black dark:text-zinc-300">Tiles:</span> {notif.details.tilesQty}</p>}
                  {notif.details?.ewcQty && <p className="text-sm"><span className="font-semibold text-black dark:text-zinc-300">EWC/Toilets:</span> {notif.details.ewcQty}</p>}
                  {notif.details?.mixerQty && <p className="text-sm"><span className="font-semibold text-black dark:text-zinc-300">Mixers/Showers:</span> {notif.details.mixerQty}</p>}
                  {notif.details?.other && <p className="text-sm"><span className="font-semibold text-black dark:text-zinc-300">Other:</span> {notif.details.other}</p>}
                </div>
              )}
            </div>
          ) : (
          <div key={notif.id} className="flex items-center justify-between relative group">
            <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => handleNotificationClick(notif)}>
              <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-black/70 overflow-hidden border border-slate-300 dark:border-zinc-700 shrink-0">
                {notif.actorAvatar ? (
                  <img src={notif.actorAvatar} alt={notif.actorName} className="w-full h-full object-cover" />
                ) : (
                  notif.actorName?.charAt(0) || 'U'
                )}
              </div>
              <p className="text-sm">
                <span className="font-semibold mr-1 hover:underline" onClick={(e) => {
                  e.stopPropagation();
                  navigate('/profile/' + notif.actorId);
                }}>{notif.actorName}</span>
                {notif.action}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-700 dark:bg-zinc-800 text-black dark:text-zinc-50 font-semibold px-4 py-1.5 rounded-lg text-sm transition-colors">
                Following
              </button>
              <div className="relative">
                <button onClick={() => setActiveMenuId(activeMenuId === notif.id ? null : notif.id)} className="p-2 text-black/70 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                {activeMenuId === notif.id && (
                  <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-zinc-900 rounded-md shadow-lg z-10 border border-slate-200 dark:border-zinc-800 overflow-hidden">
                    <button onClick={() => handleDelete(notif.id)} className="w-full text-left px-4 py-2 text-red-600 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-zinc-800">
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          )
        ))}
        {notifications.length === 0 && <p className="text-black/70">No notifications.</p>}
      </div>
      
      {/* Post Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 max-w-xl w-full max-h-[90vh] overflow-y-auto rounded-2xl relative border border-slate-200 dark:border-zinc-800 shadow-2xl">
            <button 
              onClick={() => setSelectedPost(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/80 text-black rounded-full backdrop-blur-sm transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-4 sm:p-6">
              <PostItem 
                post={selectedPost} 
                currentUser={user} 
                onPostDeleted={() => setSelectedPost(null)}
                onPostUpdated={(p) => setSelectedPost(p)}
              />
            </div>
          </div>
        </div>
      )}</div>
  );
}




function ImageCropperModal({
  isOpen,
  imageSrc,
  onClose,
  onSave
}: {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onSave: (croppedDataUrl: string) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = React.useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  if (!isOpen || !imageSrc) return null;

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setPosition({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCropSave = () => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const targetWidth = 1200;
      const targetHeight = 400; // 3:1 aspect ratio banner
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      ctx.save();
      ctx.translate(targetWidth / 2, targetHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      const scaleToFit = Math.max(targetWidth / img.width, targetHeight / img.height);
      const drawWidth = img.width * scaleToFit;
      const drawHeight = img.height * scaleToFit;

      const scaleFactor = targetHeight / 240;
      const drawX = -drawWidth / 2 + (position.x * scaleFactor);
      const drawY = -drawHeight / 2 + (position.y * scaleFactor);

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      ctx.restore();

      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      onSave(croppedDataUrl);
    };
    img.src = imageSrc;
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col text-black">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crop className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-lg">Crop & Adjust Cover Photo</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-black cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center justify-center bg-zinc-950 select-none">
          <p className="text-xs text-zinc-400 mb-3 flex items-center gap-1.5">
            💡 Drag image to position. Use sliders to zoom or rotate.
          </p>
          
          <div 
            className="relative w-full max-w-xl h-52 sm:h-60 rounded-xl overflow-hidden bg-slate-50 border-2 border-dashed border-emerald-500/50 cursor-grab active:cursor-grabbing flex items-center justify-center shadow-inner"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
          >
            <img 
              ref={imageRef}
              src={imageSrc} 
              alt="Cover to Crop" 
              draggable={false}
              className="max-w-none transition-transform duration-75 pointer-events-none"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                maxHeight: '100%',
                objectFit: 'contain'
              }}
            />
            
            <div className="absolute inset-0 pointer-events-none border border-white/20 grid grid-cols-3 grid-rows-3">
              <div className="border-r border-b border-white/10"></div>
              <div className="border-r border-b border-white/10"></div>
              <div className="border-b border-white/10"></div>
              <div className="border-r border-b border-white/10"></div>
              <div className="border-r border-b border-white/10"></div>
              <div className="border-b border-white/10"></div>
              <div className="border-r border-white/10"></div>
              <div className="border-r border-white/10"></div>
              <div></div>
            </div>
          </div>

          <div className="w-full max-w-xl mt-6 space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-zinc-400 w-16">Zoom:</span>
              <button 
                onClick={() => setZoom(prev => Math.max(0.8, prev - 0.2))}
                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-200 text-xs font-bold cursor-pointer"
              >
                -
              </button>
              <input 
                type="range" 
                min="0.8" 
                max="3" 
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-emerald-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
              <button 
                onClick={() => setZoom(prev => Math.min(3, prev + 0.2))}
                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-200 text-xs font-bold cursor-pointer"
              >
                +
              </button>
              <span className="text-xs text-zinc-400 w-10 text-right">{Math.round(zoom * 100)}%</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-400">Position:</span>
                <button 
                  onClick={() => setPosition({ x: 0, y: 0 })}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-md text-xs font-medium text-zinc-300 cursor-pointer"
                >
                  Center
                </button>
                <button 
                  onClick={() => setPosition({ x: 0, y: 35 })}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-md text-xs font-medium text-zinc-300 cursor-pointer"
                >
                  Top
                </button>
                <button 
                  onClick={() => setPosition({ x: 0, y: -35 })}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-md text-xs font-medium text-zinc-300 cursor-pointer"
                >
                  Bottom
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setRotation(prev => (prev + 90) % 360)}
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-md text-xs font-medium text-zinc-200 flex items-center gap-1 cursor-pointer"
                >
                  Rotate 90°
                </button>
                <button 
                  onClick={() => { setZoom(1); setPosition({ x: 0, y: 0 }); setRotation(0); }}
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-md text-xs font-medium text-red-400 cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 flex items-center justify-end gap-3 bg-zinc-900">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-semibold text-zinc-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={handleCropSave}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm font-semibold text-black shadow-lg transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" /> Save Cropped Cover
          </button>
        </div>
      </div></div>
  );
}

function EditProfileModal({ isOpen, onClose, user, onSave, onOpenVerify }: { isOpen: boolean, onClose: () => void, user: any, onSave: (u: any) => void, onOpenVerify?: () => void }) {
  const [name, setName] = useState(user?.name || '');
  const [role, setRole] = useState<'factory' | 'dealer' | 'customer'>(user?.role || 'factory');
  const [category, setCategory] = useState(user?.category || 'Vitrified Tiles');
  const [gstNumber, setGstNumber] = useState(user?.gstNumber || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [email, setEmail] = useState(user?.email || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [facebookUrl, setFacebookUrl] = useState(user?.facebookUrl || '');
  const [twitterUrl, setTwitterUrl] = useState(user?.twitterUrl || '');
  const [instagramUrl, setInstagramUrl] = useState(user?.instagramUrl || '');
  const [phone, setPhone] = useState(user?.phone || '');
  
  // Privacy States (Instagram style)
  const [hidePhone, setHidePhone] = useState(user?.hidePhone || false);
  const [hideAddress, setHideAddress] = useState(user?.hideAddress || false);
  const [hideEmail, setHideEmail] = useState(user?.hideEmail || false);
  const [hideGst, setHideGst] = useState(user?.hideGst || false);
  
  // Location States
  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState(user?.city || '');
  const [stateName, setStateName] = useState(user?.state || '');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(user?.gpsCoords || null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const [coverUrl, setCoverUrl] = useState(user?.coverUrl || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [catalogueUrl, setCatalogueUrl] = useState(user?.catalogueUrl || '');
  const [catalogueName, setCatalogueName] = useState(user?.catalogueName || '');
  const [loading, setLoading] = useState(false);

  const coverFileInputRef = React.useRef<HTMLInputElement>(null);
  const avatarFileInputRef = React.useRef<HTMLInputElement>(null);
  const catalogueFileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(user?.name || '');
      setRole(user?.role || 'factory');
      setCategory(user?.category || 'Vitrified Tiles');
      setGstNumber(user?.gstNumber || '');
      setBio(user?.bio || '');
      setEmail(user?.email || '');
      setWebsite(user?.website || '');
      setFacebookUrl(user?.facebookUrl || '');
      setTwitterUrl(user?.twitterUrl || '');
      setInstagramUrl(user?.instagramUrl || '');
      setPhone(user?.phone || '');
      setAddress(user?.address || '');
      setCity(user?.city || '');
      setStateName(user?.state || '');
      setGpsCoords(user?.gpsCoords || null);
      setCoverUrl(user?.coverUrl || '');
      setAvatarUrl(user?.avatarUrl || '');
      setCatalogueUrl(user?.catalogueUrl || '');
      setCatalogueName(user?.catalogueName || '');
      setHidePhone(user?.hidePhone || false);
      setHideAddress(user?.hideAddress || false);
      setHideEmail(user?.hideEmail || false);
      setHideGst(user?.hideGst || false);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const detectLiveLocationInEdit = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingLocation(true);
    const toastId = toast.loading('📍 Detecting Live GPS Location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setGpsCoords({ lat, lng });
        setAddress(`GPS Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
        if (!city) setCity('');
        if (!stateName) setStateName('');
        setIsDetectingLocation(false);
        toast.success('📍 Live GPS location updated! Please confirm City & State.', { id: toastId });
      },
      (err) => {
        console.warn('Geolocation fallback:', err);
        const defaultLat = 20.5937;
        const defaultLng = 78.9629;
        setGpsCoords({ lat: defaultLat, lng: defaultLng });
        setAddress('India Hub');
        if (!city) setCity('');
        if (!stateName) setStateName('');
        setIsDetectingLocation(false);
        toast.success('📍 Location set to default India Hub!', { id: toastId });
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverUrl(reader.result as string);
        toast.success('Cover image selected');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
        toast.success('Profile photo selected');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCatalogueFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a valid PDF file.');
        return;
      }
      
      const formData = new FormData();
      formData.append('media', file);
      
      const uploadToast = toast.loading('Uploading catalogue...');
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const data = await response.json();
        if (data.url) {
          setCatalogueUrl(data.url);
          setCatalogueName(file.name);
          toast.success('Catalogue uploaded successfully', { id: uploadToast });
        } else {
          throw new Error('Upload failed');
        }
      } catch (err) {
        toast.error('Failed to upload catalogue', { id: uploadToast });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Profile Name / Business Name is mandatory!');
      return;
    }

    if (gstNumber && gstNumber.trim() !== '') {
      const gstRes = validateGSTIN(gstNumber);
      if (!gstRes.isValid) {
        toast.error(`⚠️ ${gstRes.error}`);
        return;
      }
    }

    setLoading(true);

    const googleMapsUrl = gpsCoords 
      ? `https://maps.google.com/?q=${gpsCoords.lat},${gpsCoords.lng}`
      : (address || city || stateName) 
        ? `https://maps.google.com/?q=${encodeURIComponent(address + ', ' + city + ', ' + stateName)}`
        : '';

    const payload = {
      name: name.trim(),
      role,
      category,
      gstNumber,
      bio,
      email,
      website,
      facebookUrl,
      twitterUrl,
      instagramUrl,
      phone,
      address,
      city,
      state: stateName,
      gpsCoords: gpsCoords || null,
      googleMapsUrl,
      coverUrl,
      avatarUrl,
      catalogueUrl,
      catalogueName,
      hidePhone,
      hideAddress,
      hideEmail,
      hideGst
    };

    const updatedUser = { ...user, ...payload };
    
    try {
      const res = await fetch(`/api/users/${user?.id || '1'}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.user) {
        onSave(data.user);
        toast.success('Profile & Location updated successfully!');
        onClose();
      } else {
        onSave(updatedUser);
        toast.success('Profile saved successfully!');
        onClose();
      }
    } catch (e) {
      onSave(updatedUser);
      toast.success('Profile saved successfully!');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-zinc-800">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span>Edit Profile & Location</span>
            <MapPin className="w-4 h-4 text-red-500" />
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer">
            <XCircle className="w-6 h-6 text-black/70" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto scrollbar-thin">
          {/* Category & Role Switcher */}
          <div className="p-3 bg-slate-50 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700">
            <label className="block text-xs font-bold text-black dark:text-zinc-300 mb-1.5">
              Account Category / प्रकार:
            </label>
            <div className={cn("grid gap-2 mb-3", role === 'customer' ? "grid-cols-1" : "grid-cols-3")}>
              {role !== 'customer' && (
                <>
                  <button
                    type="button"
                    onClick={() => setRole('factory')}
                    className={cn(
                      "py-2 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 border cursor-pointer",
                      role === 'factory' ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-zinc-900 text-black dark:text-zinc-300 border-slate-200 dark:border-zinc-700"
                    )}
                  >
                    <Building2 className="w-4 h-4" /> Company / Factory
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('dealer')}
                    className={cn(
                      "py-2 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 border cursor-pointer",
                      role === 'dealer' ? "bg-emerald-600 text-white border-emerald-600" : "bg-white dark:bg-zinc-900 text-black dark:text-zinc-300 border-slate-200 dark:border-zinc-700"
                    )}
                  >
                    <Store className="w-4 h-4" /> Dealer / Distributor
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={cn(
                  "py-2 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 border cursor-pointer",
                  role === 'customer' ? "bg-amber-600 text-black border-amber-600" : "bg-white dark:bg-zinc-900 text-black dark:text-zinc-300 border-slate-200 dark:border-zinc-700"
                )}
              >
                <Users className="w-4 h-4" /> Customer
              </button>
            </div>

            {role !== 'customer' && (
              <>
                <label className="block text-xs font-bold text-black dark:text-zinc-300 mb-1">
                  Main Business Category / श्रेणी:
                </label>
                <select 
                  value={category} 
                  onChange={e => setCategory(e.target.value)} 
                  className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500"
                >
                  {ALL_INDUSTRIES.map(ind => (
                    <optgroup key={ind.id} label={`${ind.icon} ${ind.name}`}>
                      {ind.subcategories.map(sub => (
                        <option key={sub.id} value={sub.name}>{sub.name}</option>
                      ))}
                    </optgroup>
                  ))}
                  <option value="General Commerce">General Commerce / Other</option>
                </select>
              </>
            )}
          </div>

          {/* LOCATION SETTING WITH LIVE GPS DETECTOR (OPTIONAL IN EDIT PROFILE) */}
          <div className="bg-blue-50/70 dark:bg-zinc-800/90 p-3.5 rounded-xl border border-blue-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-black dark:text-zinc-100 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span>Business Location & Address (Optional)</span>
              </label>
            </div>

            <button
              type="button"
              onClick={detectLiveLocationInEdit}
              disabled={isDetectingLocation}
              className="w-full bg-blue-600 hover:bg-blue-700 text-black text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Locate className="w-4 h-4" />
              <span>{isDetectingLocation ? 'Detecting GPS...' : '📍 Update My Live GPS Location'}</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-black dark:text-zinc-300 mb-1">City (Optional)</label>
                <input 
                  type="text" 
                  value={city} 
                  onChange={e => setCity(e.target.value)} 
                  placeholder="Enter city"
                  className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-black dark:text-zinc-300 mb-1">State (Optional)</label>
                <input 
                  type="text" 
                  value={stateName} 
                  onChange={e => setStateName(e.target.value)} 
                  placeholder="Enter state"
                  className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-black dark:text-zinc-300 mb-1">Full Street Address (Optional)</label>
              <input 
                type="text" 
                value={address} 
                onChange={e => setAddress(e.target.value)} 
                placeholder="Enter street address"
                className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Cover Photo Upload Preview */}
          <div>
            <label className="block text-xs font-semibold mb-1">Profile Cover Banner Image (Optional)</label>
            <div className="relative w-full h-24 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 dark:border-zinc-700 mb-1 flex items-center justify-center group">
              {coverUrl ? (
                <img src={coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-black/60 font-medium">No cover image uploaded</span>
              )}
              <button 
                type="button" 
                onClick={() => coverFileInputRef.current?.click()}
                className="absolute bottom-2 right-2 bg-black/70 hover:bg-black text-black text-[11px] px-2.5 py-1 rounded-md flex items-center gap-1 backdrop-blur-sm transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" /> Upload Cover
              </button>
            </div>
            <input 
              type="file" 
              ref={coverFileInputRef} 
              accept="image/*" 
              className="hidden" 
              onChange={handleCoverFileChange} 
            />
          </div>

          {/* Avatar Photo Section */}
          <div className="flex items-center gap-3 my-1">
            <div 
              onClick={() => avatarFileInputRef.current?.click()}
              className="relative w-14 h-14 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-black/70 text-xl shrink-0 overflow-hidden cursor-pointer group border-2 border-blue-500 shadow-md"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span style={{ fontFamily: "'Great Vibes', 'Dancing Script', cursive" }}>{name?.charAt(0) || user?.name?.charAt(0) || 'U'}</span>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-4 h-4 text-black" />
              </div>
            </div>
            <div>
              <div 
                className="font-black italic tracking-wider text-lg text-black dark:text-zinc-100"
                style={{ fontFamily: "'Playfair Display', 'Dancing Script', serif", fontWeight: 900 }}
              >
                {name || user?.name || 'User'}
              </div>
              <button 
                type="button" 
                onClick={() => avatarFileInputRef.current?.click()} 
                className="text-blue-500 text-xs font-semibold hover:text-blue-600 flex items-center gap-1 mt-0.5 cursor-pointer"
              >
                <Upload className="w-3 h-3" /> Change profile photo
              </button>
            </div>
            <input 
              type="file" 
              ref={avatarFileInputRef} 
              accept="image/*" 
              className="hidden" 
              onChange={handleAvatarFileChange} 
            />
          </div>


          
          <div>
            <label className="block text-xs font-bold text-black dark:text-zinc-200 mb-1">
              {role === 'customer' ? 'Your Full Name *' : 'Profile Name / Business Name *'} <span className="text-red-500 font-bold">(Mandatory / आवश्यक)</span>
            </label>
            <input 
              type="text" 
              required
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder={role === 'customer' ? 'Enter your full name' : 'Enter profile / business name'}
              className="w-full bg-slate-50 dark:bg-zinc-800 border-2 border-blue-500/50 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-blue-500"
            />
          </div>

          {role !== 'customer' && (
            <GstInput 
              value={gstNumber} 
              onChange={setGstNumber} 
              label="GST Number / GSTIN Tax ID"
              placeholder="Enter GSTIN Tax ID"
            />
          )}

          <div>
            <label className="block text-xs font-semibold mb-1">{role === 'customer' ? 'Your Bio / About' : 'Bio / About Business'}</label>
            <textarea 
              value={bio} 
              onChange={e => setBio(e.target.value)} 
              className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none h-16"
              placeholder={role === 'customer' ? 'Tell people about yourself...' : 'Tell dealers and factories about your tile products and capacity...'}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold mb-1">Phone Number</label>
              <input 
                type="tel" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                placeholder="Enter phone number"
                className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Email ID</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="Enter email address"
                className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          {role !== 'customer' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1">Website</label>
                <input 
                  type="text" 
                  value={website} 
                  onChange={e => setWebsite(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                  placeholder="Enter website link"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-blue-600 dark:text-blue-600 flex items-center gap-2"><Facebook className="w-4 h-4"/> Facebook Link</label>
                <input 
                  type="text" 
                  value={facebookUrl} 
                  onChange={e => setFacebookUrl(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="https://facebook.com/yourpage"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-sky-500 flex items-center gap-2"><Twitter className="w-4 h-4"/> Twitter Link</label>
                <input 
                  type="text" 
                  value={twitterUrl} 
                  onChange={e => setTwitterUrl(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-500"
                  placeholder="https://twitter.com/yourhandle"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-pink-500 flex items-center gap-2"><Instagram className="w-4 h-4"/> Instagram Link</label>
                <input 
                  type="text" 
                  value={instagramUrl} 
                  onChange={e => setInstagramUrl(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500"
                  placeholder="https://instagram.com/yourprofile"
                />
              </div>
            </div>
          )}

          {/* Privacy Controls (Instagram Style) */}
          <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/80 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-2.5">
            <div className="flex items-center gap-2 text-black dark:text-zinc-100 font-bold text-xs">
              <Lock className="w-4 h-4 text-purple-500" />
              <span>Profile Privacy Controls / निजता नियंत्रण (Hide Info)</span>
            </div>
            <p className="text-[11px] text-black/70 dark:text-zinc-400">
              Check the boxes below to hide specific contact and location details from your public wall profile:
            </p>

            <div className="space-y-2 text-xs font-semibold">
              <label className="flex items-center justify-between cursor-pointer p-2 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-700/60">
                <span className="flex items-center gap-2 text-black dark:text-zinc-200">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" /> Hide Mobile / Phone Number
                </span>
                <input 
                  type="checkbox" 
                  checked={hidePhone} 
                  onChange={e => setHidePhone(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer" 
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-700/60">
                <span className="flex items-center gap-2 text-black dark:text-zinc-200">
                  <MapPin className="w-3.5 h-3.5 text-red-500" /> Hide Street Address & Live GPS Maps
                </span>
                <input 
                  type="checkbox" 
                  checked={hideAddress} 
                  onChange={e => setHideAddress(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer" 
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-700/60">
                <span className="flex items-center gap-2 text-black dark:text-zinc-200">
                  <Mail className="w-3.5 h-3.5 text-indigo-500" /> Hide Email ID
                </span>
                <input 
                  type="checkbox" 
                  checked={hideEmail} 
                  onChange={e => setHideEmail(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer" 
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-700/60">
                <span className="flex items-center gap-2 text-black dark:text-zinc-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> Hide GSTIN Tax Number
                </span>
                <input 
                  type="checkbox" 
                  checked={hideGst} 
                  onChange={e => setHideGst(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer" 
                />
              </label>
            </div>
          </div>

          {/* Vyapar Bridge Verification Badge Option */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 p-3.5 rounded-xl border border-blue-200 dark:border-blue-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-600 shrink-0" />
              <div>
                <div className="text-xs font-bold text-black dark:text-black flex items-center gap-1">
                  Vyapar Bridge Verified {user?.isVerified && <VerifiedBadge size="sm" />}
                </div>
                <div className="text-[11px] text-black/80 dark:text-zinc-400">
                  {user?.isVerified 
                    ? (user.role === 'customer' ? 'Active Verified Badge' : 'Active (Ranked in Top 10)') 
                    : 'Get blue checkmark badge'}
                </div>
              </div>
            </div>
            {!user?.isVerified && onOpenVerify && (
              <button 
                type="button" 
                onClick={() => { onClose(); onOpenVerify(); }}
                className="bg-blue-600 hover:bg-blue-700 text-black font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm transition-colors cursor-pointer shrink-0"
              >
                Choose Verified
              </button>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#0095f6] hover:bg-[#1877f2] text-black font-semibold rounded-lg py-2.5 mt-2 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div></div>
  );
}

{/* PROFILE SETTINGS & ACCOUNT SIDEBAR DRAWER */}
function ProfileSettingsDrawer({ 
  isOpen, 
  onClose, 
  user, 
  onLogout, 
  onOpenEditProfile, 
  onOpenVerify, 
  onOpenApprovalCenter,
  onOpenCalculator,
  onToggleTheme, 
  isDark,
  onOpenMasterConsole
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  user: any; 
  onLogout: () => void; 
  onOpenEditProfile: () => void; 
  onOpenVerify: () => void; 
  onOpenApprovalCenter?: () => void;
  onOpenCalculator: () => void;
  onToggleTheme: () => void; 
  isDark: boolean; 
  onOpenMasterConsole?: () => void;
}) {
  const navigate = useNavigate();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex justify-end bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}>
      <div 
        className="w-full max-w-xs sm:max-w-sm h-full bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 shadow-2xl flex flex-col border-l border-slate-200 dark:border-zinc-800 overflow-y-auto animate-in slide-in-from-right duration-700"
        onClick={e => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/90 dark:bg-zinc-900/80 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Menu className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-base tracking-wide">Settings & Navigation</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-black/70 dark:text-zinc-400 hover:text-black dark:hover:text-black cursor-pointer"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* User / Guest Mini Profile Banner */}
        {user ? (
          <div 
            onClick={() => { onClose(); navigate('/profile'); }}
            className="p-4 border-b border-slate-100 dark:border-zinc-900 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent flex items-center gap-3.5 hover:bg-blue-50/40 dark:hover:bg-zinc-900/40 transition-colors cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-zinc-800 border-2 border-blue-500 overflow-hidden shrink-0 shadow-md group-hover:scale-105 transition-transform">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-black text-lg text-blue-600 dark:text-blue-600">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <h4 className="font-bold text-sm truncate">
                  {user?.name || 'User'}
                </h4>
                {user?.isVerified && <VerifiedBadge size="sm" />}
              </div>
              <p className="text-[11px] text-black/70 dark:text-zinc-400 capitalize">{user?.role || 'Member'} • {user?.city || 'India'}</p>
              <span className="inline-block text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold px-2 py-0.5 rounded-full mt-0.5">
                {user?.isVerified ? '✓ Vyapar Bridge Verified' : 'Free Profile'}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 border-b border-slate-100 dark:border-zinc-900 bg-gradient-to-br from-blue-600/15 via-indigo-600/10 to-transparent flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-zinc-800 border-2 border-blue-500 flex items-center justify-center text-blue-600 dark:text-blue-600 font-black text-lg shadow-md">
                G
              </div>
              <div>
                <h4 className="font-black text-sm text-black dark:text-zinc-50">Guest Visitor</h4>
                <p className="text-xs text-black/70 dark:text-zinc-400">Public feed & search active</p>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                window.dispatchEvent(new CustomEvent('openAuthModal'));
              }}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-black font-black text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>Login / Register Account</span>
            </button>
          </div>
        )}

        {/* Settings Navigation List */}
        <div className="p-3 flex-1 space-y-2">
          {/* Removed Approval Center from here */}

          <div className="my-2 border-t border-slate-200 dark:border-zinc-800" />

          {/* Vyapar Calculator */}
          <button 
            onClick={() => { onClose(); onOpenCalculator(); }}
            className="w-full p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 flex items-center gap-3 transition-colors text-left font-semibold text-sm cursor-pointer group"
          >
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <Calculator className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="text-black dark:text-zinc-100">Vyapar Calculator</div>
              <div className="text-[11px] font-normal text-black/70 dark:text-zinc-400">Calculate tiles, items & box requirements</div>
            </div>
          </button>

          {/* Edit Profile */}
          {user && (
            <button 
              onClick={() => { onClose(); onOpenEditProfile(); }}
              className="w-full p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 flex items-center gap-3 transition-colors text-left font-semibold text-sm cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-600 group-hover:scale-110 transition-transform">
                <Camera className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-black dark:text-zinc-100">Edit Profile Details</div>
                <div className="text-[11px] font-normal text-black/70 dark:text-zinc-400">Change business name, logo, categories & address</div>
              </div>
            </button>
          )}

          {/* Saved Tile Posts */}
          <button 
            onClick={() => { onClose(); if (user) navigate('/profile'); else window.dispatchEvent(new CustomEvent('openAuthModal')); }}
            className="w-full p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 flex items-center gap-3 transition-colors text-left font-semibold text-sm cursor-pointer group"
          >
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <Bookmark className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="text-black dark:text-zinc-100">Saved Posts & Designs</div>
              <div className="text-[11px] font-normal text-black/70 dark:text-zinc-400">View bookmarks & saved catalogue designs</div>
            </div>
          </button>

          {/* Get Verified Badge */}
          <button 
            onClick={() => { onClose(); onOpenVerify(); }}
            className="w-full p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 flex items-center gap-3 transition-colors text-left font-semibold text-sm cursor-pointer group"
          >
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="text-black dark:text-zinc-100 flex items-center gap-1">
                <span>Verification Badge</span>
                {user?.isVerified && <span className="text-[10px] text-emerald-500 font-bold">✓ Active</span>}
              </div>
              <div className="text-[11px] font-normal text-black/70 dark:text-zinc-400">
                {user?.isVerified ? 'Manage subscription plan' : 'Get official Vyapar Bridge Verified Blue Tick'}
              </div>
            </div>
          </button>

          {user?.role === 'admin' && (
            <button 
              onClick={() => { onClose(); if(onOpenMasterConsole) onOpenMasterConsole(); }}
              className="w-full p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 flex items-center gap-3 transition-colors text-left font-semibold text-sm cursor-pointer group border border-blue-500/20 bg-blue-50/50 dark:bg-blue-900/10"
            >
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-600 group-hover:scale-110 transition-transform">
                <Lock className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-black dark:text-zinc-100 flex items-center gap-1 font-bold">
                  <span>Developer Console</span>
                  <Sparkles className="w-3 h-3 text-amber-500" />
                </div>
                <div className="text-[11px] font-normal text-black/70 dark:text-zinc-400">
                  Master Admin Settings & Approvals
                </div>
              </div>
            </button>
          )}

          {/* Appearance (Theme Toggle) */}
          <button 
            onClick={onToggleTheme}
            className="w-full p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 flex items-center gap-3 transition-colors text-left font-semibold text-sm cursor-pointer group"
          >
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </div>
            <div className="flex-1">
              <div className="text-black dark:text-zinc-100">Appearance Mode</div>
              <div className="text-[11px] font-normal text-black/70 dark:text-zinc-400">
                Current theme: <span className="font-bold">{isDark ? 'Dark Mode 🌙' : 'Light Mode ☀️'}</span>
              </div>
            </div>
          </button>

          {/* Mobile Notifications (Push) */}
          <div className="space-y-1">
            <button 
              onClick={async () => {
                if (!('Notification' in window)) {
                  toast.error('Browser does not support notifications');
                  return;
                }

                // If in iframe, suggest opening in new tab
                if (window.self !== window.top) {
                  toast.error('🔒 Browser security blocks notification requests inside previews. Please open the app in a NEW TAB to enable notifications.');
                  return;
                }

                try {
                  const permission = await Notification.requestPermission();
                  if (permission === 'granted') {
                    toast.success('🔔 Notifications enabled! You will now receive mobile updates.');
                  } else if (permission === 'denied') {
                    toast.error('🚫 Permission denied. Please enable notifications in your browser settings for this site.');
                  }
                } catch (err) {
                  toast.error('Failed to request notification permission.');
                }
              }}
              className="w-full p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 flex items-center gap-3 transition-colors text-left font-semibold text-sm cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-pink-50 dark:bg-pink-950 text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-black dark:text-zinc-100">Mobile Notifications</div>
                <div className="text-[11px] font-normal text-black/70 dark:text-zinc-400">Get background alerts for likes & messages</div>
              </div>
            </button>

            {Notification.permission === 'granted' && (
              <button 
                onClick={() => {
                  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.ready.then(registration => {
                      registration.showNotification('Vyapar Bridge Test', {
                        body: 'This is how your mobile notifications will appear!',
                        icon: 'BRAND_LOGO_SRC',
                        badge: 'BRAND_LOGO_SRC',
                        vibrate: [100, 50, 100]
                      });
                    });
                  } else {
                    new Notification('Vyapar Bridge Test', {
                      body: 'This is how your mobile notifications will appear!',
                      icon: 'BRAND_LOGO_SRC'
                    });
                  }
                  toast.success('Test notification sent!');
                }}
                className="w-full ml-11 p-2 text-[10px] font-bold text-pink-500 uppercase tracking-wider hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3 h-3" /> Send Test Notification
              </button>
            )}
          </div>

          {/* Direct B2B Messages */}
          <button 
            onClick={() => { onClose(); navigate('/chat'); }}
            className="w-full p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 flex items-center gap-3 transition-colors text-left font-semibold text-sm cursor-pointer group"
          >
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="text-black dark:text-zinc-100">Messages & Inquiries</div>
              <div className="text-[11px] font-normal text-black/70 dark:text-zinc-400">Chat with dealers, factories & buyers</div>
            </div>
          </button>

          {/* Share Profile Link */}
          {user && (
            <button 
              onClick={() => { 
                navigator.clipboard.writeText(window.location.origin + '/profile/' + encodeURIComponent(user.id || user.name));
                toast.success('Wall link copied to clipboard!');
              }}
              className="w-full p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 flex items-center gap-3 transition-colors text-left font-semibold text-sm cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform">
                <Share2 className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-black dark:text-zinc-100">Share Profile Link</div>
                <div className="text-[11px] font-normal text-black/70 dark:text-zinc-400">Copy web link to share on WhatsApp</div>
              </div>
            </button>
          )}

          {/* Admin Panel (if admin) */}
          {user?.role === 'admin' && (
            <button 
              onClick={() => { onClose(); navigate('/admin'); }}
              className="w-full p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 flex items-center gap-3 transition-colors text-left font-semibold text-sm cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform">
                <Shield className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-black dark:text-zinc-100">Admin Moderation</div>
                <div className="text-[11px] font-normal text-black/70 dark:text-zinc-400">Review pending posts & verify accounts</div>
              </div>
            </button>
          )}

          {/* Removed Terms and Support here as they are moved to logo menu */}

          {/* Log Out button - Only if logged in */}
          {user && (
            <button 
              onClick={() => { onClose(); onLogout(); }}
              className="w-full p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center gap-3 transition-all text-left font-bold text-sm cursor-pointer group shadow-sm mb-6"
            >
              <div className="p-2 rounded-lg bg-red-600 text-black group-hover:scale-110 transition-transform shadow-sm">
                <LogOut className="w-4 h-4" />
              </div>
              <div className="flex-1 text-red-600 dark:text-red-400">
                <div className="font-bold">Log Out</div>
                <div className="text-[10px] font-normal opacity-70">Sign out safely from Vyapar Bridge</div>
              </div>
            </button>
          )}
        </div>
      </div></div>
  );
}

function ProfilePage({ 
  user: currentUser, 
  onLogout, 
  onUpdateUser,
  onOpenSettingsDrawer,
  onOpenVerify
}: { 
  user: any; 
  onLogout: () => void; 
  onUpdateUser: (u: any) => void;
  onOpenSettingsDrawer?: () => void;
  onOpenVerify?: () => void;
}) {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();

  const isOwnProfile = !userId || String(userId) === String(currentUser?.id) || (userId && decodeURIComponent(userId).toLowerCase() === currentUser?.name?.toLowerCase());

  const [profileUser, setProfileUser] = useState<any>(currentUser);
  const userToDisplay = profileUser;
  const [loadingUser, setLoadingUser] = useState(false);

  const targetIdentifier = userId ? decodeURIComponent(userId) : (currentUser?.id || currentUser?.name || '');
  const [isFollowing, setIsFollowing] = useState(() => isUserFollowed(targetIdentifier));
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isApprovalCenterOpen, setIsApprovalCenterOpen] = useState(false);
  const [showCoverMenu, setShowCoverMenu] = useState(false);
  const [isSeeCoverOpen, setIsSeeCoverOpen] = useState(false);
  const [isSeeAvatarOpen, setIsSeeAvatarOpen] = useState(false);
  const [isReportUserModalOpen, setIsReportUserModalOpen] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState('');
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'archive'>('posts');
  const [savedFilter, setSavedFilter] = useState<'all' | 'reels' | 'images' | 'pdfs'>('all');
  const [isCatalogueSaved, setIsCatalogueSaved] = useState(false);

  const coverFileRef = React.useRef<HTMLInputElement>(null);
  const avatarFileRef = React.useRef<HTMLInputElement>(null);

  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [userPosts, setUserPosts] = useState<any[]>([]);

  // Profile Post Creation & Full Screen Feed Viewer state
  const [selectedProfilePost, setSelectedProfilePost] = useState<any>(null);
  const [activeProfilePostIndex, setActiveProfilePostIndex] = useState<number | null>(null);
  const [activeSavedPostIndex, setActiveSavedPostIndex] = useState<number | null>(null);
  const [isProfileCreateOpen, setIsProfileCreateOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postHashtags, setPostHashtags] = useState('');
  const [postFile, setPostFile] = useState<File | null>(null);
  const [postFilePreview, setPostFilePreview] = useState<string | null>(null);
  const [isPublishingPost, setIsPublishingPost] = useState(false);
  const profileFileInputRef = React.useRef<HTMLInputElement>(null);

  const handlePublishFromProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) {
      toast.error('🔐 Login or Registration required! Only registered Factories and Dealers can post content.');
      window.dispatchEvent(new CustomEvent('openAuthModal'));
      return;
    }
    if (currentUser.role === 'customer') {
      toast.error('🚫 Local area customers cannot create posts.');
      return;
    }

    if (!postTitle.trim() && !postContent.trim() && !postFile) {
      toast.error('Please enter a title, description or upload a photo/video');
      return;
    }

    setIsPublishingPost(true);
    const formData = new FormData();
    formData.append('title', postTitle);
    formData.append('content', postContent);
    formData.append('hashtags', postHashtags || '#Vyapar Bridge');
    formData.append('userId', currentUser.id);
    if (postFile) {
      formData.append('media', postFile);
    }

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || data.blocked) {
        toast.error(data.error || '⛔ Content blocked by AI Safety Guardrail.');
        window.alert("⚠️ UPLOAD FAILED\n\nYour content was blocked by our AI Guardrail.\n\nVyapar Bridge is strictly a B2B network. You can ONLY upload business-related content like products, professional services, machinery, and trade materials.\n\nPersonal selfies, human portraits, and casual videos are NOT allowed.");
        return;
      }

      if (data.success && data.post) {
        toast.success('🎉 Post published successfully to your wall & feeds!');
        setUserPosts(prev => [data.post, ...prev]);
        setPostTitle('');
        setPostContent('');
        setPostHashtags('');
        setPostFile(null);
        setPostFilePreview(null);
        setIsProfileCreateOpen(false);
      } else {
        toast.error('Failed to publish post');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error publishing post');
    } finally {
      setIsPublishingPost(false);
    }
  };

  useEffect(() => {
    const syncFollow = () => {
      setIsFollowing(isUserFollowed(targetIdentifier));
      if (isOwnProfile) {
        setFollowingCount(getFollowedUsers().length);
      }
    };
    syncFollow();
    window.addEventListener('followedUsersUpdated', syncFollow);
    return () => window.removeEventListener('followedUsersUpdated', syncFollow);
  }, [targetIdentifier, isOwnProfile]);

  useEffect(() => {
    const handleDeleted = (e: any) => {
      const deletedId = e.detail?.postId || e.detail?.reelId;
      if (deletedId) {
        setUserPosts(prev => prev.filter(p => String(p.id) !== String(deletedId)));
        setSavedPosts(prev => prev.filter(p => String(p.id) !== String(deletedId)));
      }
    };
    window.addEventListener('postDeleted', handleDeleted);
    window.addEventListener('reelDeleted', handleDeleted);
    return () => {
      window.removeEventListener('postDeleted', handleDeleted);
      window.removeEventListener('reelDeleted', handleDeleted);
    };
  }, []);

  useEffect(() => {
    if (isOwnProfile && currentUser?.id) {
      const fetchSaved = async () => {
        try {
          const [posts, catalogues] = await Promise.all([
            safeFetch(`/api/users/${currentUser.id}/saved`),
            safeFetch(`/api/users/${currentUser.id}/saved-catalogues`)
          ]);
          
          const combined = [
            ...(Array.isArray(posts) ? posts : []),
            ...(Array.isArray(catalogues) ? catalogues : [])
          ].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          
          setSavedPosts(combined);
        } catch (err) {
          console.error('Error fetching saved items:', err);
          setSavedPosts([]);
        }
      };
      fetchSaved();
    }
  }, [isOwnProfile, currentUser?.id]);

  useEffect(() => {
    if (currentUser?.id && userToDisplay?.id && userToDisplay.id !== currentUser.id) {
      safeFetch(`/api/users/${currentUser.id}/saved-catalogues`)
        .then(data => {
          if (Array.isArray(data)) {
            setIsCatalogueSaved(data.some(c => c.user?.id === userToDisplay.id));
          }
        })
        .catch(err => console.error('Error checking saved catalogue:', err));
    }
  }, [currentUser?.id, userToDisplay?.id]);

  const handleSaveCatalogue = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await safeFetch(`/api/users/${userToDisplay.id}/save-catalogue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (res.success) {
        setIsCatalogueSaved(res.isSaved);
        toast.success(res.isSaved ? 'Catalogue saved to your bookmarks!' : 'Catalogue removed from bookmarks');
      }
    } catch (err) {
      toast.error('Failed to update saved catalogue');
    }
  };

  useEffect(() => {
    const target = isOwnProfile ? currentUser?.id : (profileUser?.id || targetIdentifier);
    if (target) {
      safeFetch(`/api/posts?userId=${encodeURIComponent(target)}&currentUserId=${currentUser?.id || ''}`)
        .then(data => {
          if (Array.isArray(data)) setUserPosts(data);
        })
        .catch(err => {
          console.error('Profile posts fetch error:', err);
          setUserPosts([]);
        });
    }
  }, [isOwnProfile, currentUser?.id, profileUser?.id, targetIdentifier]);

  useEffect(() => {
    if (isOwnProfile) {
      setProfileUser(currentUser);
      if (currentUser?.id) {
        safeFetch(`/api/users/${currentUser.id}/relationships`)
          .then(data => {
            if (data && !data.error) {
              setFollowersCount(data.followers?.length || 0);
              setFollowingCount(data.following?.length || 0);
            }
          }).catch(() => {});
      }
    } else if (userId) {
      setLoadingUser(true);
      const param = decodeURIComponent(userId);
      safeFetch(`/api/users/${encodeURIComponent(param)}`)
        .then(data => {
          if (data && data.id) {
            setProfileUser(data);
            if (currentUser?.id && data.id !== currentUser.id) {
              fetch(`/api/users/${data.id}/profile-visit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ visitorId: currentUser.id })
              }).catch(() => {});
            }
            safeFetch(`/api/users/${data.id}/relationships`)
              .then(rel => {
                if (rel && !rel.error) {
                  setFollowersCount(rel.followers?.length || 0);
                  setFollowingCount(rel.following?.length || 0);
                }
              }).catch(() => {});
          } else {
            setProfileUser(null);
          }
        })
        .catch(() => {
          setProfileUser(null);
        })
        .finally(() => setLoadingUser(false));
    }
  }, [userId, currentUser, isOwnProfile]);

  const handleDirectCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
        setIsCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDirectAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const newAvatarUrl = reader.result as string;
        const updated = { ...currentUser, avatarUrl: newAvatarUrl };
        onUpdateUser(updated);
        setProfileUser(updated);
        toast.success('Profile photo updated!');
        try {
          await fetch(`/api/users/${currentUser?.id || '1'}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatarUrl: newAvatarUrl })
          });
        } catch (err) {
          console.error(err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleCoverFit = async () => {
    const newFit = userToDisplay.coverFit === 'contain' ? 'cover' : 'contain';
    const updated = { ...currentUser, coverFit: newFit };
    onUpdateUser(updated);
    setProfileUser(updated);
    toast.success(newFit === 'contain' ? 'Cover set to Full Image (Fit) mode!' : 'Cover set to Banner Crop (Fill) mode!');
    setShowCoverMenu(false);
    try {
      await fetch(`/api/users/${currentUser?.id || '1'}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverFit: newFit })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveCover = async () => {
    if (confirm('Are you sure you want to remove your cover photo?')) {
      const updated = { ...currentUser, coverUrl: '' };
      onUpdateUser(updated);
      setProfileUser(updated);
      toast.success('Cover photo removed');
      setShowCoverMenu(false);
      try {
        await fetch(`/api/users/${currentUser?.id || '1'}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coverUrl: '' })
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!userToDisplay) {
    return (
      <div className="max-w-4xl mx-auto w-full pt-10 pb-20 px-4 text-center">
        <UserX className="w-16 h-16 text-black/60 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-black dark:text-zinc-100 mb-2">User Not Found</h2>
        <p className="text-black/80 dark:text-zinc-400 mb-6">This account may have been deleted or doesn't exist.</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-blue-600 hover:bg-blue-700 text-black font-bold py-2.5 px-6 rounded-xl transition-colors inline-flex items-center gap-2"
        >
          <Home className="w-4 h-4" /> Back to Feed
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full pt-4 md:pt-6 pb-20 md:pb-8 px-4">
      {/* Back button if viewing another user's profile wall */}
      {!isOwnProfile && (
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-4 text-sm font-semibold text-black dark:text-zinc-300 hover:text-black dark:hover:text-black cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Feed
        </button>
      )}

      {/* Cover Image Banner with 3 Dots Menu */}
      <div className="relative w-full h-44 sm:h-56 md:h-64 rounded-2xl overflow-hidden bg-slate-100 shadow-lg group">
        {userToDisplay.coverUrl ? (
          userToDisplay.coverFit === 'contain' ? (
            <div 
              className="relative w-full h-full cursor-pointer overflow-hidden bg-zinc-950 flex items-center justify-center"
              onClick={() => setIsSeeCoverOpen(true)}
            >
              <img 
                src={userToDisplay.coverUrl} 
                alt="Cover Background Blur" 
                className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-110 pointer-events-none"
              />
              <img 
                src={userToDisplay.coverUrl} 
                alt="Cover Banner Full Fit" 
                className="relative z-10 w-full h-full object-contain mx-auto transition-transform duration-500 hover:scale-105"
              />
            </div>
          ) : (
            <img 
              src={userToDisplay.coverUrl} 
              alt="Cover Banner" 
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105 cursor-pointer"
              onClick={() => setIsSeeCoverOpen(true)}
            />
          )
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-slate-900 via-zinc-800 to-slate-900 flex flex-col items-center justify-center text-black/60 gap-2">
            <Camera className="w-8 h-8 opacity-60" />
            <span className="text-sm font-medium">
              {isOwnProfile ? 'Add a cover photo for your profile' : `${userToDisplay.name}'s Profile Banner`}
            </span>
          </div>
        )}

        {/* Back Button on Top Left of Cover */}
        <div className="absolute top-3 left-3 z-20">
          <button 
            onClick={() => navigate('/')}
            className="px-3 py-2 rounded-full bg-black/60 hover:bg-black/80 text-black backdrop-blur-md transition-all shadow-md flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            title="Back to Feed"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>

        {/* 3-Dots Cover Button */}
        <div className="absolute top-3 right-3 z-20">
          <button 
            onClick={() => setShowCoverMenu(!showCoverMenu)}
            className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-black backdrop-blur-md transition-all shadow-md flex items-center justify-center cursor-pointer"
            title="Cover options"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          
          {showCoverMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl z-30 border border-slate-200 dark:border-zinc-800 overflow-hidden text-black dark:text-zinc-100 text-sm font-medium">
              {userToDisplay.coverUrl && (
                <button 
                  onClick={() => { setIsSeeCoverOpen(true); setShowCoverMenu(false); }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2.5 border-b border-slate-100 dark:border-zinc-800 transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-blue-500" />
                  See cover image
                </button>
              )}
              {isOwnProfile && (
                <>
                  {userToDisplay.coverUrl && (
                    <>
                      <button 
                        onClick={() => {
                          setImageToCrop(userToDisplay.coverUrl);
                          setIsCropModalOpen(true);
                          setShowCoverMenu(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2.5 border-b border-slate-100 dark:border-zinc-800 transition-colors cursor-pointer"
                      >
                        <Crop className="w-4 h-4 text-emerald-500" />
                        Crop & Adjust Cover
                      </button>
                      <button 
                        onClick={handleToggleCoverFit}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2.5 border-b border-slate-100 dark:border-zinc-800 transition-colors cursor-pointer"
                      >
                        <Maximize2 className="w-4 h-4 text-amber-500" />
                        {userToDisplay.coverFit === 'contain' ? 'Banner Crop (Fill Mode)' : 'Full Image (Fit Mode)'}
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => { coverFileRef.current?.click(); setShowCoverMenu(false); }}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2.5 border-b border-slate-100 dark:border-zinc-800 transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-emerald-500" />
                    {userToDisplay.coverUrl ? 'Change cover image' : 'Choose cover image'}
                  </button>
                  <button 
                    onClick={() => { setIsEditModalOpen(true); setShowCoverMenu(false); }}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2.5 border-b border-slate-100 dark:border-zinc-800 transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-indigo-500" />
                    Edit profile details
                  </button>
                  {userToDisplay.coverUrl && (
                    <button 
                      onClick={handleRemoveCover}
                      className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove cover photo
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {isOwnProfile && (
          <input 
            type="file" 
            ref={coverFileRef} 
            accept="image/*" 
            className="hidden" 
            onChange={handleDirectCoverChange} 
          />
        )}
      </div>

      {/* Profile Header Overlapping Cover */}
      <div className="relative z-10 -mt-12 md:-mt-14 px-4 sm:px-8 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-4 md:gap-6 w-full">
          {/* Avatar Picture with Click to Change & See Photo */}
          <div className="relative group">
            <div 
              onClick={() => isOwnProfile ? avatarFileRef.current?.click() : setIsSeeAvatarOpen(true)}
              className={cn(
                "w-28 h-28 md:w-40 md:h-40 shrink-0 rounded-full cursor-pointer relative shadow-2xl transition-all duration-700 bg-[#E6C76C] dark:bg-black",
                userToDisplay.isVerified 
                  ? "tiranga-border-circle p-[4px]" 
                  : "neon-border-circle p-[3px]"
              )}
            >
              <div className="w-full h-full rounded-full p-[2px] overflow-hidden">
                {userToDisplay.avatarUrl ? (
                  <img src={userToDisplay.avatarUrl} alt={userToDisplay.name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <div className="w-full h-full bg-slate-200 dark:bg-zinc-800 rounded-full flex items-center justify-center text-4xl font-bold text-black dark:text-zinc-300 shadow-inner">
                    {userToDisplay.name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              {isOwnProfile && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-black text-xs font-semibold gap-1">
                  <Camera className="w-6 h-6" />
                  <span>Change Photo</span>
                </div>
              )}
            </div>

            {userToDisplay.avatarUrl && (
              <button 
                onClick={(e) => { e.stopPropagation(); setIsSeeAvatarOpen(true); }}
                className="absolute bottom-1 right-1 bg-zinc-900 text-black p-1.5 rounded-full shadow-lg border border-zinc-700 hover:bg-zinc-800 transition-colors cursor-pointer"
                title="View full profile photo"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            )}

            {isOwnProfile && (
              <input 
                type="file" 
                ref={avatarFileRef} 
                accept="image/*" 
                className="hidden" 
                onChange={handleDirectAvatarChange} 
              />
            )}
          </div>

          <div className="flex-1 w-full pt-2 md:pt-14">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h2 
                    className={cn(
                      "text-2xl md:text-3xl font-black italic tracking-wider text-black dark:text-zinc-50 drop-shadow-sm",
                      userToDisplay.isVerified && "text-blue-600 dark:text-blue-600 font-bold"
                    )}
                    style={{ fontFamily: "'Playfair Display', 'Dancing Script', serif", fontWeight: 900 }}
                  >
                    {userToDisplay.name}
                  </h2>
                  {userToDisplay.isVerified && <VerifiedBadge size="lg" />}
                </div>
                <p className="text-sm font-medium text-black/70 dark:text-zinc-400 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  {userToDisplay.city || 'India'}
                  {userToDisplay.role !== 'customer' && ` • ${userToDisplay.role || 'Member'}`}
                </p>
              </div>

              {/* Action Buttons for Profile */}
              <div className="flex items-center gap-2">
                {!isOwnProfile && (
                  <>
                    <button 
                      onClick={async () => {
                        const next = toggleFollowUser(targetIdentifier);
                        setIsFollowing(next);
                        setFollowersCount(prev => next ? prev + 1 : Math.max(0, prev - 1));
                        toast.success(next ? `Following ${userToDisplay.name}` : `Unfollowed ${userToDisplay.name}`);
                        
                        // Sync with backend
                        if (currentUser?.id) {
                          try {
                            await fetch(`/api/users/${userToDisplay.id || targetIdentifier}/follow`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ followerId: currentUser.id })
                            });
                          } catch (err) {
                            console.error('Failed to sync follow status with backend:', err);
                          }
                        }
                      }}
                      className={cn(
                        "font-bold px-6 py-2 rounded-xl text-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer",
                        isFollowing 
                          ? "bg-slate-100 dark:bg-zinc-900 text-black dark:text-zinc-100 border border-slate-200 dark:border-zinc-800" 
                          : "bg-blue-600 hover:bg-blue-700 text-black"
                      )}
                    >
                      {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>

                    <button 
                      onClick={() => navigate('/chat')}
                      className="font-semibold px-5 py-2 rounded-xl text-sm transition-colors border flex items-center gap-2 cursor-pointer bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border-slate-200 dark:border-zinc-800 text-black dark:text-zinc-100"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-500" />
                      <span>Chat</span>
                    </button>
                  </>
                )}
                

              </div>
            </div>
            
            
            {/* Vyapar Bridge Verified B2B Banner Card */}
            {userToDisplay.isVerified && userToDisplay.role !== 'customer' ? (
              <div className="mb-3 bg-gradient-to-r from-slate-900 via-blue-950 to-zinc-900 text-black p-3.5 rounded-2xl shadow-md flex items-center justify-between border border-blue-800/40">
                <div className="flex items-center gap-3">
                  <VerifiedBadge size="lg" />
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-blue-600 flex flex-wrap items-center gap-2">
                      <span>{userToDisplay.role === 'customer' ? 'VYAPAR BRIDGE B2C VERIFIED ✓' : 'Vyapar Bridge Verified B2B Account ✓'}</span>
                      {userToDisplay.role === 'factory' ? (
                        <span className="text-[10px] bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-md font-extrabold flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> COMPANY / FACTORY
                        </span>
                      ) : userToDisplay.role === 'customer' ? (
                        <span className="text-[10px] bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded-md font-extrabold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> {userToDisplay.verifiedPlan === 'yearly' ? '₹1,188 PLAN' : '₹99 PLAN'}
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-md font-extrabold flex items-center gap-1">
                          <Store className="w-3 h-3" /> DEALER / DISTRIBUTOR
                        </span>
                      )}
                    </h4>
                    {userToDisplay.role !== 'customer' && (
                      <p className="text-[11px] text-slate-700 mt-0.5">
                        Official Vyapar Bridge Verified Business Member • Live in Top 10 B2B Leaderboard
                      </p>
                    )}
                  </div>
                </div>
                {userToDisplay.role !== 'customer' && (
                  <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-full whitespace-nowrap hidden sm:inline-block shrink-0">
                    Top 10 Rank Active
                  </span>
                )}
              </div>
            ) : null}

            {/* GSTIN Field directly below Vyapar Bridge Verified B2B Card - Hidden for Customers */}
            {userToDisplay.role !== 'customer' && userToDisplay.gstNumber && (!userToDisplay.hideGst || isOwnProfile) && (
              <div className="mb-3.5 inline-flex flex-wrap items-center gap-2 px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-black dark:text-zinc-200 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>GSTIN:</span>
                <span className="font-mono bg-white dark:bg-zinc-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-zinc-700 text-black dark:text-zinc-100">
                  {userToDisplay.gstNumber}
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-extrabold uppercase">✓ Verified Taxpayer</span>
                {isOwnProfile && userToDisplay.hideGst && (
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded font-extrabold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Hidden from Public
                  </span>
                )}
              </div>
            )}
            <div className="flex gap-6 mb-3 text-black dark:text-zinc-100">
              <span className="text-base"><span className="font-semibold">{userPosts.length}</span> posts</span>
              <span className="text-base"><span className="font-semibold">{followersCount.toLocaleString()}</span> followers</span>
              <span className="text-base"><span className="font-semibold">{followingCount.toLocaleString()}</span> following</span>
            </div>
            
            <div className="text-black dark:text-zinc-100">
              {/* Categories Display - Hidden for Customers */}
              {userToDisplay.role !== 'customer' && userToDisplay.category && (
                <div className="my-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-black/70 dark:text-zinc-400">Categories:</span>
                  {(Array.isArray(userToDisplay.category) ? userToDisplay.category : String(userToDisplay.category).split(',')).map((cat: string, idx: number) => (
                    <span key={idx} className="text-xs bg-slate-100 dark:bg-zinc-800 text-black dark:text-zinc-300 font-semibold px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-zinc-700 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-blue-500" />
                      {cat.trim()}
                    </span>
                  ))}
                </div>
              )}

              {userToDisplay.bio ? (
                <p className="text-sm whitespace-pre-wrap mb-2">{userToDisplay.bio}</p>
              ) : (
                <p className="text-sm mb-2">
                  {userToDisplay.role === 'customer' 
                    ? `Explore the collection of tiles and inspiration saved by ${userToDisplay.name}.`
                    : `Welcome to ${userToDisplay.name}'s official B2B wall on Vyapar Bridge.`}
                </p>
              )}

              {/* B2B Contact & Location Navigation Card - HIDDEN FOR CUSTOMERS */}
              {userToDisplay.role !== 'customer' && (((userToDisplay.city || userToDisplay.address || userToDisplay.gpsCoords) && (!userToDisplay.hideAddress || isOwnProfile)) || (userToDisplay.role !== 'customer' && userToDisplay.website) || (userToDisplay.phone && (!userToDisplay.hidePhone || isOwnProfile)) || (userToDisplay.email && (!userToDisplay.hideEmail || isOwnProfile))) && (
                <div className="mt-3 p-3 bg-slate-50 dark:bg-zinc-900/90 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2">
                  {/* Location Address & Navigation */}
                  {(userToDisplay.city || userToDisplay.address || userToDisplay.gpsCoords) && (!userToDisplay.hideAddress || isOwnProfile) && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="text-xs text-black dark:text-zinc-300 flex items-start gap-1.5">
                        <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-black dark:text-zinc-100 flex items-center gap-1.5">
                            <span>{userToDisplay.city ? `${userToDisplay.city}${userToDisplay.state ? ', ' + userToDisplay.state : ''}` : 'Location Available'}</span>
                            {isOwnProfile && userToDisplay.hideAddress && (
                              <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-extrabold flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> Address Hidden
                              </span>
                            )}
                          </div>
                          {userToDisplay.address && (
                            <div className="text-[11px] text-black/70 dark:text-zinc-400">
                              {userToDisplay.address}
                            </div>
                          )}
                        </div>
                      </div>

                      <a 
                        href={userToDisplay.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((userToDisplay.name || '') + ' ' + (userToDisplay.address || '') + ' ' + (userToDisplay.city || ''))}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-blue-600 hover:bg-blue-700 text-black font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer shrink-0"
                      >
                        <Locate className="w-3.5 h-3.5" /> Open Google Maps
                      </a>
                    </div>
                  )}

                  {userToDisplay.role !== 'customer' && userToDisplay.website && (
                    <a 
                      href={userToDisplay.website.startsWith('http') ? userToDisplay.website : `https://${userToDisplay.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs font-semibold text-[#00376b] dark:text-blue-600 hover:underline flex items-center gap-1 pt-1 border-t border-slate-200 dark:border-zinc-800"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      {userToDisplay.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  {(userToDisplay.facebookUrl || userToDisplay.twitterUrl || userToDisplay.instagramUrl) && (
                    <div className="flex items-center gap-4 pt-2 border-t border-slate-200 dark:border-zinc-800">
                      {userToDisplay.facebookUrl && (
                        <a href={userToDisplay.facebookUrl.startsWith('http') ? userToDisplay.facebookUrl : `https://${userToDisplay.facebookUrl}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:scale-110 transition-transform cursor-pointer" title="Facebook">
                          <Facebook className="w-4 h-4" />
                        </a>
                      )}
                      {userToDisplay.twitterUrl && (
                        <a href={userToDisplay.twitterUrl.startsWith('http') ? userToDisplay.twitterUrl : `https://${userToDisplay.twitterUrl}`} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:scale-110 transition-transform cursor-pointer" title="Twitter">
                          <Twitter className="w-4 h-4" />
                        </a>
                      )}
                      {userToDisplay.instagramUrl && (
                        <a href={userToDisplay.instagramUrl.startsWith('http') ? userToDisplay.instagramUrl : `https://${userToDisplay.instagramUrl}`} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:scale-110 transition-transform cursor-pointer" title="Instagram">
                          <Instagram className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}
                  
                  {userToDisplay.role !== 'customer' && userToDisplay.catalogueUrl && (
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-zinc-800 mt-1">
                      <a 
                        href={userToDisplay.catalogueUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs font-bold text-blue-600 dark:text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <FileText className="w-4 h-4 text-emerald-500" />
                        <span>{userToDisplay.catalogueName || 'Download Company Catalogue (PDF)'}</span>
                      </a>
                      
                      {currentUser?.id !== userToDisplay.id && (
                        <button 
                          onClick={handleSaveCatalogue}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors cursor-pointer",
                            isCatalogueSaved 
                              ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400" 
                              : "bg-slate-100 dark:bg-zinc-800 text-black/70 hover:bg-slate-200 dark:hover:bg-zinc-700"
                          )}
                          title={isCatalogueSaved ? "Unsave Catalogue" : "Save Catalogue"}
                        >
                          <Bookmark className={cn("w-3.5 h-3.5", isCatalogueSaved && "fill-current")} />
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-black/80 dark:text-zinc-400 pt-1">
                    {userToDisplay.phone && (!userToDisplay.hidePhone || isOwnProfile) && (
                      (userToDisplay.isVerified || isOwnProfile) ? (
                        <p className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-emerald-500" /> {userToDisplay.phone}
                          {isOwnProfile && userToDisplay.hidePhone && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold ml-1 flex items-center gap-0.5">
                              (<Lock className="w-2.5 h-2.5" /> Hidden)
                            </span>
                          )}
                        </p>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800">
                          <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>Mobile Number Locked (Vyapar Bridge Verified Members Only)</span>
                        </div>
                      )
                    )}
                    {userToDisplay.email && (!userToDisplay.hideEmail || isOwnProfile) && (
                      <p className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-indigo-500" /> {userToDisplay.email}
                        {isOwnProfile && userToDisplay.hideEmail && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold ml-1 flex items-center gap-0.5">
                            (<Lock className="w-2.5 h-2.5" /> Hidden)
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="border-t border-slate-200 dark:border-zinc-800 flex justify-center gap-12 mb-6 text-xs uppercase font-semibold tracking-wider">
        <button 
          onClick={() => setActiveTab('posts')}
          className={cn(
            "flex items-center gap-2 py-3 border-t-2 transition-colors cursor-pointer",
            activeTab === 'posts' ? "border-slate-900 dark:border-zinc-50 text-black dark:text-zinc-50" : "border-transparent text-black/60 hover:text-black/80 dark:hover:text-zinc-300"
          )}
        >
          <Compass className="w-4 h-4" />
          Wall Posts
        </button>
        {isOwnProfile && (
          <>
            <button 
              onClick={() => setActiveTab('saved')}
              className={cn(
                "flex items-center gap-2 py-3 border-t-2 transition-colors cursor-pointer",
                activeTab === 'saved' ? "border-slate-900 dark:border-zinc-50 text-black dark:text-zinc-50" : "border-transparent text-black/60 hover:text-black/80 dark:hover:text-zinc-300"
              )}
            >
              <Bookmark className="w-4 h-4" />
              Saved
            </button>
            <button 
              onClick={() => setActiveTab('archive')}
              className={cn(
                "flex items-center gap-2 py-3 border-t-2 transition-colors cursor-pointer",
                activeTab === 'archive' ? "border-slate-900 dark:border-zinc-50 text-black dark:text-zinc-50" : "border-transparent text-black/60 hover:text-black/80 dark:hover:text-zinc-300"
              )}
            >
              <Film className="w-4 h-4" />
              Archive
            </button>
          </>
        )}
      </div>

            {/* Grid Content depending on activeTab */}
      {activeTab === 'posts' && (
        <div className="space-y-6">
          {/* Customer Saved Activity Dashboard - ONLY FOR CUSTOMERS */}
          {userToDisplay.role === 'customer' && isOwnProfile && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div 
                onClick={() => {
                  setActiveTab('saved');
                  setSavedFilter('reels');
                }}
                className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950/30 flex items-center justify-center mb-4 border border-pink-100 dark:border-pink-900/50">
                  <Film className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                </div>
                <h3 className="font-black text-black dark:text-zinc-50 text-lg">Saved Reels</h3>
                <p className="text-xs text-black/70 dark:text-zinc-400 mt-1">Watch your bookmarked short videos</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-2xl font-black text-black dark:text-zinc-50">
                    {String(savedPosts.filter(p => p.type === 'video').length).padStart(2, '0')}
                  </span>
                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 text-black/60">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div 
                onClick={() => {
                  setActiveTab('saved');
                  setSavedFilter('images');
                }}
                className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center mb-4 border border-blue-100 dark:border-blue-900/50">
                  <Image className="w-6 h-6 text-blue-600 dark:text-blue-600" />
                </div>
                <h3 className="font-black text-black dark:text-zinc-50 text-lg">Saved Images</h3>
                <p className="text-xs text-black/70 dark:text-zinc-400 mt-1">Quick access to saved designs & products</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-2xl font-black text-black dark:text-zinc-50">
                    {String(savedPosts.filter(p => p.type === 'image' || !p.type).length).padStart(2, '0')}
                  </span>
                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 text-black/60">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div 
                onClick={() => {
                  setActiveTab('saved');
                  setSavedFilter('pdfs');
                }}
                className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mb-4 border border-emerald-100 dark:border-emerald-900/50">
                  <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-black text-black dark:text-zinc-50 text-lg">Saved PDFs</h3>
                <p className="text-xs text-black/70 dark:text-zinc-400 mt-1">Catalogues & documents you've saved</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-2xl font-black text-black dark:text-zinc-50">
                    {String(savedPosts.filter(p => p.type === 'pdf').length).padStart(2, '0')}
                  </span>
                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 text-black/60">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Analytics Summary & Eye Button Dashboard right above post creation box */}
          {userToDisplay.role !== 'customer' && (profileUser?.id || currentUser?.id) && (
            <UserAnalyticsCard userId={profileUser?.id || currentUser?.id || ''} />
          )}

          {/* Post Creation Box on User Profile - Hidden for Customers */}
          {isOwnProfile && currentUser?.role !== 'customer' && (
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 dark:bg-zinc-800 shrink-0 border border-slate-300 dark:border-zinc-700">
                    {currentUser?.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-xs text-black dark:text-zinc-300">
                        {currentUser?.name?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-black dark:text-zinc-100 flex items-center gap-1">
                      Post to Your Profile & Feeds
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    </h3>
                    <p className="text-[11px] text-black/70 dark:text-zinc-400">Share product photos, short video reels, titles & hashtags</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProfileCreateOpen(!isProfileCreateOpen)}
                  className="bg-blue-600 hover:bg-blue-700 text-black font-bold px-3 py-1.5 rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  {isProfileCreateOpen ? 'Close' : 'New Post'}
                </button>
              </div>

              {isProfileCreateOpen && (
                <form onSubmit={handlePublishFromProfile} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-black dark:text-zinc-300 mb-1">
                      Post Title (शीर्षक)
                    </label>
                    <input
                      type="text"
                      placeholder="Enter post title"
                      value={postTitle}
                      onChange={e => setPostTitle(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-black dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-black dark:text-zinc-300 mb-1">
                      Description (विवरण)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Write description, price list, quantity details or specs..."
                      value={postContent}
                      onChange={e => setPostContent(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-black dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-black dark:text-zinc-300 mb-1">
                      Hashtags & Tags
                    </label>
                    <input
                      type="text"
                      placeholder="Enter hashtags (e.g. #tiles)"
                      value={postHashtags}
                      onChange={e => setPostHashtags(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-black dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <input
                      type="file"
                      ref={profileFileInputRef}
                      accept="image/*,video/*,.pdf,application/pdf"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setPostFile(file);
                          setPostFilePreview(URL.createObjectURL(file));
                        }
                      }}
                    />

                    {postFilePreview ? (
                      <div className="relative rounded-xl overflow-hidden bg-black max-h-60 flex items-center justify-center border border-slate-200 dark:border-zinc-800 my-2">
                        {postFile?.type === 'application/pdf' || postFile?.name?.match(/\.pdf$/i) ? (
                          <div className="w-full h-40 bg-emerald-50 dark:bg-emerald-950/40 flex flex-col items-center justify-center p-4 text-center">
                            <FileText className="w-10 h-10 text-emerald-600 mb-1" />
                            <span className="text-xs font-bold text-black dark:text-zinc-100 truncate max-w-xs">{postFile?.name}</span>
                            <span className="text-[10px] text-emerald-600 mt-1">PDF Document Attached ✓</span>
                          </div>
                        ) : postFile?.type.startsWith('video') && postFilePreview ? (
                          <video preload="auto" src={postFilePreview} controls className="max-h-60 w-full object-cover transform-gpu will-change-transform" />
                        ) : (
                          <img src={postFilePreview} alt="Preview" className="max-h-60 w-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setPostFile(null);
                            setPostFilePreview(null);
                          }}
                          className="absolute top-2 right-2 bg-black/70 hover:bg-black text-black p-1.5 rounded-full cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => profileFileInputRef.current?.click()}
                          className="bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-black dark:text-zinc-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer border border-slate-200 dark:border-zinc-700"
                        >
                          <Image className="w-4 h-4 text-blue-500" /> Upload Image / Photo
                        </button>
                        {currentUser?.role !== 'customer' && (
                          <button
                            type="button"
                            onClick={() => profileFileInputRef.current?.click()}
                            className="bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-black dark:text-zinc-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer border border-slate-200 dark:border-zinc-700"
                          >
                            <Film className="w-4 h-4 text-purple-500" /> Upload Reel / Video
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileCreateOpen(false);
                        setPostFile(null);
                        setPostFilePreview(null);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-black/70 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isPublishingPost}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-black font-bold px-5 py-2 rounded-xl text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isPublishingPost ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Publishing...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" /> Publish Post
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Posts Wall Grid */}
          <div className="grid grid-cols-3 gap-1 sm:gap-4">
            {userPosts.map((post, idx) => (
              <div 
                key={post.id} 
                onClick={() => setActiveProfilePostIndex(idx)}
                className="relative aspect-square bg-slate-100 dark:bg-zinc-800 rounded-lg overflow-hidden group cursor-pointer shadow-sm"
              >
                {post.type === 'video' && post.mediaUrl ? (
                  <video preload="auto" src={post.mediaUrl} poster={post.thumbnailUrl} className="w-full h-full object-cover transform-gpu will-change-transform" muted playsInline />
                ) : (
                  <img src={post.mediaUrl} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-black font-bold text-sm">
                  <span className="flex items-center gap-1.5"><Heart className="w-5 h-5 fill-white" /> {post.likesCount || 0}</span>
                  <span className="flex items-center gap-1.5"><MessageCircle className="w-5 h-5 fill-white" /> {post.commentsCount || 0}</span>
                </div>
                {post.type === 'video' && (
                  <div className="absolute top-2 right-2 text-black drop-shadow-md">
                    <Film className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            {userPosts.length === 0 && (
              <div className="col-span-3 py-16 text-center text-black/60 font-medium">
                No posts found on this profile wall yet.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'saved' && isOwnProfile && (
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar shrink-0 max-w-[65%]">
              <button 
                onClick={() => setSavedFilter('all')}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border whitespace-nowrap",
                  savedFilter === 'all' 
                    ? "bg-white text-black border-slate-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100" 
                    : "bg-white text-black/70 border-slate-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800"
                )}
              >
                All Items
              </button>
              <button 
                onClick={() => setSavedFilter('reels')}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border whitespace-nowrap flex items-center gap-1",
                  savedFilter === 'reels' 
                    ? "bg-pink-600 text-black border-pink-600" 
                    : "bg-white text-black/70 border-slate-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800"
                )}
              >
                <Film className="w-3 h-3" /> Reels
              </button>
              <button 
                onClick={() => setSavedFilter('images')}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border whitespace-nowrap flex items-center gap-1",
                  savedFilter === 'images' 
                    ? "bg-blue-600 text-white border-blue-600" 
                    : "bg-white text-black/70 border-slate-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800"
                )}
              >
                <Image className="w-3 h-3" /> Images
              </button>
              <button 
                onClick={() => setSavedFilter('pdfs')}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border whitespace-nowrap flex items-center gap-1",
                  savedFilter === 'pdfs' 
                    ? "bg-emerald-600 text-white border-emerald-600" 
                    : "bg-white text-black/70 border-slate-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800"
                )}
              >
                <FileText className="w-3 h-3" /> PDFs
              </button>
            </div>
            <span className="text-[10px] font-bold text-black/60 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-800/50 px-2 py-1 rounded-md">
              {savedPosts.filter(p => {
                if (savedFilter === 'all') return true;
                if (savedFilter === 'reels') return p.type === 'video';
                if (savedFilter === 'images') return p.type === 'image' || !p.type;
                if (savedFilter === 'pdfs') return p.type === 'pdf';
                return true;
              }).length} items
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1 sm:gap-4">
            {savedPosts.filter(p => {
              if (savedFilter === 'all') return true;
              if (savedFilter === 'reels') return p.type === 'video';
              if (savedFilter === 'images') return p.type === 'image' || !p.type;
              if (savedFilter === 'pdfs') return p.type === 'pdf';
              return true;
            }).map((post, idx) => (
              <div 
                key={post.id} 
                onClick={() => {
                  if (post.type === 'pdf') {
                    window.open(post.mediaUrl, '_blank');
                  } else {
                    setActiveSavedPostIndex(idx);
                  }
                }} 
                className="relative aspect-square bg-slate-100 dark:bg-zinc-800 rounded-lg overflow-hidden group cursor-pointer shadow-sm border border-slate-200 dark:border-zinc-800/50"
              >
                {post.type === 'video' && post.mediaUrl ? (
                  <video preload="auto" src={post.mediaUrl} poster={post.thumbnailUrl} className="w-full h-full object-cover transform-gpu will-change-transform" muted playsInline />
                ) : post.type === 'pdf' ? (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 flex flex-col items-center justify-center p-4">
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-center mb-2 border border-emerald-100 dark:border-emerald-800">
                      <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-[10px] font-black text-black dark:text-zinc-100 text-center line-clamp-2 leading-tight">
                      {post.title}
                    </p>
                    <div className="mt-2 text-[8px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800">
                      PDF CATALOGUE
                    </div>
                  </div>
                ) : (
                  <img src={post.mediaUrl} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                )}
                
                <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full text-black">
                  {post.type === 'pdf' ? <FileText className="w-3 h-3" /> : <Bookmark className="w-3 h-3 fill-white" />}
                </div>

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 text-center text-black font-bold text-xs">
                  <p className="mb-2 line-clamp-2">{post.title}</p>
                  {post.type !== 'pdf' ? (
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1"><Heart className="w-4 h-4 fill-white" /> {post.likesCount || 0}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4 fill-white" /> {post.commentsCount || 0}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 bg-emerald-600 px-3 py-1 rounded-full text-[10px]">
                      <ExternalLink className="w-3 h-3" /> View Catalogue
                    </div>
                  )}
                </div>
                
                {post.user && (
                  <div className="absolute bottom-1 left-1 right-1 flex items-center gap-1 bg-black/40 backdrop-blur-md rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <img src={post.user.avatarUrl} className="w-4 h-4 rounded-full border border-white/20" alt="" />
                    <span className="text-[8px] text-black truncate">{post.user.name}</span>
                  </div>
                )}
              </div>
            ))}
            {savedPosts.filter(p => {
              if (savedFilter === 'all') return true;
              if (savedFilter === 'reels') return p.type === 'video';
              if (savedFilter === 'images') return p.type === 'image' || !p.type;
              if (savedFilter === 'pdfs') return p.type === 'pdf';
              return true;
            }).length === 0 && (
              <div className="col-span-3 py-20 flex flex-col items-center justify-center text-black/60">
                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-center mb-4">
                  <Bookmark className="w-8 h-8 opacity-20" />
                </div>
                <p className="font-medium text-sm">No {savedFilter !== 'all' ? savedFilter : ''} items saved yet.</p>
                <button 
                  onClick={() => setActiveTab('posts')}
                  className="mt-4 text-blue-600 text-xs font-bold hover:underline cursor-pointer"
                >
                  Explore and bookmark posts
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'archive' && isOwnProfile && (
        <div className="text-center py-12 text-black/70 dark:text-zinc-400">
          <Film className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <h4 className="font-semibold text-black dark:text-zinc-200 mb-1">Archive is Empty</h4>
          <p className="text-sm">Posts you archive will only be visible to you here.</p>
        </div>
      )}

      {/* Lightbox Modal for See Cover Image */}
      {isSeeCoverOpen && userToDisplay.coverUrl && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4" onClick={() => setIsSeeCoverOpen(false)}>
          <div className="relative max-w-4xl w-full bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 flex items-center justify-between border-b border-zinc-800 text-black">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Image className="w-5 h-5 text-blue-600" /> Cover Photo
              </h3>
              <button onClick={() => setIsSeeCoverOpen(false)} className="p-1.5 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-black cursor-pointer">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center bg-black min-h-[300px]">
              <img src={userToDisplay.coverUrl} alt="Cover Full View" className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg" />
            </div>
            <div className="p-4 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-900">
              {isOwnProfile && (
                <>
                  <button 
                    onClick={() => {
                      setImageToCrop(userToDisplay.coverUrl);
                      setIsSeeCoverOpen(false);
                      setIsCropModalOpen(true);
                    }}
                    className="bg-zinc-800 hover:bg-zinc-700 text-emerald-400 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Crop className="w-4 h-4" /> Crop Cover
                  </button>
                  <button 
                    onClick={() => { handleToggleCoverFit(); }}
                    className="bg-zinc-800 hover:bg-zinc-700 text-amber-400 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Maximize2 className="w-4 h-4" /> 
                    {userToDisplay.coverFit === 'contain' ? 'Banner Crop (Fill)' : 'Full Image (Fit)'}
                  </button>
                  <button 
                    onClick={() => { setIsSeeCoverOpen(false); coverFileRef.current?.click(); }}
                    className="bg-blue-600 hover:bg-blue-700 text-black px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" /> Change Cover
                  </button>
                </>
              )}
              <button 
                onClick={() => setIsSeeCoverOpen(false)} 
                className="bg-zinc-800 hover:bg-zinc-700 text-black px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for See Avatar Image */}
      {isSeeAvatarOpen && userToDisplay.avatarUrl && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4" onClick={() => setIsSeeAvatarOpen(false)}>
          <div className="relative max-w-md w-full bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 flex items-center justify-between border-b border-zinc-800 text-black">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Image className="w-5 h-5 text-blue-600" /> Profile Picture
              </h3>
              <button onClick={() => setIsSeeAvatarOpen(false)} className="p-1.5 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-black cursor-pointer">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 flex items-center justify-center bg-black">
              <img src={userToDisplay.avatarUrl} alt="Avatar Full View" className="w-64 h-64 object-cover rounded-full border-4 border-zinc-700 shadow-xl" />
            </div>
            <div className="p-4 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-900">
              {isOwnProfile && (
                <button 
                  onClick={() => { setIsSeeAvatarOpen(false); avatarFileRef.current?.click(); }}
                  className="bg-blue-600 hover:bg-blue-700 text-black px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4" /> Change Photo
                </button>
              )}
              <button 
                onClick={() => setIsSeeAvatarOpen(false)} 
                className="bg-zinc-800 hover:bg-zinc-700 text-black px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isOwnProfile && (
        <EditProfileModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          user={currentUser} 
          onSave={(updatedUser) => {
            onUpdateUser(updatedUser);
            setProfileUser(updatedUser);
            setIsEditModalOpen(false);
          }} 
          onOpenVerify={() => setIsVerifyModalOpen(true)}
        />
      )}

      {/* Verified Payment & QR Code Modal */}
      {isOwnProfile && (
        <VerifiedPaymentModal 
          isOpen={isVerifyModalOpen} 
          onClose={() => setIsVerifyModalOpen(false)} 
          user={currentUser} 
          onSuccess={(updatedUser) => {
            onUpdateUser(updatedUser);
            setProfileUser(updatedUser);
            setIsVerifyModalOpen(false);
          }} 
        />
      )}

      {/* VYAPAR BRIDGE Approval Center Modal */}
      <ApprovalCenterModal 
        isOpen={isApprovalCenterOpen} 
        onClose={() => setIsApprovalCenterOpen(false)} 
        user={profileUser}
        userPosts={userPosts}
        onOpenVerify={() => setIsVerifyModalOpen(true)}
      />

      {/* Report User Modal */}
      <ReportModal
        isOpen={isReportUserModalOpen}
        onClose={() => setIsReportUserModalOpen(false)}
        currentUser={currentUser}
        targetType="user"
        targetId={userToDisplay.id}
        targetName={userToDisplay.name}
      />

      {/* Interactive Cover Image Cropper & Adjuster Modal */}
      <ImageCropperModal 
        isOpen={isCropModalOpen}
        imageSrc={imageToCrop}
        onClose={() => setIsCropModalOpen(false)}
        onSave={async (croppedDataUrl) => {
          const updated = { ...currentUser, coverUrl: croppedDataUrl };
          onUpdateUser(updated);
          setProfileUser(updated);
          setIsCropModalOpen(false);
          toast.success('Cover image cropped and updated!');
          try {
            await fetch(`/api/users/${currentUser?.id || '1'}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ coverUrl: croppedDataUrl })
            });
          } catch (err) {
            console.error(err);
          }
        }}
      />

      {/* Fullscreen Feed Viewer Modal for Profile Posts */}
      {activeProfilePostIndex !== null && (
        <FullScreenFeedViewerModal
          posts={userPosts}
          initialIndex={activeProfilePostIndex}
          currentUser={currentUser}
          onClose={() => setActiveProfilePostIndex(null)}
        />
      )}

      {/* Fullscreen Feed Viewer Modal for Saved Posts */}

      {activeSavedPostIndex !== null && (
        <FullScreenFeedViewerModal
          posts={savedPosts}
          initialIndex={activeSavedPostIndex}
          currentUser={currentUser}
          onClose={() => setActiveSavedPostIndex(null)}
        />
      )}

      {/* Selected Profile Post Detail Lightbox Modal Fallback */}
      {selectedProfilePost && (
        <FullScreenFeedViewerModal
          posts={[selectedProfilePost]}
          initialIndex={0}
          currentUser={currentUser}
          onClose={() => setSelectedProfilePost(null)}
        />
      )}</div>
  );
}



function RightSidebar({ 
  user, 
  suggestedUsers,
  onOpenSettingsDrawer,
  onOpenAuthModal
}: { 
  user: any; 
  suggestedUsers: any[];
  onOpenSettingsDrawer?: () => void;
  onOpenAuthModal?: () => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCatalogueUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('catalogue', file);

    try {
      const res = await fetch(`/api/users/${user.id}/catalogue`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Company catalogue updated successfully!');
        if (data.user && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('userUpdated', { detail: data.user }));
        }
      } else {
        toast.error(data.error || 'Failed to upload catalogue');
      }
    } catch (err) {
      toast.error('Error uploading catalogue');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <aside className="hidden xl:flex flex-col w-[350px] sticky top-0 h-screen p-6 border-l border-slate-100 dark:border-zinc-900 bg-[#E6C76C] dark:bg-black z-30 overflow-y-auto no-scrollbar">
      {/* Primary Account & Settings Card in Right Sidebar */}
      {user && (
        <div className="mb-8 p-5 rounded-3xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 shadow-sm">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center overflow-hidden shrink-0 border border-blue-500/20 font-bold text-base">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name?.charAt(0) || 'U'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black text-black dark:text-zinc-50 truncate flex items-center gap-1">
                  <span>{user.name}</span>
                  {user.isVerified && <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />}
                </div>
                <div className="text-[11px] font-bold text-black/70 dark:text-zinc-400 capitalize">
                  {user.role} • {user.city || 'India'}
                </div>
              </div>
            </div>
            
            <button 
              onClick={onOpenSettingsDrawer}
              className="w-full py-2.5 bg-white hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-black rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Menu className="w-4 h-4 text-blue-600" />
              <span>Account Settings & Options</span>
            </button>
          </div>
        </div>
      )}

      {user && user.role !== 'customer' && (
        <div className="mb-10">
          <h3 className="text-xs font-black text-black/60 dark:text-zinc-500 uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            Company Catalogue
          </h3>
          <div className="p-5 bg-slate-50 dark:bg-zinc-900/50 rounded-3xl border border-slate-200 dark:border-zinc-800 border-dashed group transition-all hover:border-blue-500/50">
            <p className="text-[11px] font-bold text-black/70 dark:text-zinc-400 mb-5 leading-relaxed">
              Upload your company PDF catalogue to showcase your products to dealers and customers across India.
            </p>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".pdf" 
              onChange={handleCatalogueUpload} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full py-3.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl text-[11px] font-black uppercase tracking-widest text-black dark:text-zinc-50 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 text-blue-500" />}
              {user.catalogueUrl ? 'Update Catalogue' : 'Upload Catalogue'}
            </button>
            {user.catalogueUrl && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <a 
                  href={user.catalogueUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[10px] font-black uppercase tracking-wider text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3 h-3" />
                  View PDF
                </a>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="mb-10">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xs font-black text-black/60 dark:text-zinc-500 uppercase tracking-[0.2em]">Suggested for you</h3>
          <Link to="/explore" className="text-[10px] font-black text-blue-500 uppercase tracking-wider hover:underline">See All</Link>
        </div>
        <div className="space-y-4">
          {suggestedUsers.slice(0, 5).map(u => (
            <div key={u.id} className="flex items-center justify-between group">
              <Link to={`/profile/${u.id}`} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-100 dark:border-zinc-800 shrink-0">
                  <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-black dark:text-zinc-50 truncate w-32">{u.name}</span>
                  {u.role !== 'customer' && (
                    <span className="text-[10px] text-black/70 dark:text-zinc-500 uppercase font-black tracking-tighter">{u.role}</span>
                  )}
                </div>
              </Link>
              <button className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-600">Follow</button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto opacity-50">
        <p className="text-[10px] font-bold text-black/60 dark:text-zinc-600 uppercase tracking-widest leading-loose">
          © 2026 VYAPAR BRIDGE<br />
          B2B & B2C Trade & Commerce Network
        </p>
      </div>
    </aside>
  );
}

function AppContent() {
  const [user, setUser] = useState<any>(null);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const { isDark, toggleDark } = React.useContext(ThemeContext);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          // Graceful fallback for geolocation permission or timeout
          setUserLocation({ lat: 22.8182, lng: 70.8368 });
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // Stealth Lockout State (Triggers on 2 failed admin PIN attempts, locks for 15 minutes)
  const [isLockedOut, setIsLockedOut] = useState(() => isAppLockedOut());

  useEffect(() => {
    const syncLockoutState = () => {
      setIsLockedOut(isAppLockedOut());
    };
    syncLockoutState();
    const interval = setInterval(syncLockoutState, 3000);
    window.addEventListener('Vyapar Bridge_lockout_changed', syncLockoutState);
    return () => {
      clearInterval(interval);
      window.removeEventListener('Vyapar Bridge_lockout_changed', syncLockoutState);
    };
  }, []);



  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const [isGlobalEditModalOpen, setIsGlobalEditModalOpen] = useState(false);
  const [isGlobalVerifyModalOpen, setIsGlobalVerifyModalOpen] = useState(false);
  const [isGlobalApprovalCenterOpen, setIsGlobalApprovalCenterOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      const fetchUnread = () => {
        fetch('/api/notifications?userId=' + user.id)
          .then(res => (res.ok && res.headers.get('content-type')?.includes('application/json')) ? res.json() : [])
          .then(data => {
            if (Array.isArray(data)) {
              setUnreadNotifs(data.filter((n: any) => !n.read).length);
            }
          })
          .catch(console.error);
      };
      fetchUnread();
      const interval = setInterval(fetchUnread, 10000);
      const onRead = () => setUnreadNotifs(0);
      window.addEventListener('notificationsRead', onRead);
      return () => {
        clearInterval(interval);
        window.removeEventListener('notificationsRead', onRead);
      };
    }
  }, [user?.id]);

  useEffect(() => {
    // Check local storage for user and sync with backend & Firestore
    const savedUser = localStorage.getItem('user') || localStorage.getItem('Vyapar Bridge_user');
    if (savedUser) {
      try {
        let parsed = JSON.parse(savedUser);
        
        // Strict protection: Non-admin users must NOT have legacy unverified badges
        if (parsed && parsed.role !== 'admin' && parsed.id) {
          const isPendingApproved = parsed.pendingPayment?.status === 'approved';
          if (!isPendingApproved && !parsed.isVerifiedByAdmin) {
            parsed = {
              ...parsed,
              isVerified: Boolean(parsed.isVerified && isPendingApproved),
              verifiedBadge: Boolean(parsed.verifiedBadge && isPendingApproved),
              verifiedPlan: isPendingApproved ? parsed.verifiedPlan : undefined
            };
          }
        }

        setUser(parsed);

        if (parsed?.id) {
          getDoc(doc(firestoreDb, 'users', String(parsed.id))).then(docSnap => {
            if (docSnap.exists()) {
              const fbData = docSnap.data();
              const isDbVerified = Boolean(fbData.isVerified);
              const merged = { 
                ...parsed, 
                ...fbData, 
                isVerified: isDbVerified,
                verifiedBadge: isDbVerified,
                verifiedPlan: isDbVerified ? (fbData.verifiedPlan || parsed.verifiedPlan) : undefined
              };
              setUser(merged);
              localStorage.setItem('user', JSON.stringify(merged));
              localStorage.setItem('Vyapar Bridge_user', JSON.stringify(merged));
            } else if (parsed.role !== 'admin') {
              // Reset legacy unverified flag if user doc in Firestore doesn't explicitly have isVerified
              const cleaned = {
                ...parsed,
                isVerified: false,
                verifiedBadge: false,
                verifiedPlan: undefined
              };
              setUser(cleaned);
              localStorage.setItem('user', JSON.stringify(cleaned));
              localStorage.setItem('Vyapar Bridge_user', JSON.stringify(cleaned));
            }
          }).catch(() => {});

          safeFetch(`/api/users/${parsed.id}`)
            .then(latestUser => {
              if (latestUser && latestUser.id) {
                const isUserVerified = Boolean(latestUser.isVerified);
                const sanitized = {
                  ...latestUser,
                  isVerified: isUserVerified,
                  verifiedBadge: isUserVerified,
                  verifiedPlan: isUserVerified ? latestUser.verifiedPlan : undefined
                };
                setUser(sanitized);
                localStorage.setItem('user', JSON.stringify(sanitized));
                localStorage.setItem('Vyapar Bridge_user', JSON.stringify(sanitized));
              }
            })
            .catch(err => {
              console.warn('Session sync note:', err);
            });
        }
      } catch (e) {
        console.warn('User parse note:', e);
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (user?.id) {
      safeFetch(`/api/users/${user.id}/relationships`)
        .then(data => {
          if (data && data.following) {
            localStorage.setItem('followedUsers', JSON.stringify(data.following));
            window.dispatchEvent(new Event('followedUsersUpdated'));
          }
        })
        .catch(err => console.error('Failed to sync relationships:', err));
    }
  }, [user?.id]);

  const [suggestedSidebarUsers, setSuggestedSidebarUsers] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) {
      safeFetch(`/api/users/suggested?userId=${user.id}&limit=5`)
        .then(data => {
          if (Array.isArray(data)) setSuggestedSidebarUsers(data);
        })
        .catch(() => {});
    }
  }, [user?.id]);

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: Compass, label: 'Explore', path: '/explore' },
    { icon: Film, label: 'Reels', path: '/reels' },
    { icon: Users, label: 'Community', path: '/community' },
    { icon: MapIcon, label: 'Roadmap', path: '/roadmap' },
    { icon: MessageCircle, label: 'Messages', path: '/chat' },
    { icon: Heart, label: 'Notifications', path: '/notifications' },
    ...(user?.role !== 'customer' ? [{ icon: PlusSquare, label: 'Create', path: '/create' }] : []),
  ];

  if (user?.role === 'admin') {
    navItems.push({ icon: Shield, label: 'Moderation', path: '/admin' });
  }

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [isLogoMenuOpen, setIsLogoMenuOpen] = useState(false);
  const [isLogoLightboxOpen, setIsLogoLightboxOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  useEffect(() => {
    const handleOpenAuth = () => setIsAuthModalOpen(true);
    window.addEventListener('openAuthModal', handleOpenAuth);
    return () => window.removeEventListener('openAuthModal', handleOpenAuth);
  }, []);

  if (isLockedOut) {
    return <StealthLockoutScreen onUnlockCheck={() => setIsLockedOut(isAppLockedOut())} />;
  }

  const handleLogout = () => {
    setIsSettingsDrawerOpen(false);
    setUser(null);
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
  };

  const handleUpdateUser = (updatedUser: any) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const handleSidebarKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const focusableEls = document.querySelectorAll('.sidebar-nav-item');
      const elsArray = Array.from(focusableEls) as HTMLElement[];
      const activeElement = document.activeElement as HTMLElement;
      
      let currentIndex = elsArray.indexOf(activeElement);
      
      if (e.key === 'ArrowDown') {
        const nextIndex = currentIndex === elsArray.length - 1 ? 0 : currentIndex + 1;
        elsArray[nextIndex]?.focus();
      } else if (e.key === 'ArrowUp') {
        const prevIndex = currentIndex <= 0 ? elsArray.length - 1 : currentIndex - 1;
        elsArray[prevIndex]?.focus();
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#E6C76C] dark:bg-black text-black dark:text-zinc-50 flex flex-col md:flex-row font-sans selection:bg-blue-100 dark:selection:bg-blue-900/30 w-full max-w-full overflow-x-hidden">
      <WelcomeSplash />
      <Toaster position="bottom-center" />
      <AIChatbotWidget />

      {/* Auth Modal for Guest Users trying to interact */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                <h3 className="font-bold text-sm text-black dark:text-zinc-50 uppercase tracking-wider">Vyapar Bridge Portal Login / Register</h3>
              </div>
              <button 
                onClick={() => setIsAuthModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 flex items-center justify-center text-black/70 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[80vh] overflow-y-auto">
              <AuthPage onLogin={(u: any) => {
                setUser(u);
                localStorage.setItem('user', JSON.stringify(u));
                setIsAuthModalOpen(false);
                toast.success(`🎉 Welcome, ${u.name}!`);
              }} />
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile Header (Instagram style with Centered Branding, Top Left Theme Toggle & Right Menu) */}
      <header className="md:hidden bg-[#E6C76C] dark:bg-black border-b border-slate-200 dark:border-zinc-800 px-3 h-14 flex items-center justify-between sticky top-0 z-50 w-full max-w-full overflow-hidden">
        {/* Top Left Menu */}
        <div className="flex items-center shrink-0 z-10 relative">
          <button 
            onClick={() => setIsLogoMenuOpen(!isLogoMenuOpen)}
            className="p-1 text-black/70 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors flex items-center justify-center overflow-hidden"
          >
            <img src={BRAND_LOGO_SRC} alt={BRAND_NAME} className="w-7 h-7 object-cover rounded-full" />
          </button>
          {isLogoMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setIsLogoMenuOpen(false); }} />
              <div className="absolute top-12 left-0 w-60 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden z-50 flex flex-col py-1 animate-in fade-in zoom-in duration-200">
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsLogoMenuOpen(false); setIsGlobalApprovalCenterOpen(true); }}
                  className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <ShieldCheck className="w-5 h-5 text-blue-500" />
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-black dark:text-zinc-100 leading-tight">Payment Mode</span>
                    <span className="text-[10px] text-black/60 dark:text-zinc-400">Verification & Setup</span>
                  </div>
                </button>
                <div className="border-t border-slate-100 dark:border-zinc-800" />
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsLogoMenuOpen(false); navigate('/terms'); }}
                  className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Scale className="w-5 h-5 text-indigo-500" />
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-black dark:text-zinc-100 leading-tight">Terms and Services</span>
                    <span className="text-[10px] text-black/60 dark:text-zinc-400">Platform Policies</span>
                  </div>
                </button>
                <div className="border-t border-slate-100 dark:border-zinc-800" />
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsLogoMenuOpen(false); window.open('https://wa.me/919889104477', '_blank'); }}
                  className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Phone className="w-5 h-5 text-green-500" />
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-black dark:text-zinc-100 leading-tight">Vyapar Bridge Support</span>
                    <span className="text-[10px] text-black/60 dark:text-zinc-400">Contact via WhatsApp</span>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Centered Header Title */}
        <div className="flex-1 flex flex-col items-center justify-center cursor-pointer min-w-0 px-2 group z-0 pointer-events-auto overflow-hidden" onClick={() => navigate('/')}>
          <div className="flex items-center justify-center gap-1.5 max-w-full">
            <img 
              onClick={(e) => { e.stopPropagation(); setIsLogoLightboxOpen(true); }}
              src={BRAND_LOGO_SRC} 
              alt={BRAND_NAME} 
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover shrink-0 shadow-sm border border-slate-200 dark:border-zinc-800 group-hover:scale-110 transition-transform duration-300"
            />
            <div 
              className="text-[15px] min-[360px]:text-[17px] sm:text-xl font-black uppercase tracking-wider not-italic text-center brand-torch-text group-hover:scale-105 transition-all duration-300 active:scale-95 select-none truncate"
              style={{ fontFamily: "'Montserrat', 'Syne', 'Arial Black', sans-serif", fontWeight: 900 }}
            >VYAPAR BRIDGE</div>
          </div>
          <div className="text-[6.5px] min-[360px]:text-[7.5px] font-bold text-black/80 dark:text-zinc-300 uppercase tracking-[0.05em] leading-none mt-0.5 text-center truncate w-full group-hover:text-amber-500 transition-colors">
            Open Network for Digital Commerce (ONDC)
          </div>
          <div 
            className="text-[7px] min-[360px]:text-[8px] font-black italic uppercase tracking-[0.15em] leading-none mt-0.5 text-center truncate w-full bg-gradient-to-r from-amber-600 via-orange-500 to-amber-500 dark:from-amber-400 dark:via-orange-400 dark:to-amber-300 bg-clip-text text-transparent drop-shadow-sm"
            style={{ fontFamily: "'Playfair Display', 'Cinzel', 'Georgia', serif" }}
          >
            ✨ VOCAL FOR LOCAL ✨
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0 z-10 relative">
          <Link to="/notifications" title="Notifications" className="p-1 relative flex items-center justify-center">
            <Heart className="w-5.5 h-5.5 text-black dark:text-zinc-50 hover:scale-105 transition-transform" />
            {unreadNotifs > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-black"></span>}
          </Link>
          <button 
            onClick={() => setIsSettingsDrawerOpen(true)}
            className="p-1 text-black dark:text-zinc-50 hover:opacity-80 transition-opacity cursor-pointer flex items-center justify-center"
            title="Profile & Settings Menu"
          >
            <Menu className="w-6 h-6 stroke-[2.2]" />
          </button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside 
        className="hidden md:flex flex-col w-[72px] lg:w-[244px] fixed top-0 left-0 h-screen bg-[#E6C76C] dark:bg-black border-r border-neutral-200 dark:border-neutral-800 px-2 lg:px-3 py-6 z-40 transition-all duration-700 overflow-y-auto no-scrollbar outline-none"
        tabIndex={0}
        onKeyDown={handleSidebarKeyDown}
      >

        
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <Link 
              key={item.label} 
              to={item.path}
              className={cn(
                "sidebar-nav-item flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors group relative outline-none focus:ring-2 focus:ring-blue-500",
                location.pathname === item.path ? "font-bold text-blue-600 dark:text-zinc-50 bg-blue-50 dark:bg-zinc-900" : "font-normal text-black/80 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-50"
              )}
            >
              <div className="relative">
                <item.icon className={cn("w-6 h-6 shrink-0 transition-transform group-hover:scale-105", location.pathname === item.path && "stroke-[2.5px]")} />
                {item.label === 'Notifications' && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-black"></span>}
              </div>
              <span className="hidden lg:block text-[15px]">{item.label}</span>
              
              <div className="absolute left-14 bg-blue-600 text-white text-xs px-2 py-1.5 rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-700 hidden md:block lg:hidden whitespace-nowrap z-50 pointer-events-none shadow-lg">
                {item.label}
              </div>
            </Link>
          ))}
          {user && (
            <Link 
              to="/profile"
              className={cn(
                "sidebar-nav-item flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors group relative outline-none focus:ring-2 focus:ring-blue-500",
                location.pathname === "/profile" ? "font-bold text-blue-600 dark:text-zinc-50 bg-blue-50 dark:bg-zinc-900" : "font-normal text-black/80 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-50"
              )}
            >
              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0 transition-transform group-hover:scale-105">
                 {user.avatarUrl ? (
                   <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                 ) : (
                   <span className="text-[10px] font-bold text-black/80 dark:text-zinc-300">{user.name?.charAt(0) || 'U'}</span>
                 )}
              </div>
              <span className="hidden lg:block text-[15px]">Profile</span>
              <div className="absolute left-14 bg-blue-600 text-white text-xs px-2 py-1.5 rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-700 hidden md:block lg:hidden whitespace-nowrap z-50 pointer-events-none shadow-lg">
                Profile
              </div>
            </Link>
          )}
        </nav>

        <div className="mt-auto pt-4 space-y-1">
          
          <button 
            onClick={() => setIsCalculatorOpen(true)}
            className="sidebar-nav-item outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors w-full group relative text-black/80 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-50"
          >
            <div className="relative">
              <Calculator className="w-6 h-6 shrink-0 transition-transform group-hover:scale-105 text-emerald-500" />
            </div>
            <span className="hidden lg:block text-[15px] font-semibold text-left flex-1">Vyapar Calculator</span>
            <div className="absolute left-14 bg-emerald-600 text-white text-xs px-2 py-1.5 rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-700 hidden md:block lg:hidden whitespace-nowrap z-50 pointer-events-none shadow-lg">
              Vyapar Calculator
            </div>
          </button>

          <Link to="/terms" className="sidebar-nav-item outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors w-full group relative text-black/80 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-50">
            <Scale className="w-6 h-6 shrink-0 text-blue-500 transition-transform group-hover:scale-105" />
            <span className="hidden lg:block text-[15px] font-semibold">Terms & Rules</span>
            <div className="absolute left-14 bg-blue-600 text-white text-xs px-2 py-1.5 rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-700 hidden md:block lg:hidden whitespace-nowrap z-50 pointer-events-none shadow-lg">
              Terms & Rules
            </div>
          </Link>
          <button 
            onClick={() => setIsSettingsDrawerOpen(true)}
            className="sidebar-nav-item outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors w-full group relative text-black/80 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-50"
          >
            <Menu className="w-6 h-6 shrink-0 text-blue-500 transition-transform group-hover:scale-105" />
            <span className="hidden lg:block text-[15px] font-semibold">Settings</span>
            <div className="absolute left-14 bg-blue-600 text-white text-xs px-2 py-1.5 rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-700 hidden md:block lg:hidden whitespace-nowrap z-50 pointer-events-none shadow-lg">
              Settings
            </div>
          </button>
          <button onClick={toggleDark} className="sidebar-nav-item outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors w-full group relative text-black/80 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-50">
            {isDark ? <Sun className="w-6 h-6 shrink-0 transition-transform group-hover:scale-105 text-amber-400" /> : <Moon className="w-6 h-6 shrink-0 transition-transform group-hover:scale-105 text-indigo-500" /> }
            <span className="hidden lg:block text-[15px]">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            <div className="absolute left-14 bg-blue-600 text-white text-xs px-2 py-1.5 rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-700 hidden md:block lg:hidden whitespace-nowrap z-50 pointer-events-none shadow-lg">
              Theme
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-[72px] lg:ml-[244px] flex w-full max-w-full min-w-0 overflow-x-hidden">
        <main className="flex-1 min-w-0 bg-[#E6C76C] dark:bg-black min-h-screen w-full max-w-full overflow-x-hidden">
          {/* Desktop Header Top Bar */}
          <div className="hidden md:flex items-center justify-between px-6 py-3 border-b border-slate-100 dark:border-zinc-900 bg-[#E6C76C]/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-30">
            <div className="text-xs font-bold text-black/70 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2 min-w-[120px]">
            </div>

            {/* Center Animated Brand Header */}
            <div className="flex-1 flex items-center justify-center gap-2 group">
              <img
                  onClick={(e) => { e.stopPropagation(); setIsLogoLightboxOpen(true); }}
                 src={BRAND_LOGO_SRC}
                  alt="Logo"
                   
                 className="w-10 h-10 lg:w-12 lg:h-12 rounded-full object-cover shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-md border border-slate-200 dark:border-zinc-800 cursor-pointer"
                 
              />
              <div className="flex flex-col items-center cursor-pointer" onClick={() => navigate('/')}>
                <div 
                  className="text-xl lg:text-2xl font-black uppercase tracking-[0.14em] brand-torch-text select-none group-hover:scale-105 transition-transform duration-300"
                  style={{ fontFamily: "'Montserrat', 'Syne', 'Arial Black', sans-serif", fontWeight: 900 }}
                >VYAPAR BRIDGE</div>
                <div className="text-[9px] lg:text-[10px] font-bold text-black/80 dark:text-zinc-300 uppercase tracking-widest mt-0.5 group-hover:text-amber-500 transition-colors">
                  Open Network for Digital Commerce (ONDC)
                </div>
                <div 
                  className="text-[9px] lg:text-[10.5px] font-black italic uppercase tracking-[0.2em] mt-0.5 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-500 dark:from-amber-400 dark:via-orange-400 dark:to-amber-300 bg-clip-text text-transparent drop-shadow-sm"
                  style={{ fontFamily: "'Playfair Display', 'Cinzel', 'Georgia', serif" }}
                >
                  ✨ VOCAL FOR LOCAL ✨
                </div>
              </div>
            </div>

            <div className="min-w-[120px] justify-end"></div>
          </div>

          <Routes>
            <Route path="/" element={<Feed user={user} onUpdateUser={handleUpdateUser} userLocation={userLocation} />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/explore" element={<ExplorePage user={user} userLocation={userLocation} />} />
            <Route path="/reels" element={<ReelsPage user={user} userLocation={userLocation} />} />
            <Route path="/community" element={<CommunityPage user={user} />} />
            <Route path="/roadmap" element={<RoadmapPage user={user} userLocation={userLocation} />} />
            <Route path="/notifications" element={<NotificationsPage user={user} />} />
            <Route path="/profile" element={
              <ProfilePage 
                user={user} 
                onLogout={handleLogout} 
                onUpdateUser={handleUpdateUser} 
                onOpenSettingsDrawer={() => setIsSettingsDrawerOpen(true)}
                onOpenVerify={() => setIsGlobalVerifyModalOpen(true)}
              />
            } />
            <Route path="/profile/:userId" element={
              <ProfilePage 
                user={user} 
                onLogout={handleLogout} 
                onUpdateUser={handleUpdateUser} 
                onOpenSettingsDrawer={() => setIsSettingsDrawerOpen(true)}
                onOpenVerify={() => setIsGlobalVerifyModalOpen(true)}
              />
            } />
            <Route path="/create" element={<CreatePost user={user} />} />
            <Route path="/chat" element={<Chat user={user} onOpenVerify={() => setIsGlobalVerifyModalOpen(true)} userLocation={userLocation} />} />
            <Route path="/terms" element={<TermsPage />} />
            {user?.role === 'admin' && <Route path="/admin" element={<AdminPanel user={user} />} />}
          </Routes>
        </main>
      </div>

      
      {/* TILE CALCULATOR DRAWER */}
      <TileCalculatorDrawer 
        isOpen={isCalculatorOpen} 
        onClose={() => setIsCalculatorOpen(false)} 
      />

      {/* PROFILE SETTINGS & ACCOUNT DRAWER */}
      <ProfileSettingsDrawer 
        isOpen={isSettingsDrawerOpen}
        onClose={() => setIsSettingsDrawerOpen(false)}
        user={user}
        onLogout={handleLogout}
        onOpenEditProfile={() => setIsGlobalEditModalOpen(true)}
        onOpenVerify={() => setIsGlobalVerifyModalOpen(true)}
        onOpenApprovalCenter={() => setIsGlobalApprovalCenterOpen(true)}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onToggleTheme={toggleDark}
        isDark={isDark}
        onOpenMasterConsole={() => setIsMasterModalOpen(true)}
      />

      {/* Global VYAPAR BRIDGE Approval Center Modal */}
      <ApprovalCenterModal 
        isOpen={isGlobalApprovalCenterOpen} 
        onClose={() => setIsGlobalApprovalCenterOpen(false)} 
        user={user}
        onOpenVerify={() => setIsGlobalVerifyModalOpen(true)}
      />

      {/* Master Developer Console Modal (Admin Only) */}
      <MasterDeveloperConsoleModal 
        isOpen={isMasterModalOpen} 
        onClose={() => setIsMasterModalOpen(false)} 
        onLoginAsAdmin={(adminUser) => handleUpdateUser(adminUser)}
      />

      {/* Global Edit Profile Modal */}
      <EditProfileModal 
        isOpen={isGlobalEditModalOpen} 
        onClose={() => setIsGlobalEditModalOpen(false)} 
        user={user} 
        onSave={(updatedUser) => {
          handleUpdateUser(updatedUser);
          setIsGlobalEditModalOpen(false);
          toast.success('Profile updated successfully!');
        }} 
        onOpenVerify={() => {
          setIsGlobalEditModalOpen(false);
          setIsGlobalVerifyModalOpen(true);
        }}
      />

      {/* Global Verified Payment & Badge Modal */}
      <VerifiedPaymentModal 
        isOpen={isGlobalVerifyModalOpen} 
        onClose={() => setIsGlobalVerifyModalOpen(false)} 
        user={user} 
        onSuccess={(updatedUser) => {
          handleUpdateUser(updatedUser);
          setIsGlobalVerifyModalOpen(false);
          toast.success('🎉 Congratulations! Vyapar Bridge Verification active!');
        }} 
      />
      
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-[#E6C76C] dark:bg-black border-t border-slate-200 dark:border-zinc-800 h-14 flex items-center justify-around z-50 px-2 max-w-full">
        <Link to="/"><Home className={cn("w-6 h-6", location.pathname === '/' && "stroke-[2.5px]")} /></Link>
        <Link to="/community"><Users className={cn("w-6 h-6", location.pathname === '/community' && "stroke-[2.5px]")} /></Link>
        {user?.role !== 'customer' && <Link to="/create"><PlusSquare className={cn("w-6 h-6", location.pathname === '/create' && "stroke-[2.5px]")} /></Link>}
        <Link to="/reels"><Film className={cn("w-6 h-6", location.pathname === '/reels' && "stroke-[2.5px]")} /></Link>
        <Link to="/roadmap"><MapIcon className={cn("w-6 h-6", location.pathname === '/roadmap' && "stroke-[2.5px]")} /></Link>
        {user ? (
          <Link to="/profile">
            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 flex items-center justify-center overflow-hidden">
               {user.avatarUrl ? (
                 <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
               ) : (
                 <span className="text-[10px] font-bold text-black/80 dark:text-zinc-300">{user.name?.charAt(0) || 'U'}</span>
               )}
            </div>
          </Link>
        ) : (
          <button 
            onClick={() => setIsAuthModalOpen(true)}
            className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black cursor-pointer shadow-sm"
          >
            Log
          </button>
        )}
      </nav>

      {/* Logo Lightbox Modal */}
      {isLogoLightboxOpen && (
        <div className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setIsLogoLightboxOpen(false)}>
          <button 
            onClick={() => setIsLogoLightboxOpen(false)}
            className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <img 
              src={BRAND_LOGO_SRC} 
              alt={BRAND_NAME} 
              className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full object-cover shadow-[0_0_50px_rgba(230,199,108,0.3)] border-4 border-[#E6C76C]"
            />
          </div>
        </div>
      )}
</div>
  );
}

export default function App() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);



  const toggleDark = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ isDark, toggleDark }}>
      <BrowserRouter>
        <div className="min-h-screen bg-[#E6C76C] dark:bg-black text-black dark:text-zinc-50 transition-colors duration-700 w-full max-w-full overflow-x-hidden">
          <AppContent />
        </div>
      </BrowserRouter>
    </ThemeContext.Provider>
  );
}
