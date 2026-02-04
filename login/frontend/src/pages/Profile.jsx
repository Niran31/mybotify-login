import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../components/AlertContainer';
import Logo from '../components/Logo';

export default function Profile() {
    const { user, logout } = useAuth();
    const { showAlert } = useAlert();
    const navigate = useNavigate();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const [name, setName] = useState(user?.name || '');
    const [organization, setOrganization] = useState('');
    const [phone, setPhone] = useState(user?.phone || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleUpdateProfile = (e) => {
        e.preventDefault();
        showAlert('Profile updated successfully!', 'success');
    };

    return (
        <div className="profile-page">
            {/* Navigation */}
            <nav className="navbar">
                <div className="container">
                    <div className="nav-content">
                        <Link to="/" className="logo">
                            <Logo />
                            <span className="logo-text">MyBotify</span>
                        </Link>

                        <div className="nav-links">
                            <a href="#">About us</a>
                            <a href="#">Channel</a>
                            <a href="#">Support</a>
                            <div className="user-menu">
                                <button
                                    className="user-menu-btn"
                                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                                >
                                    <span className="user-icon">👤</span>
                                    <span>{user?.name || 'User'}</span>
                                </button>
                                {showProfileMenu && (
                                    <div className="user-dropdown" style={{ display: 'block' }}>
                                        <div className="dropdown-header">
                                            <div className="user-name">{user?.name || 'User'}</div>
                                            <div className="user-email">{user?.email || ''}</div>
                                        </div>
                                        <div className="dropdown-divider"></div>
                                        <Link to="/dashboard" className="dropdown-item">
                                            <span className="icon">🏠</span>
                                            <span>Dashboard</span>
                                        </Link>
                                        <div className="dropdown-divider"></div>
                                        <button className="dropdown-item logout" onClick={handleLogout}>
                                            <span>🚪</span> Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mobile-menu-btn" onClick={() => setShowMobileMenu(!showMobileMenu)}>
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>

                        {showMobileMenu && (
                            <div className="mobile-dropdown active">
                                <div className="dropdown-header">
                                    <span>Menu</span>
                                    <button onClick={() => setShowMobileMenu(false)}>✕</button>
                                </div>
                                <a href="#" onClick={() => setShowMobileMenu(false)}>About us</a>
                                <a href="#" onClick={() => setShowMobileMenu(false)}>Channel</a>
                                <a href="#" onClick={() => setShowMobileMenu(false)}>Support</a>
                                <hr />
                                <Link to="/dashboard" onClick={() => setShowMobileMenu(false)}>🏠 Dashboard</Link>
                                <button className="logout" onClick={handleLogout}>🚪 Logout</button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <div className="layout">
                {/* Main Content */}
                <main className="content">
                    <h1>Profile</h1>
                    <p className="subtitle">
                        Customize your MyBotify experience by effortlessly managing your profile.
                    </p>

                    <div className="profile-card">
                        <h2>Edit Profile</h2>

                        <form onSubmit={handleUpdateProfile}>
                            <div className="grid">
                                <div className="field">
                                    <label>Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>

                                <div className="field">
                                    <label>Organization (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="Your Organization Name"
                                        value={organization}
                                        onChange={(e) => setOrganization(e.target.value)}
                                    />
                                </div>

                                <div className="field">
                                    <label>Email</label>
                                    <div className="email-box">
                                        <input type="email" value={user?.email || ''} readOnly />
                                        <span className="verified">✔</span>
                                    </div>
                                </div>

                                <div className="field">
                                    <label>Phone Number</label>
                                    <div className="phone-box">
                                        <select>
                                            <option>+91</option>
                                        </select>
                                        <input
                                            type="text"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <h3>Change Password</h3>

                            <div className="passwords">
                                <input
                                    type="password"
                                    placeholder="Current password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                />
                                <input
                                    type="password"
                                    placeholder="New password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                                <input
                                    type="password"
                                    placeholder="Re-type new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>

                            <div className="actions">
                                <button type="button" className="btn cancel" onClick={() => navigate('/dashboard')}>Cancel</button>
                                <button type="submit" className="btn primary">Update Profile</button>
                            </div>
                        </form>
                    </div>

                    <footer>
                        Terms of use &nbsp;|&nbsp; Privacy policy &nbsp;|&nbsp; ©2025 MyBotify.com
                    </footer>
                </main>
            </div>
        </div>
    );
}
