CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS potholes (
    id SERIAL PRIMARY KEY,
    severity VARCHAR(10) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    location GEOMETRY(Point, 4326) NOT NULL
);

CREATE INDEX idx_pothole_location ON potholes USING GIST (location);

-- New table for accelerometer data
CREATE TABLE IF NOT EXISTS accelerometer_data (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    x FLOAT NOT NULL,
    y FLOAT NOT NULL,
    z FLOAT NOT NULL,
    location GEOMETRY(Point, 4326) NOT NULL
);

CREATE INDEX idx_accelerometer_data_timestamp ON accelerometer_data (timestamp);
CREATE INDEX idx_accelerometer_data_location ON accelerometer_data USING GIST (location);