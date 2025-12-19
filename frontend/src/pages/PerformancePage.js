import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  updateQuizRecommendations,
  recordCourseInteraction,
} from '../utils/recommendationStorage';

const PerformancePage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { prediction, qcmResult, subject } = location.state || {}; // Added subject from state
    const [recommendedCourses, setRecommendedCourses] = useState([]);
    const [coursesLoading, setCoursesLoading] = useState(false);
    const [coursesError, setCoursesError] = useState('');

    const mapScoreToDifficulty = (score) => {
        if (score >= 16) return 'Advanced';
        if (score >= 11) return 'Intermediate';
        return 'Beginner';
    };

    const recommendedDifficulty = qcmResult ? mapScoreToDifficulty(qcmResult.grade_20) : null;

    useEffect(() => {
        if (!recommendedDifficulty) {
            setRecommendedCourses([]);
            setCoursesError('');
            setCoursesLoading(false);
            return;
        }

        const controller = new AbortController();

        const fetchCourses = async () => {
            setCoursesLoading(true);
            setCoursesError('');
            try {
                const response = await fetch(`http://localhost:8000/api/courses/by-difficulty?name=${encodeURIComponent(recommendedDifficulty)}`, {
                    signal: controller.signal
                });
                const payload = await response.json();
                if (payload.success) {
                    const courses = payload.data || [];
                    setRecommendedCourses(courses);
                    updateQuizRecommendations(courses);
                } else {
                    setCoursesError(payload.detail || 'Unable to load course recommendations');
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    console.error('Failed to fetch difficulty-specific courses', error);
                    setCoursesError('Network error loading course recommendations');
                }
            } finally {
                if (!controller.signal.aborted) {
                    setCoursesLoading(false);
                }
            }
        };

        fetchCourses();

        return () => controller.abort();
    }, [recommendedDifficulty]);

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
            background: prediction?.status === 'success'
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' // Green gradient for Success
                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', // Red gradient for Risk
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
        feedbackCard: {
            gridColumn: '1 / -1',
            backgroundColor: prediction?.status === 'success' ? '#f0fdf4' : '#fef2f2',
            borderLeft: `6px solid ${prediction?.status === 'success' ? '#22c55e' : '#ef4444'}`,
            padding: '24px',
        },
        feedbackText: {
            fontSize: '1.1rem',
            lineHeight: '1.6',
            color: prediction?.status === 'success' ? '#166534' : '#991b1b',
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
        },
        recommendPanel: {
            marginTop: '32px',
            padding: '24px',
            borderRadius: '20px',
            backgroundColor: 'white',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e5e7eb',
        },
        recommendTitle: {
            fontSize: '1.4rem',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#111827',
        },
        recommendGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
        },
        recommendCard: {
            padding: '20px',
            borderRadius: '16px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e5e7eb',
            minHeight: '180px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
        },
        courseTitle: {
            fontSize: '1.05rem',
            fontWeight: '600',
            marginBottom: '8px',
            color: '#1f2937',
        },
        courseMeta: {
            fontSize: '0.9rem',
            color: '#475569',
            marginBottom: '12px',
        },
        courseLink: {
            marginTop: 'auto',
            textDecoration: 'none',
            color: '#4f46e5',
            fontWeight: '600',
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
                            {prediction.message}
                        </div>
                        <div style={styles.confidence}>
                            Confidence Score: {(prediction.probability * 100).toFixed(1)}%
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

                    {/* Detailed Feedback Card (New JSON field) */}
                    <div style={{ ...styles.card, ...styles.feedbackCard }}>
                        <h3 style={{ ...styles.sectionTitle, marginTop: 0, color: 'inherit' }}>
                            <span style={{ marginRight: '8px' }}>💡</span>
                            {prediction.status === 'success' ? 'Pedagogical Analysis' : 'Corrective Action Plan'}
                        </h3>
                        <p style={styles.feedbackText}>
                            {prediction.detailed_feedback}
                        </p>
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
                            View Resources for {subject} →
                        </button>
                    </div>
                </div>

                {/* Difficulty-specific course recommendations */}
                {(recommendedCourses.length > 0 || coursesLoading || coursesError) && (
                    <div style={styles.recommendPanel}>
                        <h3 style={styles.recommendTitle}>
                            {recommendedDifficulty ? (
                                <>Recommended {recommendedDifficulty} Courses</>
                            ) : (
                                'Recommended Courses'
                            )}
                        </h3>

                        {coursesLoading ? (
                            <p>Loading course recommendations...</p>
                        ) : coursesError ? (
                            <p style={{ color: '#dc2626' }}>{coursesError}</p>
                        ) : (
                            <div style={styles.recommendGrid}>
                                {recommendedCourses.map((course) => (
                                    <div key={course.id} style={styles.recommendCard}>
                                        <div>
                                            <div style={styles.courseTitle}>{course.title}</div>
                                            <div style={styles.courseMeta}>
                                                {course.duration_minutes ? `${course.duration_minutes} min` : 'Duration TBD'} • {course.category?.name || 'General'}
                                            </div>
                                            <p style={{ fontSize: '0.95rem', color: '#374151', margin: 0 }}>
                                                {course.description?.slice(0, 110) ?? 'High-impact course material.'}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                recordCourseInteraction(course);
                                                if (course.content_url) {
                                                    window.open(course.content_url, '_blank', 'noopener noreferrer');
                                                } else {
                                                    navigate(`/courses/${course.id}`);
                                                }
                                            }}
                                            style={{
                                                ...styles.courseLink,
                                                background: 'transparent',
                                                border: 'none',
                                                padding: 0,
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Explore →
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default PerformancePage;
