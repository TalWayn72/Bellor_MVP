/**
 * Bellor Theme Provider
 * Context + state + effects + provider wrapper
 */

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';

import { ThemeModes, colorThemes, themes } from './theme/themeConstants';
import {
  getInitialTheme,
  getInitialColorTheme,
  getSystemTheme,
  applyThemeToDOM,
  saveTheme,
  saveColorTheme,
} from './theme/themeUtils';
import { ThemeContext } from './theme/ThemeContext';

// Re-export everything consumers need from a single entry point
export { ThemeModes, colorThemes, themes } from './theme/themeConstants';
export { useTheme, useIsDarkMode, useColorTheme } from './theme/useTheme';
export { ThemeContext } from './theme/ThemeContext';

export const ThemeProvider = ({
  children,
  defaultTheme = 'system',
  defaultColorTheme = 'rose',
  themeName,
}) => {
  const [theme, setThemeState] = useState(() => getInitialTheme());

  const [colorTheme, setColorThemeState] = useState(() => {
    if (themeName) {
      if (themeName === 'pink') return 'rose';
      if (themeName === 'orange') return 'coral';
      if (colorThemes[themeName]) return themeName;
    }
    return getInitialColorTheme();
  });

  const [isDark, setIsDark] = useState(() => {
    const initial = getInitialTheme();
    if (initial === ThemeModes.SYSTEM) return getSystemTheme();
    return initial === ThemeModes.DARK;
  });

  const applyTheme = useCallback((dark) => {
    applyThemeToDOM(dark);
  }, []);

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    saveTheme(newTheme);

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

  const setColorTheme = useCallback((newColorTheme) => {
    if (!colorThemes[newColorTheme]) {
      if (import.meta.env.DEV) console.debug(`Invalid color theme: ${newColorTheme}`);
      return;
    }
    setColorThemeState(newColorTheme);
    saveColorTheme(newColorTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(isDark ? ThemeModes.LIGHT : ThemeModes.DARK);
  }, [isDark, setTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (theme === ThemeModes.SYSTEM) {
        setIsDark(e.matches);
        applyTheme(e.matches);
      }
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
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

  useEffect(() => {
    applyTheme(isDark);
  }, [isDark, applyTheme]);

  const currentColorTheme = useMemo(() => {
    return colorThemes[colorTheme] || colorThemes.rose;
  }, [colorTheme]);

  const contextValue = useMemo(() => ({
    theme,
    colorTheme,
    isDark,
    currentColorTheme,
    colorThemes,
    themes,
    setTheme,
    setColorTheme,
    toggleTheme,
    ...currentColorTheme,
  }), [
    theme, colorTheme, isDark, currentColorTheme,
    setTheme, setColorTheme, toggleTheme,
  ]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
