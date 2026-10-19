import React from 'react';
import { FileCode, ShieldCheck, AlertTriangle, ShieldAlert, Hash, Clock, FileText } from 'lucide-react';

export default function RecentScans({ scans = [], onSelectScan }) {
  return (
    <div className="bg-[#0e1626] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
        <div className="flex items-center space-x-2">
          <FileCode className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white tracking-wide font-sans">
            Recent Assurance Scans
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
          Showing {scans.length} real scan{scans.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-sans">
          <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Scan Code</th>
              <th className="py-3 px-4">Target Artifact</th>
              <th className="py-3 px-4">Target Type</th>
              <th className="py-3 px-4">Risk Score</th>
              <th className="py-3 px-4">Recommendation</th>
              <th className="py-3 px-4">SHA-256 Checksum</th>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4 text-right">Report</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {scans.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 font-mono">
                  No scans performed yet. Click "+ Run Dataset Scan" to start your first offline scan.
                </td>
              </tr>
            ) : (
              scans.map((scan, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-cyan-400">
                    {scan.scan_code}
                  </td>
                  <td
                    className="py-3 px-4 font-medium text-white max-w-[200px] truncate"
                    title={scan.target_artifact}
                  >
                    {scan.target_artifact}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400 capitalize">
                    <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {scan.target_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold">
                    <span
                      className={
                        scan.risk_score >= 50
                          ? "text-rose-400"
                          : scan.risk_score > 0
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }
                    >
                      {scan.risk_score}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {scan.recommendation === "ACCEPT" && (
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold border bg-emerald-950/80 border-emerald-700/60 text-emerald-300">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>ACCEPT</span>
                      </span>
                    )}
                    {scan.recommendation === "REVIEW" && (
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold border bg-amber-950/80 border-amber-700/60 text-amber-300">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>REVIEW</span>
                      </span>
                    )}
                    {scan.recommendation === "QUARANTINE" && (
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold border bg-rose-950/80 border-rose-700/60 text-rose-300">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                        <span>QUARANTINE</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                    <span className="flex items-center space-x-1 font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 w-fit">
                      <Hash className="w-3 h-3 text-cyan-500/70" />
                      <span>{scan.sha256 ? `${scan.sha256.substring(0, 14)}...` : "N/A"}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{scan.time_formatted || "Just now"}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onSelectScan && onSelectScan(scan.scan_code)}
                      className="px-2.5 py-1 rounded text-[11px] font-mono text-cyan-400 hover:text-white bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-800/80 transition-colors inline-flex items-center space-x-1 cursor-pointer"
                      title="Generate Full Assurance Report"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Report</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
