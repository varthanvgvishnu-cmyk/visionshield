import React from 'react';
import { Database, ShieldCheck, Activity, TrendingUp, Eye } from 'lucide-react';

export default function Domains({
  datasetHealthLevel = 100,
  modelIntegrityLevel = 95,
  inferenceIntegrityLevel = 98,
  behaviourAssuranceLevel = 90,
  distributionAssuranceLevel = 95,
  onOpenModelIntegrity,
  onOpenDatasetScan,
  onOpenInferenceChain,
  onOpenRiskEngine,
  onOpenDistributionShift
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
          Computer Vision Assurance Domains
        </h3>
        <span className="text-[10px] font-mono text-cyan-400">5/5 Modules Active</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Domain 1: Dataset Health */}
        <div
          onClick={onOpenDatasetScan}
          className="bg-[#0e1626] border border-cyan-500/40 rounded-xl p-5 hover:border-cyan-400 transition-all shadow-md flex flex-col justify-between group cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-medium">
                Dataset Health
              </span>
              <div className="p-2 rounded-lg bg-slate-900 border border-cyan-500/40 text-cyan-400 group-hover:scale-105 transition-transform">
                <Database className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2 my-2">
              <span className="text-2xl font-bold font-mono text-cyan-400">
                {datasetHealthLevel}%
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Assurance Level</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden my-3 border border-slate-800">
              <div
                className="h-full bg-cyan-500 transition-all duration-500"
                style={{ width: `${datasetHealthLevel}%` }}
              ></div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans line-clamp-2">
            SHA-256 deduplication, perceptual dHash similarity, and anomaly detection.
          </p>
        </div>

        {/* Domain 2: Model Integrity (FEATURE 2) */}
        <div
          onClick={onOpenModelIntegrity}
          className="bg-[#0e1626] border border-emerald-500/40 hover:border-emerald-400 rounded-xl p-5 transition-all shadow-md flex flex-col justify-between group cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-300 font-medium">
                Model Integrity
              </span>
              <div className="p-2 rounded-lg bg-slate-900 border border-emerald-500/40 text-emerald-400 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2 my-2">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {modelIntegrityLevel}%
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Assurance Level</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden my-3 border border-slate-800">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${modelIntegrityLevel}%` }}
              ></div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans line-clamp-2">
            SHA-256 baseline vault matching, safe static metadata, zero code execution.
          </p>
        </div>

        {/* Domain 3: Behaviour Analysis */}
        <div
          onClick={onOpenRiskEngine}
          className="bg-[#0e1626] border border-slate-800 hover:border-cyan-500/40 rounded-xl p-5 transition-all shadow-md flex flex-col justify-between group cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-medium">
                Behaviour Analysis
              </span>
              <div className="p-2 rounded-lg bg-slate-900 border border-emerald-500/30 text-cyan-400 group-hover:scale-105 transition-transform">
                <Activity className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2 my-2">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {behaviourAssuranceLevel}%
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Assurance Level</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden my-3 border border-slate-800">
              <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${behaviourAssuranceLevel}%` }}></div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans line-clamp-2">
            Anomaly confidence scoring, confusion matrix stability & confidence variance.
          </p>
        </div>

        {/* Domain 4: Distribution Shift */}
        <div
          onClick={onOpenDistributionShift || onOpenRiskEngine}
          className="bg-[#0e1626] border border-cyan-500/40 hover:border-cyan-400 rounded-xl p-5 transition-all shadow-md flex flex-col justify-between group cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-medium">
                Distribution Shift
              </span>
              <div className="p-2 rounded-lg bg-slate-900 border border-emerald-500/30 text-cyan-400 group-hover:scale-105 transition-transform">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2 my-2">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {distributionAssuranceLevel}%
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Assurance Level</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden my-3 border border-slate-800">
              <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${distributionAssuranceLevel}%` }}></div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans line-clamp-2">
            Covariance drift tracking comparing runtime batches against baseline train distributions.
          </p>
        </div>

        {/* Domain 5: Inference Integrity (FEATURE 3) */}
        <div
          onClick={onOpenInferenceChain}
          className="bg-[#0e1626] border border-cyan-500/40 hover:border-cyan-400 rounded-xl p-5 transition-all shadow-md flex flex-col justify-between group cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-medium">
                Inference Integrity
              </span>
              <div className="p-2 rounded-lg bg-slate-900 border border-cyan-500/40 text-cyan-400 group-hover:scale-105 transition-transform">
                <Eye className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2 my-2">
              <span className="text-2xl font-bold font-mono text-cyan-400">
                {inferenceIntegrityLevel}%
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Assurance Level</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden my-3 border border-slate-800">
              <div
                className="h-full bg-cyan-500 transition-all duration-500"
                style={{ width: `${inferenceIntegrityLevel}%` }}
              ></div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans line-clamp-2">
            SHA-256 tamper-evident hash chain: Input → Model → Configuration → Output.
          </p>
        </div>
      </div>
    </div>
  );
}
