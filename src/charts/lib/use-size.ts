'use client';

import { useLayoutEffect, useRef, useState } from 'react';

/** The element's content width in px, measured before paint and kept current. */
export const useWidth = <T extends HTMLElement>() => {
    const ref = useRef<T>(null);
    const [width, setWidth] = useState(0);

    useLayoutEffect(() => {
        const node = ref.current;
        if (!node) return;
        const read = () => setWidth(node.clientWidth);
        read();
        const observer = new ResizeObserver(read);
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    return [ref, width] as const;
};

/**
 * How wide the widest of a chart's axis labels is, measured rather than guessed: the
 * chart renders them once, out of sight, and this reads the box they fill. A theme that
 * changes the font or the type size resizes that box, so the gutter follows it on its
 * own, with nothing read from script.
 */
export const useLabelWidth = () => {
    const ref = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);

    useLayoutEffect(() => {
        const node = ref.current;
        if (!node) return;
        // The box is as wide as its widest line, so its own width is the answer.
        const read = () => setWidth(Math.ceil(node.getBoundingClientRect().width));
        read();
        const observer = new ResizeObserver(read);
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    return [ref, width] as const;
};
