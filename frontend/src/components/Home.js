import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import { getAverageQuizScore, getLatestQuizSubject, QUIZ_HISTORY_EVENT } from '../utils/quizMetrics';
import {
  RECOMMENDATION_EVENT,
  readQuizRecommendations,
  readCourseInteractions,
} from '../utils/recommendationStorage';

const Home = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [quizRecommendations, setQuizRecommendations] = useState([]);
  const [courseInteractions, setCourseInteractions] = useState([]);
  const [userProgress, setUserProgress] = useState([]);
  const [coursesInProgress, setCoursesInProgress] = useState(0);
  const [studyHours, setStudyHours] = useState(0);
  const [avgQuizScore, setAvgQuizScore] = useState(null);
  const [nextGoal, setNextGoal] = useState('');
  const [goalSourceLabel, setGoalSourceLabel] = useState('');
  const [learningGoal, setLearningGoal] = useState('');

  useEffect(() => {
    const loadRecommendations = async () => {
      if (user?.id) {
        try {
          const res = await apiClient.getUserRecommendations(user.id);
          if (res.success) {
            setRecommendations(res.data);
          }
        } catch (error) {
          console.error('Error loading recommendations:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [user]);

  useEffect(() => {
    const syncLocalLists = () => {
      setQuizRecommendations(readQuizRecommendations());
      setCourseInteractions(readCourseInteractions());
    };

    syncLocalLists();

    if (typeof window !== 'undefined') {
      window.addEventListener(RECOMMENDATION_EVENT, syncLocalLists);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(RECOMMENDATION_EVENT, syncLocalLists);
      }
    };
  }, []);
 
  useEffect(() => {
    setAvgQuizScore(getAverageQuizScore());

    if (typeof window !== 'undefined') {
      const handleHistoryUpdate = () => {
        setAvgQuizScore(getAverageQuizScore());
      };
      window.addEventListener(QUIZ_HISTORY_EVENT, handleHistoryUpdate);
      return () => {
        window.removeEventListener(QUIZ_HISTORY_EVENT, handleHistoryUpdate);
      };
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadUserMetrics = async () => {
      if (!user?.id) {
        setUserProgress([]);
        setCoursesInProgress(0);
        setStudyHours(0);
        setLearningGoal('');
        return;
      }

      try {
        const [progressRes, preferencesRes] = await Promise.all([
          apiClient.getUserProgress(user.id),
          apiClient.getUserPreferences(user.id),
        ]);

        if (isMounted && progressRes?.success) {
          const progressData = progressRes.data || [];
          setUserProgress(progressData);
          const inProgress = progressData.filter((entry) => entry.status !== 'completed').length;
          setCoursesInProgress(inProgress);
          const minutesLogged = progressData.reduce((sum, entry) => {
            const duration = entry.course?.duration_minutes ?? 0;
            const percent = Math.max(0, Math.min(100, entry.progress_percentage ?? 0));
            return sum + (duration * percent) / 100;
          }, 0);
          setStudyHours(Number((minutesLogged / 60).toFixed(1)));
        }

        if (isMounted && preferencesRes?.success) {
          setLearningGoal(preferencesRes.data?.learning_goals ?? '');
        }
      } catch (error) {
        console.error('Failed to load user metrics', error);
      }
    };

    loadUserMetrics();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const curatedRecommendations = useMemo(() => {
    const sourceEntries = [];
    quizRecommendations.forEach((course) =>
      sourceEntries.push({ course, source: 'quiz' })
    );
    courseInteractions.forEach((course) =>
      sourceEntries.push({ course, source: 'course' })
    );

    const uniqueById = [];
    const seen = new Set();
    sourceEntries.forEach((entry) => {
      const courseId = entry.course?.id;
      if (!courseId || seen.has(courseId)) {
        return;
      }
      seen.add(courseId);
      uniqueById.push(entry);
    });

    if (uniqueById.length > 0) {
      return uniqueById;
    }

    return recommendations.map((rec) => ({
      course: rec.course,
      confidence_score: rec.confidence_score,
      source: 'ai',
    }));
  }, [quizRecommendations, courseInteractions, recommendations]);

  useEffect(() => {
    if (recommendations.length > 0) {
      const topCourse = recommendations[0]?.course;
      if (topCourse?.title) {
        setNextGoal(`Continue ${topCourse.title}`);
        setGoalSourceLabel('AI recommendation');
        return;
      }
    }

    if (learningGoal) {
      setNextGoal(learningGoal);
      setGoalSourceLabel('Learning objective');
      return;
    }

    setNextGoal('');
    setGoalSourceLabel('');
  }, [recommendations, learningGoal]);

  useEffect(() => {
    const latestQuizSubject = getLatestQuizSubject();
    if (latestQuizSubject) {
      setNextGoal(`Master ${latestQuizSubject}`);
      setGoalSourceLabel('Last diagnostic');
    }
  }, [recommendations]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout', error);
    }
  };
  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    },
    navbar: {
      backgroundColor: 'white',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      padding: '0 24px',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    },
    navBrand: {
      fontSize: '1.5rem',
      fontWeight: '800',
      color: '#4f46e5',
      letterSpacing: '-0.025em',
    },
    navActions: {
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
    },
    navButton: {
      padding: '8px 16px',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: 'transparent',
      color: '#4b5563',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontSize: '0.95rem',
    },
    primaryNavButton: {
      backgroundColor: '#eef2ff',
      color: '#4f46e5',
      fontWeight: '600',
    },
    logoutButton: {
      padding: '8px 16px',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      backgroundColor: 'white',
      color: '#ef4444',
      fontWeight: '500',
      cursor: 'pointer',
      marginLeft: '16px',
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '32px 24px',
    },
    welcomeSection: {
      marginBottom: '40px',
    },
    welcomeTitle: {
      fontSize: '2rem',
      fontWeight: '700',
      color: '#111827',
      marginBottom: '8px',
    },
    welcomeSubtitle: {
      fontSize: '1.1rem',
      color: '#6b7280',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '24px',
      marginBottom: '40px',
    },
    statCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
    },
    statLabel: {
      fontSize: '0.9rem',
      color: '#6b7280',
      fontWeight: '500',
      marginBottom: '8px',
    },
    statValue: {
      fontSize: '2rem',
      fontWeight: '700',
      color: '#111827',
    },
    statTrend: {
      fontSize: '0.85rem',
      color: '#10b981', // Green
      marginTop: '4px',
      fontWeight: '500',
    },
    chartSection: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '32px',
      marginBottom: '40px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    },
    sectionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
    },
    sectionTitle: {
      fontSize: '1.25rem',
      fontWeight: '700',
      color: '#1f2937',
    },
    barChart: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      height: '200px',
      paddingTop: '20px',
    },
    barColumn: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
    },
    bar: {
      width: '40px',
      backgroundColor: '#4f46e5',
      borderRadius: '6px 6px 0 0',
      transition: 'height 0.5s ease',
      opacity: 0.8,
    },
    barLabel: {
      marginTop: '12px',
      fontSize: '0.85rem',
      color: '#6b7280',
    },
    recommendationsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '24px',
    },
    courseCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      cursor: 'pointer',
      transition: 'transform 0.2s',
      border: '1px solid #f3f4f6',
    },
    courseHeader: {
      height: '120px',
      backgroundColor: '#e0e7ff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    matchBadge: {
      position: 'absolute',
      top: '12px',
      right: '12px',
      backgroundColor: 'white',
      color: '#4f46e5',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '0.85rem',
      fontWeight: '700',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    courseContent: {
      padding: '20px',
    },
    courseTitle: {
      fontSize: '1.1rem',
      fontWeight: '600',
      color: '#111827',
      marginBottom: '8px',
    },
    courseDesc: {
      fontSize: '0.9rem',
      color: '#6b7280',
      marginBottom: '16px',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
    },
    courseFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 'auto',
    },
    tag: {
      fontSize: '0.8rem',
      backgroundColor: '#f3f4f6',
      color: '#4b5563',
      padding: '4px 8px',
      borderRadius: '4px',
    },
    startLink: {
      color: '#4f46e5',
      fontWeight: '600',
      fontSize: '0.9rem',
      textDecoration: 'none',
    }
  };

  // Static Data for Analytics
  const weeklyActivity = [
    { day: 'Mon', value: 45 },
    { day: 'Tue', value: 70 },
    { day: 'Wed', value: 30 },
    { day: 'Thu', value: 85 },
    { day: 'Fri', value: 60 },
    { day: 'Sat', value: 20 },
    { day: 'Sun', value: 50 },
  ];

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <div style={styles.navBrand}>STIBAP</div>
        <div style={styles.navActions}>
          <button
            onClick={() => navigate('/diagnostic')}
            style={{ ...styles.navButton, ...styles.primaryNavButton }}
          >
            📊 Performance
          </button>
          <button
            onClick={() => navigate('/courses')}
            style={{ ...styles.navButton, ...styles.primaryNavButton }}
          >
            🎓 Courses
          </button>
          <button onClick={() => navigate('/settings')} style={styles.navButton}>
            ⚙️ Settings
          </button>
          {(user?.role === 'admin' || user?.role === 'superadmin') && (
            <button onClick={() => navigate('/admin')} style={styles.navButton}>
              🛡️ Admin
            </button>
          )}
          <button onClick={handleSignOut} style={styles.logoutButton}>
            Sign Out
          </button>
        </div>
      </nav>

      <div style={styles.content}>
        <div style={styles.welcomeSection}>
          <h1 style={styles.welcomeTitle}>
            Welcome back, {user?.full_name?.split(' ')[0] || 'Student'}! 👋
          </h1>
          <p style={styles.welcomeSubtitle}>
            Here's what's happening with your learning journey today.
          </p>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>Courses in Progress</span>
            <span style={styles.statValue}>{coursesInProgress}</span>
            <span style={styles.statTrend}>
              {userProgress.length > 0
                ? `Tracking ${userProgress.length} course${userProgress.length > 1 ? 's' : ''}`
                : 'No active course yet'}
            </span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>Study Hours</span>
            <span style={styles.statValue}>
              {studyHours ? `${studyHours} hr${studyHours !== 1 ? 's' : ''}` : '0 hrs'}
            </span>
            <span style={styles.statTrend}>
              {studyHours ? 'Estimated time from progress' : 'Open a course to start tracking'}
            </span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>Avg. Quiz Score</span>
            <span style={styles.statValue}>
              {avgQuizScore ? `${avgQuizScore.toFixed(1)} / 20` : 'Diagnostic pending'}
            </span>
            <span style={{ ...styles.statTrend, color: avgQuizScore ? '#4f46e5' : '#6b7280' }}>
              {avgQuizScore ? 'Based on past diagnostics' : 'Complete a diagnostic test'}
            </span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>Next Goal</span>
            <span
              style={{
                ...styles.statValue,
                fontSize: '1.2rem',
                marginTop: 'auto',
                color: '#1f2937',
              }}
            >
              {nextGoal || 'Complete a diagnostic test'}
            </span>
            {goalSourceLabel && (
              <span style={{ ...styles.statTrend, color: '#6b7280' }}>
                Suggested by {goalSourceLabel}
              </span>
            )}
          </div>
        </div>

        {/* Static Chart Section */}
        <div style={styles.chartSection}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Weekly Activity</h2>
            <select style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <option>This Week</option>
              <option>Last Week</option>
            </select>
          </div>
          <div style={styles.barChart}>
            {weeklyActivity.map((item, index) => (
              <div key={index} style={styles.barColumn}>
                <div style={{ ...styles.bar, height: `${item.value}%` }}></div>
                <span style={styles.barLabel}>{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations */}
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>🎯 Recommended For You</h2>
          <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Based on your recent performance</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            Loading your personalized recommendations...
          </div>
        ) : curatedRecommendations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '12px' }}>
            <p>No recommendations yet. Complete the <b style={{ cursor: 'pointer', color: '#4f46e5' }} onClick={() => navigate('/diagnostic')}>Diagnostic Test</b> to get started!</p>
          </div>
        ) : (
          <div style={styles.recommendationsGrid}>
            {curatedRecommendations.map((rec, index) => {
              const course = rec.course;
              const badgeText =
                rec.source === 'quiz'
                  ? 'Quiz suggestion'
                  : rec.source === 'course'
                  ? 'Recent interaction'
                  : `${Math.round((rec.confidence_score || 0.6) * 100)}% Match`;

              return (
                <div
                  key={`${course?.id ?? index}-${badgeText}`}
                  style={styles.courseCard}
                  onClick={() => course?.id && navigate(`/courses/${course.id}`)}
                  onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
                  onMouseOut={(e) => (e.currentTarget.style.transform = 'none')}
                >
                  <div style={styles.courseHeader}>
                    <span style={{ fontSize: '3rem', opacity: 0.5 }}>📚</span>
                    <span style={styles.matchBadge}>{badgeText}</span>
                  </div>
                  <div style={styles.courseContent}>
                    <h3 style={styles.courseTitle}>{course?.title || 'Course'}</h3>
                    <p style={styles.courseDesc}>{course?.description || 'No description available'}</p>
                    <div style={styles.courseFooter}>
                      <span style={styles.tag}>{course?.difficulty?.name || 'All Levels'}</span>
                      <span style={styles.startLink}>Start →</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
