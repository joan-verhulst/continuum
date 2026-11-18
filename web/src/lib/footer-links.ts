import 'server-only';
import { aiPages, toolPath as mcpToolPath } from '@/app/ai/_lib/nav';
import { comparisons } from '@/app/compare/content';
import { examples } from '@/app/examples/content';
import { toolPath, tools } from '@/app/tools/_parts/catalogue';
import { routes as toolRoutes } from '@/app/tools/routes';
import { charts, components, foundationTopics, mcpManifest } from '@/lib/content';

/*
 * The footer's map of the site: every page the site generates, by section, from the same loaders as
 * the pages and the sitemap, so a new component, chart or example shows here without a line written.
 * It is for readers looking for one page and for search engines following links alike.
 */

export type FooterLink = { href: string; label: string };
export type FooterColumn = { title: string; href: string; links: FooterLink[] };

export const footerMap = (): { components: FooterColumn; columns: FooterColumn[] } => {
    const built = new Set(toolRoutes());
    return {
        components: {
            title: 'Components',
            href: '/components',
            links: components().map(item => ({
                href: `/components/${item.slug}`,
                label: item.name,
            })),
        },
        columns: [
            {
                title: 'Charts',
                href: '/charts',
                links: charts().charts.map(item => ({
                    href: `/charts/${item.slug}`,
                    label: item.name,
                })),
            },
            {
                title: 'Foundations',
                href: '/foundations',
                links: foundationTopics().map(topic => ({
                    href: `/foundations/${topic.slug}`,
                    label: topic.name,
                })),
            },
            {
                title: 'Examples',
                href: '/examples',
                links: examples().map(item => ({
                    href: `/examples/${item.path}`,
                    label: item.title,
                })),
            },
            {
                title: 'AI',
                href: '/ai',
                links: aiPages.map(page => ({ href: page.href, label: page.label })),
            },
            {
                title: 'MCP tools',
                href: '/ai/mcp-server',
                links: mcpManifest().tools.map(tool => ({
                    href: mcpToolPath(tool.slug),
                    label: tool.name,
                })),
            },
            {
                title: 'Tools',
                href: '/tools',
                links: [
                    ...tools
                        .filter(tool => built.has(toolPath(tool.slug)))
                        .map(tool => ({ href: toolPath(tool.slug), label: tool.name })),
                    ...comparisons.map(item => ({
                        href: `/compare/${item.slug}`,
                        label: item.title,
                    })),
                    { href: '/docs/install', label: 'Install' },
                ],
            },
        ],
    };
};
