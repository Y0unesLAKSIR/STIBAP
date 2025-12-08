import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const PerformancePage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { prediction, qcmResult, subject } = location.state || {}; // Added subject from state

    // Styles
    const styles = {
        container: {
            minHeight: '100vh',
            backgroundColor: '#f3f4f6',
            fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            padding: '40px 20px',
        },
        wrapper: {
            maxWidth: '900px',
            margin: '0 auto',
        },
        header: {
            textAlign: 'center',
            marginBottom: '40px',
        },
        title: {
            fontSize: '2.5rem',
            fontWeight: '800',
            color: '#111827',
            marginBottom: '10px',
            letterSpacing: '-0.025em',
        },
        subtitle: {
            fontSize: '1.1rem',
            color: '#6b7280',
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: '40px',
        },
        card: {
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid #f3f4f6',
        },
        resultCard: {
            gridColumn: '1 / -1',
            background: prediction?.result === 'Pass'
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' // Green gradient
                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', // Red gradient
            color: 'white',
            textAlign: 'center',
            padding: '48px',
            position: 'relative',
            overflow: 'hidden',
        },
        resultTitle: {
            fontSize: '1.25rem',
            fontWeight: '600',
            opacity: 0.9,
            marginBottom: '16px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
        },
        resultStatus: {
            fontSize: '4rem',
            fontWeight: '800',
            marginBottom: '16px',
            lineHeight: 1,
        },
        confidence: {
            fontSize: '1.1rem',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            display: 'inline-block',
            padding: '8px 24px',
            borderRadius: '50px',
            backdropFilter: 'blur(4px)',
        },
        sectionTitle: {
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#1f2937',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
        },
        scoreRow: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '12px',
        },
        scoreLabel: {
            fontSize: '1rem',
            color: '#4b5563',
        },
        scoreValue: {
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#4f46e5',
        },
        progressBarBg: {
            width: '100%',
            height: '12px',
            backgroundColor: '#e5e7eb',
            borderRadius: '6px',
            overflow: 'hidden',
        },
        progressBarFill: {
            height: '100%',
            backgroundColor: '#4f46e5',
            borderRadius: '6px',
            transition: 'width 1s ease-out',
        },
        feedbackList: {
            listStyle: 'none',
            padding: 0,
            margin: 0,
        },
        feedbackItem: {
            display: 'flex',
            alignItems: 'flex-start',
            marginBottom: '16px',
            padding: '16px',
            borderRadius: '12px',
            borderLeftWidth: '6px',
        },
        // Context-Aware styles
        warningItem: {
            backgroundColor: '#fef2f2',
            borderLeftColor: '#ef4444',
            color: '#991b1b',
        },
        infoItem: {
            backgroundColor: '#eff6ff',
            borderLeftColor: '#3b82f6',
            color: '#1e40af',
        },
        successItem: {
            backgroundColor: '#f0fdf4',
            borderLeftColor: '#22c55e',
            color: '#166534',
        },
        feedbackText: {
            fontSize: '0.95rem',
            lineHeight: '1.6',
            fontWeight: '500',
        },
        actionSection: {
            textAlign: 'center',
            marginTop: '20px',
        },
        actionTitle: {
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '24px',
        },
        buttonGroup: {
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            flexWrap: 'wrap',
        },
        primaryButton: {
            backgroundColor: '#4f46e5',
            color: 'white',
            padding: '16px 32px',
            fontSize: '1.1rem',
            fontWeight: '600',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            textDecoration: 'none',
        },
        secondaryButton: {
            backgroundColor: 'white',
            color: '#4f46e5',
            padding: '16px 32px',
            fontSize: '1.1rem',
            fontWeight: '600',
            border: '2px solid #e0e7ff',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'background-color 0.2s, border-color 0.2s',
        },
        emptyState: {
            textAlign: 'center',
            padding: '60px',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        }
    };

    if (!prediction) {
        return (
            <div style={styles.container}>
                <div style={{ ...styles.wrapper, ...styles.emptyState }}>
                    <h2 style={{ ...styles.title, fontSize: '1.8rem' }}>No Results Found</h2>
                    <p style={{ ...styles.subtitle, marginBottom: '30px' }}>Please complete the diagnostic test first.</p>
                    <button
                        onClick={() => navigate('/diagnostic')}
                        style={styles.primaryButton}
                    >
                        Start Diagnostic Test
                    </button>
                </div>
            </div>
        );
    }

    const isPass = prediction.result === 'Pass';

    const renderFeedbackItem = (tip, index) => {
        // Handle structured feedback { type, message } or fallback plain string
        const type = tip.type || (tip.includes('⚠️') || tip.includes('Risk') ? 'warning' : 'info');
        const message = tip.message || tip;

        let itemStyle = {};
        if (type === 'warning') itemStyle = styles.warningItem;
        else if (type === 'success') itemStyle = styles.successItem;
        else itemStyle = styles.infoItem;

        return (
            <li key={index} style={{ ...styles.feedbackItem, ...itemStyle }}>
                <span style={styles.feedbackText}>
                    {message}
                </span>
            </li>
        );
    };

    return (
        <div style={styles.container}>
            <div style={styles.wrapper}>
                <div style={styles.header}>
                    <h1 style={styles.title}>Performance Analysis: {subject || 'General'}</h1>
                    <p style={styles.subtitle}>
                        AI-Powered Context-Aware Assessment
                    </p>
                </div>

                <div style={styles.grid}>
                    {/* Main Result Card */}
                    <div style={{ ...styles.card, ...styles.resultCard }}>
                        <div style={styles.resultTitle}>Predicted Outcome</div>
                        <div style={styles.resultStatus}>
                            {isPass ? 'Likely to Pass' : 'At Risk'}
                        </div>
                        <div style={styles.confidence}>
                            Confidence Score: {(prediction.confidence * 100).toFixed(1)}%
                        </div>
                    </div>

                    {/* Diagnostic Summary */}
                    <div style={styles.card}>
                        <h3 style={styles.sectionTitle}>
                            <span style={{ marginRight: '8px' }}>📊</span> Input Summary
                        </h3>
                        <div style={styles.scoreRow}>
                            <span style={styles.scoreLabel}>Diagnostic Score (G1)</span>
                            <span style={styles.scoreValue}>{qcmResult.grade_20}/20</span>
                        </div>
                        <div style={styles.progressBarBg}>
                            <div
                                style={{
                                    ...styles.progressBarFill,
                                    width: `${(qcmResult.grade_20 / 20) * 100}%`
                                }}
                            />
                        </div>
                        <hr style={{ margin: '20px 0', borderColor: '#f3f4f6' }} />
                        <div style={styles.scoreRow}>
                            <span style={styles.scoreLabel}>Subject</span>
                            <span style={{ fontWeight: '600', color: '#1f2937' }}>{subject || 'General'}</span>
                        </div>
                    </div>

                    {/* Intelligent Feedback */}
                    <div style={styles.card}>
                        <h3 style={styles.sectionTitle}>
                            <span style={{ marginRight: '8px' }}>💡</span> Intelligent Feedback Loop
                        </h3>
                        <ul style={styles.feedbackList}>
                            {prediction.feedback && prediction.feedback.map((tip, index) => renderFeedbackItem(tip, index))}
                        </ul>
                    </div>
                </div>

                {/* Action Section */}
                <div style={styles.actionSection}>
                    <h3 style={styles.actionTitle}>Recommended Next Steps</h3>
                    <div style={styles.buttonGroup}>
                        <button
                            onClick={() => navigate('/home')}
                            style={styles.secondaryButton}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#f5f7ff'}
                            onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
                        >
                            Return to Dashboard
                        </button>
                        <button
                            onClick={() => navigate('/courses')}
                            style={styles.primaryButton}
                            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.target.style.transform = 'none'}
                        >
                            View {prediction.recommendation_type} Resources for {subject} →
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PerformancePage;
