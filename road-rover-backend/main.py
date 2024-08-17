from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Tuple

app = FastAPI()

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Sample road data
roads = [
    {
        "name": "Bucharest to Pitesti",
        "condition": "poor",
        "path": [
            [44.4268, 26.1025],
            [44.5622, 25.9701],
            [44.7478, 25.7066],
            [44.8563, 24.8690]
        ]
    },
    {
        "name": "Bucharest to Constanta",
        "condition": "good",
        "path": [
            [44.4268, 26.1025],
            [44.3628, 26.6178],
            [44.2642, 27.3348],
            [44.1733, 28.6383]
        ]
    }
]

# Model to receive accelerometer data
class AccelerometerData(BaseModel):
    timestamp: str
    acceleration: Tuple[float, float, float]  # (x, y, z)
    coordinates: Tuple[float, float]  # (latitude, longitude)

@app.get("/")
async def root():
    return {"message": "Welcome to the Road Rover API"}

@app.get("/api/roads")
async def get_roads():
    return roads

@app.post("/api/pothole-detection")
async def detect_pothole(data: List[AccelerometerData]):
    potholes = []

    for entry in data:
        x, y, z = entry.acceleration

        # Simple pothole detection logic based on z-axis (up-down) acceleration
        severity = None
        if abs(z) > 15:
            severity = "large"
        elif abs(z) > 10:
            severity = "medium"
        elif abs(z) > 5:
            severity = "small"

        if severity:
            potholes.append({
                "severity": severity,
                "coordinates": entry.coordinates,
                "timestamp": entry.timestamp
            })

    if potholes:
        return {"potholes": potholes}
    else:
        return {"message": "No potholes detected"}
