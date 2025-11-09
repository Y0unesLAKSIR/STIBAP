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

  // Users data
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);

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
                <button className="btn-primary" disabled>
                  + Add Category (Coming Soon)
                </button>
              </div>
              <div className="coming-soon">
                <h3>🏷️ Category Management</h3>
                <p>Coming soon! You'll be able to:</p>
                <ul>
                  <li>Create and organize categories</li>
                  <li>Set up category hierarchies</li>
                  <li>Manage category icons and descriptions</li>
                  <li>Assign courses to categories</li>
                </ul>
              </div>
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
