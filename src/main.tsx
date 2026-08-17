import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { BRAND_LOGO_SRC } from './constants/brandLogo';

// Ensure browser tab favicon is always set with authentic brand logo
(function setFavicon() {
  try {
    const existing = document.querySelectorAll("link[rel*='icon']");
    existing.forEach((el) => el.remove());

    const iconLink = document.createElement('link');
    iconLink.rel = 'icon';
    iconLink.type = 'image/png';
    iconLink.href = BRAND_LOGO_SRC;
    document.head.appendChild(iconLink);

    const shortcutLink = document.createElement('link');
    shortcutLink.rel = 'shortcut icon';
    shortcutLink.href = BRAND_LOGO_SRC;
    document.head.appendChild(shortcutLink);

    const appleIcon = document.createElement('link');
    appleIcon.rel = 'apple-touch-icon';
    appleIcon.href = BRAND_LOGO_SRC;
    document.head.appendChild(appleIcon);
  } catch (e) {
    console.warn('Favicon injection notice:', e);
  }
})();

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && event.reason.message.includes('The play() request was interrupted')) {
    event.preventDefault(); // Suppress the error
  }
});

window.addEventListener('error', (event) => {
  if (event.message && event.message.includes('The play() request was interrupted')) {
    event.preventDefault();
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      console.log('SW registered');
    }).catch(err => {
      console.log('SW reg failed', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
