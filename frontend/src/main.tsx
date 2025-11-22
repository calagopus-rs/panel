import { createRoot } from 'react-dom/client';
import App from '@/App';
import { Extension, ExtensionContext } from 'shared';
import '@/app.css';

const extensionModules = import.meta.glob('../extensions/*/src/index.ts', { eager: true });
const extensions: Extension[] = [];

for (const [path, module] of Object.entries(extensionModules)) {
  const identifier = path.split('/')[2];
  if (identifier === 'shared') continue;

  if (typeof module === 'object' && 'default' in module && module.default instanceof Extension) {
    module.default.identifier = identifier;
    extensions.push(module.default);
  } else {
    console.error('Invalid frontend module', identifier, module);
  }
}

window.extensionContext = new ExtensionContext(extensions);

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(<App />);
