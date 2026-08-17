#!/bin/bash
sed -i '1419c\
          {/* Quick Rating Selector */}\
          <div className="flex bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full px-2 py-1 items-center gap-0.5 transition-all" onClick={e => e.stopPropagation()}>\
            {[1, 2, 3, 4, 5].map((star) => (\
              <button \
                key={star} \
                onClick={(e) => { \
                  e.stopPropagation();\
                  const currentTotal = reelRating * reelRatingsCount;\
                  const newCount = reelRatingsCount + 1;\
                  const newAvg = (currentTotal + star) / newCount;\
                  setReelRating(newAvg);\
                  setReelRatingsCount(newCount);\
                  toast.success(`You rated this ${star} stars!`);\
                  if (currentUser?.id) {\
                    fetch(`/api/posts/${reel.id}/rate`, {\
                      method: "POST",\
                      headers: { "Content-Type": "application/json" },\
                      body: JSON.stringify({ userId: currentUser.id, rating: star })\
                    }).catch(console.error);\
                  }\
                }}\
                className="p-1 hover:scale-125 transition-transform group/star cursor-pointer"\
                title={`Rate ${star} Stars`}\
              >\
                <Star className={`w-3.5 h-3.5 ${reelRating >= star ? "fill-amber-400 text-amber-400" : "text-white/50 group-hover/star:text-amber-400"}`} />\
              </button>\
            ))}\
            <span className="text-[10px] font-bold ml-1 text-white/80 pr-1">{reelRating.toFixed(1)} <span className="text-white/50">({reelRatingsCount})</span></span>\
          </div>\
' src/App.tsx
