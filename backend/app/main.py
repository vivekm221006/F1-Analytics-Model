from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import CORS_ORIGINS
from app.routers import meta, lap_predictor, pit_advisor, race_simulator, strategy, analytics

app = FastAPI(
    title="F1 Race Engineer API",
    description="Backend API for F1 AI Race Engineer Dashboard",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meta.router)
app.include_router(lap_predictor.router)
app.include_router(pit_advisor.router)
app.include_router(race_simulator.router)
app.include_router(strategy.router)
app.include_router(analytics.router)

@app.get("/")
def root():
    return {"message": "Welcome to F1 AI Race Engineer API. Visit /docs for Swagger UI."}
