import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#161d2e',
            color: '#e8ecf4',
            border: '1px solid #1e2a3d',
            borderRadius: '10px',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#161d2e' } },
          error:   { iconTheme: { primary: '#f43f5e', secondary: '#161d2e' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
