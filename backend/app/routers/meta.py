from fastapi import APIRouter
from app.services.meta_data import CIRCUITS, GRID, COMPOUNDS
from app.models.loader import load_race_data
from pydantic import BaseModel
from typing import Dict, List, Any

router = APIRouter(prefix="/api/meta", tags=["Meta"])

@router.get("/circuits")
def get_circuits():
    return CIRCUITS

@router.get("/seasons")
def get_seasons():
    return list(GRID.keys())

@router.get("/grid/{year}")
def get_grid(year: int):
    return GRID.get(year, {})

@router.get("/races/{year}")
def get_races(year: int):
    df = load_race_data()
    races = df[df["year"] == year][["raceId", "name"]].drop_duplicates()
    return [{"id": int(r["raceId"]), "name": r["name"]} for _, r in races.iterrows()]

@router.get("/compounds")
def get_compounds():
    return COMPOUNDS
