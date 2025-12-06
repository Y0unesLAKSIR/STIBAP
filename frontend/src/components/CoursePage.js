import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSessionToken } from '../services/customAuth';
import apiClient from '../services/apiClient';
import './CoursePage.css';

const CoursePage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [outline, setOutline] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});

  const loadCourseData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch course details
      const courseResp = await apiClient.getCourse(courseId);
      if (!courseResp.success) {
        throw new Error(courseResp.error || 'Failed to load course');
      }
      setCourse(courseResp.data);

      // Fetch course outline with content
      const outlineResp = await apiClient.getCourseOutline(courseId);
      if (!outlineResp.success) {
        throw new Error(outlineResp.error || 'Failed to load course outline');
      }
      
      console.log('Outline response:', outlineResp.data);
      
      // Handle both response formats: { modules: [...] } or { course: {...}, modules: [...] }
      const outlineData = outlineResp.data?.modules ? outlineResp.data : { modules: [] };
      setOutline(outlineData);

      // Set first module and unit as selected
      const modules = outlineData?.modules || [];
      console.log('Modules found:', modules.length);
      
      if (modules.length > 0) {
        const firstModule = modules[0];
        setSelectedModule(firstModule.id);
        setExpandedModules({ [firstModule.id]: true });

        const units = firstModule.units || [];
        console.log('Units in first module:', units.length);
        
        if (units.length > 0) {
          setSelectedUnit(units[0].id);
        }
      }

      // Fetch user progress
      const sessionToken = getSessionToken();
      if (sessionToken) {
        const progResp = await apiClient.getCourseProgress(courseId, sessionToken);
        if (progResp.success) {
          setProgress(progResp.data);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load course');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCourseData();
  }, [loadCourseData]);

  const toggleModuleExpand = (moduleId) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const handleUnitSelect = (moduleId, unitId) => {
    setSelectedModule(moduleId);
    setSelectedUnit(unitId);
  };

  const handleCompleteUnit = async () => {
    if (!selectedUnit) return;
    try {
      const sessionToken = getSessionToken();
      if (!sessionToken) {
        setError('You must be logged in to mark units as complete');
        return;
      }

      const resp = await apiClient.completeUnit(courseId, selectedUnit, sessionToken);
      if (!resp.success) {
        throw new Error(resp.error || 'Failed to mark unit as complete');
      }

      // Refresh progress
      await loadCourseData();
    } catch (err) {
      setError(err.message);
    }
  };

  const currentModule = outline?.modules?.find((m) => m.id === selectedModule);
  const currentUnit = currentModule?.units?.find((u) => u.id === selectedUnit);
  const isUnitCompleted = progress?.completed_unit_ids?.includes(selectedUnit);
  const progressPercentage = progress?.percentage || 0;

  if (loading) {
    return (
      <div className="course-page">
        <div className="course-loading">
          <div className="spinner"></div>
          <p>Loading course...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="course-page">
        <div className="course-error">
          <h2>Error Loading Course</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-page">
        <div className="course-error">
          <h2>Course Not Found</h2>
          <button onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="course-page">
      {/* Header */}
      <div className="course-header">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back
        </button>
        <div className="course-header-content">
          <h1>{course.title}</h1>
          <p className="course-description">{course.description}</p>
          <div className="course-meta">
            <span className="meta-item">
              📚 {course.category?.name || 'General'}
            </span>
            <span className="meta-item">
              📊 {course.difficulty?.name || 'All Levels'}
            </span>
            <span className="meta-item">
              ⏱️ {course.duration_minutes || 0} minutes
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="course-container">
        {/* Sidebar - Module Navigation */}
        <aside className="course-sidebar">
          <div className="sidebar-header">
            <h3>📖 Course Content</h3>
            <div className="progress-info">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <span className="progress-text">{Math.round(progressPercentage)}% Complete</span>
            </div>
          </div>

          <div className="modules-list">
            {!outline?.modules || outline.modules.length === 0 ? (
              <div style={{ padding: '16px', color: '#9ca3af', textAlign: 'center' }}>
                <p>No modules available for this course.</p>
              </div>
            ) : (
              outline.modules.map((module, idx) => (
                <div key={module.id} className="module-item">
                  <button
                    className={`module-header ${
                      selectedModule === module.id ? 'active' : ''
                    }`}
                    onClick={() => {
                      toggleModuleExpand(module.id);
                      setSelectedModule(module.id);
                      if (module.units && module.units.length > 0) {
                        setSelectedUnit(module.units[0].id);
                      }
                    }}
                  >
                    <span className="module-toggle">
                      {expandedModules[module.id] ? '▼' : '▶'}
                    </span>
                    <span className="module-number">Module {idx + 1}</span>
                    <span className="module-title">{module.title}</span>
                  </button>

                  {expandedModules[module.id] && (
                    <div className="units-list">
                      {!module.units || module.units.length === 0 ? (
                        <div style={{ padding: '8px 16px', color: '#9ca3af', fontSize: '0.85rem' }}>
                          No units in this module
                        </div>
                      ) : (
                        module.units.map((unit, unitIdx) => {
                          const isCompleted = progress?.completed_unit_ids?.includes(
                            unit.id
                          );
                          return (
                            <button
                              key={unit.id}
                              className={`unit-item ${
                                selectedUnit === unit.id ? 'active' : ''
                              } ${isCompleted ? 'completed' : ''}`}
                              onClick={() => handleUnitSelect(module.id, unit.id)}
                            >
                              <span className="unit-icon">
                                {isCompleted ? '✓' : '○'}
                              </span>
                              <span className="unit-type">{unit.unit_type}</span>
                              <span className="unit-title">{unit.title}</span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="course-content">
          {currentUnit ? (
            <div className="unit-viewer">
              <div className="unit-header">
                <div>
                  <h2>{currentUnit.title}</h2>
                  <p className="unit-type-label">
                    {currentUnit.unit_type.charAt(0).toUpperCase() +
                      currentUnit.unit_type.slice(1)}
                  </p>
                </div>
                <button
                  className={`complete-button ${isUnitCompleted ? 'completed' : ''}`}
                  onClick={handleCompleteUnit}
                  disabled={isUnitCompleted}
                >
                  {isUnitCompleted ? '✓ Completed' : 'Mark as Complete'}
                </button>
              </div>

              <div className="unit-body">
                {currentUnit.content ? (
                  <div className="content-markdown">
                    {typeof currentUnit.content === 'string'
                      ? currentUnit.content
                      : currentUnit.content.body || JSON.stringify(currentUnit.content)}
                  </div>
                ) : (
                  <p className="no-content">No content available for this unit.</p>
                )}
              </div>

              {/* Assets */}
              {currentUnit.assets && currentUnit.assets.length > 0 && (
                <div className="unit-assets">
                  <h3>📎 Resources</h3>
                  <ul>
                    {currentUnit.assets.map((asset, idx) => (
                      <li key={idx}>
                        <a
                          href={asset.storage_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="asset-link"
                        >
                          {asset.file_name || asset.file}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Navigation */}
              <div className="unit-navigation">
                <button
                  className="nav-button prev"
                  onClick={() => {
                    const currentIdx = allUnits.findIndex(
                      (u) => u.unit.id === selectedUnit
                    );
                    if (currentIdx > 0) {
                      const prev = allUnits[currentIdx - 1];
                      handleUnitSelect(prev.module.id, prev.unit.id);
                    }
                  }}
                  disabled={
                    allUnits.findIndex((u) => u.unit.id === selectedUnit) === 0
                  }
                >
                  ← Previous
                </button>
                <button
                  className="nav-button next"
                  onClick={() => {
                    const currentIdx = allUnits.findIndex(
                      (u) => u.unit.id === selectedUnit
                    );
                    if (currentIdx < allUnits.length - 1) {
                      const next = allUnits[currentIdx + 1];
                      handleUnitSelect(next.module.id, next.unit.id);
                    }
                  }}
                  disabled={
                    allUnits.findIndex((u) => u.unit.id === selectedUnit) ===
                    allUnits.length - 1
                  }
                >
                  Next →
                </button>
              </div>
            </div>
          ) : (
            <div className="no-unit-selected">
              <p>Select a unit to begin</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

// Helper to get all units in order
const allUnits = (outline) => {
  const arr = [];
  (outline?.modules || []).forEach((m) => {
    (m.units || []).forEach((u) => arr.push({ module: m, unit: u }));
  });
  return arr;
};

export default CoursePage;
