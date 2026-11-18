'use client';

import { type ComponentProps, type CSSProperties, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '../lib/cn';
import { splitForTruncation } from '../lib/truncate';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

export type TruncateProps = Omit<ComponentProps<'span'>, 'children'> & {
    /** The whole text. It stays whole in the page: a screen reader reads it and a copy copies it. */
    children: string;
    /**
     * Where the ellipsis goes: `end` for names and labels read from the start; `middle` for file
     * names, paths, hashes and IDs, which are told apart by their end.
     */
    at?: 'end' | 'middle';
    /**
     * With `at="middle"`, how many characters the end keeps. Left out, it follows the kind of
     * string: a file's extension and last word, a path's last part, a hash's last 4.
     */
    end?: number;
    /** Shows the whole text in a tooltip on hover while it is cut; on by default. */
    tooltip?: boolean;
    /** Where that tooltip opens; above by default. */
    tooltipSide?: ComponentProps<typeof TooltipContent>['side'];
};

type Fit = { cut: boolean; reserve?: number };

const ellipsisWidths = new Map<string, number>();

/** The width of the "…" a box draws at the end of its cut text, in the box's own font. */
const ellipsisWidth = (element: Element) => {
    const font = getComputedStyle(element).font;
    let width = ellipsisWidths.get(font);
    if (width === undefined) {
        const context = document.createElement('canvas').getContext('2d');
        if (!context) {
            return 0;
        }
        context.font = font;
        width = context.measureText('…').width;
        ellipsisWidths.set(font, width);
    }
    return width;
};

/**
 * How a middle cut fits the box. A browser's own ellipsis sits after the last character that fits
 * whole, with the rest of the box empty after it, which reads as a space in the name
 * (`tra… -0142`). So the head is clipped to exactly the characters it shows, the ellipsis is drawn
 * at the tail's start, and the tail is reserved the rest of the width.
 */
const measureMiddle = (outer: HTMLElement, head: HTMLElement, tail: HTMLElement): Fit => {
    const headText = head.firstChild;
    const tailText = tail.firstChild;
    if (!(headText instanceof Text) || !(tailText instanceof Text) || outer.offsetWidth === 0) {
        return { cut: false };
    }
    const box = outer.getBoundingClientRect();
    // Ranges measure on screen, so a scaled box (a preview drawn smaller) is measured back to size.
    const scale = box.width / outer.offsetWidth || 1;
    const style = getComputedStyle(outer);
    const room =
        box.width / scale -
        Number.parseFloat(style.paddingLeft) -
        Number.parseFloat(style.paddingRight) -
        Number.parseFloat(style.borderLeftWidth) -
        Number.parseFloat(style.borderRightWidth);

    const range = document.createRange();
    const width = (node: Text, end: number) => {
        range.setStart(node, 0);
        range.setEnd(node, end);
        return range.getBoundingClientRect().width / scale;
    };

    const tailWidth = width(tailText, tailText.length);
    const left = room - tailWidth;
    const whole = width(headText, headText.length);
    if (whole <= left + 0.5) {
        // The head keeps the whole box, so rounding never clips its last character.
        return { cut: false, reserve: 0 };
    }

    // The most characters that fit beside the ellipsis, found by halving; a pixel to spare, so
    // rounding never pushes the tail's last character out.
    const dots = ellipsisWidth(head) + 1;
    let low = 0;
    let high = headText.length;
    while (low < high) {
        const mid = Math.ceil((low + high) / 2);
        if (width(headText, mid) + dots <= left) {
            low = mid;
        } else {
            high = mid - 1;
        }
    }
    // Never between the two halves of a surrogate pair.
    const code = headText.data.charCodeAt(low - 1);
    if (low > 0 && code >= 0xd800 && code <= 0xdbff) {
        low -= 1;
    }
    return { cut: true, reserve: room - width(headText, low) };
};

/**
 * One line of text that never wraps or grows its row: at the width it is given it cuts, at the
 * end or in the middle, and shows the whole on hover. The cut is only drawn: the whole text stays
 * in the page, so it is what a screen reader reads, what find-in-page finds and what a copy takes.
 *
 * In the middle, the end the text keeps is fixed (its extension, its last 4) and the start fills
 * the rest of the width, so a column of names keeps their ends lined up and readable.
 */
export const Truncate = ({
    children: text,
    at = 'end',
    end,
    tooltip = true,
    tooltipSide = 'top',
    className,
    style,
    ...props
}: TruncateProps) => {
    const outerRef = useRef<HTMLSpanElement>(null);
    const headRef = useRef<HTMLSpanElement>(null);
    const tailRef = useRef<HTMLSpanElement>(null);
    const [fit, setFit] = useState<Fit>({ cut: false });

    const { head, tail } =
        at === 'middle' ? splitForTruncation(text, end) : { head: text, tail: '' };

    // Measured again whenever the box, the text or the font changes.
    // biome-ignore lint/correctness/useExhaustiveDependencies: re-measured when the text changes.
    useLayoutEffect(() => {
        const outer = outerRef.current;
        const headEl = headRef.current;
        if (!outer || !headEl) {
            return;
        }
        const measure = () => {
            const next = tailRef.current
                ? measureMiddle(outer, headEl, tailRef.current)
                : { cut: headEl.scrollWidth > headEl.clientWidth };
            setFit(current =>
                current.cut === next.cut && current.reserve === next.reserve ? current : next,
            );
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(outer);
        document.fonts?.addEventListener('loadingdone', measure);
        return () => {
            observer.disconnect();
            document.fonts?.removeEventListener('loadingdone', measure);
        };
    }, [head, tail]);

    const line = (
        <span
            className={cn(
                'block min-w-0 overflow-hidden whitespace-pre',
                // Two boxes read aloud as two words ("invoice-20 26.pdf"), so the halves are hidden
                // from assistive tech and the whole text is read from a visually hidden ::before,
                // which a copy, innerText and textContent leave out.
                tail &&
                    'before:absolute before:size-px before:overflow-hidden before:whitespace-pre before:content-[attr(data-text)] before:[clip-path:inset(50%)]',
                className,
            )}
            data-at={tail ? 'middle' : 'end'}
            data-cut={fit.cut ? '' : undefined}
            data-slot="truncate"
            data-text={tail ? text : undefined}
            ref={outerRef}
            style={
                tail
                    ? ({
                          // Until it is measured, the tail's length in characters stands in for it.
                          '--truncate-tail':
                              fit.reserve === undefined ? `${tail.length}ch` : `${fit.reserve}px`,
                          ...style,
                      } as CSSProperties)
                    : style
            }
            {...props}
        >
            {/* Inline blocks, not flex items, so a copy runs on without a line break. */}
            <span
                aria-hidden={tail ? true : undefined}
                className={cn(
                    'inline-block max-w-full overflow-hidden text-ellipsis whitespace-pre align-top',
                    // Once measured, the head is clipped to whole characters and the tail draws the
                    // ellipsis, so none is drawn here.
                    fit.cut && 'text-clip',
                    // A percentage is left out of the box's own width, so a row that sizes to its
                    // content still sizes to the whole text, and grows back when there is room.
                    tail && 'max-w-[max(1em,calc(100%-var(--truncate-tail)))]',
                )}
                data-slot="truncate-head"
                ref={headRef}
            >
                {head}
            </span>
            {tail && (
                <span
                    aria-hidden
                    className={cn(
                        'inline-block whitespace-pre align-top',
                        // Generated, so it is never copied; its empty alternative keeps it unread.
                        fit.cut && "before:content-[attr(data-dots)_/_'']",
                    )}
                    data-dots="…"
                    data-slot="truncate-tail"
                    ref={tailRef}
                >
                    {tail}
                </span>
            )}
        </span>
    );

    return (
        <Tooltip disabled={!tooltip || !fit.cut}>
            <TooltipTrigger render={line} />
            <TooltipContent
                align="start"
                // A hash or a path has nowhere to break, so it may break anywhere.
                className="select-text text-pretty [overflow-wrap:anywhere]"
                side={tooltipSide}
            >
                {text}
            </TooltipContent>
        </Tooltip>
    );
};
