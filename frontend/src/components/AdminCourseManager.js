import React, { useState, useEffect, useCallback } from 'react';
import AdminCourseTutorial from './AdminCourseTutorial';
import { getSessionToken } from '../services/customAuth';
import './AdminCourseManager.css';

const AdminCourseManager = ({ onImportComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [courseId, setCourseId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState(null);

  const fetchCourses = useCallback(async () => {
    setCoursesLoading(true);
    setCoursesError(null);

    try {
      const sessionToken = getSessionToken();
      if (!sessionToken) {
        setCourses([]);
        setCoursesError('Admin session required to view courses.');
        return;
      }

      const API_BASE = process.env.REACT_APP_API_URL ?? 'http://localhost:8000';
      const response = await fetch(`${API_BASE}/api/admin/courses`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.detail || data.error || 'Failed to load courses');
      }

      setCourses(Array.isArray(data.courses) ? data.courses : []);
    } catch (err) {
      setCoursesError(err.message);
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      setError('Please select a course package (.zip) to upload.');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const sessionToken = getSessionToken();
      if (!sessionToken) {
        setError('You must be logged in as an admin to import courses.');
        return;
      }

      const formData = new FormData();
      formData.append('file', selectedFile);

      const API_BASE = process.env.REACT_APP_API_URL ?? 'http://localhost:8000';
      const endpoint = courseId.trim()
        ? `${API_BASE}/api/admin/courses/import?course_id=${encodeURIComponent(courseId.trim())}`
        : `${API_BASE}/api/admin/courses/import`;

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Course import failed');
      }

      setResult(data);
      if (typeof onImportComplete === 'function') {
        onImportComplete(data);
      }

      await fetchCourses();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="admin-course-manager">
      <div className="manager-header">
        <h2>Course Importer</h2>
        <button
          type="button"
          className="tutorial-toggle"
          onClick={() => setShowTutorial((prev) => !prev)}
        >
          {showTutorial ? 'Hide Tutorial' : 'Show Tutorial'}
        </button>
      </div>

      {showTutorial && <AdminCourseTutorial />}

      <form onSubmit={handleSubmit} className="import-form">
        <div className="form-row">
          <label htmlFor="course-archive">Course archive (.zip)</label>
          <input
            id="course-archive"
            type="file"
            accept=".zip"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </div>

        <div className="form-row">
          <label htmlFor="course-id">Existing course ID (optional)</label>
          <input
            id="course-id"
            type="text"
            placeholder="Provide to update an existing course"
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
            disabled={uploading}
          />
        </div>

        <button type="submit" disabled={uploading}>
          {uploading ? 'Uploading…' : 'Upload Course'}
        </button>
      </form>

      {error && (
        <div className="import-error">{error}</div>
      )}

      <section className="courses-list">
        <div className="courses-list__header">
          <h3>Available Courses</h3>
          <button type="button" onClick={fetchCourses} disabled={coursesLoading}>
            {coursesLoading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {coursesError && (
          <div className="courses-list__error">{coursesError}</div>
        )}

        {!coursesError && courses.length === 0 && !coursesLoading && (
          <div className="courses-list__empty">No courses found.</div>
        )}

        {courses.length > 0 && (
          <div className="users-table courses-table">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Slug</th>
                  <th>Category</th>
                  <th>Difficulty</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id}>
                    <td>{course.title}</td>
                    <td>{course.slug}</td>
                    <td>{course.category?.name ?? '—'}</td>
                    <td>{course.difficulty?.name ?? '—'}</td>
                    <td>{course.updated_at ? new Date(course.updated_at).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {result && (
        <div className="import-success">
          <h3>{result.message}</h3>
          <dl className="import-summary">
            <div className="import-summary-row">
              <dt>Course ID</dt>
              <dd>{result.course_id}</dd>
            </div>
            <div className="import-summary-row">
              <dt>Slug</dt>
              <dd>{result.slug}</dd>
            </div>
            {result.source_file_url && (
              <div className="import-summary-row">
                <dt>Source File</dt>
                <dd>{result.source_file_url}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
};

export default AdminCourseManager;
