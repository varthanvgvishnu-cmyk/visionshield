import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function Overview({ riskScore, recommendation, totalScans, quarantinedCount, onOpenRiskEngine }) {
  const strokeColor =
    riskScore >= 61
      ? "stroke-rose-500"
      : riskScore >= 31
      ? "stroke-amber-500"
      : "stroke-emerald-500";

  return (
    <div className="bg-[#0e1626] border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-6">
          <div className="relative flex items-center justify-center w-28 h-28 rounded-full border-4 border-slate-800 bg-slate-950 shadow-inner">
            <div className="text-center">
              <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
                {riskScore}%
              </span>
              <span className="block text-[10px] uppercase font-mono text-slate-400">
                Risk Score
              </span>
            </div>
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
              <circle cx="56" cy="56" r="48" className="stroke-slate-800" strokeWidth="6" fill="transparent" />
              <circle
                cx="56"
                cy="56"
                r="48"
                className={strokeColor}
                strokeWidth="6"
                fill="transparent"
                strokeDasharray="301.59"
                strokeDashoffset={301.59 - (301.59 * riskScore) / 100}
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div>
            <div className="flex items-center space-x-3 mb-1.5">
              <span className="text-xs uppercase tracking-wider font-mono text-slate-400 font-medium">
                Unified Risk Engine Recommendation
              </span>
            </div>
            <div className="flex items-center space-x-3">
              {recommendation === "ACCEPT" && (
                <div className="px-3 py-1 rounded-md text-xs font-mono font-bold border tracking-wider flex items-center space-x-2 bg-emerald-950/80 border-emerald-600 text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>ACCEPT (0-30)</span>
                </div>
              )}
              {recommendation === "REVIEW" && (
                <div className="px-3 py-1 rounded-md text-xs font-mono font-bold border tracking-wider flex items-center space-x-2 bg-amber-900/60 border-amber-600 text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>REVIEW (31-60)</span>
                </div>
              )}
              {recommendation === "QUARANTINE" && (
                <div className="px-3 py-1 rounded-md text-xs font-mono font-bold border tracking-wider flex items-center space-x-2 bg-rose-950/80 border-rose-600 text-rose-300">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>QUARANTINE (61-100)</span>
                </div>
              )}
              {onOpenRiskEngine && (
                <button
                  onClick={onOpenRiskEngine}
                  className="px-2.5 py-1 rounded text-xs font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/60 transition-colors"
                >
                  Configure Weights & Evidence &rarr;
                </button>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-2 max-w-md">
              {recommendation === "ACCEPT"
                ? "Cryptographic and behavioral integrity verified within safe bounds across active domains."
                : recommendation === "QUARANTINE"
                ? "High-confidence integrity violation or severe anomaly detected. Asset quarantine recommended."
                : "Statistical anomalies, drift indicators, or duplicate images detected. Manual review advised."}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
          <div className="bg-slate-900/80 border border-slate-800/80 px-4 py-3 rounded-lg text-center min-w-[100px]">
            <span className="text-xl font-bold font-mono text-cyan-400 block">{totalScans}</span>
            <span className="text-[10px] text-slate-400 font-mono uppercase">Total Scans</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800/80 px-4 py-3 rounded-lg text-center min-w-[100px]">
            <span className="text-xl font-bold font-mono text-rose-400 block">{quarantinedCount}</span>
            <span className="text-[10px] text-slate-400 font-mono uppercase">Quarantined</span>
          </div>
        </div>
      </div>
    </div>
  );
}
