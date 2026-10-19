import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  X,
  Upload,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Hash,
  Database,
  Info,
  Layers,
  Trash2
} from 'lucide-react';

const API_BASE = "";

export default function ModelIntegrityModal({ isOpen, onClose, onVerificationComplete }) {
  const [activeTab, setActiveTab] = useState("verify"); // "verify" | "register" | "list"
  const [trustedModels, setTrustedModels] = useState([]);
  const [selectedTrustedId, setSelectedTrustedId] = useState("");
  const [candidateFile, setCandidateFile] = useState(null);
  const [registerFile, setRegisterFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [registrationResult, setRegistrationResult] = useState(null);

  const fetchTrustedModels = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/models`);
      if (res.ok) {
        const data = await res.json();
        setTrustedModels(data);
        if (data.length > 0 && !selectedTrustedId) {
          setSelectedTrustedId(data[0].id.toString());
        }
      }
    } catch {}
  };

  useEffect(() => {
    if (isOpen) {
      fetchTrustedModels();
      setErrorMsg(null);
      setVerificationResult(null);
      setRegistrationResult(null);
    }
  }, [isOpen]);

  const handleRegisterModel = async () => {
    if (!registerFile) {
      setErrorMsg("Please select a model file (.onnx, .pt, .pth, .safetensors) to register.");
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append("file", registerFile);
      const res = await fetch(`${API_BASE}/api/models/register`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Registration failed");
      }
      const data = await res.json();
      setRegistrationResult(data);
      setRegisterFile(null);
      await fetchTrustedModels();
      setSelectedTrustedId(data.id.toString());
    } catch (err) {
      setErrorMsg(err.message || "Failed to register model.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyModel = async () => {
    if (!candidateFile) {
      setErrorMsg("Please select a candidate model file to verify.");
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    setVerificationResult(null);
    try {
      const formData = new FormData();
      formData.append("file", candidateFile);
      if (selectedTrustedId) {
        formData.append("trusted_id", selectedTrustedId);
      }
      const res = await fetch(`${API_BASE}/api/models/verify`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Verification failed");
      }
      const data = await res.json();
      setVerificationResult(data);
      if (onVerificationComplete) onVerificationComplete();
    } catch (err) {
      setErrorMsg(err.message || "Failed to verify model.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickTest = async (tampered) => {
    setIsLoading(true);
    setErrorMsg(null);
    setVerificationResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/models/verify-sample?tampered=${tampered}`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Quick test failed");
      }
      const data = await res.json();
      setVerificationResult(data);
      await fetchTrustedModels();
      if (onVerificationComplete) onVerificationComplete();
    } catch (err) {
      setErrorMsg(err.message || "Failed to execute sample test.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteModel = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/models/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchTrustedModels();
      }
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0e1626] border border-cyan-500/40 rounded-xl max-w-3xl w-full p-6 shadow-2xl space-y-6 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-sans">
                Model Integrity Assurance (Feature 2)
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                SHA-256 Vault Verification • Safe Metadata Extraction • Zero Code Execution
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

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 text-xs font-mono">
          <button
            onClick={() => { setActiveTab("verify"); setErrorMsg(null); }}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === "verify"
                ? "bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            1. Verify Candidate Model
          </button>
          <button
            onClick={() => { setActiveTab("register"); setErrorMsg(null); }}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === "register"
                ? "bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            2. Register Trusted Baseline
          </button>
          <button
            onClick={() => { setActiveTab("list"); setErrorMsg(null); }}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === "list"
                ? "bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            3. Trusted Registry ({trustedModels.length})
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center space-x-2 font-mono">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TAB 1: VERIFY CANDIDATE MODEL */}
        {activeTab === "verify" && !verificationResult && (
          <div className="space-y-5">
            {/* Baseline Selector */}
            <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800 space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block font-semibold">
                Select Trusted Reference Baseline:
              </label>
              {trustedModels.length === 0 ? (
                <p className="text-xs text-amber-400 font-mono">
                  No trusted models registered yet. Use Quick Test or switch to Tab 2 to register one.
                </p>
              ) : (
                <select
                  value={selectedTrustedId}
                  onChange={(e) => setSelectedTrustedId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono p-2 rounded focus:outline-none focus:border-cyan-500"
                >
                  {trustedModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.filename} ({m.format}) — SHA: {m.sha256.substring(0, 16)}...
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Candidate Model Upload Zone */}
            <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl p-6 text-center transition-all bg-slate-950/50">
              <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-200 mb-1">
                Upload Candidate Model for Cryptographic Verification
              </p>
              <p className="text-[11px] text-slate-500 font-mono mb-4">
                Supports ONNX, PyTorch (.pt, .pth), TorchScript, Safetensors. Safe static verification.
              </p>

              <label className="inline-flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono px-4 py-2 rounded-md cursor-pointer transition-colors shadow">
                <FileCode className="w-3.5 h-3.5" />
                <span>Choose Candidate Model</span>
                <input
                  type="file"
                  accept=".onnx,.pt,.pth,.safetensors,.bin,.tflite"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setCandidateFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </label>

              {candidateFile && (
                <div className="mt-4 p-3 bg-slate-900/80 rounded border border-slate-800 text-xs font-mono text-cyan-300">
                  Selected Candidate: {candidateFile.name} ({(candidateFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            {/* Quick Test Actions */}
            <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-white block">
                  Quick 1-Click Verification Test (Built-in ONNX Models)
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Test authentic baseline match (ACCEPT) or bit-tampered candidate (QUARANTINE).
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleQuickTest(false)}
                  disabled={isLoading}
                  className="bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-xs font-mono px-3 py-1.5 rounded transition-colors whitespace-nowrap cursor-pointer"
                >
                  Test Match (0% Risk)
                </button>
                <button
                  onClick={() => handleQuickTest(true)}
                  disabled={isLoading}
                  className="bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-300 text-xs font-mono px-3 py-1.5 rounded transition-colors whitespace-nowrap cursor-pointer"
                >
                  Test Tampered (Mismatch)
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button onClick={onClose} className="px-4 py-2 rounded text-xs font-mono text-slate-400 hover:text-white">
                Cancel
              </button>
              <button
                onClick={handleVerifyModel}
                disabled={isLoading || !candidateFile}
                className="flex items-center space-x-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-medium text-xs px-5 py-2 rounded shadow transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying Integrity Offline...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verify Model Hash</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* VERIFICATION RESULTS DISPLAY */}
        {verificationResult && (
          <div className="space-y-5">
            {/* Status & Recommendation Banner */}
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                verificationResult.hash_match
                  ? "bg-emerald-950/50 border-emerald-700/70 text-emerald-300"
                  : "bg-rose-950/50 border-rose-700/70 text-rose-300"
              }`}
            >
              <div className="flex items-center space-x-3">
                {verificationResult.hash_match ? (
                  <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
                ) : (
                  <ShieldAlert className="w-8 h-8 text-rose-400 shrink-0" />
                )}
                <div>
                  <div className="flex items-center space-x-2 font-mono">
                    <span className="text-base font-bold">
                      INTEGRITY STATUS: {verificationResult.integrity_status}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-bold border ${
                        verificationResult.hash_match
                          ? "bg-emerald-900 border-emerald-600 text-white"
                          : "bg-rose-900 border-rose-600 text-white"
                      }`}
                    >
                      {verificationResult.recommendation}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 font-sans">
                    {verificationResult.hash_match
                      ? "Cryptographic verification passed. Candidate model is identical to trusted baseline."
                      : "Cryptographic hash mismatch. Candidate model differs from reference baseline."}
                  </p>
                </div>
              </div>

              <div className="text-right font-mono shrink-0">
                <span className="text-[10px] uppercase text-slate-400 block">Risk Assessment</span>
                <span
                  className={`text-2xl font-black ${
                    verificationResult.risk_score > 0 ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {verificationResult.risk_score}%
                </span>
              </div>
            </div>

            {/* Cryptographic Hashes Comparison */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                <span className="text-slate-400 font-semibold flex items-center space-x-1.5">
                  <Hash className="w-3.5 h-3.5 text-cyan-400" />
                  <span>SHA-256 Hash Comparison</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    verificationResult.hash_match
                      ? "bg-emerald-950 border-emerald-800 text-emerald-300"
                      : "bg-rose-950 border-rose-800 text-rose-300"
                  }`}
                >
                  {verificationResult.hash_match ? "HASHES IDENTICAL" : "HASH MISMATCH"}
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">
                    Expected Reference Hash ({verificationResult.trusted_filename}):
                  </span>
                  <div className="bg-slate-900 p-2 rounded text-slate-300 break-all select-all border border-slate-800 mt-1">
                    {verificationResult.expected_hash}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">
                    Received Candidate Hash ({verificationResult.candidate_filename}):
                  </span>
                  <div
                    className={`p-2 rounded break-all select-all border mt-1 ${
                      verificationResult.hash_match
                        ? "bg-emerald-950/30 border-emerald-800/60 text-emerald-300"
                        : "bg-rose-950/30 border-rose-800/60 text-rose-300 font-semibold"
                    }`}
                  >
                    {verificationResult.received_hash}
                  </div>
                </div>
              </div>
            </div>

            {/* Safe Model Metadata Extracted */}
            {verificationResult.metadata && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <span className="text-xs font-mono font-semibold text-slate-400 flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Safe Static Metadata (Zero Code Execution)</span>
                  </span>
                  <span className="text-[10px] font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-cyan-400">
                    {verificationResult.model_format}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="bg-slate-900 p-2 rounded">
                    <span className="text-[10px] text-slate-400 block">File Size</span>
                    <span className="text-slate-200 font-semibold">
                      {(verificationResult.metadata.file_size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded">
                    <span className="text-[10px] text-slate-400 block">Graph Producer</span>
                    <span className="text-slate-200 font-semibold truncate block">
                      {verificationResult.metadata.producer_name || "N/A"}
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded">
                    <span className="text-[10px] text-slate-400 block">Inputs Count</span>
                    <span className="text-slate-200 font-semibold">
                      {verificationResult.metadata.inputs?.length || 0}
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded">
                    <span className="text-[10px] text-slate-400 block">Outputs Count</span>
                    <span className="text-slate-200 font-semibold">
                      {verificationResult.metadata.outputs?.length || 0}
                    </span>
                  </div>
                </div>

                {/* Inputs / Outputs detail */}
                {verificationResult.metadata.inputs?.length > 0 && (
                  <div className="space-y-1 text-xs font-mono">
                    <span className="text-[10px] text-slate-400 uppercase">Input Tensors:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {verificationResult.metadata.inputs.map((inp, idx) => (
                        <span key={idx} className="bg-slate-900 px-2 py-1 rounded border border-slate-800 text-slate-300 text-[11px]">
                          <span className="text-cyan-400 font-semibold">{inp.name}</span>: [{inp.shape?.join(", ")}] ({inp.type})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {verificationResult.metadata.outputs?.length > 0 && (
                  <div className="space-y-1 text-xs font-mono">
                    <span className="text-[10px] text-slate-400 uppercase">Output Tensors:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {verificationResult.metadata.outputs.map((out, idx) => (
                        <span key={idx} className="bg-slate-900 px-2 py-1 rounded border border-slate-800 text-slate-300 text-[11px]">
                          <span className="text-emerald-400 font-semibold">{out.name}</span>: [{out.shape?.join(", ")}] ({out.type})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Evidence List */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center space-x-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>Verification Evidence</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300 font-sans">
                {verificationResult.evidence?.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-2 bg-slate-900/50 p-2 rounded border border-slate-800/60">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Limitations */}
            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-lg space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Assurance Limitations</span>
              </span>
              <ul className="text-[11px] text-slate-400 space-y-1 font-sans">
                {verificationResult.limitations?.map((lim, idx) => (
                  <li key={idx}>• {lim}</li>
                ))}
              </ul>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
              <button
                onClick={() => setVerificationResult(null)}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer"
              >
                ← Verify Another Model
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

        {/* TAB 2: REGISTER TRUSTED BASELINE */}
        {activeTab === "register" && (
          <div className="space-y-5">
            <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl p-6 text-center transition-all bg-slate-950/50">
              <Database className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-200 mb-1">
                Register a New Trusted Model Baseline
              </p>
              <p className="text-[11px] text-slate-500 font-mono mb-4">
                Calculates and anchors tamper-proof SHA-256 in the local SQLite vault.
              </p>

              <label className="inline-flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono px-4 py-2 rounded-md cursor-pointer transition-colors shadow">
                <FileCode className="w-3.5 h-3.5" />
                <span>Select Trusted Model File</span>
                <input
                  type="file"
                  accept=".onnx,.pt,.pth,.safetensors,.bin,.tflite"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setRegisterFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </label>

              {registerFile && (
                <div className="mt-4 p-3 bg-slate-900/80 rounded border border-slate-800 text-xs font-mono text-cyan-300">
                  Ready to Register: {registerFile.name} ({(registerFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            {registrationResult && (
              <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-800/60 space-y-2 font-mono text-xs">
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Model Successfully Registered to Vault (ID: #{registrationResult.id})</span>
                </div>
                <div className="text-slate-300">
                  Filename: <span className="text-white font-bold">{registrationResult.filename}</span>
                </div>
                <div className="text-slate-300 break-all">
                  SHA-256: <span className="text-cyan-400">{registrationResult.sha256}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={handleRegisterModel}
                disabled={isLoading || !registerFile}
                className="flex items-center space-x-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-medium text-xs px-5 py-2 rounded shadow transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5" />
                    <span>Register to Vault</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: TRUSTED REGISTRY LIST */}
        {activeTab === "list" && (
          <div className="space-y-4 font-mono">
            <div className="overflow-x-auto max-h-80 border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">ID</th>
                    <th className="p-2.5">Model Filename</th>
                    <th className="p-2.5">Format</th>
                    <th className="p-2.5">Size</th>
                    <th className="p-2.5">SHA-256 Hash</th>
                    <th className="p-2.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-950/60 text-slate-300">
                  {trustedModels.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-500 font-sans">
                        No trusted models currently in registry.
                      </td>
                    </tr>
                  ) : (
                    trustedModels.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-900/40">
                        <td className="p-2.5 text-cyan-400 font-bold">#{m.id}</td>
                        <td className="p-2.5 font-semibold text-white max-w-[140px] truncate" title={m.filename}>
                          {m.filename}
                        </td>
                        <td className="p-2.5 text-slate-400">{m.format}</td>
                        <td className="p-2.5 text-slate-400">{(m.file_size / 1024).toFixed(1)} KB</td>
                        <td className="p-2.5 text-[10px] text-slate-400">
                          {m.sha256.substring(0, 16)}...
                        </td>
                        <td className="p-2.5">
                          <button
                            onClick={() => handleDeleteModel(m.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
