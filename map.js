import { fetchAndDisplayPotholes } from './api.js';

let map, dayTiles, nightTiles, isNightMode = false;

export function initializeMap() {
    const mapContainer = document.getElementById('map');
    mapContainer.style.height = '100vh';
    mapContainer.style.width = '100vw';
    mapContainer.style.position = 'fixed';
    mapContainer.style.top = '0';
    mapContainer.style.left = '0';

    map = L.map('map').setView([44.4268, 26.1025], 7);

    dayTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    });

    nightTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    });

    dayTiles.addTo(map);

    fetchAndDisplayPotholes();
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
}

export function centerMapOnUser(lat, lon) {
    map.setView([lat, lon], 16);
}