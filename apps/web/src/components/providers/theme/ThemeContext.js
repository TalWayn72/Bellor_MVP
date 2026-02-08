/**
 * Theme context - shared between ThemeProvider and useTheme
 * Extracted to its own file to avoid circular dependencies
 */

import { createContext } from 'react';

export const ThemeContext = createContext(undefined);
