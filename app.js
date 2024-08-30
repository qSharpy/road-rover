const FRONTEND_VERSION = "0.96-modal h3 fix";

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
nightModeButton.textContent = 'Mod Noapte';
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
        nightModeButton.textContent = 'Mod Noapte';

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
        nightModeButton.textContent = 'Mod Zi';

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
reCenterButton.textContent = 'Re-centrare';
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
            currentUser = {
                username: data.username,
                email: email
            };
            alert(`Welcome back, ${currentUser.username}!`);
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
        <div>👋🏼Salut, ${currentUser.username}!</div>
        <div id="viewProfileOption" style="cursor: pointer; margin-top: 5px;">👤Profil</div>
        <div id="viewLeaderboardOption" style="cursor: pointer; margin-top: 5px;">🏆Clasament</div>
        <div id="logoutOption" style="cursor: pointer; margin-top: 5px;">⚠️Logout</div>
    `;
    document.getElementById('logoutOption').addEventListener('click', logout);
    document.getElementById('viewProfileOption').addEventListener('click', showProfilePage);
    document.getElementById('viewLeaderboardOption').addEventListener('click', showLeaderboardPage);
}

function showLeaderboardPage() {
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
    modalContent.style.backgroundColor = isNightMode ? '#212121' : 'white';
    modalContent.style.color = isNightMode ? 'white' : 'black';
    modalContent.style.padding = '30px';
    modalContent.style.borderRadius = '8px';
    modalContent.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    modalContent.style.position = 'relative';
    modalContent.style.width = '90%';
    modalContent.style.maxWidth = '600px';
    modalContent.style.maxHeight = '90%';
    modalContent.style.overflow = 'auto';

    const closeButton = document.createElement('button');
    closeButton.textContent = '✕';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.fontSize = '24px';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.cursor = 'pointer';
    closeButton.style.color = isNightMode ? 'white' : 'black';
    closeButton.addEventListener('click', () => document.body.removeChild(modal));

    const leaderboardContent = document.createElement('div');
    leaderboardContent.innerHTML = `
        <h2 style="text-align: center;">Vanatorii de cratere</h2>
        <img src="top-pothole.jpeg" alt="Top Pothole" style="display: block; max-width: 100%; height: auto; margin: 0 auto 20px;">
        <div id="leaderboardList">Loading...</div>
    `;

    modalContent.appendChild(closeButton);
    modalContent.appendChild(leaderboardContent);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Fetch and display leaderboard
    fetchLeaderboard();
}

// Update the fetchLeaderboard function to use the night mode colors
async function fetchLeaderboard() {
    try {
        const response = await fetch('https://road-rover.gris.ninja/api/leaderboard');
        const leaderboard = await response.json();
        const leaderboardList = document.getElementById('leaderboardList');
        leaderboardList.innerHTML = `
            <table style="width: 100%; max-width: 500px; margin: 0 auto; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="padding: 10px; text-align: left; border-bottom: 2px solid ${isNightMode ? '#444' : '#ddd'};">😎Sefii la asfalt </th>
                        <th style="padding: 10px; text-align: right; border-bottom: 2px solid ${isNightMode ? '#444' : '#ddd'};">🌀nr. cratere</th>
                    </tr>
                </thead>
                <tbody>
                    ${leaderboard.map(user => `
                        <tr>
                            <td style="padding: 10px; text-align: left; border-bottom: 1px solid ${isNightMode ? '#444' : '#ddd'};">${user.username}</td>
                            <td style="padding: 10px; text-align: right; border-bottom: 1px solid ${isNightMode ? '#444' : '#ddd'};">${user.pothole_count}</td>
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
    modalContent.style.backgroundColor = 'white';
    modalContent.style.padding = '30px';
    modalContent.style.borderRadius = '20px';
    modalContent.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    modalContent.style.width = '90%';
    modalContent.style.maxWidth = '400px';
    modalContent.style.textAlign = 'center';
    modalContent.style.position = 'relative';  // Add this line

    const closeButton = document.createElement('button');
    closeButton.textContent = '✕';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '20px';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', () => document.body.removeChild(modal));

    modalContent.innerHTML = `
        <div style="position: relative; width: 100px; height: 100px; margin: 0 auto 20px; overflow: hidden; border-radius: 50%;">
            <img src="${currentUser.photoUrl || 'default-profile.jpg'}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        <h2 style="margin-bottom: 20px;" id="usernameDisplay">Loading...</h2>
        <div style="display: flex; justify-content: space-around; margin-bottom: 30px;">
            <div>
                <h3 style="font-size: 24px; margin: 0;" id="last24hours">0</h3>
                <p style="margin: 0;">24 ore</p>
            </div>
            <div>
                <h3 style="font-size: 24px; margin: 0;" id="last30days">0</h3>
                <p style="margin: 0;">30 zile</p>
            </div>
            <div>
                <h3 style="font-size: 24px; margin: 0;" id="total">0</h3>
                <p style="margin: 0;">Total</p>
            </div>
        </div>
        <div style="text-align: left; margin-bottom: 20px;">
            <label for="profilePhoto">URL catre poza ta de profil:</label>
            <input type="text" id="profilePhoto" value="${currentUser.photoUrl || ''}" style="width: 100%; padding: 5px; margin-top: 5px;">
        </div>
        <div style="text-align: left; margin-bottom: 20px;">
            <label for="email">Email:</label>
            <input type="email" id="email" value="${currentUser.email || ''}" style="width: 100%; padding: 5px; margin-top: 5px;">
        </div>
        <div style="text-align: left; margin-bottom: 20px;">
            <label for="password">Vrei sa schimbi parola?</label>
            <input type="password" id="password" placeholder="Introdu parola noua..." style="width: 100%; padding: 5px; margin-top: 5px;">
        </div>
        <button id="saveProfile" style="width: 100%; padding: 10px; background-color: #4a90e2; color: white; border: none; border-radius: 5px; cursor: pointer; margin-bottom: 20px;">Save Changes</button>
        <button id="logoutButton" style="width: 100%; padding: 10px; background-color: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer;">Logout</button>
    `;

    modalContent.appendChild(closeButton);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Add event listener for saving profile changes
    document.getElementById('saveProfile').addEventListener('click', saveProfileChanges);

    // Add event listener for logout
    document.getElementById('logoutButton').addEventListener('click', () => {
        logout();
        document.body.removeChild(modal);
    });

    // Fetch and display pothole statistics
    fetchPotholeStats();
    fetchUserStats();
}

// Add this function to fetch and display user stats
async function fetchUserStats() {
    try {
        const response = await fetch(`https://road-rover.gris.ninja/api/user-stats/${currentUser.username}`);
        const stats = await response.json();
        
        document.getElementById('usernameDisplay').textContent = stats.username;
        document.getElementById('last24hours').textContent = stats.last24Hours;
        document.getElementById('total').textContent = stats.total;
        document.getElementById('last30days').textContent = stats.last30Days;
    } catch (error) {
        console.error('Error fetching user stats:', error);
    }
}

async function fetchPotholeStats() {
    try {
        const response = await fetch(`https://road-rover.gris.ninja/api/user-stats/${currentUser}`);
        const stats = await response.json();
        
        // Update the UI with the fetched stats
        document.querySelector('div:nth-child(2) h3').textContent = stats.last24Hours;
        document.querySelector('div:nth-child(3) h3').textContent = stats.total;
        document.querySelector('div:nth-child(4) h3').textContent = stats.last30Days;
    } catch (error) {
        console.error('Error fetching pothole stats:', error);
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
    const modal = createModal('Intra in cont', `
        <input type="text" id="loginUsername" placeholder="Email" required class="modal-input">
        <input type="password" id="loginPassword" placeholder="Parola" required class="modal-input">
        <button id="loginSubmit" class="modal-submit">Conecteaza-te</button>
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
    const modal = createModal('Creeaza cont nou', `
        <input type="text" id="signupUsername" placeholder="Username" required class="modal-input">
        <input type="email" id="signupEmail" placeholder="Email" required class="modal-input">
        <input type="password" id="signupPassword" placeholder="Parola" required class="modal-input">
        <button id="signupSubmit" class="modal-submit">Inregistreaza-te</button>
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
    if (!currentUser || !currentUser.username) {
        console.log("User not logged in or username not available. Data not sent.");
        return;
    }
    try {
        console.log("Sending accelerometer data:", accelerometerData);

        const response = await fetch('https://road-rover.gris.ninja/api/accelerometer-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User': currentUser.username
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
