import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calculator, Layers, RefreshCcw, Box, Receipt, Grid, Package, Ruler, Scale as ScaleIcon } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_SIZES = [
  { label: '600x600 mm (2x2 ft)', coverage: 15.5, tiles: 4 },
  { label: '600x1200 mm (2x4 ft)', coverage: 15.5, tiles: 2 },
  { label: '800x800 mm (32x32 in)', coverage: 20.66, tiles: 3 },
  { label: '800x1600 mm', coverage: 27.55, tiles: 2 },
  { label: 'Custom Coverage', coverage: 0, tiles: 0 }
];

export function TileCalculatorDrawer({ isOpen, onClose }: Props) {
  const [mode, setMode] = useState<'tiles' | 'items' | 'length' | 'weight'>('tiles');

  // Tile State
  const [length, setLength] = useState<string>('');
  const [width, setWidth] = useState<string>('');
  const [wastage, setWastage] = useState<string>('5');
  const [selectedSize, setSelectedSize] = useState(COMMON_SIZES[0]);
  const [customCoverage, setCustomCoverage] = useState<string>('');
  const [boxPrice, setBoxPrice] = useState<string>('');

  // General Trades State
  const [generalQuantity, setGeneralQuantity] = useState<string>('');
  const [generalPrice, setGeneralPrice] = useState<string>('');

  const [results, setResults] = useState({
    area: 0,
    areaWithWastage: 0,
    boxes: 0,
    exactBoxes: 0,
    totalCost: 0
  });

  const [generalTotal, setGeneralTotal] = useState(0);

  useEffect(() => {
    if (mode === 'tiles') {
      const l = parseFloat(length) || 0;
      const w = parseFloat(width) || 0;
      const was = parseFloat(wastage) || 0;
      const price = parseFloat(boxPrice) || 0;
      
      let coverage = selectedSize.coverage;
      if (selectedSize.label === 'Custom Coverage') {
        coverage = parseFloat(customCoverage) || 0;
      }

      const area = l * w;
      const areaWithWastage = area + (area * (was / 100));
      
      let exactBoxes = 0;
      let suggestedBoxes = 0;
      
      if (coverage > 0) {
        exactBoxes = areaWithWastage / coverage;
        suggestedBoxes = Math.ceil(exactBoxes);
      }

      const totalCost = suggestedBoxes * price;

      setResults({
        area,
        areaWithWastage,
        boxes: suggestedBoxes,
        exactBoxes,
        totalCost
      });
    } else {
      const q = parseFloat(generalQuantity) || 0;
      const p = parseFloat(generalPrice) || 0;
      setGeneralTotal(q * p);
    }
  }, [length, width, wastage, selectedSize, customCoverage, boxPrice, generalQuantity, generalPrice, mode]);

  const handleReset = () => {
    setLength('');
    setWidth('');
    setWastage('5');
    setSelectedSize(COMMON_SIZES[0]);
    setCustomCoverage('');
    setBoxPrice('');
    setGeneralQuantity('');
    setGeneralPrice('');
  };

  const getUnitLabel = () => {
    if (mode === 'items') return 'Total Quantity (Pieces, Boxes, Units)';
    if (mode === 'length') return 'Total Length (Meters, Feet, Rolls)';
    if (mode === 'weight') return 'Total Weight (Kg, Tons, Bags)';
    return 'Quantity';
  };

  const getPriceLabel = () => {
    if (mode === 'items') return 'Price per Unit (₹)';
    if (mode === 'length') return 'Price per Meter/Foot (₹)';
    if (mode === 'weight') return 'Price per Kg/Bag (₹)';
    return 'Price (₹)';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.5 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed top-0 right-0 w-full max-w-md h-full bg-white dark:bg-zinc-950 border-l border-slate-200 dark:border-zinc-800 shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-black dark:text-zinc-100">Vyapar Calculator</h2>
                  <p className="text-[11px] text-black/70 dark:text-zinc-400 uppercase tracking-wider font-semibold mt-0.5">Universal B2B Tool</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-black/70 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto no-scrollbar gap-2 px-4 py-3 bg-[#E6C76C] dark:bg-black border-b border-slate-100 dark:border-zinc-800">
              {[
                { id: 'tiles', icon: Grid, label: 'Tiles' },
                { id: 'items', icon: Package, label: 'Items' },
                { id: 'length', icon: Ruler, label: 'Length' },
                { id: 'weight', icon: ScaleIcon, label: 'Weight' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setMode(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-1 justify-center ${
                    mode === tab.id 
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20' 
                      : 'bg-slate-100 dark:bg-zinc-900 text-black/70 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
              
              {mode === 'tiles' ? (
                <>
                  {/* Room Dimensions */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-black dark:text-zinc-300 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-500" />
                      Room Dimensions (in Feet)
                    </h3>
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-1.5">
                        <label className="text-xs font-semibold text-black/70">Length (ft)</label>
                        <input 
                          type="number"
                          value={length}
                          onChange={(e) => setLength(e.target.value)}
                          placeholder="e.g. 12"
                          className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <label className="text-xs font-semibold text-black/70">Width (ft)</label>
                        <input 
                          type="number"
                          value={width}
                          onChange={(e) => setWidth(e.target.value)}
                          placeholder="e.g. 10"
                          className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tile Size & Coverage */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-black dark:text-zinc-300 flex items-center gap-2">
                      <Box className="w-4 h-4 text-amber-500" />
                      Tile Details
                    </h3>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-black/70">Select Tile Size (Coverage per Box)</label>
                      <select 
                        value={selectedSize.label}
                        onChange={(e) => setSelectedSize(COMMON_SIZES.find(s => s.label === e.target.value) || COMMON_SIZES[0])}
                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm appearance-none"
                      >
                        {COMMON_SIZES.map(s => (
                          <option key={s.label} value={s.label}>
                            {s.label} {s.coverage > 0 ? `(${s.coverage} sq.ft)` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedSize.label === 'Custom Coverage' && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-black/70">Custom Coverage (Sq.Ft per Box)</label>
                        <input 
                          type="number"
                          value={customCoverage}
                          onChange={(e) => setCustomCoverage(e.target.value)}
                          placeholder="e.g. 16.5"
                          className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        />
                      </div>
                    )}
                  </div>

                  {/* Pricing & Wastage */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-black dark:text-zinc-300 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-blue-500" />
                      Pricing & Wastage
                    </h3>
                    
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-1.5">
                        <label className="text-xs font-semibold text-black/70">Price per Box (₹)</label>
                        <input 
                          type="number"
                          value={boxPrice}
                          onChange={(e) => setBoxPrice(e.target.value)}
                          placeholder="e.g. 450"
                          className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <label className="text-xs font-semibold text-black/70">Skirting/Wastage (%)</label>
                        <input 
                          type="number"
                          value={wastage}
                          onChange={(e) => setWastage(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* --- RESULTS SECTION --- */}
                  <div className="mt-8 space-y-4 pt-4 border-t border-slate-200 dark:border-zinc-800">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#E6C76C] dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-4">
                        <div className="text-xs text-black/70 mb-1">Total Area</div>
                        <div className="font-black text-lg text-black dark:text-white">
                          {results.area.toFixed(1)} <span className="text-xs font-medium text-black/70">sq.ft</span>
                        </div>
                      </div>
                      <div className="bg-[#E6C76C] dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-4">
                        <div className="text-xs text-black/70 mb-1">Area + Wastage</div>
                        <div className="font-black text-lg text-black dark:text-white">
                          {results.areaWithWastage.toFixed(1)} <span className="text-xs font-medium text-black/70">sq.ft</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-600/20 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="text-emerald-100 text-sm font-medium">Exact Calculation</div>
                        <div className="text-xl font-bold text-emerald-50">{results.exactBoxes.toFixed(2)} <span className="text-sm font-medium text-emerald-200">Boxes</span></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-white text-base font-bold">Suggested to Buy</div>
                        <div className="text-3xl font-black">{results.boxes} <span className="text-sm font-medium text-emerald-200">Boxes</span></div>
                      </div>
                      {results.totalCost > 0 && (
                        <>
                          <div className="h-px w-full bg-emerald-500/50" />
                          <div className="flex items-center justify-between">
                            <div className="text-emerald-100 text-sm font-medium">Total Cost</div>
                            <div className="text-2xl font-black">₹{results.totalCost.toLocaleString('en-IN')}</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* GENERAL CALCULATION FORM (Items, Length, Weight) */}
                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-black/70">{getUnitLabel()}</label>
                      <input 
                        type="number"
                        value={generalQuantity}
                        onChange={(e) => setGeneralQuantity(e.target.value)}
                        placeholder="Enter quantity..."
                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 text-base"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-black/70">{getPriceLabel()}</label>
                      <input 
                        type="number"
                        value={generalPrice}
                        onChange={(e) => setGeneralPrice(e.target.value)}
                        placeholder="Enter price..."
                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 text-base"
                      />
                    </div>
                  </div>

                  {/* --- GENERAL RESULTS SECTION --- */}
                  <div className="mt-8 pt-4 border-t border-slate-200 dark:border-zinc-800">
                    <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-600/20 flex flex-col gap-2">
                      <div className="text-emerald-100 text-sm font-medium">Final Amount</div>
                      <div className="text-4xl font-black tracking-tight text-white break-all">
                        ₹{generalTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </>
              )}

            </div>

            {/* Fixed Footer just for Reset Button */}
            <div className="bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 p-4">
              <button 
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#E6C76C] dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-black/80 dark:text-zinc-300 hover:text-black dark:hover:text-zinc-50 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors shadow-sm"
              >
                <RefreshCcw className="w-4 h-4" />
                Reset Calculator
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
