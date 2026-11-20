import 'server-only';
import { aiPages, toolPath as mcpToolPath } from '@/app/ai/_lib/nav';
import { examples } from '@/app/examples/content';
import { toolPath, tools } from '@/app/tools/_parts/catalogue';
import { routes as toolRoutes } from '@/app/tools/routes';
import { charts, componentGroups, foundationTopics, mcpManifest } from '@/lib/content';

/*
 * The docs' one map: every page of the docs sections, in reading order, as the sidebar lists them
 * and the top bar's trail names them. Built from the same loaders as the pages, so a component,
 * chart, topic or example added to the sources shows here without a line written.
 */

export type DocsLink = { href: string; label: string };

/** A run of links in a section, labelled when the section has more than one (a component family). */
export type DocsGroup = { label?: string; items: DocsLink[] };

export type DocsSection = {
    /** The section's heading in the sidebar. */
    label: string;
    /** Its name in the trail, when that differs from the heading ('Docs' for Getting started). */
    crumb?: string;
    /** Its index page, and the prefix its pages sit under. */
    href: string;
    /** Few enough pages to list on the sidebar's top level, rather than drilling into an index. */
    flat?: boolean;
    groups: DocsGroup[];
};

export type DocsNav = {
    /** The shell's name, for its landmarks and its menu button ("Docs", "Tools"). */
    name: string;
    /** What its search field says. */
    search: string;
    sections: DocsSection[];
    /** Pages under a link that the sidebar does not list (an MCP tool's), for the trail. */
    extras: Record<string, DocsLink & { parent: string }>;
};

export const docsNav = (): DocsNav => {
    const all = examples();
    const families = componentGroups().filter(group => group.components.length > 0);

    const sections: DocsSection[] = [
        {
            label: 'Getting started',
            crumb: 'Docs',
            href: '/docs',
            flat: true,
            groups: [
                {
                    items: [
                        { href: '/docs', label: 'Introduction' },
                        { href: '/docs/install', label: 'Install' },
                    ],
                },
            ],
        },
        {
            label: 'Foundations',
            href: '/foundations',
            groups: [
                {
                    items: [
                        { href: '/foundations', label: 'Overview' },
                        ...foundationTopics().map(topic => ({
                            href: `/foundations/${topic.slug}`,
                            label: topic.name,
                        })),
                    ],
                },
            ],
        },
        {
            label: 'Components',
            href: '/components',
            groups: [
                { items: [{ href: '/components', label: 'Overview' }] },
                ...families.map(group => ({
                    label: group.name,
                    items: group.components.map(item => ({
                        href: `/components/${item.slug}`,
                        label: item.name,
                    })),
                })),
            ],
        },
        {
            label: 'Charts',
            href: '/charts',
            groups: [
                {
                    items: [
                        { href: '/charts', label: 'Overview' },
                        ...charts().charts.map(item => ({
                            href: `/charts/${item.slug}`,
                            label: item.name,
                        })),
                    ],
                },
            ],
        },
        {
            label: 'Examples',
            href: '/examples',
            groups: [
                { items: [{ href: '/examples', label: 'Overview' }] },
                {
                    label: 'Screens',
                    items: all
                        .filter(item => item.pageKind)
                        .map(item => ({ href: `/examples/${item.path}`, label: item.title })),
                },
                {
                    label: 'Blocks',
                    items: all
                        .filter(item => !item.pageKind)
                        .map(item => ({ href: `/examples/${item.path}`, label: item.title })),
                },
            ],
        },
        {
            label: 'AI',
            href: '/ai',
            groups: [{ items: aiPages.map(page => ({ href: page.href, label: page.label })) }],
        },
    ];

    const extras = Object.fromEntries(
        mcpManifest().tools.map(tool => [
            mcpToolPath(tool.slug),
            { href: mcpToolPath(tool.slug), label: tool.name, parent: '/ai/mcp-server' },
        ]),
    );

    return { name: 'Docs', search: 'Search docs', sections, extras };
};

/**
 * The tools' own map: they are a thing of their own, not a part of the docs, so their shell lists
 * them alone. The tools whose page is built, as the sitemap lists them.
 */
export const toolsNav = (): DocsNav => {
    const built = new Set(toolRoutes());
    return {
        name: 'Tools',
        search: 'Search',
        sections: [
            {
                label: 'Tools',
                href: '/tools',
                flat: true,
                groups: [
                    {
                        items: [
                            { href: '/tools', label: 'All tools' },
                            ...tools
                                .filter(tool => built.has(toolPath(tool.slug)))
                                .map(tool => ({ href: toolPath(tool.slug), label: tool.name })),
                        ],
                    },
                ],
            },
        ],
        extras: {},
    };
};
