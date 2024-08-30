const FRONTEND_VERSION = "0.87-modal beautiful";

// Initialize the map container and set its height
const mapContainer = document.getElementById('map');
mapContainer.style.height = '70vh';  // Set map height to 80% of viewport height
mapContainer.style.position = 'relative';  // Ensure the map container is positioned relative

// Initialize the map
const map = L.map('map').setView([44.4268, 26.1025], 7); // Center on Bucharest

// Define tile layers for day and night modes
const dayTiles = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> <a href="https://stamen.com/" target="_blank">&copy; Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
});

const nightTiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles © Esri & contributors'
});

// Add the day tiles as the default
dayTiles.addTo(map);

// Display version numbers
const versionElement = document.createElement('div');
versionElement.style.position = 'fixed';
versionElement.style.bottom = '10px';
versionElement.style.left = '10px';
versionElement.style.backgroundColor = 'white';
versionElement.style.padding = '5px';
versionElement.style.border = '1px solid black';
versionElement.style.zIndex = '1000'; // Ensure version text is on top
versionElement.innerHTML = `Frontend Version: ${FRONTEND_VERSION}`;
document.body.appendChild(versionElement);

// Function to toggle night mode
let isNightMode = false;
const nightModeButton = document.createElement('button');
nightModeButton.style.position = 'absolute';
nightModeButton.style.bottom = '10px';
nightModeButton.style.right = '10px';
nightModeButton.style.padding = '5px 10px';
nightModeButton.style.zIndex = '1000'; // Ensure the button is on top
nightModeButton.textContent = 'Night Mode';
nightModeButton.addEventListener('click', () => {
    if (isNightMode) {
        map.removeLayer(nightTiles);
        dayTiles.addTo(map);
        document.body.style.backgroundColor = 'white';
        document.body.style.color = 'black';
        versionElement.style.backgroundColor = 'white';
        versionElement.style.color = 'black';
        nightModeButton.style.backgroundColor = 'white';
        nightModeButton.style.color = 'black';
        reCenterButton.style.backgroundColor = 'white';
        reCenterButton.style.color = 'black';
        toggleButton.style.backgroundColor = 'white';
        toggleButton.style.color = 'black';
        nightModeButton.textContent = 'Night Mode';

        // Update burger menu options for day mode
        menuOptions.style.backgroundColor = 'white';
        menuOptions.style.color = 'black';
        Array.from(menuOptions.children).forEach(option => {
            option.style.backgroundColor = 'white';
            option.style.color = 'black';
        });
    } else {
        map.removeLayer(dayTiles);
        nightTiles.addTo(map);
        document.body.style.backgroundColor = '#212121';
        document.body.style.color = 'white';
        versionElement.style.backgroundColor = '#424242';
        versionElement.style.color = 'white';
        nightModeButton.style.backgroundColor = '#424242';
        nightModeButton.style.color = 'white';
        reCenterButton.style.backgroundColor = '#424242';
        reCenterButton.style.color = 'white';
        toggleButton.style.backgroundColor = '#424242';
        toggleButton.style.color = 'white';
        nightModeButton.textContent = 'Day Mode';

        // Update burger menu options for night mode
        menuOptions.style.backgroundColor = '#424242';
        menuOptions.style.color = 'white';
        Array.from(menuOptions.children).forEach(option => {
            option.style.backgroundColor = '#424242';
            option.style.color = 'white';
        });
    }
    isNightMode = !isNightMode;
});

// Add the "Re-center" button to the map
const reCenterButton = document.createElement('button');
reCenterButton.style.position = 'absolute';
reCenterButton.style.bottom = '50px';
reCenterButton.style.right = '10px';
reCenterButton.style.padding = '5px 10px';
reCenterButton.style.zIndex = '1000'; // Ensure the button is on top
reCenterButton.textContent = 'Re-center';
reCenterButton.addEventListener('click', () => {
    shouldReCenter = true;
    userHasMovedMap = false;
    if (locationMarker) {
        map.setView(locationMarker.getLatLng(), 16);
    }
});

// Append the buttons to the map container
mapContainer.appendChild(nightModeButton);
mapContainer.appendChild(reCenterButton);

// Function to fetch and display backend version
async function displayBackendVersion() {
    try {
        const response = await fetch('https://road-rover.gris.ninja/api/version');
        const data = await response.json();
        versionElement.innerHTML += `<br>Backend Version: ${data.version}`;
    } catch (error) {
        console.error("Error fetching backend version:", error);
    }
}

// Call the function to display backend version
displayBackendVersion();

// Variables to track centering
let shouldReCenter = true;
let userHasMovedMap = false;

// Marker for averaged location
let locationMarker = null;

// Listen for map movements
map.on('movestart', function() {
    userHasMovedMap = true;
});

// GPS Buffer to store recent coordinates
let gpsBuffer = [];  // Buffer for GPS coordinates

// Watch and buffer GPS location
navigator.geolocation.watchPosition(function(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    // Buffer the latest coordinates
    gpsBuffer.push([lat, lon]);

    // Limit buffer size to 5 readings (adjust as needed)
    if (gpsBuffer.length > 5) {
        gpsBuffer.shift();  // Remove the oldest reading
    }

    // Calculate the average position
    const averageLat = gpsBuffer.reduce((sum, coord) => sum + coord[0], 0) / gpsBuffer.length;
    const averageLon = gpsBuffer.reduce((sum, coord) => sum + coord[1], 0) / gpsBuffer.length;

    // Use the averaged location
    const averagedLocation = [averageLat, averageLon];

    // Update the marker position
    if (locationMarker) {
        locationMarker.setLatLng(averagedLocation);
    } else {
        // Create the marker if it doesn't exist
        locationMarker = L.marker(averagedLocation).addTo(map)
            .bindPopup('Averaged Location')
            .openPopup();
    }

    // Re-center the map if allowed and if the user hasn't moved the map manually
    if (shouldReCenter && !userHasMovedMap) {
        map.setView(averagedLocation, 16);
    }

}, function(error) {
    console.error("Error getting location:", error);
}, {
    enableHighAccuracy: true,  // Request high accuracy GPS
    maximumAge: 10000,  // Cache the location for up to 10 seconds
    timeout: 10000      // Timeout after 10 seconds
});

// Fetch pothole data from API and display on map as heatmap
async function fetchAndDisplayPotholes() {
    try {
        const API_URL = 'https://road-rover.gris.ninja/api/potholes';
        const response = await fetch(API_URL);
        const data = await response.json();

        // Prepare data for heatmap
        const heatmapData = data.map(pothole => {
            const lat = pothole.coordinates[1];
            const lon = pothole.coordinates[0];
            const intensity = pothole.severity === 'large' ? 1 : pothole.severity === 'medium' ? 0.5 : 0.2;

            return [lat, lon, intensity];  // Format for heatmap
        });

        // Add heatmap layer to the map
        const heatmapLayer = L.heatLayer(heatmapData, {
            radius: 15,     // Adjust default radius
            maxZoom: 15,    // Adjust based on map zoom levels
            blur: 10,       // Adjust to change heat distribution
            gradient: {     // Example gradient for severity visualization
                0.2: 'yellow',
                0.5: 'orange',
                1.0: 'red'
            }
        }).addTo(map);  // This line adds the heatmap to the map

        // Store reference to the current heatmap layer for future updates
        if (window.currentHeatmapLayer) {
            map.removeLayer(window.currentHeatmapLayer);
        }
        window.currentHeatmapLayer = heatmapLayer;

    } catch (error) {
        console.error("Error fetching pothole data:", error);
    }
}

// Call the function to fetch and display potholes
fetchAndDisplayPotholes();

// Get color based on pothole severity
function getPotholeColor(severity) {
    switch(severity) {
        case 'large': return 'red';
        case 'medium': return 'orange';
        case 'small': return 'yellow';
        default: return 'gray';
    }
}

// Accelerometer data collection
let collecting = false;
let accelerometerData = [];
let lastSentTime = Date.now();
let lastClearTime = Date.now();

const logElement = document.getElementById('log');
const toggleButton = document.getElementById('toggle-accelerometer');

function handleMotion(event) {
    const { x, y, z } = event.accelerationIncludingGravity;
    const timestamp = new Date().toISOString();

    // Collect data
    accelerometerData.push({
        timestamp,
        acceleration: [x, y, z],
        coordinates: locationMarker ? [locationMarker.getLatLng().lat, locationMarker.getLatLng().lng] : null
    });

    // Display data on the screen for debugging
    logElement.textContent = `
        Timestamp: ${timestamp}
        Acceleration X: ${x.toFixed(2)}
        Acceleration Y: ${y.toFixed(2)}
        Acceleration Z: ${z.toFixed(2)}
    `;

    const currentTime = Date.now();

    // Send accelerometer data every 1 second
    if (currentTime - lastSentTime > 1000) {  // 1000 ms = 1 second
        postAccelerometerData();
        lastSentTime = currentTime;
    }

    // Clear accelerometer data every 10 seconds
    if (currentTime - lastClearTime > 10000) {  // 10000 ms = 10 seconds
        accelerometerData = [];
        lastClearTime = currentTime;
        console.log("Cleared accelerometer data");
    }
}

toggleButton.addEventListener('click', () => {
    collecting = !collecting;

    if (collecting) {
        console.log("Starting accelerometer data collection");
        toggleButton.textContent = 'Stop Accelerometer';
        
        // Check if it's an iOS device
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        
        if (isIOS) {
            // Request permission for iOS 13+
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
                        }
                    })
                    .catch(console.error);
            } else {
                // Handle older versions of iOS
                window.addEventListener('devicemotion', handleMotion, true);
            }
        } else if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', handleMotion, true);
        } else {
            console.error('DeviceMotionEvent is not supported on your device.');
            alert('DeviceMotionEvent is not supported on your device.');
            collecting = false;
            toggleButton.textContent = 'Start Accelerometer';
        }
    } else {
        console.log("Stopping accelerometer data collection");
        toggleButton.textContent = 'Start Accelerometer';
        window.removeEventListener('devicemotion', handleMotion, true);
        logElement.textContent = 'No data yet';
    }
});

let currentUser = null;

// Create burger menu
const burgerMenu = document.createElement('div');
burgerMenu.innerHTML = '☰';
burgerMenu.style.position = 'absolute';
burgerMenu.style.top = '10px';
burgerMenu.style.right = '10px';
burgerMenu.style.fontSize = '24px';
burgerMenu.style.zIndex = '1000';
burgerMenu.style.cursor = 'pointer';
mapContainer.appendChild(burgerMenu);

// Create menu options
const menuOptions = document.createElement('div');
menuOptions.style.position = 'absolute';
menuOptions.style.top = '40px';
menuOptions.style.right = '10px';
menuOptions.style.backgroundColor = 'white';
menuOptions.style.padding = '10px';
menuOptions.style.borderRadius = '5px';
menuOptions.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
menuOptions.style.display = 'none';
menuOptions.style.zIndex = '1000';
menuOptions.innerHTML = `
    <div id="loginOption" style="cursor: pointer; margin-bottom: 5px;">Login</div>
    <div id="signupOption" style="cursor: pointer;">Sign Up</div>
`;
mapContainer.appendChild(menuOptions);

// Toggle menu visibility
burgerMenu.addEventListener('click', () => {
    menuOptions.style.display = menuOptions.style.display === 'none' ? 'block' : 'none';
});

// Login function
async function login(email, password) {
    try {
        const response = await fetch('https://road-rover.gris.ninja/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (response.ok) {
            currentUser = data.username;
            alert(`Welcome back, ${currentUser}!`);
            updateUIForLoggedInUser();
        } else {
            alert(data.detail || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login');
    }
}

// Sign up function
async function signup(username, email, password) {
    try {
        const response = await fetch('https://road-rover.gris.ninja/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        const data = await response.json();
        if (response.ok) {
            alert('Sign up successful! Please log in.');
        } else {
            alert(data.detail || 'Sign up failed');
        }
    } catch (error) {
        console.error('Sign up error:', error);
        alert('An error occurred during sign up');
    }
}

// Update UI for logged in user
function updateUIForLoggedInUser() {
    menuOptions.innerHTML = `
        <div>Salut 👋🏼, ${currentUser}!</div>
        <div id="viewProfileOption" style="cursor: pointer; margin-top: 5px;">View Profile</div>
        <div id="viewLeaderboardOption" style="cursor: pointer; margin-top: 5px;">View Leaderboard</div>
        <div id="logoutOption" style="cursor: pointer; margin-top: 5px;">Logout</div>
    `;
    document.getElementById('logoutOption').addEventListener('click', logout);
    document.getElementById('viewProfileOption').addEventListener('click', showProfilePage);
    document.getElementById('viewLeaderboardOption').addEventListener('click', showLeaderboardPage);
}

function showLeaderboardPage() {
    const leaderboardOverlay = document.createElement('div');
    leaderboardOverlay.style.position = 'fixed';
    leaderboardOverlay.style.top = '0';
    leaderboardOverlay.style.left = '0';
    leaderboardOverlay.style.width = '100%';
    leaderboardOverlay.style.height = '100%';
    leaderboardOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    leaderboardOverlay.style.zIndex = '2000';
    leaderboardOverlay.style.overflow = 'auto';
    leaderboardOverlay.style.padding = '20px';
    leaderboardOverlay.style.boxSizing = 'border-box';

    const closeButton = document.createElement('button');
    closeButton.textContent = '✕';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.fontSize = '24px';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', () => document.body.removeChild(leaderboardOverlay));

    const leaderboardContent = document.createElement('div');
    leaderboardContent.innerHTML = `
        <h2>Vanatorii de cratere</h2>
        <img src="top-pothole.jpeg" alt="Top Pothole" style="max-width: 100%; height: auto; margin-bottom: 20px;">
        <div id="leaderboardList">Loading...</div>
    `;

    leaderboardOverlay.appendChild(closeButton);
    leaderboardOverlay.appendChild(leaderboardContent);
    document.body.appendChild(leaderboardOverlay);

    // Fetch and display leaderboard
    fetchLeaderboard();
}

// Add this new function to fetch the leaderboard data
async function fetchLeaderboard() {
    try {
        const response = await fetch('https://road-rover.gris.ninja/api/leaderboard');
        const leaderboard = await response.json();
        const leaderboardList = document.getElementById('leaderboardList');
        leaderboardList.innerHTML = `
            <table style="width: 100%; max-width: 500px; margin: 0 auto; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Username 😎</th>
                        <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">nr. cratere 🚗</th>
                    </tr>
                </thead>
                <tbody>
                    ${leaderboard.map(user => `
                        <tr>
                            <td style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">${user.username}</td>
                            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">${user.pothole_count}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        document.getElementById('leaderboardList').textContent = 'Failed to load leaderboard';
    }
}

function showProfilePage() {
    const profileOverlay = document.createElement('div');
    profileOverlay.style.position = 'fixed';
    profileOverlay.style.top = '0';
    profileOverlay.style.left = '0';
    profileOverlay.style.width = '100%';
    profileOverlay.style.height = '100%';
    profileOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
    profileOverlay.style.zIndex = '2000';
    profileOverlay.style.overflow = 'auto';
    profileOverlay.style.padding = '20px';
    profileOverlay.style.boxSizing = 'border-box';

    const closeButton = document.createElement('button');
    closeButton.textContent = '✕';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.fontSize = '24px';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', () => document.body.removeChild(profileOverlay));

    const profileContent = document.createElement('div');
    profileContent.innerHTML = `
        <h2>Profile: ${currentUser}</h2>
        <div>
            <label for="profilePhoto">Profile Photo URL:</label>
            <input type="text" id="profilePhoto" placeholder="Enter photo URL">
        </div>
        <div>
            <label for="email">Email:</label>
            <input type="email" id="email" placeholder="Enter new email">
        </div>
        <div>
            <label for="password">Password:</label>
            <input type="password" id="password" placeholder="Enter new password">
        </div>
        <button id="saveProfile">Save Changes</button>
        <h3>Pothole Statistics</h3>
        <div id="potholeStats">Loading...</div>
    `;

    profileOverlay.appendChild(closeButton);
    profileOverlay.appendChild(profileContent);
    document.body.appendChild(profileOverlay);

    // Fetch and display pothole statistics
    fetchPotholeStats();

    // Add event listener for saving profile changes
    document.getElementById('saveProfile').addEventListener('click', saveProfileChanges);
}

async function fetchPotholeStats() {
    try {
        const response = await fetch(`https://road-rover.gris.ninja/api/user-stats/${currentUser}`);
        const stats = await response.json();
        document.getElementById('potholeStats').innerHTML = `
            <p>Last 24 hours: ${stats.last24Hours}</p>
            <p>Last 30 days: ${stats.last30Days}</p>
            <p>Total: ${stats.total}</p>
        `;
    } catch (error) {
        console.error('Error fetching pothole stats:', error);
        document.getElementById('potholeStats').textContent = 'Failed to load statistics';
    }
}

async function saveProfileChanges() {
    const photoUrl = document.getElementById('profilePhoto').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`https://road-rover.gris.ninja/api/update-profile/${currentUser}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ photoUrl, email, password })
        });

        if (response.ok) {
            alert('Profile updated successfully');
        } else {
            const errorData = await response.json();
            alert(errorData.detail || 'Failed to update profile');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('An error occurred while updating the profile');
    }
}

// Logout function
function logout() {
    currentUser = null;
    menuOptions.innerHTML = `
        <div id="loginOption" style="cursor: pointer; margin-bottom: 5px;">Login</div>
        <div id="signupOption" style="cursor: pointer;">Sign Up</div>
    `;
    setupAuthEventListeners();
    alert('Logged out successfully');
}

// Setup event listeners for auth options
function setupAuthEventListeners() {
    document.getElementById('loginOption').addEventListener('click', showLoginModal);
    document.getElementById('signupOption').addEventListener('click', showSignupModal);
}

setupAuthEventListeners();

function showLoginModal() {
    const modal = createModal('Sign In', `
        <input type="text" id="loginUsername" placeholder="Username" required class="modal-input">
        <input type="password" id="loginPassword" placeholder="Password" required class="modal-input">
        <button id="loginSubmit" class="modal-submit">Sign In</button>
    `);

    document.getElementById('loginSubmit').addEventListener('click', () => {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        if (username && password) {
            login(username, password);
            closeModal(modal);
        }
    });
}

function showSignupModal() {
    const modal = createModal('Sign Up', `
        <input type="text" id="signupUsername" placeholder="Choose a username" required class="modal-input">
        <input type="email" id="signupEmail" placeholder="Enter your email" required class="modal-input">
        <input type="password" id="signupPassword" placeholder="Choose a password" required class="modal-input">
        <button id="signupSubmit" class="modal-submit">Sign Up</button>
    `);

    document.getElementById('signupSubmit').addEventListener('click', () => {
        const username = document.getElementById('signupUsername').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        if (username && email && password) {
            signup(username, email, password);
            closeModal(modal);
        }
    });
}

function createModal(title, content) {
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.left = '0';
    modal.style.top = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '2000';

    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = '#fff';
    modalContent.style.padding = '30px';
    modalContent.style.borderRadius = '8px';
    modalContent.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    modalContent.style.position = 'relative';
    modalContent.style.width = '300px';
    modalContent.style.maxWidth = '90%';

    const closeButton = document.createElement('span');
    closeButton.textContent = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '15px';
    closeButton.style.fontSize = '24px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.color = '#999';
    closeButton.addEventListener('click', () => closeModal(modal));

    const titleElement = document.createElement('h2');
    titleElement.textContent = title;
    titleElement.style.marginTop = '0';
    titleElement.style.marginBottom = '20px';
    titleElement.style.textAlign = 'center';
    titleElement.style.color = '#333';

    modalContent.innerHTML = `
        ${titleElement.outerHTML}
        ${content}
    `;
    modalContent.appendChild(closeButton);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Add CSS for input fields and button
    const style = document.createElement('style');
    style.textContent = `
        .modal-input {
            width: 100%;
            padding: 10px;
            margin-bottom: 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
            font-size: 14px;
        }
        .modal-input:focus {
            outline: none;
            border-color: #4a90e2;
        }
        .modal-submit {
            width: 100%;
            padding: 10px;
            background-color: #4a90e2;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            transition: background-color 0.3s;
        }
        .modal-submit:hover {
            background-color: #357ae8;
        }
    `;
    document.head.appendChild(style);

    return modal;
}

function closeModal(modal) {
    document.body.removeChild(modal);
}

async function postAccelerometerData() {
    if (!currentUser) {
        console.log("User not logged in. Data not sent.");
        return;
    }
    try {
        console.log("Sending accelerometer data:", accelerometerData);

        const response = await fetch('https://road-rover.gris.ninja/api/accelerometer-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User': currentUser
            },
            body: JSON.stringify(accelerometerData)
        });

        const result = await response.json();
        console.log("Accelerometer data response:", result);

        if (result.potholes_detected > 0) {
            fetchAndDisplayPotholes();
        }

        accelerometerData = [];
    } catch (error) {
        console.error("Error posting accelerometer data:", error);
    }
}

// Add this function to your app.js file
async function recalculatePotholes() {
    try {
        const response = await fetch('https://road-rover.gris.ninja/api/recalculate-potholes', {
            method: 'POST'
        });
        const result = await response.json();
        console.log(result.message);
        // After recalculation, fetch and display the new potholes
        fetchAndDisplayPotholes();
    } catch (error) {
        console.error("Error recalculating potholes:", error);
    }
}

// Add a button to your HTML
const recalculateButton = document.createElement('button');
recalculateButton.textContent = 'Recalculate Potholes';
recalculateButton.style.position = 'absolute';
recalculateButton.style.bottom = '90px';
recalculateButton.style.right = '10px';
recalculateButton.style.padding = '5px 10px';
recalculateButton.style.zIndex = '1000';
recalculateButton.addEventListener('click', recalculatePotholes);

// Add the button to the map container
mapContainer.appendChild(recalculateButton);
