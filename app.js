// Initialize the map
const map = L.map('map').setView([44.4268, 26.1025], 7); // Center on Bucharest

// Add the OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

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
        const API_URL = 'http://road-rover.duckdns.org:3500/api/roads';
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

// Call the function to fetch and display roads
fetchAndDisplayRoads();