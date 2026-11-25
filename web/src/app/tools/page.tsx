import { Button, cn } from '@contui/ui';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { FaqSection } from '@/components/faq-section';
import { Container, Reveal } from '@/components/landing/web';
import { PageHero } from '@/components/page-frame';
import { pageMetadata } from '@/lib/seo';
import { toolPath, tools, toolsIndex } from './_parts/catalogue';
import { ToolPreview } from './_parts/previews';
import { sectionSpace, ToolsClosing } from './_parts/tool-page';

/*
 * The tools, the page that took the old theme builder page's place (/theme-builder redirects here):
 * the hero, then one section per tool, 256 apart, each its name, one line, a look at it in a framed
 * panel and the way into its page; then the questions and the close.
 */

export const metadata = pageMetadata({
    title: toolsIndex.title,
    description: toolsIndex.description,
    path: '/tools',
    type: 'website',
});

const ToolsIndex = () => (
    <>
        <PageHero
            actions={
                <Button render={<Link href={toolPath('theme-builder')} />} size="lg">
                    Open the theme builder
                </Button>
            }
            crumbs={[{ name: 'Tools', path: '/tools' }]}
            eyebrow="Free · in the browser"
            lead={toolsIndex.lead}
            title={toolsIndex.h1}
        />
        {tools.map((tool, index) => (
            <section
                aria-labelledby={`${tool.slug}-title`}
                className={cn('scroll-mt-20', index === 0 ? 'pt-16 md:pt-32' : sectionSpace)}
                id={tool.slug}
                key={tool.slug}
            >
                <Container className="flex flex-col gap-8 md:gap-10">
                    <Reveal className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
                        <div className="flex max-w-[640px] flex-col gap-3">
                            <h2
                                className="text-balance font-medium text-2xl text-neutral-950 leading-[1.15] tracking-[-0.02em] md:text-3xl"
                                id={`${tool.slug}-title`}
                            >
                                {tool.name}
                            </h2>
                            <p className="text-pretty text-base text-neutral-600 leading-[1.6]">
                                {tool.summary}
                            </p>
                        </div>
                        <Button
                            render={<Link href={toolPath(tool.slug)} />}
                            size="lg"
                            variant="secondary"
                        >
                            Open the {tool.name.toLowerCase()}
                            <ArrowRight strokeWidth={2} />
                        </Button>
                    </Reveal>
                    <ToolPreview slug={tool.slug} />
                </Container>
            </section>
        ))}
        <Container>
            <FaqSection
                description="What the tools cost, which to start with and what they share."
                faqs={toolsIndex.faqs}
                sectionClassName={cn('py-0', sectionSpace)}
            />
        </Container>
        <ToolsClosing />
    </>
);

export default ToolsIndex;
