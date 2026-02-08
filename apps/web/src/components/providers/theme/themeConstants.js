/**
 * Theme mode definitions and color theme objects
 */

export const ThemeModes = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

export const THEME_STORAGE_KEY = 'bellor-theme';
export const COLOR_THEME_STORAGE_KEY = 'bellor-color-theme';

export const colorThemes = {
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
 */
export const themes = {
  orange: colorThemes.coral,
  blue: colorThemes.blue,
  pink: colorThemes.rose,
};
