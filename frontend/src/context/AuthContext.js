import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import {
  registerUser,
  loginUser,
  logoutUser,
  verifySession,
  getCurrentUser,
  changePassword
} from '../services/customAuth';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkSession = useCallback(async () => {
    setLoading(true);
    const currentUser = getCurrentUser();
    
    if (currentUser) {
      // Verify session with server
      const result = await verifySession();
      
      if (result.success) {
        setUser(result.user);
      } else {
        setUser(null);
      }
    } else {
      setUser(null);
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    // Check if user has active session on mount
    checkSession();
  }, [checkSession]);

  const signUp = async (email, password, fullName = null) => {
    try {
      const result = await registerUser(email, password, fullName);
      
      if (result.success) {
        return { data: result, error: null };
      } else {
        return { data: null, error: { message: result.error } };
      }
    } catch (error) {
      return { data: null, error: { message: error.message } };
    }
  };

  const signIn = async (email, password) => {
    try {
      const result = await loginUser(email, password);
      
      if (result.success) {
        setUser(result.user);
        return { data: result, error: null };
      } else {
        return { data: null, error: { message: result.error } };
      }
    } catch (error) {
      return { data: null, error: { message: error.message } };
    }
  };

  const signOut = async () => {
    try {
      await logoutUser();
      setUser(null);
      return { error: null };
    } catch (error) {
      return { error: { message: error.message } };
    }
  };

  const updatePassword = async (oldPassword, newPassword) => {
    try {
      const result = await changePassword(oldPassword, newPassword);
      
      if (result.success) {
        return { data: result, error: null };
      } else {
        return { data: null, error: { message: result.error } };
      }
    } catch (error) {
      return { data: null, error: { message: error.message } };
    }
  };

  const value = {
    user,
    signUp,
    signIn,
    signOut,
    updatePassword,
    loading,
    refreshSession: checkSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
