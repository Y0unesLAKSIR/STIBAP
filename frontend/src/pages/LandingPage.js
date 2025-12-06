import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    useEffect(() => {
        // If user is logged in, redirect to home
        if (!loading && user) {
            navigate('/home', { replace: true });
        }
    }, [user, loading, navigate]);

    const styles = {
        container: {
            minHeight: '100vh',
            fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            backgroundColor: '#ffffff',
            color: '#1f2937',
        },
        nav: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 40px',
            maxWidth: '1200px',
            margin: '0 auto',
        },
        logo: {
            fontSize: '1.5rem',
            fontWeight: '800',
            color: '#4f46e5',
            letterSpacing: '-0.025em',
        },
        navLinks: {
            display: 'flex',
            gap: '24px',
        },
        navLink: {
            textDecoration: 'none',
            color: '#4b5563',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'color 0.2s',
        },
        hero: {
            textAlign: 'center',
            padding: '80px 20px',
            maxWidth: '1000px',
            margin: '0 auto',
        },
        heroTitle: {
            fontSize: '3.5rem',
            fontWeight: '800',
            lineHeight: '1.2',
            marginBottom: '24px',
            background: 'linear-gradient(to right, #4f46e5, #9333ea)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
        },
        heroSubtitle: {
            fontSize: '1.25rem',
            color: '#6b7280',
            marginBottom: '40px',
            maxWidth: '700px',
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: '1.6',
        },
        ctaButton: {
            backgroundColor: '#4f46e5',
            color: 'white',
            padding: '16px 32px',
            fontSize: '1.1rem',
            fontWeight: '600',
            border: 'none',
            borderRadius: '50px',
            cursor: 'pointer',
            boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)',
            transition: 'transform 0.2s, box-shadow 0.2s',
        },
        featuresSection: {
            backgroundColor: '#f9fafb',
            padding: '80px 20px',
        },
        sectionTitle: {
            textAlign: 'center',
            fontSize: '2.25rem',
            fontWeight: '700',
            marginBottom: '60px',
            color: '#111827',
        },
        featuresGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '40px',
            maxWidth: '1200px',
            margin: '0 auto',
        },
        featureCard: {
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            transition: 'transform 0.2s',
        },
        featureIcon: {
            fontSize: '3rem',
            marginBottom: '20px',
            display: 'inline-block',
        },
        featureTitle: {
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '12px',
            color: '#1f2937',
        },
        featureText: {
            color: '#6b7280',
            lineHeight: '1.5',
        },
        footer: {
            textAlign: 'center',
            padding: '40px',
            borderTop: '1px solid #e5e7eb',
            color: '#9ca3af',
            fontSize: '0.9rem',
        }
    };

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⏳</div>
                    <p style={{ color: '#6b7280' }}>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Navigation */}
            <nav style={styles.nav}>
                <div style={styles.logo}>STIBAP</div>
                <div style={styles.navLinks}>
                    <button
                        onClick={() => navigate('/login')}
                        style={{ ...styles.navLink, background: 'none', border: 'none', fontSize: '1rem' }}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => navigate('/register')}
                        style={{
                            ...styles.navLink,
                            background: '#4f46e5',
                            color: 'white',
                            padding: '8px 20px',
                            borderRadius: '20px',
                            border: 'none'
                        }}
                    >
                        Get Started
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <header style={styles.hero}>
                <h1 style={styles.heroTitle}>
                    Master Your Learning with<br />Intelligent Tutoring
                </h1>
                <p style={styles.heroSubtitle}>
                    An AI-powered platform that analyzes your performance, identifies your strengths,
                    and personalizes your path to success.
                </p>
                <button
                    style={styles.ctaButton}
                    onClick={() => navigate('/register')}
                    onMouseOver={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 20px 25px -5px rgba(79, 70, 229, 0.5)';
                    }}
                    onMouseOut={(e) => {
                        e.target.style.transform = 'none';
                        e.target.style.boxShadow = '0 10px 25px -5px rgba(79, 70, 229, 0.4)';
                    }}
                >
                    Start Your Journey →
                </button>
            </header>

            {/* Features Section */}
            <section style={styles.featuresSection}>
                <h2 style={styles.sectionTitle}>Why Choose STIBAP?</h2>
                <div style={styles.featuresGrid}>
                    <div style={styles.featureCard}>
                        <span style={styles.featureIcon}>🧠</span>
                        <h3 style={styles.featureTitle}>AI-Driven Analysis</h3>
                        <p style={styles.featureText}>
                            Our advanced algorithms analyze your performance in real-time to understand exactly how you learn best.
                        </p>
                    </div>
                    <div style={styles.featureCard}>
                        <span style={styles.featureIcon}>🎯</span>
                        <h3 style={styles.featureTitle}>Personalized Path</h3>
                        <p style={styles.featureText}>
                            No two students are alike. Get a customized curriculum tailored to your specific goals and gaps.
                        </p>
                    </div>
                    <div style={styles.featureCard}>
                        <span style={styles.featureIcon}>📈</span>
                        <h3 style={styles.featureTitle}>Progress Tracking</h3>
                        <p style={styles.featureText}>
                            Visualize your growth with detailed analytics, charts, and milestones that keep you motivated.
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={styles.footer}>
                © 2025 STIBAP Intelligent Tutoring System. All rights reserved.
            </footer>
        </div>
    );
};

export default LandingPage;
