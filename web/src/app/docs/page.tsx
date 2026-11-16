import {
    Blocks,
    Bot,
    Component,
    LayoutTemplate,
    type LucideIcon,
    MessageSquare,
    Package,
    Palette,
    Sparkles,
    SwatchBook,
} from 'lucide-react';
import { CardGrid, FrameSection, LinkCard, PageHero } from '@/components/page-frame';
import { pageMetadata } from '@/lib/seo';
import { themeBuilderUrl } from '@/lib/site';
import { installParts } from './_parts/nav';

/* The docs' overview: the install guide's parts, then where the rest of the system is explained. */

export const metadata = pageMetadata({
    title: 'Docs',
    description:
        'Continuum’s documentation: install the React library, the Claude skills and the MCP server, then find the components, examples, foundations and theme builder.',
    path: '/docs',
});

const installIcons: Record<(typeof installParts)[number]['id'], LucideIcon> = {
    library: Package,
    'skills-and-mcp': Bot,
    'with-claude': MessageSquare,
    theme: Palette,
};

const elsewhere: { href: string; title: string; summary: string; icon: LucideIcon }[] = [
    {
        href: '/foundations',
        title: 'Foundations',
        summary: 'The values: colour, type, spacing, corners, heights and layout, in units.',
        icon: SwatchBook,
    },
    {
        href: '/components',
        title: 'Components',
        summary: 'Every part, what it is for and what not, with its values and props.',
        icon: Component,
    },
    {
        href: '/examples',
        title: 'Examples',
        summary: 'A reference screen for each kind of page, and blocks of earlier products.',
        icon: LayoutTemplate,
    },
    {
        href: '/ai',
        title: 'AI',
        summary: 'The skills and the MCP server that carry the system to Claude and other agents.',
        icon: Sparkles,
    },
    {
        href: themeBuilderUrl,
        title: 'Theme builder',
        summary: 'A product’s own colours, type and corners, exported as a Tailwind v4 theme.',
        icon: Blocks,
    },
];

const DocsIndex = () => (
    <>
        <PageHero
            crumbs={[{ name: 'Docs', path: '/docs' }]}
            eyebrow="Set up and look up"
            lead="These docs say how to install Continuum, its React library, its Claude skills and its MCP server, and where each part of the system is explained; start with Install when you are setting up a project."
            title="Docs"
        />
        <FrameSection
            description="The guide in four parts, from adding the library to giving a product its own theme."
            id="install"
            title="Install"
        >
            <CardGrid columns={2}>
                {installParts.map((part, index) => (
                    <LinkCard
                        delay={index % 2}
                        description={part.summary}
                        href={`/docs/install#${part.id}`}
                        icon={installIcons[part.id]}
                        key={part.id}
                        title={part.title}
                    />
                ))}
            </CardGrid>
        </FrameSection>
        <FrameSection
            description="Where each part of the system is explained."
            id="the-system"
            title="The system"
        >
            <CardGrid>
                {elsewhere.map((item, index) => (
                    <LinkCard
                        delay={index % 3}
                        description={item.summary}
                        href={item.href}
                        icon={item.icon}
                        key={item.href}
                        title={item.title}
                    />
                ))}
            </CardGrid>
        </FrameSection>
    </>
);

export default DocsIndex;
