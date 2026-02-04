import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAlert } from '../components/AlertContainer';
import Navbar from '../components/Navbar';
import Logo from '../components/Logo';
import robotImage from '../assets/robot.png';

export default function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [terms, setTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otp, setOtp] = useState('');
    const { showAlert } = useAlert();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name || !email || !phone || !password) {
            showAlert('All fields are required', 'error');
            return;
        }

        if (!terms) {
            showAlert('Please accept the terms and conditions', 'error');
            return;
        }

        setLoading(true);
        try {
            await authAPI.signup(name, email, phone, password);
            showAlert('OTP sent to your email!', 'success');
            setShowOtpModal(true);
        } catch (error) {
            showAlert(error.message || 'Signup failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length !== 6) {
            showAlert('Please enter a valid 6-digit OTP', 'error');
            return;
        }

        setLoading(true);
        try {
            await authAPI.signupVerify(email, otp);
            showAlert('Signup successful! Please login.', 'success');
            navigate('/login');
        } catch (error) {
            showAlert(error.message || 'Invalid OTP', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        try {
            await authAPI.signup(name, email, phone, password);
            showAlert('OTP resent!', 'success');
        } catch (error) {
            showAlert(error.message || 'Failed to resend OTP', 'error');
        }
    };

    return (
        <div className="signup-page">
            <Navbar />

            <div className="signup-wrapper">
                <div className="signup-container-grid">
                    <div className="signup-form-section">
                        <div className="form-content">
                            <h1 className="signup-title">Get Started with MyBotify</h1>
                            <p className="signup-subtitle">
                                Power up your Shopify campaigns with AI-driven automation. Sign up in seconds!<br />
                                Already have an account <Link to="/login" className="link-primary">Log in</Link>.
                            </p>

                            <div className="auth-tabs">
                                <Link to="/login" className="auth-tab">Login</Link>
                                <Link to="/signup" className="auth-tab active">Sign Up</Link>
                            </div>

                            <form id="signupForm" className="signup-form" onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label htmlFor="name">Name</label>
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            placeholder="Enter your Full Name"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                        <span className="input-icon" aria-hidden="true">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                                <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Z" stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M4.5 20.4c0-3.094 2.499-5.6 5.584-5.6h3.832C16.999 14.8 19.5 17.306 19.5 20.4" stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round" />
                                            </svg>
                                        </span>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email">Email</label>
                                    <div className="input-group">
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            placeholder="Your email address"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                        <span className="input-icon" aria-hidden="true">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                                <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="m4 7 8 5 8-5" stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </span>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="phone">Phone Number</label>
                                    <div className="input-group">
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            placeholder="Your contact Number"
                                            required
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                        />
                                        <span className="input-icon" aria-hidden="true">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                                <path d="M17.5 15.5c-1.3 1.3-2.5 2-3.5 2.5-1 .5-2 .5-3.5-.5s-3-2.5-4-4-1-2.5-.5-3.5C7 8.5 7.7 7.3 9 6M13 4l1-1c.666-.667 1.334-.667 2 0l2 2c.666.666.666 1.333 0 2l-1 1c-.667.667-1.333.667-2 0l-2-2c-.666-.666-.666-1.333 0-2Z" stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M12 12.5 8.5 9" stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round" />
                                            </svg>
                                        </span>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="password">Password</label>
                                    <div className="input-group">
                                        <input
                                            type="password"
                                            id="password"
                                            name="password"
                                            placeholder="Secure account with Password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <span className="input-icon" aria-hidden="true">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                                <rect x="4" y="10" width="16" height="10" rx="2" stroke="#9CA3AF" strokeWidth="1.6" />
                                                <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round" />
                                                <circle cx="12" cy="14" r="1" fill="#9CA3AF" />
                                            </svg>
                                        </span>
                                    </div>
                                </div>

                                <div className="form-checkbox">
                                    <input
                                        type="checkbox"
                                        id="terms"
                                        name="terms"
                                        required
                                        checked={terms}
                                        onChange={(e) => setTerms(e.target.checked)}
                                    />
                                    <label htmlFor="terms">
                                        I agree to the <a href="#" className="link-primary">Terms & Conditions</a> and <a href="#" className="link-primary">Privacy Policy</a>
                                    </label>
                                </div>

                                <button type="submit" className="btn btn-submit" disabled={loading}>
                                    {loading ? 'Loading...' : 'Sign up'}
                                </button>

                                <div className="form-divider">
                                    <span>or Continue with</span>
                                </div>

                                <div className="social-buttons">
                                    <button type="button" className="social-btn">
                                        <svg width="20" height="20" viewBox="0 0 20 20">
                                            <path fill="#4285F4" d="M19.6 10.23c0-.82-.1-1.42-.25-2.05H10v3.72h5.5c-.15.96-.74 2.31-2.04 3.22v2.45h3.16c1.89-1.73 2.98-4.3 2.98-7.34z" />
                                            <path fill="#34A853" d="M13.46 15.13c-.83.59-1.96 1-3.46 1-2.64 0-4.88-1.74-5.68-4.15H1.07v2.52C2.72 17.75 6.09 20 10 20c2.7 0 4.96-.89 6.62-2.42l-3.16-2.45z" />
                                            <path fill="#FBBC05" d="M3.99 10c0-.69.12-1.35.32-1.97V5.51H1.07A9.973 9.973 0 000 10c0 1.61.39 3.14 1.07 4.49l3.24-2.52c-.2-.62-.32-1.28-.32-1.97z" />
                                            <path fill="#EA4335" d="M10 3.88c1.88 0 3.13.81 3.85 1.48l2.84-2.76C14.96.99 12.7 0 10 0 6.09 0 2.72 2.25 1.07 5.51l3.24 2.52C5.12 5.62 7.36 3.88 10 3.88z" />
                                        </svg>
                                    </button>
                                    <button type="button" className="social-btn">
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="#1877F2">
                                            <path d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" />
                                        </svg>
                                    </button>
                                    <button type="button" className="social-btn">
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="#000">
                                            <path d="M15.751 2h2.872l-6.274 7.172L19.5 18h-5.78l-4.526-5.92L3.894 18H1.02l6.712-7.672L1 2h5.926l4.093 5.413L15.751 2zm-1.008 14.386h1.591L6.376 3.615H4.67l10.073 12.771z" />
                                        </svg>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="signup-bot-section">
                        <div className="bot-display">
                            <div className="speech-bubble">Hi there 👋</div>
                            <img className="bot-img" src={robotImage} alt="Friendly robot" />
                        </div>
                    </div>
                </div>
            </div>

            {/* OTP Modal */}
            {showOtpModal && (
                <div id="otpModal" className="otp-overlay" style={{ display: 'flex' }}>
                    <div className="otp-card">
                        <h2>Verify your Email</h2>
                        <p>We sent a 6-digit OTP to <b id="otpEmail">{email}</b></p>

                        <input
                            type="text"
                            id="otpInput"
                            placeholder="Enter OTP"
                            maxLength="6"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                        />

                        <button onClick={handleVerifyOtp} disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>

                        <p className="resend" onClick={handleResendOtp} style={{ cursor: 'pointer' }}>Resend OTP</p>
                    </div>
                </div>
            )}
        </div>
    );
}
