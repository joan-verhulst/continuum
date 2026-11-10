import { presets } from '@playground/presets';
import { measurePairs, type PairResult } from '@playground/theme-editor/checks';
import {
    Badge,
    Button,
    Checkbox,
    cn,
    createThemeCss,
    hexToOklch,
    Input,
    type RampStep,
    rampSteps,
    Theme,
    type ThemeMode,
    type ThemeOptions,
    themeAccentCurves,
    toCss,
    wcagContrast,
} from 'continuum';
import { ArrowRight, Check, X } from 'lucide-react';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Pill, Reveal, Section, Window } from '../web';

/*
 * The free tool, as a section: the theme builder's promise in searchable words beside a mini
 * builder that works on its own. One colour in, its 11-step ramp, a lit button, a badge and a
 * checked box out, measured in light and dark by the builder's own checks. When a colour
 * reads in one mode and not the other, it finds the step that reads in both.
 */

const icon = { strokeWidth: 2 } as const;

/* ---------- The accent, shared with the trust cards below ---------- */

export type Accent = {
    /** The swatch it came from, or null for a typed colour. */
    id: string | null;
    hex: string;
    /** The step of the ramp the colour lands on; the 500 fills the button. */
    step: RampStep;
};

export type Swatch = { id: string; name: string; hex: string };

/** The builder's starts, then six of Tailwind's 500s, so a visitor sees the range at once. */
export const swatches: Swatch[] = [
    ...presets.flatMap(preset =>
        preset.theme.accent
            ? [{ id: preset.id, name: preset.label, hex: preset.theme.accent }]
            : [],
    ),
    { id: 'rose', name: 'Rose', hex: '#ff2056' },
    { id: 'orange', name: 'Orange', hex: '#ff6900' },
    { id: 'amber', name: 'Amber', hex: '#fe9a00' },
    { id: 'emerald', name: 'Emerald', hex: '#00bc7d' },
    { id: 'sky', name: 'Sky', hex: '#00a6f4' },
    { id: 'violet', name: 'Violet', hex: '#8e51ff' },
];

// Stone reads in both modes as it is, so the demo opens on a pass and the visitor finds the misses.
const startSwatch = swatches.find(swatch => swatch.id === 'stone') ?? swatches[0];

let current: Accent = {
    id: startSwatch?.id ?? null,
    hex: startSwatch?.hex ?? '#3939e5',
    step: '500',
};
const listeners = new Set<() => void>();

/** The accent the visitor picked, one value for the page: the builder sets it, the trust cards read it. */
export const accentStore = {
    get: () => current,
    set: (next: Accent) => {
        current = next;
        for (const listener of listeners) listener();
    },
    subscribe: (listener: () => void) => {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    },
};

export const useAccent = () =>
    useSyncExternalStore(accentStore.subscribe, accentStore.get, accentStore.get);

/** The theme a picked accent makes, in the site's own action style: the accent, lit. */
export const accentTheme = (accent: Accent): ThemeOptions => ({
    accent: accent.hex,
    accentStep: accent.step,
    action: 'accent',
    actionStyle: 'lit',
});

/* ---------- Measuring ---------- */

/** The three pairs the mini builder paints, by the builder's own ids and in its order. */
const pairs = [
    { id: 'on-action', label: 'Button label' },
    { id: 'badge-primary', label: 'Badge text' },
    { id: 'action', label: 'Checked box' },
] as const;

type Measured = { id: string; label: string; result: PairResult | undefined };

const measure = (options: ThemeOptions, mode: ThemeMode): Measured[] => {
    const results = measurePairs(options, mode);
    return pairs.map(pair => ({
        ...pair,
        result: results.find(result => result.check.id === pair.id),
    }));
};

const passes = (row: Measured) => Boolean(row.result && row.result.ratio >= row.result.check.min);

/** Steps to try, nearest the 500 first, so the colour moves no further than it must. */
const candidates: RampStep[] = ['500', '400', '600', '300', '700', '200', '800'];

/** The step nearest the 500 at which every pair reads in both modes, or null when none does. */
const findStep = (hex: string): RampStep | null => {
    for (const step of candidates) {
        const options = accentTheme({ id: null, hex, step });
        if (measure(options, 'light').every(passes) && measure(options, 'dark').every(passes)) {
            return step;
        }
    }
    return null;
};

/** A ratio cut, never rounded, so a shown figure never claims a level it misses: 4.49 shows 4.4. */
const ratio = (value: number) => `${(Math.trunc(value * 10) / 10).toFixed(1)}:1`;

/* ---------- The parts ---------- */

/** One colour, a pick among the swatches or a typed hex, with the browser's well beside it. */
const AccentPicker = ({ accent }: { accent: Accent }) => {
    const [draft, setDraft] = useState(accent.hex);
    useEffect(() => setDraft(accent.hex), [accent.hex]);

    const take = (value: string) => {
        const hex = (value.startsWith('#') ? value : `#${value}`).toLowerCase();
        if (!/^#[0-9a-f]{6}$/.test(hex)) return;
        const swatch = swatches.find(item => item.hex === hex);
        accentStore.set({ id: swatch?.id ?? null, hex, step: '500' });
    };

    return (
        <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2">
            <fieldset className="flex flex-wrap items-center gap-1.5">
                <legend className="sr-only">Accent</legend>
                {swatches.map(swatch => {
                    const on = accent.id === swatch.id;
                    return (
                        <label
                            className={cn(
                                'size-6 cursor-pointer rounded-full ring-1 ring-neutral-950/10 ring-inset transition-[outline-color] duration-150',
                                'outline-2 outline-solid outline-offset-2',
                                on
                                    ? 'outline-neutral-950'
                                    : 'outline-transparent hover:outline-neutral-300',
                                'has-focus-visible:outline-focus',
                            )}
                            key={swatch.id}
                            style={{ background: swatch.hex }}
                            title={swatch.name}
                        >
                            <input
                                checked={on}
                                className="sr-only"
                                name="accent-swatch"
                                onChange={() =>
                                    accentStore.set({ id: swatch.id, hex: swatch.hex, step: '500' })
                                }
                                type="radio"
                                value={swatch.id}
                            />
                            <span className="sr-only">{swatch.name}</span>
                        </label>
                    );
                })}
            </fieldset>
            <Input
                aria-label="Accent as hex"
                className="w-32 font-mono"
                leadingIcon={
                    <input
                        aria-label="Pick an accent"
                        className={cn(
                            'size-4 shrink-0 cursor-pointer appearance-none rounded-full border-0 bg-transparent p-0',
                            '[&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-0',
                            '[&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0',
                            // The field around it draws the ring for any input inside it.
                            'outline-none',
                        )}
                        onChange={event => take(event.target.value)}
                        type="color"
                        value={accent.hex}
                    />
                }
                onBlur={() => setDraft(accent.hex)}
                onChange={event => {
                    const next = event.target.value.trim();
                    setDraft(next);
                    take(next);
                }}
                size="sm"
                spellCheck={false}
                value={draft}
            />
        </div>
    );
};

/** The eleven steps the colour makes, 50 to 950, with the step it landed on marked. */
const Ramp = ({ accent }: { accent: Accent }) => {
    const ramp = useMemo(() => themeAccentCurves(accentTheme(accent)) ?? [], [accent]);
    const seed = hexToOklch(accent.hex);
    return (
        <div className="flex flex-col gap-3">
            <h3 className="sr-only">The palette</h3>
            <ol className="grid grid-cols-11 gap-1">
                {ramp.map((color, i) => {
                    const step = rampSteps[i] ?? '';
                    const yours = step === accent.step;
                    // A mark in the ramp's own end that reads on the step: its deepest on the pale
                    // half, its palest on the deep one.
                    const pale = ramp[0];
                    const deep = ramp[10];
                    const mark =
                        pale && deep && wcagContrast(color, deep) > wcagContrast(color, pale)
                            ? deep
                            : pale;
                    return (
                        <li className="flex min-w-0 flex-col items-center gap-1.5" key={step}>
                            <span
                                className="relative flex h-10 w-full items-center justify-center rounded-[calc(var(--radius-chip)-2px)] transition-[background-color] duration-150 motion-reduce:transition-none"
                                style={{ background: toCss(color, 'p3') }}
                            >
                                {yours && (
                                    <span
                                        aria-hidden
                                        className="size-1.5 rounded-full"
                                        style={{ background: mark && toCss(mark, 'p3') }}
                                    />
                                )}
                            </span>
                            <span
                                className={cn(
                                    'font-mono text-xxs tabular-nums',
                                    step === '500' ? 'text-neutral-950' : 'text-neutral-500',
                                )}
                            >
                                {step}
                                {yours && <span className="sr-only"> (your colour)</span>}
                            </span>
                        </li>
                    );
                })}
            </ol>
            <p className="text-neutral-600 text-xs">
                {accent.step === '500' ? (
                    <>
                        Your <span className="font-mono text-neutral-950">{accent.hex}</span> is the
                        500, which fills the button
                    </>
                ) : (
                    <>
                        Your <span className="font-mono text-neutral-950">{accent.hex}</span> sits
                        at {accent.step}; the button takes the 500
                    </>
                )}
                {seed && (
                    <span className="hidden text-neutral-500 sm:inline">
                        {' '}
                        · oklch {Math.round(seed.l * 100)}% {seed.c.toFixed(3)} {Math.round(seed.h)}{' '}
                        in Display P3
                    </span>
                )}
            </p>
        </div>
    );
};

/** One mode of the theme: the parts the accent paints, then how each of them reads. */
const ModePanel = ({ mode, rows }: { mode: ThemeMode; rows: Measured[] }) => (
    <Theme
        className="flex min-w-0 flex-col gap-4 bg-neutral-50 p-5 text-neutral-950 transition-[background-color] duration-150 motion-reduce:transition-none"
        mode={mode}
        theme="tb-live"
    >
        <h3 className="text-neutral-500 text-xxs">{mode === 'light' ? 'Light' : 'Dark'}</h3>
        <div className="flex items-center gap-2.5">
            <Button tabIndex={-1}>Save changes</Button>
            <Badge tone="primary">Scheduled</Badge>
            <Checkbox aria-label={`A checked box in ${mode} mode`} defaultChecked />
        </div>
        <div className="pt-1">
            <ul className="flex flex-col gap-1.5">
                {rows.map(row => {
                    const ok = passes(row);
                    return (
                        <li className="flex h-6 items-center gap-2 text-xs" key={row.id}>
                            <span className="min-w-0 flex-1 truncate text-neutral-600">
                                {row.label}
                            </span>
                            <span className="font-medium text-neutral-950 tabular-nums">
                                {row.result ? ratio(row.result.ratio) : '—'}
                            </span>
                            {ok ? (
                                <Check
                                    aria-hidden
                                    className="size-3.5 text-success-600"
                                    {...icon}
                                />
                            ) : (
                                <X aria-hidden className="size-3.5 text-error-600" {...icon} />
                            )}
                            <span className="sr-only">{ok ? 'passes' : 'misses'}</span>
                            <span className="w-11 text-right text-neutral-500 tabular-nums">
                                Lc {row.result ? Math.trunc(Math.abs(row.result.lc)) : '—'}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    </Theme>
);

/** Whether the colour reads in both modes, and when it doesn't, the step at which it would. */
const Verdict = ({
    accent,
    light,
    dark,
}: {
    accent: Accent;
    light: Measured[];
    dark: Measured[];
}) => {
    const missLight = light.filter(row => !passes(row)).map(row => row.label.toLowerCase());
    const missDark = dark.filter(row => !passes(row)).map(row => row.label.toLowerCase());
    const fine = missLight.length + missDark.length === 0;
    const step = useMemo(() => (fine ? null : findStep(accent.hex)), [fine, accent.hex]);

    const list = (names: string[]) =>
        names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0];
    // Said once when both modes miss the same pairs, otherwise mode by mode.
    const misses =
        missLight.join() === missDark.join()
            ? `Misses in light and dark: ${list(missLight)}.`
            : [
                  missLight.length ? `Misses in light: ${list(missLight)}.` : '',
                  missDark.length
                      ? `${missLight.length ? 'In' : 'Misses in'} dark: ${list(missDark)}.`
                      : '',
              ]
                  .filter(Boolean)
                  .join(' ');

    return (
        <div
            aria-live="polite"
            className="flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-neutral-200 border-t px-4 py-2.5"
        >
            <p className="flex min-w-0 flex-1 items-start gap-2 text-neutral-700 text-xs">
                {fine ? (
                    <>
                        <Check aria-hidden className="size-4 shrink-0 text-success-600" {...icon} />
                        {accent.step === '500'
                            ? 'Every pair reads in light and in dark.'
                            : `As the ${accent.step}, every pair reads in light and in dark.`}
                    </>
                ) : (
                    <>
                        <X aria-hidden className="size-4 shrink-0 text-error-600" {...icon} />
                        <span>
                            {misses}{' '}
                            {step
                                ? `Moved to ${step}, it reads in both.`
                                : 'No step reads in both; shape its curve in the builder.'}
                        </span>
                    </>
                )}
            </p>
            {!fine && step && (
                <Button
                    onClick={() => accentStore.set({ ...accent, step })}
                    size="md"
                    variant="secondary"
                >
                    Move to {step}
                </Button>
            )}
            {fine && accent.step !== '500' && (
                <Button
                    onClick={() => accentStore.set({ ...accent, step: '500' })}
                    size="md"
                    variant="ghost"
                >
                    Back to 500
                </Button>
            )}
        </div>
    );
};

/** The mini builder: pick a colour, see its ramp and its parts in both modes, measured. */
const MiniBuilder = () => {
    const accent = useAccent();
    const options = useMemo(() => accentTheme(accent), [accent]);
    const css = useMemo(() => createThemeCss({ ...options, name: 'tb-live' }), [options]);
    const light = useMemo(() => measure(options, 'light'), [options]);
    const dark = useMemo(() => measure(options, 'dark'), [options]);

    return (
        <Window bar={<AccentPicker accent={accent} />} bodyClassName="flex flex-col">
            <style>{css}</style>
            <div className="border-neutral-200 border-b bg-neutral-50 p-4">
                <Ramp accent={accent} />
            </div>
            <div className="grid divide-neutral-200 max-sm:divide-y sm:grid-cols-2 sm:divide-x">
                <ModePanel mode="light" rows={light} />
                <ModePanel mode="dark" rows={dark} />
            </div>
            <div className="bg-neutral-50">
                <Verdict accent={accent} dark={dark} light={light} />
            </div>
        </Window>
    );
};

export const ThemeBuilder = () => (
    <Section aria-labelledby="theme-builder-title" id="theme-builder">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
            <Reveal className="flex flex-col items-start gap-5">
                <Pill>Your brand</Pill>
                <h2
                    className="max-w-[512px] text-balance font-medium text-2xl text-neutral-950 leading-[1.15] tracking-[-0.02em] md:text-3xl"
                    id="theme-builder-title"
                >
                    Make it yours with one colour.
                </h2>
                <p className="max-w-[576px] text-base text-neutral-600 leading-[1.6]">
                    The free theme builder turns your accent into an 11-step OKLCH palette in P3,
                    greys to match and chart colours by harmony, with contrast checked in light and
                    dark. Every component and screen above follows it.
                </p>
                <div className="flex flex-col items-start gap-3 pt-3">
                    {/* biome-ignore lint/a11y/useAnchorContent: the button renders its label into the link */}
                    <Button render={<a href="/builder" />} size="lg">
                        Open the theme builder
                        <ArrowRight {...icon} />
                    </Button>
                    <p className="text-neutral-500 text-xs">
                        Free. No account. Projects stay in your browser.
                    </p>
                </div>
            </Reveal>
            <Reveal className="min-w-0" delay={1}>
                <MiniBuilder />
            </Reveal>
        </div>
    </Section>
);
