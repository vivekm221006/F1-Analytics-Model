# 🏎️ F1 AI Race Engineer

> An AI-powered Formula 1 race strategy platform trained on a decade of F1 telemetry data (2009–2024). Built with a FastAPI backend serving XGBoost ML models and a Next.js 14 frontend with a premium dark glassmorphism UI.

![F1 AI Race Engineer](https://img.shields.io/badge/F1-AI%20Race%20Engineer-00E5C9?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJMNCAyMGwyMC0xOHoiIGZpbGw9IiMwMEU1QzkiLz48L3N2Zz4=)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat-square&logo=next.js&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi&logoColor=white)
![XGBoost](https://img.shields.io/badge/XGBoost-ML-FF6F00?style=flat-square)

---

## 🧠 System Modules

| Module | Description |
|---|---|
| **Lap Time Predictor** | Predicts next-lap pace using 16 race-state features with SHAP explainability |
| **Pit Strategy Advisor** | Compound-aware pit window analysis using XGBoost probability + domain heuristics |
| **Race Simulator** | Full race distance projection against historical results with accuracy grading |
| **Strategy Optimizer** | Evaluates 5 pit scenarios per driver to surface the fastest path to the flag |
| **Analytics Dashboard** | Model performance metrics, confusion matrices, ROC curves, and SHAP analysis |

---

## 🏗️ Architecture

```
f1-race-engineer/
├── backend/                    # FastAPI + XGBoost ML backend
│   ├── run.py                  # Entry point (uvicorn server)
│   ├── requirements.txt
│   └── app/
│       ├── main.py             # FastAPI app with CORS
│       ├── config.py           # Data paths configuration
│       ├── models/
│       │   └── loader.py       # ML model & data loaders
│       ├── routers/            # API route handlers
│       │   ├── meta.py         # Circuits, seasons, grid, races
│       │   ├── lap_predictor.py
│       │   ├── pit_advisor.py
│       │   ├── race_simulator.py
│       │   ├── strategy.py
│       │   └── analytics.py
│       └── services/           # Business logic
│           ├── meta_data.py    # 30 circuits, 16-year grid, compounds
│           ├── lap_service.py
│           ├── pit_service.py
│           ├── race_service.py
│           ├── strategy_service.py
│           └── analytics_service.py
│
└── frontend/                   # Next.js 14 + Tailwind + Recharts
    ├── next.config.js          # API proxy to backend:8000
    ├── package.json
    └── src/
        ├── app/                # 5 feature pages + landing
        │   ├── page.tsx        # Landing page with WebGL scene
        │   ├── lap/page.tsx
        │   ├── pit/page.tsx
        │   ├── race/page.tsx
        │   ├── strategy/page.tsx
        │   └── analytics/page.tsx
        ├── components/         # Reusable UI components
        ├── lib/                # API client, design tokens, hooks
        └── styles/
```

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- Trained ML models and F1 dataset (configure path in `backend/app/config.py`)

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/f1-race-engineer.git
cd f1-race-engineer
```

### 2. Start the Backend
```bash
cd backend
pip install -r requirements.txt
python run.py
```
The API server starts at `http://localhost:8000`.

### 3. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
The UI launches at `http://localhost:3000`.

---

## 📊 Data & Models

This project requires pre-trained XGBoost models and processed F1 race data. Update the data path in [`backend/app/config.py`](backend/app/config.py):

```python
DATA_DIR = "G:\\PROJECTS\\F1 BACKEND\\F1 PROJECT"
```

### Required Files
| File | Purpose |
|---|---|
| `race_data.csv` | Historical race lap data (2009–2024) |
| `xgb_lap_model.pkl` | Lap time prediction model |
| `xgb_pit_model.pkl` | Pit stop classification model |
| `strategy_all_drivers.csv` | Pre-computed strategy analysis |

---

## 🎨 Design System

The frontend uses a custom dark glassmorphism design with:
- **Color palette**: Void black (`#05070E`), Cyan accent (`#00E5C9`), panel glass layers
- **Typography**: JetBrains Mono (data), Inter (UI text)
- **Animations**: GSAP-powered scroll reveals, WebGL Three.js telemetry scene
- **Charts**: Recharts for interactive data viz, Plotly.js for heatmaps

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Charts | Recharts, Plotly.js |
| 3D Scene | Three.js, React Three Fiber |
| Animation | GSAP |
| Backend | FastAPI, Uvicorn, Pydantic |
| ML | XGBoost, scikit-learn, SHAP |
| Data | Pandas, NumPy |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/meta/circuits` | All 30 F1 circuits with metadata |
| GET | `/api/meta/seasons` | Available seasons (2009–2024) |
| GET | `/api/meta/grid/{year}` | Teams and drivers for a season |
| GET | `/api/meta/races/{year}` | Grand Prix races for a season |
| GET | `/api/meta/compounds` | Tyre compound definitions |
| POST | `/api/predict/lap` | Predict lap time with SHAP |
| POST | `/api/predict/lap/grid` | Grid-wide lap predictions |
| POST | `/api/predict/pit` | Pit stop recommendation |
| POST | `/api/predict/pit/projection` | 10-lap pit probability projection |
| POST | `/api/predict/pit/compare` | All-compound comparison |
| POST | `/api/simulate/race` | Full race simulation |
| POST | `/api/strategy/optimize` | Grid strategy optimization |
| GET | `/api/analytics/lap-model` | Lap model performance metrics |
| GET | `/api/analytics/pit-model` | Pit model performance metrics |
| GET | `/api/analytics/shap` | SHAP importance values |

---

## 📄 License

This project is for educational and personal use.

---

<p align="center">
  Built with ❤️ and a lot of race data
</p>
