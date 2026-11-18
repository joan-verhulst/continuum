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

/** Whether a path is in a section: its index, a page under it, or one of its `also` paths. */
export const inSection = (pathname: string, section: Section) =>
    [section.href, ...(section.also ?? [])].some(
        href => pathname === href || pathname.startsWith(`${href}/`),
    );
