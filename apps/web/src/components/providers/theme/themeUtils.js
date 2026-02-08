/**
 * Theme utility functions - storage, DOM manipulation, system theme detection
 */

import {
  ThemeModes,
  THEME_STORAGE_KEY,
  COLOR_THEME_STORAGE_KEY,
  colorThemes,
} from './themeConstants';

/**
 * Get the initial theme from storage or system preference
 * @returns {string} Initial theme mode
 */
export const getInitialTheme = () => {
  if (typeof window === 'undefined') return ThemeModes.LIGHT;

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && Object.values(ThemeModes).includes(stored)) {
      return stored;
    }
  } catch (error) {
    if (import.meta.env.DEV) console.debug('Failed to read theme from localStorage:', error);
  }

  return ThemeModes.SYSTEM;
};

/**
 * Get the initial color theme from storage
 * @returns {string} Initial color theme id
 */
export const getInitialColorTheme = () => {
  if (typeof window === 'undefined') return 'rose';

  try {
    const stored = localStorage.getItem(COLOR_THEME_STORAGE_KEY);
    if (stored && colorThemes[stored]) {
      return stored;
    }
  } catch (error) {
    if (import.meta.env.DEV) console.debug('Failed to read color theme from localStorage:', error);
  }

  return 'rose';
};

/**
 * Check if system prefers dark mode
 * @returns {boolean} True if system prefers dark mode
 */
export const getSystemTheme = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

/**
 * Apply theme classes and meta tag to the DOM
 * @param {boolean} dark - Whether dark mode is active
 */
export const applyThemeToDOM = (dark) => {
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(dark ? 'dark' : 'light');

  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute(
      'content',
      dark ? 'hsl(229 84% 5%)' : 'hsl(0 0% 100%)'
    );
  }
};

/**
 * Save theme mode to localStorage
 * @param {string} theme - Theme mode to save
 */
export const saveTheme = (theme) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    if (import.meta.env.DEV) console.debug('Failed to save theme to localStorage:', error);
  }
};

/**
 * Save color theme to localStorage
 * @param {string} colorTheme - Color theme id to save
 */
export const saveColorTheme = (colorTheme) => {
  try {
    localStorage.setItem(COLOR_THEME_STORAGE_KEY, colorTheme);
  } catch (error) {
    if (import.meta.env.DEV) console.debug('Failed to save color theme to localStorage:', error);
  }
};
