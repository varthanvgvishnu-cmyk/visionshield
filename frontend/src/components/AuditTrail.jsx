import React from 'react';
import { Lock, CheckCircle2, Hash, UserCheck } from 'lucide-react';

export default function AuditTrail({ scans = [] }) {
  return (
    <div className="bg-[#0e1626] border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Lock className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white tracking-wide font-sans">
            Cryptographic Audit Trail
          </h2>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/80 font-medium">
          SHA-256 Tamper-Proof
        </span>
      </div>

      <div className="space-y-3 overflow-y-auto max-h-[340px] pr-2">
        {scans.length === 0 ? (
          <p className="text-xs text-slate-500 font-mono text-center py-6">
            Audit trail is currently empty. Run a scan to append cryptographic proof.
          </p>
        ) : (
          scans.map((scan, idx) => (
            <div
              key={idx}
              className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-200 font-semibold uppercase">
                    DATASET_ASSURANCE_SCAN
                  </span>
                </div>
                <span className="text-slate-400">{scan.time_formatted}</span>
              </div>
              <p className="text-xs text-slate-300 font-sans my-1 font-medium">{scan.summary}</p>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2 pt-2 border-t border-slate-900">
                <div className="flex items-center space-x-1.5 truncate max-w-[240px]">
                  <Hash className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="truncate text-slate-400">{scan.sha256}</span>
                </div>
                <div className="flex items-center space-x-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800/60 text-slate-400">
                  <UserCheck className="w-3 h-3 text-cyan-400" />
                  <span>{scan.operator || "LOCAL_OPERATOR"}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
