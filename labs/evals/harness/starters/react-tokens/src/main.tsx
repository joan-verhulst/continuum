import '@fontsource-variable/geist';
import './app.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Screen from './Screen';

const mode = new URLSearchParams(window.location.search).get('mode') === 'dark' ? 'dark' : 'light';
document.documentElement.dataset.mode = mode;
document.documentElement.style.colorScheme = mode;

createRoot(document.getElementById('root') as HTMLElement).render(
    <StrictMode>
        <Screen mode={mode} />
    </StrictMode>,
);
