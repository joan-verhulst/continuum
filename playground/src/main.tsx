import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';
// Imported here rather than in styles.css so Vite resolves the font files.
import '@fontsource-variable/geist';
import '@fontsource-variable/inter';
import './styles.css';

const root = document.getElementById('root');

if (root) {
    createRoot(root).render(
        <StrictMode>
            <App />
        </StrictMode>,
    );
}
