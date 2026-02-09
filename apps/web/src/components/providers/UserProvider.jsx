import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '@/api/services/authService';
import { tokenStorage } from '@/api/client/tokenStorage';
import { reportAuthCheckFailed, reportTokenCleared } from '@/security/securityEventReporter';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      try {
        // Check if user is authenticated
        if (!tokenStorage.isAuthenticated()) {
          if (isMounted) {
            setCurrentUser(null);
            setIsAuthenticated(false);
            setIsLoading(false);
          }
          return;
        }

        // Get current user from API
        const user = await authService.getCurrentUser();
        if (isMounted) {
          setCurrentUser(user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        reportAuthCheckFailed('UserProvider.fetchUser', error.response?.status);
        if (isMounted) {
          setCurrentUser(null);
          setIsAuthenticated(false);

          // Clear invalid tokens
          if (error.response?.status === 401) {
            reportTokenCleared('UserProvider.fetchUser', 'Token cleared after 401 response');
            tokenStorage.clearTokens();
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateUser = (userData) => {
    setCurrentUser(prev => ({ ...prev, ...userData }));
  };

  const refreshUser = async () => {
    try {
      setIsLoading(true);
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error refreshing user:', error);
      reportAuthCheckFailed('UserProvider.refreshUser', error.response?.status);
      setCurrentUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    currentUser,
    isLoading,
    isAuthenticated,
    updateUser,
    refreshUser
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}