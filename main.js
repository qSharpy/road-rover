import { initializeMap } from './map.js';
import { setupAuthEventListeners } from './auth.js';
import { initializeAccelerometer } from './accelerometer.js';
import { initializeUI } from './ui.js';
import { displayBackendVersion } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeMap();
    initializeUI();
    initializeAccelerometer();
    displayBackendVersion();

    // Delay setup of auth event listeners to ensure DOM elements are created
    setTimeout(setupAuthEventListeners, 0);
});

export const FRONTEND_VERSION = "0.112 native UI";