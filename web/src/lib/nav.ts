/*
 * The site's sections, in the header's order. The header, the footer and the landing's nav all
 * read these lists, so a section added here shows up everywhere.
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

/** The footer's columns: every section, then the rest of the site. */
export const footerColumns: readonly { title: string; links: readonly Section[] }[] = [
    {
        title: 'System',
        links: [
            { href: '/components', label: 'Components' },
            { href: '/charts', label: 'Charts' },
            { href: '/examples', label: 'Examples' },
            { href: '/foundations', label: 'Foundations' },
        ],
    },
    {
        title: 'With AI',
        links: [
            { href: '/ai', label: 'Overview' },
            { href: '/ai/mcp-server', label: 'MCP server' },
            { href: '/ai/skills', label: 'Skills' },
            { href: '/ai/audit', label: 'Audit' },
        ],
    },
    {
        title: 'Tools',
        links: [
            { href: '/tools/theme-builder', label: 'Theme builder' },
            { href: '/tools', label: 'All tools' },
            { href: '/docs/install', label: 'Install' },
        ],
    },
];
