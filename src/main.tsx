import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { makeServer } from './services/mockApi';

if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "production") {
  makeServer();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
