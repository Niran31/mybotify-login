import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('account-home');
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleSectionChange = (section) => {
        setActiveSection(section);
    };

    return (
        <div className="dashboard-page">
            {/* Navigation */}
            <nav className="navbar dashboard-nav">
                <div className="container">
                    <div className="nav-content">
                        <Link to="/" className="logo">
                            <Logo />
                            <span className="logo-text">MyBotify</span>
                        </Link>

                        <div className="nav-links">
                            <a href="#about">About us</a>
                            <a href="#channel">Channel</a>
                            <a href="#support">Support</a>
                            <div className="user-menu">
                                <button
                                    className="user-menu-btn"
                                    id="userMenuBtn"
                                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                                >
                                    <span className="user-icon">👤</span>
                                    <span id="userName">{user?.name || 'User'}</span>
                                </button>
                                {showUserDropdown && (
                                    <div className="user-dropdown" id="userDropdown" style={{ display: 'block' }}>
                                        <div className="dropdown-header">
                                            <div className="user-name" id="dropdownName">{user?.name || 'User'}</div>
                                            <div className="user-email" id="dropdownEmail">{user?.email || ''}</div>
                                        </div>
                                        <div className="dropdown-divider"></div>
                                        <Link to="/profile" className="dropdown-item">
                                            <span className="icon">👤</span>
                                            <span>View Profile</span>
                                        </Link>
                                        <div className="dropdown-divider"></div>
                                        <button className="dropdown-item logout" id="logoutBtn" onClick={handleLogout}>
                                            <span>🚪</span> Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="mobile-menu-btn" id="mobileMenuBtn" onClick={() => setShowMobileMenu(!showMobileMenu)}>
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>

                        {showMobileMenu && (
                            <div className="mobile-dropdown active" id="mobileDropdown">
                                <div className="dropdown-header">
                                    <span>Menu</span>
                                    <button id="closeMenu" onClick={() => setShowMobileMenu(false)}>✕</button>
                                </div>
                                <a href="#about" onClick={() => setShowMobileMenu(false)}>About us</a>
                                <a href="#channel" onClick={() => setShowMobileMenu(false)}>Channel</a>
                                <a href="#support" onClick={() => setShowMobileMenu(false)}>Support</a>
                                <hr />
                                <Link to="/profile" onClick={() => setShowMobileMenu(false)}>👤 View Profile</Link>
                                <button className="logout" onClick={handleLogout}>🚪 Logout</button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Main Dashboard Content */}
            <div className="dashboard-container">
                {/* Sidebar */}
                <aside className="dashboard-sidebar">
                    <nav className="sidebar-nav">
                        <a
                            href="#"
                            className={`sidebar-link ${activeSection === 'account-home' ? 'active' : ''}`}
                            onClick={(e) => { e.preventDefault(); handleSectionChange('account-home'); }}
                        >
                            <span className="sidebar-icon">🏠</span>
                            Account Home
                        </a>
                        <a
                            href="#"
                            className={`sidebar-link ${activeSection === 'online-stores' ? 'active' : ''}`}
                            onClick={(e) => { e.preventDefault(); handleSectionChange('online-stores'); }}
                        >
                            <span className="sidebar-icon">🏬</span>
                            Online Stores
                        </a>
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className="dashboard-main">
                    {/* Welcome Section with Hero Image */}
                    <div className="dashboard-hero">
                        <div className="hero-illustration">
                            <svg width="200" height="150" viewBox="0 0 200 150">
                                <circle cx="60" cy="80" r="30" fill="#E0F2FE" />
                                <circle cx="140" cy="70" r="25" fill="#DBEAFE" />
                                <rect x="75" y="60" width="50" height="60" rx="5" fill="#3B82F6" />
                                <circle cx="100" cy="50" r="15" fill="#60A5FA" />
                                <path d="M90 90 L95 95 L110 80" stroke="white" strokeWidth="3" fill="none" />
                            </svg>
                        </div>
                    </div>

                    {/* Account Home Section */}
                    {activeSection === 'account-home' && (
                        <section className="dashboard-section active" id="account-home">
                            <div className="section-header">
                                <h2>Account info</h2>
                                <p>
                                    Manage accounts to ensure a streamlined experience across all your services
                                    and the details to stay connected effortlessly.
                                </p>
                            </div>

                            <div className="account-actions">
                                <button className="btn btn-primary">+ Add Account</button>
                                <div className="search-box">
                                    <input type="text" placeholder="Search Account..." />
                                    <span className="search-icon">🔍</span>
                                </div>
                            </div>

                            <div className="account-list">
                                <div className="account-card">
                                    <span>{user?.email || 'user@example.com'}</span>
                                    <button className="btn btn-secondary btn-sm">Account</button>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Online Stores Section */}
                    {activeSection === 'online-stores' && (
                        <section className="dashboard-section active" id="online-stores">
                            <div className="section-header">
                                <h2>Online Stores</h2>
                                <p>Manage and connect your Shopify & other online stores.</p>
                            </div>

                            <div className="empty-state">
                                <p>No stores connected yet.</p>
                                <button className="btn btn-primary">+ Add Store</button>
                            </div>
                        </section>
                    )}

                    {/* Chatbot Section */}
                    <aside className="chatbot-widget">
                        <div className="chatbot-header">
                            <div className="bot-avatar">
                                <div className="bot-mini">
                                    <div className="bot-head-mini">
                                        <div className="bot-eye-mini left"></div>
                                        <div className="bot-eye-mini right"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="chatbot-title">
                                <p className="greeting">Hello</p>
                                <p className="subtitle">Let's Chat with me !</p>
                            </div>
                        </div>
                        <div className="chatbot-body">
                            <div className="chat-messages" id="chatMessages">
                                <div className="chat-message bot-message">
                                    <p>Hi! How can I help you optimize your marketing campaigns today?</p>
                                </div>
                            </div>
                            <div className="chat-input-area">
                                <input type="text" placeholder="Feel free to ask me..." id="chatInput" />
                                <button className="chat-send-btn" id="sendChatBtn">Start</button>
                            </div>
                        </div>
                    </aside>
                </main>
            </div>
        </div>
    );
}
