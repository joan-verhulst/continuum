import { createThemeCss, type ThemeOptions } from 'continuum';

/*
 * The site's own theme: amber, the lit action, the accent tint, in dark mode. Change the accent
 * here and the whole site follows; the product shots on the page keep their own themes.
 */

export const SITE_THEME = 'site';

export const siteTheme: ThemeOptions = {
    accent: '#ffa31a',
    action: 'accent',
    actionStyle: 'lit',
    tint: 'accent',
};

export const siteThemeCss = createThemeCss({ ...siteTheme, name: SITE_THEME });
