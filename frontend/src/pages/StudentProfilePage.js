import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const StudentProfilePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const qcmResult = location.state?.qcmResult;

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        subject: location.state?.subject || 'Java', // Use passed subject or default to Java
        studytime: 2,
        failures: 0,
        absences: 0,
        schoolsup: false,
        famsup: false,
        activities: false,
        internet: true
    });

    const subjects = [
        "Java", "JEE", "DotNet", "Python", "Web", "Mobile", "Cloud", "AI",
        "Data Science", "DevOps", "Cybersecurity", "Database", "Networks",
        "Algorithms", "Maths_Adv", "Statistics", "Physics", "Chemistry",
        "Biology", "Marketing", "Management", "Accounting", "Economics",
        "Law", "Communication", "English", "French", "History", "Audit"
    ];

    // Styles
    const styles = {
        container: {
            minHeight: '100vh',
            backgroundColor: '#f3f4f6',
            fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px 20px',
        },
        card: {
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
            maxWidth: '700px',
            width: '100%',
            overflow: 'hidden',
        },
        header: {
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            padding: '40px',
            color: 'white',
            textAlign: 'center',
        },
        title: {
            fontSize: '2rem',
            fontWeight: '700',
            marginBottom: '10px',
            margin: 0,
        },
        subtitle: {
            fontSize: '1.1rem',
            opacity: 0.9,
            marginTop: '10px',
            lineHeight: '1.5',
        },
        scoreBadge: {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            padding: '4px 12px',
            borderRadius: '20px',
            fontWeight: 'bold',
            marginLeft: '8px',
        },
        formContent: {
            padding: '40px',
        },
        sectionTitle: {
            fontSize: '1.2rem',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '20px',
            borderBottom: '2px solid #e5e7eb',
            paddingBottom: '10px',
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px',
            marginBottom: '32px',
        },
        inputGroup: {
            display: 'flex',
            flexDirection: 'column',
        },
        label: {
            fontSize: '0.95rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px',
        },
        select: {
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            fontSize: '1rem',
            backgroundColor: '#fff',
            color: '#1f2937',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            cursor: 'pointer',
        },
        input: {
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            fontSize: '1rem',
            outline: 'none',
            transition: 'border-color 0.2s',
        },
        checkboxGrid: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
        },
        checkboxLabel: {
            display: 'flex',
            alignItems: 'center',
            padding: '12px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            cursor: 'pointer',
            transition: 'all 0.2s',
        },
        checkboxLabelActive: {
            backgroundColor: '#eef2ff',
            borderColor: '#6366f1',
        },
        checkbox: {
            width: '18px',
            height: '18px',
            marginRight: '12px',
            accentColor: '#4f46e5',
        },
        buttonContainer: {
            marginTop: '40px',
        },
        button: {
            width: '100%',
            padding: '16px',
            backgroundColor: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(79, 70, 229, 0.25)',
            transition: 'transform 0.1s, background-color 0.2s',
        },
        buttonDisabled: {
            backgroundColor: '#a5b4fc',
            cursor: 'not-allowed',
            transform: 'none',
        },
    };

    if (!qcmResult) {
        return (
            <div style={styles.container}>
                <div style={{ ...styles.card, padding: '40px', textAlign: 'center' }}>
                    <h2 style={{ ...styles.title, color: '#1f2937', marginBottom: '20px' }}>Diagnostic Missing</h2>
                    <p style={{ color: '#6b7280', marginBottom: '30px' }}>Please complete the Math Diagnostic test first.</p>
                    <button
                        onClick={() => navigate('/diagnostic')}
                        style={{ ...styles.button, width: 'auto', padding: '12px 30px' }}
                    >
                        Go to Diagnostic Test
                    </button>
                </div>
            </div>
        );
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (name === 'subject' ? value : parseInt(value))
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            qcm_score: qcmResult.grade_20,
            ...formData
        };

        try {
            const response = await fetch('http://localhost:8000/api/performance/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.error) {
                alert('Error: ' + data.error);
            } else {
                navigate('/results', { state: { prediction: data, qcmResult, subject: formData.subject } });
            }
        } catch (err) {
            console.error(err);
            alert('Failed to analyze profile.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <h1 style={styles.title}>Student Profile</h1>
                    <p style={styles.subtitle}>
                        Quiz Score: <span style={styles.scoreBadge}>{qcmResult.grade_20}/20</span>
                        <br />
                        Configuring for Intelligent Tutor...
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={styles.formContent}>

                    <h3 style={styles.sectionTitle}>Target Subject</h3>
                    <div style={{ marginBottom: '32px' }}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Select the Subject for Analysis</label>
                            <select
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                style={styles.select}
                            >
                                {subjects.map(sub => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <h3 style={styles.sectionTitle}>Academic Habits</h3>
                    <div style={styles.grid}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Weekly Study Time</label>
                            <select
                                name="studytime"
                                value={formData.studytime}
                                onChange={handleChange}
                                style={styles.select}
                            >
                                <option value={1}>Less than 2 hours</option>
                                <option value={2}>2 to 5 hours</option>
                                <option value={3}>5 to 10 hours</option>
                                <option value={4}>More than 10 hours</option>
                            </select>
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Past Class Failures</label>
                            <select
                                name="failures"
                                value={formData.failures}
                                onChange={handleChange}
                                style={styles.select}
                            >
                                <option value={0}>None</option>
                                <option value={1}>1 Failure</option>
                                <option value={2}>2 Failures</option>
                                <option value={3}>3 Failures</option>
                                <option value={4}>4+ Failures</option>
                            </select>
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Absences (This Year)</label>
                            <input
                                type="number"
                                name="absences"
                                min="0"
                                max="93"
                                value={formData.absences}
                                onChange={handleChange}
                                style={styles.input}
                                required
                            />
                        </div>
                    </div>

                    <h3 style={styles.sectionTitle}>Support & Environment</h3>
                    <div style={styles.checkboxGrid}>
                        {[
                            { id: 'schoolsup', label: 'Extra School Support' },
                            { id: 'famsup', label: 'Family Support' },
                            { id: 'activities', label: 'Extra-curriculars' },
                            { id: 'internet', label: 'Internet Access' }
                        ].map((item) => (
                            <label
                                key={item.id}
                                style={{
                                    ...styles.checkboxLabel,
                                    ...(formData[item.id] ? styles.checkboxLabelActive : {})
                                }}
                            >
                                <input
                                    type="checkbox"
                                    name={item.id}
                                    checked={formData[item.id]}
                                    onChange={handleChange}
                                    style={styles.checkbox}
                                />
                                <span style={{ color: formData[item.id] ? '#4f46e5' : '#374151', fontWeight: formData[item.id] ? '600' : '400' }}>
                                    {item.label}
                                </span>
                            </label>
                        ))}
                    </div>

                    <div style={styles.buttonContainer}>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                ...styles.button,
                                ...(loading ? styles.buttonDisabled : {})
                            }}
                            onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
                            onMouseOut={(e) => !loading && (e.target.style.transform = 'none')}
                        >
                            {loading ? 'Run Intelligent Analysis ✨' : 'Run Intelligent Analysis ✨'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StudentProfilePage;
