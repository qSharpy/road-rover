const FRONTEND_VERSION = "0.71-full dark and white mode";

// Initialize the map container and set its height
const mapContainer = document.getElementById('map');
mapContainer.style.height = '70vh';  // Set map height to 80% of viewport height
mapContainer.style.position = 'relative';  // Ensure the map container is positioned relative

// Initialize the map
const map = L.map('map').setView([44.4268, 26.1025], 7); // Center on Bucharest

// Define tile layers for day and night modes
const dayTiles = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> <a href="https://stamen.com/" target="_blank">&copy; Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
});

const nightTiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles © Esri & contributors'
});

// Add the day tiles as the default
dayTiles.addTo(map);

// Display version numbers
const versionElement = document.createElement('div');
versionElement.style.position = 'fixed';
versionElement.style.bottom = '10px';
versionElement.style.left = '10px';
versionElement.style.backgroundColor = 'white';
versionElement.style.padding = '5px';
versionElement.style.border = '1px solid black';
versionElement.style.zIndex = '1000'; // Ensure version text is on top
versionElement.innerHTML = `Frontend Version: ${FRONTEND_VERSION}`;
document.body.appendChild(versionElement);

// Function to toggle night mode
let isNightMode = false;
const nightModeButton = document.createElement('button');
nightModeButton.style.position = 'absolute';
nightModeButton.style.bottom = '10px';
nightModeButton.style.right = '10px';
nightModeButton.style.padding = '5px 10px';
nightModeButton.style.zIndex = '1000'; // Ensure the button is on top
nightModeButton.textContent = 'Night Mode';
nightModeButton.addEventListener('click', () => {
    if (isNightMode) {
        map.removeLayer(nightTiles);
        dayTiles.addTo(map);
        document.body.style.backgroundColor = 'white';
        document.body.style.color = 'black';
        versionElement.style.backgroundColor = 'white';
        versionElement.style.color = 'black';
        nightModeButton.style.backgroundColor = 'white';
        nightModeButton.style.color = 'black';
        reCenterButton.style.backgroundColor = 'white';
        reCenterButton.style.color = 'black';
        toggleButton.style.backgroundColor = 'white';
        toggleButton.style.color = 'black';
        nightModeButton.textContent = 'Night Mode';
    } else {
        map.removeLayer(dayTiles);
        nightTiles.addTo(map);
        document.body.style.backgroundColor = '#212121';
        document.body.style.color = 'white';
        versionElement.style.backgroundColor = '#424242';
        versionElement.style.color = 'white';
        nightModeButton.style.backgroundColor = '#424242';
        nightModeButton.style.color = 'white';
        reCenterButton.style.backgroundColor = '#424242';
        reCenterButton.style.color = 'white';
        toggleButton.style.backgroundColor = '#424242';
        toggleButton.style.color = 'white';
        nightModeButton.textContent = 'Day Mode';
    }
    isNightMode = !isNightMode;
});

// Add the "Re-center" button to the map
const reCenterButton = document.createElement('button');
reCenterButton.style.position = 'absolute';
reCenterButton.style.bottom = '50px';
reCenterButton.style.right = '10px';
reCenterButton.style.padding = '5px 10px';
reCenterButton.style.zIndex = '1000'; // Ensure the button is on top
reCenterButton.textContent = 'Re-center';
reCenterButton.addEventListener('click', () => {
    shouldReCenter = true;
    userHasMovedMap = false;
    if (locationMarker) {
        map.setView(locationMarker.getLatLng(), 13);
    }
});

// Append the buttons to the map container
mapContainer.appendChild(nightModeButton);
mapContainer.appendChild(reCenterButton);

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

// Variables to track centering
let shouldReCenter = true;
let userHasMovedMap = false;

// Marker for averaged location
let locationMarker = null;

// Listen for map movements
map.on('movestart', function() {
    userHasMovedMap = true;
});

// GPS Buffer to store recent coordinates
let gpsBuffer = [];  // Buffer for GPS coordinates

// Watch and buffer GPS location
navigator.geolocation.watchPosition(function(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    // Buffer the latest coordinates
    gpsBuffer.push([lat, lon]);

    // Limit buffer size to 5 readings (adjust as needed)
    if (gpsBuffer.length > 5) {
        gpsBuffer.shift();  // Remove the oldest reading
    }

    // Calculate the average position
    const averageLat = gpsBuffer.reduce((sum, coord) => sum + coord[0], 0) / gpsBuffer.length;
    const averageLon = gpsBuffer.reduce((sum, coord) => sum + coord[1], 0) / gpsBuffer.length;

    // Use the averaged location
    const averagedLocation = [averageLat, averageLon];

    // Update the marker position
    if (locationMarker) {
        locationMarker.setLatLng(averagedLocation);
    } else {
        // Create the marker if it doesn't exist
        locationMarker = L.marker(averagedLocation).addTo(map)
            .bindPopup('Averaged Location')
            .openPopup();
    }

    // Re-center the map if allowed and if the user hasn't moved the map manually
    if (shouldReCenter && !userHasMovedMap) {
        map.setView(averagedLocation, 13);
    }

}, function(error) {
    console.error("Error getting location:", error);
}, {
    enableHighAccuracy: true,  // Request high accuracy GPS
    maximumAge: 10000,  // Cache the location for up to 10 seconds
    timeout: 10000      // Timeout after 10 seconds
});

// Fetch pothole data from API and display on map as heatmap
async function fetchAndDisplayPotholes() {
    try {
        const API_URL = 'https://road-rover.gris.ninja/api/potholes';
        const response = await fetch(API_URL);
        const data = await response.json();

        // Prepare data for heatmap
        const heatmapData = data.map(pothole => {
            const lat = pothole.coordinates[1];
            const lon = pothole.coordinates[0];
            const intensity = pothole.severity === 'large' ? 1 : pothole.severity === 'medium' ? 0.5 : 0.2;

            return [lat, lon, intensity];  // Format for heatmap
        });

        // Add heatmap layer to the map
        const heatmapLayer = L.heatLayer(heatmapData, {
            radius: 15,     // Adjust default radius
            maxZoom: 15,    // Adjust based on map zoom levels
            blur: 10,       // Adjust to change heat distribution
            gradient: {     // Example gradient for severity visualization
                0.2: 'yellow',
                0.5: 'orange',
                1.0: 'red'
            }
        }).addTo(map);  // This line adds the heatmap to the map

        // Store reference to the current heatmap layer for future updates
        if (window.currentHeatmapLayer) {
            map.removeLayer(window.currentHeatmapLayer);
        }
        window.currentHeatmapLayer = heatmapLayer;

    } catch (error) {
        console.error("Error fetching pothole data:", error);
    }
}

// Call the function to fetch and display potholes
fetchAndDisplayPotholes();

// Get color based on pothole severity
function getPotholeColor(severity) {
    switch(severity) {
        case 'large': return 'red';
        case 'medium': return 'orange';
        case 'small': return 'yellow';
        default: return 'gray';
    }
}

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
        coordinates: locationMarker ? [locationMarker.getLatLng().lat, locationMarker.getLatLng().lng] : null  // Use averaged location
    });

    // Display data on the screen for debugging
    logElement.textContent = `
        Timestamp: ${timestamp}
        Acceleration X: ${x.toFixed(2)}
        Acceleration Y: ${y.toFixed(2)}
        Acceleration Z: ${z.toFixed(2)}
    `;

    // Send data to the backend when significant motion is detected
    if (Math.abs(y) > 10) {
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
        // Send data to pothole detection endpoint
        const potholeResponse = await fetch('https://road-rover.gris.ninja/api/pothole-detection', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(accelerometerData.filter(data => data.coordinates))
        });

        const potholeData = await potholeResponse.json();
        if (potholeData.potholes) {
            potholeData.potholes.forEach(pothole => {
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
            console.log(potholeData.message);
        }

        // Send data to accelerometer data storage endpoint
        await fetch('https://road-rover.gris.ninja/api/accelerometer-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(accelerometerData.filter(data => data.coordinates))
        });

        accelerometerData = [];  // Reset data after sending
    } catch (error) {
        console.error("Error posting accelerometer data:", error);
    }
}