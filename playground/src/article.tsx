import { Button, cn } from 'continuum';
import { Check, Copy } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';

/*
 * The playground's long-form pages read like a post on the blog: a centred
 * reading column for the words, figures across the page's whole width, and
 * sections set apart by space alone. Home and Foundations share these parts.
 */

/**
 * A section's flow, everything in it well inside its own 128px above and below: 8px under
 * a title, 16px between paragraphs, 40px above a heading and 64px either side of a figure.
 * A command to run reads as part of the text (`.flow-text`), so it keeps a paragraph's spacing.
 * A grid, so no margin collapses.
 */
export const flow = cn(
    // 128px above and below every section; the jump to one still lands on its title.
    'grid min-w-0 -scroll-mt-26 py-32',
    '[&>:is(h2,h3)+:is(p,.flow-text)]:mt-2 [&>:is(p,.flow-text)]:mt-4 [&>h3]:mt-10',
    // A figure is whatever is not a heading or a paragraph: a stage, a frame, a list, a table.
    '[&>:not(h2,h3,p,.flow-text)+:is(p,h3,.flow-text)]:mt-16 [&>:not(h2,h3,p,.flow-text)]:mt-16',
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

/**
 * Code to run or paste, in mono on the surface with a hairline, and a copy button in its top
 * corner, centred on the first line. A long line wraps, so nothing runs under the button.
 */
export const CodeBlock = ({ code, className }: { code: string; className?: string }) => {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return;
        const timer = setTimeout(() => setCopied(false), 1600);
        return () => clearTimeout(timer);
    }, [copied]);

    return (
        <div
            className={cn(
                'flow-text relative min-w-0 rounded-item border border-neutral-200 bg-neutral-50',
                className,
            )}
        >
            <pre className="wrap-anywhere whitespace-pre-wrap py-4 pr-14 pl-4 font-mono text-neutral-800 text-xs leading-relaxed">
                <code>{code}</code>
            </pre>
            <Button
                aria-label={copied ? 'Copied' : 'Copy'}
                className="absolute top-3 right-3"
                onClick={() => {
                    void navigator.clipboard?.writeText(code).then(() => setCopied(true));
                }}
                size="icon-sm"
                variant="ghost"
            >
                {copied ? <Check strokeWidth={2} /> : <Copy strokeWidth={2} />}
            </Button>
        </div>
    );
};

/** A figure, with one line under it saying what to look at. */
export const Figure = ({ caption, children }: { caption: ReactNode; children: ReactNode }) => (
    <div className="flex min-w-0 flex-col gap-3">
        {children}
        <p className="mx-auto max-w-xl text-center text-neutral-600 text-xs">{caption}</p>
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
