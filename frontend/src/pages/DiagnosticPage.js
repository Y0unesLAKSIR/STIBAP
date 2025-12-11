import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const DiagnosticPage = () => {
    const navigate = useNavigate();
    const { subject } = useParams(); // Get subject from URL
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Normalize subject title for display
    const subjectTitle = subject
        ? subject.charAt(0).toUpperCase() + subject.slice(1).replace('_', ' ')
        : 'General';

    useEffect(() => {
        fetchQuestions();
    }, [subject]);

    const fetchQuestions = async () => {
        try {
            // Fetch questions for the specific subject
            // The backend defaults to Maths_Adv if subject is missing or invalid logic, 
            // but we send the exact param from URL.
            const response = await fetch(`http://localhost:8000/api/qcm/questions?subject=${subject}&count=5`);
            const data = await response.json();
            if (data.success) {
                setQuestions(data.data);
            } else {
                setError('Failed to load questions');
            }
        } catch (err) {
            setError('Network error loading questions');
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = (questionId, optionIndex) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionIndex
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (Object.keys(answers).length < questions.length) {
            alert('Please answer all questions before submitting.');
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch('http://localhost:8000/api/qcm/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(answers)
            });
            const data = await response.json();

            if (data.success) {
                // Navigate to profile with results AND the subject!
                navigate('/profile', {
                    state: {
                        qcmResult: data.data,
                        subject: subject // Pass the subject forward
                    }
                });
            } else {
                setError('Failed to submit answers');
            }
        } catch (err) {
            setError('Network error submitting answers');
        } finally {
            setSubmitting(false);
        }
    };

    // Inline Styles
    const styles = {
        container: {
            maxWidth: '800px',
            margin: '0 auto',
            padding: '40px 20px',
            fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            color: '#333',
        },
        header: {
            textAlign: 'center',
            marginBottom: '40px',
        },
        title: {
            fontSize: '2.5rem',
            color: '#1a202c',
            marginBottom: '10px',
            fontWeight: '800',
        },
        subtitle: {
            fontSize: '1.1rem',
            color: '#4a5568',
        },
        questionCard: {
            backgroundColor: '#fff',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid #e2e8f0',
        },
        questionTitle: {
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        categoryTag: {
            fontSize: '0.8rem',
            backgroundColor: '#e0e7ff',
            color: '#4338ca',
            padding: '4px 12px',
            borderRadius: '20px',
            fontWeight: '600',
        },
        optionsGrid: {
            display: 'grid',
            gap: '12px',
        },
        optionLabel: {
            display: 'flex',
            alignItems: 'center',
            padding: '16px',
            border: '2px solid #f1f5f9',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backgroundColor: '#f8fafc',
        },
        optionLabelSelected: {
            borderColor: '#4f46e5',
            backgroundColor: '#eef2ff',
            boxShadow: '0 0 0 2px rgba(79, 70, 229, 0.1)',
        },
        radioInput: {
            marginRight: '16px',
            width: '20px',
            height: '20px',
            accentColor: '#4f46e5',
        },
        submitContainer: {
            marginTop: '40px',
            textAlign: 'right',
        },
        submitButton: {
            backgroundColor: '#4f46e5',
            color: 'white',
            padding: '16px 40px',
            fontSize: '1.1rem',
            fontWeight: '700',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s',
        },
        submitButtonDisabled: {
            backgroundColor: '#a5b4fc',
            cursor: 'not-allowed',
            transform: 'none',
            boxShadow: 'none',
        },
        loading: {
            textAlign: 'center',
            padding: '60px',
            fontSize: '1.2rem',
            color: '#6b7280',
        },
        error: {
            textAlign: 'center',
            padding: '60px',
            color: '#ef4444',
            fontSize: '1.2rem',
            backgroundColor: '#fef2f2',
            borderRadius: '12px',
        }
    };

    if (loading) return (
        <div style={styles.container}>
            <div style={styles.loading}>
                <div style={{ marginBottom: '20px', fontSize: '3rem' }}>🔮</div>
                Isolating Knowledge Vectors for {subjectTitle}...
            </div>
        </div>
    );

    if (error) return <div style={{ ...styles.container, ...styles.error }}>{error}</div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>{subjectTitle} Diagnostic</h1>
                <p style={styles.subtitle}>
                    AI-Powered Competency Assessment
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                {questions.map((q, index) => (
                    <div key={q.id} style={styles.questionCard}>
                        <h3 style={styles.questionTitle}>
                            <span>{index + 1}. {q.text}</span>
                            <span style={styles.categoryTag}>{q.category}</span>
                        </h3>
                        <div style={styles.optionsGrid}>
                            {q.options.map((option, optIndex) => {
                                const isSelected = answers[q.id] === optIndex;
                                return (
                                    <label
                                        key={optIndex}
                                        style={{
                                            ...styles.optionLabel,
                                            ...(isSelected ? styles.optionLabelSelected : {})
                                        }}
                                        onMouseOver={(e) => {
                                            if (!isSelected) e.currentTarget.style.borderColor = '#cbd5e1';
                                        }}
                                        onMouseOut={(e) => {
                                            if (!isSelected) e.currentTarget.style.borderColor = '#f1f5f9';
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name={`question_${q.id}`}
                                            value={optIndex}
                                            checked={isSelected}
                                            onChange={() => handleOptionSelect(q.id, optIndex)}
                                            style={styles.radioInput}
                                        />
                                        <span style={{ fontSize: '1rem', fontWeight: isSelected ? '600' : '400' }}>
                                            {option}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                ))}

                <div style={styles.submitContainer}>
                    <button
                        type="submit"
                        disabled={submitting}
                        style={{
                            ...styles.submitButton,
                            ...(submitting ? styles.submitButtonDisabled : {})
                        }}
                        onMouseOver={(e) => !submitting && (e.currentTarget.style.transform = 'translateY(-2px)')}
                        onMouseOut={(e) => !submitting && (e.currentTarget.style.transform = 'none')}
                    >
                        {submitting ? 'Analyzing Pattern...' : 'Analyze My Level & Continue →'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default DiagnosticPage;
