import os
from pathlib import Path

# Paths to data on G: drive
G_DRIVE_BASE = Path(r"G:\PROJECTS\F1 BACKEND\F1 PROJECT")

MODEL_PATH = G_DRIVE_BASE / "models"
FEATURE_PATH = G_DRIVE_BASE / "data" / "features"
SIM_PATH = G_DRIVE_BASE / "simulation"
REPORT_PATH = G_DRIVE_BASE / "reports"

# Global Config
CORS_ORIGINS = ["http://localhost:3000"]
