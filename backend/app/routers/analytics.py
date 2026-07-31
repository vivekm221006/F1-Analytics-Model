from fastapi import APIRouter
from app.services.analytics_service import get_lap_model_metrics, get_lap_model_feature_importance, get_pit_model_metrics

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/lap/metrics")
def lap_metrics():
    return get_lap_model_metrics()

@router.get("/lap/importance")
def lap_importance():
    return get_lap_model_feature_importance()

@router.get("/pit/metrics")
def pit_metrics():
    return get_pit_model_metrics()

from app.services.analytics_service import get_strategy_chart_data, get_shap_values

@router.get("/strategy/chart")
def strategy_chart():
    return get_strategy_chart_data()

@router.get("/lap/shap")
def shap_data(sample_size: int = 100):
    return get_shap_values(sample_size)
