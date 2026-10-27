import { cn } from 'continuum';
import type { ReactNode } from 'react';

/*
 * The playground's long-form pages read like a post on the blog: a centred
 * reading column for the words, figures across the page's whole width, and
 * sections set apart by space alone. Home and Foundations share these parts.
 */

/**
 * A section's flow, everything in it well inside its own 128px above and below: 8px under
 * a title, 16px between paragraphs, 40px above a heading and 64px either side of a figure.
 * A grid, so no margin collapses.
 */
export const flow = cn(
    // 128px above and below every section; the jump to one still lands on its title.
    'grid min-w-0 -scroll-mt-26 py-32',
    '[&>:is(h2,h3)+p]:mt-2 [&>h3]:mt-10 [&>p]:mt-4',
    // A figure is whatever is not a heading or a paragraph: a stage, a frame, a list, a table.
    '[&>:not(h2,h3,p)+:is(p,h3)]:mt-16 [&>:not(h2,h3,p)]:mt-16',
    '[&>:first-child]:mt-0',
);

/** The reading column, centred as on the blog; a figure takes the page's whole width. */
export const column = 'mx-auto w-full max-w-152';

/** A section's rules; they flow straight into it. */
export const Article = ({ children }: { children: ReactNode }) => <>{children}</>;

/** A heading inside a section. */
export const H = ({ children }: { children: ReactNode }) => (
    <h3 className={cn(column, 'font-medium text-base text-neutral-950')}>{children}</h3>
);

/** A paragraph in the reading column. */
export const P = ({ children }: { children: ReactNode }) => (
    <p className={cn(column, 'text-base text-neutral-700 leading-relaxed')}>{children}</p>
);

/** A token or class name inside a paragraph. */
export const C = ({ children }: { children: ReactNode }) => (
    <code className="whitespace-nowrap rounded-chip bg-neutral-950/5 px-1.5 py-0.5 font-mono text-[0.85em] text-neutral-950">
        {children}
    </code>
);

/** A figure, with one line under it saying what to look at. */
export const Figure = ({ caption, children }: { caption: ReactNode; children: ReactNode }) => (
    <div className="flex min-w-0 flex-col gap-3">
        {children}
        <p className="mx-auto max-w-xl text-center text-neutral-500 text-xs">{caption}</p>
    </div>
);

/**
 * Every showcase is at least 21:9 and grows with what it holds. It clips rather than hides
 * its overflow: a box that hides it scrolls, and would hold to the ratio and cut its content.
 */
export const showcase = 'aspect-[21/9] overflow-clip';

/** The frame a drawn figure sits in: the same quiet panel as a stage. */
export const frame = cn(
    showcase,
    'relative min-w-0 rounded-panel border border-neutral-200 bg-neutral-50',
);

type ArticleSectionProps = {
    id: string;
    title: ReactNode;
    /** One line under the title saying what the section is about. */
    description: ReactNode;
    children: ReactNode;
};

/** A section of a long-form page: its title and line in the reading column, then its flow. */
export const ArticleSection = ({ id, title, description, children }: ArticleSectionProps) => (
    <section className={flow} id={id}>
        <h2 className={cn(column, 'font-medium text-neutral-950 text-xl tracking-[-0.01em]')}>
            {title}
        </h2>
        <P>{description}</P>
        {children}
    </section>
);
