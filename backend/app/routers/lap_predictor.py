from fastapi import APIRouter
from typing import Dict, Any, List
from app.services.lap_service import predict_lap, predict_lap_grid
from pydantic import BaseModel

router = APIRouter(prefix="/api/predict", tags=["Lap Predictor"])

class LapRequest(BaseModel):
    year: int
    circuit_id: int
    constructor_id: int
    driver_name: str
    lap_num: int
    position: int
    grid_pos: int
    quali_pos: int
    tyre_age: int
    traffic: int
    made_pit: int

class GridLapRequest(BaseModel):
    year: int
    circuit_id: int
    lap_num: int
    position: int
    grid_pos: int
    quali_pos: int
    tyre_age: int
    traffic: int
    made_pit: int

@router.post("/lap")
def get_lap_prediction(req: LapRequest):
    return predict_lap(req.dict())

@router.post("/lap/grid")
def get_grid_lap_prediction(req: GridLapRequest):
    return predict_lap_grid(req.dict())
