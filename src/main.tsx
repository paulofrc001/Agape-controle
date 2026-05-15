import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('Agape App Booting...');

window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global Error:', message, error);
  const root = document.getElementById('root');
  if (root && root.innerHTML === '') {
    root.innerHTML = '<div style="padding: 20px; color: white; background: #0a0a0a; font-family: serif; text-align: center;">' +
      '<h1 style="color: #C5A059;">G</h1>' +
      '<p>Ocorreu um erro ao carregar o sistema.</p>' +
      '<p style="font-size: 10px; color: #666;">Verifique as configurações e tente novamente.</p>' +
      '</div>';
  }
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
