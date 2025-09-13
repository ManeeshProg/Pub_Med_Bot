import axios from 'axios';

export function getAuthHeader() {
    const token = localStorage.getItem("jwt_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function refreshToken() {
    try {
        const token = localStorage.getItem("jwt_token");
        if (!token) {
            throw new Error("No token available for refresh");
        }

        const response = await axios.post('http://localhost:5000/refresh-token', {}, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const { token: newToken, user } = response.data;
        localStorage.setItem('jwt_token', newToken);
        localStorage.setItem('loggedInUser', JSON.stringify(user));
        window.dispatchEvent(new Event('user-auth-change'));

        return newToken;
    } catch (error) {
        console.error('Token refresh failed:', error);
        // If refresh fails, redirect to login
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('loggedInUser');
        window.location.href = '/login';
        throw error;
    }
}

export async function makeAuthenticatedRequest(requestFn) {
    try {
        return await requestFn();
    } catch (error) {
        if (error.response && error.response.status === 401) {
            console.log('Token expired, attempting refresh...');
            try {
                await refreshToken();
                // Retry the request with new token
                return await requestFn();
            } catch (refreshError) {
                console.error('Token refresh failed, redirecting to login');
                throw refreshError;
            }
        }
        throw error;
    }
}
  