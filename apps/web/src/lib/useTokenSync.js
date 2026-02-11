import { useEffect } from 'react';
import { tokenStorage } from '@/api/client/tokenStorage';

/**
 * Syncs AuthContext state when apiClient silently refreshes or clears tokens.
 * Listens for 'bellor-token-refreshed' and 'bellor-tokens-cleared' custom events.
 */
export function useTokenSync({ isAuthenticated, setIsAuthenticated, setUser }) {
  useEffect(() => {
    const handleTokenRefreshed = () => {
      if (!isAuthenticated && tokenStorage.isAuthenticated()) {
        setIsAuthenticated(true);
      }
    };

    const handleTokensCleared = () => {
      setUser(null);
      setIsAuthenticated(false);
    };

    window.addEventListener('bellor-token-refreshed', handleTokenRefreshed);
    window.addEventListener('bellor-tokens-cleared', handleTokensCleared);

    return () => {
      window.removeEventListener('bellor-token-refreshed', handleTokenRefreshed);
      window.removeEventListener('bellor-tokens-cleared', handleTokensCleared);
    };
  }, [isAuthenticated, setIsAuthenticated, setUser]);
}
