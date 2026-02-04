import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import robotImage from '../assets/robot.png';

export default function Home() {
    return (
        <>
            <Navbar />

            <section className="hero">
                <div className="container">
                    <div className="hero-content">
                        <div className="hero-text">
                            <h1>Empower Your <span className="highlight">Shopify</span> Store<br />With AI</h1>
                            <p className="hero-description">
                                Leverage AI to analyze customer behavior and maximize your campaign performance across multiple
                                platforms.
                            </p>

                            <div className="chatbot-section">
                                <h3>Hi there,</h3>
                                <p>I can assist you in optimizing your marketing campaigns!</p>

                                <div className="chat-input-wrapper">
                                    <input type="text" className="chat-input" placeholder="Feel free to ask me..." />
                                    <button className="chat-btn">Start</button>
                                </div>
                            </div>

                            <div className="suggestions">
                                <p className="suggestions-title">Our suggestion prompt</p>
                                <div className="suggestion-grid">
                                    <div className="suggestion-card">
                                        <div className="suggestion-icon">🎯</div>
                                        <p>How can I increase traffic to my Shopify store?</p>
                                    </div>
                                    <div className="suggestion-card">
                                        <div className="suggestion-icon">📊</div>
                                        <p>What's the best campaign strategy for my product?</p>
                                    </div>
                                    <div className="suggestion-card">
                                        <div className="suggestion-icon">⚙️</div>
                                        <p>What's the best campaign strategy for my product?</p>
                                    </div>
                                    <div className="suggestion-card">
                                        <div className="suggestion-icon">🛍️</div>
                                        <p>What's the best campaign strategy for my product?</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="hero-image">
                            <img src={robotImage} alt="Robot" className="hero-robot" />
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </>
    );
}
