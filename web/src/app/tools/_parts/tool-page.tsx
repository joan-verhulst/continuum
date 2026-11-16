import { Button, cn } from 'continuum';
import { ArrowRight, Contrast, Eye, type LucideIcon, PaintBucket, Palette } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { column } from '@/components/article';
import { FaqSection } from '@/components/faq-section';
import { Container, Reveal } from '@/components/landing/web';
import { Inline } from '@/components/markdown';
import { CardGrid, LinkCard, PageHero } from '@/components/page-frame';
import { JsonLd, pageMetadata, webApplicationLd } from '@/lib/seo';
import { type ToolSlug, toolOf, toolPath, tools } from './catalogue';

/*
 * The tool page template, one for every tool under /tools. Top to bottom:
 *
 *   1. the site's hero (page-frame's PageHero): the breadcrumb (Tools › the tool), the tool's name as
 *      the h1, the catalogue's line with the keyword, one action that scrolls to the tool;
 *   2. the tool itself, right under the hero, in the site's column (1152): the page passes it as
 *      children, laid out with ./panes' ToolPanes (controls left, result right);
 *   3. under it, sections 256 apart (128 on a phone), each a title, one line and its content: how to
 *      use it, what it is, the questions (FAQPage data), the related tools, and the close.
 *
 * Every word comes from the tool's entry in ./catalogue. A tool's page is three lines:
 *
 *     export const metadata = toolMetadata('color-builder');
 *     const Page = () => <ToolPage slug="color-builder"><ColourBuilderTool /></ToolPage>;
 *     export default Page;
 *
 * The page also writes WebApplication data; PageHero writes the BreadcrumbList and links the
 * markdown twin (src/app/md/twins.ts builds it from the catalogue).
 */

/** A tool page's metadata: its title, description, canonical, Open Graph and Twitter. */
export const toolMetadata = (slug: ToolSlug) => {
    const tool = toolOf(slug);
    return pageMetadata({
        title: tool.title,
        description: tool.description,
        path: toolPath(slug),
        type: 'website',
    });
};

/** Each tool's mark, on its related card. */
export const toolIcons: Record<ToolSlug, LucideIcon> = {
    'theme-builder': PaintBucket,
    'color-builder': Palette,
    'contrast-checker': Contrast,
    'color-blindness-simulator': Eye,
};

/** The room between a tools page's sections: Joan's 256, 128 on a phone. */
export const sectionSpace = 'pt-32 md:pt-64';

/**
 * A section under a tool: its title and one line in the reading column (608), centred, then what it
 * holds, as wide as it needs to be.
 */
export const ToolSection = ({
    id,
    title,
    line,
    wide = false,
    children,
}: {
    id: string;
    title: ReactNode;
    line: ReactNode;
    /** Its content across the 896 rather than the reading column (cards). */
    wide?: boolean;
    children: ReactNode;
}) => (
    <section aria-labelledby={`${id}-title`} className={cn('scroll-mt-20', sectionSpace)} id={id}>
        <Container className="flex flex-col gap-8 md:gap-10">
            <Reveal className={cn(column, 'flex flex-col gap-3')}>
                <h2
                    className="text-balance font-medium text-2xl text-neutral-950 leading-[1.15] tracking-[-0.02em] md:text-3xl"
                    id={`${id}-title`}
                >
                    {title}
                </h2>
                <p className="text-pretty text-base text-neutral-600 leading-[1.6]">{line}</p>
            </Reveal>
            <div className={wide ? 'mx-auto w-full max-w-[896px]' : column}>{children}</div>
        </Container>
    </section>
);

/** How to use a tool: its steps, numbered. */
const Steps = ({ steps }: { steps: readonly string[] }) => (
    <ol className="flex flex-col gap-4">
        {steps.map((step, index) => (
            <li className="flex gap-4" key={step}>
                <span
                    aria-hidden
                    className="flex size-7 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-950 text-xs tabular-nums"
                >
                    {index + 1}
                </span>
                <p className="pt-0.5 text-base text-neutral-600 leading-[1.6]">
                    <Inline text={step} />
                </p>
            </li>
        ))}
    </ol>
);

/** The other tools, as cards. */
export const RelatedTools = ({ except }: { except?: ToolSlug }) => (
    <CardGrid columns={3}>
        {tools
            .filter(tool => tool.slug !== except)
            .map((tool, index) => (
                <LinkCard
                    delay={index % 3}
                    description={tool.summary}
                    href={toolPath(tool.slug)}
                    icon={toolIcons[tool.slug]}
                    key={tool.slug}
                    title={tool.name}
                />
            ))}
    </CardGrid>
);

/** The close of every tools page: what the tools are part of, and where to go from here. */
export const ToolsClosing = () => (
    <section aria-labelledby="closing-title" className={cn(sectionSpace, 'pb-16 md:pb-32')}>
        <Container className="flex flex-col items-center gap-10 text-center">
            <Reveal className="flex flex-col items-center gap-3">
                <h2
                    className="text-balance font-medium text-2xl text-neutral-950 leading-[1.15] tracking-[-0.02em] md:text-3xl"
                    id="closing-title"
                >
                    Then build with it
                </h2>
                <p className="max-w-[576px] text-pretty text-base text-neutral-600 leading-[1.6]">
                    Every tool here is part of Continuum, a design system for quiet, dense tool UI
                    in React. Its components read the theme the builder exports, so they follow it
                    as soon as app.css is loaded.
                </p>
            </Reveal>
            <Reveal className="flex flex-wrap items-center justify-center gap-3" delay={1}>
                <Button render={<Link href="/components" />} size="lg">
                    Browse the components
                    <ArrowRight strokeWidth={2} />
                </Button>
                <Button render={<Link href="/docs/install" />} size="lg" variant="secondary">
                    Install
                </Button>
            </Reveal>
        </Container>
    </section>
);

/**
 * A tool's page: the hero, the tool (children), and the sections under it. `note` is one quiet line
 * under the tool, for where it leads (another tool, the app).
 */
export const ToolPage = ({
    slug,
    note,
    children,
}: {
    slug: ToolSlug;
    note?: ReactNode;
    children: ReactNode;
}) => {
    const tool = toolOf(slug);
    const path = toolPath(slug);
    return (
        <>
            <JsonLd
                data={webApplicationLd({
                    name: `${tool.name} by Continuum`,
                    description: tool.description,
                    path,
                    keywords: [tool.keyword, ...tool.secondary],
                })}
            />
            <PageHero
                actions={
                    <Button
                        // biome-ignore lint/a11y/useAnchorContent: the button renders its label into the link
                        render={<a href="#tool" />}
                        size="lg"
                    >
                        {tool.cta}
                    </Button>
                }
                crumbs={[
                    { name: 'Tools', path: '/tools' },
                    { name: tool.name, path },
                ]}
                eyebrow="Free · in the browser"
                lead={tool.lead}
                title={tool.name}
            />
            <section aria-label={tool.name} className="scroll-mt-20 pt-8" id="tool">
                <Container className="flex flex-col gap-4">
                    {children}
                    {note && (
                        <p className="text-pretty text-center text-neutral-600 text-xs [&_a]:text-neutral-950 [&_a]:underline [&_a]:underline-offset-4">
                            {note}
                        </p>
                    )}
                </Container>
            </section>
            <ToolSection id="how-to-use" line="What to do, in order." title="How to use it">
                <Steps steps={tool.steps} />
            </ToolSection>
            <ToolSection id="about" line={tool.about.line} title={tool.about.title}>
                <div className="flex flex-col gap-4">
                    {tool.about.body.map(paragraph => (
                        <p
                            className="text-pretty text-base text-neutral-600 leading-[1.6] [&_a]:text-neutral-950 [&_a]:underline [&_a]:underline-offset-4"
                            key={paragraph}
                        >
                            <Inline text={paragraph} />
                        </p>
                    ))}
                </div>
            </ToolSection>
            <Container>
                <FaqSection
                    description={`${tool.faqs.length} questions about the ${tool.name.toLowerCase()}.`}
                    faqs={tool.faqs}
                    sectionClassName={cn('py-0', sectionSpace)}
                />
            </Container>
            <ToolSection
                id="related"
                line="The other tools, each free in the browser."
                title="Related tools"
                wide
            >
                <RelatedTools except={slug} />
            </ToolSection>
            <ToolsClosing />
        </>
    );
};
