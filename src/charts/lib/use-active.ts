'use client';

import { type KeyboardEvent, type PointerEvent, useCallback, useState } from 'react';

/**
 * Which row a chart is reading out: the one nearest the pointer, or the one the arrow
 * keys walked to. The reader aims at a date, never at a two-pixel line, so the pointer's
 * x is snapped to the nearest row rather than used as it is.
 */
export const useActive = (count: number, xOf: (index: number) => number) => {
    const [active, setActive] = useState<number | null>(null);

    const nearest = useCallback(
        (x: number) => {
            let best = 0;
            let distance = Number.POSITIVE_INFINITY;
            for (let i = 0; i < count; i++) {
                const gap = Math.abs(xOf(i) - x);
                if (gap < distance) {
                    distance = gap;
                    best = i;
                }
            }
            return best;
        },
        [count, xOf],
    );

    const onPointerMove = useCallback(
        (event: PointerEvent<HTMLElement>) => {
            if (count === 0) return;
            const box = event.currentTarget.getBoundingClientRect();
            setActive(nearest(event.clientX - box.left));
        },
        [count, nearest],
    );

    const clear = useCallback(() => setActive(null), []);

    const onKeyDown = useCallback(
        (event: KeyboardEvent<HTMLElement>) => {
            if (count === 0) return;
            const step = (by: number) =>
                setActive(current => {
                    const from = current ?? (by > 0 ? -1 : count);
                    return Math.max(0, Math.min(count - 1, from + by));
                });

            switch (event.key) {
                case 'ArrowRight':
                    step(1);
                    break;
                case 'ArrowLeft':
                    step(-1);
                    break;
                case 'Home':
                    setActive(0);
                    break;
                case 'End':
                    setActive(count - 1);
                    break;
                case 'Escape':
                    setActive(null);
                    break;
                default:
                    // Enter and Space are the layer's own, as a button: they pick the point read.
                    return;
            }
            // Only once a key is one of ours: the page still scrolls on the rest.
            event.preventDefault();
        },
        [count],
    );

    return {
        active,
        setActive,
        /** On the layer over the plot, which is one tab stop. */
        handlers: {
            onPointerMove,
            onPointerLeave: clear,
            onPointerCancel: clear,
            onKeyDown,
            onBlur: clear,
        },
    };
};
