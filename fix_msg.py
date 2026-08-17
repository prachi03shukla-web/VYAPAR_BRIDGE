import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

target = """                <input 
                  type="text" 
                  value={utr}
                  onChange={e => setUtr(e.target.value)}
                  placeholder="e.g. 423891023812"
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-black dark:text-white"
                />
              </div>"""

replacement = """                <input 
                  type="text" 
                  value={utr}
                  onChange={e => setUtr(e.target.value)}
                  placeholder="e.g. 423891023812"
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-black dark:text-white"
                />
                <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 mt-3">
                  <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                    Important: After submitting UTR, tap "Payment Done" and send your payment screenshot on WhatsApp to Admin for instant activation.
                  </p>
                </div>
              </div>"""

content = content.replace(target, replacement)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Done")
