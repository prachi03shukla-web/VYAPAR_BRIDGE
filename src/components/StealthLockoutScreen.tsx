import React, { useState } from 'react';
import { WifiOff, RefreshCw, AlertTriangle, ShieldAlert } from 'lucide-react';
import { isAppLockedOut, clearLockout } from '../utils/lockoutManager';

interface StealthLockoutScreenProps {
  onUnlockCheck?: () => void;
}

export function StealthLockoutScreen({ onUnlockCheck }: StealthLockoutScreenProps) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => {
      setRetrying(false);
      clearLockout();
      if (onUnlockCheck) {
        onUnlockCheck();
      } else {
        window.location.reload();
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center select-none font-sans animate-fade-in">
      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-xl">
        
        {/* Subtle Ambient Red Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Warning Icon */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-inner">
          <WifiOff className="w-10 h-10" />
        </div>

        {/* Message pretending app connection crashed/halted */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/60 border border-red-800/60 text-red-400 text-[11px] font-bold tracking-wide uppercase">
            <ShieldAlert className="w-3.5 h-3.5" /> Service Refused
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            503 Service Gateway Halt
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The Vyapar Bridge core server gateway has stopped responding or encountered an unhandled network protocol fault.
          </p>
          
          {/* Deceptive Technical Log */}
          <div className="pt-2 font-mono text-[10px] text-red-400/90 bg-slate-950/90 p-3 rounded-2xl border border-slate-800 text-left space-y-1">
            <div className="flex items-center justify-between text-slate-500 pb-1 border-b border-slate-800/80 mb-1">
              <span>SYSTEM_DIAGNOSTIC_LOG</span>
              <span>ERR_503</span>
            </div>
            <div>[ERR_GATEWAY_PROTOCOL_HALT]</div>
            <div>STATUS: CONNECTION_TERMINATED</div>
            <div>ACTION: SERVER_SOCKET_CLOSED</div>
            <div>REASON: ACCESS_POLICY_VIOLATION</div>
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold py-3.5 px-4 rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98 shadow-lg"
          >
            <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin text-blue-400' : ''}`} />
            {retrying ? 'Re-establishing Gateway Socket...' : 'Reload Gateway Connection'}
          </button>
          
          <p className="text-[10px] text-slate-500 font-medium">
            Vyapar Bridge B2B Platform • Core Security Gateway
          </p>
        </div>
      </div>
    </div>
  );
}
