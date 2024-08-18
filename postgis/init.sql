CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS potholes (
    id SERIAL PRIMARY KEY,
    severity VARCHAR(10) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    location GEOMETRY(Point, 4326) NOT NULL
);

CREATE INDEX idx_pothole_location ON potholes USING GIST (location);
