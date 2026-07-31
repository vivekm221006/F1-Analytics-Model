from fastapi import APIRouter
from typing import Dict, Any
from app.services.strategy_service import optimize_strategy
from pydantic import BaseModel

router = APIRouter(prefix="/api/strategy", tags=["Strategy Optimizer"])

class StrategyRequest(BaseModel):
    year: int
    race_name: str
    snap_lap: int

@router.post("/optimize")
def run_strategy_optimization(req: StrategyRequest):
    return optimize_strategy(req.dict())
