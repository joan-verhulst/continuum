import type { ReactNode } from 'react';
import { ArticleSection } from '@/components/article';
import { FaqSection } from '@/components/faq-section';
import { Inline, Markdown } from '@/components/markdown';
import { Article, PageHero, PrevNext } from '@/components/page-frame';
import { JsonLd, softwareApplicationLd } from '@/lib/seo';
import { themeBuilderUrl } from '@/lib/site';
import { OpenBuilder } from './builder-link';
import { toolLinks } from './catalogue';
import { ContrastTool } from './contrast-tool';
import type { LegacyKind, LegacyPage } from './legacy';
import { VisionTool } from './vision-tool';

/*
 * The old tool landing, kept for the tools phase 2 has not moved onto the template yet (./legacy):
 * laid out whole from its entry, the one primary into the builder at its head, the site's FAQ section
 * at its foot. New tool pages use ./tool-page.
 */

const legacyTools: Record<LegacyKind, () => ReactNode> = {
    contrast: () => <ContrastTool />,
    vision: () => <VisionTool />,
};

export const ToolLanding = ({ page }: { page: LegacyPage }) => {
    const path = `/tools/${page.slug}`;
    return (
        <>
            <JsonLd
                data={softwareApplicationLd({
                    name: `${page.name}, by Continuum`,
                    description: page.lead,
                    path,
                })}
            />
            <PageHero
                actions={<OpenBuilder />}
                crumbs={[
                    { name: 'Tools', path: '/tools' },
                    { name: page.name, path },
                ]}
                eyebrow="Free tool"
                lead={<Inline text={page.lead} />}
                title={page.name}
            />
            <Article>
                <ArticleSection
                    description={page.toolDescription}
                    id="tool"
                    tight
                    title={page.toolTitle}
                >
                    {legacyTools[page.tool]()}
                </ArticleSection>
                {page.sections.map(section => (
                    <ArticleSection id={section.id} key={section.id} tight title={section.title}>
                        <Markdown source={section.body} />
                    </ArticleSection>
                ))}
                <ArticleSection id="the-whole-theme" tight title="The whole theme">
                    <Markdown
                        source={`This page checks one part of a theme. The [theme builder](${themeBuilderUrl}) makes all of it, the primary, the greys, the status colours, the type, corners and spacing, checks its contrast in light and dark, and exports it as \`app.css\` and \`DESIGN.md\`. It is free and runs in the browser.`}
                    />
                </ArticleSection>
                <FaqSection faqs={page.faqs} />
            </Article>
            <PrevNext groups={toolLinks} label="Tools" path={path} />
        </>
    );
};
