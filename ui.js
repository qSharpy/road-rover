import { toggleNightMode } from './map.js';
import { getCurrentUser } from './auth.js';
import { fetchLeaderboard, fetchUserStats, saveProfileChanges } from './api.js';

export function initializeUI() {
    createNightModeToggle();
    createBurgerMenu();
    createVersionDisplay();
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
    const currentUser = getCurrentUser();
    if (!currentUser) {
        console.error('No user logged in');
        return;
    }

    const profileContent = document.getElementById('profile-content');
    const stats = await fetchUserStats(currentUser.username);

    profileContent.innerHTML = `
        <div class="profile-header">
            <img id="profilePhoto" src="${currentUser.photoUrl || 'default-profile.jpeg'}" alt="Profile">
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