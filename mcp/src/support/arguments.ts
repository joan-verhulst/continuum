import { z } from 'zod';

/*
 * Arguments several tools share, described once so every tool explains them the same way.
 */

export const mediumArgument = z
    .enum(['react', 'angular', 'vue', 'svelte', 'html', 'css', 'canvas', 'qt', 'other'])
    .describe(
        "Where the UI lives: 'react' (the library's components), 'angular', 'vue', 'svelte', 'html', 'css' (any stack styled with CSS), 'canvas' (Paper or Figma), 'qt' (QSS or QML), 'other'. Decides how fixes and components are written.",
    );

export const modeArgument = z
    .enum(['light', 'dark'])
    .describe("Which mode's values to check against or return. Defaults to 'light'.");

export const themeArgument = z
    .string()
    .describe(
        "The project's theme: a path to the app.css the theme builder exported, or its contents. Leave empty for Continuum's default theme.",
    );

/**
 * A theme as the builder holds it (ThemeOptions in src/lib/create-theme.ts). Loose on purpose: the
 * engine fills every option it is not given, and create_theme's description lists the options.
 */
export const themeOptionsArgument = z
    .record(z.string(), z.unknown())
    .describe(
        'The theme options: accent (hex), neutral (a grey preset id or hex), font (a font id), type (base px), unit (spacing px), size (control height scale), corners, chartHarmony. Empty for the default theme. Call create_theme without options to see every option and its choices.',
    );
