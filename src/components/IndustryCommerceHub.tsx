import React, { useState } from 'react';
import { ALL_INDUSTRIES, IndustryHub, SubCategory } from '../constants/industryData';
import { Building2, Store, MapPin, Sparkles, Filter, Navigation, Globe, ShieldCheck, ChevronRight, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { calculateDistance } from '../App';

interface IndustryCommerceHubProps {
  selectedIndustryId: string;
  onSelectIndustry: (id: string) => void;
  selectedSubcategoryId: string;
  onSelectSubcategory: (subId: string) => void;
  filterRadius: 'all' | '100km';
  onChangeFilterRadius: (radius: 'all' | '100km') => void;
  filterRole: 'all' | 'factory' | 'dealer';
  onChangeFilterRole: (role: 'all' | 'factory' | 'dealer') => void;
  userLocation?: { lat: number; lng: number } | null;
  dealersList?: any[];
  onOpenDirectory?: () => void;
  onOpenVerifyModal?: () => void;
}

export function IndustryCommerceHub({
  selectedIndustryId,
  onSelectIndustry,
  selectedSubcategoryId,
  onSelectSubcategory,
  filterRadius,
  onChangeFilterRadius,
  filterRole,
  onChangeFilterRole,
  userLocation,
  dealersList = [],
  onOpenDirectory,
  onOpenVerifyModal
}: IndustryCommerceHubProps) {
  const activeIndustry = ALL_INDUSTRIES.find(i => i.id === selectedIndustryId);

  // Calculate counts
  const filteredDealersCount = dealersList.filter(d => {
    if (selectedIndustryId === 'all') return true;
    const catStr = (d.category || '').toLowerCase();
    const ind = ALL_INDUSTRIES.find(i => i.id === selectedIndustryId);
    if (!ind) return true;
    
    // Check if dealer belongs to any subcategory or industry keywords
    if (catStr.includes(ind.name.toLowerCase()) || catStr.includes(ind.shortName.toLowerCase())) return true;
    return ind.subcategories.some(sub => 
      catStr.includes(sub.name.toLowerCase()) || 
      sub.tags.some(t => catStr.includes(t))
    );
  }).length;

  return (
    <div className="w-full mb-6 space-y-3">
      {/* Top Banner: All India Commerce Hub Header */}
      <div className="bg-gradient-to-r from-amber-500/10 via-slate-900/40 to-blue-500/10 dark:from-amber-950/40 dark:via-zinc-900/60 dark:to-blue-950/40 border border-amber-500/30 dark:border-amber-500/20 rounded-2xl p-3.5 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-lg shadow-md shrink-0">
              🇮🇳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-black dark:text-zinc-50 uppercase tracking-wider">
                  All India Vyapar Hub
                </h3>
                <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                  Multi-Industry B2B
                </span>
              </div>
              <p className="text-[11px] text-black/70 dark:text-zinc-400 font-medium">
                Tiles, Textile, FMCG, Hardware & Logistics connecting directly with Factories & Dealers
              </p>
            </div>
          </div>

          {/* 100 KM Plan vs All India Plan Filter Toggle */}
          <div className="flex items-center gap-1.5 bg-white/80 dark:bg-black/80 p-1 rounded-xl border border-slate-200 dark:border-zinc-800 self-stretch sm:self-auto justify-center">
            <button
              onClick={() => onChangeFilterRadius('100km')}
              className={clsx(
                "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                filterRadius === '100km'
                  ? "bg-amber-500 text-slate-950 font-black shadow-md"
                  : "text-black/70 dark:text-zinc-400 hover:text-black dark:hover:text-white"
              )}
              title="100km Radius Plan - Prioritizes nearby local dealers & factories"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Nearby (100 KM)</span>
              <span className="text-[9px] px-1 py-0.2 bg-slate-950/20 rounded font-black">₹99 Plan</span>
            </button>

            <button
              onClick={() => onChangeFilterRadius('all')}
              className={clsx(
                "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                filterRadius === 'all'
                  ? "bg-blue-600 text-white font-black shadow-md"
                  : "text-black/70 dark:text-zinc-400 hover:text-black dark:hover:text-white"
              )}
              title="All India VIP Plan - Nationwide verified factories and dealers"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>All India</span>
              <span className="text-[9px] px-1 py-0.2 bg-white/20 rounded font-black">VIP ₹1188</span>
            </button>
          </div>
        </div>

        {/* Primary Industry Tabs Bar */}
        <div className="mt-3.5 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => {
              onSelectIndustry('all');
              onSelectSubcategory('all');
            }}
            className={clsx(
              "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all border cursor-pointer",
              selectedIndustryId === 'all'
                ? "bg-slate-950 text-amber-400 border-amber-400 shadow-md scale-105"
                : "bg-white/90 dark:bg-zinc-900/90 text-black/80 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:border-amber-400"
            )}
          >
            <span>🌐</span>
            <span>All Industries</span>
          </button>

          {ALL_INDUSTRIES.map(industry => {
            const isSelected = selectedIndustryId === industry.id;
            return (
              <button
                key={industry.id}
                onClick={() => {
                  onSelectIndustry(industry.id);
                  onSelectSubcategory('all');
                }}
                className={clsx(
                  "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all border cursor-pointer",
                  isSelected
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 shadow-md font-black scale-105"
                    : "bg-white/90 dark:bg-zinc-900/90 text-black/80 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:border-amber-400"
                )}
              >
                <span className="text-sm">{industry.icon}</span>
                <span>{industry.shortName}</span>
                {isSelected && (
                  <span className="text-[10px] bg-slate-950/20 px-1.5 py-0.5 rounded-full font-black">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Subcategory Pills & Secondary Filter Toolbar */}
      {activeIndustry && (
        <div className="bg-white/60 dark:bg-zinc-900/60 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base">{activeIndustry.icon}</span>
              <div>
                <span className="text-xs font-black text-black dark:text-zinc-100 uppercase tracking-wider">
                  {activeIndustry.name}
                </span>
                <span className="hidden sm:inline-block text-[11px] text-black/60 dark:text-zinc-400 ml-2 font-medium">
                  {activeIndustry.hindiName}
                </span>
              </div>
            </div>

            {/* Role Filter Selector: Factory vs Dealer vs All */}
            <div className="flex items-center gap-1 text-[11px] font-bold">
              <button
                onClick={() => onChangeFilterRole('all')}
                className={clsx(
                  "px-2 py-1 rounded-lg border transition-all cursor-pointer",
                  filterRole === 'all'
                    ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-slate-950 font-black border-slate-900"
                    : "bg-transparent text-black/70 dark:text-zinc-400 border-slate-300 dark:border-zinc-700"
                )}
              >
                All Roles
              </button>
              <button
                onClick={() => onChangeFilterRole('factory')}
                className={clsx(
                  "flex items-center gap-1 px-2 py-1 rounded-lg border transition-all cursor-pointer",
                  filterRole === 'factory'
                    ? "bg-amber-500 text-slate-950 font-black border-amber-400"
                    : "bg-transparent text-black/70 dark:text-zinc-400 border-slate-300 dark:border-zinc-700"
                )}
              >
                <Building2 className="w-3 h-3" />
                <span>Factories</span>
              </button>
              <button
                onClick={() => onChangeFilterRole('dealer')}
                className={clsx(
                  "flex items-center gap-1 px-2 py-1 rounded-lg border transition-all cursor-pointer",
                  filterRole === 'dealer'
                    ? "bg-blue-600 text-white font-black border-blue-500"
                    : "bg-transparent text-black/70 dark:text-zinc-400 border-slate-300 dark:border-zinc-700"
                )}
              >
                <Store className="w-3 h-3" />
                <span>Dealers</span>
              </button>
            </div>
          </div>

          {/* Subcategories Horizontal Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => onSelectSubcategory('all')}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider shrink-0 transition-all border cursor-pointer",
                selectedSubcategoryId === 'all'
                  ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                  : "bg-slate-100 dark:bg-zinc-800 text-black/70 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-200"
              )}
            >
              All {activeIndustry.shortName}
            </button>

            {activeIndustry.subcategories.map(sub => {
              const isSubSelected = selectedSubcategoryId === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => onSelectSubcategory(sub.id)}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-[11px] font-bold shrink-0 transition-all border cursor-pointer flex items-center gap-1.5",
                    isSubSelected
                      ? "bg-slate-950 text-amber-400 border-amber-400 shadow-sm font-black"
                      : "bg-white dark:bg-zinc-800 text-black/80 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-amber-400"
                  )}
                  title={sub.description}
                >
                  <span>{sub.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Network Reach Indicator Bar */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-black/70 dark:text-zinc-400 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            Showing {filterRadius === '100km' ? 'Nearby 100 KM local providers' : 'All-India verified network'}:
          </span>
          <span className="font-extrabold text-black dark:text-zinc-100">
            {activeIndustry ? activeIndustry.name : 'All Indian Commerce Sectors'}
          </span>
        </div>

        {filterRadius === '100km' && userLocation && (
          <span className="text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-bold">
            📍 GPS Radius Filter Active
          </span>
        )}
      </div>
    </div>
  );
}
