import React, { useState } from 'react';
import {
  Sliders,
  X,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Info,
  CheckCircle2,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';

const API_BASE = "";

const DEFAULT_WEIGHTS = {
  dataset: 20,
  model: 30,
  behaviour: 20,
  distribution: 10,
  inference: 20
};

export default function RiskEngineModal({
  isOpen,
  onClose,
  riskEvaluation,
  onRecalculate
}) {
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  if (!isOpen) return null;

  const data = riskEvaluation || {
    overall_risk: 0.0,
    confidence: 0.95,
    recommendation: "ACCEPT",
    component_scores: { dataset: 0, model: 0, behaviour: 10, distribution: 0, inference: 0 },
    weights: { dataset: 0.2, model: 0.3, behaviour: 0.2, distribution: 0.1, inference: 0.2 },
    weighted_contributions: { dataset: 0, model: 0, behaviour: 2, distribution: 0, inference: 0 },
    evidence: [],
    limitations: []
  };

  const handleSliderChange = async (key, val) => {
    const updated = { ...weights, [key]: Number(val) };
    setWeights(updated);
    if (onRecalculate) {
      // Convert to decimals (sum normalized on backend)
      const decimalWeights = {
        dataset: updated.dataset / 100,
        model: updated.model / 100,
        behaviour: updated.behaviour / 100,
        distribution: updated.distribution / 100,
        inference: updated.inference / 100
      };
      await onRecalculate(decimalWeights);
    }
  };

  const handleReset = async () => {
    setWeights(DEFAULT_WEIGHTS);
    if (onRecalculate) {
      await onRecalculate({
        dataset: 0.20,
        model: 0.30,
        behaviour: 0.20,
        distribution: 0.10,
        inference: 0.20
      });
    }
  };

  const handleSaveDefaults = async () => {
    setIsSaving(true);
    setSaveMsg(null);
    try {
      const decimalWeights = {
        dataset: weights.dataset / 100,
        model: weights.model / 100,
        behaviour: weights.behaviour / 100,
        distribution: weights.distribution / 100,
        inference: weights.inference / 100
      };
      const res = await fetch(`${API_BASE}/api/risk/weights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(decimalWeights)
      });
      if (res.ok) {
        setSaveMsg("Weights successfully anchored in local SQLite configuration.");
      }
    } catch {} finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0e1626] border border-cyan-500/40 rounded-xl max-w-4xl w-full p-6 shadow-2xl space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-sans">
                Unified Risk Engine (Feature 4)
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Multidimensional Weighted Scoring • Transparent Evidence Findings
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

        {saveMsg && (
          <div className="p-3 rounded bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 font-mono flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveMsg}</span>
          </div>
        )}

        {/* Overall Score Banner */}
        <div
          className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            data.recommendation === "QUARANTINE"
              ? "bg-rose-950/50 border-rose-600 text-rose-300"
              : data.recommendation === "REVIEW"
              ? "bg-amber-950/50 border-amber-600 text-amber-300"
              : "bg-emerald-950/50 border-emerald-600 text-emerald-300"
          }`}
        >
          <div className="flex items-center space-x-4">
            {data.recommendation === "QUARANTINE" ? (
              <ShieldAlert className="w-10 h-10 text-rose-400 shrink-0" />
            ) : data.recommendation === "REVIEW" ? (
              <AlertTriangle className="w-10 h-10 text-amber-400 shrink-0" />
            ) : (
              <ShieldCheck className="w-10 h-10 text-emerald-400 shrink-0" />
            )}
            <div>
              <div className="flex items-center space-x-2 font-mono">
                <span className="text-lg font-black uppercase tracking-wider">
                  RECOMMENDATION: {data.recommendation}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700 text-slate-300">
                  {data.recommendation === "ACCEPT" ? "0 - 30 Threshold" : data.recommendation === "REVIEW" ? "31 - 60 Threshold" : "61 - 100 Threshold"}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 font-sans">
                Weighted composite score across Dataset, Model, Behaviour, Distribution, and Inference integrity.
              </p>
            </div>
          </div>

          <div className="text-right font-mono shrink-0">
            <span className="text-[10px] uppercase text-slate-400 block">Overall Risk Score</span>
            <span
              className={`text-3xl font-black ${
                data.overall_risk >= 61
                  ? "text-rose-400"
                  : data.overall_risk >= 31
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`}
            >
              {data.overall_risk}%
            </span>
            <span className="text-[10px] text-slate-400 block">
              Confidence: {Math.round((data.confidence || 0.95) * 100)}%
            </span>
          </div>
        </div>

        {/* 5 Domain Sliders & Contributions */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <span className="text-slate-300 font-semibold flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
              <span>Configurable Domain Weights (Transparent Linear Scoring)</span>
            </span>
            <button
              onClick={handleReset}
              className="flex items-center space-x-1 text-slate-400 hover:text-white text-[11px]"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Defaults</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {/* Dataset */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-semibold">1. Dataset</span>
                <span className="text-cyan-400 font-bold">{weights.dataset}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weights.dataset}
                onChange={(e) => handleSliderChange("dataset", e.target.value)}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
                <span>Score: {data.component_scores.dataset}%</span>
                <span className="text-slate-300">Contrib: {data.weighted_contributions.dataset}%</span>
              </div>
            </div>

            {/* Model */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-semibold">2. Model</span>
                <span className="text-cyan-400 font-bold">{weights.model}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weights.model}
                onChange={(e) => handleSliderChange("model", e.target.value)}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
                <span>Score: {data.component_scores.model}%</span>
                <span className="text-slate-300">Contrib: {data.weighted_contributions.model}%</span>
              </div>
            </div>

            {/* Behaviour */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-semibold">3. Behaviour</span>
                <span className="text-cyan-400 font-bold">{weights.behaviour}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weights.behaviour}
                onChange={(e) => handleSliderChange("behaviour", e.target.value)}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
                <span>Score: {data.component_scores.behaviour}%</span>
                <span className="text-slate-300">Contrib: {data.weighted_contributions.behaviour}%</span>
              </div>
            </div>

            {/* Distribution */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-semibold">4. Drift</span>
                <span className="text-cyan-400 font-bold">{weights.distribution}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weights.distribution}
                onChange={(e) => handleSliderChange("distribution", e.target.value)}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
                <span>Score: {data.component_scores.distribution}%</span>
                <span className="text-slate-300">Contrib: {data.weighted_contributions.distribution}%</span>
              </div>
            </div>

            {/* Inference */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-semibold">5. Inference</span>
                <span className="text-cyan-400 font-bold">{weights.inference}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weights.inference}
                onChange={(e) => handleSliderChange("inference", e.target.value)}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
                <span>Score: {data.component_scores.inference}%</span>
                <span className="text-slate-300">Contrib: {data.weighted_contributions.inference}%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              onClick={handleSaveDefaults}
              disabled={isSaving}
              className="bg-slate-800 hover:bg-slate-700 text-cyan-300 px-3.5 py-1.5 rounded border border-slate-700 transition-colors cursor-pointer"
            >
              {isSaving ? "Saving..." : "Save as Default Config"}
            </button>
          </div>
        </div>

        {/* Structured Human-Readable Evidence Findings */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center space-x-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>Structured Risk Findings with Human-Readable Evidence</span>
          </h4>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {data.evidence?.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 space-y-2 text-xs font-mono"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{item.finding}</span>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        item.severity === "CRITICAL"
                          ? "bg-rose-950 border-rose-700 text-rose-300"
                          : item.severity === "HIGH"
                          ? "bg-rose-950/70 border-rose-800 text-rose-300"
                          : item.severity === "MEDIUM"
                          ? "bg-amber-950/70 border-amber-800 text-amber-300"
                          : "bg-emerald-950 border-emerald-800 text-emerald-300"
                      }`}
                    >
                      {item.severity}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Conf: {Math.round(item.confidence * 100)}%
                    </span>
                  </div>
                </div>

                <div className="text-slate-300 font-sans text-xs bg-slate-900/50 p-2 rounded border border-slate-800/80">
                  <span className="text-cyan-400 font-bold font-mono text-[11px] block mb-0.5">Evidence:</span>
                  {item.evidence}
                </div>

                <div className="text-[11px] text-slate-400 font-sans flex items-start space-x-1.5">
                  <span className="text-amber-400 font-bold font-mono">Limitation:</span>
                  <span>{item.limitation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global Limitations */}
        <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-lg space-y-1.5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center space-x-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Risk Engine Limitations</span>
          </span>
          <ul className="text-[11px] text-slate-400 space-y-1 font-sans">
            {data.limitations?.map((lim, idx) => (
              <li key={idx}>• {lim}</li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <span className="text-xs font-mono text-slate-400">
            Linear Weighting Engine • Deterministic Local Audit
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
