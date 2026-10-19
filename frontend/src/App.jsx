import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Overview from './components/Overview';
import Domains from './components/Domains';
import RecentScans from './components/RecentScans';
import AuditTrail from './components/AuditTrail';
import ScanModal from './components/ScanModal';
import ModelIntegrityModal from './components/ModelIntegrityModal';
import InferenceChainModal from './components/InferenceChainModal';
import RiskEngineModal from './components/RiskEngineModal';
import DistributionShiftModal from './components/DistributionShiftModal';
import AssuranceReportModal from './components/AssuranceReportModal';
import DemoScenarioBar from './components/DemoScenarioBar';

const API_BASE = "";

export default function App() {
  const [apiOnline, setApiOnline] = useState(false);
  const [scans, setScans] = useState([]);
  const [activeScanModal, setActiveScanModal] = useState(false);
  const [activeModelModal, setActiveModelModal] = useState(false);
  const [activeInferenceModal, setActiveInferenceModal] = useState(false);
  const [activeRiskModal, setActiveRiskModal] = useState(false);
  const [activeShiftModal, setActiveShiftModal] = useState(false);
  const [activeReportModal, setActiveReportModal] = useState(false);
  const [targetScanCode, setTargetScanCode] = useState(null);

  // Demo Mode state for Hackathon presentation
  const [activeDemoScenario, setActiveDemoScenario] = useState(null); // 'trusted', 'review', 'quarantine' or null
  const [demoData, setDemoData] = useState(null);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  // Risk evaluation state from unified engine
  const [riskEvaluation, setRiskEvaluation] = useState(null);

  // Dataset scanner state
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);

  const refreshData = async () => {
    try {
      const healthRes = await fetch(`${API_BASE}/api/health`);
      if (healthRes.ok) {
        setApiOnline(true);
      } else {
        setApiOnline(false);
      }
    } catch {
      setApiOnline(false);
    }

    try {
      const scansRes = await fetch(`${API_BASE}/api/scans`);
      if (scansRes.ok) {
        const data = await scansRes.json();
        setScans(data);
      }
    } catch {
      // Backend not yet ready
    }

    try {
      const riskRes = await fetch(`${API_BASE}/api/risk/evaluate`);
      if (riskRes.ok) {
        const riskData = await riskRes.json();
        setRiskEvaluation(riskData);
      }
    } catch {
      // Backend risk engine
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      if (e.target.files.length === 1 && e.target.files[0].name.endsWith('.zip')) {
        setSelectedFile(e.target.files[0]);
        setSelectedFiles([]);
      } else {
        setSelectedFile(null);
        setSelectedFiles(Array.from(e.target.files));
      }
    }
  };

  const handleRunScan = async () => {
    setIsScanning(true);
    setScanError(null);
    setScanResult(null);

    const formData = new FormData();
    if (selectedFile) {
      formData.append("file", selectedFile);
    } else if (selectedFiles.length > 0) {
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });
    } else {
      setScanError("Please select a ZIP file or image files to scan.");
      setIsScanning(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/scan/dataset`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Scan request failed");
      }

      const result = await response.json();
      setScanResult(result);
      refreshData();
    } catch (err) {
      setScanError(err.message || "Failed to connect to local backend engine.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleRunSampleScan = async () => {
    setIsScanning(true);
    setScanError(null);
    setScanResult(null);

    try {
      const response = await fetch(`${API_BASE}/api/scan/sample`, {
        method: "POST",
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Sample scan failed");
      }

      const result = await response.json();
      setScanResult(result);
      refreshData();
    } catch (err) {
      setScanError(err.message || "Failed to execute sample scan.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectDemoScenario = async (scenarioKey) => {
    setIsDemoLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/demo/scenario/${scenarioKey}`);
      if (!res.ok) throw new Error("Failed to load demo scenario");
      const data = await res.json();
      setActiveDemoScenario(scenarioKey);
      setDemoData(data);
    } catch (err) {
      console.error("Demo scenario load error:", err);
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleExitDemo = () => {
    setActiveDemoScenario(null);
    setDemoData(null);
    refreshData();
  };

  const latestScan = scans.length > 0 ? scans[0] : null;

  // Determine active display metrics (Demo Mode overrides if active)
  const isDemoActive = Boolean(activeDemoScenario && demoData);

  const currentRiskScore = isDemoActive
    ? demoData.overall_risk
    : (riskEvaluation
        ? riskEvaluation.overall_risk
        : (scanResult ? scanResult.dataset_risk_score : (latestScan ? latestScan.risk_score : 0.0)));

  const currentRecommendation = isDemoActive
    ? demoData.recommendation
    : (riskEvaluation
        ? riskEvaluation.recommendation
        : (scanResult ? scanResult.overall_recommendation : (latestScan ? latestScan.recommendation : "ACCEPT")));

  const totalScansCount = isDemoActive ? 250 : scans.length;
  const quarantinedCount = isDemoActive
    ? (demoData.recommendation === "QUARANTINE" ? 1 : 0)
    : scans.filter((s) => s.recommendation === "QUARANTINE").length;

  // Derive domain assurance levels (100 - risk)
  const compScores = isDemoActive
    ? (demoData.component_scores || {})
    : (riskEvaluation?.component_scores || {});

  const datasetHealthLevel = compScores.dataset !== undefined ? Math.max(0, Math.round(100 - compScores.dataset)) : 100;
  const modelIntegrityLevel = compScores.model !== undefined ? Math.max(0, Math.round(100 - compScores.model)) : 100;
  const behaviourAssuranceLevel = compScores.behaviour !== undefined ? Math.max(0, Math.round(100 - compScores.behaviour)) : 90;
  const distributionAssuranceLevel = compScores.distribution !== undefined ? Math.max(0, Math.round(100 - compScores.distribution)) : 95;
  const inferenceIntegrityLevel = compScores.inference !== undefined ? Math.max(0, Math.round(100 - compScores.inference)) : 100;

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      <Header
        apiOnline={apiOnline}
        onOpenScan={() => {
          setActiveScanModal(true);
          setScanResult(null);
          setScanError(null);
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 space-y-6">
        {/* HACKATHON PRESENTATION DEMO MODE SELECTOR */}
        <DemoScenarioBar
          activeScenarioKey={activeDemoScenario}
          onSelectScenario={handleSelectDemoScenario}
          onExitDemo={handleExitDemo}
          isLoading={isDemoLoading}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Assurance Overview</span>
              <span className="text-xs font-mono font-normal text-slate-400">
                {isDemoActive ? `(Demo Scenario: ${demoData.name})` : "(Air-Gapped Local Vault)"}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {isDemoActive
                ? `${demoData.label} — ${demoData.description}`
                : "Offline computer-vision vulnerability assessment, checksum validation & drift tracking"}
            </p>
          </div>
          <div className="flex items-center flex-wrap gap-2 sm:gap-3">
            <button
              onClick={() => {
                setTargetScanCode(null);
                setActiveReportModal(true);
              }}
              className="bg-blue-950 hover:bg-blue-900 text-blue-300 text-xs font-mono px-3.5 py-1.5 rounded-md border border-blue-700/60 transition-colors shadow font-medium cursor-pointer flex items-center space-x-1"
            >
              <span>📄 Assurance Report</span>
            </button>
            <button
              onClick={() => setActiveRiskModal(true)}
              className="bg-purple-950 hover:bg-purple-900 text-purple-300 text-xs font-mono px-3.5 py-1.5 rounded-md border border-purple-700/60 transition-colors shadow font-medium cursor-pointer flex items-center space-x-1"
            >
              <span>⚖️ Unified Risk</span>
            </button>
            <button
              onClick={() => setActiveShiftModal(true)}
              className="bg-amber-950 hover:bg-amber-900 text-amber-300 text-xs font-mono px-3.5 py-1.5 rounded-md border border-amber-700/60 transition-colors shadow font-medium cursor-pointer flex items-center space-x-1"
            >
              <span>📊 Distribution Shift</span>
            </button>
            <button
              onClick={() => setActiveInferenceModal(true)}
              className="bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-xs font-mono px-3.5 py-1.5 rounded-md border border-cyan-700/60 transition-colors shadow font-medium cursor-pointer"
            >
              ⚡ Inference Chain
            </button>
            <button
              onClick={() => setActiveModelModal(true)}
              className="bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-xs font-mono px-3.5 py-1.5 rounded-md border border-emerald-700/60 transition-colors shadow font-medium cursor-pointer"
            >
              🛡 Model Integrity
            </button>
            <button
              onClick={() => {
                setActiveScanModal(true);
                setScanResult(null);
                setScanError(null);
              }}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono px-3.5 py-1.5 rounded-md border border-cyan-400/40 transition-colors shadow font-medium cursor-pointer"
            >
              + Run Dataset Scan
            </button>
            <button
              onClick={refreshData}
              className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono px-3 py-1.5 rounded-md border border-slate-800 transition-colors cursor-pointer"
            >
              <span>Refresh Vault</span>
            </button>
          </div>
        </div>

        <Overview
          riskScore={currentRiskScore}
          recommendation={currentRecommendation}
          totalScans={totalScansCount}
          quarantinedCount={quarantinedCount}
          onOpenRiskEngine={() => setActiveRiskModal(true)}
        />

        <Domains
          datasetHealthLevel={datasetHealthLevel}
          modelIntegrityLevel={modelIntegrityLevel}
          inferenceIntegrityLevel={inferenceIntegrityLevel}
          behaviourAssuranceLevel={behaviourAssuranceLevel}
          distributionAssuranceLevel={distributionAssuranceLevel}
          onOpenModelIntegrity={() => setActiveModelModal(true)}
          onOpenDatasetScan={() => {
            setActiveScanModal(true);
            setScanResult(null);
            setScanError(null);
          }}
          onOpenInferenceChain={() => setActiveInferenceModal(true)}
          onOpenRiskEngine={() => setActiveRiskModal(true)}
          onOpenDistributionShift={() => setActiveShiftModal(true)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentScans
              scans={isDemoActive ? [
                {
                  scan_code: `DEMO-${demoData.key.toUpperCase()}-01`,
                  target_artifact: demoData.dataset_health.dataset_name,
                  target_type: "dataset (DEMO)",
                  risk_score: demoData.dataset_health.dataset_risk_score,
                  recommendation: demoData.dataset_health.recommendation,
                  sha256: "demo_e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                  time_formatted: "Just now (DEMO)"
                },
                {
                  scan_code: `DEMO-${demoData.key.toUpperCase()}-02`,
                  target_artifact: demoData.model_integrity.model_name,
                  target_type: "model (DEMO)",
                  risk_score: demoData.model_integrity.risk_score,
                  recommendation: demoData.model_integrity.recommendation,
                  sha256: demoData.model_integrity.received_hash,
                  time_formatted: "Just now (DEMO)"
                }
              ] : scans}
              onSelectScan={(code) => {
                setTargetScanCode(code);
                setActiveReportModal(true);
              }}
            />
          </div>
          <div className="lg:col-span-1">
            <AuditTrail
              scans={isDemoActive ? [
                {
                  time_formatted: "Just now (DEMO)",
                  summary: `[DEMO DATA] ${demoData.name} - ${demoData.description}`,
                  sha256: demoData.model_integrity.received_hash,
                  operator: "DEMO_OPERATOR (SIMULATED)"
                }
              ] : scans}
            />
          </div>
        </div>
      </main>

      {/* Feature 1: Dataset Assurance Scanner Modal */}
      <ScanModal
        isOpen={activeScanModal}
        onClose={() => setActiveScanModal(false)}
        isScanning={isScanning}
        scanResult={scanResult}
        scanError={scanError}
        selectedFile={selectedFile}
        selectedFiles={selectedFiles}
        onFileChange={handleFileChange}
        onRunScan={handleRunScan}
        onRunSampleScan={handleRunSampleScan}
        onResetResult={() => setScanResult(null)}
      />

      {/* Feature 2: Model Integrity Assurance Modal */}
      <ModelIntegrityModal
        isOpen={activeModelModal}
        onClose={() => setActiveModelModal(false)}
        onVerificationComplete={refreshData}
      />

      {/* Feature 3: Inference Record Integrity Modal */}
      <InferenceChainModal
        isOpen={activeInferenceModal}
        onClose={() => setActiveInferenceModal(false)}
        onAuditComplete={refreshData}
      />

      {/* Feature 4: Unified Risk Engine Modal */}
      <RiskEngineModal
        isOpen={activeRiskModal}
        onClose={() => setActiveRiskModal(false)}
        onEvaluationUpdated={refreshData}
      />

      {/* Feature 5: Distribution Shift Modal */}
      <DistributionShiftModal
        isOpen={activeShiftModal}
        onClose={() => setActiveShiftModal(false)}
        onShiftEvaluated={refreshData}
      />

      {/* Feature 6: Assurance Report Modal */}
      <AssuranceReportModal
        isOpen={activeReportModal}
        onClose={() => {
          setActiveReportModal(false);
          setTargetScanCode(null);
        }}
        targetScanCode={targetScanCode}
        demoScenarioKey={activeDemoScenario}
      />

      <footer className="border-t border-slate-900 bg-[#060911] px-6 py-4 mt-auto text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>VisionShield Hackathon Edition • 100% Offline Capable</span>
          </div>
          <div>
            <span>Local Database: SQLite Vault • SHA-256 Assurance Enabled</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
