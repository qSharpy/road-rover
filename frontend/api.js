import { getCurrentUser, setCurrentUser } from './auth.js';
import { updateProfileModalContent, showProfileModal } from './ui.js';
import { API_BASE_URL } from './config.js';
import { logToUI } from './ui-logger.js';

export async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (response.ok) {
            const user = {
                username: data.username,
                email: email
            };
            setCurrentUser(user);
            alert('Login successful!');
            //showProfileModal(); // Open the profile modal
            updateProfileModalContent// is called inside showProfileModal, so we don't need to call it here
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
        const currentUser = getCurrentUser();
        if (!currentUser) {
            console.log('No user is currently logged in');
            return;
        }

        // If you have a logout endpoint on your server, uncomment and use this:
        // const response = await fetch(`${API_BASE_URL}/logout`, {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'Authorization': `Bearer ${currentUser.token}` // If you're using token-based auth
        //     }
        // });

        // if (!response.ok) {
        //     throw new Error('Server-side logout failed');
        // }

        // Clear the user data from local storage
        setCurrentUser(null);

        // Clear any auth tokens or session data
        localStorage.removeItem('authToken'); // If you're using token-based auth

        console.log('User logged out successfully');

        // Optionally, redirect to the home page or login page
        // window.location.href = '/login.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('An error occurred during logout. Please try again.');
    }
}

export async function fetchAndDisplayPotholes() {
    try {
        const response = await fetch(`${API_BASE_URL}/potholes`);
        const data = await response.json();

        // Prepare data for heatmap
        const heatmapData = data.map(pothole => {
            const lat = pothole.coordinates[1];
            const lon = pothole.coordinates[0];
            const intensity = pothole.severity === 'large' ? 1 : pothole.severity === 'medium' ? 0.5 : 0.2;
            return [lat, lon, intensity];
        });

        return heatmapData;
    } catch (error) {
        console.error('Error fetching pothole data:', error);
        return [];
    }
}

export async function postAccelerometerData(data) {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            console.log("User not logged in. Data not sent.");
            logToUI("User not logged in. Data not sent.");
            return;
        }

        const response = await fetch(`${API_BASE_URL}/accelerometer-data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User': currentUser.username || ''
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.potholes_detected > 0) {
            fetchAndDisplayPotholes();

            // Play sound based on pothole severity
            if (result.pothole_severity) {
                playPotholeSound(result.pothole_severity);
            }
        }
    } catch (error) {
        console.error("Error posting accelerometer data:", error);
    }
}

function playPotholeSound(severity) {
    logToUI(`Attempting to play sound for ${severity} pothole`);
    const soundMap = {
        small: 'small_pothole.mp3',
        medium: 'medium_pothole.mp3',
        large: 'large_pothole.mp3'
    };

    if (!soundMap[severity]) {
        logToUI(`Invalid severity: ${severity}`, 'error');
        return;
    }

    const soundFile = `sounds/${soundMap[severity]}`;
    logToUI(`Sound file path: ${soundFile}`);

    const sound = new Audio(soundFile);
    sound.play()
        .then(() => logToUI(`Sound played successfully for ${severity} pothole`))
        .catch(error => logToUI(`Error playing sound: ${error}`, 'error'));
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
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('You must be logged in to update your profile');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/update-profile/${currentUser.username}`, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            alert(result.message || 'Profile updated successfully');

            // Update the current user object with new data
            const updatedUser = {
                ...currentUser,
                email: formData.get('email') || currentUser.email
            };
            setCurrentUser(updatedUser);

            // Refresh the profile modal content
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