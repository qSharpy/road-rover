import { initializeMap } from './map.js';
import { setupAuthEventListeners } from './auth.js';
import { initializeAccelerometer } from './accelerometer.js';
import { initializeUI } from './ui.js';
import { displayBackendVersion } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeMap();
    setupAuthEventListeners();
    initializeAccelerometer();
    initializeUI();
    displayBackendVersion();
});

export const FRONTEND_VERSION = "0.110 native UI";
