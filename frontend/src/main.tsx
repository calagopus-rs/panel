import { createRoot } from 'react-dom/client';
import App from '@/App';
import '@/app.css';

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(<App />);
