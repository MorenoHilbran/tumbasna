import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Filter error dari browser extensions dan DOM errors
const originalError = console.error;
console.error = (...args) => {
  const errorMessage = args.join(' ');
  // Abaikan error dari browser extensions dan DOM manipulation
  if (
    errorMessage.includes('content-all.js') ||
    errorMessage.includes('Message ID') ||
    errorMessage.includes('already has a listener') ||
    errorMessage.includes('chrome-extension://') ||
    errorMessage.includes('moz-extension://') ||
    errorMessage.includes('removeChild') ||
    errorMessage.includes('NotFoundError')
  ) {
    return; // Suppress extension and DOM errors
  }
  originalError.apply(console, args);
};

// Suppress console.warn for certain patterns
const originalWarn = console.warn;
console.warn = (...args) => {
  const warnMessage = args.join(' ');
  if (
    warnMessage.includes('removeChild') ||
    warnMessage.includes('Suppressed Extension')
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

// Global error handler untuk extension dan DOM errors
window.addEventListener('error', (event) => {
  if (
    event.filename?.includes('content-all.js') ||
    event.filename?.includes('chrome-extension') ||
    event.filename?.includes('moz-extension') ||
    event.message?.includes('Message ID') ||
    event.message?.includes('removeChild') ||
    event.error?.name === 'NotFoundError'
  ) {
    event.stopImmediatePropagation();
    event.preventDefault();
    return false;
  }
});

// Unhandled Promise Rejection handler
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  if (
    reason?.message?.includes('removeChild') ||
    reason?.name === 'NotFoundError' ||
    reason?.stack?.includes('chrome-extension')
  ) {
    event.stopImmediatePropagation();
    event.preventDefault();
    return false;
  }
});

// Registrasi Service Worker untuk PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('Service Worker registered successfully:', reg.scope))
      .catch((err) => console.error('Service Worker registration failed:', err));
  });
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
