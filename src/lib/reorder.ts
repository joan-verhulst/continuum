'use client';

import { flushSync } from 'react-dom';

/*
 * Dragging one of a run of items (a table's rows, or its columns) to another place in the run. The
 * item lifts and follows the pointer along one axis, and the items it passes step aside by its size,
 * so the gap it would drop into is always open. Plain DOM transforms while the pointer moves: nothing
 * re-renders until the drop, and then the move is handed over in one go and the item settles into its
 * place from where it was let go.
 */

/** A list with one item moved from one place to another: what a drop hands over, applied. */
export const moveItem = <T>(list: readonly T[], from: number, to: number): T[] => {
    const next = [...list];
    const [item] = next.splice(from, 1);
    if (item !== undefined) next.splice(to, 0, item);
    return next;
};

/**
 * Holds the pointer for a drag: one cursor over the whole page, and nothing under the pointer
 * hovers, takes a cursor of its own or gets its text selected while the drag runs. Returns the
 * release.
 */
export const holdPointer = (cursor: string) => {
    document.getSelection()?.removeAllRanges();
    const style = document.createElement('style');
    style.dataset.continuumDrag = '';
    style.textContent = `html { cursor: ${cursor} !important; user-select: none !important; -webkit-user-select: none !important; } body * { pointer-events: none !important; }`;
    document.head.append(style);
    return () => style.remove();
};

export type ReorderItem = {
    /** What moves with the item: a row, or every cell of a column. */
    nodes: HTMLElement[];
    /** Where it starts and how long it is along the axis. */
    start: number;
    size: number;
};

type Options = {
    axis: 'x' | 'y';
    items: ReorderItem[];
    index: number;
    /** Where the pointer was when the drag began, along the axis. */
    from: number;
    /** Called once at the drop, inside a sync render, so the new order paints with the transforms gone. */
    onMove: (from: number, to: number) => void;
};

const duration = 150;
const ease = `transform ${duration}ms cubic-bezier(0.215, 0.61, 0.355, 1)`;

/** Where the dragged item would land with its middle at `middle`. */
const targetOf = (items: ReorderItem[], index: number, middle: number) => {
    let to = index;
    items.forEach((item, i) => {
        const centre = item.start + item.size / 2;
        if (i > index && middle > centre) to = Math.max(to, i);
        if (i < index && middle < centre) to = Math.min(to, i);
    });
    return to;
};

const translate = (axis: 'x' | 'y', shift: number) =>
    shift === 0 ? '' : `${axis === 'x' ? 'translateX' : 'translateY'}(${shift}px)`;

const place = (options: Options, offset: number) => {
    const { axis, items, index } = options;
    const dragged = items[index];
    if (!dragged) return index;
    const first = items[0];
    const last = items.at(-1);
    // The item stays within the run: it can reach either end, never leave it.
    const min = (first?.start ?? 0) - dragged.start;
    const max = (last ? last.start + last.size : 0) - (dragged.start + dragged.size);
    const clamped = Math.min(Math.max(offset, min), max);
    const to = targetOf(items, index, dragged.start + dragged.size / 2 + clamped);

    items.forEach((item, i) => {
        let shift = 0;
        if (i === index) shift = clamped;
        else if (index < to && i > index && i <= to) shift = -dragged.size;
        else if (index > to && i < index && i >= to) shift = dragged.size;
        for (const node of item.nodes) {
            node.style.transition = i === index ? 'none' : ease;
            node.style.transform = translate(axis, shift);
        }
    });
    return to;
};

/** Eases nodes from where they are drawn now to where they lie, then lets go of them. */
const settle = (nodes: HTMLElement[], axis: 'x' | 'y', offsets: number[], done: () => void) => {
    nodes.forEach((node, i) => {
        node.style.transition = 'none';
        node.style.transform = translate(axis, offsets[i] ?? 0);
    });
    // Commit the start before the transition, so it runs from there.
    void nodes[0]?.getBoundingClientRect();
    for (const node of nodes) {
        node.style.transition = ease;
        node.style.transform = '';
    }
    window.setTimeout(() => {
        for (const node of nodes) node.style.transition = '';
        done();
    }, duration);
};

/**
 * Starts a drag from a pointer already down; ends at the pointer's release, or puts everything back
 * on Escape. The drop calls `onMove`.
 */
export const startReorder = (options: Options) => {
    const { axis, items, index, from, onMove } = options;
    const dragged = items[index];
    if (!dragged) return;
    for (const node of dragged.nodes) node.dataset.dragging = '';
    const release = holdPointer('grabbing');
    let to = index;
    const edge = (node: HTMLElement) => {
        const box = node.getBoundingClientRect();
        return axis === 'x' ? box.left : box.top;
    };
    const lift = () => {
        for (const node of dragged.nodes) delete node.dataset.dragging;
    };

    const move = (event: PointerEvent) => {
        to = place(options, (axis === 'x' ? event.clientX : event.clientY) - from);
    };
    const end = (drop: boolean) => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', cancel);
        window.removeEventListener('keydown', key, true);
        release();
        const others = items.filter((_, i) => i !== index).flatMap(item => item.nodes);

        if (!drop || to === index) {
            // Back where they came from, the dragged one and the ones that stepped aside alike.
            const all = [...others, ...dragged.nodes];
            for (const node of all) {
                node.style.transition = ease;
                node.style.transform = '';
            }
            window.setTimeout(() => {
                for (const node of all) node.style.transition = '';
                lift();
            }, duration);
            return;
        }

        // Where the dragged item is drawn as it is let go; the others already stand where the new
        // order puts them, so they drop their shifts without a step.
        const before = dragged.nodes.map(edge);
        flushSync(() => onMove(index, to));
        for (const node of [...others, ...dragged.nodes]) {
            node.style.transition = 'none';
            node.style.transform = '';
        }
        const offsets = dragged.nodes.map((node, i) => (before[i] ?? 0) - edge(node));
        for (const node of others) node.style.transition = '';
        settle(dragged.nodes, axis, offsets, lift);
    };
    const up = () => end(true);
    const cancel = () => end(false);
    const key = (event: KeyboardEvent) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        end(false);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('keydown', key, true);
};

/**
 * A press that becomes a drag once it has moved `threshold` px, so a click on the same target (a
 * sortable head's label) still clicks. A press that dragged swallows the click that follows it.
 */
export const pressToDrag = (
    event: { clientX: number; clientY: number },
    axis: 'x' | 'y',
    begin: (from: number) => void,
    threshold = 4,
) => {
    const x = event.clientX;
    const y = event.clientY;
    const move = (next: PointerEvent) => {
        const distance = axis === 'x' ? next.clientX - x : next.clientY - y;
        if (Math.abs(distance) < threshold) return;
        stop();
        // The click this press ends in is the drop, not a sort. A click follows its pointerup in
        // the same task, so the swallow goes right after it, also when no click comes.
        const swallow = (click: MouseEvent) => {
            click.preventDefault();
            click.stopPropagation();
        };
        window.addEventListener('click', swallow, { capture: true, once: true });
        window.addEventListener(
            'pointerup',
            () => setTimeout(() => window.removeEventListener('click', swallow, true), 0),
            { once: true },
        );
        begin(axis === 'x' ? x : y);
        // The first step already counts.
        window.dispatchEvent(new PointerEvent('pointermove', next));
    };
    const stop = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', stop);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
};
