import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Navbar({ showAuthLinks = true, user = null, onLogout }) {
    const toggleMobileMenu = () => {
        const dropdown = document.getElementById('mobileDropdown');
        if (dropdown) {
            dropdown.classList.toggle('active');
        }
    };

    const closeMobileMenu = () => {
        const dropdown = document.getElementById('mobileDropdown');
        if (dropdown) {
            dropdown.classList.remove('active');
        }
    };

    return (
        <nav className="navbar">
            <div className="container">
                <div className="nav-content">
                    <Link to="/" className="logo">
                        <Logo />
                        <span className="logo-text">MyBotify.com</span>
                    </Link>

                    <div className="nav-links" id="navLinks">
                        <a href="#about">About us</a>
                        <a href="#channel">Channel</a>
                        <a href="#support">Support</a>
                        {showAuthLinks && !user && (
                            <>
                                <Link to="/login" className="nav-link-secondary">Log in</Link>
                                <Link to="/signup" className="btn btn-primary">Sign up</Link>
                            </>
                        )}
                        {user && (
                            <div className="user-menu">
                                <button className="user-menu-btn" id="userMenuBtn">
                                    <span className="user-icon">👤</span>
                                    <span>{user.name}</span>
                                </button>
                                <div className="user-dropdown" id="userDropdown">
                                    <div className="dropdown-header">
                                        <div className="user-name">{user.name}</div>
                                        <div className="user-email">{user.email}</div>
                                    </div>
                                    <div className="dropdown-divider"></div>
                                    <Link to="/profile" className="dropdown-item">
                                        <span className="icon">👤</span>
                                        <span>View Profile</span>
                                    </Link>
                                    <div className="dropdown-divider"></div>
                                    <button className="dropdown-item logout" onClick={onLogout}>
                                        <span>🚪</span> Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mobile-menu-btn" id="mobileMenuBtn" onClick={toggleMobileMenu}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>

                    <div className="mobile-dropdown" id="mobileDropdown">
                        <div className="dropdown-header">
                            <span>Menu</span>
                            <button id="closeMenu" onClick={closeMobileMenu}>✕</button>
                        </div>
                        <a href="#about" onClick={closeMobileMenu}>About us</a>
                        <a href="#channel" onClick={closeMobileMenu}>Channel</a>
                        <a href="#support" onClick={closeMobileMenu}>Support</a>
                        <hr />
                        {!user ? (
                            <>
                                <Link to="/login" className="login-link" onClick={closeMobileMenu}>Login</Link>
                                <Link to="/signup" className="btn btn-primary" onClick={closeMobileMenu}>Sign up</Link>
                            </>
                        ) : (
                            <>
                                <Link to="/profile" onClick={closeMobileMenu}>👤 View Profile</Link>
                                <button className="logout" onClick={() => { closeMobileMenu(); onLogout?.(); }}>🚪 Logout</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
