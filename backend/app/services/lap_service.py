import pandas as pd
import numpy as np
import shap
from app.models.loader import load_lap_model, load_race_data
from app.services.meta_data import get_driver_circuit_stats, get_era, CIRCUITS, GRID
from typing import Dict, Any, List

def predict_lap(req_data: Dict[str, Any]) -> Dict[str, Any]:
    lap_model = load_lap_model()
    race_data = load_race_data()
    LAP_FEATS = list(lap_model.feature_names_in_)

    year = req_data['year']
    circuit_id = req_data['circuit_id']
    constructor_id = req_data['constructor_id']
    driver_name = req_data['driver_name']
    lap_num = req_data['lap_num']
    position = req_data['position']
    grid_pos = req_data['grid_pos']
    quali_pos = req_data['quali_pos']
    tyre_age = req_data['tyre_age']
    traffic = req_data['traffic'] # 0 or 1
    made_pit = req_data['made_pit'] # 0 or 1

    # find base pace for circuit
    base_pace = 90.0
    for name, info in CIRCUITS.items():
        if info['id'] == circuit_id:
            base_pace = info['base_pace']
            break

    real_pace, real_deg = get_driver_circuit_stats(race_data, circuit_id, constructor_id, year)
    auto_pace = real_pace if real_pace else base_pace
    auto_deg = real_deg if real_deg else 0.065

    pit_loss_val = 22.5 if made_pit else 0.0
    adj_pace = auto_pace + tyre_age * auto_deg

    row = {
        "lap": lap_num,
        "position": position,
        "rolling_avg_pace": adj_pace,
        "lap_degradation": auto_deg,
        "pitstop_seconds": pit_loss_val,
        "made_pitstop": made_pit,
        "pit_loss": pit_loss_val,
        "qualifying_position": quali_pos,
        "quali_race_delta": quali_pos - grid_pos,
        "grid": grid_pos,
        "constructorId": constructor_id,
        "year": year,
        "season_era": get_era(year),
        "circuitId": circuit_id,
        "overtake": 1 if position < grid_pos else 0,
        "traffic_indicator": traffic,
        "laps_since_last_pit": tyre_age,
    }
    df_row = pd.DataFrame([row])
    for c in LAP_FEATS:
        if c not in df_row.columns:
            df_row[c] = 0
    df_row = df_row[LAP_FEATS].fillna(0)

    pred = float(lap_model.predict(df_row)[0])
    
    mins = int(pred // 60)
    secs = pred % 60
    fmt = f"{mins}:{secs:06.3f}" if mins > 0 else f"{secs:.3f}s"
    
    if pred < auto_pace:
        color = "#39d353" # GREEN
    elif pred < auto_pace + 3:
        color = "#ff8700" # AMBER
    else:
        color = "#e8002d" # RED
    
    # Calculate SHAP values
    explainer = shap.TreeExplainer(lap_model)
    shap_vals = explainer.shap_values(df_row)
    
    FEAT_LABELS = {
        "rolling_avg_pace": "Rolling avg pace",
        "lap_degradation": "Tyre degradation",
        "qualifying_position": "Qualifying position",
        "grid": "Grid position",
        "constructorId": "Team (constructor)",
        "circuitId": "Circuit",
        "laps_since_last_pit": "Laps on tyres",
        "traffic_indicator": "Traffic",
        "made_pitstop": "Pit stop this lap",
        "pit_loss": "Pit time loss",
        "position": "Current position",
        "lap": "Lap number",
        "season_era": "Season era",
        "overtake": "Overtook this lap",
        "quali_race_delta": "Grid vs quali delta",
        "year": "Season year",
    }
    
    shap_data = []
    for feat, val in zip(LAP_FEATS, shap_vals[0]):
        shap_data.append({
            "feature": feat, 
            "label": FEAT_LABELS.get(feat, feat),
            "value": float(val)
        })

    shap_data = sorted(shap_data, key=lambda x: abs(x["value"]), reverse=True)[:8]

    return {
        "predicted_lap_time": pred,
        "formatted_time": fmt,
        "color": color,
        "delta_vs_baseline": pred - auto_pace,
        "baseline_pace": auto_pace,
        "tyre_deg_loss": auto_deg * tyre_age,
        "auto_pace": auto_pace,
        "auto_deg": auto_deg,
        "adj_pace": adj_pace,
        "shap_values": shap_data
    }

def predict_lap_grid(req_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    # predict for all drivers on the grid using their respective team
    lap_model = load_lap_model()
    race_data = load_race_data()
    LAP_FEATS = list(lap_model.feature_names_in_)

    year = req_data['year']
    circuit_id = req_data['circuit_id']
    lap_num = req_data['lap_num']
    position = req_data['position']
    grid_pos = req_data['grid_pos']
    quali_pos = req_data['quali_pos']
    tyre_age = req_data['tyre_age']
    traffic = req_data['traffic']
    made_pit = req_data['made_pit']

    year_grid = GRID.get(year, {})
    all_preds = []

    pit_loss_val = 22.5 if made_pit else 0.0

    for team_name, t_info in year_grid.items():
        constructor_id = t_info["id"]
        real_pace, real_deg = get_driver_circuit_stats(race_data, circuit_id, constructor_id, year)
        
        base_pace = 90.0
        for name, info in CIRCUITS.items():
            if info['id'] == circuit_id:
                base_pace = info['base_pace']
                break
                
        auto_pace = real_pace if real_pace else base_pace
        auto_deg = real_deg if real_deg else 0.065
        adj_pace = auto_pace + tyre_age * auto_deg

        for driver_name in t_info["drivers"]:
            row = {
                "lap": lap_num,
                "position": position,
                "rolling_avg_pace": adj_pace,
                "lap_degradation": auto_deg,
                "pitstop_seconds": pit_loss_val,
                "made_pitstop": made_pit,
                "pit_loss": pit_loss_val,
                "qualifying_position": quali_pos,
                "quali_race_delta": quali_pos - grid_pos,
                "grid": grid_pos,
                "constructorId": constructor_id,
                "year": year,
                "season_era": get_era(year),
                "circuitId": circuit_id,
                "overtake": 1 if position < grid_pos else 0,
                "traffic_indicator": traffic,
                "laps_since_last_pit": tyre_age,
            }
            df2 = pd.DataFrame([row])
            for c in LAP_FEATS:
                if c not in df2.columns: df2[c] = 0
            df2 = df2[LAP_FEATS].fillna(0)
            p2 = float(lap_model.predict(df2)[0])
            all_preds.append({"driver": driver_name, "team": team_name, "predicted_lap_time": p2})

    return sorted(all_preds, key=lambda x: x["predicted_lap_time"])
