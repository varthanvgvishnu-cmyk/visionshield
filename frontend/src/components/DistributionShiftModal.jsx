import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Cpu,
  Layers,
  BarChart2,
  HelpCircle,
  FileText,
  Upload,
  RefreshCw,
  Sun,
  Maximize2
} from 'lucide-react';

const API_BASE = "";

export default function DistributionShiftModal({ isOpen, onClose, onShiftEvaluated }) {
  const [loading, setLoading] = useState(false);
  const [shiftData, setShiftData] = useState(null);
  const [error, setError] = useState(null);

  // File upload states
  const [refFile, setRefFile] = useState(null);
  const [opFile, setOpFile] = useState(null);

  const fetchLatest = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/shift/latest`);
      if (res.ok) {
        const data = await res.json();
        setShiftData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLatest();
    }
  }, [isOpen]);

  const handleRunSampleComparison = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/shift/sample`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Sample comparison failed");
      }
      const data = await res.json();
      setShiftData(data);
      if (onShiftEvaluated) onShiftEvaluated();
    } catch (err) {
      setError(err.message || "Failed to execute shift comparison");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadCompare = async () => {
    if (!refFile || !opFile) {
      setError("Please select both a Reference dataset file (ZIP) and an Operational dataset file (ZIP).");
      return;
    }

    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("ref_file", refFile);
    formData.append("op_file", opFile);

    try {
      const res = await fetch(`${API_BASE}/api/shift/analyze`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Shift analysis failed");
      }
      const data = await res.json();
      setShiftData(data);
      if (onShiftEvaluated) onShiftEvaluated();
    } catch (err) {
      setError(err.message || "Failed to compare custom datasets");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const score = shiftData ? shiftData.distribution_shift_score : 0;
  const changedFeatures = shiftData ? shiftData.changed_features : [];
  const comparisons = shiftData?.feature_comparisons || {};
  const embedding = shiftData?.embedding_shift;

  const getStatusBadge = (sc) => {
    if (sc > 60) {
      return (
        <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-rose-950/80 border border-rose-600 text-rose-300">
          SIGNIFICANT SHIFT ({sc}%)
        </span>
      );
    }
    if (sc > 30) {
      return (
        <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-amber-950/80 border border-amber-600 text-amber-300">
          MODERATE SHIFT ({sc}%)
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-950/80 border border-emerald-600 text-emerald-300">
        STABLE DISTRIBUTION ({sc}%)
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0b101d] border border-slate-800 w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-700/60 text-cyan-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Distribution Shift Analysis</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/50">
                  Feature 5
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Reference vs Operational Dataset divergence & local ONNX embedding drift
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {/* Action Bar */}
          <div className="bg-[#0e1626] border border-slate-800/90 rounded-lg p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                  Dataset Inputs & Comparison Control
                </h4>
                <p className="text-xs text-slate-400">
                  Compare historical baseline images against newly observed production frames.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRunSampleComparison}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-md text-xs font-mono font-medium bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400/40 transition-colors flex items-center space-x-1.5 shadow"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  <span>Run Sample (Day vs Night Shift)</span>
                </button>
              </div>
            </div>

            {/* Custom ZIP Uploads */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/60">
              <div className="bg-slate-900/60 border border-slate-800 rounded p-3 text-xs font-mono">
                <span className="text-slate-400 block mb-1.5 flex items-center space-x-1">
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Reference Baseline Dataset (ZIP)</span>
                </span>
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => setRefFile(e.target.files[0] || null)}
                  className="w-full text-xs text-slate-300 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-slate-800 file:text-cyan-300 hover:file:bg-slate-700 cursor-pointer"
                />
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded p-3 text-xs font-mono">
                <span className="text-slate-400 block mb-1.5 flex items-center space-x-1">
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Operational Production Dataset (ZIP)</span>
                </span>
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => setOpFile(e.target.files[0] || null)}
                  className="w-full text-xs text-slate-300 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-slate-800 file:text-emerald-300 hover:file:bg-slate-700 cursor-pointer"
                />
              </div>
            </div>

            {(refFile || opFile) && (
              <div className="flex justify-end">
                <button
                  onClick={handleUploadCompare}
                  disabled={loading}
                  className="px-4 py-1.5 rounded text-xs font-mono font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                >
                  Analyze Uploaded Cohorts
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-lg text-xs font-mono text-rose-300 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Metric Overview Hero */}
          {shiftData && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-[#0e1626] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-[11px] font-mono text-slate-400 uppercase">Distribution Shift Score</span>
                <div className="flex items-baseline space-x-2 my-2">
                  <span className="text-3xl font-extrabold font-mono text-white">{score}%</span>
                </div>
                {getStatusBadge(score)}
              </div>

              <div className="bg-[#0e1626] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-[11px] font-mono text-slate-400 uppercase">Changed Features</span>
                <div className="flex items-baseline space-x-2 my-2">
                  <span className="text-2xl font-bold font-mono text-amber-400">
                    {changedFeatures.length} / 5
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono truncate">
                  {changedFeatures.length > 0 ? changedFeatures.join(", ") : "None (All stable)"}
                </span>
              </div>

              <div className="bg-[#0e1626] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-[11px] font-mono text-slate-400 uppercase">Inspected Sample Cohort</span>
                <div className="flex items-baseline space-x-2 my-2">
                  <span className="text-2xl font-bold font-mono text-cyan-400">
                    {shiftData.reference_count} vs {shiftData.operational_count}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">Reference vs Operational frames</span>
              </div>

              <div className="bg-[#0e1626] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-[11px] font-mono text-slate-400 uppercase">Embedding Latent Drift</span>
                <div className="flex items-baseline space-x-2 my-2">
                  <span className="text-2xl font-bold font-mono text-purple-400">
                    {embedding ? (embedding.cosine_distance * 100).toFixed(2) : 0.0}%
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {embedding?.model_name || "Local ONNX Model"}
                </span>
              </div>
            </div>
          )}

          {/* Feature Distribution Table */}
          {shiftData && Object.keys(comparisons).length > 0 && (
            <div className="bg-[#0e1626] border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold mb-3 flex items-center space-x-2">
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                <span>Feature Distribution Comparison Matrix</span>
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/40">
                      <th className="py-2 px-3">Feature</th>
                      <th className="py-2 px-3">Reference (Mean ± Std)</th>
                      <th className="py-2 px-3">Operational (Mean ± Std)</th>
                      <th className="py-2 px-3">Relative Shift</th>
                      <th className="py-2 px-3">KS Statistic (p-val)</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {Object.entries(comparisons).map(([feat, stat]) => (
                      <tr key={feat} className="hover:bg-slate-900/30 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-200 capitalize">
                          {feat.replace("_", " ")}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {stat.reference.mean} <span className="text-slate-500">± {stat.reference.std}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {stat.operational.mean} <span className="text-slate-500">± {stat.operational.std}</span>
                        </td>
                        <td className={`py-2.5 px-3 font-bold ${stat.relative_change_pct < 0 ? "text-rose-400" : stat.relative_change_pct > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                          {stat.relative_change_pct > 0 ? `+${stat.relative_change_pct}%` : `${stat.relative_change_pct}%`}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {stat.ks_statistic} <span className="text-slate-600">(p={stat.p_value})</span>
                        </td>
                        <td className="py-2.5 px-3">
                          {stat.is_shifted ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 border border-amber-600/80 text-amber-300">
                              POTENTIAL SHIFT
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 border border-emerald-600/80 text-emerald-300">
                              STABLE
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Structured Human-Readable Evidence */}
          {shiftData && shiftData.evidence && shiftData.evidence.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center space-x-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Human-Readable Shift Evidence & Explanations</span>
              </h4>

              <div className="space-y-2">
                {shiftData.evidence.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg border bg-[#0e1626] border-slate-800 space-y-1.5 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-slate-200 font-bold flex items-center space-x-2">
                        <span>{item.finding}</span>
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        item.severity === "HIGH"
                          ? "bg-rose-950/80 border-rose-600 text-rose-300"
                          : item.severity === "MEDIUM"
                          ? "bg-amber-950/80 border-amber-600 text-amber-300"
                          : "bg-emerald-950/80 border-emerald-600 text-emerald-300"
                      }`}>
                        {item.severity}
                      </span>
                    </div>

                    <p className="text-slate-300 font-sans text-xs">{item.evidence}</p>

                    <div className="flex items-start space-x-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                      <span className="text-amber-400/90 font-bold uppercase text-[10px]">Limitation:</span>
                      <span className="font-sans">{item.limitation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explicit Non-Accusatory Caveat Alert */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-400 flex items-start space-x-2">
            <HelpCircle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-slate-300 font-semibold block">Distribution Shift Assurance Protocol</span>
              <p className="font-sans text-[11px] text-slate-400 leading-relaxed">
                Distribution shift measures covariate and environmental discrepancy between baseline training data and production deployments.
                Detection of distribution shift <strong>does not prove an attack or malicious poisoning</strong>. Real-world changes such as daylight cycles, lens contamination, and physical camera adjustments naturally produce statistical variance.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md text-xs font-mono text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}