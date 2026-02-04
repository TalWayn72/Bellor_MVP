/**
 * Bellor Theme Provider
 * ======================
 *
 * Manages theme state for the Bellor application including:
 * - Dark/Light mode switching
 * - Color theme variants
 * - System preference detection
 * - Theme persistence in localStorage
 *
 * @version 2.0.0
 * @author Claude Code
 * @license MIT
 *
 * @example
 * // Wrap your app with ThemeProvider
 * <ThemeProvider defaultTheme="system" defaultColorTheme="rose">
 *   <App />
 * </ThemeProvider>
 *
 * // Use the theme in components
 * const { theme, colorTheme, setTheme, setColorTheme, isDark } = useTheme();
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';

/**
 * Storage key for persisting theme preferences
 */
const THEME_STORAGE_KEY = 'bellor-theme';
const COLOR_THEME_STORAGE_KEY = 'bellor-color-theme';

/**
 * Available theme modes
 * @type {Object}
 */
export const ThemeModes = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

/**
 * Color theme definitions
 * Each theme includes Tailwind utility classes for consistent styling
 *
 * @type {Object}
 */
export const colorThemes = {
  /**
   * Rose - Primary romantic theme (Default)
   * Matches the Figma design system primary color
   */
  rose: {
    id: 'rose',
    name: 'Rose',
    description: 'Romantic rose theme (Default)',
    primary: 'hsl(349 89% 55%)',
    primaryHex: '#EC4374',
    gradient: 'from-primary-400 to-primary-600',
    gradientDark: 'from-primary-500 to-primary-700',
    text: 'text-primary',
    textMuted: 'text-primary-600',
    bg: 'bg-primary',
    bgLight: 'bg-primary-50',
    bgHover: 'hover:bg-primary-600',
    border: 'border-primary',
    ring: 'ring-primary',
    shadow: 'shadow-primary-md',
  },

  /**
   * Purple - Secondary romantic theme
   * Matches the Figma design system secondary color
   */
  purple: {
    id: 'purple',
    name: 'Purple',
    description: 'Elegant purple theme',
    primary: 'hsl(271 91% 65%)',
    primaryHex: '#A855F7',
    gradient: 'from-secondary-400 to-secondary-600',
    gradientDark: 'from-secondary-500 to-secondary-700',
    text: 'text-secondary-500',
    textMuted: 'text-secondary-600',
    bg: 'bg-secondary-500',
    bgLight: 'bg-secondary-50',
    bgHover: 'hover:bg-secondary-600',
    border: 'border-secondary-500',
    ring: 'ring-secondary-500',
    shadow: 'shadow-secondary-md',
  },

  /**
   * Coral - Warm accent theme
   * Matches the Figma design system accent color
   */
  coral: {
    id: 'coral',
    name: 'Coral',
    description: 'Warm coral theme',
    primary: 'hsl(25 95% 53%)',
    primaryHex: '#F97316',
    gradient: 'from-accent-400 to-accent-600',
    gradientDark: 'from-accent-500 to-accent-700',
    text: 'text-accent-500',
    textMuted: 'text-accent-600',
    bg: 'bg-accent-500',
    bgLight: 'bg-accent-50',
    bgHover: 'hover:bg-accent-600',
    border: 'border-accent-500',
    ring: 'ring-accent-500',
    shadow: 'shadow-[0_4px_14px_-3px_hsl(25_95%_53%_/_0.4)]',
  },

  /**
   * Blue - Trust & stability theme
   */
  blue: {
    id: 'blue',
    name: 'Blue',
    description: 'Classic blue theme',
    primary: 'hsl(199 89% 48%)',
    primaryHex: '#0EA5E9',
    gradient: 'from-info-400 to-info-600',
    gradientDark: 'from-info-500 to-info-700',
    text: 'text-info-500',
    textMuted: 'text-info-600',
    bg: 'bg-info-500',
    bgLight: 'bg-info-50',
    bgHover: 'hover:bg-info-600',
    border: 'border-info-500',
    ring: 'ring-info-500',
    shadow: 'shadow-[0_4px_14px_-3px_hsl(199_89%_48%_/_0.4)]',
  },
};

/**
 * Legacy theme mapping for backward compatibility
 * Maps old theme names to new color theme system
 */
export const themes = {
  orange: colorThemes.coral,
  blue: colorThemes.blue,
  pink: colorThemes.rose,
};

/**
 * Theme context for providing theme state throughout the app
 */
const ThemeContext = createContext(undefined);

/**
 * Get the initial theme from storage or system preference
 *
 * @returns {string} Initial theme mode
 */
const getInitialTheme = () => {
  if (typeof window === 'undefined') return ThemeModes.LIGHT;

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && Object.values(ThemeModes).includes(stored)) {
      return stored;
    }
  } catch (error) {
    console.warn('Failed to read theme from localStorage:', error);
  }

  return ThemeModes.SYSTEM;
};

/**
 * Get the initial color theme from storage
 *
 * @returns {string} Initial color theme id
 */
const getInitialColorTheme = () => {
  if (typeof window === 'undefined') return 'rose';

  try {
    const stored = localStorage.getItem(COLOR_THEME_STORAGE_KEY);
    if (stored && colorThemes[stored]) {
      return stored;
    }
  } catch (error) {
    console.warn('Failed to read color theme from localStorage:', error);
  }

  return 'rose';
};

/**
 * Check if system prefers dark mode
 *
 * @returns {boolean} True if system prefers dark mode
 */
const getSystemTheme = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

/**
 * ThemeProvider Component
 *
 * Provides theme context to the application with support for:
 * - Light/Dark/System theme modes
 * - Multiple color themes
 * - Persistent storage
 * - System preference detection
 *
 * @param {Object} props Component props
 * @param {React.ReactNode} props.children Child components
 * @param {string} [props.defaultTheme='system'] Default theme mode
 * @param {string} [props.defaultColorTheme='rose'] Default color theme
 * @param {string} [props.themeName] Legacy prop for backward compatibility
 * @returns {JSX.Element} Provider component
 */
export const ThemeProvider = ({
  children,
  defaultTheme = 'system',
  defaultColorTheme = 'rose',
  themeName, // Legacy prop
}) => {
  // Theme mode state (light/dark/system)
  const [theme, setThemeState] = useState(() => getInitialTheme());

  // Color theme state (rose/purple/coral/blue)
  const [colorTheme, setColorThemeState] = useState(() => {
    // Handle legacy themeName prop
    if (themeName) {
      if (themeName === 'pink') return 'rose';
      if (themeName === 'orange') return 'coral';
      if (colorThemes[themeName]) return themeName;
    }
    return getInitialColorTheme();
  });

  // Resolved dark mode state
  const [isDark, setIsDark] = useState(() => {
    const initial = getInitialTheme();
    if (initial === ThemeModes.SYSTEM) {
      return getSystemTheme();
    }
    return initial === ThemeModes.DARK;
  });

  /**
   * Update the DOM with the current theme
   */
  const applyTheme = useCallback((dark) => {
    const root = window.document.documentElement;

    // Remove both classes first
    root.classList.remove('light', 'dark');

    // Add the appropriate class
    root.classList.add(dark ? 'dark' : 'light');

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        dark ? 'hsl(229 84% 5%)' : 'hsl(0 0% 100%)'
      );
    }
  }, []);

  /**
   * Set the theme mode and persist to storage
   */
  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);

    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }

    // Update isDark based on new theme
    if (newTheme === ThemeModes.SYSTEM) {
      const systemDark = getSystemTheme();
      setIsDark(systemDark);
      applyTheme(systemDark);
    } else {
      const dark = newTheme === ThemeModes.DARK;
      setIsDark(dark);
      applyTheme(dark);
    }
  }, [applyTheme]);

  /**
   * Set the color theme and persist to storage
   */
  const setColorTheme = useCallback((newColorTheme) => {
    if (!colorThemes[newColorTheme]) {
      console.warn(`Invalid color theme: ${newColorTheme}`);
      return;
    }

    setColorThemeState(newColorTheme);

    try {
      localStorage.setItem(COLOR_THEME_STORAGE_KEY, newColorTheme);
    } catch (error) {
      console.warn('Failed to save color theme to localStorage:', error);
    }
  }, []);

  /**
   * Toggle between light and dark modes
   */
  const toggleTheme = useCallback(() => {
    setTheme(isDark ? ThemeModes.LIGHT : ThemeModes.DARK);
  }, [isDark, setTheme]);

  /**
   * Listen for system theme changes
   */
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e) => {
      if (theme === ThemeModes.SYSTEM) {
        setIsDark(e.matches);
        applyTheme(e.matches);
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Legacy browsers
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [theme, applyTheme]);

  /**
   * Apply theme on initial mount
   */
  useEffect(() => {
    applyTheme(isDark);
  }, [isDark, applyTheme]);

  /**
   * Get the current color theme object
   */
  const currentColorTheme = useMemo(() => {
    return colorThemes[colorTheme] || colorThemes.rose;
  }, [colorTheme]);

  /**
   * Context value with memoization for performance
   */
  const contextValue = useMemo(() => ({
    // Current states
    theme,
    colorTheme,
    isDark,

    // Theme objects
    currentColorTheme,
    colorThemes,
    themes, // Legacy support

    // Actions
    setTheme,
    setColorTheme,
    toggleTheme,

    // Utility classes (for backward compatibility)
    ...currentColorTheme,
  }), [
    theme,
    colorTheme,
    isDark,
    currentColorTheme,
    setTheme,
    setColorTheme,
    toggleTheme,
  ]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to access theme context
 *
 * @returns {Object} Theme context value
 * @throws {Error} If used outside of ThemeProvider (in development)
 *
 * @example
 * const { theme, isDark, toggleTheme, setTheme } = useTheme();
 *
 * // Toggle dark mode
 * <button onClick={toggleTheme}>Toggle Dark Mode</button>
 *
 * // Set specific theme
 * <button onClick={() => setTheme('dark')}>Dark Mode</button>
 *
 * // Access color theme utilities
 * <button className={`${bg} ${bgHover} text-white`}>Button</button>
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    // Return default values for components that might be rendered
    // outside the provider (e.g., during testing or SSR)
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
 * Convenience hook for simple dark mode checks
 *
 * @returns {boolean} True if dark mode is active
 */
export const useIsDarkMode = () => {
  const { isDark } = useTheme();
  return isDark;
};

/**
 * Hook to get just the color theme
 * Convenience hook for color theme access
 *
 * @returns {Object} Current color theme object
 */
export const useColorTheme = () => {
  const { currentColorTheme } = useTheme();
  return currentColorTheme;
};

export default ThemeProvider;
