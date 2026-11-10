'use client';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '../src/store/authStore.js';

export default function Providers({ children }) {
  const init = useAuthStore(s => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#161d2e',
            color: '#e8ecf4',
            border: '1px solid #1e2a3d',
            borderRadius: '12px',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#161d2e' } },
          error:   { iconTheme: { primary: '#f43f5e', secondary: '#161d2e' } },
        }}
      />
    </>
  );
}
