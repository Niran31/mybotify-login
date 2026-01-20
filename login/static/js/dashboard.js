// Protect dashboard
const token = localStorage.getItem("token");
if (!token) {
    window.location.href = "/login";
}

// Dashboard JavaScript for MyBotify

const API_BASE_URL = '/api';

document.addEventListener('DOMContentLoaded', function () {
    // Check authentication
    checkAuth();

    // Load user data
    loadUserData();

    // User menu toggle
    const userMenuBtn = document.getElementById("userMenuBtn");
    const userDropdown = document.getElementById("userDropdown");

    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle("show");
        });

        // Close dropdown when clicking outside
        document.addEventListener("click", (e) => {
            if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove("show");
            }
        });
    }

    // Mobile menu toggle (hamburger menu)
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const mobileDropdown = document.getElementById("mobileDropdown");
    const closeMenuBtn = document.getElementById("closeMenu");

    if (mobileMenuBtn && mobileDropdown) {
        // Open mobile menu
        mobileMenuBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            mobileDropdown.classList.toggle("active");
        });

        // Close button
        if (closeMenuBtn) {
            closeMenuBtn.addEventListener("click", () => {
                mobileDropdown.classList.remove("active");
            });
        }

        // Close mobile menu when clicking outside
        document.addEventListener("click", (e) => {
            if (!mobileMenuBtn.contains(e.target) && !mobileDropdown.contains(e.target)) {
                mobileDropdown.classList.remove("active");
            }
        });
    }


    // Chat functionality
    const sendChatBtn = document.getElementById('sendChatBtn');
    const chatInput = document.getElementById('chatInput');

    if (sendChatBtn) {
        sendChatBtn.addEventListener('click', sendChatMessage);
    }

    if (chatInput) {
        chatInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }

    // Account search
    const accountSearch = document.getElementById('accountSearch');
    if (accountSearch) {
        accountSearch.addEventListener('input', filterAccounts);
    }
});

// Check if user is authenticated
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
        window.location.href = '/login';
        return;
    }

    // Verify token with backend
    verifyToken(token);
}

// Verify token validity
async function verifyToken(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/verify-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            // Token invalid, redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Token verification error:', error);
    }
}

// Load user data from localStorage
function loadUserData() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);

        // Update UI with user data
        document.getElementById('userName').textContent = user.name || 'User';
        document.getElementById('dropdownName').textContent = user.name || 'User';
        document.getElementById('dropdownEmail').textContent = user.email || '';
        document.getElementById('accountEmail').textContent = user.email || '';
    }
}

// Handle logout
function handleLogout(e) {
    e.preventDefault();

    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    showAlert('Logged out successfully', 'success');

    setTimeout(() => {
        window.location.href = '/login';
    }, 1000);
}

document.addEventListener("DOMContentLoaded", () => {
    const sidebarLinks = document.querySelectorAll(".sidebar-link");
    const sections = document.querySelectorAll(".dashboard-section");

    sidebarLinks.forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();

            const target = link.dataset.section;

            // Remove active from all links
            sidebarLinks.forEach(l => l.classList.remove("active"));

            // Hide all sections
            sections.forEach(sec => sec.classList.remove("active"));

            // Activate clicked link
            link.classList.add("active");

            // Show correct section
            document.getElementById(target).classList.add("active");
        });
    });
});


// Send chat message
function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const message = chatInput.value.trim();

    if (!message) return;

    // Add user message to chat
    const userMessage = document.createElement('div');
    userMessage.className = 'chat-message user-message';
    userMessage.innerHTML = `<p>${message}</p>`;
    chatMessages.appendChild(userMessage);

    // Clear input
    chatInput.value = '';

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Simulate bot response (in production, this would call an API)
    setTimeout(() => {
        const botMessage = document.createElement('div');
        botMessage.className = 'chat-message bot-message';
        botMessage.innerHTML = `<p>Thanks for your message! I'm here to help optimize your campaigns. This is a demo response.</p>`;
        chatMessages.appendChild(botMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1000);
}

// Filter accounts based on search
function filterAccounts() {
    const searchTerm = document.getElementById('accountSearch').value.toLowerCase();
    const accountCards = document.querySelectorAll('.account-card');

    accountCards.forEach(card => {
        const email = card.querySelector('.account-email').textContent.toLowerCase();
        if (email.includes(searchTerm)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

// Alert notification function
function showAlert(message, type = 'info') {
    let alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'alertContainer';
        document.body.appendChild(alertContainer);
    }

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <span>${getAlertIcon(type)}</span>
        <span>${message}</span>
    `;

    alertContainer.appendChild(alert);

    setTimeout(() => {
        alert.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

function getAlertIcon(type) {
    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠'
    };
    return icons[type] || icons.info;
}

// Fetch user accounts (example)
async function fetchUserAccounts() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_BASE_URL}/user/accounts`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            displayAccounts(data.accounts);
        }
    } catch (error) {
        console.error('Error fetching accounts:', error);
    }
}

function displayAccounts(accounts) {
    const accountList = document.querySelector('.account-list');
    accountList.innerHTML = '';

    accounts.forEach(account => {
        const card = document.createElement('div');
        card.className = 'account-card';
        card.innerHTML = `
            <div class="account-info">
                <span class="account-email">${account.email}</span>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="viewAccount('${account.id}')">Account</button>
        `;
        accountList.appendChild(card);
    });
}

function viewAccount(accountId) {
    showAlert('Account details coming soon!', 'info');
}



// ===============================
// USER PROFILE DROPDOWN
// ===============================
const userMenuBtn = document.getElementById('userMenuBtn');
const userDropdown = document.getElementById('userDropdown');
const logoutBtn = document.getElementById('logoutBtn');

// Toggle dropdown
userMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle('show');
});


// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!userDropdown.contains(e.target) && !userMenuBtn.contains(e.target)) {
        userDropdown.classList.remove('show');
    }
});


