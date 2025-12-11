import React from 'react';
import { useNavigate } from 'react-router-dom';

const SubjectSelectionPage = () => {
    const navigate = useNavigate();

    // Full list of 31 Subjects supported by the Backend
    const subjects = [
        // IT & Programming
        { id: 'Java', title: 'Java', icon: '☕', description: 'OOP, Streams, Polymorphism' },
        { id: 'JEE', title: 'JEE', icon: '🏢', description: 'Spring, Servlets, Enterprise' },
        { id: 'Python', title: 'Python', icon: '🐍', description: 'Data, Scripting, Automation' },
        { id: 'DotNet', title: '.NET', icon: '🔷', description: 'C#, ASP.NET, Ecosystem' },
        { id: 'Web', title: 'Web Dev', icon: '🌐', description: 'HTML, CSS, React, JS' },
        { id: 'Mobile', title: 'Mobile', icon: '📱', description: 'Android, iOS, Flutter' },
        { id: 'Cloud', title: 'Cloud', icon: '☁️', description: 'AWS, Azure, Deployment' },
        { id: 'AI', title: 'AI & ML', icon: '🧠', description: 'Neural Neworks, Models' },
        { id: 'Data Science', title: 'Data Science', icon: '📊', description: 'Pandas, Visualization' },
        { id: 'DevOps', title: 'DevOps', icon: '⚙️', description: 'Docker, CI/CD, K8s' },
        { id: 'Cybersecurity', title: 'Security', icon: '🔒', description: 'Encryption, OWASP' },
        { id: 'Database', title: 'Databases', icon: '🗄️', description: 'SQL, Normalization' },
        { id: 'Networks', title: 'Networks', icon: '🔌', description: 'TCP/IP, OSI, Routing' },
        { id: 'Algorithms', title: 'Algorithms', icon: '➗', description: 'Complexity, Graphs' },
        { id: 'BigData', title: 'Big Data', icon: '🐘', description: 'Hadoop, Spark, Lakes' },
        { id: 'UML', title: 'UML', icon: '📝', description: 'Modeling, Diagrams' },

        // Sciences & Core
        { id: 'Maths_Adv', title: 'Maths Adv', icon: '📐', description: 'Calculus, Algebra' },
        { id: 'Statistics', title: 'Statistics', icon: '📈', description: 'Probability, Tests' },
        { id: 'Physics', title: 'Physics', icon: '⚡', description: 'Mechanics, Energy' },
        { id: 'Chemistry', title: 'Chemistry', icon: '🧪', description: 'Organic, Bonding' },
        { id: 'Biology', title: 'Biology', icon: '🧬', description: 'Genetics, Cells' },

        // Management, Law & Languages
        { id: 'Marketing', title: 'Marketing', icon: '📢', description: 'Strategy, SEO, 4Ps' },
        { id: 'Management', title: 'Management', icon: '🤝', description: 'Leadership, Agile' },
        { id: 'Accounting', title: 'Accounting', icon: '💰', description: 'Balance Sheets, P&L' },
        { id: 'Economics', title: 'Economics', icon: '📉', description: 'Micro/Macro, GDP' },
        { id: 'Law', title: 'Law', icon: '⚖️', description: 'Contracts, IP Rights' },
        { id: 'Audit', title: 'Audit', icon: '📋', description: 'Control, Compliance' },
        { id: 'Communication', title: 'Comm.', icon: '💬', description: 'Public Speaking' },
        { id: 'English', title: 'English', icon: '🇬🇧', description: 'Business, Grammar' },
        { id: 'French', title: 'French', icon: '🇫🇷', description: 'Literature, Writing' },
        { id: 'History', title: 'History', icon: '🏛️', description: 'World History' },
    ];

    const handleSubjectClick = (subject) => {
        // Direct routing to the generic diagnostic page
        navigate(`/diagnostic/${subject.id}`);
    };

    // Styles
    const styles = {
        container: {
            minHeight: '100vh',
            backgroundColor: '#f8fafc',
            fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            padding: '40px 20px',
        },
        wrapper: {
            maxWidth: '1200px',
            margin: '0 auto',
        },
        header: {
            textAlign: 'center',
            marginBottom: '60px',
        },
        title: {
            fontSize: '3rem',
            fontWeight: '900',
            color: '#0f172a',
            marginBottom: '16px',
            letterSpacing: '-0.025em',
        },
        subtitle: {
            fontSize: '1.2rem',
            color: '#64748b',
            maxWidth: '700px',
            margin: '0 auto',
            lineHeight: '1.6',
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '24px',
        },
        card: {
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
        },
        iconWrapper: {
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            marginBottom: '20px',
            backgroundColor: '#f1f5f9',
            transition: 'all 0.3s ease',
        },
        cardTitle: {
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '8px',
        },
        cardDesc: {
            fontSize: '0.9rem',
            color: '#94a3b8',
            lineHeight: '1.4',
        },
        badge: {
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: '#22c55e', // Green for active
            boxShadow: '0 0 0 2px white',
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.wrapper}>
                <div style={styles.header}>
                    <h1 style={styles.title}>Explore Knowledge Domains</h1>
                    <p style={styles.subtitle}>
                        Select a specialized module to begin your AI-powered diagnostic assessment.
                        All 30+ modules are now active and ready for analysis.
                    </p>
                </div>

                <div style={styles.grid}>
                    {subjects.map((subject) => (
                        <div
                            key={subject.id}
                            onClick={() => handleSubjectClick(subject)}
                            style={styles.card}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
                                e.currentTarget.style.borderColor = '#6366f1';
                                e.currentTarget.querySelector('.icon-wrapper').style.backgroundColor = '#eef2ff';
                                e.currentTarget.querySelector('.icon-wrapper').style.transform = 'scale(1.1) rotate(5deg)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                                e.currentTarget.querySelector('.icon-wrapper').style.backgroundColor = '#f1f5f9';
                                e.currentTarget.querySelector('.icon-wrapper').style.transform = 'none';
                            }}
                        >
                            <div className="icon-wrapper" style={styles.iconWrapper}>
                                {subject.icon}
                            </div>
                            <div style={styles.badge} title="Active Module" />
                            <h3 style={styles.cardTitle}>{subject.title}</h3>
                            <p style={styles.cardDesc}>{subject.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SubjectSelectionPage;

