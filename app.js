// Initialize the map
const map = L.map('map').setView([45.9432, 24.9668], 7); // Center on Romania

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

// Simulated road condition data (replace with real data later)
const roadConditions = [
    { coords: [44.4268, 26.1025], condition: 'good' },
    { coords: [45.7489, 21.2087], condition: 'fair' },
    { coords: [46.7712, 23.6236], condition: 'poor' },
];

// Function to get color based on road condition
function getConditionColor(condition) {
    switch(condition) {
        case 'good': return 'green';
        case 'fair': return 'yellow';
        case 'poor': return 'red';
        default: return 'blue';
    }
}

// Display road conditions on the map
roadConditions.forEach(road => {
    L.circleMarker(road.coords, {
        color: getConditionColor(road.condition),
        fillColor: getConditionColor(road.condition),
        fillOpacity: 0.7,
        radius: 8
    }).addTo(map).bindPopup(`Road condition: ${road.condition}`);
});