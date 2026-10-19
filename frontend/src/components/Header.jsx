import React from 'react';
import { Shield, WifiOff, Server, Play } from 'lucide-react';

export default function Header({ apiOnline, onOpenScan }) {
  return (
    <header className="border-b border-slate-800 bg-[#0a0f1d]/90 backdrop-blur sticky top-0 z-40 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-lg shadow-cyan-950/50">
            <Shield className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-sans">
                Vision<span className="text-cyan-400">Shield</span>
              </h1>
              <span className="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-semibold">
                v1.0 Assurance Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Offline & Model-Agnostic CV Integrity Platform
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
            <WifiOff className="w-3.5 h-3.5 text-emerald-400" />
            <span>Air-Gapped / Offline</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping ml-1"></span>
          </div>

          <div
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md border text-xs font-mono ${
              apiOnline
                ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
                : "bg-amber-950/40 border-amber-800/60 text-amber-300"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>{apiOnline ? "Local API Active" : "Connecting API..."}</span>
          </div>

          <button
            onClick={onOpenScan}
            className="flex items-center space-x-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs px-4 py-2 rounded-md shadow-lg shadow-cyan-950/50 transition-all border border-cyan-400/30 active:scale-95 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run New Scan</span>
          </button>
        </div>
      </div>
    </header>
  );
}
