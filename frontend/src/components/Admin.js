import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSessionToken } from '../services/customAuth';
import AdminCourseManager from './AdminCourseManager';
import './Admin.css';

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoryEdits, setCategoryEdits] = useState({});

  // Users data
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);

  // User assignments data
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [userAssignments, setUserAssignments] = useState({});

  // Check if user is admin
  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      navigate('/home');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
    if (activeTab === 'courses') {
      fetchCourses();
    }
    if (activeTab === 'categories') {
      fetchCategories();
      fetchAdminCourses();
    }
    if (activeTab === 'assignments') {
      fetchUsers();
      fetchCourses();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const sessionToken = getSessionToken();
      if (!sessionToken) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:8000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users || []);
      } else {
        setError(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = useCallback(async () => {
    setCoursesLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/courses', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setCourses(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch courses');
      }
    } catch (err) {
      setError('Failed to fetch courses');
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  const fetchAdminCourses = useCallback(async () => {
    setCoursesLoading(true);
    try {
      const sessionToken = getSessionToken();
      if (!sessionToken) {
        setError('Not authenticated');
        setCoursesLoading(false);
        return;
      }
      const response = await fetch('http://localhost:8000/api/admin/courses', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        },
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setCourses(data.courses || []);
      } else {
        setError(data.error || 'Failed to fetch courses');
      }
    } catch (err) {
      setError('Failed to fetch courses');
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/categories', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch categories');
      }
    } catch (err) {
      setError('Failed to fetch categories');
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const handleAssignCategory = async (courseId) => {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const sessionToken = getSessionToken();
      if (!sessionToken) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }
      const category_id = categoryEdits[courseId];
      if (!category_id) {
        setError('Please select a category');
        setLoading(false);
        return;
      }
      const response = await fetch(`http://localhost:8000/api/admin/courses/${courseId}/category`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ category_id })
      });
      const data = await response.json();
      if (data.success) {
        setMessage('Category updated successfully');
        await fetchAdminCourses();
      } else {
        setError(data.error || 'Failed to update category');
      }
    } catch (err) {
      setError('Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const sessionToken = getSessionToken();
      if (!sessionToken) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const response = await fetch(`http://localhost:8000/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('User updated successfully!');
        setEditingUser(null);
        fetchUsers();
      } else {
        setError(data.error || 'Failed to update user');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    await handleUpdateUser(userId, { is_active: !currentStatus });
  };

  const handleAssignUserToCourse = async () => {
    if (!selectedUser || !selectedCourse) {
      setError('Please select both a user and a course');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const sessionToken = getSessionToken();
      if (!sessionToken) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:8000/api/admin/assign-user-course', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          user_id: selectedUser,
          course_id: selectedCourse,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`User successfully assigned to course!`);
        setSelectedUser('');
        setSelectedCourse('');
        setUserAssignments(prev => ({
          ...prev,
          [selectedUser]: [...(prev[selectedUser] || []), selectedCourse]
        }));
      } else {
        setError(data.error || 'Failed to assign user to course');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="header-content">
          <div>
            <h1>🛡️ Admin Panel</h1>
            <p>Manage users, courses, and categories</p>
          </div>
          <button onClick={() => navigate('/home')} className="back-button">
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div className="admin-content">
        <div className="admin-tabs">
          <button
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Users
          </button>
          <button
            className={`tab-button ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            📚 Courses
          </button>
          <button
            className={`tab-button ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            🏷️ Categories
          </button>
          <button
            className={`tab-button ${activeTab === 'assignments' ? 'active' : ''}`}
            onClick={() => setActiveTab('assignments')}
          >
            🎯 Assignments
          </button>
          <button
            className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            📊 Statistics
          </button>
        </div>

        <div className="admin-panel">
          {message && (
            <div className="success-message">
              ✓ {message}
            </div>
          )}
          {error && (
            <div className="error-message">
              ✗ {error}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="admin-section">
              <div className="section-header">
                <h2>User Management</h2>
                <button className="btn-primary" disabled>
                  + Add User (Coming Soon)
                </button>
              </div>

              {loading && <div className="loading-spinner">Loading users...</div>}

              {!loading && users.length === 0 && (
                <div className="empty-state">
                  <p>No users found</p>
                </div>
              )}

              {!loading && users.length > 0 && (
                <div className="users-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Last Login</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td>
                            {editingUser?.id === u.id ? (
                              <input
                                type="text"
                                value={editingUser.full_name || ''}
                                onChange={(e) => setEditingUser({
                                  ...editingUser,
                                  full_name: e.target.value
                                })}
                                className="edit-input"
                              />
                            ) : (
                              u.full_name || 'N/A'
                            )}
                          </td>
                          <td>
                            {editingUser?.id === u.id ? (
                              <input
                                type="email"
                                value={editingUser.email || ''}
                                onChange={(e) => setEditingUser({
                                  ...editingUser,
                                  email: e.target.value
                                })}
                                className="edit-input"
                              />
                            ) : (
                              u.email
                            )}
                          </td>
                          <td>
                            {editingUser?.id === u.id ? (
                              <select
                                value={editingUser.role}
                                onChange={(e) => setEditingUser({
                                  ...editingUser,
                                  role: e.target.value
                                })}
                                className="edit-select"
                              >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                                <option value="superadmin">Super Admin</option>
                              </select>
                            ) : (
                              <span className={`role-badge role-${u.role}`}>
                                {u.role}
                              </span>
                            )}
                          </td>
                          <td>
                            <span className={`status-badge ${u.is_active ? 'active' : 'inactive'}`}>
                              {u.is_active ? '● Active' : '○ Inactive'}
                            </span>
                          </td>
                          <td className="date-cell">
                            {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="actions-cell">
                            {editingUser?.id === u.id ? (
                              <>
                                <button
                                  onClick={() => handleUpdateUser(u.id, {
                                    full_name: editingUser.full_name,
                                    email: editingUser.email,
                                    role: editingUser.role,
                                  })}
                                  className="btn-save"
                                  disabled={loading}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingUser(null)}
                                  className="btn-cancel"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => setEditingUser(u)}
                                  className="btn-edit"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                                  className={`btn-toggle ${u.is_active ? 'deactivate' : 'activate'}`}
                                  disabled={loading}
                                >
                                  {u.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <div className="admin-section">
              <div className="section-header">
                <h2>Course Management</h2>
              </div>
              <AdminCourseManager />
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="admin-section">
              <div className="section-header">
                <h2>Category Management</h2>
                <div className="actions">
                  <button type="button" className="btn-secondary" onClick={() => { fetchCategories(); fetchAdminCourses(); }} disabled={categoriesLoading || coursesLoading}>
                    {categoriesLoading || coursesLoading ? 'Refreshing…' : 'Refresh'}
                  </button>
                </div>
              </div>

              {(categoriesLoading || coursesLoading) && (
                <div className="loading-spinner">Loading categories and courses…</div>
              )}

              {!categoriesLoading && !coursesLoading && courses.length === 0 && (
                <div className="empty-state">
                  <p>No courses found</p>
                </div>
              )}

              {!categoriesLoading && !coursesLoading && courses.length > 0 && (
                <div className="users-table courses-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Current Category</th>
                        <th>Change To</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((c) => (
                        <tr key={c.id}>
                          <td>{c.title}</td>
                          <td>{c.category?.name || '—'}</td>
                          <td>
                            <select
                              className="edit-select"
                              value={categoryEdits[c.id] || c.category?.id || ''}
                              onChange={(e) => setCategoryEdits(prev => ({ ...prev, [c.id]: e.target.value }))}
                            >
                              <option value="">Select category…</option>
                              {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <button className="btn-save" onClick={() => handleAssignCategory(c.id)} disabled={loading || !categoryEdits[c.id]}>
                              Assign
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Assignments Tab */}
          {activeTab === 'assignments' && (
            <div className="admin-section">
              <div className="section-header">
                <h2>User Course Assignments</h2>
                <p style={{ margin: 0, color: '#718096', fontSize: '14px' }}>
                  Assign specific users to courses
                </p>
              </div>

              <div className="assignment-form">
                <div className="form-group">
                  <label htmlFor="user-select">Select User</label>
                  <select
                    id="user-select"
                    className="edit-select"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                  >
                    <option value="">Choose a user...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name || u.email} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="course-select">Select Course</label>
                  <select
                    id="course-select"
                    className="edit-select"
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                  >
                    <option value="">Choose a course...</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  className="btn-primary"
                  onClick={handleAssignUserToCourse}
                  disabled={loading || !selectedUser || !selectedCourse}
                  style={{ marginTop: '16px' }}
                >
                  {loading ? 'Assigning...' : '✓ Assign User to Course'}
                </button>
              </div>

              {(loading || coursesLoading) && (
                <div className="loading-spinner">Loading data...</div>
              )}

              {!loading && !coursesLoading && users.length === 0 && (
                <div className="empty-state">
                  <p>No users available</p>
                </div>
              )}

              {!loading && !coursesLoading && courses.length === 0 && (
                <div className="empty-state">
                  <p>No courses available</p>
                </div>
              )}
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && (
            <div className="admin-section">
              <h2>Platform Statistics</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-value">{users.length}</div>
                  <div className="stat-label">Total Users</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📚</div>
                  <div className="stat-value">6</div>
                  <div className="stat-label">Total Courses</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🏷️</div>
                  <div className="stat-value">15+</div>
                  <div className="stat-label">Categories</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-value">{users.filter(u => u.is_active).length}</div>
                  <div className="stat-label">Active Users</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
