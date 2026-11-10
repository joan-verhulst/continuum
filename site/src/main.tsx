import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';
import { Colours } from './colours';
// Imported here rather than in styles.css so Vite resolves the font files.
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
// The presets on show set their screens in Inter.
import '@fontsource-variable/inter';
import './styles.css';

const root = document.getElementById('root');

if (root) {
    createRoot(root).render(
        // #colours keeps the accent study the site's colour was picked from.
        <StrictMode>{window.location.hash === '#colours' ? <Colours /> : <App />}</StrictMode>,
    );
}
