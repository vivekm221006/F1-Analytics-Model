import pandas as pd
import numpy as np
from app.models.loader import load_lap_model, load_pit_model, load_race_data
from app.services.meta_data import CIRCUITS
from typing import Dict, Any

def simulate_race(req_data: Dict[str, Any]) -> Dict[str, Any]:
    lap_model = load_lap_model()
    pit_model = load_pit_model()
    race_data = load_race_data()
    
    LAP_FEATS = list(lap_model.feature_names_in_)
    PIT_FEATS = list(pit_model.feature_names_in_)

    year = req_data['year']
    race_name = req_data['race_name']
    
    # lookup raceId from year and race_name
    race_df = race_data[(race_data["year"] == year) & (race_data["name"] == race_name)].copy()
    if len(race_df) == 0:
        raise ValueError(f"No data for race {race_name} in {year}")
        
    race_df = race_df.sort_values(["driverId", "lap"]).reset_index(drop=True)

    if "traffic_indicator" in race_df.columns and race_df["traffic_indicator"].dtype == "object":
        race_df["traffic_indicator"] = (
            race_df["traffic_indicator"].map({"Clean Air": 0, "Traffic": 1}).fillna(0).astype(int)
        )

    if "laps_since_last_pit" not in race_df.columns:
        def _lsp(group):
            flags = group["made_pitstop"].to_numpy()
            cnt, res = 0, []
            for f in flags:
                res.append(cnt)
                cnt = 0 if f == 1 else cnt + 1
            return pd.Series(res, index=group.index)
        race_df["laps_since_last_pit"] = race_df.groupby("driverId", group_keys=False).apply(_lsp).astype(int)

    last_lap_per_driver = race_df.groupby("driverId").apply(lambda g: g.nlargest(1, "lap").iloc[0]).reset_index(drop=True)
    last_lap_per_driver = last_lap_per_driver.sort_values(["lap", "position"], ascending=[False, True]).reset_index(drop=True)
    last_lap_per_driver["actual_position"] = last_lap_per_driver.index + 1
    actual_result = last_lap_per_driver[["driverId", "driver_name", "actual_position"]]

    drivers_in_race = race_df[["driverId", "driver_name", "grid", "constructorId"]].drop_duplicates(subset="driverId").reset_index(drop=True)
    driver_lookup = drivers_in_race.set_index("driverId")["driver_name"].to_dict()
    
    max_lap = int(race_df["lap"].max())
    
    # Check for DNFs (did not finish 90% of max lap)
    lap_counts = race_df.groupby("driverId")["lap"].max()
    dnf_ids = lap_counts[lap_counts < (max_lap * 0.9)].index
    dnf_drivers = [driver_lookup[d] for d in dnf_ids]
    
    PIT_MEAN = float(race_df["pit_loss"].replace(0, np.nan).mean() or 22.0)
    PIT_STD = float(race_df["pit_loss"].replace(0, np.nan).std() or 2.0)

    cumulative_time = {did: 0.0 for did in drivers_in_race["driverId"]}
    lap_logs = []
    pos_history = {did: [] for did in drivers_in_race["driverId"]}

    for lap_number in range(1, max_lap + 1):
        cur = race_df[race_df["lap"] == lap_number].copy()
        if len(cur) == 0: continue

        if lap_number > 1:
            live_rank = pd.DataFrame(list(cumulative_time.items()), columns=["driverId", "cum_time"]).sort_values("cum_time").reset_index(drop=True)
            live_rank["live_pos"] = live_rank.index + 1
            cur = cur.merge(live_rank[["driverId", "live_pos"]], on="driverId", how="left")
            cur["position"] = cur["live_pos"].fillna(cur["position"])
            cur.drop(columns="live_pos", inplace=True)

        lap_X = cur[[c for c in LAP_FEATS if c in cur.columns]].copy()
        for c in LAP_FEATS:
            if c not in lap_X.columns: lap_X[c] = 0
        lap_X = lap_X[LAP_FEATS].fillna(0)
        cur["predicted_lap_time"] = lap_model.predict(lap_X)

        pit_X = cur[[c for c in PIT_FEATS if c in cur.columns]].copy()
        for c in PIT_FEATS:
            if c not in pit_X.columns: pit_X[c] = 0
        pit_X = pit_X[PIT_FEATS].fillna(0).astype(float)
        cur["pit_decision"] = pit_model.predict(pit_X)

        rng = np.random.default_rng(seed=lap_number)
        pit_penalty = np.where(cur["pit_decision"] == 1, np.clip(rng.normal(PIT_MEAN, PIT_STD, size=len(cur)), 15, 35), 0.0)
        cur["simulated_lap_time"] = cur["predicted_lap_time"] + pit_penalty

        for _, row in cur.iterrows():
            did = row["driverId"]
            if did in cumulative_time:
                cumulative_time[did] += row["simulated_lap_time"]
                pos_history[did].append(int(row["position"]))
                
        lap_logs.append(cur)

    lap_results = pd.concat(lap_logs, ignore_index=True)
    
    sim_final = pd.DataFrame(
        [(did, driver_lookup.get(did, str(did)), t) for did, t in cumulative_time.items()],
        columns=["driverId", "driver_name", "sim_position_raw"]
    ).sort_values("sim_position_raw").reset_index(drop=True)
    sim_final["simulated_position"] = sim_final.index + 1

    comp = actual_result.merge(sim_final[["driverId", "simulated_position"]], on="driverId", how="inner")
    comp["position_error"] = (comp["actual_position"] - comp["simulated_position"]).abs()
    comp = comp.sort_values("actual_position").reset_index(drop=True)

    pos_mae = float(comp["position_error"].mean())
    pos_rmse = float(np.sqrt((comp["position_error"] ** 2).mean()))
    exact = int((comp["position_error"] == 0).sum())
    within2 = int((comp["position_error"] <= 2).sum())

    pit_summary = lap_results.groupby("driverId")["pit_decision"].sum().reset_index()
    pit_summary = pit_summary.rename(columns={"pit_decision": "simulated_pit_stops"})
    
    results = []
    for _, row in comp.iterrows():
        did = row["driverId"]
        results.append({
            "driverId": did,
            "driver_name": row["driver_name"],
            "actual_position": int(row["actual_position"]),
            "simulated_position": int(row["simulated_position"]),
            "position_error": int(row["position_error"]),
            "simulated_pit_stops": int(pit_summary[pit_summary["driverId"] == did]["simulated_pit_stops"].iloc[0]),
            "pos_history": pos_history.get(did, [])
        })

    if pos_mae < 2.0: accuracy_grade = "Excellent"
    elif pos_mae < 3.5: accuracy_grade = "Good"
    elif pos_mae < 5.0: accuracy_grade = "Moderate"
    else: accuracy_grade = "Low"

    return {
        "metrics": {
            "pos_mae": pos_mae,
            "pos_rmse": pos_rmse,
            "exact": exact,
            "within2": within2,
            "accuracy_grade": accuracy_grade,
        },
        "dnf_drivers": dnf_drivers,
        "results": results
    }
