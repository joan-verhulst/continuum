import { cn } from '@contui/ui';
import type { ReactNode } from 'react';

/*
 * The docs' long-form parts, ported from the playground's article (playground/src/article.tsx) so
 * they render on the server: a centred reading column for the words, figures across the article's
 * whole width (page-frame's Article), sections set apart by space alone. The type is the landing's:
 * its section titles, its leads' grey 16px body. The page's head is page-frame's PageHero. Prose
 * is never put in a card; only a divided list gets a container. CodeBlock, which needs the
 * clipboard, is in ./code-block.
 */

/**
 * A section's flow: 20px under a section's title and 8px under a heading, 16px between paragraphs, 40px above a heading and 64px
 * either side of a figure. A command to run reads as part of the text (`.flow-text`), so it keeps a
 * paragraph's spacing. A grid, so no margin collapses. `py-32` sets the sections 128 apart, as
 * Foundations does; `flowTight` is the same flow with a long document's 64.
 */
const flowRules = [
    'grid min-w-0',
    '[&>h2+:is(p,.flow-text)]:mt-5 [&>h3+:is(p,.flow-text)]:mt-2 [&>:is(p,.flow-text)]:mt-4 [&>h3]:mt-10',
    // A figure is whatever is not a heading or a paragraph: a stage, a frame, a list, a table.
    '[&>:not(h2,h3,p,.flow-text)+:is(p,h3,.flow-text)]:mt-16 [&>:not(h2,h3,p,.flow-text)]:mt-16',
    '[&>:first-child]:mt-0',
];

/** 128px above and below every section; the jump to one still lands on its title. */
export const flow = cn(flowRules, '-scroll-mt-26 py-32');

/** The same flow, 64 apart: a long reference page's sections. */
export const flowTight = cn(flowRules, 'scroll-mt-20 py-16');

/** The reading column (608), centred; a figure takes the page's whole width. */
export const column = 'mx-auto w-full max-w-152';

/** A heading inside a section. */
export const H = ({ children, id }: { children: ReactNode; id?: string }) => (
    <h3
        className={cn(
            column,
            'scroll-mt-20 font-medium text-lg text-neutral-950 leading-snug tracking-[-0.01em]',
        )}
        id={id}
    >
        {children}
    </h3>
);

/** A paragraph in the reading column. */
export const P = ({ children, className }: { children: ReactNode; className?: string }) => (
    <p className={cn(column, 'text-base text-neutral-600 leading-[1.6]', className)}>{children}</p>
);

/**
 * A token or class name inside a paragraph. It stays on one line from `sm` up; on a phone a long
 * one (a signature, the spacing scale) may break, or it would push the page sideways. In a table
 * it never breaks: the table scrolls in its own frame instead.
 */
export const C = ({ children }: { children: ReactNode }) => (
    <code className="wrap-anywhere rounded-chip bg-neutral-950/5 px-1.5 py-0.5 font-mono text-[0.85em] text-neutral-950 sm:whitespace-nowrap [td_&]:whitespace-nowrap">
        {children}
    </code>
);

/** A figure, with one line under it saying what to look at. */
export const Figure = ({ caption, children }: { caption?: ReactNode; children: ReactNode }) => (
    <div className="flex min-w-0 flex-col gap-3">
        {children}
        {caption && (
            <p className="mx-auto max-w-xl text-center text-neutral-600 text-xs">{caption}</p>
        )}
    </div>
);

/**
 * Every showcase is at least 21:9 and grows with what it holds. It clips rather than hides its
 * overflow: a box that hides it scrolls, and would hold to the ratio and cut its content.
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
    description?: ReactNode;
    /** The 64 of a long reference page rather than Foundations' 128. */
    tight?: boolean;
    children?: ReactNode;
};

/** A section of a long-form page: its title and line in the reading column, then its flow. */
export const ArticleSection = ({
    id,
    title,
    description,
    tight = false,
    children,
}: ArticleSectionProps) => (
    <section className={tight ? flowTight : flow} id={id}>
        <h2
            className={cn(
                column,
                'text-balance font-medium text-2xl text-neutral-950 leading-[1.15] tracking-[-0.02em] md:text-3xl',
            )}
        >
            {title}
        </h2>
        {description && <P>{description}</P>}
        {children}
    </section>
);

/**
 * A divided list, the one kind of content that gets a container: rows on the surface between
 * hairlines, in a card-cornered frame. Each child is a row; give it its own padding.
 */
export const DividedList = ({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) => (
    <ul
        className={cn(
            column,
            'divide-y divide-neutral-200 overflow-hidden rounded-card border border-neutral-200 bg-neutral-50',
            className,
        )}
    >
        {children}
    </ul>
);
