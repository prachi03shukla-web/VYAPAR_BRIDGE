import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

target = """          {step === 'plan' ? ("""

replacement = """          {user?.isVerified ? (
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
          ) : step === 'plan' ? ("""

content = content.replace(target, replacement)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Done")
