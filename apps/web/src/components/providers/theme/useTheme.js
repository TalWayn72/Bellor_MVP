/**
 * Theme hooks - useTheme, useIsDarkMode, useColorTheme
 */

import { useContext } from 'react';
import { ThemeContext } from './ThemeContext';
import { ThemeModes, colorThemes, themes } from './themeConstants';

/**
 * Hook to access theme context
 *
 * @returns {Object} Theme context value
 *
 * @example
 * const { theme, isDark, toggleTheme, setTheme } = useTheme();
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    console.warn('useTheme must be used within a ThemeProvider');
    return {
      theme: ThemeModes.LIGHT,
      colorTheme: 'rose',
      isDark: false,
      currentColorTheme: colorThemes.rose,
      colorThemes,
      themes,
      setTheme: () => {},
      setColorTheme: () => {},
      toggleTheme: () => {},
      ...colorThemes.rose,
    };
  }

  return context;
};

/**
 * Hook to check if dark mode is active
 * @returns {boolean} True if dark mode is active
 */
export const useIsDarkMode = () => {
  const { isDark } = useTheme();
  return isDark;
};

/**
 * Hook to get just the color theme
 * @returns {Object} Current color theme object
 */
export const useColorTheme = () => {
  const { currentColorTheme } = useTheme();
  return currentColorTheme;
};
