import { useUser } from '../providers/UserProvider';

/**
 * Custom hook for accessing current user
 * Now uses global UserContext instead of making separate API calls
 * This eliminates duplicate 401 errors across the app
 */
export function useCurrentUser() {
  return useUser();
}