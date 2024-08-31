import { updateCurrentUser } from './auth.js';
import { centerMapOnUser } from './map.js';
import { updateProfileModalContent } from './ui.js';

const API_BASE_URL = 'https://road-rover.gris.ninja/api';

export async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (response.ok) {
            updateCurrentUser(data);
            updateProfileModalContent();
        } else {
            alert(data.detail || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login');
    }
}

export async function signup(username, email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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

export async function logout() {
    try {
        // If you have a logout endpoint on your server, you can call it here
        // const response = await fetch(`${API_BASE_URL}/logout`, { method: 'POST' });

        // Clear the current user data
        updateCurrentUser(null);

        // You might want to clear any stored tokens or session data here
        // For example, if you're using localStorage:
        // localStorage.removeItem('userToken');

        console.log('User logged out successfully');
    } catch (error) {
        console.error('Logout error:', error);
        alert('An error occurred during logout');
    }
}

export async function fetchAndDisplayPotholes() {
    try {
        const response = await fetch(`${API_BASE_URL}/potholes`);
        const data = await response.json();
        // Process and display potholes on the map
        // This part depends on your map implementation
        // You might want to call a function from map.js here to display the potholes
    } catch (error) {
        console.error('Error fetching pothole data:', error);
    }
}

export async function postAccelerometerData(data) {
    try {
        const response = await fetch(`${API_BASE_URL}/accelerometer-data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User': localStorage.getItem('username') || ''
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.potholes_detected > 0) {
            fetchAndDisplayPotholes();
        }
    } catch (error) {
        console.error("Error posting accelerometer data:", error);
    }
}

export async function fetchLeaderboard() {
    try {
        const response = await fetch(`${API_BASE_URL}/leaderboard`);
        const leaderboard = await response.json();
        const leaderboardList = document.getElementById('leaderboardList');
        leaderboardList.innerHTML = `
            <table class="leaderboard-table">
                <thead>
                    <tr>
                        <th>😎 Sefii la asfalt</th>
                        <th>🌀 nr. cratere</th>
                    </tr>
                </thead>
                <tbody>
                    ${leaderboard.map(user => `
                        <tr>
                            <td>${user.username}</td>
                            <td>${user.pothole_count}</td>
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

export async function fetchUserStats(username) {
    try {
        const response = await fetch(`${API_BASE_URL}/user-stats/${encodeURIComponent(username)}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching user stats:', error);
        return {};
    }
}

export async function saveProfileChanges(formData) {
    try {
        const response = await fetch(`${API_BASE_URL}/update-profile/${localStorage.getItem('username')}`, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            alert(result.message || 'Profile updated successfully');
            updateProfileModalContent();
        } else {
            const errorData = await response.json();
            alert(errorData.detail || 'Failed to update profile');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('An error occurred while updating the profile');
    }
}

export async function displayBackendVersion() {
    try {
        const response = await fetch(`${API_BASE_URL}/version`);
        const data = await response.json();
        const versionElement = document.getElementById('version-display');
        versionElement.textContent = `Backend Version: ${data.version}`;
    } catch (error) {
        console.error("Error fetching backend version:", error);
    }
}

export async function recalculatePotholes() {
    try {
        const response = await fetch(`${API_BASE_URL}/recalculate-potholes`, { method: 'POST' });
        const result = await response.json();
        console.log(result.message);
        fetchAndDisplayPotholes();
    } catch (error) {
        console.error("Error recalculating potholes:", error);
    }
}