import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type CSSProperties, useCallback, useEffect, useState } from 'react';
import { cn } from './cn';

/*
 * A row that can outgrow its width (a dock, the top nav's sections) scrolls sideways with its
 * scrollbar hidden, and says which way there is more: a chevron either side steps it along, the
 * one at an end it has reached disabled rather than gone so the row does not shift, and an edge
 * with more fades so the cut-off item reads as cut off rather than as the end. A row that fits
 * has no chevrons at all.
 */

const fade = 16;

export const useOverflowScroll = <T extends HTMLElement>() => {
    const [node, setNode] = useState<T | null>(null);
    const [edges, setEdges] = useState({ start: false, end: false, overflows: false });

    useEffect(() => {
        if (!node) return;
        const update = () => {
            const overflows = node.scrollWidth > node.clientWidth + 1;
            const start = node.scrollLeft > 1;
            const end = node.scrollLeft + node.clientWidth < node.scrollWidth - 1;
            setEdges(current =>
                current.start === start && current.end === end && current.overflows === overflows
                    ? current
                    : { start, end, overflows },
            );
        };
        update();
        node.addEventListener('scroll', update, { passive: true });
        // The row and its items both change size: a resize, a label, a font that loads late.
        const observer = new ResizeObserver(update);
        observer.observe(node);
        for (const child of node.children) observer.observe(child);
        return () => {
            node.removeEventListener('scroll', update);
            observer.disconnect();
        };
    }, [node]);

    /** Steps most of a view along, so the item cut off at the edge ends up whole. */
    const step = useCallback(
        (direction: -1 | 1) =>
            node?.scrollBy({ left: direction * node.clientWidth * 0.75, behavior: 'smooth' }),
        [node],
    );

    /** Brings the selected item (matched by `selector`) into view, if it is out of it. */
    const reveal = useCallback(
        (selector: string) => {
            const item = node?.querySelector<HTMLElement>(selector);
            if (!node || !item) return;
            const box = item.getBoundingClientRect();
            const left = box.left - node.getBoundingClientRect().left + node.scrollLeft - fade;
            const right = left + box.width + fade * 2;
            if (left < node.scrollLeft) node.scrollTo({ left, behavior: 'smooth' });
            else if (right > node.scrollLeft + node.clientWidth)
                node.scrollTo({ left: right - node.clientWidth, behavior: 'smooth' });
        },
        [node],
    );

    const style: CSSProperties = {
        maskImage: `linear-gradient(to right, ${edges.start ? 'transparent' : 'black'}, black ${fade}px, black calc(100% - ${fade}px), ${edges.end ? 'transparent' : 'black'})`,
    };

    return { ref: setNode, edges, step, reveal, style };
};

type OverflowChevronProps = {
    direction: -1 | 1;
    /** At the end it points to, so there is nothing that way. */
    disabled?: boolean;
    onStep: (direction: -1 | 1) => void;
    className?: string;
};

/**
 * The pointer's way along the row. Out of the tab order: keyboard focus already scrolls the item
 * it lands on into view.
 */
export const OverflowChevron = ({
    direction,
    disabled,
    onStep,
    className,
}: OverflowChevronProps) => {
    const Icon = direction < 0 ? ChevronLeft : ChevronRight;
    return (
        <button
            aria-label={direction < 0 ? 'Scroll back' : 'Scroll on'}
            className={cn(
                'grid shrink-0 cursor-pointer place-items-center text-neutral-600 transition-[background-color,color] duration-150 enabled:hover:bg-neutral-950/5 enabled:hover:text-neutral-950',
                'disabled:cursor-default disabled:text-neutral-300',
                className,
            )}
            data-slot="overflow-chevron"
            disabled={disabled}
            onClick={() => onStep(direction)}
            tabIndex={-1}
            type="button"
        >
            <Icon className="size-4" strokeWidth={2} />
        </button>
    );
};
