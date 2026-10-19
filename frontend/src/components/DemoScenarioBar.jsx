import React from 'react';
import { Presentation, ShieldCheck, AlertTriangle, ShieldAlert, RotateCcw, Sparkles } from 'lucide-react';

export default function DemoScenarioBar({
  activeScenarioKey,
  onSelectScenario,
  onExitDemo,
  isLoading
}) {
  const scenarios = [
    {
      key: 'trusted',
      name: 'Trusted System',
      subtitle: 'Scenario 1 - Normal Baseline',
      badge: 'ACCEPT',
      badgeClass: 'bg-emerald-950 text-emerald-300 border-emerald-600',
      activeBorder: 'border-emerald-500 shadow-emerald-950/40',
      icon: ShieldCheck,
      iconColor: 'text-emerald-400',
      description: 'Dataset normal - Model hash matches - Inference chain valid'
    },
    {
      key: 'review',
      name: 'Suspicious Dataset',
      subtitle: 'Scenario 2 - Operational Shift',
      badge: 'REVIEW',
      badgeClass: 'bg-amber-950 text-amber-300 border-amber-600',
      activeBorder: 'border-amber-500 shadow-amber-950/40',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      description: 'Some duplicates/anomalies - Model verified - Distribution shift detected'
    },
    {
      key: 'quarantine',
      name: 'Compromised Pipeline',
      subtitle: 'Scenario 3 - Active Attack',
      badge: 'QUARANTINE',
      badgeClass: 'bg-rose-950 text-rose-300 border-rose-600',
      activeBorder: 'border-rose-500 shadow-rose-950/40',
      icon: ShieldAlert,
      iconColor: 'text-rose-400',
      description: 'Suspicious anomalies - Model hash mismatch - Tampering detected'
    }
  ];

  return (
    <div className="bg-gradient-to-r from-[#0c1424] via-[#11192e] to-[#0c1424] border-2 border-cyan-500/40 rounded-xl p-4 shadow-2xl relative overflow-hidden transition-all duration-300">
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500 text-cyan-400 shadow-md">
            <Presentation className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold tracking-tight text-white flex items-center space-x-1.5">
                <span>HACKATHON DEMO MODE</span>
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider animate-pulse">
                DEMO DATA - SIMULATED
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Deterministic offline scenarios demonstrating multi-stage assurance transitions without cloud telemetry.
            </p>
          </div>
        </div>

        {activeScenarioKey && (
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <button
              onClick={onExitDemo}
              className="flex items-center space-x-1.5 px-3 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700 transition-colors cursor-pointer"
              title="Return to live air-gapped vault state"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Exit Demo Mode (Live Vault)</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          const isSelected = activeScenarioKey === sc.key;
          const cardClass = isSelected
            ? "bg-slate-900/90 border-2 " + sc.activeBorder + " shadow-lg scale-[1.01]"
            : "bg-slate-950/60 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/40";

          return (
            <button
              key={sc.key}
              onClick={() => onSelectScenario(sc.key)}
              disabled={isLoading}
              className={"text-left p-3.5 rounded-lg border transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden " + cardClass}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center space-x-2">
                    <Icon className={"w-4 h-4 " + sc.iconColor} />
                    <span className="font-bold text-xs text-white group-hover:text-cyan-300 transition-colors font-sans">
                      {sc.name}
                    </span>
                  </div>
                  <span className={"text-[10px] font-mono font-bold px-2 py-0.5 rounded border tracking-wider " + sc.badgeClass}>
                    {sc.badge}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 mb-2">
                  {sc.subtitle}
                </div>
                <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                  {sc.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>{isSelected ? "[ACTIVE SCENARIO]" : "Click to preview transition"}</span>
                <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-3 pt-2 text-center text-[10px] font-mono text-slate-400 border-t border-slate-800/60">
        <span>NOTICE: All scenario metrics, hashes, and charts are generated from deterministic local demo fixtures for presentation demonstration only.</span>
      </div>
    </div>
  );
}
