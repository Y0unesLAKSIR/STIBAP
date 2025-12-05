import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MathDiagnosticPage = () => {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/qcm/questions?count=10');
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
        e.preventDefault(); // Prevent default form submission if wrapped in form

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
                navigate('/profile', { state: { qcmResult: data.data } });
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
        },
        subtitle: {
            fontSize: '1.1rem',
            color: '#4a5568',
        },
        questionCard: {
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
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
            backgroundColor: '#edf2f7',
            color: '#4a5568',
            padding: '4px 8px',
            borderRadius: '4px',
            fontWeight: 'normal',
        },
        optionsGrid: {
            display: 'grid',
            gap: '12px',
        },
        optionLabel: {
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            border: '2px solid #e2e8f0',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s',
        },
        optionLabelSelected: {
            borderColor: '#4f46e5', // Indigo 600
            backgroundColor: '#eef2ff', // Indigo 50
        },
        radioInput: {
            marginRight: '12px',
            width: '18px',
            height: '18px',
            accentColor: '#4f46e5',
        },
        submitContainer: {
            marginTop: '40px',
            textAlign: 'right',
        },
        submitButton: {
            backgroundColor: '#4f46e5',
            color: 'white',
            padding: '12px 32px',
            fontSize: '1rem',
            fontWeight: '600',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(79, 70, 229, 0.3)',
            transition: 'background-color 0.2s',
        },
        submitButtonDisabled: {
            backgroundColor: '#a5b4fc',
            cursor: 'not-allowed',
        },
        loading: {
            textAlign: 'center',
            padding: '40px',
            fontSize: '1.2rem',
            color: '#666',
        },
        error: {
            textAlign: 'center',
            padding: '40px',
            color: '#e53e3e',
            fontSize: '1.2rem',
        }
    };

    if (loading) return <div style={styles.loading}>Loading diagnostic test...</div>;
    if (error) return <div style={styles.error}>{error}</div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Math Diagnostic Test</h1>
                <p style={styles.subtitle}>
                    Let's assess your current mathematics level. This will help us tailor the tutoring to you.
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
                                    >
                                        <input
                                            type="radio"
                                            name={`question_${q.id}`}
                                            value={optIndex}
                                            checked={isSelected}
                                            onChange={() => handleOptionSelect(q.id, optIndex)}
                                            style={styles.radioInput}
                                        />
                                        <span>{option}</span>
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
                    >
                        {submitting ? 'Analyzing...' : 'Submit & Continue →'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MathDiagnosticPage;
