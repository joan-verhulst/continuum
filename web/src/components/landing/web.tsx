'use client';

import { Button, cn } from 'continuum';
import { Check, Copy } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import {
    type ComponentProps,
    type ReactNode,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

/*
 * The site's web register: the page talks in editorial sizes, the product inside it never changes.
 * Values, in the system's own scale:
 * - Sized as Tencil's and MCP Hosted's landings, which set a narrower display face: Geist at the same
 *   pixels reads a step larger, so the steps under the H1 sit one lower.
 * - H1 39px on phones, 48px from md (text-4xl → text-5xl), medium, line height 1.05, tracking -0.02em,
 *   680px wide.
 * - H2 24px → 31px (text-2xl → text-3xl), line height 1.15, 512px wide.
 * - Lead 16px → 18px for the hero (text-base → text-lg), 16px for a section (text-base), line height
 *   1.6, 576px wide, neutral-600.
 * - A card's title 20px (text-xl), its body 15px as Tencil's.
 * - Sections 1152px wide with a 16px gutter on phones (24 from sm); 64px above and below on phones,
 *   128px from md.
 * - Panels on the panel corner, the floating bits on the dock's pill; hairlines, no shadows but on
 *   what floats.
 * - Motion: 600ms fade up from 8px on the system's ease, 70ms apart in a group; nothing moves under
 *   reduced motion.
 */

export const ease = [0.22, 1, 0.36, 1] as const;

/** The page's column: 1152px with the phone gutter. */
export const Container = ({ className, ...props }: ComponentProps<'div'>) => (
    <div className={cn('mx-auto w-full max-w-[1152px] px-4 sm:px-6', className)} {...props} />
);

/** A small label above a section title, Tencil's pill: a hairline capsule, an accent dot. */
export const Pill = ({
    children,
    dot = true,
    className,
}: {
    children: ReactNode;
    dot?: boolean;
    className?: string;
}) => (
    <span
        className={cn(
            'inline-flex h-7 items-center gap-2 rounded-full border border-neutral-200 px-3 text-neutral-700 text-xs',
            className,
        )}
    >
        {dot && <span aria-hidden className="size-1.5 rounded-full bg-spectrum-round" />}
        {children}
    </span>
);

/** Fades its children up as they come into view, once; still under reduced motion. */
export const Reveal = ({
    children,
    delay = 0,
    className,
}: {
    children: ReactNode;
    /** Its place in a group: each step waits 70ms more. */
    delay?: number;
    className?: string;
}) => {
    const reduce = useReducedMotion();
    return (
        <motion.div
            className={className}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            transition={{ duration: 0.6, ease, delay: delay * 0.07 }}
            viewport={{ once: true, margin: '-80px' }}
            whileInView={{ opacity: 1, y: 0 }}
        >
            {children}
        </motion.div>
    );
};

type SectionProps = Omit<ComponentProps<'section'>, 'title'> & {
    /** The pill above the title. */
    eyebrow?: ReactNode;
    title?: ReactNode;
    description?: ReactNode;
    /** Centres the header, the page's way; `false` sets it on the left. */
    centred?: boolean;
    /** A link for the section: under a centred header, beside a left one on wide screens. */
    aside?: ReactNode;
    /** The gap between the header and what it shows, for a section that wants more than the page's. */
    gap?: string;
};

/** A section of the page: its header (pill, title, lead), then whatever it shows. */
export const Section = ({
    eyebrow,
    title,
    description,
    centred = true,
    aside,
    gap,
    children,
    className,
    ...props
}: SectionProps) => (
    <section className={cn('scroll-mt-20 py-16 md:py-32', className)} {...props}>
        <Container className={cn('flex flex-col gap-12 md:gap-16', gap)}>
            {(eyebrow || title || description) && (
                <Reveal
                    className={cn(
                        'flex gap-6',
                        centred
                            ? 'flex-col items-center text-center'
                            : 'flex-wrap items-end justify-between',
                    )}
                >
                    <div
                        className={cn(
                            'flex flex-col gap-5',
                            centred ? 'items-center' : 'items-start',
                        )}
                    >
                        {eyebrow && <Pill>{eyebrow}</Pill>}
                        {title && (
                            <h2 className="max-w-[640px] text-balance font-medium text-3xl text-neutral-950 leading-[1.1] tracking-[-0.02em] md:text-4xl">
                                {title}
                            </h2>
                        )}
                        {description && (
                            <p className="max-w-[640px] text-base text-neutral-600 leading-[1.6] md:text-lg">
                                {description}
                            </p>
                        )}
                    </div>
                    {aside}
                </Reveal>
            )}
            {children}
        </Container>
    </section>
);

/**
 * A product window: the app's own panel at its real size, cropped by the frame and never scaled,
 * so 13px stays 13px. A hairline bar on top holds its name or its controls.
 */
export const Window = ({
    bar,
    children,
    className,
    bodyClassName,
}: {
    bar?: ReactNode;
    children: ReactNode;
    className?: string;
    bodyClassName?: string;
}) => (
    <div
        className={cn(
            'relative flex flex-col overflow-hidden rounded-panel border border-neutral-200 bg-neutral-100',
            className,
        )}
    >
        {bar && (
            <div className="flex min-h-12 items-center gap-3 border-neutral-200 border-b bg-neutral-50 px-3">
                {bar}
            </div>
        )}
        <div className={cn('relative min-h-0 flex-1 overflow-hidden', bodyClassName)}>
            {children}
        </div>
    </div>
);

/** A registration mark, the cross a printer lines sheets up by, at one corner of the board. */
const Mark = ({ className }: { className: string }) => (
    <span aria-hidden className={cn('absolute hidden size-3 text-neutral-400 md:block', className)}>
        <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-current" />
        <span className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-current" />
    </span>
);

/*
 * The landing's rulers: the page measured in the system's own 4px unit, both ways. A rail runs down
 * each side, 64px out from the content, and a divider across the page between sections, each a
 * hairline with ticks on it: every 4px, longer every 16, longest every 80. The dividers' ticks are
 * counted from the column's edge, so they meet the rails' on the same marks, and a registration
 * mark sits where a divider crosses a rail. The wide pieces (the boards, the product's window, the
 * wall) cover the rails; the rulers pick up again below them.
 */

const TICK = 'color-mix(in oklab, var(--color-neutral-200) 70%, transparent)';
const MAJOR = 'var(--color-neutral-300)';

/** The three tick lengths, as gradients laid along `to`, each at its own length on the `edge` side. */
const ticks = (to: 'bottom' | 'right', edge: 'left' | 'right' | 'bottom') => {
    const across = to === 'bottom';
    const size = (length: number) => (across ? `${length}px 100%` : `100% ${length}px`);
    const at = across ? `${edge} top` : `left ${edge}`;
    return [
        [TICK, 4, 3],
        [TICK, 16, 6],
        [MAJOR, 80, 10],
    ]
        .map(
            ([colour, every, length]) =>
                `repeating-linear-gradient(to ${to}, ${colour} 0 1px, transparent 1px ${every}px) ${at} / ${size(length as number)} no-repeat`,
        )
        .join(', ');
};

/** The rails' two hairlines and their ticks, on the 1232 column; the caller places and sizes them. */
export const RailLines = ({ className }: { className?: string }) => (
    <div aria-hidden className={cn('pointer-events-none', className)}>
        <div className="relative mx-auto h-full w-full max-w-[1232px] border-neutral-200 border-x">
            <span
                className="absolute inset-y-0 right-full w-2.5"
                style={{ background: ticks('bottom', 'right') }}
            />
            <span
                className="absolute inset-y-0 left-full w-2.5"
                style={{ background: ticks('bottom', 'left') }}
            />
        </div>
    </div>
);

/**
 * The rails: a hairline 64px out from each side of the content (the 1152 column, 40px wider each
 * side), its ticks on the outside. From xl up, where there is room for that margin. Marked
 * `data-rails`, so the footer can run them on into its light.
 */
export const Rails = () => (
    <div className="absolute inset-0 -z-10 hidden xl:block" data-rails>
        <RailLines className="size-full" />
    </div>
);

/**
 * Where one section ends and the next begins: a hairline across the page, ruled above, and a
 * registration mark where it crosses each rail. The ticks start 800px (ten of the longest) out from
 * the rail, so they land on the rail's marks wherever it sits; the strip is clipped to the page.
 */
export const Divider = () => (
    <div aria-hidden className="relative hidden md:block">
        <div className="relative h-2.5 overflow-hidden">
            <span
                className="absolute bottom-0 h-2.5"
                style={{
                    left: 'calc(50% - 616px - 800px)',
                    width: 'calc(1232px + 1600px)',
                    background: ticks('right', 'bottom'),
                }}
            />
        </div>
        <div className="h-px bg-neutral-200" />
        <div className="absolute inset-x-0 bottom-0 h-px">
            <div className="relative mx-auto hidden h-full w-full max-w-[1232px] xl:block">
                <Mark className="top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 text-neutral-500" />
                <Mark className="top-1/2 right-0 translate-x-1/2 -translate-y-1/2 text-neutral-500" />
            </div>
        </div>
    </div>
);

/**
 * The page's layout grid drawn faintly, a design tool's columns: twelve on the page's own 1152px
 * column (four on phones), in bands with a hairline either side. It fills the box it is put in
 * (positioned); give it a mask to fade it out.
 */
export const LayoutGrid = ({ className }: { className?: string }) => (
    <div
        aria-hidden
        className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
        <Container className="grid h-full grid-cols-4 gap-6 md:grid-cols-12">
            {Array.from({ length: 12 }, (_, column) => (
                <span
                    className={cn(
                        'h-full border-neutral-950/[0.05] border-x bg-neutral-950/[0.015]',
                        column >= 4 && 'hidden md:block',
                    )}
                    // biome-ignore lint/suspicious/noArrayIndexKey: twelve fixed columns
                    key={column}
                />
            ))}
        </Container>
    </div>
);

/**
 * The board a section lies on: a panel with a design tool's layout grid inside, twelve columns on
 * the page's own 1152px column (four on phones) in faint bands that fade out at the top and foot,
 * and a registration mark at each corner. The grid is the one the page itself is laid on, so
 * whatever lies on the board lines up with it.
 */
export const RuledFrame = ({
    children,
    className,
    outerClassName,
    top = false,
    grid = true,
    glow = false,
}: {
    children: ReactNode;
    className?: string;
    /** The band around the frame, such as room below for something that runs out of it. */
    outerClassName?: string;
    /** The first thing on the page: hugs the top instead of keeping a section's gap. */
    top?: boolean;
    /** The layout grid inside; off where a figure lights the board instead. */
    grid?: boolean;
    /** The landing's spectrum rising from the board's foot, clipped to its corners. */
    glow?: boolean;
}) => (
    <div
        className={cn(
            'px-2 md:px-3',
            top ? 'pt-2 pb-16 md:pt-3 md:pb-32' : 'py-16 md:py-32',
            outerClassName,
        )}
    >
        <div
            className={cn(
                'relative rounded-panel border border-neutral-200 bg-neutral-50',
                // With the glow, the board brightens a step towards its foot, where the light comes from.
                glow && 'bg-linear-to-b from-neutral-50 to-neutral-100',
                className,
            )}
        >
            {/* The layout grid, clipped to the board even when what lies on it runs out. */}
            {grid && (
                <LayoutGrid className="rounded-[inherit] [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]" />
            )}
            {glow && (
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
                >
                    <div className="absolute inset-x-[12%] -bottom-[28%] h-[45%] rounded-full bg-spectrum opacity-30 blur-[96px]" />
                </div>
            )}
            <Mark className="top-4 left-4" />
            <Mark className="top-4 right-4" />
            <Mark className="bottom-4 left-4" />
            <Mark className="right-4 bottom-4" />
            <div className="relative">{children}</div>
        </div>
    </div>
);

/** A command to paste, in Geist Mono, with a copy button that says so for a moment. */
export const CommandChip = ({ command, className }: { command: string; className?: string }) => {
    const [copied, setCopied] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
    useEffect(() => () => clearTimeout(timer.current), []);

    return (
        <div
            className={cn(
                'inline-flex h-control-lg items-center gap-1 rounded-control border border-neutral-200 bg-neutral-50 pr-1 pl-3.5',
                className,
            )}
        >
            <span aria-hidden className="select-none font-mono text-neutral-500 text-xs">
                $
            </span>
            <code className="font-mono text-neutral-800 text-xs">{command}</code>
            <Button
                aria-label={copied ? 'Copied' : `Copy ${command}`}
                className="ml-1"
                onClick={async () => {
                    try {
                        await navigator.clipboard.writeText(command);
                    } catch {
                        return;
                    }
                    setCopied(true);
                    clearTimeout(timer.current);
                    timer.current = setTimeout(() => setCopied(false), 1500);
                }}
                size="icon-sm"
                variant="ghost"
            >
                {copied ? <Check strokeWidth={2} /> : <Copy strokeWidth={2} />}
            </Button>
        </div>
    );
};

/**
 * A product screen shown on the page: its own h1 reads as a level-2 heading and its main is no
 * landmark, so the page keeps one h1 and one main however many screens it shows.
 */
export const Shot = ({ className, children }: { className?: string; children: ReactNode }) => {
    const ref = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
        const root = ref.current;
        if (!root) return;
        for (const heading of root.querySelectorAll('h1')) heading.setAttribute('aria-level', '2');
        for (const main of root.querySelectorAll('main')) main.setAttribute('role', 'none');
    });
    return (
        // A screen opens on its page well below the header, as a page should; in a cropped window that
        // is wasted, so the page's column starts 40px down.
        <div className={cn('**:data-[slot=page-content]:pt-10', className)} ref={ref}>
            {children}
        </div>
    );
};

/** The install command the page promises everywhere. */
export const installCommand = 'npx contui init';
