import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

target = """                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-black/70 dark:text-zinc-400">Payment Link:</span>
                    <button 
                      onClick={handleCopyLink} 
                      className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      Copy Link 🔗
                    </button>
                  </div>
                  <div className="text-[11px] font-mono text-black/80 dark:text-zinc-300 truncate bg-white dark:bg-zinc-900 p-2 rounded-lg border border-slate-200 dark:border-zinc-800">
                    {paymentSettings.paymentLink || `upi://pay?pa=${paymentSettings.upiId}`}
                  </div>
                </div>

                <p className="text-xs text-black/70 dark:text-zinc-400">
                  Scan the Barcode image using GPay, PhonePe, Paytm or BHIM UPI app, or click the Copy Link button to complete payment.
                </p>"""

replacement = """                </div>

                <p className="text-xs text-black/70 dark:text-zinc-400">
                  Scan the Barcode image using GPay, PhonePe, Paytm or BHIM UPI app, or copy the UPI ID to complete payment.
                </p>"""

content = content.replace(target, replacement)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Done")
