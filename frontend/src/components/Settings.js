import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';
import AdminCourseManager from './AdminCourseManager';
import { getSessionToken } from '../services/customAuth';
import './Settings.css';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState({
    full_name: '',
    bio: '',
    avatar_url: ''
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('profile');
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (user === null) {
      navigate('/login');
      return;
    }

    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        bio: user.bio || '',
        avatar_url: user.avatar_url || ''
      });
    }
  }, [user, navigate]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordInputChange = (event) => {
    const { name, value } = event.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (event) => {
    event.preventDefault();
    setLoading(true);
    setNotification(null);

    try {
      const sessionToken = await getSessionToken();
      if (!sessionToken) {
        setNotification({ type: 'error', text: 'Not authenticated. Please login again.' });
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        credentials: 'include',
        body: JSON.stringify(profileData)
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setNotification({ type: 'success', text: data.message || 'Profile updated successfully!' });

        if (data.user) {
          setProfileData({
            full_name: data.user.full_name || '',
            bio: data.user.bio || '',
            avatar_url: data.user.avatar_url || ''
          });
        }

        try {
          await updateUser();
        } catch (refreshError) {
          console.error('Error refreshing user:', refreshError);
        }
      } else {
        setNotification({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setNotification({ type: 'error', text: 'Profile update failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setLoading(true);
    setNotification(null);

    if (passwordData.new_password !== passwordData.confirm_password) {
      setNotification({ type: 'error', text: 'New passwords do not match' });
      setLoading(false);
      return;
    }

    if (passwordData.new_password.length < 6) {
      setNotification({ type: 'error', text: 'New password must be at least 6 characters' });
      setLoading(false);
      return;
    }

    try {
      const sessionToken = await getSessionToken();
      if (!sessionToken) {
        setNotification({ type: 'error', text: 'Not authenticated. Please login again.' });
        setLoading(false);
        return;
      }

      const payload = {
        old_password: passwordData.current_password,
        new_password: passwordData.new_password
      };

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setNotification({ type: 'success', text: data.message || 'Password changed successfully!' });
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        setNotification({ type: 'error', text: data.error || 'Failed to change password' });
      }
    } catch (error) {
      console.error('Password change error:', error);
      setNotification({ type: 'error', text: 'Password change failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="settings-page">
        <Loader />
      </div>
    );
  }

  return (
    <div className="settings-page">
      <h1>Account Settings</h1>

      <div className="settings-tabs">
        <button
          type="button"
          className={`tab-button ${tab === 'profile' ? 'active' : ''}`}
          onClick={() => setTab('profile')}
          disabled={loading}
        >
          Profile
        </button>
        <button
          type="button"
          className={`tab-button ${tab === 'security' ? 'active' : ''}`}
          onClick={() => setTab('security')}
          disabled={loading}
        >
          Security
        </button>
      </div>

      {notification && (
        <div className={`toast ${notification.type}`} role="status">
          <div className="toast-content">
            <span className="toast-icon">{notification.type === 'success' ? '✓' : '✗'}</span>
            <span className="toast-message">{notification.text}</span>
          </div>
          <button
            type="button"
            className="toast-close"
            onClick={() => setNotification(null)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}

      {tab === 'profile' && (
        <section className="settings-section">
          <h2>Profile Information</h2>
          <form className="settings-form" onSubmit={handleProfileUpdate}>
            <div className="form-group">
              <label htmlFor="full_name">Full Name</label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                value={profileData.full_name}
                onChange={handleProfileChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                rows="4"
                value={profileData.bio}
                onChange={handleProfileChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="avatar_url">Avatar URL</label>
              <input
                id="avatar_url"
                name="avatar_url"
                type="url"
                value={profileData.avatar_url}
                onChange={handleProfileChange}
                disabled={loading}
              />
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading}>
                {loading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </section>
      )}

      {tab === 'security' && (
        <section className="settings-section">
          <h2>Change Password</h2>
          <form className="settings-form" onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label htmlFor="current_password">Current Password</label>
              <input
                id="current_password"
                name="current_password"
                type="password"
                value={passwordData.current_password}
                onChange={handlePasswordInputChange}
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="new_password">New Password</label>
              <input
                id="new_password"
                name="new_password"
                type="password"
                value={passwordData.new_password}
                onChange={handlePasswordInputChange}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm_password">Confirm New Password</label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                value={passwordData.confirm_password}
                onChange={handlePasswordInputChange}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading}>
                {loading ? 'Updating…' : 'Change Password'}
              </button>
            </div>
          </form>

          <div className="danger-zone">
            <h3>Danger Zone</h3>
            <p>Account deletion is coming soon.</p>
            <div className="danger-actions">
              <button type="button" disabled>
                Delete Account (Coming Soon)
              </button>
            </div>
          </div>
        </section>
      )}

      {user?.role === 'admin' && (
        <section className="admin-section">
          <h2>Admin Tools</h2>
          <AdminCourseManager />
        </section>
      )}
    </div>
  );
};

export default Settings;
