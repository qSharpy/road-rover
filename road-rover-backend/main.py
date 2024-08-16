from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

@app.get("/")
async def root():
    return {"message": "Welcome to the Road Rover API"}

@app.get("/api/roads")
async def get_roads():
    return roads