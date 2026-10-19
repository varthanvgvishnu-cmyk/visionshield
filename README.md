# VisionShield - Computer Vision Assurance Engine

VisionShield is an offline, model-agnostic assurance and security validation engine for Computer Vision pipelines.

## Core Features
1. **Dataset Assurance Scanner**: SHA-256 deduplication, perceptual dHash similarity, dimensions/luminance statistics, statistical anomaly detection.
2. **Model Integrity Assurance**: Offline trusted baseline model registry, candidate verification, safe metadata extraction (ONNX/TorchScript) without code execution.
3. **Inference Record Integrity**: Cryptographically chained records (`INPUT -> MODEL -> CONFIGURATION -> OUTPUT`), tamper-evident audit verification, replay detection.
4. **Unified Risk Engine**: Multi-domain transparent weighted scoring, configurable weights, strict 0-30/31-60/61-100 threshold mapping (`ACCEPT` / `REVIEW` / `QUARANTINE`), human-readable evidence objects with limitations.
5. **Basic Distribution Shift Analysis**: Reference vs. Operational dataset comparison across image metrics (brightness, dimensions, aspect ratio, file size), two-sample Kolmogorov-Smirnov test, and local ONNX embedding drift.
6. **Assurance Report Generation**: Master 15-section audit report with 1-click offline HTML export and print/PDF support.
7. **Hackathon Presentation Demo Mode**: Three deterministic offline presentation scenarios (`Trusted System`, `Suspicious Dataset`, `Compromised Pipeline`) with real-time UI state transitions.

## Tech Stack
- **Backend**: FastAPI, Python 3.11, SQLite, NumPy, Pillow, SciPy, ONNX
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons

## Quickstart

### Backend
```bash
cd backend
python -m venv .venv
# On Windows: .venv\Scripts\activate
pip install -r requirements.txt # or uv sync
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.
