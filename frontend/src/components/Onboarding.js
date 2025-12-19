import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import './Onboarding.css';

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form data
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [timeAvailability, setTimeAvailability] = useState('');
  const [recommendations, setRecommendations] = useState([]);

  // Options from backend
  const [difficulties, setDifficulties] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState('');

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    setDataLoading(true);
    setDataError('');

    try {
      console.log('Fetching difficulties and categories...');
      const diffData = await apiClient.getDifficulties();

      console.log('Difficulties response:', diffData);

      const diffArray = diffData.data || [];

      console.log('Setting difficulties:', diffArray);

      setDifficulties(diffArray);

      if (diffArray.length === 0) {
        setDataError('No difficulty levels found. Make sure the backend is running and database is set up.');
      }
    } catch (err) {
      console.error('Error loading options:', err);
      setDataError(`Failed to load data: ${err.message}. Make sure the backend is running on http://localhost:8000`);

      // Set fallback data
      setDifficulties([
        { id: '1', name: 'Beginner', description: 'No prior knowledge required. Start from scratch.', level: 1 },
        { id: '2', name: 'Intermediate', description: 'Some basic knowledge required. Build on fundamentals.', level: 2 },
        { id: '3', name: 'Advanced', description: 'Strong foundation required. Deep dive into complex topics.', level: 3 }
      ]);
    } finally {
      setDataLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && !selectedDifficulty) {
      setError('Please select your skill level');
      return;
    }

    setError('');
    if (step < 2) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
    }
  };


  const handleComplete = async () => {
    setLoading(true);
    setError('');

    try {
      const preferences = {
        preferred_difficulty_id: selectedDifficulty,
        preferred_categories: [],  // Categories will be extracted from AI prompt
        time_availability_minutes: timeAvailability ? parseInt(timeAvailability) : null
      };

      const response = await apiClient.completeOnboarding(user.id, preferences);

      if (response.success) {
        setRecommendations(response.recommendations || []);
        setStep(3); // Show recommendations
      }
    } catch (err) {
      setError(err.message || 'Failed to complete onboarding');
      setLoading(false);
    }
  };

  const handleFinish = () => {
    navigate('/home');
  };

  const totalSteps = 3;

  const getProgressPercentage = () => {
    return (step / totalSteps) * 100;
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        {/* Progress Bar */}
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>

        {/* Step 1: Skill Level */}
        {step === 1 && (
          <div className="onboarding-step">
            <h1 className="onboarding-title">Welcome! Let's Get Started 🎓</h1>
            <p className="onboarding-subtitle">Select your current skill level</p>

            {error && <div className="error-message">{error}</div>}
            {dataError && <div className="error-message" style={{ backgroundColor: '#fff3cd', color: '#856404', borderColor: '#ffc107' }}>{dataError}</div>}

            {dataLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#667eea' }}>
                <p>Loading difficulty levels...</p>
              </div>
            ) : difficulties.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ color: '#e53e3e', marginBottom: '10px' }}>❌ No difficulty levels found</p>
                <p style={{ fontSize: '14px', color: '#718096' }}>Please make sure:</p>
                <ul style={{ textAlign: 'left', display: 'inline-block', fontSize: '14px', color: '#718096' }}>
                  <li>Backend is running on http://localhost:8000</li>
                  <li>Database schema is set up (run supabase_courses_schema.sql)</li>
                  <li>Check browser console for errors</li>
                </ul>
              </div>
            ) : (
              <div className="difficulty-grid">
                {difficulties.map((difficulty) => (
                  <div
                    key={difficulty.id}
                    className={`difficulty-card ${selectedDifficulty === difficulty.id ? 'selected' : ''}`}
                    onClick={() => setSelectedDifficulty(difficulty.id)}
                  >
                    <h3>{difficulty.name}</h3>
                    <p>{difficulty.description}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="button-group">
              <button onClick={handleNext} className="btn-primary">
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Time Availability */}
        {step === 2 && (
          <div className="onboarding-step">
            <h1 className="onboarding-title">How Much Time Can You Dedicate? ⏰</h1>
            <p className="onboarding-subtitle">This is optional but helps us plan better</p>

            {error && <div className="error-message">{error}</div>}

            <div className="time-options">
              <div
                className={`time-card ${timeAvailability === '30' ? 'selected' : ''}`}
                onClick={() => setTimeAvailability('30')}
              >
                <h3>30 min/day</h3>
                <p>Quick learner</p>
              </div>
              <div
                className={`time-card ${timeAvailability === '60' ? 'selected' : ''}`}
                onClick={() => setTimeAvailability('60')}
              >
                <h3>1 hour/day</h3>
                <p>Regular pace</p>
              </div>
              <div
                className={`time-card ${timeAvailability === '120' ? 'selected' : ''}`}
                onClick={() => setTimeAvailability('120')}
              >
                <h3>2+ hours/day</h3>
                <p>Deep dive</p>
              </div>
            </div>

            <div className="button-group">
              <button onClick={handleBack} className="btn-secondary">
                ← Back
              </button>
              <button onClick={handleComplete} className="btn-primary" disabled={loading}>
                {loading ? 'Generating Recommendations...' : 'Complete Setup →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Recommendations */}
        {step === 3 && (
          <div className="onboarding-step">
            <h1 className="onboarding-title">Your Personalized Learning Path 🎉</h1>
            <p className="onboarding-subtitle">Based on your preferences, we recommend:</p>

            <div className="recommendations-list">
              {recommendations.map((rec, index) => (
                <div key={index} className="recommendation-card">
                  <div className="rec-header">
                    <h3>{rec.course?.title || 'Course'}</h3>
                    <span className="confidence-badge">
                      {Math.round((rec.confidence_score || 0.5) * 100)}% match
                    </span>
                  </div>
                  <p>{rec.course?.description || rec.course?.title}</p>
                  <div className="rec-meta">
                    <span className="badge">{rec.course?.category?.name}</span>
                    <span className="badge">{rec.course?.difficulty?.name}</span>
                    {rec.course?.duration_minutes && (
                      <span className="badge">{rec.course.duration_minutes} min</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="button-group">
              <button onClick={handleFinish} className="btn-primary btn-large">
                Start Learning! 🚀
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
