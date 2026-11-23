import 'server-only';
import { aiWayLines } from '@/app/ai/_lib/nav';
import { toolPath, tools } from '@/app/tools/_parts/catalogue';
import { routes as toolRoutes } from '@/app/tools/routes';
import { componentGroups, components, foundationTopics, skills } from '@/lib/content';

/*
 * What a header section folds out on hover, for the sections where a way in helps (Examples has
 * none: its index is the way in): a lit tile naming the section and leading to all of it, beside a
 * few of its pages to start from, by name alone, never the whole list (the section's index and the
 * docs' sidebar hold that). The picks are chosen here by slug; their names are read from the same
 * loaders as the pages, so they follow the sources.
 */

export type HeaderMenuItem = {
    href: string;
    label: string;
    /** The icon's key, drawn by the header (an icon can't cross from the server). */
    icon: string;
    /** What the foldout shows while the pick is under the pointer: a showcase entry or a foundation's specimen, by id. */
    visual?: string;
};

export type HeaderMenu = {
    /** The lit tile: the section in a line, and the link to all of it. */
    feature: { title: string; text: string; href: string; action: string };
    items: HeaderMenuItem[];
};

/** At most this many picks: the menu points the way in, it is not the index. */
const PICKS = 4;

/** The menus by section id, the section's path without its slash ('components'). */
export const headerMenus = (): Record<string, HeaderMenu> => {
    const families = componentGroups();
    const family = (slug: string, visual: string): HeaderMenuItem[] => {
        const group = families.find(item => item.slug === slug);
        return group?.components.length
            ? [{ href: `/components#${group.slug}`, label: group.name, icon: slug, visual }]
            : [];
    };
    const topics = foundationTopics();
    const topic = (slug: string, visual: string): HeaderMenuItem[] => {
        const found = topics.find(item => item.slug === slug);
        return found
            ? [{ href: `/foundations/${found.slug}`, label: found.name, icon: slug, visual }]
            : [];
    };
    const built = new Set(toolRoutes());

    return {
        components: {
            feature: {
                title: 'Components',
                text: `${components().length} parts for quiet, dense tool UI.`,
                href: '/components',
                action: 'All components',
            },
            items: [
                ...family('actions', 'button'),
                ...family('inputs', 'field'),
                ...family('tables', 'table'),
                { href: '/charts', label: 'Charts', icon: 'charts', visual: 'area-chart' },
            ].slice(0, PICKS),
        },
        foundations: {
            feature: {
                title: 'Foundations',
                text: 'The values everything is made of, in units.',
                href: '/foundations',
                action: `All ${topics.length} topics`,
            },
            items: [
                ...topic('colour', 'f-colour'),
                ...topic('type', 'type'),
                ...topic('spacing', 'f-padding'),
                ...topic('surfaces-and-depth', 'f-surfaces'),
            ].slice(0, PICKS),
        },
        ai: {
            feature: {
                title: 'AI',
                text: `${skills().length} skills and an MCP server for any agent.`,
                href: '/ai',
                action: 'Continuum for AI',
            },
            items: aiWayLines()
                .slice(0, PICKS)
                .map(way => ({ href: way.href, label: way.name, icon: way.href })),
        },
        tools: {
            feature: {
                title: 'Tools',
                text: 'Free tools for a theme and its colours.',
                href: '/tools',
                action: 'All tools',
            },
            items: tools
                .filter(tool => built.has(toolPath(tool.slug)))
                .slice(0, PICKS)
                .map(tool => ({ href: toolPath(tool.slug), label: tool.name, icon: tool.slug })),
        },
    };
};
