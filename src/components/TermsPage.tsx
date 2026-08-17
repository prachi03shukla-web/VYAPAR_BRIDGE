import React from 'react';
import { ShieldCheck, ShieldAlert, FileText, Lock, Globe, Scale, Users, ArrowLeft, CheckCircle2, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TermsPageProps {
  onClose?: () => void;
  isModal?: boolean;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onClose, isModal = false }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  const content = (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6">
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-zinc-950 text-white p-6 sm:p-8 shadow-2xl border border-indigo-500/30 mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mb-4 shadow-lg border border-blue-400/30">
            <Scale className="w-7 h-7 text-white" />
          </div>
          
          <div 
            className="text-2xl sm:text-3xl font-black uppercase tracking-[0.12em] brand-torch-text mb-2 select-none"
            style={{ fontFamily: "'Montserrat', 'Syne', 'Arial Black', sans-serif", fontWeight: 900 }}
          >
            VYAPAR BRIDGE
          </div>
          
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-wide text-slate-100 flex items-center gap-2">
            <span>TERMS OF SERVICE & DISCLAIMER</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl leading-relaxed">
            Official legal framework, platform connectivity terms, user rights, and zero-liability transaction guidelines for Vyapar Bridge.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-amber-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Effective Year: 2026 • Official Platform Rules</span>
          </div>
        </div>
      </div>

      {/* Terms Sections Grid */}
      <div className="space-y-6">

        {/* 1. Strict B2B Network & AI Moderation */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-amber-200 dark:border-amber-900/50 shadow-sm transition-all hover:shadow-md mb-8">
          <div className="flex items-center gap-3 mb-4 border-b border-slate-100 dark:border-zinc-800/80 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-lg border border-amber-100 dark:border-amber-900/50 shrink-0">
              1
            </div>
            <div>
              <h2 className="text-lg font-black text-black dark:text-zinc-50 flex items-center gap-2">
                <span>Strict B2B Policy & AI Content Moderation</span>
                <ShieldAlert className="w-4 h-4 text-amber-500" />
              </h2>
              <p className="text-xs text-black/70 dark:text-zinc-400">Zero-tolerance for selfies, personal photos & non-B2B media</p>
            </div>
          </div>
          <div className="space-y-4 text-xs sm:text-sm text-black dark:text-zinc-300 leading-relaxed">
            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
              <div className="font-extrabold text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                <span>AI Guardrail Shield Active:</span>
              </div>
              <p className="text-black dark:text-zinc-300 pl-6 mb-2 font-medium">
                Vyapar Bridge is <strong>strictly a B2B network</strong> for Hardware, Paint, Plywood, Electronics, & Generic B2B. 
              </p>
              <ul className="list-disc pl-10 text-black/80 dark:text-zinc-400 space-y-1">
                <li><strong>Prohibited:</strong> Personal human selfies, face portraits, casual videos, and non-business lifestyle media are strictly banned.</li>
                <li><strong>Action:</strong> Our AI Moderation Engine automatically blocks and removes non-B2B uploads in real-time.</li>
                <li><strong>Allowed:</strong> Only upload product catalogs, showroom displays, factory operations, or architectural designs.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 2. Platform Access & Usage */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-4 border-b border-slate-100 dark:border-zinc-800/80 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-lg border border-blue-100 dark:border-blue-900/50 shrink-0">
              2
            </div>
            <div>
              <h2 className="text-lg font-black text-black dark:text-zinc-50 flex items-center gap-2">
                <span>Platform Access & Usage</span>
                <Globe className="w-4 h-4 text-blue-500" />
              </h2>
              <p className="text-xs text-black/70 dark:text-zinc-400">Visitor rights & registered interactive user protocols</p>
            </div>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-black dark:text-zinc-300 leading-relaxed">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800">
              <div className="font-extrabold text-black dark:text-zinc-100 mb-1 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Public Access:</span>
              </div>
              <p className="text-black/80 dark:text-zinc-400 pl-6">
                Vyapar Bridge operates as an open digital directory. Unregistered visitors have the right to view public posts, tile designs, and reels, and may submit anonymous star ratings.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800">
              <div className="font-extrabold text-black dark:text-zinc-100 mb-1 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Registered Access:</span>
              </div>
              <p className="text-black/80 dark:text-zinc-400 pl-6">
                To unlock interactive networking features—including messaging, following, commenting, and posting—users must create a registered account.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Premium Connectivity Plans (Customers) */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-4 border-b border-slate-100 dark:border-zinc-800/80 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-lg border border-emerald-100 dark:border-emerald-900/50 shrink-0">
              3
            </div>
            <div>
              <h2 className="text-lg font-black text-black dark:text-zinc-50 flex items-center gap-2">
                <span>Premium Connectivity Plans (Customers)</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h2>
              <p className="text-xs text-black/70 dark:text-zinc-400">Location-based synchronization & network access tiers</p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-black/80 dark:text-zinc-300 mb-4 font-medium">
            To enhance the networking experience, we offer premium location-based synchronization plans:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* Local Plan */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-200/80 dark:border-blue-900/50 relative overflow-hidden">
              <div className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Local Network Plan</div>
              <div className="text-2xl font-black text-black dark:text-zinc-50 mb-2">₹99 <span className="text-xs font-normal text-black/70 dark:text-zinc-400">/ Month</span></div>
              <p className="text-xs text-black/80 dark:text-zinc-300 leading-relaxed">
                Unlocks direct access to connect with all registered dealers and sellers within a <strong>100 km radius</strong> of your location.
              </p>
            </div>

            {/* Pan India Plan */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/40 dark:from-amber-950/30 dark:to-zinc-900 border border-amber-200/80 dark:border-amber-900/50 relative overflow-hidden">
              <div className="absolute top-3 right-3 text-[10px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full uppercase">Best Value</div>
              <div className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Pan-India Network Plan</div>
              <div className="text-2xl font-black text-black dark:text-zinc-50 mb-2">₹1188 <span className="text-xs font-normal text-black/70 dark:text-zinc-400">/ Year</span></div>
              <p className="text-xs text-black/80 dark:text-zinc-300 leading-relaxed">
                Unlocks unrestricted, <strong>all-India access</strong> to connect with dealers, major companies, and factory owners nationwide.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-zinc-950 text-black/80 dark:text-zinc-400 text-xs font-medium border border-slate-200/70 dark:border-zinc-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500 shrink-0" />
            <span><strong>Note:</strong> Subscription charges are strictly for the usage of our digital networking tools and platform maintenance.</span>
          </div>
        </div>

        {/* 4. Zero Liability on Transactions (Strict Disclaimer) */}
        <div className="bg-red-50/50 dark:bg-red-950/20 rounded-3xl p-6 sm:p-8 border border-red-200 dark:border-red-900/40 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-4 border-b border-red-100 dark:border-red-900/40 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400 flex items-center justify-center font-black text-lg border border-red-200 dark:border-red-800 shrink-0">
              4
            </div>
            <div>
              <h2 className="text-lg font-black text-red-900 dark:text-red-300 flex items-center gap-2">
                <span>Zero Liability on Transactions (Strict Disclaimer)</span>
                <ShieldAlert className="w-5 h-5 text-red-500" />
              </h2>
              <p className="text-xs text-red-700/80 dark:text-red-400/80">Platform scope, user risk acknowledgment & deal disclaimers</p>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-black dark:text-zinc-300 leading-relaxed">
            <p className="p-4 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-red-100 dark:border-red-900/30">
              Vyapar Bridge is purely a B2B and B2C social networking platform, not an e-commerce store. We do not buy, sell, manufacture, or distribute any physical goods.
            </p>
            <p className="p-4 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-red-100 dark:border-red-900/30">
              We only connect buyers with sellers. Any business deal, price negotiation, quality check, or financial transaction made between users is entirely at their own risk.
            </p>
            <div className="p-4 rounded-2xl bg-red-600 text-white font-extrabold shadow-sm flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                Vyapar Bridge holds NO liability or responsibility for any financial loss, fraud, or dispute arising from trades conducted outside our platform between connected users.
              </div>
            </div>
          </div>
        </div>

        {/* 5. Copyright & Intellectual Property */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-4 border-b border-slate-100 dark:border-zinc-800/80 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-lg border border-indigo-100 dark:border-indigo-900/50 shrink-0">
              5
            </div>
            <div>
              <h2 className="text-lg font-black text-black dark:text-zinc-50 flex items-center gap-2">
                <span>Copyright & Intellectual Property</span>
                <Lock className="w-4 h-4 text-indigo-500" />
              </h2>
              <p className="text-xs text-black/70 dark:text-zinc-400">Legal ownership & restrictions against data scraping</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800 text-xs sm:text-sm text-black dark:text-zinc-300 leading-relaxed space-y-3">
            <div className="font-black text-sm text-black dark:text-zinc-100">
              © 2026 Vyapar Bridge. All rights reserved.
            </div>
            <p>
              The platform’s name, logo, custom light reflection UI profiles, and software architecture are the exclusive property of Vyapar Bridge.
            </p>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 font-semibold text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Unauthorized copying, reverse engineering, or scraping of dealer data from this platform is strictly prohibited and will invite legal action.</span>
            </div>
          </div>
        </div>

      </div>

      {/* Footer Branding */}
      <div className="mt-12 text-center text-xs font-bold text-black/60 dark:text-zinc-600 uppercase tracking-widest pb-8">
        Vyapar Bridge • Official B2B Directory & Social Network
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <div className="bg-slate-50 dark:bg-zinc-950 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200">
          <div className="sticky top-0 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-600" />
              <span className="font-extrabold text-sm text-black dark:text-zinc-50 uppercase tracking-wider">
                Terms of Service & Disclaimer
              </span>
            </div>
            <button
              onClick={handleBack}
              className="p-2 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-black/80 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-black dark:text-zinc-50 pb-16">
      {/* Page Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-md px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-xs font-bold text-black dark:text-zinc-200 transition-colors cursor-pointer border border-slate-200 dark:border-zinc-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="text-xs font-extrabold uppercase tracking-widest text-black/70 dark:text-zinc-400">
          Vyapar Bridge Terms
        </div>
      </div>

      {content}
    </div>
  );
};
