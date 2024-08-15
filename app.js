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

// Example road data
const roads = [
    {
        name: "Bucharest to Pitesti",
        condition: "poor",
        path: [
            [44.4268, 26.1025], // Bucharest
            [44.5622, 25.9701], // intermediate point
            [44.7478, 25.7066], // intermediate point
            [44.8563, 24.8690]  // Pitesti
        ]
    },
    {
        name: "Bucharest to Constanta",
        condition: "good",
        path: [
            [44.4268, 26.1025], // Bucharest
            [44.3628, 26.6178], // intermediate point
            [44.2642, 27.3348], // intermediate point
            [44.1733, 28.6383]  // Constanta
        ]
    }
];

// Function to get color based on road condition
function getConditionColor(condition) {
    switch(condition) {
        case 'good': return 'blue';
        case 'fair': return 'yellow';
        case 'poor': return 'red';
        default: return 'gray';
    }
}

// Display roads on the map
roads.forEach(road => {
    L.polyline(road.path, {
        color: getConditionColor(road.condition),
        weight: 5,
        opacity: 0.7
    }).addTo(map).bindPopup(`Road: ${road.name}<br>Condition: ${road.condition}`);
});