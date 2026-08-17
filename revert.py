import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

target1 = """  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      const data = await safeFetch('/api/payments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || '1',
          plan: selectedPlan,
          membershipType: membershipType,
          utr: 'Sent directly to Admin'
        })
      });
      if (data.success && data.user) {
        onSuccess(data.user);
        toast.success(`⏳ Payment Submitted! Please send your UTR/Screenshot on WhatsApp to Admin for instant verification.`);
        onClose();
      } else {
        toast.error(data.error || 'Submission failed. Please check UTR and try again.');
      }
    } catch (e) {"""

replacement1 = """  const handleConfirmPayment = async () => {
    if (!utr || !utr.trim()) {
      toast.error('Please enter your 12-digit UTR or Transaction Reference Number!');
      return;
    }
    setLoading(true);
    try {
      const data = await safeFetch('/api/payments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || '1',
          plan: selectedPlan,
          membershipType: membershipType,
          utr: utr.trim()
        })
      });
      if (data.success && data.user) {
        onSuccess(data.user);
        toast.success(`⏳ Payment UTR Submitted! Admin 24-Hour Verification is now active. Badge will activate upon Admin approval.`);
        onClose();
      } else {
        toast.error(data.error || 'Submission failed. Please check UTR and try again.');
      }
    } catch (e) {"""

content = content.replace(target1, replacement1)

target2 = """              <div>
                <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 mt-2">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                    Important: After payment, tap "Payment Done" below and send your payment screenshot on WhatsApp to Admin for activation.
                  </p>
                </div>
              </div>"""

replacement2 = """              <div>
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
              </div>"""

content = content.replace(target2, replacement2)

target3 = """                              <div className="text-xs text-black/60 flex flex-wrap items-center gap-4">
                                <span><strong className="text-amber-300 text-xs">Verify via WhatsApp Screenshot</strong></span>
                                <span>Phone: <span className="text-slate-300">{p.userPhone}</span></span>
                                <span>Submitted: <span className="text-slate-300">{new Date(p.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></span>
                              </div>"""

replacement3 = """                              <div className="text-xs text-black/60 flex flex-wrap items-center gap-4">
                                <span>UTR: <strong className="font-mono text-amber-300 text-sm select-all bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{p.utr}</strong></span>
                                <span>Phone: <span className="text-slate-300">{p.userPhone}</span></span>
                                <span>Submitted: <span className="text-slate-300">{new Date(p.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></span>
                              </div>"""

content = content.replace(target3, replacement3)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Done")
