import React from 'react';
import {
  Database,
  X,
  Upload,
  FileImage,
  RefreshCw,
  Play,
  AlertCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

export default function ScanModal({
  isOpen,
  onClose,
  isScanning,
  scanResult,
  scanError,
  selectedFile,
  selectedFiles,
  onFileChange,
  onRunScan,
  onRunSampleScan,
  onResetResult
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0e1626] border border-cyan-500/40 rounded-xl max-w-3xl w-full p-6 shadow-2xl space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-sans">
                Dataset Assurance Scanner (Feature 1)
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Air-Gapped • SHA-256 Hashes • Perceptual dHash • Outlier Flags
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

        {/* Upload State */}
        {!scanResult && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl p-6 text-center transition-all bg-slate-950/50">
              <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-200 mb-1">
                Select Image Dataset (ZIP or Multiple Images)
              </p>
              <p className="text-[11px] text-slate-500 font-mono mb-4">
                Supports PNG, JPEG, WEBP, BMP, TIFF formats. Processed 100% offline.
              </p>

              <label className="inline-flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono px-4 py-2 rounded-md cursor-pointer transition-colors shadow">
                <FileImage className="w-3.5 h-3.5" />
                <span>Choose Dataset Files</span>
                <input
                  type="file"
                  multiple
                  accept=".zip,image/png,image/jpeg,image/webp,image/bmp,image/tiff"
                  onChange={onFileChange}
                  className="hidden"
                />
              </label>

              {(selectedFile || selectedFiles.length > 0) && (
                <div className="mt-4 p-3 bg-slate-900/80 rounded border border-slate-800 text-xs font-mono text-cyan-300">
                  Selected:{" "}
                  {selectedFile
                    ? `${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)`
                    : `${selectedFiles.length} image files selected`}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 p-3.5 rounded-lg">
              <div>
                <span className="text-xs font-semibold text-white block">
                  Quick Test with Built-in Offline Dataset
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Includes exact SHA-256 duplicate, perceptual near-duplicate, and luminance outlier.
                </span>
              </div>
              <button
                onClick={onRunSampleScan}
                disabled={isScanning}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-xs font-mono px-3.5 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer"
              >
                Load Test Dataset
              </button>
            </div>

            {scanError && (
              <div className="p-3 rounded bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{scanError}</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded text-xs font-mono text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={onRunScan}
                disabled={isScanning || (!selectedFile && selectedFiles.length === 0)}
                className="flex items-center space-x-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-medium text-xs px-5 py-2 rounded shadow transition-all cursor-pointer"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Scanning Dataset Offline...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Dataset Scan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Structured Results State */}
        {scanResult && (
          <div className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg text-center">
                <span className="text-[10px] text-slate-400 block uppercase">Total Images</span>
                <span className="text-xl font-bold text-white">{scanResult.total_images}</span>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg text-center">
                <span className="text-[10px] text-slate-400 block uppercase">Valid Images</span>
                <span className="text-xl font-bold text-emerald-400">{scanResult.valid_images}</span>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg text-center">
                <span className="text-[10px] text-slate-400 block uppercase">Exact Duplicates</span>
                <span
                  className={`text-xl font-bold ${
                    scanResult.duplicate_count > 0 ? "text-amber-400" : "text-slate-300"
                  }`}
                >
                  {scanResult.duplicate_count}
                </span>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg text-center">
                <span className="text-[10px] text-slate-400 block uppercase">Near Duplicates</span>
                <span
                  className={`text-xl font-bold ${
                    scanResult.near_duplicate_count > 0 ? "text-amber-400" : "text-slate-300"
                  }`}
                >
                  {scanResult.near_duplicate_count}
                </span>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg text-center">
                <span className="text-[10px] text-slate-400 block uppercase">Anomalies</span>
                <span
                  className={`text-xl font-bold ${
                    scanResult.anomaly_count > 0 ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {scanResult.anomaly_count}
                </span>
              </div>
            </div>

            {/* Risk Score & Recommendation Banner */}
            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <span className="text-2xl font-black font-mono text-cyan-400 block">
                    {scanResult.dataset_risk_score}%
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Risk Score</span>
                </div>
                <div className="border-l border-slate-800 pl-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-semibold text-white">Status:</span>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                        scanResult.overall_recommendation === "ACCEPT"
                          ? "bg-emerald-950 border-emerald-700 text-emerald-300"
                          : scanResult.overall_recommendation === "QUARANTINE"
                          ? "bg-rose-950 border-rose-700 text-rose-300"
                          : "bg-amber-950 border-amber-700 text-amber-300"
                      }`}
                    >
                      {scanResult.overall_recommendation === "REVIEW" ? "REVIEW REQUIRED" : scanResult.overall_recommendation}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    Confidence: {scanResult.confidence}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-mono text-slate-400 block">Audit Trail Code:</span>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {scanResult.audit_record?.scan_code || "VS-2026-LIVE"}
                </span>
              </div>
            </div>

            {/* Evidence Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center space-x-2">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>Assurance Evidence</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300 font-sans">
                {scanResult.evidence?.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start space-x-2 bg-slate-900/50 p-2 rounded border border-slate-800/60"
                  >
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Suspicious Samples Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Flagged Samples ({scanResult.suspicious_samples?.length || 0})
              </h4>
              <div className="overflow-x-auto max-h-52 border border-slate-800 rounded-lg">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">File</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Assurance Flags</th>
                      <th className="p-2.5">Dimensions</th>
                      <th className="p-2.5">Brightness</th>
                      <th className="p-2.5">Aspect Ratio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-950/60 text-slate-300">
                    {scanResult.suspicious_samples?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-500 font-sans">
                          No suspicious samples or anomalies flagged. All images accepted.
                        </td>
                      </tr>
                    ) : (
                      scanResult.suspicious_samples?.map((s, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/50">
                          <td className="p-2.5 font-semibold text-white max-w-[140px] truncate" title={s.filename}>
                            {s.filename}
                          </td>
                          <td className="p-2.5">
                            <span className="bg-amber-950/80 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded text-[10px]">
                              {s.status}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <div className="space-y-1">
                              {s.flags?.map((f, fIdx) => (
                                <span
                                  key={fIdx}
                                  className="block text-[10px] text-cyan-200 bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.5 rounded w-fit"
                                >
                                  {f}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-2.5 text-slate-400">
                            {s.statistics.width} x {s.statistics.height}
                          </td>
                          <td className="p-2.5 text-slate-400">{s.statistics.brightness}</td>
                          <td className="p-2.5 text-slate-400">{s.statistics.aspect_ratio}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Limitations Callout */}
            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-lg space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Assurance Limitations</span>
              </span>
              <ul className="text-[11px] text-slate-400 space-y-1 font-sans">
                {scanResult.limitations?.map((lim, idx) => (
                  <li key={idx}>• {lim}</li>
                ))}
              </ul>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
              <button
                onClick={onResetResult}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer"
              >
                ← Scan Another Dataset
              </button>
              <button
                onClick={onClose}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono px-4 py-2 rounded border border-slate-700 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
