import joblib
import pandas as pd
from functools import lru_cache
from app.config import MODEL_PATH, FEATURE_PATH, SIM_PATH, REPORT_PATH

@lru_cache(maxsize=1)
def load_lap_model():
    return joblib.load(MODEL_PATH / "xgboost_model.pkl")

@lru_cache(maxsize=1)
def load_pit_model():
    return joblib.load(MODEL_PATH / "pit_strategy_xgb.pkl")

@lru_cache(maxsize=1)
def load_race_data():
    return pd.read_csv(FEATURE_PATH / "advanced_race_features.csv")

@lru_cache(maxsize=1)
def load_sim_results():
    f = SIM_PATH / "race_results" / "race_results.csv"
    return pd.read_csv(f) if f.exists() else None

@lru_cache(maxsize=1)
def load_lap_preds():
    f = SIM_PATH / "lap_predictions" / "lap_predictions.csv"
    return pd.read_csv(f) if f.exists() else None

@lru_cache(maxsize=1)
def load_strategy_df():
    f = REPORT_PATH / "strategy_all_drivers.csv"
    return pd.read_csv(f) if f.exists() else None

@lru_cache(maxsize=1)
def load_val_df():
    f = REPORT_PATH / "simulation_validation_report.csv"
    return pd.read_csv(f) if f.exists() else None
