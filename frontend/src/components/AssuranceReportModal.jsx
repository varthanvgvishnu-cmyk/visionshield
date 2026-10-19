import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Download,
  Printer,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Database,
  Cpu,
  TrendingUp,
  Lock,
  CheckCircle2,
  HelpCircle,
  Hash,
  Clock,
  Layers
} from 'lucide-react';

const API_BASE = "";

export default function AssuranceReportModal({ isOpen, onClose, targetScanCode, demoScenarioKey }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      let url;
      if (demoScenarioKey) {
        url = `${API_BASE}/api/demo/report/${demoScenarioKey}`;
      } else if (targetScanCode) {
        url = `${API_BASE}/api/report/scan/${targetScanCode}`;
      } else {
        url = `${API_BASE}/api/report/latest`;
      }
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch assurance report");
      }
      const data = await res.json();
      setReport(data);
    } catch (err) {
      setError(err.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReport();
    }
  }, [isOpen, targetScanCode, demoScenarioKey]);

  const handleDownloadHtml = () => {
    const url = demoScenarioKey
      ? `${API_BASE}/api/demo/report/export/html/${demoScenarioKey}`
      : (targetScanCode
          ? `${API_BASE}/api/report/export/html?scan_code=${targetScanCode}`
          : `${API_BASE}/api/report/export/html`);
    window.open(url, "_blank");
  };

  const handlePrintPdf = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white">
      <div className="bg-[#0b101d] border border-slate-800 w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] print:max-h-none print:border-none print:shadow-none print:w-full print:bg-white print:text-black">
        {/* Modal Top Header (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-700/60 text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>VisionShield Master Assurance Report</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Feature 6
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                15-Point Multi-Domain CV Certification & Attestation Document
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadHtml}
              className="px-3 py-1.5 rounded-md text-xs font-mono font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition-colors flex items-center space-x-1.5 shadow cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Offline HTML</span>
            </button>
            <button
              onClick={handlePrintPdf}
              className="px-3 py-1.5 rounded-md text-xs font-mono font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors ml-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 print:overflow-visible print:p-4">
          {loading && (
            <div className="py-12 text-center text-slate-400 font-mono text-xs">
              Compiling multi-domain assurance records from SQLite vault...
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-300 font-mono text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {report && (
            <div className="space-y-6 text-xs font-sans print:text-black">
              {/* Report Header Title */}
              <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:border-b-2 print:border-black">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-extrabold tracking-tight text-white font-mono uppercase print:text-black">
                      {report.report_title}
                    </span>
                    {report.is_demo ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 border border-amber-500 text-amber-300 print:border-black print:text-black animate-pulse">
                        {report.demo_label || "DEMO DATA • SIMULATED"}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 border border-emerald-600 text-emerald-300 print:border-black print:text-black">
                        AIR-GAPPED AUDIT
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[11px] text-slate-400 space-y-0.5 mt-1 print:text-neutral-700">
                    <div>1. SCAN ID: <strong className="text-slate-200 print:text-black">{report.scan_id}</strong></div>
                    <div>2. TIMESTAMP: <strong className="text-slate-200 print:text-black">{report.timestamp_formatted}</strong> ({report.timestamp})</div>
                  </div>
                </div>
                <div className="text-right font-mono text-[11px] text-slate-400 print:text-neutral-700">
                  <span className="block text-[10px] text-slate-500 uppercase">Evaluation Engine</span>
                  <span className="text-slate-200 font-semibold print:text-black">VisionShield Core Assurance v1.0</span>
                </div>
              </div>

              {/* Sections 9, 10, 11: Recommendation & Overall Risk Banner */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                report.recommendation === "ACCEPT"
                  ? "bg-emerald-950/40 border-emerald-600/80"
                  : report.recommendation === "REVIEW"
                  ? "bg-amber-950/40 border-amber-600/80"
                  : "bg-rose-950/40 border-rose-600/80"
              } print:bg-neutral-100 print:border-2 print:border-black`}>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block print:text-neutral-700">
                    11. Final Assurance Recommendation
                  </span>
                  <div className="flex items-center space-x-2">
                    {report.recommendation === "ACCEPT" && <ShieldCheck className="w-6 h-6 text-emerald-400 print:text-black" />}
                    {report.recommendation === "REVIEW" && <AlertTriangle className="w-6 h-6 text-amber-400 print:text-black" />}
                    {report.recommendation === "QUARANTINE" && <ShieldAlert className="w-6 h-6 text-rose-400 print:text-black" />}
                    <span className={`text-2xl font-extrabold font-mono tracking-wider ${
                      report.recommendation === "ACCEPT" ? "text-emerald-300" : report.recommendation === "REVIEW" ? "text-amber-300" : "text-rose-300"
                    } print:text-black`}>
                      {report.recommendation}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 print:text-neutral-700">
                    10. Confidence Level: <strong className="text-slate-200 print:text-black">{Math.round(report.confidence * 100)}%</strong> (Empirically Calibrated)
                  </div>
                </div>

                <div className="text-left sm:text-right font-mono">
                  <span className="text-[10px] uppercase text-slate-400 block print:text-neutral-700">
                    9. Overall Risk Score
                  </span>
                  <span className="text-3xl font-extrabold text-white font-mono print:text-black">
                    {report.overall_risk_score}%
                  </span>
                  <span className="text-[10px] text-slate-400 block print:text-neutral-700">
                    Transparent 5-Domain Linear Model
                  </span>
                </div>
              </div>

              {/* Sections 3 & 4: Dataset Information & Findings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0e1626] border border-slate-800 rounded-xl p-4 space-y-2 print:bg-white print:border-neutral-300">
                  <div className="flex items-center space-x-2 text-cyan-400 font-mono font-bold text-xs uppercase border-b border-slate-800 pb-2 print:text-black">
                    <Database className="w-4 h-4" />
                    <span>3. Dataset Information</span>
                  </div>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-neutral-200">
                      <span className="text-slate-400 print:text-neutral-600">Target Artifact:</span>
                      <strong className="text-slate-200 print:text-black">{report.dataset_information.dataset_name}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-neutral-200">
                      <span className="text-slate-400 print:text-neutral-600">Total Images Inspected:</span>
                      <strong className="text-slate-200 print:text-black">{report.dataset_information.total_images}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-neutral-200">
                      <span className="text-slate-400 print:text-neutral-600">Valid Supported Images:</span>
                      <strong className="text-emerald-400 print:text-black">{report.dataset_information.valid_images}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-neutral-200">
                      <span className="text-slate-400 print:text-neutral-600">SHA-256 Checksum:</span>
                      <span className="text-slate-300 font-mono text-[10px] print:text-black truncate max-w-[180px]">
                        {report.dataset_information.sha256_dataset}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400 print:text-neutral-600">Resolution Standard:</span>
                      <span className="text-slate-300 print:text-black">{report.dataset_information.resolution_summary}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0e1626] border border-slate-800 rounded-xl p-4 space-y-2 print:bg-white print:border-neutral-300">
                  <div className="flex items-center space-x-2 text-cyan-400 font-mono font-bold text-xs uppercase border-b border-slate-800 pb-2 print:text-black">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>4. Dataset Findings</span>
                  </div>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-neutral-200">
                      <span className="text-slate-400 print:text-neutral-600">Exact SHA-256 Duplicates:</span>
                      <strong className={report.dataset_findings.duplicate_count > 0 ? "text-amber-400 print:text-black" : "text-emerald-400 print:text-black"}>
                        {report.dataset_findings.duplicate_count}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-neutral-200">
                      <span className="text-slate-400 print:text-neutral-600">Near-Duplicates (dHash):</span>
                      <strong className={report.dataset_findings.near_duplicate_count > 0 ? "text-amber-400 print:text-black" : "text-emerald-400 print:text-black"}>
                        {report.dataset_findings.near_duplicate_count}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-neutral-200">
                      <span className="text-slate-400 print:text-neutral-600">Statistical Outlier Anomalies:</span>
                      <strong className={report.dataset_findings.anomaly_count > 0 ? "text-rose-400 print:text-black" : "text-emerald-400 print:text-black"}>
                        {report.dataset_findings.anomaly_count}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-neutral-200">
                      <span className="text-slate-400 print:text-neutral-600">Dataset Domain Risk:</span>
                      <strong className="text-slate-200 print:text-black">{report.dataset_findings.dataset_risk_score}%</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400 print:text-neutral-600">Dataset Status:</span>
                      <span className="text-amber-300 font-bold print:text-black">{report.dataset_findings.recommendation}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sections 5 & 6: Model Architecture & Integrity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0e1626] border border-slate-800 rounded-xl p-4 space-y-2 print:bg-white print:border-neutral-300">
                  <div className="flex items-center space-x-2 text-emerald-400 font-mono font-bold text-xs uppercase border-b border-slate-800 pb-2 print:text-black">
                    <Cpu className="w-4 h-4" />
                    <span>5. Model Information</span>
                  </div>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-neutral-200">
                      <span className="text-slate-400 print:text-neutral-600">Model File:</span>
                      <strong className="text-slate-200 print:text-black">{report.model_information.model_name}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-neutral-200">
                      <span className="text-slate-400 print:text-neutral-600">Model Format:</span>
                      <strong className="text-slate-200 print:text-black">{report.model_information.model_format}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-neutral-200">
                      <span className="text-slate-400 print:text-neutral-600">Input Tensor:</span>
                      <span className="text-slate-300 text-[10px] print:text-black">{report.model_information.input_tensor}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-neutral-200">
                      <span className="text-slate-400 print:text-neutral-600">Output Tensor:</span>
                      <span className="text-slate-300 text-[10px] print:text-black">{report.model_information.output_tensor}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400 print:text-neutral-600">Code Execution Policy:</span>
                      <span className="text-emerald-400 font-bold print:text-black">AIR-GAPPED STATIC ONLY</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0e1626] border border-slate-800 rounded-xl p-4 space-y-2 print:bg-white print:border-neutral-300">
                  <div className="flex items-center space-x-2 text-emerald-400 font-mono font-bold text-xs uppercase border-b border-slate-800 pb-2 print:text-black">
                    <ShieldCheck className="w-4 h-4" />
                    <span>6. Model Integrity Result</span>
                  </div>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-neutral-200">
                      <span className="text-slate-400 print:text-neutral-600">Integrity Status:</span>
                      <strong className={report.model_integrity_result.integrity_status === "VERIFIED" ? "text-emerald-400 print:text-black" : "text-rose-400 print:text-black"}>
                        {report.model_integrity_result.integrity_status}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-neutral-200">
                      <span className="text-slate-400 print:text-neutral-600">Expected SHA-256:</span>
                      <span className="text-slate-300 text-[10px] print:text-black truncate max-w-[180px]">
                        {report.model_integrity_result.expected_hash}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-neutral-200">
                      <span className="text-slate-400 print:text-neutral-600">Received SHA-256:</span>
                      <span className="text-slate-300 text-[10px] print:text-black truncate max-w-[180px]">
                        {report.model_integrity_result.received_hash}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-neutral-200">
                      <span className="text-slate-400 print:text-neutral-600">Cryptographic Match:</span>
                      <strong className={report.model_integrity_result.hash_match ? "text-emerald-400 print:text-black" : "text-rose-400 print:text-black"}>
                        {String(report.model_integrity_result.hash_match)}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400 print:text-neutral-600">Model Recommendation:</span>
                      <strong className={report.model_integrity_result.recommendation === "ACCEPT" ? "text-emerald-300 print:text-black" : "text-rose-400 print:text-black"}>
                        {report.model_integrity_result.recommendation}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sections 7 & 8: Distribution Analysis & Inference Integrity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0e1626] border border-slate-800 rounded-xl p-4 space-y-2 print:bg-white print:border-neutral-300">
                  <div className="flex items-center space-x-2 text-amber-400 font-mono font-bold text-xs uppercase border-b border-slate-800 pb-2 print:text-black">
                    <TrendingUp className="w-4 h-4" />
                    <span>7. Distribution Shift Analysis</span>
                  </div>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-neutral-200">
                      <span className="text-slate-400 print:text-neutral-600">Distribution Shift Score:</span>
                      <strong className="text-amber-400 print:text-black">{report.distribution_analysis.distribution_shift_score}%</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-neutral-200">
                      <span className="text-slate-400 print:text-neutral-600">Divergent Features:</span>
                      <strong className="text-slate-200 print:text-black">{report.distribution_analysis.changed_features.join(", ") || "None (Stable)"}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-neutral-200">
                      <span className="text-slate-400 print:text-neutral-600">Evaluated Cohorts:</span>
                      <span className="text-slate-300 print:text-black">{report.distribution_analysis.reference_count} Ref vs {report.distribution_analysis.operational_count} Op</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-neutral-200">
                      <span className="text-slate-400 print:text-neutral-600">Latent Embedding Drift:</span>
                      <span className="text-purple-400 print:text-black font-bold">Cosine dist: {report.distribution_analysis.embedding_shift?.cosine_distance ?? 0.0}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400 print:text-neutral-600">Shift Status:</span>
                      <span className="text-amber-300 font-bold print:text-black">{report.distribution_analysis.shift_status}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0e1626] border border-slate-800 rounded-xl p-4 space-y-2 print:bg-white print:border-neutral-300">
                  <div className="flex items-center space-x-2 text-cyan-400 font-mono font-bold text-xs uppercase border-b border-slate-800 pb-2 print:text-black">
                    <Lock className="w-4 h-4" />
                    <span>8. Inference Record Integrity</span>
                  </div>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-neutral-200">
                      <span className="text-slate-400 print:text-neutral-600">Audit Chain Status:</span>
                      <strong className={report.inference_integrity.tampering_detected ? "text-rose-400 print:text-black" : "text-emerald-400 print:text-black"}>
                        {report.inference_integrity.chain_status}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-neutral-200">
                      <span className="text-slate-400 print:text-neutral-600">Total Chained Records:</span>
                      <strong className="text-slate-200 print:text-black">{report.inference_integrity.total_records}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-neutral-200">
                      <span className="text-slate-400 print:text-neutral-600">Verified Cryptographic Blocks:</span>
                      <strong className="text-emerald-400 print:text-black">{report.inference_integrity.verified_records}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-neutral-200">
                      <span className="text-slate-400 print:text-neutral-600">Replay Warning Count:</span>
                      <strong className={report.inference_integrity.replay_warnings_count > 0 ? "text-amber-400 print:text-black" : "text-emerald-400 print:text-black"}>
                        {report.inference_integrity.replay_warnings_count}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400 print:text-neutral-600">Hash Chaining Topology:</span>
                      <span className="text-cyan-300 text-[10px] print:text-black">INPUT &rarr; MODEL &rarr; CONFIG &rarr; OUTPUT</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 12: Evidence for Each Finding */}
              <div className="bg-[#0e1626] border border-slate-800 rounded-xl p-4 space-y-3 print:bg-white print:border-neutral-300">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold border-b border-slate-800 pb-2 print:text-black">
                  12. Structured Evidence for Assurance Findings
                </h4>
                <div className="space-y-2.5">
                  {report.evidence.map((ev, idx) => (
                    <div key={idx} className="bg-slate-950/70 border border-slate-800/90 rounded-lg p-3 space-y-1.5 print:bg-neutral-50 print:border-neutral-300">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-200 font-bold font-mono text-xs print:text-black">{ev.finding}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          ev.severity === "CRITICAL" || ev.severity === "HIGH"
                            ? "bg-rose-950/80 border-rose-600 text-rose-300 print:text-black"
                            : ev.severity === "MEDIUM"
                            ? "bg-amber-950/80 border-amber-600 text-amber-300 print:text-black"
                            : "bg-emerald-950/80 border-emerald-600 text-emerald-300 print:text-black"
                        }`}>
                          {ev.severity}
                        </span>
                      </div>
                      <p className="text-slate-300 font-sans text-xs print:text-neutral-800">{ev.evidence}</p>
                      <div className="text-[11px] text-slate-400 font-sans pt-1 border-t border-slate-900 print:border-neutral-200 print:text-neutral-600">
                        <strong className="text-amber-400/90 print:text-black font-mono">LIMITATION:</strong> {ev.limitation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sections 13, 14, 15: Limitations, Coverage, Audit Trail */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0e1626] border border-slate-800 rounded-xl p-4 space-y-2 print:bg-white print:border-neutral-300">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold border-b border-slate-800 pb-2 print:text-black">
                    13. Scope & Limitations
                  </h4>
                  <ul className="space-y-1.5 text-[11px] text-slate-400 font-sans list-disc list-inside print:text-neutral-700">
                    {report.limitations.map((lim, idx) => (
                      <li key={idx} className="leading-relaxed">{lim}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-[#0e1626] border border-slate-800 rounded-xl p-4 space-y-2 print:bg-white print:border-neutral-300">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold border-b border-slate-800 pb-2 print:text-black">
                    14 & 15. Coverage & Audit Trail Attestation
                  </h4>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-neutral-200">
                      <span className="text-slate-400 print:text-neutral-600">14. Coverage Completeness:</span>
                      <strong className="text-emerald-400 print:text-black">100% (5/5 Domains Active)</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-neutral-200">
                      <span className="text-slate-400 print:text-neutral-600">15. Audit Ledger DB:</span>
                      <span className="text-slate-300 print:text-black">{report.audit_trail_status.vault_database}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-neutral-200">
                      <span className="text-slate-400 print:text-neutral-600">Proof Hash:</span>
                      <span className="text-slate-400 text-[10px] print:text-black truncate max-w-[160px]">{report.audit_trail_status.transaction_hash}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400 print:text-neutral-600">Certified Operator:</span>
                      <strong className="text-slate-200 print:text-black">{report.audit_trail_status.operator}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer (Hidden on print) */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/50 flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md text-xs font-mono text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
