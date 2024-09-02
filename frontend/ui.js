import { toggleNightMode } from './map.js';
import { getCurrentUser, handleLogout, setCurrentUser } from './auth.js';
import { fetchLeaderboard, fetchUserStats, saveProfileChanges, login, signup } from './api.js';
import { API_BASE_URL } from './config.js';
import { FRONTEND_VERSION } from './config.js';
import { initializeUILogger, logToUI } from './ui-logger.js';

export function initializeUI() {
    initializeUILogger();
    createNightModeToggle();
    createBurgerMenu();
    createVersionDisplay();
    createAccelerometerButton();
    createSoundInitButton();
    updateUIForAuthStatus();
    logToUI('UI initialized successfully');
}

function createSoundInitButton() {
    const controlsContainer = document.getElementById('controls');
    const soundInitButton = document.createElement('button');
    soundInitButton.id = 'init-sound';
    soundInitButton.textContent = 'Initialize Sound';
    soundInitButton.classList.add('control-button');
    soundInitButton.addEventListener('click', initializeSound);
    controlsContainer.appendChild(soundInitButton);
}

function initializeSound() {
    logToUI("Attempting to initialize sound...");

    // Use a very short, silent MP3 file
    const testAudio = new Audio('./sounds/small_pothole.mp3');

    testAudio.oncanplaythrough = () => {
        logToUI("Audio can play through without buffering");
        testAudio.play()
            .then(() => {
                logToUI("Sound initialized successfully");
                document.getElementById('init-sound').style.display = 'none';
            })
            .catch(error => {
                logToUI(`Error playing test sound: ${error.name}: ${error.message}`, 'error');
                if (error.name === 'NotAllowedError') {
                    logToUI("Autoplay prevented. User interaction required.", 'warn');
                }
            });
    };

    testAudio.onerror = (event) => {
        logToUI(`Error loading audio: ${event.target.error.code}`, 'error');
        switch (event.target.error.code) {
            case MediaError.MEDIA_ERR_ABORTED:
                logToUI('Audio loading aborted', 'error');
                break;
            case MediaError.MEDIA_ERR_NETWORK:
                logToUI('Network error while loading audio', 'error');
                break;
            case MediaError.MEDIA_ERR_DECODE:
                logToUI('Audio decoding error', 'error');
                break;
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                logToUI('Audio format not supported', 'error');
                break;
            default:
                logToUI('Unknown error while loading audio', 'error');
        }
    };

    testAudio.load();
}

function createAccelerometerButton() {
    const controlsContainer = document.getElementById('controls');
    const accelerometerButton = document.createElement('button');
    accelerometerButton.id = 'toggle-accelerometer';
    accelerometerButton.textContent = 'Start Accelerometer';
    accelerometerButton.classList.add('control-button');
    accelerometerButton.style.display = 'none'; // Initially hidden
    controlsContainer.appendChild(accelerometerButton);
}

export function updateUIForAuthStatus() {
    const currentUser = getCurrentUser();
    const accelerometerButton = document.getElementById('toggle-accelerometer');
    const menuOptions = document.getElementById('menu-options');

    if (currentUser) {
        accelerometerButton.style.display = 'block';
        menuOptions.innerHTML = `
            <div id="viewProfileOption">👤 Profile</div>
            <div id="viewLeaderboardOption">🏆 Leaderboard</div>
            <div id="logoutOption">⚠️ Logout</div>
        `;
        document.getElementById('viewProfileOption').addEventListener('click', showProfileModal);
        document.getElementById('viewLeaderboardOption').addEventListener('click', showLeaderboardModal);
        document.getElementById('logoutOption').addEventListener('click', handleLogout);
    } else {
        accelerometerButton.style.display = 'none';
        menuOptions.innerHTML = `
            <div id="loginOption">Login</div>
            <div id="signupOption">Sign Up</div>
        `;
        document.getElementById('loginOption').addEventListener('click', showLoginModal);
        document.getElementById('signupOption').addEventListener('click', showSignupModal);
    }
}

export function showLoginModal() {
    const modal = showModal('Intra in cont', `
        <input type="text" id="loginUsername" placeholder="Email" required class="modal-input">
        <input type="password" id="loginPassword" placeholder="Parola" required class="modal-input">
        <button id="loginSubmit" class="modal-submit">Conecteaza-te</button>
    `);

    document.getElementById('loginSubmit').addEventListener('click', async () => {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        if (username && password) {
            await login(username, password);
            closeModal(modal);
            updateUIForAuthStatus();
        }
    });
}

export function showSignupModal() {
    const modal = showModal('Creeaza cont nou', `
        <input type="text" id="signupUsername" placeholder="Username" required class="modal-input">
        <input type="email" id="signupEmail" placeholder="Email" required class="modal-input">
        <input type="password" id="signupPassword" placeholder="Parola" required class="modal-input">
        <button id="signupSubmit" class="modal-submit">Inregistreaza-te</button>
    `);

    document.getElementById('signupSubmit').addEventListener('click', async () => {
        const username = document.getElementById('signupUsername').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        if (username && email && password) {
            await signup(username, email, password);
            closeModal(modal);
            updateUIForAuthStatus();
        }
    });
}

function createNightModeToggle() {
    const nightModeButton = document.createElement('button');
    nightModeButton.id = 'night-mode-toggle';
    nightModeButton.innerHTML = '<i class="fas fa-moon"></i>';
    nightModeButton.classList.add('map-control-button');
    nightModeButton.addEventListener('click', toggleNightMode);
    document.body.appendChild(nightModeButton);
}

function createBurgerMenu() {
    const burgerMenu = document.createElement('div');
    burgerMenu.id = 'burger-menu';
    burgerMenu.innerHTML = '<i class="fas fa-bars"></i>';
    burgerMenu.addEventListener('click', toggleMenu);
    document.body.appendChild(burgerMenu);

    const menuOptions = document.createElement('div');
    menuOptions.id = 'menu-options';
    menuOptions.innerHTML = `
        <div id="loginOption">Login</div>
        <div id="signupOption">Sign Up</div>
    `;
    document.body.appendChild(menuOptions);
}

function toggleMenu() {
    const menuOptions = document.getElementById('menu-options');
    menuOptions.classList.toggle('show');
}

function createVersionDisplay() {
    const versionElement = document.createElement('div');
    versionElement.id = 'version-display';
    document.body.appendChild(versionElement);
}

export function showModal(title, content) {
    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-button">&times;</span>
            <h2>${title}</h2>
            ${content}
        </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.close-button').addEventListener('click', () => closeModal(modal));

    return modal;
}

export function closeModal(modal) {
    document.body.removeChild(modal);
}

export function showLeaderboardModal() {
    const modal = showModal('Vanatorii de cratere', `
        <div id="leaderboardList">Loading...</div>
    `);
    fetchLeaderboard();
}

export function showProfileModal() {
    const modal = showModal('Profil', `
        <div id="profile-content">Loading...</div>
    `);
    updateProfileModalContent();
}

export async function updateProfileModalContent() {
    const profileContent = document.getElementById('profile-content');
    if (!profileContent) {
        console.log('Profile modal is not open. Skipping update.');
        return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
        console.error('No user logged in');
        return;
    }

    const stats = await fetchUserStats(currentUser.username);

    profileContent.innerHTML = `
        <div class="profile-header">
            <img id="profilePhoto" src="${API_BASE_URL}/profile-photo/${currentUser.username}" alt="Profile" onerror="this.src='default-profile.jpeg';">
            <h2>${stats.username}</h2>
        </div>
        <div class="profile-stats">
            <div>
                <h3>${stats.last24Hours}</h3>
                <p>24 ore</p>
            </div>
            <div>
                <h3>${stats.last30Days}</h3>
                <p>30 zile</p>
            </div>
            <div>
                <h3>${stats.total}</h3>
                <p>Total</p>
            </div>
        </div>
        <div class="profile-form">
            <input type="file" id="photoUpload" accept="image/*">
            <input type="email" id="email" value="${currentUser.email || ''}" placeholder="Email">
            <input type="password" id="password" placeholder="Schimba parola">
            <button id="saveProfile">Save Changes</button>
        </div>
    `;

    document.getElementById('saveProfile').addEventListener('click', handleSaveProfile);
    document.getElementById('photoUpload').addEventListener('change', handlePhotoUpload);
}

function handleSaveProfile() {
    const photoUpload = document.getElementById('photoUpload');
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const formData = new FormData();
    if (photoUpload.files.length > 0) {
        formData.append('photo', photoUpload.files[0]);
    }
    if (email) formData.append('email', email);
    if (password) formData.append('password', password);

    saveProfileChanges(formData);
}


function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profilePhoto').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}