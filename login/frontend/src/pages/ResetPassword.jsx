import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAlert } from '../components/AlertContainer';
import Logo from '../components/Logo';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const { showAlert } = useAlert();
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            showAlert('Invalid or missing reset token', 'error');
        }
    }, [token, showAlert]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            showAlert('Passwords do not match', 'error');
            return;
        }

        if (password.length < 6) {
            showAlert('Password must be at least 6 characters', 'error');
            return;
        }

        setLoading(true);
        try {
            await authAPI.resetPassword(token, password);
            setShowSuccess(true);
        } catch (error) {
            showAlert(error.message || 'Failed to reset password', 'error');
        } finally {
            setLoading(false);
        }
    };

    const goToLogin = () => {
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

                {/* Reset Password Modal */}
                <div className="auth-modal">
                    <div className="modal-header">
                        <h2>Reset Your Password</h2>
                        <p className="modal-subtitle">Enter your new password below.</p>
                    </div>

                    {/* Reset Password Form */}
                    <form id="resetPasswordForm" className="auth-form" onSubmit={handleSubmit}>
                        <input type="hidden" id="reset-token" name="token" value={token || ''} />

                        <div className="form-group">
                            <label htmlFor="new-password">New Password</label>
                            <div className="input-wrapper">
                                <input
                                    type="password"
                                    id="new-password"
                                    name="password"
                                    placeholder="Enter new password"
                                    required
                                    minLength="6"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <span className="input-icon">🔒</span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirm-password">Confirm Password</label>
                            <div className="input-wrapper">
                                <input
                                    type="password"
                                    id="confirm-password"
                                    name="confirm_password"
                                    placeholder="Confirm new password"
                                    required
                                    minLength="6"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                <span className="input-icon">🔒</span>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary btn-full" disabled={loading || !token}>
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>

                        <div className="auth-switch">
                            <Link to="/login">Back to Login</Link>
                        </div>
                    </form>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccess && (
                <div id="successModal" className="modal-overlay" style={{ display: 'flex' }}>
                    <div className="modal-content">
                        <h3>Password Reset Successful!</h3>
                        <p>Your password has been updated. You can now login with your new password.</p>
                        <button onClick={goToLogin} className="btn btn-primary">Go to Login</button>
                    </div>
                </div>
            )}
        </div>
    );
}
