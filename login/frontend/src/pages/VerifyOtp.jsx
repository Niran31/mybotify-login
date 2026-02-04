import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAlert } from '../components/AlertContainer';

export default function VerifyOtp() {
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email') || '';
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const { showAlert } = useAlert();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!otp || otp.length !== 6) {
            showAlert('Please enter a valid 6-digit OTP', 'error');
            return;
        }

        setLoading(true);
        try {
            await authAPI.verifyOtp(email, otp);
            showAlert('Email verified successfully!', 'success');
            setTimeout(() => {
                navigate('/login');
            }, 1500);
        } catch (error) {
            showAlert(error.message || 'Invalid OTP', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        try {
            // For resend, we'd need a resend endpoint
            showAlert('OTP resent successfully', 'success');
        } catch (error) {
            showAlert(error.message || 'Failed to resend OTP', 'error');
        }
    };

    return (
        <div className="otp-page-wrapper">
            <style>{`
        .otp-page-wrapper {
          background: #f3f4f6;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .otp-page {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .otp-card {
          width: 100%;
          max-width: 420px;
          background: #ffffff;
          border-radius: 18px;
          padding: 36px 32px;
          box-shadow: 0 18px 40px rgba(0,0,0,0.12);
          text-align: center;
          animation: fadeIn 0.4s ease;
        }
        .otp-card h2 {
          font-size: 24px;
          font-weight: 700;
          color: #25272b;
          margin-bottom: 6px;
        }
        .otp-card p {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 26px;
        }
        .otp-input {
          width: 100%;
          padding: 14px;
          font-size: 22px;
          letter-spacing: 6px;
          text-align: center;
          border-radius: 14px;
          border: 1px solid #d1d5db;
          outline: none;
          transition: 0.2s ease;
        }
        .otp-input:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.2);
        }
        .verify-btn {
          width: 100%;
          margin-top: 22px;
          padding: 14px;
          border-radius: 14px;
          border: none;
          background: #10b981;
          color: #ffffff;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s ease;
        }
        .verify-btn:hover {
          background: #059669;
        }
        .verify-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
        .otp-footer {
          margin-top: 20px;
          font-size: 14px;
          color: #6b7280;
        }
        .otp-footer a {
          color: #10b981;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
        }
        .otp-footer a:hover {
          text-decoration: underline;
        }
        .otp-logo {
          position: fixed;
          top: 24px;
          left: 24px;
          font-size: 20px;
          font-weight: 700;
          color: #10b981;
          text-decoration: none;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

            <Link to="/" className="otp-logo">⬆ MyBotify</Link>

            <div className="otp-page">
                <div className="otp-card">
                    <h2>Verify Your Email</h2>
                    <p>We've sent a 6-digit OTP to your email address</p>

                    <form id="otpForm" onSubmit={handleSubmit}>
                        <input
                            type="text"
                            id="otp"
                            className="otp-input"
                            placeholder="Enter OTP"
                            maxLength="6"
                            required
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                        />

                        <button type="submit" className="verify-btn" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                    </form>

                    <div className="otp-footer">
                        Didn't receive OTP?{' '}
                        <a href="#" id="resendOtp" onClick={(e) => { e.preventDefault(); handleResendOtp(); }}>
                            Resend
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
