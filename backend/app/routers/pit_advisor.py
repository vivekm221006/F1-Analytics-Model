from fastapi import APIRouter
from typing import Dict, Any, List
from app.services.pit_service import predict_pit, project_pit, get_compounds
from pydantic import BaseModel

router = APIRouter(prefix="/api/predict", tags=["Pit Advisor"])

class PitRequest(BaseModel):
    year: int
    circuit_id: int
    constructor_id: int
    compound_name: str
    lap: int
    position: int
    tyre_age: int
    traffic: int
    grid_pos: int
    quali_pos: int
    overtake: int

@router.get("/pit/compounds")
def get_pit_compounds():
    return get_compounds()

@router.post("/pit")
def get_pit_recommendation(req: PitRequest):
    return predict_pit(req.dict())

@router.post("/pit/projection")
def get_pit_projection(req: PitRequest):
    return project_pit(req.dict())

from app.services.pit_service import compare_compounds

@router.post("/pit/compare")
def get_pit_compare(req: PitRequest):
    return compare_compounds(req.dict())
