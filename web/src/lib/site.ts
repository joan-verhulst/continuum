/*
 * The site's addresses and switches, read from the environment once. Safe on the server and in
 * the browser: every variable is NEXT_PUBLIC_, so Next inlines it into both.
 */

/** Strips a trailing slash, so paths join with one. */
const bare = (url: string) => url.replace(/\/+$/, '');

/** Where the site lives: canonical URLs, the sitemap and Open Graph are built on it. */
export const siteUrl = bare(process.env.NEXT_PUBLIC_SITE_URL || 'https://contui.dev');

/**
 * The app (today's playground): every "Get started" leads there. It
 * lives at /app on the site itself, in dev (passed through to the playground's server) and in a
 * build (its files in public/app), so one address serves both.
 */
export const appUrl = bare(process.env.NEXT_PUBLIC_APP_URL || '/app');

/**
 * Whether search engines may index the site. Off until the domain is attached: robots.txt then
 * disallows everything and every page says noindex.
 */
export const indexable = process.env.NEXT_PUBLIC_INDEXABLE === 'true';

/** The repository, for the header's GitHub link and the install commands. */
export const githubUrl = 'https://github.com/joan-verhulst/continuum';

/** The product's name, and the short one for everything typed (domain, npx, npm). */
export const brand = { name: 'Continuum', short: 'contui' } as const;

/** One line on what Continuum is: the default description and the Open Graph fallback. */
export const tagline =
    'Continuum is a free design system for React products. Build screens with its components and give your coding agent the same rules for layout, theming and design review.';

/** An absolute URL for a site path ('/components/button' → 'https://contui.dev/components/button'). */
export const absolute = (path: string) => `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;

/**
 * A link into the app. The playground keeps its place in the hash (`#view=projects&component=…`, see
 * playground/src/meta.ts), so a view and its parts go there: `appLink({ view: 'projects' })` opens the
 * theme builder, `appLink({ view: 'components', component: 'button' })` one component. No argument:
 * the app's front door, where every "Get started" leads.
 */
export const appLink = (params?: Record<string, string>) =>
    params ? `${appUrl}/#${new URLSearchParams(params)}` : appUrl;

/** The theme builder, a page of the site itself: every "Open the theme builder" leads here. */
export const themeBuilderUrl = '/tools/theme-builder';

/**
 * The theme builder, started from a colour where the way in has one (a palette tool, the landing's
 * customizer): `?accent=#ffa31a` starts a fresh theme from it, or brings it into one already made
 * as an unsaved change.
 */
export const themeBuilderLink = (accent?: string) =>
    accent ? `${themeBuilderUrl}?${new URLSearchParams({ accent })}` : themeBuilderUrl;
