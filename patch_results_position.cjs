const fs = require('fs');
let code = fs.readFileSync('src/components/TileCalculatorDrawer.tsx', 'utf8');

const oldFooter = `            </div>

            {/* Results Footer */}
            <div className="bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-3">
                  <div className="text-xs text-slate-500 mb-1">Total Area</div>
                  <div className="font-black text-lg text-slate-900 dark:text-white">
                    {results.area.toFixed(1)} <span className="text-xs font-medium text-slate-500">sq.ft</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-3">
                  <div className="text-xs text-slate-500 mb-1">Area + Wastage</div>
                  <div className="font-black text-lg text-slate-900 dark:text-white">
                    {results.areaWithWastage.toFixed(1)} <span className="text-xs font-medium text-slate-500">sq.ft</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-600 rounded-2xl p-4 text-white shadow-lg shadow-blue-600/20 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="text-blue-100 text-sm font-medium">Exact Calculation</div>
                  <div className="text-xl font-bold text-blue-50">{results.exactBoxes.toFixed(2)} <span className="text-sm font-medium text-blue-200">Boxes</span></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-white text-base font-bold">Suggested to Buy</div>
                  <div className="text-3xl font-black">{results.boxes} <span className="text-sm font-medium text-blue-200">Boxes</span></div>
                </div>
                {results.totalCost > 0 && (
                  <>
                    <div className="h-px w-full bg-blue-500/50" />
                    <div className="flex items-center justify-between">
                      <div className="text-blue-100 text-sm font-medium">Total Cost</div>
                      <div className="text-2xl font-black">₹{results.totalCost.toLocaleString('en-IN')}</div>
                    </div>
                  </>
                )}
              </div>

              <button 
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors"
              >
                <RefreshCcw className="w-4 h-4" />
                Reset Calculator
              </button>
            </div>`;

const newCode = `
              {/* --- RESULTS SECTION MOVED HERE --- */}
              <div className="mt-8 space-y-4 pt-4 border-t border-slate-200 dark:border-zinc-800">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-4">
                    <div className="text-xs text-slate-500 mb-1">Total Area</div>
                    <div className="font-black text-lg text-slate-900 dark:text-white">
                      {results.area.toFixed(1)} <span className="text-xs font-medium text-slate-500">sq.ft</span>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-4">
                    <div className="text-xs text-slate-500 mb-1">Area + Wastage</div>
                    <div className="font-black text-lg text-slate-900 dark:text-white">
                      {results.areaWithWastage.toFixed(1)} <span className="text-xs font-medium text-slate-500">sq.ft</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-600/20 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="text-blue-100 text-sm font-medium">Exact Calculation</div>
                    <div className="text-xl font-bold text-blue-50">{results.exactBoxes.toFixed(2)} <span className="text-sm font-medium text-blue-200">Boxes</span></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-white text-base font-bold">Suggested to Buy</div>
                    <div className="text-3xl font-black">{results.boxes} <span className="text-sm font-medium text-blue-200">Boxes</span></div>
                  </div>
                  {results.totalCost > 0 && (
                    <>
                      <div className="h-px w-full bg-blue-500/50" />
                      <div className="flex items-center justify-between">
                        <div className="text-blue-100 text-sm font-medium">Total Cost</div>
                        <div className="text-2xl font-black">₹{results.totalCost.toLocaleString('en-IN')}</div>
                      </div>
                    </>
                  )}
                </div>
              </div>

            </div>

            {/* Fixed Footer just for Reset Button */}
            <div className="bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 p-4">
              <button 
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-50 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors shadow-sm"
              >
                <RefreshCcw className="w-4 h-4" />
                Reset Calculator
              </button>
            </div>`;

code = code.replace(oldFooter, newCode);
fs.writeFileSync('src/components/TileCalculatorDrawer.tsx', code);
