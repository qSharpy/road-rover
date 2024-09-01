import { initializeMap } from './map.js';
import { initializeAccelerometer } from './accelerometer.js';
import { initializeUI } from './ui.js';
import { displayBackendVersion } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeMap();
    initializeUI();
    initializeAccelerometer();
    displayBackendVersion();

});
