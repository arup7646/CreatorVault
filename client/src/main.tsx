import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
          <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#1f2937', color: '#fff' }, success: { iconTheme: { primary: '#10b981', secondary: '#fff' }, style: { background: '#064e3b', color: '#fff' }, error: { iconTheme: { primary: '#ef4444', secondary: '#fff' }, style: { background: '#7f1d1d', color: '#fff' } } }} />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);