/**
 * BackendStatus Component
 * Shows a banner when the backend server is not running
 */

import React, { useState, useEffect } from 'react';

export function BackendStatus() {
  const [isOffline, setIsOffline] = useState(false);
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => {
    const handleBackendOffline = (event) => {
      setIsOffline(true);
      setApiUrl(event.detail?.url || 'http://localhost:3000');
    };

    window.addEventListener('backend-offline', handleBackendOffline);

    return () => {
      window.removeEventListener('backend-offline', handleBackendOffline);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#dc2626',
        color: 'white',
        padding: '12px 16px',
        zIndex: 9999,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        textAlign: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      <strong>Backend Server Not Running!</strong>
      <span style={{ marginLeft: '8px' }}>
        The API at {apiUrl} is not responding.
      </span>
      <span style={{ marginLeft: '16px', opacity: 0.9 }}>
        Run: <code style={{
          backgroundColor: 'rgba(255,255,255,0.2)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontFamily: 'monospace'
        }}>npm run dev:api</code>
      </span>
      <button
        onClick={() => setIsOffline(false)}
        style={{
          marginLeft: '16px',
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
        }}
      >
        Dismiss
      </button>
    </div>
  );
}

export default BackendStatus;
