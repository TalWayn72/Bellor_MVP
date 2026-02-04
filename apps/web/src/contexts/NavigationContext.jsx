import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NavigationContext = createContext();

/**
 * NavigationProvider - Manages navigation history for better back button support
 *
 * Features:
 * - Tracks navigation history (last 50 entries)
 * - Provides goBack with fallback support
 * - Works with deep links and browser refresh
 */
export function NavigationProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [history, setHistory] = useState([]);
  const [canGoBack, setCanGoBack] = useState(false);

  // Track navigation history
  useEffect(() => {
    setHistory(prev => {
      // Avoid duplicate consecutive entries
      if (prev[prev.length - 1] === location.pathname) {
        return prev;
      }
      const newHistory = [...prev, location.pathname];
      // Keep last 50 entries
      return newHistory.slice(-50);
    });
  }, [location.pathname]);

  useEffect(() => {
    setCanGoBack(history.length > 1);
  }, [history]);

  /**
   * Navigate back to previous page or fallback
   * @param {string} fallbackPath - Path to use if no history (default: /SharedSpace)
   */
  const goBack = useCallback((fallbackPath = '/SharedSpace') => {
    if (history.length > 1) {
      const previousPath = history[history.length - 2];
      setHistory(prev => prev.slice(0, -1));
      navigate(previousPath);
    } else {
      navigate(fallbackPath);
    }
  }, [history, navigate]);

  /**
   * Navigate to a specific path
   * @param {string} path - Path to navigate to
   */
  const goTo = useCallback((path) => {
    navigate(path);
  }, [navigate]);

  /**
   * Replace current location (no history entry)
   * @param {string} path - Path to replace with
   */
  const replace = useCallback((path) => {
    setHistory(prev => prev.slice(0, -1));
    navigate(path, { replace: true });
  }, [navigate]);

  /**
   * Clear navigation history
   */
  const clearHistory = useCallback(() => {
    setHistory([location.pathname]);
  }, [location.pathname]);

  return (
    <NavigationContext.Provider
      value={{
        goBack,
        goTo,
        replace,
        clearHistory,
        canGoBack,
        history,
        currentPath: location.pathname
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

/**
 * Hook to access navigation context
 * @returns {Object} Navigation context value
 */
export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};

export default NavigationContext;
