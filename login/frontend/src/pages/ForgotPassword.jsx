import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAlert } from '../components/AlertContainer';
import Logo from '../components/Logo';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const { showAlert } = useAlert();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            showAlert('Email is required', 'error');
            return;
        }

        setLoading(true);
        try {
            await authAPI.forgotPassword(email);
            setShowSuccess(true);
        } catch (error) {
            showAlert(error.message || 'Failed to send reset link', 'error');
        } finally {
            setLoading(false);
        }
    };

    const closeSuccessModal = () => {
        setShowSuccess(false);
        navigate('/login');
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                {/* Logo */}
                <div className="auth-logo">
                    <Logo />
                    <span className="logo-text">MyBotify</span>
                </div>

                {/* Forgot Password Modal */}
                <div className="auth-modal">
                    <div className="modal-header">
                        <h2>Forgot your Password?</h2>
                        <p className="modal-subtitle">Enter your email address and a password reset link will be sent to you.</p>
                    </div>

                    {/* Forgot Password Form */}
                    <form id="forgotPasswordForm" className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="reset-email">Email</label>
                            <div className="input-wrapper">
                                <input
                                    type="email"
                                    id="reset-email"
                                    name="email"
                                    placeholder="Your Email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <span className="input-icon">✉️</span>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                            {loading ? 'Sending...' : 'Send reset Link'}
                        </button>

                        <div className="auth-switch">
                            Remembered your password? <Link to="/login">Back to Login</Link>
                        </div>
                    </form>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccess && (
                <div id="successModal" className="modal-overlay" style={{ display: 'flex' }}>
                    <div className="modal-content">
                        <h3>Check your email</h3>
                        <p>If this email exists, a reset link has been sent</p>
                        <button onClick={closeSuccessModal} className="btn btn-primary">OK</button>
                    </div>
                </div>
            )}
        </div>
    );
}
