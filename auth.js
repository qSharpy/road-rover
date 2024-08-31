import { showModal, closeModal, showProfileModal, showLeaderboardModal, updateUIForAuthStatus } from './ui.js';
import { updateUIForAuthStatus } from './ui.js';

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
    updateUIForAuthStatus();
}

export async function handleLogout() {
    const { logout } = await import('./api.js');
    await logout();
    setCurrentUser(null);
    updateUIForAuthStatus();
}