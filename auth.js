import { showModal, closeModal } from './ui.js';
import { login, signup, logout } from './api.js';

export let currentUser = null;

export function setupAuthEventListeners() {
    const loginOption = document.getElementById('loginOption');
    const signupOption = document.getElementById('signupOption');

    if (loginOption) {
        loginOption.addEventListener('click', showLoginModal);
    }

    if (signupOption) {
        signupOption.addEventListener('click', showSignupModal);
    }
}

function showLoginModal() {
    const modal = showModal('Intra in cont', `
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
    const modal = showModal('Creeaza cont nou', `
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

export function updateCurrentUser(user) {
    currentUser = user;
    if (user) {
        console.log('User logged in:', user);
        updateUIForLoggedInUser();
    } else {
        console.log('User logged out');
        updateUIForLoggedOutUser();
    }
}

function updateUIForLoggedInUser() {
    const menuOptions = document.getElementById('menu-options');
    if (menuOptions) {
        menuOptions.innerHTML = `
            <div id="viewProfileOption">👤 Profile</div>
            <div id="viewLeaderboardOption">🏆 Leaderboard</div>
            <div id="logoutOption">⚠️ Logout</div>
        `;
        document.getElementById('viewProfileOption').addEventListener('click', showProfileModal);
        document.getElementById('viewLeaderboardOption').addEventListener('click', showLeaderboardModal);
        document.getElementById('logoutOption').addEventListener('click', handleLogout);
    }
}

function updateUIForLoggedOutUser() {
    const menuOptions = document.getElementById('menu-options');
    if (menuOptions) {
        menuOptions.innerHTML = `
            <div id="loginOption">Login</div>
            <div id="signupOption">Sign Up</div>
        `;
        setupAuthEventListeners();
    }
}

export function handleLogout() {
    logout().then(() => {
        updateUIForLoggedOutUser();
    });
}

// Import these functions from ui.js if they're not already in this file
import { showProfileModal, showLeaderboardModal } from './ui.js';