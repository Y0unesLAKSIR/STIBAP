import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import './Home.css';

const Home = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [user]);

  const loadRecommendations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await apiClient.getUserRecommendations(user.id);
      
      if (response.success && response.data) {
        setRecommendations(response.data.slice(0, 6)); // Show top 6
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleCourseClick = (courseId) => {
    // TODO: Navigate to course detail page when implemented
    console.log('Course clicked:', courseId);
    alert('Course details coming soon! 🚀');
  };

  return (
    <div className="home-container">
      <nav className="navbar">
        <div className="nav-content">
          <h2 className="nav-brand">STIBAP</h2>
          <div className="nav-actions">
            <button onClick={() => navigate('/settings')} className="nav-button">
              ⚙️ Settings
            </button>
            {(user?.role === 'admin' || user?.role === 'superadmin') && (
              <button onClick={() => navigate('/admin')} className="nav-button admin-button">
                🛡️ Admin
              </button>
            )}
            <button onClick={handleSignOut} className="logout-button">
              Sign Out
            </button>
          </div>
        </div>
      </nav>
      <div className="home-content">
        <div className="welcome-card">
          <h1 className="welcome-title">
            Welcome{user?.full_name ? `, ${user.full_name}` : ''} to Your Dashboard!
          </h1>
          <p className="welcome-subtitle">
            Your personalized learning journey starts here.
          </p>
        </div>

        {/* Recommended Courses Section */}
        <div className="recommendations-section">
          <div className="section-header">
            <h2>🎯 Recommended For You</h2>
            <p>Based on your learning goals and preferences</p>
          </div>

          {loading ? (
            <div className="loading-state">
              <p>Loading your recommendations...</p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="empty-state">
              <p>No recommendations yet. Complete your onboarding to get started!</p>
            </div>
          ) : (
            <div className="courses-grid">
              {recommendations.map((rec, index) => (
                <div 
                  key={index} 
                  className="course-card"
                  onClick={() => handleCourseClick(rec.course?.id)}
                >
                  <div className="course-card-header">
                    <span className="match-score">
                      {Math.round((rec.confidence_score || 0) * 100)}% match
                    </span>
                  </div>
                  <h3 className="course-title">{rec.course?.title || 'Course'}</h3>
                  <p className="course-description">
                    {rec.course?.description || 'No description available'}
                  </p>
                  <div className="course-meta">
                    <span className="course-badge category-badge">
                      {rec.course?.category?.name || 'General'}
                    </span>
                    <span className="course-badge difficulty-badge">
                      {rec.course?.difficulty?.name || 'All Levels'}
                    </span>
                    {rec.course?.duration_minutes && (
                      <span className="course-badge duration-badge">
                        {rec.course.duration_minutes} min
                      </span>
                    )}
                  </div>
                  <div className="course-footer">
                    <button className="start-course-btn">
                      Start Learning →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
