import {
    Button,
    ColorField,
    ColorPicker,
    cn,
    type Gamut,
    hexToOklch,
    type Oklch,
    oklchToHex,
    type RampShape,
    type RampStep,
    rampSteps,
    wcagContrast,
} from 'continuum';
import { RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { RampChart } from './ramp-graph';

/*
 * A ramp as what it is: eleven colours, and the three curves they lie on. The strip is the ramp:
 * a step is picked on it and set with the colour picker, the same one the theme's own colour is
 * picked with; a step set that way stays as set and carries a dot. Under the strip the ramp is
 * drawn as charts, its lightness, chroma and hue over the eleven steps. One chart is picked at a
 * time, and what shapes that curve as a whole shows under it: there is no control here that is
 * not beside the thing it moves. A point on a chart is the same step as its swatch on the strip.
 * The greys' lightness chart also carries the line where a step turns from reading as text on
 * the light surface to reading on the dark one, since text is what the greys are for.
 */

export type RampEditorProps = {
    /** Whose ramp it is, for the labels: "Primary", "Neutral". */
    name: string;
    /** The ramp as it is now. */
    ramp: readonly Oklch[];
    /** Its eleven colours as the theme writes them, for the strip. */
    swatches: readonly string[];
    /** The ramp as Tailwind would draw it, unshaped: where its curves rest. */
    reference: readonly Oklch[];
    shape?: RampShape;
    onShape: (shape?: RampShape) => void;
    /** The step the theme's own colour sits on; none for greys. */
    seed?: number;
    /** Moves the theme's own colour to another step. */
    onSeed?: (step: RampStep) => void;
    /** A colour's ramp or the greys'. */
    kind: 'primary' | 'grey';
    /** The greys' own hue and tint, set under the charts they are charts of. */
    tint?: { hue: number; tint: number; onChange: (next: { hue: number; tint: number }) => void };
    gamut: Gamut;
};

/**
 * The lightness at which a colour of the ramp just keeps a contrast on a surface: the lightest that
 * still does on a light one, the darkest that still does on a dark one.
 */
const reach = (surface: Oklch, ratio: number, like: Oklch) => {
    const light = surface.l > 0.5;
    let low = 0;
    let high = 1;
    for (let i = 0; i < 20; i++) {
        const mid = (low + high) / 2;
        const passes = wcagContrast({ l: mid, c: like.c, h: like.h }, surface) >= ratio;
        // Towards the surface the contrast falls: keep the half the threshold is in.
        if (passes === light) low = mid;
        else high = mid;
    }
    return (low + high) / 2;
};

/** The shape with only what is set left in it; undefined once nothing is. */
const tidy = (shape: RampShape): RampShape | undefined => {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(shape)) {
        if (key === 'steps') {
            if (value && Object.keys(value).length) out.steps = value;
        } else if (typeof value === 'number' && Number.isFinite(value)) out[key] = value;
    }
    return Object.keys(out).length ? (out as RampShape) : undefined;
};

export const RampEditor = ({
    name,
    ramp,
    swatches,
    reference,
    shape,
    onShape,
    seed,
    onSeed,
    kind,
    gamut,
    tint,
}: RampEditorProps) => {
    // The step being set; none until one is picked, on the strip or on a chart.
    const [picked, setPicked] = useState<number | null>(null);

    const setByHand = (i: number) => {
        const step = rampSteps[i];
        return Boolean(step && i !== seed && shape?.steps?.[step]);
    };

    /** Sets a step to a colour, or gives it back to the ramp. */
    const setStep = (i: number, hex?: string) => {
        const step = rampSteps[i];
        if (!step) return;
        const steps = { ...shape?.steps };
        const color = hex ? hexToOklch(hex) : null;
        if (color) {
            steps[step] = {
                l: Number(color.l.toFixed(4)),
                c: Number(color.c.toFixed(4)),
                h: Number(color.h.toFixed(1)),
            };
        } else delete steps[step];
        onShape(tidy({ ...shape, steps }));
    };

    const toggle = (i: number) => setPicked(now => (now === i ? null : i));

    // The greys are what text is written in, on their own two ends: where a step starts to read
    // as text on each is drawn across their lightness chart.
    const [surface, middle, deep] = [ramp[0], ramp[5], ramp[10]];
    const textLine =
        kind === 'grey' && surface && middle && deep
            ? { light: reach(surface, 4.5, middle), dark: reach(deep, 4.5, middle) }
            : undefined;
    const pickedStep = picked === null ? undefined : rampSteps[picked];
    const pickedColor = picked === null ? undefined : ramp[picked];

    return (
        <section
            aria-label={`${name} ramp`}
            className="flex flex-col gap-4"
            data-slot="ramp-editor"
        >
            <div className="flex h-control items-center justify-between gap-3">
                <h2 className="font-medium text-neutral-950 text-xs">Ramp</h2>
                <Button disabled={!shape} onClick={() => onShape(undefined)} variant="ghost">
                    <RotateCcw strokeWidth={2} />
                    Reset
                </Button>
            </div>

            {/* The ramp itself: a step is picked here to be set under it. */}
            <div className="flex gap-1">
                {rampSteps.map((step, i) => {
                    const open = i === picked;
                    const own = i === seed;
                    const held = setByHand(i);
                    const dark = (ramp[i]?.l ?? 1) < 0.6;
                    return (
                        <button
                            aria-label={`${name} ${step}${own ? ', your colour' : held ? ', set by hand' : ''}`}
                            aria-pressed={open}
                            className="group flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-1.5 outline-none"
                            key={step}
                            onClick={() => toggle(i)}
                            type="button"
                        >
                            <span
                                className={cn(
                                    'flex h-9 w-full items-center justify-center rounded-chip outline-2 outline-solid outline-offset-2 ring-1 ring-neutral-950/10 ring-inset transition-[outline-color] duration-150 group-focus-visible:outline-focus',
                                    open
                                        ? 'outline-neutral-950'
                                        : 'outline-transparent group-hover:outline-neutral-300',
                                )}
                                style={{ background: swatches[i] }}
                            >
                                {/* Your colour is ringed; a step set by hand carries a dot. */}
                                {own ? (
                                    <span
                                        className={cn(
                                            'size-2.5 rounded-full border-2',
                                            dark ? 'border-white/90' : 'border-black/70',
                                        )}
                                    />
                                ) : (
                                    held && (
                                        <span
                                            className={cn(
                                                'size-1.5 rounded-full',
                                                dark ? 'bg-white/90' : 'bg-black/70',
                                            )}
                                        />
                                    )
                                )}
                            </span>
                            <span
                                className={cn(
                                    'text-xxs tabular-nums',
                                    open || own
                                        ? 'font-medium text-neutral-950'
                                        : 'text-neutral-600',
                                )}
                            >
                                {step}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* The step picked: its colour to set, or what it is if it is the theme's own. */}
            {picked !== null && pickedStep && pickedColor && (
                <div className="flex flex-wrap items-center gap-3 rounded-item bg-neutral-950/3 p-3">
                    {picked === seed ? (
                        <p className="text-neutral-600 text-xs">
                            <span className="font-medium text-neutral-950">{pickedStep}</span> is
                            your colour.
                        </p>
                    ) : (
                        <>
                            <ColorPicker
                                label={`${name} ${pickedStep}`}
                                onChange={hex => setStep(picked, hex)}
                                value={oklchToHex(pickedColor)}
                            />
                            <ColorField
                                label={`${name} ${pickedStep}`}
                                onChange={hex => setStep(picked, hex)}
                                value={oklchToHex(pickedColor)}
                            />
                            <div className="ml-auto flex items-center gap-1">
                                {setByHand(picked) && (
                                    <Button onClick={() => setStep(picked)} variant="ghost">
                                        Reset step
                                    </Button>
                                )}
                                {onSeed && (
                                    // The step takes your colour, so nothing set by hand is left on it.
                                    <Button onClick={() => onSeed(pickedStep)} variant="secondary">
                                        Put my colour here
                                    </Button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* The same eleven steps as curves: one is picked, and what shapes it shows under it. */}
            <RampChart
                gamut={gamut}
                kind={kind}
                label={`${name} ramp`}
                onPick={toggle}
                onShape={onShape}
                picked={picked}
                ramp={ramp}
                reference={reference}
                seed={seed}
                shape={shape}
                textLine={textLine}
                tint={tint}
            />
        </section>
    );
};
