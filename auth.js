import { showModal, closeModal, showProfileModal, showLeaderboardModal, updateUIForAuthStatus } from './ui.js';

let currentUser = null;

export function getCurrentUser() {
    if (!currentUser) {
        const userString = localStorage.getItem('currentUser');
        currentUser = userString ? JSON.parse(userString) : null;
    }
    return currentUser;
}

export function setCurrentUser(user) {
    currentUser = user;
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
        localStorage.removeItem('currentUser');
    }
    updateUIForAuthStatus();
}

export function setupAuthEventListeners() {
    const loginOption = document.getElementById('loginOption');
    const signupOption = document.getElementById('signupOption');

    if (loginOption) {
        loginOption.addEventListener('click', showLoginModal);
    }

    if (signupOption) {
        signupOption.addEventListener('click', showSignupModal);
    }

    // Check if user is already logged in
    const user = getCurrentUser();
    if (user) {
        updateUIForUser(user);
    }
}

function showLoginModal() {
    const modal = showModal('Intra in cont', `
        <input type="text" id="loginUsername" placeholder="Email" required class="modal-input">
        <input type="password" id="loginPassword" placeholder="Parola" required class="modal-input">
        <button id="loginSubmit" class="modal-submit">Conecteaza-te</button>
    `);

    document.getElementById('loginSubmit').addEventListener('click', async () => {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        if (username && password) {
            const { login } = await import('./api.js');
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

    document.getElementById('signupSubmit').addEventListener('click', async () => {
        const username = document.getElementById('signupUsername').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        if (username && email && password) {
            const { signup } = await import('./api.js');
            signup(username, email, password);
            closeModal(modal);
        }
    });
}

function updateUIForUser(user) {
    const menuOptions = document.getElementById('menu-options');
    if (menuOptions) {
        if (user) {
            menuOptions.innerHTML = `
                <div id="viewProfileOption">👤 Profile</div>
                <div id="viewLeaderboardOption">🏆 Leaderboard</div>
                <div id="logoutOption">⚠️ Logout</div>
            `;
            document.getElementById('viewProfileOption').addEventListener('click', showProfileModal);
            document.getElementById('viewLeaderboardOption').addEventListener('click', showLeaderboardModal);
            document.getElementById('logoutOption').addEventListener('click', handleLogout);
        } else {
            menuOptions.innerHTML = `
                <div id="loginOption">Login</div>
                <div id="signupOption">Sign Up</div>
            `;
            setupAuthEventListeners();
        }
    }
}

export async function handleLogout() {
    const { logout } = await import('./api.js');
    await logout();
    setCurrentUser(null);
    updateUIForAuthStatus();
}