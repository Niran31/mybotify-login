// Authentication JavaScript for MyBotify

const API_BASE_URL = '/api';

document.addEventListener('DOMContentLoaded', function () {
    // Tab switching functionality
    const authTabs = document.querySelectorAll('.auth-tab');
    authTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const tabName = this.getAttribute('data-tab');
            if (tabName === 'login') {
                window.location.href = '/login';
            } else if (tabName === 'signup') {
                window.location.href = '/signup';
            }
        });
    });

    // Password toggle functionality
    const togglePasswordIcons = document.querySelectorAll('.toggle-password');
    togglePasswordIcons.forEach(icon => {
        icon.addEventListener('click', function () {
            const input = this.parentElement.querySelector('input');
            if (input.type === 'password') {
                input.type = 'text';
                this.textContent = '👁️‍🗨️';
            } else {
                input.type = 'password';
                this.textContent = '👁️';
            }
        });
    });

    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Signup form submission
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }

    // Forgot password form submission
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    }

    // Resend verification email
    const resendBtn = document.getElementById('resendBtn');
    if (resendBtn) {
        resendBtn.addEventListener('click', handleResendVerification);
    }

    // Social login buttons
    const socialBtns = document.querySelectorAll('.social-btn');
    socialBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const provider = this.classList.contains('google') ? 'Google' :
                this.classList.contains('facebook') ? 'Facebook' : 'Twitter';
            showAlert(`${provider} login coming soon!`, 'info');
        });
    });
});

// Signup handler - FIXED VERSION
async function handleSignup(e) {
    e.preventDefault();
    
    console.log('Signup form submitted');

    // Get form values - FIXED: use correct IDs from your HTML
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;  // Changed from 'signup-email'
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;  // Changed from 'signup-password'
    const terms = document.getElementById('terms').checked;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    console.log('Form data:', { name, email, phone, password: '***', terms });

    // Validation
    if (!name || !email || !phone || !password) {
        showAlert('Please fill in all fields', 'error');
        return;
    }

    if (!terms) {
        showAlert('Please agree to the Terms & Conditions', 'error');
        return;
    }

    if (password.length < 6) {
        showAlert('Password must be at least 6 characters long', 'error');
        return;
    }

    // Disable button and show loading
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<span class="loading"></span> Creating account...';

    try {
        console.log('Sending signup request to:', `${API_BASE_URL}/signup`);
        
        const response = await fetch(`${API_BASE_URL}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, phone, password })
        });

        console.log('Response status:', response.status);
        
        let data = {};
        try {
            data = await response.json();
            console.log('Response data:', data);
        } catch (jsonErr) {
            console.error('Failed to parse JSON:', jsonErr);
        }

        if (response.ok) {
            showOtpModal(email);   // ✅ popup
        } else {
            // Handle error response
            let errorMessage = 'Signup failed. Please try again.';
            
            if (data.message) {
                errorMessage = data.message;
            } else if (response.status === 400) {
                errorMessage = 'Invalid input. Please check your details.';
            } else if (response.status === 409) {
                errorMessage = 'Email already exists. Please login or use a different email.';
            } else if (response.status === 500) {
                errorMessage = 'Server error. Please try again later.';
            }
            
            showAlert(errorMessage, 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    } catch (error) {
        console.error('Signup error:', error);
        showAlert(`Network error: ${error.message}. Please check your connection.`, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

async function verifySignupOtp() {
  const otp = document.getElementById("otpInput").value;

  const res = await fetch("/api/signup-verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: signupEmail,
      otp: otp
    })
  });

  const data = await res.json();

  if (res.ok) {
    showAlert("Email verified! Please login.", "success");
    window.location.href = "/login";
  } else {
    showAlert(data.message || "Invalid OTP", "error");
  }
}



// Login handler
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    if (!email || !password) {
        showAlert('Please enter email and password', 'error');
        return;
    }

    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<span class="loading"></span> Logging in...';

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        // ✅ READ JSON ONLY ONCE
        const data = await response.json();
        console.log('Login response:', data);

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // 🚀 SUCCESS REDIRECT
            window.location.href = '/dashboard';
        } else {
            showAlert(data.message || 'Invalid email or password', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }

    } catch (error) {
        console.error('Login error:', error);
        showAlert('Network error. Please try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}


// Forgot password handler
async function handleForgotPassword(e) {
    e.preventDefault();

    const email = document.getElementById('reset-email').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    if (!email) {
        showAlert('Please enter your email', 'error');
        return;
    }

    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<span class="loading"></span> Sending...';

    try {
        const response = await fetch(`${API_BASE_URL}/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Password reset link sent! Check your email.', 'success');
            
            // Show success modal if it exists
            const successModal = document.getElementById('successModal');
            if (successModal) {
                successModal.style.display = 'flex';
            }
        } else {
            showAlert(data.message || 'Failed to send reset link', 'error');
        }

        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    } catch (error) {
        console.error('Forgot password error:', error);
        showAlert('An error occurred. Please try again later.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

const otpForm = document.getElementById("otpForm");

if (otpForm) {
  otpForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const otp = document.getElementById("otp").value;
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");

    const res = await fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp })
    });

    const data = await res.json();

    if (res.ok) {
      alert("Email verified! Please login.");
      window.location.href = "/login";
    } else {
      alert(data.message);
    }
  });
}


// Resend verification email
async function handleResendVerification() {
    const emailElement = document.getElementById('userEmail');
    if (!emailElement) {
        showAlert('Email not found', 'error');
        return;
    }
    
    const email = emailElement.textContent;
    const btn = document.getElementById('resendBtn');

    btn.disabled = true;
    const originalText = btn.textContent;
    btn.innerHTML = '<span class="loading"></span> Sending...';

    try {
        const response = await fetch(`${API_BASE_URL}/resend-verification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Verification email sent! Please check your inbox.', 'success');
        } else {
            showAlert(data.message || 'Failed to resend email', 'error');
        }

        btn.disabled = false;
        btn.textContent = originalText;
    } catch (error) {
        console.error('Resend verification error:', error);
        showAlert('An error occurred. Please try again later.', 'error');
        btn.disabled = false;
        btn.textContent = originalText;
    }
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

    // Auto remove after 3 seconds
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

// Add slideOut animation if not already present
if (!document.querySelector('style[data-animation="slideOut"]')) {
    const style = document.createElement('style');
    style.setAttribute('data-animation', 'slideOut');
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
}

let signupEmail = "";

function showOtpModal(email) {
  signupEmail = email;
  document.getElementById("otpEmail").innerText = email;
  document.getElementById("otpModal").style.display = "flex";
}

async function resendSignupOtp() {
  await fetch("/api/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: signupEmail
    })
  });

  showAlert("OTP resent to your email", "success");
}