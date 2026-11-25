import { Theme, ToastProvider } from '@contui/ui';
import type { ComponentType } from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/geist';
import '../../styles.css';

/*
 * A temporary harness for comparing the skill before and after a rewrite: each test screen is a
 * file in ./screens, opened at skilltest.html?screen=<file name>&mode=light|dark, full page, in
 * Continuum's default theme. Lab code: delete it with the test.
 */

const modules = import.meta.glob<{ default: ComponentType }>('./screens/*.tsx', { eager: true });
const screens = Object.fromEntries(
    Object.entries(modules).map(([path, module]) => [
        path.replace('./screens/', '').replace('.tsx', ''),
        module.default,
    ]),
);

const params = new URLSearchParams(window.location.search);
const Screen = screens[params.get('screen') ?? ''];
const mode = params.get('mode') === 'dark' ? 'dark' : 'light';
document.documentElement.style.colorScheme = mode;

const root = document.getElementById('root');

if (root) {
    createRoot(root).render(
        <StrictMode>
            <Theme className="min-h-dvh bg-neutral-100 text-neutral-950" mode={mode}>
                <ToastProvider>
                    {Screen ? (
                        <Screen />
                    ) : (
                        <p className="p-8">
                            Screens: {Object.keys(screens).join(', ') || 'none yet'}
                        </p>
                    )}
                </ToastProvider>
            </Theme>
        </StrictMode>,
    );
}
