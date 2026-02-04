import React from 'react';
import { UserProvider } from './providers/UserProvider';

/**
 * Global App Wrapper
 * Wraps the entire application with necessary providers
 * Ensures user authentication is managed globally
 */
export default function AppWrapper({ children }) {
  return (
    <UserProvider>
      {children}
    </UserProvider>
  );
}