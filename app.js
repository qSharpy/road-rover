// Existing map initialization code

const map = L.map('map').setView([44.4268, 26.1025], 7); // Center on Bucharest

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Fetch and display road data
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

fetchAndDisplayRoads();

// Start of the new accelerometer data collection code

let collecting = false;
const logElement = document.getElementById('log');
const toggleButton = document.getElementById('toggle-accelerometer');

function handleMotion(event) {
    const { x, y, z } = event.accelerationIncludingGravity;
    const timestamp = new Date().toISOString();

    // Display the data on the screen for debugging
    logElement.textContent = `
        Timestamp: ${timestamp}
        Acceleration X: ${x.toFixed(2)}
        Acceleration Y: ${y.toFixed(2)}
        Acceleration Z: ${z.toFixed(2)}
    `;
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

// Existing code to get user's location and display on map

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

getUserLocation();
