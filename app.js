// Define frontend version
const FRONTEND_VERSION = "0.55";  // Update this manually with each change

// Initialize the map
const map = L.map('map').setView([44.4268, 26.1025], 7); // Center on Bucharest

// Add the OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Display version numbers
const versionElement = document.createElement('div');
versionElement.style.position = 'fixed';
versionElement.style.bottom = '10px';
versionElement.style.left = '10px';
versionElement.style.backgroundColor = 'white';
versionElement.style.padding = '5px';
versionElement.style.border = '1px solid black';
versionElement.innerHTML = `Frontend Version: ${FRONTEND_VERSION}`;
document.body.appendChild(versionElement);

// Function to fetch and display backend version
async function displayBackendVersion() {
    try {
        const response = await fetch('https://road-rover.gris.ninja/api/version');
        const data = await response.json();
        versionElement.innerHTML += `<br>Backend Version: ${data.version}`;
    } catch (error) {
        console.error("Error fetching backend version:", error);
    }
}

// Call the function to display backend version
displayBackendVersion();

// Function to get user's location
function getUserLocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            map.setView([lat, lon], 13);
            L.marker([lat, lon]).addTo(map)
                .bindPopup('You are here')
                .openPopup();
        }, function(error) {
            console.error("Error getting location:", error);
        });
    } else {
        console.log("Geolocation is not available in your browser.");
    }
}

// Call getUserLocation when the page loads
getUserLocation();

// Function to get color based on road condition
function getConditionColor(condition) {
    switch(condition) {
        case 'good': return 'blue';
        case 'fair': return 'yellow';
        case 'poor': return 'red';
        default: return 'gray';
    }
}

//// Fetch road data from API and display on map
//async function fetchAndDisplayRoads() {
//    try {
//        const API_URL = 'https://road-rover.gris.ninja/api/roads';
//        const response = await fetch(API_URL);
//        const roads = await response.json();
//
//        roads.forEach(road => {
//            L.polyline(road.path, {
//                color: getConditionColor(road.condition),
//                weight: 5,
//                opacity: 0.7
//            }).addTo(map).bindPopup(`Road: ${road.name}<br>Condition: ${road.condition}`);
//        });
//    } catch (error) {
//        console.error("Error fetching road data:", error);
//    }
//}

// Fetch pothole data from API and display on map
async function fetchAndDisplayPotholes() {
    try {
        const API_URL = 'https://road-rover.gris.ninja/api/potholes';
        const response = await fetch(API_URL);
        const data = await response.json();

        data.forEach(pothole => {
            const marker = L.marker([pothole.coordinates[1], pothole.coordinates[0]], {
                icon: L.divIcon({
                    className: 'pothole-icon',
                    html: `<div style="background-color: ${getPotholeColor(pothole.severity)}; width: 10px; height: 10px; border-radius: 50%;"></div>`,
                    iconSize: [10, 10],
                    iconAnchor: [5, 5]
                })
            });

            marker.addTo(map).bindPopup(`Pothole detected<br>Severity: ${pothole.severity}<br>Timestamp: ${pothole.timestamp}`);
        });
    } catch (error) {
        console.error("Error fetching pothole data:", error);
    }
}

// Get color based on pothole severity
function getPotholeColor(severity) {
    switch(severity) {
        case 'large': return 'red';
        case 'medium': return 'orange';
        case 'small': return 'yellow';
        default: return 'gray';
    }
}

// Call the functions to fetch and display roads and potholes
//fetchAndDisplayRoads();
fetchAndDisplayPotholes();

// Accelerometer data collection

let collecting = false;
let accelerometerData = [];
let lastSentTime = Date.now();

const logElement = document.getElementById('log');
const toggleButton = document.getElementById('toggle-accelerometer');

function handleMotion(event) {
    const { x, y, z } = event.accelerationIncludingGravity;
    const timestamp = new Date().toISOString();

    // Collect data
    accelerometerData.push({
        timestamp,
        acceleration: [x, y, z],
        coordinates: [map.getCenter().lat, map.getCenter().lng]  // Use map's center as the current location
    });

    // Display data on the screen for debugging
    logElement.textContent = `
        Timestamp: ${timestamp}
        Acceleration X: ${x.toFixed(2)}
        Acceleration Y: ${y.toFixed(2)}
        Acceleration Z: ${z.toFixed(2)}
    `;

    // Send data to the backend every 5 seconds or when significant motion is detected
    if (Date.now() - lastSentTime > 5000 || Math.abs(z) > 5) {
        postAccelerometerData();
        lastSentTime = Date.now();
        accelerometerData = [];  // Reset data after sending
    }
}

toggleButton.addEventListener('click', () => {
    collecting = !collecting;

    if (collecting) {
        toggleButton.textContent = 'Stop Accelerometer';
        if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', handleMotion, true);
        } else {
            alert('DeviceMotionEvent is not supported on your device.');
        }
    } else {
        toggleButton.textContent = 'Start Accelerometer';
        window.removeEventListener('devicemotion', handleMotion, true);
        logElement.textContent = 'No data yet';
    }
});

// Post the accelerometer data to the backend

async function postAccelerometerData() {
    try {
        const response = await fetch('https://road-rover.gris.ninja/api/pothole-detection', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(accelerometerData)
        });

        const data = await response.json();
        if (data.potholes) {
            data.potholes.forEach(pothole => {
                console.log(`Pothole detected at ${pothole.coordinates} with severity: ${pothole.severity}`);

                // Display a marker for each detected pothole
                L.marker(pothole.coordinates, {
                    icon: L.divIcon({
                        className: 'pothole-icon',
                        html: `<div style="background-color: ${getPotholeColor(pothole.severity)}; width: 10px; height: 10px; border-radius: 50%;"></div>`,
                        iconSize: [10, 10],
                        iconAnchor: [5, 5]
                    })
                }).addTo(map)
                .bindPopup(`Pothole detected<br>Severity: ${pothole.severity}<br>Coordinates: ${pothole.coordinates}<br>Timestamp: ${pothole.timestamp}`);
            });
        } else {
            console.log(data.message);
        }
    } catch (error) {
        console.error("Error posting accelerometer data:", error);
    }
}
