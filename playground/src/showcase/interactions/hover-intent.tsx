import { Button, cn, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@contui/ui';
import { ChartColumn, Inbox, type LucideIcon, Settings, Users } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useStageContainer } from '../../layout';
import type { Entry, Knob, PreviewProps } from '../kit';
import { o, previewIcon } from '../kit';

/*
 * Hover intent: a label opens once the pointer rests, not as it passes, and closes after a grace
 * period, not the instant the pointer slips off. The demo times both on a bar under the toolbar,
 * so the wait can be seen as well as felt.
 */

const tools: { id: string; label: string; Icon: LucideIcon }[] = [
    { id: 'inbox', label: 'Inbox', Icon: Inbox },
    { id: 'customers', label: 'Customers', Icon: Users },
    { id: 'reports', label: 'Reports', Icon: ChartColumn },
    { id: 'settings', label: 'Settings', Icon: Settings },
];

const knobs: Knob[] = [
    {
        id: 'open',
        label: 'Open after',
        options: [o('0', '0 ms'), o('100', '100 ms'), o('300', '300 ms'), o('600', '600 ms')],
        default: '300',
    },
    {
        id: 'close',
        label: 'Close after',
        options: [o('0', '0 ms'), o('150', '150 ms'), o('300', '300 ms')],
        default: '0',
    },
    { id: 'group', label: 'Group the labels', switch: true, default: true },
];

type Phase =
    | { kind: 'idle' }
    | { kind: 'opening'; label: string; ms: number }
    | { kind: 'open'; label: string }
    | { kind: 'closing'; label: string; ms: number };

const phaseText = (phase: Phase) => {
    switch (phase.kind) {
        case 'idle':
            return 'Rest the pointer on a tool';
        case 'opening':
            return phase.ms > 0
                ? `${phase.label} · opens after ${phase.ms} ms at rest`
                : `${phase.label} · opens at once`;
        case 'open':
            return `${phase.label} · open`;
        case 'closing':
            return phase.ms > 0 ? `${phase.label} · closes in ${phase.ms} ms` : phase.label;
    }
};

/** A thin bar that fills over the wait, so the timer can be seen. */
const IntentBar = ({ phase }: { phase: Phase }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const bar = ref.current;
        if (!bar) return;
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const animate = (from: number, to: number, ms: number) =>
            bar.animate([{ transform: `scaleX(${from})` }, { transform: `scaleX(${to})` }], {
                duration: reduce ? 0 : ms,
                easing: 'linear',
                fill: 'forwards',
            });
        const run =
            phase.kind === 'opening'
                ? animate(0, 1, phase.ms)
                : phase.kind === 'closing'
                  ? animate(1, 0, phase.ms)
                  : animate(phase.kind === 'open' ? 1 : 0, phase.kind === 'open' ? 1 : 0, 0);
        return () => run.cancel();
    }, [phase]);

    return (
        <div className="h-1 w-48 overflow-hidden rounded-full bg-neutral-200">
            <div
                className={cn(
                    'h-full origin-left rounded-full',
                    phase.kind === 'closing' ? 'bg-neutral-500' : 'bg-action',
                )}
                ref={ref}
                // Empty until the first wait; the animations take it from there.
                style={{ transform: 'scaleX(0)' }}
            />
        </div>
    );
};

const HoverIntentPreview = ({ knobs: values }: PreviewProps) => {
    const stage = useStageContainer();
    const still = Boolean(stage?.inert);
    const openMs = Number(values.open);
    const closeMs = Number(values.close);
    const grouped = Boolean(values.group);
    const [phase, setPhase] = useState<Phase>(
        still ? { kind: 'open', label: 'Reports' } : { kind: 'idle' },
    );
    // Whether a label has shown lately, so a grouped neighbour opens at once (Base UI's 400 ms window).
    const lastClosed = useRef(0);
    const anyOpen = useRef(false);

    const item = (tool: (typeof tools)[number]) => {
        const node = (
            <Tooltip
                key={tool.id}
                onOpenChange={next => {
                    anyOpen.current = next;
                    if (next) setPhase({ kind: 'open', label: tool.label });
                    else {
                        lastClosed.current = performance.now();
                        setPhase(now =>
                            now.kind !== 'idle' && now.label === tool.label
                                ? { kind: 'idle' }
                                : now,
                        );
                    }
                }}
                open={still ? tool.id === 'reports' : undefined}
            >
                <TooltipTrigger
                    onPointerEnter={() => {
                        const warm =
                            grouped &&
                            (anyOpen.current || performance.now() - lastClosed.current < 400);
                        setPhase({ kind: 'opening', label: tool.label, ms: warm ? 0 : openMs });
                    }}
                    onPointerLeave={() =>
                        setPhase(now =>
                            now.kind === 'open' ? { ...now, kind: 'closing', ms: closeMs } : now,
                        )
                    }
                    render={<Button aria-label={tool.label} size="icon" variant="ghost" />}
                >
                    <tool.Icon {...previewIcon} />
                </TooltipTrigger>
                <TooltipContent container={stage} side="bottom">
                    {tool.label}
                </TooltipContent>
            </Tooltip>
        );
        // Ungrouped, each label has a provider of its own, so none hands its warmth to the next.
        return grouped ? (
            node
        ) : (
            <TooltipProvider closeDelay={closeMs} delay={openMs} key={tool.id}>
                {node}
            </TooltipProvider>
        );
    };

    const row: ReactNode = <div className="flex items-center gap-1">{tools.map(item)}</div>;

    return (
        <div className="flex flex-col items-center gap-10">
            {grouped ? (
                <TooltipProvider closeDelay={closeMs} delay={openMs}>
                    {row}
                </TooltipProvider>
            ) : (
                row
            )}
            <div className="flex flex-col items-center gap-2">
                <IntentBar phase={phase} />
                <span aria-live="polite" className="text-neutral-600 text-xxs tabular-nums">
                    {phaseText(phase)}
                </span>
            </div>
        </div>
    );
};

export const entry: Entry = {
    id: 'hover-intent',
    name: 'Hover intent',
    category: 'interaction',
    description:
        'Open after the pointer rests, close after a grace period, and open neighbours at once once one is showing.',
    knobs,
    Preview: HoverIntentPreview,
};
