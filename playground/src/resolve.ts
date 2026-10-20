import { useLayoutEffect, useRef, useState } from 'react';

const channel = (value: number) => Math.round(value).toString(16).padStart(2, '0');

/** Turns a computed `rgb()`/`rgba()` colour back into the hex the tokens are written in. */
export const toHex = (color: string) => {
    const match = color.match(/rgba?\(([^)]+)\)/);
    if (!match?.[1]) return color;
    const [r = 0, g = 0, b = 0, a = 1] = match[1]
        .split(/[\s,/]+/)
        .filter(Boolean)
        .map(Number);
    if (a === 0) return 'transparent';
    const hex = `#${channel(r)}${channel(g)}${channel(b)}`;
    return a < 1 ? `${hex} ${Math.round(a * 100)}%` : hex;
};

export const readBackground = (node: HTMLElement) => toHex(getComputedStyle(node).backgroundColor);

export const readRadius = (node: HTMLElement) => getComputedStyle(node).borderTopLeftRadius;

export const readFont = (node: HTMLElement) => {
    const style = getComputedStyle(node);
    return `${Number.parseFloat(style.fontSize)} / ${Number.parseFloat(style.lineHeight)}`;
};

export const readFontFamily = (node: HTMLElement) =>
    getComputedStyle(node)
        .fontFamily.split(',')[0]
        ?.replace(/["']/g, '')
        .replace(/ Variable$/, '') ?? '';

/**
 * Reads a resolved style off the element once it is mounted. The foundations
 * page remounts on every theme or mode change, so a mount-time read is enough.
 */
export const useResolved = <T extends HTMLElement = HTMLDivElement>(
    read: (node: HTMLElement) => string,
) => {
    const ref = useRef<T>(null);
    const [value, setValue] = useState('');

    useLayoutEffect(() => {
        if (ref.current) setValue(read(ref.current));
    }, [read]);

    return [ref, value] as const;
};
