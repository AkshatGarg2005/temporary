from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from main import advisory_service
from system_stats import get_stats

app = FastAPI(title="ThermoSense API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------ NEW endpoint ------------------
@app.get("/system_stats")
def system_stats():
    """
    Returns:
    {
      battery_percent, charging, battery_temp (nullable),
      cpu_temp (nullable), cpu_load, mem_percent
    }
    """
    return get_stats()


# ------------------ existing advisory -------------
class InputPayload(BaseModel):
    battery_temp: float
    ambient_temp: float
    device_state: str  # charging|discharging|idle


@app.post("/advisory")
def advisory(payload: InputPayload):
    return advisory_service(payload.dict())


@app.get("/")
def root():
    return {"message": "ThermoSense API is running"}
