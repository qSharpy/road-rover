import logging
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey
from geoalchemy2 import Geometry
from datetime import datetime, timedelta
import math
from dateutil import parser
from passlib.context import CryptContext

# Define version number
BACKEND_VERSION = "0.73 login signup"

# Database setup
DATABASE_URL = "postgresql+asyncpg://root:test@192.168.0.135/road_rover"
last_detection_time = None

engine = create_async_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Update the User model
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Define Pothole model
class Pothole(Base):
    __tablename__ = "potholes"

    id = Column(Integer, primary_key=True, index=True)
    severity = Column(String, index=True)
    timestamp = Column(DateTime(timezone=False), default=datetime.utcnow)
    location = Column(Geometry("POINT"))
    user_id = Column(Integer, ForeignKey("users.id"))

# Define AccelerometerReading model
class AccelerometerReading(Base):
    __tablename__ = "accelerometer_data"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=False), default=datetime.utcnow)
    x = Column(Float)
    y = Column(Float)
    z = Column(Float)
    location = Column(Geometry("POINT"))
    user_id = Column(Integer, ForeignKey("users.id"))

# Create the database tables
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# FastAPI app setup
app = FastAPI()

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logger setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Dependency to get the database session
async def get_db():
    async with SessionLocal() as session:
        yield session

# API models
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

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

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# API Endpoints
@app.on_event("startup")
async def startup():
    await init_db()

@app.get("/")
async def root():
    return {"message": "Welcome to the Road Rover API"}

@app.get("/api/version")
async def get_backend_version():
    return {"version": BACKEND_VERSION}

@app.post("/api/signup")
async def signup(user: UserCreate, db: AsyncSession = Depends(get_db)):
    query = await db.execute(f"SELECT * FROM users WHERE username = '{user.username}' OR email = '{user.email}'")
    if query.first():
        raise HTTPException(status_code=400, detail="Username or email already registered")
    hashed_password = get_password_hash(user.password)
    new_user = User(username=user.username, email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    await db.commit()
    return {"message": "User created successfully"}

@app.post("/api/login")
async def login(user: UserLogin, db: AsyncSession = Depends(get_db)):
    query = await db.execute(f"SELECT * FROM users WHERE email = '{user.email}'")
    db_user = query.first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    return {"message": "Login successful", "username": db_user.username}

@app.post("/api/accelerometer-data")
async def process_accelerometer_data(data: List[AccelerometerData], db: AsyncSession = Depends(get_db), x_user: str = Header(None)):
    if not x_user:
        raise HTTPException(status_code=400, detail="User not authenticated")

    query = await db.execute(f"SELECT id FROM users WHERE username = '{x_user}'")
    user = query.first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    user_id = user.id
    global last_detection_time
    logger.info(f"Received accelerometer data from user {x_user}: {data}")

    min_interval = timedelta(seconds=1.5)
    current_time = datetime.utcnow()
    potholes = []

    try:
        # Group data by second
        grouped_data = {}
        for entry in data:
            x, y, z = entry.acceleration
            lat, lon = entry.coordinates
            timestamp = parser.isoparse(entry.timestamp).replace(tzinfo=None)
            second_key = timestamp.replace(microsecond=0)

            if second_key not in grouped_data:
                grouped_data[second_key] = {"magnitudes": [], "coordinates": (lat, lon)}

            magnitude = math.sqrt(x*x + y*y + z*z)
            grouped_data[second_key]["magnitudes"].append(magnitude)

            # Store accelerometer data
            reading = AccelerometerReading(
                x=x, y=y, z=z,
                timestamp=timestamp,
                location=f"SRID=4326;POINT({lon} {lat})",
                user_id=user_id
            )
            db.add(reading)

        # Process grouped data
        for timestamp, group in grouped_data.items():
            avg_magnitude = sum(group["magnitudes"]) / len(group["magnitudes"])
            avg_deviation = abs(avg_magnitude - 9.81)

            # Determine severity based on average deviation
            severity = None
            if avg_deviation > 1.0:
                severity = "large"
            elif avg_deviation > 0.5:
                severity = "medium"
            elif avg_deviation > 0.35:
                severity = "small"

            # Only insert if a pothole is detected and enough time has passed since the last detection
            if severity and (last_detection_time is None or timestamp - last_detection_time > min_interval):
                lat, lon = group["coordinates"]
                pothole = Pothole(
                    severity=severity,
                    timestamp=timestamp,
                    location=f"SRID=4326;POINT({lon} {lat})",
                    user_id=user_id
                )
                db.add(pothole)
                potholes.append(pothole)
                last_detection_time = timestamp

        if potholes:
            logging.info(f"Potholes detected by user {x_user}: {potholes}")

        await db.commit()
        logger.info("Accelerometer data processed and stored successfully")
        return {"message": "Data processed successfully", "potholes_detected": len(potholes)}
    except Exception as e:
        logger.error(f"Error processing accelerometer data: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error processing accelerometer data: {str(e)}")

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

async def clear_and_recalculate_potholes(db: AsyncSession):
    # Clear the pothole table
    await db.execute("DELETE FROM potholes")

    # Fetch all accelerometer data
    result = await db.execute("SELECT timestamp, x, y, z, ST_AsText(location) FROM accelerometer_data ORDER BY timestamp")
    accelerometer_data = result.fetchall()

    # Group data by second
    grouped_data = {}
    for row in accelerometer_data:
        timestamp, x, y, z, location = row
        second_key = timestamp.replace(microsecond=0)
        
        if second_key not in grouped_data:
            grouped_data[second_key] = {"magnitudes": [], "coordinates": location}
        
        magnitude = math.sqrt(x*x + y*y + z*z)
        grouped_data[second_key]["magnitudes"].append(magnitude)

    # Process grouped data and insert new potholes
    min_interval = timedelta(seconds=1.5)
    last_detection_time = None

    for timestamp, group in grouped_data.items():
        avg_magnitude = sum(group["magnitudes"]) / len(group["magnitudes"])
        avg_deviation = abs(avg_magnitude - 9.81)

        severity = None
        if avg_deviation > 1.0:
            severity = "large"
        elif avg_deviation > 0.5:
            severity = "medium"
        elif avg_deviation > 0.35:
            severity = "small"

        if severity and (last_detection_time is None or timestamp - last_detection_time > min_interval):
            location = group["coordinates"]
            pothole = Pothole(
                severity=severity,
                timestamp=timestamp,
                location=location
            )
            db.add(pothole)
            last_detection_time = timestamp

    await db.commit()

@app.post("/api/recalculate-potholes")
async def recalculate_potholes(db: AsyncSession = Depends(get_db)):
    try:
        await clear_and_recalculate_potholes(db)
        return {"message": "Potholes recalculated successfully"}
    except Exception as e:
        logger.error(f"Error recalculating potholes: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error recalculating potholes: {str(e)}")
