import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleSection } from '@/components/article';
import { FaqSection } from '@/components/faq-section';
import { Markdown } from '@/components/markdown';
import { Article, PageHero, PrevNext } from '@/components/page-frame';
import { JsonLd, pageMetadata, techArticleLd } from '@/lib/seo';
import { comparison, comparisons } from '../content';

/*
 * One comparison: what each is, where Continuum differs, where the other is stronger, which to
 * choose, then the questions people ask, as FAQPage data too. The words live in ../content.ts,
 * which the page's .md twin prints as well.
 */

type Props = { params: Promise<{ name: string }> };

export const dynamicParams = false;

export const generateStaticParams = () => comparisons.map(c => ({ name: c.slug }));

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
    const c = comparison((await params).name);
    if (!c) return {};
    return pageMetadata({ title: c.title, description: c.description, path: `/compare/${c.slug}` });
};

const ComparisonPage = async ({ params }: Props) => {
    const c = comparison((await params).name);
    if (!c) notFound();
    const path = `/compare/${c.slug}`;
    return (
        <>
            <JsonLd data={techArticleLd({ headline: c.title, description: c.description, path })} />
            <PageHero
                crumbs={[
                    { name: 'Compare', path: '/compare' },
                    { name: `vs ${c.other}`, path },
                ]}
                eyebrow="Compare"
                lead={c.lead}
                title={c.title}
            />
            <Article>
                {c.sections.map(section => (
                    <ArticleSection id={section.id} key={section.id} tight title={section.title}>
                        <Markdown source={section.body} />
                    </ArticleSection>
                ))}
                {/* The questions, and the same as FAQPage data. */}
                <FaqSection faqs={c.faqs} />
            </Article>
            <PrevNext
                groups={comparisons.map(item => ({
                    href: `/compare/${item.slug}`,
                    label: `vs ${item.other}`,
                }))}
                label="Comparisons"
                path={path}
            />
        </>
    );
};

export default ComparisonPage;
