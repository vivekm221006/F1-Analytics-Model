from fastapi import APIRouter
from typing import Dict, Any
from app.services.race_service import simulate_race
from pydantic import BaseModel

router = APIRouter(prefix="/api/simulate", tags=["Race Simulator"])

class RaceSimRequest(BaseModel):
    year: int
    race_name: str

@router.post("/race")
def run_race_simulation(req: RaceSimRequest):
    return simulate_race(req.dict())
