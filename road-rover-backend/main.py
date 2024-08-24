import logging
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, Integer, String, DateTime
from geoalchemy2 import Geometry
from datetime import datetime, timedelta

# Define version number
BACKEND_VERSION = "0.64-heatmap"

# Database setup
DATABASE_URL = "postgresql+asyncpg://root:test@192.168.0.135/road_rover"
last_detection_time = None

engine = create_async_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

# Define Pothole model
class Pothole(Base):
    __tablename__ = "potholes"

    id = Column(Integer, primary_key=True, index=True)
    severity = Column(String, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    location = Column(Geometry("POINT"))

# Create the database tables
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# FastAPI app setup
app = FastAPI()

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Logger setup
logging.basicConfig(level=logging.INFO)

# Dependency to get the database session
async def get_db():
    async with SessionLocal() as session:
        yield session

# API models
class AccelerometerData(BaseModel):
    timestamp: str
    acceleration: Tuple[float, float, float]  # (x, y, z)
    coordinates: Tuple[float, float]  # (latitude, longitude)

class PotholeResponse(BaseModel):
    id: int
    severity: str
    timestamp: datetime
    coordinates: Tuple[float, float]

# API Endpoints
@app.on_event("startup")
async def startup():
    await init_db()

@app.get("/")
async def root():
    return {"message": "Welcome to the buc Road Rover API"}

@app.get("/api/version")
async def get_backend_version():
    return {"version": BACKEND_VERSION}

@app.post("/api/pothole-detection")
async def detect_pothole(data: List[AccelerometerData], db: AsyncSession = Depends(get_db)):
    global last_detection_time

    # Define a minimum interval (e.g., 2 seconds) between consecutive inserts
    min_interval = timedelta(seconds=1)
    current_time = datetime.utcnow()

    potholes = []

    for entry in data:
        x, y, z = entry.acceleration

        # Log the incoming data
        #logging.info(f"Received data: x={x}, y={y}, z={z}, coordinates={entry.coordinates}")

        # Simple pothole detection logic based on z-axis (up-down) acceleration
        severity = None
        if abs(y) > 14:
            severity = "large"
        elif abs(y) > 12:
            severity = "medium"
        elif abs(y) > 10:
            severity = "small"

        # Only insert if a pothole is detected and enough time has passed since the last detection
        if severity and (last_detection_time is None or current_time - last_detection_time > min_interval):
            pothole = Pothole(
                severity=severity,
                location=f"SRID=4326;POINT({entry.coordinates[1]} {entry.coordinates[0]})"
            )
            db.add(pothole)
            potholes.append(pothole)
            last_detection_time = current_time  # Update the last detection time

    if potholes:
        logging.info(f"Potholes detected: {potholes}")
        await db.commit()

    return {"potholes": [p.severity for p in potholes] if potholes else "No potholes detected"}

@app.get("/api/potholes", response_model=List[PotholeResponse])
async def get_potholes(db: AsyncSession = Depends(get_db)):
    query = await db.execute("SELECT id, severity, timestamp, ST_AsText(location) FROM potholes")
    results = query.fetchall()

    pothole_data = []
    for row in results:
        coordinates = tuple(map(float, row[3].replace('POINT(', '').replace(')', '').split()))

        # Calculate proximity to other potholes
        proximity_query = await db.execute(
            """
            SELECT COUNT(*) FROM potholes
            WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), 0.001)
            """, {"lon": coordinates[0], "lat": coordinates[1]}
        )
        count = proximity_query.scalar()

        # Adjust radius based on proximity
        radius = 25 + count * 5  # Example: Base radius of 25, plus 5 units per nearby pothole

        pothole_data.append({
            "id": row[0],
            "severity": row[1],
            "timestamp": row[2],
            "coordinates": coordinates,
            "radius": radius  # Adding radius information
        })

    return pothole_data
