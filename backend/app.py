from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from main import advisory_service   # <-- import only the function

app = FastAPI(title="ThermoSense Advisory API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class InputPayload(BaseModel):
    battery_temp: float
    ambient_temp: float
    device_state: str

@app.post("/advisory")
def advisory(payload: InputPayload):
    return advisory_service(payload.dict())
