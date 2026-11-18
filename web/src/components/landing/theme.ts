import { createThemeCss, type ThemeOptions } from 'continuum';

/*
 * The site's own theme, ContinuumUI (brand/continuum-ui/app.css), as the builder's options: the
 * action plain (white in dark mode), Continuum's blue as the accent for what the components show,
 * the tinted greys. The landing's colour is its rainbow rim light (rim-light.tsx), not the accent.
 */

export const SITE_THEME = 'site';

export const siteTheme: ThemeOptions = {
    accent: '#3939e5',
    action: 'neutral',
    actionStyle: 'flat',
    neutral: { hue: 232, tint: 0.004 },
    curves: { neutral: { lightest: 1, darkest: 0.13, midtones: -0.5 } },
    chartHarmony: 'square',
    radius: 1.5,
};

export const siteThemeCss = createThemeCss({ ...siteTheme, name: SITE_THEME });

/**
 * What the product shots wear (the hero's screens, the components wall): the site's theme with the
 * accent filling the action, so the product shows its colour while the site round it stays plain.
 */
export const PRODUCT_THEME = 'product';

export const productTheme: ThemeOptions = { ...siteTheme, action: 'accent' };

export const productThemeCss = createThemeCss({ ...productTheme, name: PRODUCT_THEME });
