import pandas as pd
import numpy as np
from app.models.loader import load_lap_model, load_pit_model, load_race_data
from typing import Dict, Any, List

def optimize_strategy(req_data: Dict[str, Any]) -> Dict[str, Any]:
    lap_model = load_lap_model()
    race_data = load_race_data()
    LAP_FEATS = list(lap_model.feature_names_in_)

    year = req_data['year']
    race_name = req_data['race_name']
    snap_lap = req_data['snap_lap']

    race_df = race_data[(race_data["year"] == year) & (race_data["name"] == race_name)].copy()
    if len(race_df) == 0:
        raise ValueError(f"No data for race {race_name} in {year}")
    
    race_id = int(race_df["raceId"].iloc[0])
    
    max_race_lap = int(race_df["lap"].max())

    if "traffic_indicator" in race_df.columns and race_df["traffic_indicator"].dtype == "object":
        race_df["traffic_indicator"] = race_df["traffic_indicator"].map({"Clean Air": 0, "Traffic": 1}).fillna(0).astype(int)

    if "laps_since_last_pit" not in race_df.columns:
        def _lsp2(group):
            flags = group["made_pitstop"].to_numpy()
            cnt, res = 0, []
            for f in flags:
                res.append(cnt)
                cnt = 0 if f == 1 else cnt + 1
            return pd.Series(res, index=group.index)
        race_df = race_df.sort_values(["driverId", "lap"])
        race_df["laps_since_last_pit"] = race_df.groupby("driverId", group_keys=False).apply(_lsp2).astype(int)

    snap = race_df[race_df["lap"] == snap_lap].copy()
    if len(snap) == 0:
        snap = race_df[race_df["lap"] <= snap_lap].groupby("driverId").last().reset_index()

    driver_lookup = race_df[["driverId","driver_name"]].drop_duplicates().set_index("driverId")["driver_name"].to_dict()

    PIT_LOSS_MEAN = float(race_data["pit_loss"].replace(0, np.nan).mean() or 22.0)
    PIT_STD_LOSS = float(race_data["pit_loss"].replace(0, np.nan).std() or 2.0)

    def get_real_degradation(did, r_id, up_to_lap=None):
        drows = race_df[(race_df["driverId"] == did)].sort_values("lap")
        if up_to_lap: drows = drows[drows["lap"] <= up_to_lap]
        if "made_pitstop" in drows.columns and drows["made_pitstop"].sum() > 0:
            pit_laps = drows[drows["made_pitstop"] == 1]["lap"].tolist()
            stint_start = max(pit_laps, default=0) + 1
        else:
            stint_start = drows["lap"].min() if len(drows) > 0 else 1
            
        stint = drows[drows["lap"] >= stint_start]
        stint = stint[stint["lap"] > stint_start]
        if len(stint) < 4 or "lap_seconds" not in stint.columns:
            if stint_start > (drows["lap"].min() if len(drows) else 1):
                prior = drows[drows["lap"] < stint_start - 1]
                if "made_pitstop" in prior.columns and prior["made_pitstop"].sum() > 0:
                    prior_pits = prior[prior["made_pitstop"] == 1]["lap"].tolist()
                    prior_start = max(prior_pits[:-1], default=prior["lap"].min()) + 1 if len(prior_pits) > 1 else prior["lap"].min()
                else:
                    prior_start = prior["lap"].min() if len(prior) > 0 else None
                if prior_start is not None:
                    prior_stint = prior[(prior["lap"] >= prior_start) & (prior["lap"] > prior_start)]
                    if len(prior_stint) >= 4 and "lap_seconds" in prior_stint.columns:
                        xp, yp = prior_stint["lap"].to_numpy(dtype=float), prior_stint["lap_seconds"].to_numpy(dtype=float)
                        xp_mean, yp_mean = xp.mean(), yp.mean()
                        denom = ((xp - xp_mean) ** 2).sum()
                        if denom > 0: return float(max(0.02, min(0.35, ((xp - xp_mean) * (yp - yp_mean)).sum() / denom)))
            pos_guess = float(drows["position"].mean()) if "position" in drows.columns and len(drows) > 0 else 10.0
            return float(np.clip(0.05 + (pos_guess / 20) * 0.08 + (did % 7) * 0.008, 0.04, 0.18))

        q1, q3 = stint["lap_seconds"].quantile([0.25, 0.75])
        iqr = q3 - q1
        clean = stint[(stint["lap_seconds"] >= q1 - 1.5 * iqr) & (stint["lap_seconds"] <= q3 + 1.5 * iqr)]
        if len(clean) < 4: clean = stint
        x, y = clean["lap"].to_numpy(dtype=float), clean["lap_seconds"].to_numpy(dtype=float)
        x_mean, y_mean = x.mean(), y.mean()
        denom = ((x - x_mean) ** 2).sum()
        if denom == 0: return 0.08
        slope = ((x - x_mean) * (y - y_mean)).sum() / denom
        if slope < 0.005: slope = 0.005 + (did % 11) * 0.003
        return float(min(0.35, slope))

    def get_baseline_pace(did, r_id, up_to_lap=None):
        drows = race_df[(race_df["driverId"] == did)].sort_values("lap")
        if up_to_lap: drows = drows[drows["lap"] <= up_to_lap]
        if "made_pitstop" in drows.columns and drows["made_pitstop"].sum() > 0:
            pit_laps = drows[drows["made_pitstop"] == 1]["lap"].tolist()
            stint_start = max(pit_laps, default=0) + 1
        else:
            stint_start = drows["lap"].min() if len(drows) > 0 else 1
        stint = drows[(drows["lap"] >= stint_start) & (drows["lap"] > stint_start)]
        if len(stint) < 2 or "lap_seconds" not in stint.columns:
            full = race_df[race_df["driverId"] == did]
            if len(full) > 0 and "lap_seconds" in full.columns:
                return float(full["lap_seconds"].quantile(0.10))
            return 92.0
        return float(stint.head(3)["lap_seconds"].median())

    def simulate_remaining(driver_snap_row, pit_on_lap, seed=42):
        rng = np.random.default_rng(seed)
        did = driver_snap_row["driverId"]
        tyre_age = int(driver_snap_row.get("laps_since_last_pit", 10))
        base_pace = get_baseline_pace(did, race_id, up_to_lap=snap_lap)
        deg_rate = get_real_degradation(did, race_id, up_to_lap=snap_lap)

        post_pit_base_pace = base_pace - 1.0
        post_pit_deg_rate = max(0.025, deg_rate * 0.6)

        total_time = 0.0
        laps_since = tyre_age
        has_pitted = False

        future_laps = race_df[(race_df["driverId"] == did) & (race_df["lap"] >= snap_lap)].sort_values("lap")
        if len(future_laps) == 0: return 0.0

        for _, lap_row in future_laps.iterrows():
            lap_num = int(lap_row["lap"])
            made_pit, pit_loss = 0, 0.0
            if pit_on_lap and lap_num == pit_on_lap:
                made_pit = 1
                pit_loss = float(np.clip(rng.normal(PIT_LOSS_MEAN, PIT_STD_LOSS), 15, 35))
                laps_since, tyre_age, has_pitted = 0, 0, True
            
            active_base = post_pit_base_pace if has_pitted else base_pace
            active_deg = post_pit_deg_rate if has_pitted else deg_rate
            
            row_dict = lap_row.to_dict()
            row_dict.update({
                "position": driver_snap_row.get("position", lap_row.get("position", 10)),
                "overtake": 0, "made_pitstop": made_pit, "pitstop_seconds": pit_loss,
                "pit_loss": pit_loss, "laps_since_last_pit": laps_since, "lap_degradation": active_deg
            })
            age_factor = 1.0 + max(0, tyre_age - 15) * 0.08
            tyre_wear_cost = tyre_age * active_deg * age_factor
            row_dict["rolling_avg_pace"] = active_base + tyre_wear_cost
            
            df_r = pd.DataFrame([row_dict])
            for c in LAP_FEATS:
                if c not in df_r.columns: df_r[c] = 0
            df_r = df_r[LAP_FEATS].fillna(0)
            
            pred_t = float(lap_model.predict(df_r)[0])
            total_time += (pred_t + pit_loss + tyre_wear_cost)
            tyre_age += 1; laps_since += 1
            
        return total_time

    scenarios_def = [
        {"label": "Pit Now", "offset": 0}, {"label": "Pit in 3 laps", "offset": 3},
        {"label": "Pit in 6 laps", "offset": 6}, {"label": "Pit in 10 laps", "offset": 10},
        {"label": "No Further Pit", "offset": None}
    ]

    all_results = []
    for _, drow in snap.iterrows():
        did = drow["driverId"]
        dname = driver_lookup.get(did, str(did))
        cur_pos = int(drow.get("position", 99))

        best_time = float("inf")
        best_label = "No Further Pit"
        best_pit_lap = None
        no_pit_time = None
        scenario_times = {}

        for sc in scenarios_def:
            pit_lap = None if sc["offset"] is None else snap_lap + sc["offset"]
            if pit_lap and pit_lap > max_race_lap: continue
            
            t = simulate_remaining(drow, pit_lap)
            scenario_times[sc["label"]] = round(t, 4)
            if sc["label"] == "No Further Pit": no_pit_time = t
            if t < best_time:
                best_time, best_label, best_pit_lap = t, sc["label"], pit_lap

        time_gain = round((no_pit_time - best_time), 1) if no_pit_time else 0.0
        
        # Format scenario_times as list of dicts with delta and is_best
        formatted_scenarios = []
        for sc_name, sc_time in scenario_times.items():
            formatted_scenarios.append({
                "scenario": sc_name,
                "time": sc_time,
                "delta": round(sc_time - best_time, 4),
                "is_best": (sc_name == best_label)
            })

        all_results.append({
            "driverId": did,
            "driver_name": dname,
            "current_position": cur_pos,
            "optimal_strategy": best_label,
            "optimal_pit_lap": int(best_pit_lap) if best_pit_lap else None,
            "time_gain_vs_stay_s": time_gain,
            "scenario_times": formatted_scenarios
        })

    results_df = pd.DataFrame(all_results)
    
    # Calculate proj_total correctly taking best time
    proj_totals = []
    for r in all_results:
        best_t = min([s["time"] for s in r["scenario_times"]])
        proj_totals.append(best_t)
    results_df["proj_total"] = proj_totals

    results_df["proj_position"] = results_df["proj_total"].rank().astype(int)
    results_df["position_gain"] = (results_df["current_position"] - results_df["proj_position"]).astype(int)

    final_res = []
    pit_now_count = 0
    stay_out_count = 0
    biggest_gainer = {"driver": None, "gain": 0}
    
    for _, r in results_df.sort_values("current_position").iterrows():
        if r["optimal_strategy"] == "Pit Now": pit_now_count += 1
        elif r["optimal_strategy"] == "No Further Pit": stay_out_count += 1
        
        pos_gain = int(r["position_gain"])
        if pos_gain > biggest_gainer["gain"]:
            biggest_gainer = {"driver": r["driver_name"], "gain": pos_gain}
            
        final_res.append({
            "driverId": r["driverId"],
            "driver_name": r["driver_name"],
            "current_position": int(r["current_position"]),
            "optimal_strategy": r["optimal_strategy"],
            "optimal_pit_lap": r["optimal_pit_lap"],
            "time_gain_vs_stay_s": float(r["time_gain_vs_stay_s"]),
            "position_gain": pos_gain,
            "scenario_times": r["scenario_times"]
        })

    avg_gain = float(results_df["time_gain_vs_stay_s"].mean()) if len(results_df) > 0 else 0.0

    return {
        "metrics": {
            "avg_gain": avg_gain,
            "pit_now_count": pit_now_count,
            "stay_out_count": stay_out_count,
            "biggest_gainer": biggest_gainer
        },
        "results": final_res
    }
