// Define frontend version
const FRONTEND_VERSION = "0.53";  // Update this manually with each change

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

// Fetch road data from API and display on map
async function fetchAndDisplayRoads() {
    try {
        const API_URL = 'https://road-rover.gris.ninja/api/roads';
        const response = await fetch(API_URL);
        const roads = await response.json();

        roads.forEach(road => {
            L.polyline(road.path, {
                color: getConditionColor(road.condition),
                weight: 5,
                opacity: 0.7
            }).addTo(map).bindPopup(`Road: ${road.name}<br>Condition: ${road.condition}`);
        });
    } catch (error) {
        console.error("Error fetching road data:", error);
    }
}

// Fetch pothole data from API and display on map
async function fetchAndDisplayPotholes() {
    try {
        const API_URL = 'https://road-rover.gris.ninja/api/pothole-detection';  // Adjust this URL if needed
        const response = await fetch(API_URL);
        const data = await response.json();

        if (data.potholes) {
            data.potholes.forEach(pothole => {
                L.circleMarker(pothole.coordinates, {
                    color: getPotholeColor(pothole.severity),
                    radius: 6,
                    fillOpacity: 0.8
                }).addTo(map)
                  .bindPopup(`Pothole detected<br>Severity: ${pothole.severity}<br>Coordinates: ${pothole.coordinates}<br>Timestamp: ${pothole.timestamp}`);
            });
        }
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
fetchAndDisplayRoads();
fetchAndDisplayPotholes();
