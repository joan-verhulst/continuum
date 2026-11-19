'use client';

import { Button, cn, Slider } from 'continuum';
import { Check, Copy, ImageDown, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import type { Tunable } from '@/lib/tunable';

/*
 * A panel for setting a shader's numbers by eye, shown only with `?tune` in the address. A point
 * (the light's place) is dragged on the box itself: anywhere on it, or by its marker where the box
 * holds things to click. Copy puts the values on the clipboard as the defaults' source, to paste back.
 * While tuning, the values are kept in this browser, so a reload (another edit's hot reload) picks
 * up where the tuning was; Reset goes back to the defaults. Without ?tune nothing is read.
 */

export type TunerRow<T> = {
    key: keyof T & string;
    label: string;
    min: number;
    max: number;
    step: number;
};
export type TunerGroup<T> = { title: string; rows: TunerRow<T>[] };

const decimals = (step: number) => (step >= 1 ? 0 : step >= 0.1 ? 1 : step >= 0.01 ? 2 : 3);

export const Tuner = <T extends Record<string, number>>({
    title,
    name,
    store,
    groups,
    point,
    dragAnywhere = false,
    side = 'right',
    onBake,
}: {
    title: string;
    /** The defaults' constant in the source, for Copy; also keys the stored tuning. */
    name: string;
    store: Tunable<T>;
    groups: TunerGroup<T>[];
    /** The pair of values dragged on the box, in its 0–1 with y up. */
    point: { x: keyof T & string; y: keyof T & string };
    /** Drag anywhere on the box, rather than by the marker alone. */
    dragAnywhere?: boolean;
    side?: 'left' | 'right';
    /** Draws the light as an image (a data URL), for Save image: the light baked, to use where a shader would be too much. */
    onBake?: () => string | null;
}) => {
    const [on, setOn] = useState(false);
    const [copied, setCopied] = useState(false);
    const box = useRef<HTMLDivElement>(null);
    const values = useSyncExternalStore(store.subscribe, store.get, store.get);
    // Keyed by the settings too, so tuning saved for an earlier set of controls is not read into a new one.
    const stored = `continuum-tune-${name}-${Object.keys(store.defaults).join(',')}`;

    useEffect(() => {
        if (!new URLSearchParams(window.location.search).has('tune')) return;
        setOn(true);
        try {
            const saved = window.localStorage.getItem(stored);
            if (saved) store.set(JSON.parse(saved) as Partial<T>);
        } catch {}
        return store.subscribe(() => {
            try {
                window.localStorage.setItem(stored, JSON.stringify(store.get()));
            } catch {}
        });
    }, [store, stored]);

    if (!on) return null;

    /** The pointer's place as the point, in the box's 0–1 with y up: past an edge runs on beyond it. */
    const place = (event: React.PointerEvent) => {
        const rect = box.current?.getBoundingClientRect();
        if (!rect) return;
        const round = (value: number) => Math.round(value * 100) / 100;
        store.set({
            [point.x]: round((event.clientX - rect.left) / rect.width),
            [point.y]: round(1 - (event.clientY - rect.top) / rect.height),
        } as Partial<T>);
    };
    const drag = {
        onPointerDown: (event: React.PointerEvent) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            place(event);
        },
        onPointerMove: (event: React.PointerEvent) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) place(event);
        },
    };

    // The marker stays on the box; a point past its foot shows on the edge with how far beyond.
    const x = values[point.x] ?? 0;
    const y = values[point.y] ?? 0;
    const markerX = Math.min(0.98, Math.max(0.02, x));
    const markerY = Math.min(0.96, Math.max(0.06, y));

    const copy = async () => {
        const text = `export const ${name} = ${JSON.stringify(values, null, 4).replace(/"(\w+)":/g, '$1:')};`;
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <>
            <div
                className={cn(
                    'absolute inset-0 z-10 touch-none',
                    dragAnywhere ? 'cursor-crosshair' : 'pointer-events-none',
                )}
                ref={box}
                {...(dragAnywhere ? drag : {})}
            >
                <span
                    className={cn(
                        'absolute flex -translate-x-1/2 translate-y-1/2 flex-col items-center gap-1',
                        dragAnywhere ? 'pointer-events-none' : 'pointer-events-auto cursor-grab',
                    )}
                    style={{ left: `${markerX * 100}%`, bottom: `${markerY * 100}%` }}
                    {...(dragAnywhere ? {} : drag)}
                >
                    {y < 0 && (
                        <span className="rounded-chip bg-neutral-950 px-1.5 py-0.5 font-mono text-[11px] text-neutral-50">
                            {Math.abs(y).toFixed(2)} below
                        </span>
                    )}
                    <span className="size-3.5 rounded-full border-2 border-neutral-50 bg-neutral-950 shadow-float" />
                </span>
            </div>
            {createPortal(
                <div
                    className={cn(
                        'fixed bottom-3 z-50 flex max-h-[calc(100dvh-24px)] w-72 flex-col overflow-hidden rounded-panel border border-neutral-200 bg-neutral-50 text-neutral-950 text-xs shadow-float',
                        side === 'right' ? 'right-3' : 'left-3',
                    )}
                >
                    <div className="flex items-center justify-between gap-2 border-neutral-200 border-b py-2 pr-2 pl-4">
                        <span className="font-medium">{title}</span>
                        <div className="flex gap-1">
                            <Button
                                aria-label="Reset"
                                onClick={() => store.set(store.defaults)}
                                size="icon-sm"
                                variant="ghost"
                            >
                                <RotateCcw strokeWidth={2} />
                            </Button>
                            {onBake && (
                                <Button
                                    aria-label="Save image"
                                    onClick={() => {
                                        const url = onBake();
                                        if (!url) return;
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.download = `${name.toLowerCase()}.webp`;
                                        link.click();
                                    }}
                                    size="icon-sm"
                                    variant="ghost"
                                >
                                    <ImageDown strokeWidth={2} />
                                </Button>
                            )}
                            <Button onClick={copy} variant="secondary">
                                {copied ? <Check strokeWidth={2} /> : <Copy strokeWidth={2} />}
                                {copied ? 'Copied' : 'Copy values'}
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-col gap-5 overflow-y-auto p-4">
                        <p className="text-neutral-600">
                            {dragAnywhere
                                ? 'Drag on the box to move the light.'
                                : 'Drag the dot to move the light.'}
                        </p>
                        {groups.map(group => (
                            <div className="flex flex-col gap-3" key={group.title}>
                                <span className="font-medium text-neutral-600">{group.title}</span>
                                {group.rows.map(row => (
                                    <div className="flex flex-col gap-1" key={row.key}>
                                        <div className="flex justify-between gap-2">
                                            <span>{row.label}</span>
                                            <span className="font-mono text-neutral-600 tabular-nums">
                                                {(values[row.key] ?? 0).toFixed(decimals(row.step))}
                                            </span>
                                        </div>
                                        <Slider
                                            aria-label={`${group.title}: ${row.label}`}
                                            max={row.max}
                                            min={row.min}
                                            onValueChange={([value]) =>
                                                value !== undefined &&
                                                store.set({ [row.key]: value } as Partial<T>)
                                            }
                                            step={row.step}
                                            value={[values[row.key] ?? 0]}
                                        />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>,
                document.body,
            )}
        </>
    );
};
