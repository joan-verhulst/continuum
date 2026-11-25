import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger, cn } from '@contui/ui';
import type { ReactNode } from 'react';
import { type Faq, faqPageLd, JsonLd } from '@/lib/seo';
import { column } from './article';

/*
 * The questions at the foot of a page, the same on every page that has them: the section's title
 * and line, then the questions as an accordion (the library's, in the site's reading sizes), one
 * answer open at a time, and the same questions as FAQPage data. The answers stay in the page while
 * closed, so the browser's own search finds and opens them.
 *
 * It sits in the reading column (608) of an Article; `className` widens the column where the
 * page's own sections are wider (the theme builder's 720).
 */

type FaqSectionProps = {
    faqs: readonly Faq[];
    title?: ReactNode;
    /** One line under the title. */
    description?: ReactNode;
    id?: string;
    /** On the column: a width of its own. */
    className?: string;
    /** On the section: room of its own around it (the tools' 256 between sections). */
    sectionClassName?: string;
};

export const FaqSection = ({
    faqs,
    title = 'Questions',
    description,
    id = 'questions',
    className,
    sectionClassName,
}: FaqSectionProps) => (
    <section className={cn('scroll-mt-20 py-16', sectionClassName)} id={id}>
        <JsonLd data={faqPageLd(faqs)} />
        <div className={cn(column, 'flex flex-col gap-8', className)}>
            <div className="flex min-w-0 flex-col gap-3">
                <h2 className="text-balance font-medium text-2xl text-neutral-950 leading-[1.15] tracking-[-0.02em] md:text-3xl">
                    {title}
                </h2>
                {description && (
                    <p className="text-pretty text-base text-neutral-600 leading-[1.6]">
                        {description}
                    </p>
                )}
            </div>
            <Accordion hiddenUntilFound>
                {faqs.map(faq => (
                    <AccordionItem key={faq.question} value={faq.question}>
                        <AccordionTrigger className="min-h-14 py-4 text-base leading-snug">
                            {faq.question}
                        </AccordionTrigger>
                        <AccordionPanel className="max-w-152 pb-5 text-base leading-[1.6]">
                            {faq.answer}
                        </AccordionPanel>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    </section>
);
