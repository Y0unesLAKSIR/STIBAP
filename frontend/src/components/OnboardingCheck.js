import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';

const OnboardingCheck = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user) {
        setChecking(false);
        return;
      }

      try {
        const response = await apiClient.getUserPreferences(user.id);

        if (response.success && response.data) {
          setOnboardingComplete(response.data.onboarding_completed);
        } else {
          // No preferences found, needs onboarding
          setOnboardingComplete(false);
        }
      } catch (error) {
        // Error or no preferences, needs onboarding
        console.log('No preferences found, redirecting to onboarding');
        setOnboardingComplete(false);
      } finally {
        setChecking(false);
      }
    };

    checkOnboarding();
  }, [user]);

  if (authLoading || checking) {
    return (
      <div className="loading-container">
        Loading...
      </div>
    );
  }

  // Redirect to onboarding if not completed
  if (onboardingComplete === false) {
    return <Navigate to="/onboarding" />;
  }

  return children;
};

export default OnboardingCheck;
