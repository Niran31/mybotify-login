import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from 'recharts';



export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('account-home');
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [csvFile, setCsvFile] = useState(null);
    const [loadingAI, setLoadingAI] = useState(false);

    // AI Analysis Results - Dual Mode Support
    const [analysisMode, setAnalysisMode] = useState(null); // "predictive" or "historical"
    const [salesData, setSalesData] = useState([]);          // For historical mode (chart)
    const [topStates, setTopStates] = useState([]);          // Top/Predicted states
    const [stateScores, setStateScores] = useState({});      // For predictive mode scores
    const [aiSuggestions, setAiSuggestions] = useState([]);  // AI campaign suggestions
    const [analysisSummary, setAnalysisSummary] = useState(null); // Summary stats



    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleSectionChange = (section) => {
        setActiveSection(section);
    };

    const handleAnalyzeStore = async () => {
        if (!csvFile) {
            alert("Please upload Shopify CSV file");
            return;
        }

        setLoadingAI(true);
        // Reset all previous results
        setAnalysisMode(null);
        setSalesData([]);
        setTopStates([]);
        setStateScores({});
        setAiSuggestions([]);
        setAnalysisSummary(null);

        const formData = new FormData();
        formData.append("file", csvFile);

        try {
            // Upload CSV
            const uploadRes = await fetch("/ai/upload-csv", {
                method: "POST",
                body: formData
            });

            const uploadData = await uploadRes.json();

            if (uploadData.error) {
                alert("Upload failed: " + uploadData.error);
                setLoadingAI(false);
                return;
            }

            // Analyze CSV (auto-detects Products vs Orders)
            const analyzeRes = await fetch("/ai/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename: uploadData.filename })
            });

            const result = await analyzeRes.json();

            // Check for errors from the API
            if (result.error) {
                let errorMsg = result.error;
                if (result.tip) {
                    errorMsg += "\n\n💡 Tip: " + result.tip;
                }
                alert(errorMsg);
                setLoadingAI(false);
                return;
            }

            // Set the analysis mode
            setAnalysisMode(result.mode);
            setAiSuggestions(result.ai_suggestions || []);

            if (result.mode === "predictive") {
                // Predictive mode (Products CSV)
                setTopStates(result.predicted_states || []);
                setStateScores(result.state_scores || {});
                setAnalysisSummary(result.analysis_summary || null);
            } else {
                // Historical mode (Orders CSV)
                setTopStates(result.top_states || []);
                // Build chart data from sales_by_state
                if (result.sales_by_state) {
                    const chartData = Object.entries(result.sales_by_state).map(([state, revenue]) => ({
                        state,
                        revenue
                    }));
                    setSalesData(chartData);
                }
                setAnalysisSummary({
                    total_revenue: result.total_us_revenue,
                    states_analyzed: result.states_analyzed,
                    orders_analyzed: result.orders_analyzed
                });
            }

        } catch (err) {
            alert("AI analysis failed: " + err.message);
            console.error(err);
        }

        setLoadingAI(false);
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
                                <p>Upload your Shopify data and get AI-powered insights.</p>
                            </div>

                            <div className="account-actions">
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => setCsvFile(e.target.files[0])}
                                />
                                <button className="btn btn-primary" onClick={handleAnalyzeStore}>
                                    Analyze Store
                                </button>
                            </div>

                            {loadingAI && <p style={{ color: '#a78bfa' }}>🤖 AI is analyzing your store...</p>}

                            {/* Mode Badge */}
                            {analysisMode && (
                                <div className="account-card" style={{
                                    background: analysisMode === 'predictive'
                                        ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)'
                                        : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                                    marginTop: '1rem',
                                    border: 'none',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                                }}>
                                    <strong style={{ fontSize: '1.1rem' }}>
                                        {analysisMode === 'predictive' ? '🔮 Predictive Mode' : '📊 Historical Mode'}
                                    </strong>
                                    <span style={{ marginLeft: '1rem', opacity: 0.9 }}>
                                        {analysisMode === 'predictive'
                                            ? '(Products CSV → Market Predictions)'
                                            : '(Orders CSV → Sales Analysis)'}
                                    </span>
                                </div>
                            )}

                            {/* Analysis Summary Card */}
                            {analysisSummary && (
                                <div className="account-card" style={{
                                    marginTop: '1rem',
                                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                                    border: '1px solid #475569'
                                }}>
                                    {analysisMode === 'predictive' ? (
                                        <>
                                            <strong style={{ color: '#c4b5fd' }}>📦 Analysis Summary</strong>
                                            <p style={{ color: '#e2e8f0', marginTop: '0.5rem' }}>
                                                Products: <span style={{ color: '#a78bfa' }}>{analysisSummary.products_analyzed}</span> |
                                                Avg Price: <span style={{ color: '#34d399' }}>${analysisSummary.avg_price}</span> |
                                                Tier: <span style={{ color: '#fbbf24' }}>{analysisSummary.price_tier}</span> |
                                                Category: <span style={{ color: '#60a5fa' }}>{analysisSummary.dominant_category}</span>
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <strong style={{ color: '#6ee7b7' }}>📈 Sales Summary</strong>
                                            <p style={{ color: '#e2e8f0', marginTop: '0.5rem' }}>
                                                Revenue: <span style={{ color: '#34d399' }}>${analysisSummary.total_revenue?.toLocaleString()}</span> |
                                                States: <span style={{ color: '#60a5fa' }}>{analysisSummary.states_analyzed}</span> |
                                                Orders: <span style={{ color: '#fbbf24' }}>{analysisSummary.orders_analyzed}</span>
                                            </p>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Top/Predicted States */}
                            {topStates.length > 0 && (
                                <div style={{ marginTop: '1.5rem' }}>
                                    <h3 style={{ color: '#f1f5f9', marginBottom: '1rem' }}>
                                        {analysisMode === 'predictive' ? '🎯 Predicted High-Potential States' : '🔥 Top Performing States'}
                                    </h3>
                                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        {topStates.map((state, idx) => (
                                            <div key={state} style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                padding: '0.6rem 1.2rem',
                                                borderRadius: '12px',
                                                background: idx === 0
                                                    ? 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)'
                                                    : idx === 1
                                                        ? 'linear-gradient(135deg, #9ca3af 0%, #d1d5db 100%)'
                                                        : idx === 2
                                                            ? 'linear-gradient(135deg, #b45309 0%, #d97706 100%)'
                                                            : 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                                                color: idx < 3 ? '#1e293b' : '#fff',
                                                fontWeight: '600',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                            }}>
                                                <span style={{ marginRight: '0.5rem', fontSize: '1.1rem' }}>
                                                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '📍'}
                                                </span>
                                                {state}
                                                {analysisMode === 'predictive' && stateScores[state] && (
                                                    <span style={{
                                                        marginLeft: '0.5rem',
                                                        opacity: 0.8,
                                                        fontSize: '0.85rem'
                                                    }}>
                                                        ({stateScores[state]} pts)
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Sales Chart (Historical Mode Only) */}
                            {analysisMode === 'historical' && salesData.length > 0 && (
                                <div style={{ width: "100%", height: 300, marginTop: '1.5rem' }}>
                                    <h3 style={{ color: '#f1f5f9', marginBottom: '1rem' }}>📊 Revenue by State</h3>
                                    <ResponsiveContainer>
                                        <BarChart data={salesData}>
                                            <XAxis dataKey="state" stroke="#94a3b8" />
                                            <YAxis stroke="#94a3b8" />
                                            <Tooltip
                                                formatter={(value) => `$${value.toLocaleString()}`}
                                                contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                            />
                                            <Bar dataKey="revenue" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
                                            <defs>
                                                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#34d399" />
                                                    <stop offset="100%" stopColor="#059669" />
                                                </linearGradient>
                                            </defs>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {/* AI Suggestions */}
                            {aiSuggestions.length > 0 && (
                                <div style={{ marginTop: '1.5rem' }}>
                                    <h3 style={{ color: '#f1f5f9', marginBottom: '1rem' }}>🤖 AI Campaign Suggestions</h3>
                                    {aiSuggestions.map((text, i) => (
                                        <div key={i} className="account-card" style={{
                                            marginBottom: '0.75rem',
                                            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                                            borderLeft: '4px solid',
                                            borderImage: i === 0
                                                ? 'linear-gradient(to bottom, #f59e0b, #fbbf24) 1'
                                                : i === 1
                                                    ? 'linear-gradient(to bottom, #a855f7, #7c3aed) 1'
                                                    : i === 2
                                                        ? 'linear-gradient(to bottom, #34d399, #059669) 1'
                                                        : 'linear-gradient(to bottom, #60a5fa, #3b82f6) 1',
                                            padding: '1rem 1.25rem'
                                        }}>
                                            <span style={{ color: '#e2e8f0' }}>{text}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
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
