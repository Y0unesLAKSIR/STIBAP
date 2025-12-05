import React from 'react';
import { useNavigate } from 'react-router-dom';

const SubjectSelectionPage = () => {
    const navigate = useNavigate();

    const subjects = [
        {
            id: 'math',
            title: 'Mathematics',
            icon: '📐',
            description: 'Algebra, Geometry, Calculus, and more.',
            status: 'active',
            route: '/diagnostic/math'
        },
        {
            id: 'portuguese',
            title: 'Portuguese',
            icon: '📖',
            description: 'Grammar, Literature, and Comprehension.',
            status: 'active', // User requested this not be "Coming Soon"
            route: '/diagnostic/portuguese' // Placeholder route
        },
        {
            id: 'physics',
            title: 'Physics',
            icon: '⚡',
            description: 'Mechanics, Thermodynamics, and Electromagnetism.',
            status: 'coming_soon'
        },
        {
            id: 'chemistry',
            title: 'Chemistry',
            icon: '🧪',
            description: 'Organic, Inorganic, and Physical Chemistry.',
            status: 'coming_soon'
        },
        {
            id: 'biology',
            title: 'Biology',
            icon: '🧬',
            description: 'Genetics, Ecology, and Human Anatomy.',
            status: 'coming_soon'
        },
        {
            id: 'history',
            title: 'History',
            icon: '🏛️',
            description: 'World History, Civilizations, and Eras.',
            status: 'coming_soon'
        }
    ];

    const handleSubjectClick = (subject) => {
        if (subject.status === 'coming_soon') return;

        if (subject.id === 'portuguese') {
            alert("Portuguese Assessment module is currently being integrated. Please try Math for the full demo!");
            return;
        }

        if (subject.route) {
            navigate(subject.route);
        }
    };

    // Styles
    const styles = {
        container: {
            minHeight: '100vh',
            backgroundColor: '#f3f4f6',
            fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            padding: '40px 20px',
        },
        wrapper: {
            maxWidth: '1000px',
            margin: '0 auto',
        },
        header: {
            textAlign: 'center',
            marginBottom: '60px',
        },
        title: {
            fontSize: '2.5rem',
            fontWeight: '800',
            color: '#111827',
            marginBottom: '16px',
        },
        subtitle: {
            fontSize: '1.1rem',
            color: '#6b7280',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6',
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px',
        },
        card: {
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            border: '2px solid transparent',
            position: 'relative',
            overflow: 'hidden',
        },
        cardActive: {
            borderColor: '#e0e7ff',
        },
        cardDisabled: {
            opacity: 0.7,
            cursor: 'not-allowed',
            backgroundColor: '#f9fafb',
        },
        iconWrapper: {
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            marginBottom: '24px',
            backgroundColor: '#f3f4f6',
            transition: 'transform 0.3s ease',
        },
        cardTitle: {
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#1f2937',
            marginBottom: '8px',
        },
        cardDesc: {
            fontSize: '0.95rem',
            color: '#6b7280',
            lineHeight: '1.5',
        },
        badge: {
            position: 'absolute',
            top: '20px',
            right: '20px',
            fontSize: '0.75rem',
            fontWeight: '600',
            padding: '4px 12px',
            borderRadius: '20px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
        },
        badgeActive: {
            backgroundColor: '#d1fae5',
            color: '#059669',
        },
        badgeComingSoon: {
            backgroundColor: '#f3f4f6',
            color: '#9ca3af',
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.wrapper}>
                <div style={styles.header}>
                    <h1 style={styles.title}>Select a Subject</h1>
                    <p style={styles.subtitle}>
                        Choose a subject to begin your diagnostic assessment.
                        Our AI will analyze your performance and recommend a personalized learning path.
                    </p>
                </div>

                <div style={styles.grid}>
                    {subjects.map((subject) => {
                        const isActive = subject.status === 'active';
                        return (
                            <div
                                key={subject.id}
                                onClick={() => handleSubjectClick(subject)}
                                style={{
                                    ...styles.card,
                                    ...(isActive ? styles.cardActive : styles.cardDisabled)
                                }}
                                onMouseOver={(e) => {
                                    if (isActive) {
                                        e.currentTarget.style.transform = 'translateY(-8px)';
                                        e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
                                        e.currentTarget.style.borderColor = '#4f46e5';
                                        e.currentTarget.querySelector('.icon-wrapper').style.backgroundColor = '#eef2ff';
                                        e.currentTarget.querySelector('.icon-wrapper').style.transform = 'scale(1.1)';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (isActive) {
                                        e.currentTarget.style.transform = 'none';
                                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                                        e.currentTarget.style.borderColor = '#e0e7ff';
                                        e.currentTarget.querySelector('.icon-wrapper').style.backgroundColor = '#f3f4f6';
                                        e.currentTarget.querySelector('.icon-wrapper').style.transform = 'none';
                                    }
                                }}
                            >
                                <div
                                    className="icon-wrapper"
                                    style={styles.iconWrapper}
                                >
                                    {subject.icon}
                                </div>

                                <span style={{
                                    ...styles.badge,
                                    ...(isActive ? styles.badgeActive : styles.badgeComingSoon)
                                }}>
                                    {isActive ? 'Available' : 'Coming Soon'}
                                </span>

                                <h3 style={styles.cardTitle}>{subject.title}</h3>
                                <p style={styles.cardDesc}>{subject.description}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default SubjectSelectionPage;
