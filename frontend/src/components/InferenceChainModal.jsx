import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  X,
  RefreshCw,
  Hash,
  AlertTriangle,
  Link,
  Layers,
  Clock,
  Play,
  Wrench,
  Flame,
  CheckCircle2,
  Copy,
  AlertCircle
} from 'lucide-react';

const API_BASE = "";

export default function InferenceChainModal({ isOpen, onClose, onAuditComplete }) {
  const [chainData, setChainData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);

  const fetchChainVerification = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/inference/verify`);
      if (res.ok) {
        const data = await res.json();
        setChainData(data);
        if (onAuditComplete) onAuditComplete();
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchChainVerification();
      setActionMsg(null);
    }
  }, [isOpen]);

  const handleSimulateTamper = async () => {
    setIsLoading(true);
    setActionMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/inference/tamper-test`, { method: "POST" });
      if (res.ok) {
        const d = await res.json();
        setActionMsg(`Adversarial mutation simulated on record: ${d.tampered_record_id}`);
        await fetchChainVerification();
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepairChain = async () => {
    setIsLoading(true);
    setActionMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/inference/repair`, { method: "POST" });
      if (res.ok) {
        setActionMsg("Tamper-evident chain re-linked and cryptographic hashes recalculated.");
        await fetchChainVerification();
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedMore = async () => {
    setIsLoading(true);
    setActionMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/inference/seed-sample`, { method: "POST" });
      if (res.ok) {
        setActionMsg("Appended 5 new chained camera inference transactions.");
        await fetchChainVerification();
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const isTampered = chainData?.chain_status === "TAMPERING DETECTED";
  const tamperedIds = new Set((chainData?.tampered_records || []).map((t) => t.record_id));
  const replayedIds = new Set((chainData?.replayed_records || []).map((r) => r.record_id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0e1626] border border-cyan-500/40 rounded-xl max-w-4xl w-full p-6 shadow-2xl space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Link className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-sans">
                Inference Record Integrity (Feature 3)
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Cryptographic Linkage: INPUT → MODEL → CONFIGURATION → OUTPUT
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Message */}
        {actionMsg && (
          <div className="p-3 rounded bg-cyan-950/40 border border-cyan-800/60 text-xs text-cyan-300 font-mono flex items-center space-x-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{actionMsg}</span>
          </div>
        )}

        {/* Chain Status Hero Banner */}
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            isTampered
              ? "bg-rose-950/60 border-rose-600 text-rose-300 animate-pulse"
              : "bg-emerald-950/50 border-emerald-700 text-emerald-300"
          }`}
        >
          <div className="flex items-center space-x-3">
            {isTampered ? (
              <ShieldAlert className="w-8 h-8 text-rose-400 shrink-0" />
            ) : (
              <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
            )}
            <div>
              <div className="flex items-center space-x-2 font-mono">
                <span className="text-base font-extrabold uppercase tracking-wide">
                  CHAIN STATUS: {chainData?.chain_status || "AUDITING..."}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 font-sans">
                {isTampered
                  ? "CRITICAL WARNING: Tampering detected! At least one inference record has been altered in the local vault."
                  : "All cryptographic links verified. Input, Model, Configuration, and Output hashes match unbroken sequence."}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchChainVerification}
              disabled={isLoading}
              className="flex items-center space-x-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 rounded text-xs font-mono text-slate-300 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Verify Chain</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg text-center">
            <span className="text-[10px] text-slate-400 block uppercase">Total Inference Records</span>
            <span className="text-xl font-bold text-white">{chainData?.total_records || 0}</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg text-center">
            <span className="text-[10px] text-slate-400 block uppercase">Verified Records</span>
            <span className="text-xl font-bold text-emerald-400">{chainData?.verified_records || 0}</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg text-center">
            <span className="text-[10px] text-slate-400 block uppercase">Tampered Records</span>
            <span
              className={`text-xl font-bold ${
                (chainData?.tampered_count || 0) > 0 ? "text-rose-400 font-extrabold" : "text-slate-400"
              }`}
            >
              {chainData?.tampered_count || 0}
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg text-center">
            <span className="text-[10px] text-slate-400 block uppercase">Replay Warnings</span>
            <span
              className={`text-xl font-bold ${
                (chainData?.replay_warnings || 0) > 0 ? "text-amber-400 font-extrabold" : "text-slate-400"
              }`}
            >
              {chainData?.replay_warnings || 0}
            </span>
          </div>
        </div>

        {/* Tamper Simulation & Seed Controls */}
        <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-semibold">Offline Test Controls:</span>
          </div>
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={handleSimulateTamper}
              disabled={isLoading}
              className="flex items-center space-x-1.5 bg-rose-950/70 hover:bg-rose-900 border border-rose-700/60 text-rose-300 px-3 py-1.5 rounded transition-colors cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Simulate Tampering Event</span>
            </button>
            <button
              onClick={handleRepairChain}
              disabled={isLoading}
              className="flex items-center space-x-1.5 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 px-3 py-1.5 rounded transition-colors cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5 text-emerald-400" />
              <span>Repair / Re-link Chain</span>
            </button>
            <button
              onClick={handleSeedMore}
              disabled={isLoading}
              className="flex items-center space-x-1.5 bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 px-3 py-1.5 rounded transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-cyan-400" />
              <span>+ Add 5 Inferences</span>
            </button>
          </div>
        </div>

        {/* Visual Hash Chain Ledger */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tamper-Evident SHA-256 Ledger (Record Blocks)</span>
            </h4>
            <span className="text-[10px] font-mono text-slate-500">
              Chaining: record_hash = SHA256(record_id || input || model || config || output || timestamp || prev_hash)
            </span>
          </div>

          <div className="overflow-x-auto max-h-72 border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="p-2.5">Block ID</th>
                  <th className="p-2.5">Input Hash</th>
                  <th className="p-2.5">Model Hash</th>
                  <th className="p-2.5">Config Hash</th>
                  <th className="p-2.5">Output Hash</th>
                  <th className="p-2.5">Previous Hash</th>
                  <th className="p-2.5">Record Hash</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-950/60 text-slate-300">
                {(!chainData?.records || chainData.records.length === 0) ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-500 font-sans">
                      No inference records in chain ledger yet.
                    </td>
                  </tr>
                ) : (
                  chainData.records.map((r, idx) => {
                    const isRecordTampered = tamperedIds.has(r.record_id);
                    const isRecordReplayed = replayedIds.has(r.record_id);

                    return (
                      <tr
                        key={idx}
                        className={`transition-colors ${
                          isRecordTampered
                            ? "bg-rose-950/40 text-rose-200"
                            : isRecordReplayed
                            ? "bg-amber-950/20 text-amber-200 hover:bg-slate-900/50"
                            : "hover:bg-slate-900/50"
                        }`}
                      >
                        <td className="p-2.5 font-bold text-cyan-400 whitespace-nowrap">
                          {r.record_id}
                        </td>
                        <td className="p-2.5 text-[10px] text-slate-400" title={r.input_hash}>
                          {r.input_hash.substring(0, 8)}...
                        </td>
                        <td className="p-2.5 text-[10px] text-slate-400" title={r.model_hash}>
                          {r.model_hash.substring(0, 8)}...
                        </td>
                        <td className="p-2.5 text-[10px] text-slate-400" title={r.configuration_hash}>
                          {r.configuration_hash.substring(0, 8)}...
                        </td>
                        <td className="p-2.5 text-[10px] text-slate-400" title={r.output_hash}>
                          {r.output_hash.substring(0, 8)}...
                        </td>
                        <td className="p-2.5 text-[10px] text-slate-500 font-mono" title={r.previous_record_hash}>
                          {r.previous_record_hash.substring(0, 8)}...
                        </td>
                        <td className="p-2.5 text-[10px] text-cyan-300 font-semibold" title={r.record_hash}>
                          {r.record_hash.substring(0, 10)}...
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          {isRecordTampered ? (
                            <span className="bg-rose-950 border border-rose-700 text-rose-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              TAMPERED
                            </span>
                          ) : isRecordReplayed ? (
                            <span className="bg-amber-950 border border-amber-700 text-amber-300 px-1.5 py-0.5 rounded text-[10px]">
                              REPLAY WARNING
                            </span>
                          ) : (
                            <span className="bg-emerald-950 border border-emerald-800 text-emerald-300 px-1.5 py-0.5 rounded text-[10px]">
                              VERIFIED
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <span className="text-xs font-mono text-slate-400">
            Local SHA-256 Audit Trail • Immutable Sequence Chain
          </span>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono px-4 py-2 rounded border border-slate-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
