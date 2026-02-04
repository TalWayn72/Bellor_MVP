import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authService } from '@/api/services/authService';
import { tokenStorage } from '@/api/client/tokenStorage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkUserAuth = useCallback(async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      // Check if we have a token
      if (!tokenStorage.isAuthenticated()) {
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
        return;
      }

      // Try to get current user
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);

      // If user auth fails, it might be an expired token
      if (error.response?.status === 401 || error.response?.status === 403) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        });
        tokenStorage.clearTokens();
      }
    }
  }, []);

  const login = async (credentials) => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      const { user: loggedInUser } = await authService.login(credentials);
      setUser(loggedInUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);

      return loggedInUser;
    } catch (error) {
      setAuthError({
        type: 'login_failed',
        message: error.response?.data?.message || 'Login failed'
      });
      setIsLoadingAuth(false);
      throw error;
    }
  };

  const register = async (data) => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      const { user: newUser } = await authService.register(data);
      setUser(newUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);

      return newUser;
    } catch (error) {
      setAuthError({
        type: 'registration_failed',
        message: error.response?.data?.message || 'Registration failed'
      });
      setIsLoadingAuth(false);
      throw error;
    }
  };

  const logout = async (shouldRedirect = true) => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setIsAuthenticated(false);

      if (shouldRedirect) {
        window.location.href = '/Login';
      }
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/Login';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings: false, // No public settings to load
      authError,
      login,
      register,
      logout,
      navigateToLogin,
      checkUserAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
