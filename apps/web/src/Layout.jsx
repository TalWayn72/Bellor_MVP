import React from 'react';
import { UserProvider } from './components/providers/UserProvider';
import { ThemeProvider } from './components/providers/ThemeProvider';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/api';
import { useAuth } from '@/lib/AuthContext';

/**
 * Root Layout Component
 * Wraps all pages with UserProvider and ThemeProvider
 * Fetches admin's selected theme and AppSettings for custom colors
 */
export default function Layout({ children, currentPageName }) {
  const { isAuthenticated } = useAuth();

  // Fetch admin user to get selected theme
  const { data: adminUsers = [] } = useQuery({
    queryKey: ['adminTheme'],
    queryFn: async () => {
      try {
        if (!isAuthenticated) return [];
        const result = await userService.searchUsers({ role: 'admin', limit: 1 });
        return result.users || [];
      } catch (error) {
        return [];
      }
    },
    enabled: isAuthenticated,
  });

  // Demo color settings (AppSetting service can be added in future)
  const colorSettings = [];

  const selectedTheme = Array.isArray(adminUsers) && adminUsers[0]?.selected_theme
    ? adminUsers[0].selected_theme
    : 'blue';

  // Extract custom colors if they exist
  const customColors = Array.isArray(colorSettings)
    ? colorSettings.reduce((acc, setting) => {
        if (setting.data_type === 'color') {
          acc[setting.key] = setting.value;
        }
        return acc;
      }, {})
    : {};

  return (
    <UserProvider>
      <ThemeProvider themeName={selectedTheme}>
        <div className="min-h-screen">
          {/* Apply custom CSS variables for colors */}
          {Object.keys(customColors).length > 0 && (
            <style>
              {`:root {
                ${Object.entries(customColors).map(([key, value]) => 
                  `--${key}: ${value};`
                ).join('\n')}
              }`}
            </style>
          )}
          {children}
        </div>
      </ThemeProvider>
    </UserProvider>
  );
}