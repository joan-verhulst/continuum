import 'server-only';
import {
    charts,
    componentGroups,
    components,
    foundationTopics,
    fullBody,
    inventory,
    mcpManifest,
    readme,
    referenceMarkdown,
    sections as referenceSections,
    skills,
} from '@/lib/content';
import { absolute, appLink, brand, tagline } from '@/lib/site';
import { routes as ai } from '../ai/routes';
import { routes as chartRoutes } from '../charts/routes';
import { compareIndex, comparisonMarkdown, comparisons } from '../compare/content';
import { routes as compare } from '../compare/routes';
import { routes as componentRoutes } from '../components/routes';
import { routes as docs } from '../docs/routes';
import { exampleLead, exampleParts, examples } from '../examples/content';
import { routes as exampleRoutes } from '../examples/routes';
import { routes as foundations } from '../foundations/routes';
import { toolPath, tools, toolsIndex } from '../tools/_parts/catalogue';
import { routes as toolRoutes } from '../tools/routes';

/*
 * The markdown twin of every content page: /components/button.md beside /components/button, for
 * agents and answer engines that read text rather than a rendered page. A twin prints the page's
 * source as it is written (a component's entry in components.md, a page kind's anatomy, a foundation's
 * section, a tool's description), never a second copy of it. The pages to twin are the sections'
 * own routes(), the same list the sitemap reads, so a page added there gets its twin; a page this
 * file has no source for still gets a short twin pointing at it.
 */

/** The groups llms.txt lists the twins under, in its order. */
export const twinGroups = [
    'Docs',
    'Foundations',
    'Examples',
    'Components',
    'Charts',
    'AI',
    'Theme builder and tools',
    'Compare',
] as const;

export type TwinGroup = (typeof twinGroups)[number];

export type Twin = {
    /** The HTML page's path ('/components/button'); the twin is at this plus '.md'. */
    path: string;
    title: string;
    /** One line on the page, for llms.txt. */
    summary: string;
    group: TwinGroup;
    /** The page's text as markdown, built on request. */
    markdown: () => string;
};

/** The sections' routes, every page the site builds but the home page. */
const sectionRoutes = () =>
    [
        ...docs(),
        ...foundations(),
        ...exampleRoutes(),
        ...componentRoutes(),
        ...chartRoutes(),
        ...ai(),
        ...toolRoutes(),
        ...compare(),
    ].filter(path => path !== '/');

/** A twin's head: its title, then where the page lives, so a copied twin still says its source. */
const doc = (title: string, path: string, ...blocks: string[]) =>
    [`# ${title}`, `Source: ${absolute(path)}`, ...blocks.filter(Boolean)].join('\n\n');

/** A markdown list of links to other twins. */
const linkList = (items: readonly { title: string; path: string; summary: string }[]) =>
    items
        .map(item => `- [${item.title}](${absolute(`${item.path}.md`)}): ${item.summary}`)
        .join('\n');

/** A path's last segment as words, for a page this file has no source for ('/tools/oklch-palette-generator' → 'Oklch palette generator'). */
const titleOf = (path: string) => {
    const words = (path.split('/').at(-1) ?? '').replace(/-/g, ' ');
    return words.charAt(0).toUpperCase() + words.slice(1);
};

/** Which group a path belongs to, by its first segment. */
const groupOf = (path: string): TwinGroup => {
    const first = path.split('/')[1] ?? '';
    const byFirst: Record<string, TwinGroup> = {
        docs: 'Docs',
        foundations: 'Foundations',
        examples: 'Examples',
        components: 'Components',
        charts: 'Charts',
        ai: 'AI',
        tools: 'Theme builder and tools',
        compare: 'Compare',
    };
    return byFirst[first] ?? 'Docs';
};

/** Every twin this file has a source for, by path. Paths no page builds are dropped by `twins()`. */
const known = (): Map<string, Twin> => {
    const map = new Map<string, Twin>();
    const add = (twin: Twin) => {
        if (!map.has(twin.path)) map.set(twin.path, twin);
    };

    /* Docs: the install guide is the README. */
    const guide = readme();
    add({
        path: '/docs/install',
        title: 'Install',
        summary:
            'Install the library, the Claude skills and the MCP server, and load the styles with or without Tailwind.',
        group: 'Docs',
        markdown: () =>
            doc(
                'Install Continuum',
                '/docs/install',
                guide.intro.replace(/^<img[^>]*>\s*/m, ''),
                ...guide.sections.map(section => `## ${section.title}\n\n${fullBody(section)}`),
            ),
    });

    /* Foundations: the values, one topic a page. */
    const topics = foundationTopics();
    const foundationsDoc = referenceSections('foundations');
    add({
        path: '/foundations',
        title: 'Foundations',
        summary:
            "The values of Continuum's look, in units: colour, type, radius, spacing, heights, layout.",
        group: 'Foundations',
        markdown: () =>
            doc(
                'Foundations',
                '/foundations',
                foundationsDoc.intro,
                linkList(
                    topics.map(t => ({
                        title: t.name,
                        path: `/foundations/${t.slug}`,
                        summary: t.summary,
                    })),
                ),
            ),
    });
    for (const topic of topics) {
        add({
            path: `/foundations/${topic.slug}`,
            title: topic.name,
            summary: topic.summary,
            group: 'Foundations',
            markdown: () => doc(topic.name, `/foundations/${topic.slug}`, fullBody(topic.section)),
        });
    }

    /* Examples: the reference screens, each with its page kind's anatomy, then the blocks. */
    const all = examples();
    const exampleList = (kind: 'screen' | 'block') =>
        linkList(
            all
                .filter(e => e.kind === kind)
                .map(e => ({
                    title: `${e.title} (${e.label})`,
                    path: `/examples/${e.path}`,
                    summary: e.description,
                })),
        );
    add({
        path: '/examples',
        title: 'Examples',
        summary:
            'Reference screens for each page kind, and blocks of earlier products, built from Continuum alone.',
        group: 'Examples',
        markdown: () =>
            doc(
                'Examples',
                '/examples',
                '## Screens',
                exampleList('screen'),
                '## Blocks',
                exampleList('block'),
            ),
    });
    for (const example of all) {
        const path = `/examples/${example.path}`;
        const kind = example.pageKind;
        const parts = exampleParts(example);
        add({
            path,
            title: `${example.title} (${example.label})`,
            summary: example.description,
            group: 'Examples',
            markdown: () =>
                doc(
                    example.title,
                    path,
                    exampleLead(example),
                    kind ? `## Anatomy of the ${example.label.toLowerCase()}` : '',
                    kind?.width ? `**Width:** ${kind.width}` : '',
                    kind?.body ?? '',
                    parts.length > 0 ? '## Components' : '',
                    linkList(
                        parts.map(p => ({ title: p.title, path: p.href, summary: p.description })),
                    ),
                ),
        });
    }

    /* Components: each entry of components.md, by family. */
    const groups = componentGroups().filter(g => g.components.length > 0);
    add({
        path: '/components',
        title: 'Components',
        summary: `Every part of Continuum, ${inventory().components} React components (${inventory().charts} of them charts) on Base UI and Tailwind v4, by what they do.`,
        group: 'Components',
        markdown: () =>
            doc(
                'Components',
                '/components',
                ...groups.map(
                    g =>
                        `## ${g.name}\n\n${linkList(
                            g.components.map(c => ({
                                title: c.name,
                                path: `/components/${c.slug}`,
                                summary: c.summary,
                            })),
                        )}`,
                ),
            ),
    });
    for (const item of components()) {
        add({
            path: `/components/${item.slug}`,
            title: item.name,
            summary: item.summary,
            group: 'Components',
            markdown: () =>
                doc(
                    item.name,
                    `/components/${item.slug}`,
                    `**Family:** ${item.group}`,
                    item.parts.length > 1 ? `**Parts:** ${item.parts.join(' · ')}` : '',
                    item.body,
                ),
        });
    }

    /* Charts: the shared rules on the index, each chart on its own. */
    const chartDoc = charts();
    add({
        path: '/charts',
        title: 'Charts',
        summary:
            "Continuum's chart kit: which chart for which need, the card, the plot, and each chart.",
        group: 'Charts',
        markdown: () =>
            doc(
                'Charts',
                '/charts',
                chartDoc.intro,
                ...chartDoc.general.map(s => `## ${s.title}\n\n${fullBody(s)}`),
                `## Each chart\n\n${linkList(
                    chartDoc.charts.map(c => ({
                        title: c.name,
                        path: `/charts/${c.slug}`,
                        summary: c.summary,
                    })),
                )}`,
            ),
    });
    for (const chart of chartDoc.charts) {
        add({
            path: `/charts/${chart.slug}`,
            title: chart.name,
            summary: chart.summary,
            group: 'Charts',
            markdown: () =>
                doc(
                    chart.name,
                    `/charts/${chart.slug}`,
                    chart.parts.length > 1 ? `**Parts:** ${chart.parts.join(' · ')}` : '',
                    chart.body,
                ),
        });
    }

    /* AI: the MCP server from its manifest, the skills from their SKILL.md. */
    const manifest = mcpManifest();
    const toolList = () =>
        manifest.tools.map(t => `- **${t.name}** (${t.title}): ${t.description}`).join('\n');
    const promptList = () =>
        manifest.prompts.map(p => `- **${p.name}** (${p.title}): ${p.description}`).join('\n');
    const skillList = skills();
    add({
        path: '/ai',
        title: 'AI',
        summary:
            'Continuum for coding agents: a Claude skill that carries its decisions and an MCP server with an audit for any stack.',
        group: 'AI',
        markdown: () =>
            doc(
                'Continuum for AI agents',
                '/ai',
                `Continuum comes with ${skillList.length} Claude skills and an MCP server (${manifest.tools.length} tools, ${manifest.prompts.length} prompts) that give an agent the system's decisions in units.`,
                linkList([
                    {
                        title: 'MCP server',
                        path: '/ai/mcp-server',
                        summary: 'Every tool and prompt the server serves.',
                    },
                    {
                        title: 'Skills',
                        path: '/ai/skills',
                        summary: 'The Claude skills and when an agent reaches for each.',
                    },
                    {
                        title: 'Audit',
                        path: '/ai/audit',
                        summary: 'What to fix in existing UI, in any stack.',
                    },
                    {
                        title: 'DESIGN.md',
                        path: '/ai/design-md',
                        summary: "The brief the theme builder writes for a project's agents.",
                    },
                ]),
            ),
    });
    add({
        path: '/ai/mcp-server',
        title: 'MCP server',
        summary: `The ${manifest.name} MCP server: ${manifest.tools.length} tools and ${manifest.prompts.length} prompts.`,
        group: 'AI',
        markdown: () =>
            doc(
                'MCP server',
                '/ai/mcp-server',
                `The ${manifest.name} MCP server, version ${manifest.version}.`,
                `## Tools\n\n${toolList()}`,
                `## Prompts\n\n${promptList()}`,
            ),
    });
    for (const tool of manifest.tools) {
        add({
            path: `/ai/mcp-server/${tool.slug}`,
            title: tool.name,
            summary: tool.description,
            group: 'AI',
            markdown: () =>
                doc(
                    tool.name,
                    `/ai/mcp-server/${tool.slug}`,
                    `**${tool.title}.** ${tool.description}`,
                ),
        });
    }
    add({
        path: '/ai/skills',
        title: 'Skills',
        summary: 'The Claude skills that carry Continuum into other projects.',
        group: 'AI',
        markdown: () =>
            doc(
                'Skills',
                '/ai/skills',
                skillList.map(s => `## ${s.name}\n\n${s.description}`).join('\n\n'),
            ),
    });
    for (const s of skillList) {
        add({
            path: `/ai/skills/${s.name}`,
            title: s.name,
            summary: s.description,
            group: 'AI',
            markdown: () => doc(s.name, `/ai/skills/${s.name}`, s.description, s.markdown),
        });
    }
    const audits = manifest.tools.filter(t => t.name.startsWith('audit_'));
    add({
        path: '/ai/audit',
        title: 'Audit',
        summary:
            'An audit that reads UI in any stack, source or rendered, and says what to fix in units.',
        group: 'AI',
        markdown: () =>
            doc(
                'Audit',
                '/ai/audit',
                audits.map(t => `## ${t.name}\n\n${t.description}`).join('\n\n'),
                ...manifest.prompts
                    .filter(p => /improve|review/.test(p.name))
                    .map(p => `## ${p.name} (prompt)\n\n${p.description}`),
            ),
    });

    /* The tools: the index, then each tool in the catalogue's words; the builder adds its spec, theming.md. */
    const questions = (faqs: readonly { question: string; answer: string }[]) =>
        `## Questions\n\n${faqs.map(faq => `### ${faq.question}\n\n${faq.answer}`).join('\n\n')}`;
    add({
        path: '/tools',
        title: 'Tools',
        summary: toolsIndex.description,
        group: 'Theme builder and tools',
        markdown: () =>
            doc(
                toolsIndex.h1,
                '/tools',
                toolsIndex.lead,
                linkList(
                    tools.map(tool => ({
                        title: tool.name,
                        path: toolPath(tool.slug),
                        summary: tool.summary,
                    })),
                ),
                questions(toolsIndex.faqs),
            ),
    });
    for (const tool of tools) {
        const path = toolPath(tool.slug);
        add({
            path,
            title: tool.name,
            summary: tool.description,
            group: 'Theme builder and tools',
            markdown: () =>
                doc(
                    tool.name,
                    path,
                    tool.lead,
                    `## How to use it\n\n${tool.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}`,
                    `## ${tool.about.title}\n\n${tool.about.body.join('\n\n')}`,
                    tool.slug === 'theme-builder'
                        ? `## The theme, in full\n\nThe builder also runs in the app, where the theme is kept as a project: ${appLink({ view: 'projects' })}\n\n${referenceMarkdown('theming').replace(/^# .*\n+/, '')}`
                        : '',
                    questions(tool.faqs),
                ),
        });
    }

    /* DESIGN.md: the brief the theme builder exports for a project's agents. */
    add({
        path: '/ai/design-md',
        title: 'DESIGN.md',
        summary:
            "The brief the theme builder exports beside app.css for a project's AI agents: setup, theme values and the rules in short.",
        group: 'AI',
        markdown: () =>
            doc(
                'DESIGN.md',
                '/ai/design-md',
                "DESIGN.md is the brief Continuum's theme builder exports beside a project's `app.css`, for the AI agents that work in it: the look in a paragraph, the setup, the theme's own values and the rules in short.",
                "Put it at the project's root and add `@DESIGN.md` to `CLAUDE.md`, so every session starts from it. The MCP server's `create_theme` tool writes the same two files from a prompt.",
                `Build one in the theme builder: ${absolute('/tools/theme-builder')}`,
            ),
    });

    /* The docs' overview: where each part of the system is explained. */
    add({
        path: '/docs',
        title: 'Docs',
        summary:
            'Install the library, the skills and the MCP server, then find the components, examples, foundations and theme builder.',
        group: 'Docs',
        markdown: () =>
            doc(
                'Docs',
                '/docs',
                linkList([
                    {
                        title: 'Install',
                        path: '/docs/install',
                        summary: 'The library, the Claude skills and the MCP server.',
                    },
                    {
                        title: 'Foundations',
                        path: '/foundations',
                        summary: 'The values, in units.',
                    },
                    {
                        title: 'Components',
                        path: '/components',
                        summary: 'Every part, what it is for and its values.',
                    },
                    {
                        title: 'Examples',
                        path: '/examples',
                        summary: 'Reference screens and blocks.',
                    },
                    { title: 'Charts', path: '/charts', summary: 'The chart kit.' },
                    { title: 'AI', path: '/ai', summary: 'The skills and the MCP server.' },
                    {
                        title: 'Theme builder',
                        path: '/tools/theme-builder',
                        summary: "A product's own look, in light and dark.",
                    },
                ]),
            ),
    });

    /* Compare: the pages' own words. */
    add({
        path: '/compare',
        title: compareIndex.title,
        summary: compareIndex.description,
        group: 'Compare',
        markdown: () =>
            doc(
                compareIndex.title,
                '/compare',
                compareIndex.lead,
                linkList(
                    comparisons.map(c => ({
                        title: c.title,
                        path: `/compare/${c.slug}`,
                        summary: c.description,
                    })),
                ),
            ),
    });
    for (const c of comparisons) {
        add({
            path: `/compare/${c.slug}`,
            title: c.title,
            summary: c.description,
            group: 'Compare',
            markdown: () =>
                comparisonMarkdown(c).replace(
                    /^(# .*)\n\n/,
                    `$1\n\nSource: ${absolute(`/compare/${c.slug}`)}\n\n`,
                ),
        });
    }
    return map;
};

/** A twin for a page this file has no source for: its name and where it is. */
const fallback = (path: string): Twin => {
    const title = titleOf(path);
    const group = groupOf(path);
    const summary = `${title}, in ${brand.name}'s ${group.toLowerCase()}.`;
    return {
        path,
        title,
        summary,
        group,
        markdown: () =>
            doc(title, path, `${brand.name}: ${tagline}`, `Read the page at ${absolute(path)}.`),
    };
};

let cache: Twin[] | undefined;

/** Every page's twin, in the sections' order: one for each path the sections build. */
export const twins = (): Twin[] => {
    if (cache) return cache;
    const sources = known();
    cache = [...new Set(sectionRoutes())].map(path => sources.get(path) ?? fallback(path));
    return cache;
};

/** One twin by its page's path ('/components/button'). */
export const twin = (path: string) => twins().find(t => t.path === path);
