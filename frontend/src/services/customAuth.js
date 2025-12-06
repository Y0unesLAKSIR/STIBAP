import { supabase } from '../supabaseClient';

// Session storage keys
const SESSION_TOKEN_KEY = 'stibap_session_token';
const USER_DATA_KEY = 'stibap_user_data';

/**
 * Custom Authentication Service
 * Uses Supabase database functions for secure authentication
 */

/**
 * Register a new user
 */
export const registerUser = async (email, password, fullName = null) => {
  try {
    const { data, error } = await supabase.rpc('register_user', {
      p_email: email,
      p_password: password,
      p_full_name: fullName
    });

    if (error) {
      console.error('Registration RPC error:', error);
      return { success: false, error: error.message };
    }

    // Parse the JSON response
    const result = typeof data === 'string' ? JSON.parse(data) : data;

    return result;
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Login user
 */
export const loginUser = async (email, password) => {
  try {
    // Get client info for session tracking
    const ipAddress = null; // You can implement IP detection if needed
    const userAgent = navigator.userAgent;

    const { data, error } = await supabase.rpc('login_user', {
      p_email: email,
      p_password: password,
      p_ip_address: ipAddress,
      p_user_agent: userAgent
    });

    if (error) {
      console.error('Login RPC error:', error);
      return { success: false, error: error.message };
    }

    // Parse the JSON response
    const result = typeof data === 'string' ? JSON.parse(data) : data;

    if (result.success) {
      // Store session token and user data
      localStorage.setItem(SESSION_TOKEN_KEY, result.session_token);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(result.user));
    }

    return result;
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verify current session
 */
export const verifySession = async () => {
  try {
    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);

    if (!sessionToken) {
      return { success: false, error: 'No session found' };
    }

    const { data, error } = await supabase.rpc('verify_session', {
      p_session_token: sessionToken
    });

    if (error) {
      console.error('Session verification error:', error);
      clearSession();
      return { success: false, error: error.message };
    }

    // Parse the JSON response
    const result = typeof data === 'string' ? JSON.parse(data) : data;

    if (result.success) {
      // Update stored user data
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(result.user));
    } else {
      clearSession();
    }

    return result;
  } catch (error) {
    console.error('Session verification error:', error);
    clearSession();
    return { success: false, error: error.message };
  }
};

/**
 * Logout user
 */
export const logoutUser = async () => {
  try {
    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);

    if (sessionToken) {
      await supabase.rpc('logout_user', {
        p_session_token: sessionToken
      });
    }

    clearSession();
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    clearSession();
    return { success: true }; // Still clear local session even if server logout fails
  }
};

/**
 * Change password
 */
export const changePassword = async (oldPassword, newPassword) => {
  try {
    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);

    if (!sessionToken) {
      return { success: false, error: 'No active session' };
    }

    const { data, error } = await supabase.rpc('change_password', {
      p_session_token: sessionToken,
      p_old_password: oldPassword,
      p_new_password: newPassword
    });

    if (error) {
      console.error('Change password error:', error);
      return { success: false, error: error.message };
    }

    // Parse the JSON response
    const result = typeof data === 'string' ? JSON.parse(data) : data;

    return result;
  } catch (error) {
    console.error('Change password error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get current user from local storage
 */
export const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Get session token
 */
export const getSessionToken = () => {
  return localStorage.getItem(SESSION_TOKEN_KEY);
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem(SESSION_TOKEN_KEY);
};

/**
 * Clear session data
 */
export const clearSession = () => {
  localStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
};

/**
 * Update stored user data
 */
export const updateStoredUser = (userData) => {
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
};
