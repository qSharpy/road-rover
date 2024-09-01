import { fetchAndDisplayPotholes } from './api.js';
import { getCurrentUser } from './auth.js';

let map, dayTiles, nightTiles, isNightMode = false;
let currentHeatmapLayer;
let locationMarker = null;
let gpsBuffer = [];
let isFollowingUser = false;

export function initializeMap() {
    const mapContainer = document.getElementById('map');
    mapContainer.style.height = '100vh';
    mapContainer.style.width = '100vw';
    mapContainer.style.position = 'fixed';
    mapContainer.style.top = '0';
    mapContainer.style.left = '0';

    map = L.map('map', { zoomControl: false });

    dayTiles = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> <a href="https://stamen.com/" target="_blank">&copy; Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
    });

    nightTiles = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> <a href="https://stamen.com/" target="_blank">&copy; Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
    });

    dayTiles.addTo(map);

    loadHeatmapPlugin().then(() => {
        fetchAndDisplayPotholes().then(heatmapData => {
            displayPotholeHeatmap(heatmapData);
        });
    });

    createTrackingButton();
    startLocationTracking();
    setInitialMapView();
}

function setInitialMapView() {
    if (locationMarker) {
        map.setView(locationMarker.getLatLng(), 16);
    } else {
        // If locationMarker is not available, use a default location
        map.fitBounds([
            [48.2, 20.2], // Northeast corner of Romania
            [43.6, 29.7]  // Southwest corner of Romania
        ]);
    }
}

function createTrackingButton() {
    const trackingButton = document.createElement('button');
    trackingButton.innerHTML = '<i class="fas fa-crosshairs"></i>'; // Font Awesome crosshairs icon
    trackingButton.classList.add('control-button', 'tracking-button');
    trackingButton.addEventListener('click', toggleTracking);

    const controlsContainer = document.getElementById('controls');
    controlsContainer.insertBefore(trackingButton, controlsContainer.firstChild);
}

function toggleTracking() {
    isFollowingUser = !isFollowingUser;
    const trackingButton = document.querySelector('.tracking-button');
    if (isFollowingUser) {
        trackingButton.classList.add('active');
        if (locationMarker) {
            map.setView(locationMarker.getLatLng(), 16);
        }
    } else {
        trackingButton.classList.remove('active');
    }
}

function startLocationTracking() {
    navigator.geolocation.watchPosition(updateLocation, handleLocationError, {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 10000
    });
}

const locationIcon = L.divIcon({
    className: 'custom-location-icon',
    html: '<i class="fas fa-circle" style="color: lightgreen; border: 2px solid white;"></i>',
    iconSize: [28, 28],
    iconAnchor: [14, 14] // Center the icon, half the size
});

function updateLocation(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    gpsBuffer.push([lat, lon]);
    if (gpsBuffer.length > 5) {
        gpsBuffer.shift();
    }

    const averageLat = gpsBuffer.reduce((sum, coord) => sum + coord[0], 0) / gpsBuffer.length;
    const averageLon = gpsBuffer.reduce((sum, coord) => sum + coord[1], 0) / gpsBuffer.length;
    const averagedLocation = [averageLat, averageLon];

    if (locationMarker) {
        locationMarker.setLatLng(averagedLocation);
    } else {
        locationMarker = L.marker(averagedLocation, { icon: locationIcon }).addTo(map);
        setInitialMapView();
    }

    if (isFollowingUser) {
        map.setView(averagedLocation, 16);
    }

    // Update the current user's location
    const currentUser = getCurrentUser();
    if (currentUser) {
        currentUser.lat = averageLat;
        currentUser.lon = averageLon;
    }
}

function handleLocationError(error) {
    console.error("Error getting location:", error);
}

export function getAveragedLocation() {
    return locationMarker ? locationMarker.getLatLng() : null;
}

function loadHeatmapPlugin() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function displayPotholeHeatmap(heatmapData) {
    if (currentHeatmapLayer) {
        map.removeLayer(currentHeatmapLayer);
    }

    currentHeatmapLayer = L.heatLayer(heatmapData, {
        radius: 15,
        maxZoom: 15,
        blur: 10,
        gradient: {
            0.2: 'yellow',
            0.5: 'orange',
            1.0: 'red'
        }
    }).addTo(map);
}

export function toggleNightMode() {
    isNightMode = !isNightMode;
    if (isNightMode) {
        map.removeLayer(dayTiles);
        nightTiles.addTo(map);
        document.body.classList.add('night-mode');
    } else {
        map.removeLayer(nightTiles);
        dayTiles.addTo(map);
        document.body.classList.remove('night-mode');
    }

    // Update the night mode toggle button
    const nightModeButton = document.getElementById('night-mode-toggle');
    const icon = nightModeButton.querySelector('i');
    if (isNightMode) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        nightModeButton.classList.add('night-mode');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        nightModeButton.classList.remove('night-mode');
    }
}
