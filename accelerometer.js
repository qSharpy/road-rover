import { postAccelerometerData } from './api.js';
import { getCurrentUser } from './auth.js';
import { getAveragedLocation } from './map.js';

let collecting = false;
let accelerometerData = [];
let lastSentTime = Date.now();
let lastClearTime = Date.now();

export function initializeAccelerometer() {
    const toggleButton = document.getElementById('toggle-accelerometer');
    toggleButton.addEventListener('click', toggleAccelerometer);
}

function toggleAccelerometer() {
    collecting = !collecting;
    const toggleButton = document.getElementById('toggle-accelerometer');

    if (collecting) {
        console.log("Starting accelerometer data collection");
        toggleButton.textContent = 'Stop Accelerometer';
        toggleButton.classList.add('active');
        
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceMotionEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        window.addEventListener('devicemotion', handleMotion, true);
                    } else {
                        console.error('Permission to access motion sensors was denied');
                        alert('Permission to access motion sensors was denied');
                        collecting = false;
                        toggleButton.textContent = 'Start Accelerometer';
                        toggleButton.classList.remove('active');
                    }
                })
                .catch(console.error);
        } else {
            window.addEventListener('devicemotion', handleMotion, true);
        }
    } else {
        console.log("Stopping accelerometer data collection");
        toggleButton.textContent = 'Start Accelerometer';
        toggleButton.classList.remove('active');
        window.removeEventListener('devicemotion', handleMotion, true);
    }
}

function handleMotion(event) {
    const { x, y, z } = event.accelerationIncludingGravity;
    const timestamp = new Date().toISOString();
    const currentUser = getCurrentUser();
    const averagedLocation = getAveragedLocation();

    accelerometerData.push({
        timestamp,
        acceleration: { x, y, z },  // Changed to object format
        coordinates: averagedLocation ? [averagedLocation.lng, averagedLocation.lat] : null  // Note the order: [longitude, latitude]
    });

    const currentTime = Date.now();

    if (currentTime - lastSentTime > 1000) {
        postAccelerometerData(accelerometerData);
        lastSentTime = currentTime;
    }

    if (currentTime - lastClearTime > 10000) {
        accelerometerData = [];
        lastClearTime = currentTime;
        console.log("Cleared accelerometer data");
    }
}