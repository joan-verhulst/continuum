import '@fontsource-variable/geist';
import './app.css';
import { Theme, ToastProvider } from 'continuum';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Screen from './Screen';

const mode = new URLSearchParams(window.location.search).get('mode') === 'dark' ? 'dark' : 'light';
document.documentElement.style.colorScheme = mode;

createRoot(document.getElementById('root') as HTMLElement).render(
    <StrictMode>
        <Theme className="min-h-dvh bg-neutral-100 text-neutral-950" mode={mode}>
            <ToastProvider>
                <Screen mode={mode} />
            </ToastProvider>
        </Theme>
    </StrictMode>,
);
