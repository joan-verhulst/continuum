import { Button } from 'continuum';
import { Ruler } from 'lucide-react';
import { type PointerEvent, useEffect, useState } from 'react';
import { icon } from '../showcase/kit';

/*
 * Two vertical guide lines over the whole playground, to check by eye whether things line up: a
 * toggle in the bottom right corner shows them; drag a line to place it, or focus it and nudge it a
 * pixel with the arrow keys (ten with Shift). Each line says its x, and the distance between them
 * shows between. Where they were is kept for the next visit. A lab tool, not part of the library.
 */

const KEY = 'continuum-playground-rulers';

type State = { on: boolean; xs: [number, number] };

const read = (): State => {
    try {
        const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as State | null;
        if (saved && Array.isArray(saved.xs) && saved.xs.length === 2) return saved;
    } catch {}
    const width = typeof window === 'undefined' ? 1440 : window.innerWidth;
    return { on: false, xs: [Math.round(width * 0.4), Math.round(width * 0.6)] };
};

export const Rulers = () => {
    const [state, setState] = useState<State>(read);

    useEffect(() => {
        try {
            localStorage.setItem(KEY, JSON.stringify(state));
        } catch {}
    }, [state]);

    const move = (index: 0 | 1, x: number) =>
        setState(current => {
            const xs: [number, number] = [...current.xs];
            xs[index] = Math.max(0, Math.min(window.innerWidth - 1, Math.round(x)));
            return { ...current, xs };
        });

    const drag = (index: 0 | 1) => (event: PointerEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.currentTarget.focus();
        // On the window, so the line follows the pointer wherever it goes until it is let go.
        const onMove = (e: globalThis.PointerEvent | MouseEvent) => move(index, e.clientX);
        const onUp = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('mouseup', onUp);
    };

    const [a, b] = state.xs;
    const left = Math.min(a, b);
    const gap = Math.abs(b - a);

    return (
        <>
            {state.on && (
                <div className="pointer-events-none fixed inset-0 z-1000">
                    {state.xs.map((x, index) => (
                        <div
                            aria-label={`Guide line ${index + 1}, at ${x} pixels`}
                            aria-orientation="vertical"
                            aria-valuenow={x}
                            className="group pointer-events-auto absolute inset-y-0 w-2.25 -translate-x-1 cursor-col-resize outline-none"
                            // biome-ignore lint/suspicious/noArrayIndexKey: two lines, by position.
                            key={index}
                            onKeyDown={event => {
                                const step = event.shiftKey ? 10 : 1;
                                if (event.key === 'ArrowLeft') move(index as 0 | 1, x - step);
                                else if (event.key === 'ArrowRight') move(index as 0 | 1, x + step);
                                else return;
                                event.preventDefault();
                            }}
                            onPointerDown={drag(index as 0 | 1)}
                            role="slider"
                            style={{ left: x }}
                            tabIndex={0}
                        >
                            <div className="absolute inset-y-0 left-1 w-px bg-error-500 group-focus-visible:bg-primary-500" />
                            <span className="absolute top-2 left-2.5 rounded-chip bg-error-500 px-1.5 py-0.5 font-medium font-mono text-[10px] text-white tabular-nums">
                                {x}
                            </span>
                        </div>
                    ))}
                    {gap > 0 && (
                        <span
                            className="absolute top-9 -translate-x-1/2 rounded-chip bg-neutral-950 px-1.5 py-0.5 font-medium font-mono text-[10px] text-neutral-50 tabular-nums"
                            style={{ left: left + gap / 2 }}
                        >
                            ↔ {gap}
                        </span>
                    )}
                </div>
            )}
            <Button
                aria-pressed={state.on}
                className="fixed right-4 bottom-4 z-1001"
                onClick={() => setState(current => ({ ...current, on: !current.on }))}
                variant={state.on ? 'primary' : 'secondary'}
            >
                <Ruler {...icon} /> Rulers
            </Button>
        </>
    );
};
