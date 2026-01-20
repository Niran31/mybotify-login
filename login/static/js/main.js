// Main JavaScript for MyBotify Homepage

document.addEventListener('DOMContentLoaded', function() {
    // Mobile dropdown menu
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const mobileDropdown = document.getElementById('mobileDropdown');
    const closeMenu = document.getElementById('closeMenu');

    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        mobileDropdown.classList.toggle('active');
    });

    closeMenu.addEventListener('click', () => {
        mobileDropdown.classList.remove('active');
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!mobileDropdown.contains(e.target) && !menuBtn.contains(e.target)) {
            mobileDropdown.classList.remove('active');
        }
    });


    // Chat input functionality
    const chatInput = document.querySelector('.chat-input');
    const chatBtn = document.querySelector('.chat-btn');
    
    if (chatBtn) {
        chatBtn.addEventListener('click', handleChatSubmit);
    }
    
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleChatSubmit();
            }
        });
    }

    // Suggestion cards click
    const suggestionCards = document.querySelectorAll('.suggestion-card');
    suggestionCards.forEach(card => {
        card.addEventListener('click', function() {
            const questionText = this.querySelector('p').textContent;
            if (chatInput) {
                chatInput.value = questionText;
                chatInput.focus();
            }
        });
    });

    function handleChatSubmit() {
        const message = chatInput.value.trim();
        if (message) {
            console.log('Chat message:', message);
            // Here you can add chat functionality or redirect to login
            showAlert('Please login to use the chat feature', 'info');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        }
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Alert notification function
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer') || createAlertContainer();
    
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

function createAlertContainer() {
    const container = document.createElement('div');
    container.id = 'alertContainer';
    document.body.appendChild(container);
    return container;
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

// Add slideOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
