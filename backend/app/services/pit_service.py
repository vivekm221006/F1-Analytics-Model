import pandas as pd
from app.models.loader import load_pit_model, load_race_data
from app.services.meta_data import get_driver_circuit_stats, CIRCUITS, COMPOUNDS
from typing import Dict, Any, List

def get_compounds():
    return COMPOUNDS

def predict_pit(req_data: Dict[str, Any]) -> Dict[str, Any]:
    pit_model = load_pit_model()
    race_data = load_race_data()
    PIT_FEATS = list(pit_model.feature_names_in_)

    year = req_data['year']
    circuit_id = req_data['circuit_id']
    constructor_id = req_data['constructor_id']
    compound_name = req_data['compound_name']
    lap = req_data['lap']
    position = req_data['position']
    tyre_age = req_data['tyre_age']
    traffic = req_data['traffic']
    grid_pos = req_data['grid_pos']
    quali_pos = req_data['quali_pos']
    overtake = req_data['overtake']

    pit_real_pace, pit_real_deg = get_driver_circuit_stats(race_data, circuit_id, constructor_id, year)
    
    base_pace = 90.0
    for name, info in CIRCUITS.items():
        if info['id'] == circuit_id:
            base_pace = info['base_pace']
            break
            
    roll_pace = pit_real_pace if pit_real_pace else base_pace
    base_deg = pit_real_deg if pit_real_deg else 0.065

    cmpd = COMPOUNDS.get(compound_name, COMPOUNDS["Medium"])
    deg_rate = base_deg * cmpd["deg_mult"]
    life_max = cmpd["max"]

    row = {
        "lap": lap,
        "position": position,
        "rolling_avg_pace": roll_pace + tyre_age * deg_rate,
        "lap_degradation": deg_rate,
        "traffic_indicator": traffic,
        "grid": grid_pos,
        "constructorId": constructor_id,
        "qualifying_position": quali_pos,
        "quali_race_delta": quali_pos - grid_pos,
        "overtake": overtake,
        "laps_since_last_pit": tyre_age,
    }
    df_row = pd.DataFrame([row])
    for c in PIT_FEATS:
        if c not in df_row.columns:
            df_row[c] = 0
    df_row = df_row[PIT_FEATS].fillna(0).astype(float)

    prob = float(pit_model.predict_proba(df_row)[0, 1])
    life_ratio = tyre_age / life_max
    tyre_urgency = min(1.0, life_ratio * 1.2)
    combined = min(1.0, 0.6 * (prob / 0.20) + 0.4 * tyre_urgency)

    pit_now_cond = (prob > 0.15 or life_ratio >= 1.0 or combined >= 0.85)
    monitor_cond = (prob > 0.07 or life_ratio >= 0.75 or combined >= 0.55)

    life_pct = min(100, int(tyre_age / life_max * 100))
    life_remain = max(0, life_max - tyre_age)

    if pit_now_cond:
        rec_label = "PIT NOW"
        if life_ratio >= 1.0:
            rec_reason = f"{compound_name} has exceeded its rated life ({tyre_age}/{life_max} laps). Box immediately."
        elif life_ratio >= 0.9:
            rec_reason = f"{compound_name} at {life_pct}% life — only ~{life_remain} laps remain. Pit this lap."
        else:
            rec_reason = f"Model pit probability {prob:.1%} above threshold. High strategic value to box."
    elif monitor_cond:
        rec_label = "MONITOR"
        rec_reason = f"{compound_name} at {life_pct}% life. Prepare for pit stop in ~{life_remain} laps."
    else:
        rec_label = "STAY OUT"
        rec_reason = f"Tyres in good condition ({life_pct}% used). Degradation penalty is acceptable."

    life_warning = int(life_max * 0.75)
    bar_clr = "#e8002d" if tyre_age >= life_max else "#ff5500" if tyre_age >= life_warning else "#ff8700" if tyre_age >= cmpd["min"] else "#39d353"

    return {
        "prob": prob,
        "recommendation": rec_label,
        "reason": rec_reason,
        "life_ratio": life_ratio,
        "life_pct": life_pct,
        "life_remain": life_remain,
        "combined_score": combined,
        "deg_rate": deg_rate,
        "pace_loss": tyre_age * deg_rate,
        "laps_remaining": life_remain,
        "tyre_life_bar_color": bar_clr
    }

def project_pit(req_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    # Project pit probability for next 10 laps
    pit_model = load_pit_model()
    race_data = load_race_data()
    PIT_FEATS = list(pit_model.feature_names_in_)

    year = req_data['year']
    circuit_id = req_data['circuit_id']
    constructor_id = req_data['constructor_id']
    compound_name = req_data['compound_name']
    lap = req_data['lap']
    position = req_data['position']
    tyre_age = req_data['tyre_age']
    traffic = req_data['traffic']
    grid_pos = req_data['grid_pos']
    quali_pos = req_data['quali_pos']
    overtake = req_data['overtake']

    pit_real_pace, pit_real_deg = get_driver_circuit_stats(race_data, circuit_id, constructor_id, year)
    
    base_pace = 90.0
    for name, info in CIRCUITS.items():
        if info['id'] == circuit_id:
            base_pace = info['base_pace']
            break
            
    roll_pace = pit_real_pace if pit_real_pace else base_pace
    base_deg = pit_real_deg if pit_real_deg else 0.065

    cmpd = COMPOUNDS.get(compound_name, COMPOUNDS["Medium"])
    deg_rate = base_deg * cmpd["deg_mult"]

    future_probs = []
    
    row = {
        "position": position,
        "traffic_indicator": traffic,
        "grid": grid_pos,
        "constructorId": constructor_id,
        "qualifying_position": quali_pos,
        "quali_race_delta": quali_pos - grid_pos,
        "overtake": overtake,
    }

    for future_lap in range(lap, min(lap + 11, 79)):
        age_f = tyre_age + (future_lap - lap)
        r2 = row.copy()
        r2["lap"] = future_lap
        r2["rolling_avg_pace"] = roll_pace + age_f * deg_rate
        r2["lap_degradation"] = deg_rate
        r2["laps_since_last_pit"] = age_f
        
        df2 = pd.DataFrame([r2])
        for c in PIT_FEATS:
            if c not in df2.columns: df2[c] = 0
        df2 = df2[PIT_FEATS].fillna(0).astype(float)
        p2 = float(pit_model.predict_proba(df2)[0, 1])
        
        life_ratio = age_f / cmpd["max"]
        urgency = min(1.0, life_ratio * 1.2)
        combined_val = min(1.0, 0.6 * (p2 / 0.20) + 0.4 * urgency)
        
        color = "#e8002d" if (p2 > 0.15 or life_ratio >= 1.0 or combined_val >= 0.85) else \
                "#ff8700" if (p2 > 0.07 or life_ratio >= 0.75 or combined_val >= 0.55) else "#39d353"

        future_probs.append({
            "lap": future_lap,
            "tyre_age": age_f,
            "prob": p2,
            "pace_loss": age_f * deg_rate,
            "urgency_color": color,
            "degradation_curve": p2 * 100
        })

    return future_probs

def compare_compounds(req_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    tyre_age = req_data['tyre_age']
    
    # We need year, circuit_id, constructor_id to get base deg, then we compare all
    race_data = load_race_data()
    pit_real_pace, pit_real_deg = get_driver_circuit_stats(race_data, req_data['circuit_id'], req_data['constructor_id'], req_data['year'])
    base_deg = pit_real_deg if pit_real_deg else 0.065
    
    comparisons = []
    for cmpd_name, cmpd in COMPOUNDS.items():
        deg_rate = base_deg * cmpd["deg_mult"]
        life_ratio = tyre_age / cmpd["max"]
        pace_lost = tyre_age * deg_rate
        
        status = "Critical" if tyre_age >= cmpd["max"] else "Monitor" if tyre_age >= cmpd["max"] * 0.75 else "Optimal"
        
        comparisons.append({
            "compound_name": cmpd_name,
            "life_ratio": life_ratio,
            "pace_lost": pace_lost,
            "status": status,
            "color": cmpd["color"],
            "icon": cmpd["icon"]
        })
    return comparisons
