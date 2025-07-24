from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os, requests
from dotenv import load_dotenv

from main import advisory_service
from system_stats import get_stats

# ---------------- env -----------------
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))
OPENWX = os.getenv("OPENWEATHER_API_KEY")
if not OPENWX:
    raise RuntimeError("OPENWEATHER_API_KEY missing in backend/.env")

# -------------- FastAPI ---------------
app = FastAPI(title="ThermoSense API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- proxy weather -------------
@app.get("/weather")
def weather(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
):
    url = (
        "https://api.openweathermap.org/data/2.5/weather"
        f"?lat={lat}&lon={lon}&units=metric&appid={OPENWX}"
    )
    try:
        data = requests.get(url, timeout=5).json()
        # Return only essentials to the front‑end
        cleaned = {
            "name": data.get("name"),
            "temp": data["main"]["temp"],
            "condition": data["weather"][0]["main"],
        }
        return cleaned
    except Exception as e:
        raise HTTPException(status_code=502, detail="Weather service error")

# ---------- system stats --------------
@app.get("/system_stats")
def system_stats():
    return get_stats()

# ---------- advisory ------------------
class InputPayload(BaseModel):
    battery_temp: float
    ambient_temp: float
    device_state: str
    hour_of_day: int | None = None

@app.post("/advisory")
def advisory(payload: InputPayload):
    return advisory_service(payload.dict())

@app.get("/")
def root():
    return {"message": "ThermoSense API is running"}
