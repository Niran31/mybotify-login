// API Service Layer for MyBotify
const API_BASE = '/api';

// Helper to get auth token from localStorage
const getToken = () => localStorage.getItem('token');

// Helper for API requests
async function apiRequest(endpoint, options = {}) {
    const token = getToken();

    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
        },
    };

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'An error occurred');
    }

    return data;
}

// Auth APIs
export const authAPI = {
    login: (email, password) =>
        apiRequest('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),

    signup: (name, email, phone, password) =>
        apiRequest('/signup', {
            method: 'POST',
            body: JSON.stringify({ name, email, phone, password }),
        }),

    signupVerify: (email, otp) =>
        apiRequest('/signup-verify', {
            method: 'POST',
            body: JSON.stringify({ email, otp }),
        }),

    verifyOtp: (email, otp) =>
        apiRequest('/verify-otp', {
            method: 'POST',
            body: JSON.stringify({ email, otp }),
        }),

    forgotPassword: (email) =>
        apiRequest('/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        }),

    resetPassword: (token, password) =>
        apiRequest('/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, password }),
        }),

    verifyToken: () =>
        apiRequest('/verify-token', {
            method: 'POST',
        }),
};

// User APIs
export const userAPI = {
    getProfile: () => apiRequest('/user/profile'),
};

export default { authAPI, userAPI };
