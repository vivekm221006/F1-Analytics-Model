import os
from pathlib import Path

# Use environment variable DATA_DIR if set (for cloud deployment),
# otherwise fall back to the bundled data/ directory
_base = os.environ.get("DATA_DIR")
if _base:
    DATA_BASE = Path(_base)
else:
    DATA_BASE = Path(__file__).resolve().parent.parent / "data"

MODEL_PATH = DATA_BASE / "models"
FEATURE_PATH = DATA_BASE / "features"
SIM_PATH = DATA_BASE / "simulation"
REPORT_PATH = DATA_BASE / "reports"

# CORS — allow Vercel frontend + localhost dev
CORS_ORIGINS = [
    "http://localhost:3000",
    os.environ.get("FRONTEND_URL", ""),
    "*",  # Render will handle this
]
