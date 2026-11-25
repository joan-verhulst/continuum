import { cn } from '@contui/ui';
import type { ComponentProps, ReactNode } from 'react';

/*
 * A tool's two framed panels, the way every tool page lays out its tool (./tool-page puts it under
 * the hero): the controls on the left at 420, the result on the right, 12 apart, both on Continuum's
 * panel (hairline, panel corners, the surface), about one window tall so the tool is seen whole once
 * scrolled to. Each pane keeps its own scroll: give the part that grows a PaneScroll. Under 1024 the
 * panes stack, the controls first, each a little under a window tall.
 *
 *     <ToolPanes
 *         controls={<><HeaderBar …/><PaneScroll><PaneBody>…</PaneBody></PaneScroll><PaneBar edge="bottom">…</PaneBar></>}
 *         result={<PaneScroll><PaneBody>…</PaneBody></PaneScroll>}
 *     />
 *
 * Spacing from the formula: a pane holds boxes padded 12 to 16 at 13px, so its body is padded 24; a
 * group's label to what it holds, 12; groups 32 apart.
 */

export const ToolPanes = ({
    controls,
    result,
    controlsLabel = 'Controls',
    resultLabel = 'Result',
    className,
}: {
    controls: ReactNode;
    result: ReactNode;
    /** The panes' names for assistive tech. */
    controlsLabel?: string;
    resultLabel?: string;
    className?: string;
}) => (
    <div
        className={cn(
            'grid gap-3 lg:h-[clamp(640px,calc(100dvh-96px),960px)] lg:grid-cols-[420px_minmax(0,1fr)]',
            className,
        )}
    >
        <Pane label={controlsLabel}>{controls}</Pane>
        <Pane label={resultLabel}>{result}</Pane>
    </div>
);

/** A framed pane: hairline, panel corners, the surface; a column its parts fill. */
const Pane = ({ label, children }: { label: string; children: ReactNode }) => (
    <section
        aria-label={label}
        className="flex h-[min(760px,calc(100dvh-96px))] min-h-0 min-w-0 flex-col overflow-hidden rounded-panel border border-neutral-200 bg-neutral-50 lg:h-auto"
        data-slot="tool-pane"
    >
        {children}
    </section>
);

/** The part of a pane that scrolls on its own, between its bars. */
export const PaneScroll = ({ className, ...props }: ComponentProps<'div'>) => (
    <div className={cn('min-h-0 flex-1 overflow-y-auto', className)} {...props} />
);

/** A pane's body, padded 24, its groups 32 apart. */
export const PaneBody = ({ className, children }: { className?: string; children: ReactNode }) => (
    <div className={cn('flex min-w-0 flex-col gap-8 p-6', className)}>{children}</div>
);

/** A pane's bar, over or under its body: a hairline between, the bar's own row of things. */
export const PaneBar = ({
    className,
    edge,
    children,
}: {
    className?: string;
    edge: 'top' | 'bottom';
    children: ReactNode;
}) => (
    <div
        className={cn(
            'flex min-h-bar shrink-0 flex-wrap items-center gap-2 border-neutral-200 px-4',
            edge === 'top' ? 'border-b' : 'border-t',
            className,
        )}
    >
        {children}
    </div>
);

/** A labelled group inside a pane: a small label, then what it holds. */
export const PaneGroup = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="flex min-w-0 flex-col gap-3">
        <h3 className="font-medium text-neutral-600 text-xs">{label}</h3>
        {children}
    </div>
);
