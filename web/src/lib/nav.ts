/*
 * The site's sections, in the header's order. The header reads this list, so a section added here
 * shows up in it; the footer maps every page from the content itself (lib/footer-links.ts).
 */

export type Section = {
    /** The section's path, its index page ('/components'). */
    href: string;
    label: string;
    /** Paths that also count as this section in the header (charts sit under Components). */
    also?: readonly string[];
};

export const sections: readonly Section[] = [
    { href: '/components', label: 'Components', also: ['/charts'] },
    { href: '/examples', label: 'Examples' },
    { href: '/foundations', label: 'Foundations' },
    { href: '/ai', label: 'AI' },
    { href: '/tools', label: 'Tools' },
];

/**
 * The sections whose pages sit in a shell: a sidebar beside them, a top bar with the trail and the
 * search over them. The docs sections share one shell; the tools have one of their own, listing
 * only the tools. Compare stays a page of the site.
 */
export const shellPrefixes = [
    '/docs',
    '/foundations',
    '/components',
    '/charts',
    '/examples',
    '/ai',
    '/tools',
] as const;

/** Whether a path's page sits in a shell, the docs' or the tools'. */
export const inShell = (pathname: string) =>
    shellPrefixes.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));

/** Whether a path is in a section: its index, a page under it, or one of its `also` paths. */
export const inSection = (pathname: string, section: Section) =>
    [section.href, ...(section.also ?? [])].some(
        href => pathname === href || pathname.startsWith(`${href}/`),
    );
