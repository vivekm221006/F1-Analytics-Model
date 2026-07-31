import pandas as pd
import numpy as np
import shap
from app.models.loader import load_lap_preds, load_pit_model, load_race_data, load_lap_model, load_strategy_df
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, confusion_matrix, roc_curve, auc, f1_score
from typing import Dict, Any, List
from typing import Dict, Any, List

def get_lap_model_metrics() -> Dict[str, Any]:
    lap_preds = load_lap_preds()
    if lap_preds is None:
        return {"error": "lap_predictions.csv not found"}
        
    preds = lap_preds.dropna(subset=["predicted_lap_time", "lap_seconds"]).copy()
    if "made_pitstop" in preds.columns:
        preds = preds[preds["made_pitstop"] == 0]
    q1, q99 = preds["lap_seconds"].quantile(0.01), preds["lap_seconds"].quantile(0.99)
    preds = preds[(preds["lap_seconds"] >= q1) & (preds["lap_seconds"] <= q99)]

    y_true = preds["lap_seconds"]
    y_pred = preds["predicted_lap_time"]
    
    sample = preds.sample(min(1000, len(preds)), random_state=42)
    scatter_data = []
    for _, row in sample.iterrows():
        scatter_data.append({
            "actual": float(row["lap_seconds"]),
            "predicted": float(row["predicted_lap_time"]),
            "residual": float(row["lap_seconds"] - row["predicted_lap_time"])
        })
        
    return {
        "r2": float(r2_score(y_true, y_pred)),
        "mae": float(mean_absolute_error(y_true, y_pred)),
        "rmse": float(np.sqrt(mean_squared_error(y_true, y_pred))),
        "bias": float((y_true - y_pred).mean()),
        "scatter_data": scatter_data
    }

def get_lap_model_feature_importance() -> List[Dict[str, Any]]:
    model = load_lap_model()
    imp = pd.DataFrame({"feature": model.feature_names_in_, "importance": model.feature_importances_})
    imp = imp.sort_values("importance", ascending=False).head(15)
    return imp.to_dict(orient="records")

def get_pit_model_metrics() -> Dict[str, Any]:
    pit_model = load_pit_model()
    race_data = load_race_data()
    PIT_FEATS = list(pit_model.feature_names_in_)
    
    pit_test = race_data[race_data["year"].isin([2022, 2023, 2024])].copy().dropna(subset=["made_pitstop"])

    if "traffic_indicator" in pit_test.columns and pit_test["traffic_indicator"].dtype == "object":
        pit_test["traffic_indicator"] = pit_test["traffic_indicator"].map({"Clean Air": 0, "Traffic": 1}).fillna(0).astype(int)

    if "laps_since_last_pit" not in pit_test.columns:
        def _lsp(group):
            flags = group["made_pitstop"].to_numpy()
            cnt, res = 0, []
            for f in flags:
                res.append(cnt)
                cnt = 0 if f == 1 else cnt + 1
            return pd.Series(res, index=group.index)
        pit_test = pit_test.sort_values(["raceId", "driverId", "lap"])
        pit_test["laps_since_last_pit"] = pit_test.groupby(["raceId", "driverId"], group_keys=False).apply(_lsp).astype(int)

    X_pit = pit_test[[c for c in PIT_FEATS if c in pit_test.columns]].fillna(0)
    for c in PIT_FEATS:
        if c not in X_pit.columns: X_pit[c] = 0
    X_pit = X_pit[PIT_FEATS]

    y_true_pit = pit_test["made_pitstop"].astype(int).values
    y_pred_pit = pit_model.predict(X_pit)
    y_prob_pit = pit_model.predict_proba(X_pit)[:, 1]
    
    fpr, tpr, _ = roc_curve(y_true_pit, y_prob_pit)
    roc_auc = auc(fpr, tpr)
    f1 = f1_score(y_true_pit, y_pred_pit)
    cm = confusion_matrix(y_true_pit, y_pred_pit)
    
    return {
        "roc_auc": float(roc_auc),
        "f1_score": float(f1),
        "confusion_matrix": cm.tolist(),
        "roc_curve": {
            "fpr": fpr[::5].tolist(), # downsample for payload size
            "tpr": tpr[::5].tolist()
        }
    }

def get_strategy_chart_data() -> Dict[str, Any]:
    df = load_strategy_df()
    if df is None:
        return {"error": "strategy_all_drivers.csv not found"}
        
    chart_data = df.to_dict(orient="records")
    return {"data": chart_data}

def get_shap_values(sample_size: int = 100) -> Dict[str, Any]:
    model = load_lap_model()
    race_data = load_race_data()
    LAP_FEATS = list(model.feature_names_in_)
    
    # get a sample of features
    df_sample = race_data.sample(min(sample_size, len(race_data)), random_state=42)
    df_sample = df_sample[[c for c in LAP_FEATS if c in df_sample.columns]].fillna(0)
    for c in LAP_FEATS:
        if c not in df_sample.columns: df_sample[c] = 0
    df_sample = df_sample[LAP_FEATS]
    
    explainer = shap.TreeExplainer(model)
    shap_vals = explainer.shap_values(df_sample)
    
    # average magnitude of SHAP values per feature
    mean_abs_shap = np.abs(shap_vals).mean(axis=0)
    
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
    
    summary = []
    for feat, val in zip(LAP_FEATS, mean_abs_shap):
        summary.append({
            "feature": feat,
            "label": FEAT_LABELS.get(feat, feat),
            "mean_abs_shap": float(val)
        })
        
    summary = sorted(summary, key=lambda x: x["mean_abs_shap"], reverse=True)
    
    return {"summary": summary}
