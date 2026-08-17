import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, Building2, MapPin } from 'lucide-react';
import { validateGSTIN, GSTValidationResult } from '../utils/gstinValidator';

interface GstInputProps {
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  onValidationChange?: (isValid: boolean) => void;
  label?: string;
  placeholder?: string;
}

export function GstInput({
  value,
  onChange,
  required = false,
  onValidationChange,
  label = "GST Number / GSTIN Tax ID",
  placeholder = "e.g. 09AAAAA0000A1Z5"
}: GstInputProps) {
  const [result, setResult] = useState<GSTValidationResult | null>(null);

  useEffect(() => {
    if (!value || value.trim() === '') {
      setResult(null);
      if (onValidationChange) onValidationChange(!required);
      return;
    }

    const res = validateGSTIN(value);
    setResult(res);

    if (onValidationChange) {
      onValidationChange(res.isValid);
    }
  }, [value, required]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uppercaseVal = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
    onChange(uppercaseVal);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
          {label} {required ? <span className="text-red-500">*</span> : <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>}
        </label>
        {value && value.length > 0 && (
          <span className="text-[10px] font-mono font-semibold text-slate-400">
            {value.length}/15 chars
          </span>
        )}
      </div>

      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={15}
          className={`w-full bg-slate-50 dark:bg-zinc-800 border rounded-xl px-3.5 py-2.5 text-sm font-mono tracking-wider uppercase focus:outline-none transition-all ${
            result?.isValid
              ? 'border-emerald-500 dark:border-emerald-500/80 bg-emerald-50/20 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100'
              : result && !result.isValid
              ? 'border-red-500 dark:border-red-500/80 bg-red-50/20 dark:bg-red-950/20 text-red-900 dark:text-red-100'
              : 'border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 focus:border-blue-500'
          }`}
        />

        {result && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {result.isValid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
            )}
          </div>
        )}
      </div>

      {/* Real-time Status Card & Verification */}
      {value && value.length > 0 && (
        <div className="mt-2 text-xs">
          {result?.isValid ? (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-200 space-y-1.5 animate-fade-in">
              <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>✓ Verified GSTIN Format ({result.stateName})</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-emerald-200/60 dark:border-emerald-800/60 font-medium">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>State: <strong>{result.stateName}</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Entity Type: <strong>{result.entityType}</strong></span>
                </div>
              </div>
            </div>
          ) : result?.error ? (
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/80 text-red-700 dark:text-red-300 space-y-1 animate-fade-in">
              <div className="flex items-center gap-1.5 font-bold text-xs text-red-600 dark:text-red-400">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span>⚠️ Invalid GSTIN Warning</span>
              </div>
              <p className="text-[11px] leading-tight font-medium">
                {result.error}
              </p>
              <p className="text-[10px] text-red-500 dark:text-red-400/80 italic">
                Please enter a genuine 15-character Indian GSTIN.
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
