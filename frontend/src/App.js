import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import Onboarding from './components/Onboarding';
import Settings from './components/Settings';
import Admin from './components/Admin';
import CoursePlayer from './components/CoursePlayer';
import ProtectedRoute from './components/ProtectedRoute';
import OnboardingCheck from './components/OnboardingCheck';
import PerformancePage from './pages/PerformancePage';
import MathDiagnosticPage from './pages/MathDiagnosticPage';
import StudentProfilePage from './pages/StudentProfilePage';
import LandingPage from './pages/LandingPage';
import SubjectSelectionPage from './pages/SubjectSelectionPage';
import DiagnosticPage from './pages/DiagnosticPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <OnboardingCheck>
                  <Home />
                </OnboardingCheck>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses/:courseId"
            element={
              <ProtectedRoute>
                <CoursePlayer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/diagnostic"
            element={
              <ProtectedRoute>
                <SubjectSelectionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/diagnostic/math"
            element={
              <ProtectedRoute>
                <MathDiagnosticPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/diagnostic/:subject"
            element={
              <ProtectedRoute>
                <DiagnosticPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <StudentProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results"
            element={
              <ProtectedRoute>
                <PerformancePage />
              </ProtectedRoute>
            }
          />
          {/* Legacy route kept for compatibility or direct access if needed */}
          <Route
            path="/performance"
            element={
              <ProtectedRoute>
                <MathDiagnosticPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
