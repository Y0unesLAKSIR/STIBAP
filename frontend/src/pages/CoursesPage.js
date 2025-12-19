import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import './CoursesPage.css';

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [outline, setOutline] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingOutline, setLoadingOutline] = useState(false);
  const [coursesError, setCoursesError] = useState('');
  const [outlineError, setOutlineError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const fetchCourses = async () => {
      setLoadingCourses(true);
      setCoursesError('');

      try {
        const payload = await apiClient.getCourses();
        const freshCourses = payload.data ?? [];
        if (!isMounted) return;
        setCourses(freshCourses);
        if (!selectedCourseId && freshCourses.length > 0) {
          setSelectedCourseId(freshCourses[0].id);
        }
      } catch (error) {
        if (!isMounted) return;
        setCourses([]);
        setCoursesError(error.message || 'Failed to load courses');
      } finally {
        if (isMounted) {
          setLoadingCourses(false);
        }
      }
    };

    fetchCourses();
    return () => {
      isMounted = false;
    };
  }, [selectedCourseId]);

  useEffect(() => {
    if (!selectedCourseId) {
      setOutline(null);
      setOutlineError('');
      return;
    }

    let isMounted = true;

    const fetchOutline = async () => {
      setLoadingOutline(true);
      setOutlineError('');
      try {
        const payload = await apiClient.getCourseOutline(selectedCourseId);
        if (!payload.success) {
          throw new Error(payload.error || 'Unable to load course structure');
        }
        if (isMounted) {
          setOutline(payload.data);
        }
      } catch (error) {
        if (isMounted) {
          setOutline(null);
          setOutlineError(error.message || 'Unable to load course structure');
        }
      } finally {
        if (isMounted) {
          setLoadingOutline(false);
        }
      }
    };

    fetchOutline();
    return () => {
      isMounted = false;
    };
  }, [selectedCourseId]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) || null,
    [courses, selectedCourseId]
  );

  const tutorialSteps = useMemo(() => {
    if (!selectedCourse) return [];
    const moduleCount = outline?.modules?.length ?? 0;
    const unitCount = outline?.modules?.reduce(
      (acc, mod) => acc + (mod.units?.length ?? 0),
      0
    );

    return [
      {
        title: 'Course manifest (course.json)',
        detail: `Describe ${selectedCourse.title} with duration ${
          selectedCourse.duration_minutes ?? 'TBD'
        } minutes, ${selectedCourse.category?.name ?? 'General'} category, and keywords such as ${
          selectedCourse.keywords?.slice(0, 4).join(', ') || 'curriculum'
        }.`,
      },
      {
        title: 'Modules and units',
        detail: `The tutorial recommends directories per module. This course already expects ${moduleCount} module${
          moduleCount === 1 ? '' : 's'
        } and ${unitCount || 'several'} unit entries in ${selectedCourse.slug}.`,
      },
      {
        title: 'Shared assets',
        detail: selectedCourse.assets?.length
          ? `Re-use ${selectedCourse.assets.length} shared file${
              selectedCourse.assets.length === 1 ? '' : 's'
            } listed via assets/.`
          : 'Add shared assets under assets/ when you reuse slides, datasets or images across modules.',
      },
      {
        title: 'Upload + refresh',
        detail: 'Compress the structure, upload from the admin panel, then hit Refresh to make the course live.',
      },
    ];
  }, [selectedCourse, outline]);

  return (
    <div className="courses-page">
      <div className="courses-page__hero">
        <div>
          <div className="eyebrow">Instructor-Led Guidance</div>
          <h1>Courses suite aligned with the admin tutorial</h1>
          <p>
            Every course you upload via the admin bundle now has a default landing page here. The
            right-hand canvas visualizes the recommended structure (modules, units, assets) while the
            checklist reminds your team how the ZIP should be organized.
          </p>
        </div>
        <div className="hero-actions">
          <button onClick={() => navigate('/')} disabled={loadingCourses}>
            Back to Home
          </button>
        </div>
      </div>

      <div className="courses-page__main">
        <section className="courses-page__list">
          <div className="courses-page__list-header">
            <h2>Active courses</h2>
            <button onClick={() => setSelectedCourseId(null)} disabled={loadingCourses}>
              Reload
            </button>
          </div>
          {loadingCourses ? (
            <div className="courses-page__status">Loading courses…</div>
          ) : coursesError ? (
            <div className="courses-page__status">{coursesError}</div>
          ) : courses.length === 0 ? (
            <div className="courses-page__status">No courses available yet.</div>
          ) : (
            <div className="course-list">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className={`course-list-item ${selectedCourseId === course.id ? 'active' : ''}`}
                  onClick={() => setSelectedCourseId(course.id)}
                >
                  <h3>{course.title}</h3>
                  <small>
                    {course.category?.name ?? 'General'} • {course.difficulty?.name ?? 'Unspecified'}
                  </small>
                  <small>{course.description?.slice(0, 80) || 'No description yet.'}</small>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="courses-page__detail">
          {!selectedCourse ? (
            <div className="courses-page__detail-empty">Select a course to review its default page.</div>
          ) : (
            <div className="courses-page__detail-card">
              <div className="detail-header">
                <div>
                  <h2>{selectedCourse.title}</h2>
                  <p>{selectedCourse.description}</p>
                </div>
                <button className="btn-primary" onClick={() => navigate(`/courses/${selectedCourse.id}`)}>
                  Open Course
                </button>
              </div>

              <div className="courses-page__metadata-grid">
                <div className="metadata-card">
                  <span>Category</span>
                  <strong>{selectedCourse.category?.name ?? 'General'}</strong>
                </div>
                <div className="metadata-card">
                  <span>Difficulty</span>
                  <strong>{selectedCourse.difficulty?.name ?? 'Unspecified'}</strong>
                </div>
                <div className="metadata-card">
                  <span>Duration</span>
                  <strong>
                    {selectedCourse.duration_minutes ? `${selectedCourse.duration_minutes} min` : 'TBD'}
                  </strong>
                </div>
                <div className="metadata-card">
                  <span>Updated</span>
                  <strong>
                    {selectedCourse.updated_at
                      ? new Date(selectedCourse.updated_at).toLocaleDateString()
                      : 'Not published'}
                  </strong>
                </div>
              </div>

              <div className="courses-page__tutorial-card">
                <h3>Admin tutorial adaptation</h3>
                <p>
                  This canvas mirrors the admin instructions so every course landing page clearly surfaces the
                  expected structure.
                </p>
                <ul className="courses-page__checklist">
                  {tutorialSteps.map((step, index) => (
                    <li key={step.title}>
                      <strong>{index + 1}. {step.title}:</strong> {step.detail}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="course-outline">
                <h3>Course outline</h3>
                {loadingOutline ? (
                  <p>Loading outline…</p>
                ) : outlineError ? (
                  <p style={{ color: '#dc2626' }}>{outlineError}</p>
                ) : outline?.modules?.length ? (
                  outline.modules.map((module) => (
                    <article key={module.id} className="module-card">
                      <header>
                        <div>
                          <h4>{`${module.order_index ?? module.id}. ${module.title}`}</h4>
                          <p>{module.description}</p>
                        </div>
                        <span>{(module.units?.length ?? 0)} units</span>
                      </header>
                      <ul>
                        {(module.units || []).map((unit) => (
                          <li key={unit.id} className="unit-row">
                            <span>
                              {unit.order_index}. {unit.title}
                            </span>
                            <span className="assets-badge">{unit.unit_type}</span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))
                ) : (
                  <p style={{ color: '#475569' }}>Outline not available yet.</p>
                )}
              </div>

              <div className="courses-page__assets-list">
                {(selectedCourse.assets || []).map((asset) => (
                  <span key={asset.file?.split('/').pop() ?? asset.file_name} className="asset-chip">
                    {asset.file_name ?? asset.file ?? 'Asset'}
                  </span>
                ))}
              </div>

              <div className="courses-page__learning-outcomes">
                {(selectedCourse.learning_outcomes || []).map((outcome) => (
                  <span key={outcome} className="outcome-pill">
                    {outcome}
                  </span>
                ))}
              </div>

              <p className="courses-page__footer-note">
                Tip: After you upload or update this course via the admin panel, re-fetch this page so the AI
                recommendations and outline stay aligned with the latest ZIP archive.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default CoursesPage;
