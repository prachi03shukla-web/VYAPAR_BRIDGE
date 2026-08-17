import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';

export function AdRatingComponent({ ad, onRate }: { ad: any, onRate: (adId: string, rating: number, ad: any) => void }) {
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Try to check if user already rated this session (mocking)
  const [hasRated, setHasRated] = useState(false);

  const averageRating = ad?.ratingCount ? (ad.totalRating / ad.ratingCount).toFixed(1) : '0.0';

  const handleRate = async (rating: number) => {
    if (hasRated || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/advertisement/${ad.id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`You rated this ad ${rating} stars!`);
        setHasRated(true);
        onRate(ad.id, rating, data.ad);
      } else {
        toast.error('Failed to submit rating.');
      }
    } catch (e) {
      toast.error('Error submitting rating.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex items-center" onMouseLeave={() => setHoverRating(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={clsx(
              "w-4 h-4 cursor-pointer transition-colors",
              (hoverRating || (hasRated ? 5 : 0)) >= star 
                ? "text-amber-400 fill-amber-400" 
                : "text-slate-600 hover:text-amber-400/50"
            )}
            onMouseEnter={() => !hasRated && setHoverRating(star)}
            onClick={() => handleRate(star)}
          />
        ))}
      </div>
      <span className="text-[11px] text-zinc-400 font-medium">
        {ad?.ratingCount ? `${averageRating} (${ad.ratingCount} ratings)` : 'No ratings yet'}
      </span>
    </div>
  );
}
