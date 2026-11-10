import {
    Button,
    type ChartHarmony,
    chartHarmonies,
    cn,
    defaultAccent,
    defaultAccentSeed,
    defaultNeutral,
    defaultThemeOptions,
    type Gamut,
    hexToOklch,
    type Oklch,
    type RampShape,
    type RampStep,
    rampSteps,
    SegmentedControl,
    SegmentedControlItem,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    type ThemeOptions,
    themeAccentCurves,
    themeAccentRamp,
    themeChartSeries,
    themeNeutralCurves,
    themeNeutralRamp,
    toCss,
    useTheme,
} from 'continuum';
import { RotateCcw } from 'lucide-react';
import { type ReactNode, useDeferredValue, useId, useMemo, useState } from 'react';
import { measureSeries } from './checks';
import { AccentPicker } from './color-picker';
import { geometryReset, HarmonyWheel, harmonyChoice, hasGeometry } from './harmony-wheel';
import { HexInput, hueBand, hueKnob, Row, SliderRow, SliderStack } from './parts';
import { RampGraph, withoutSteps } from './ramp-graph';

/*
 * The project's colour as one builder: the three palettes it is made of (the primary ramp, the
 * greys and the data colours) in one list, and under it the editor for the one picked. The data
 * colours are found from the primary, so they live here rather than on a tab of their own; how the
 * colours read for every kind of vision is the preview's check layer, not this page's.
 */

export type ColourBuilderProps = {
    theme: ThemeOptions;
    set: (patch: Partial<ThemeOptions>) => void;
};

type Palette = 'primary' | 'greys' | 'data';

const form = 'grid grid-cols-[88px_minmax(0,1fr)] items-center gap-x-3 gap-y-2';

const asOklch = (ramp: readonly string[]): Oklch[] =>
    ramp.map(value => hexToOklch(value) ?? { l: 0.5, c: 0, h: 0 });

/** The curves with one ramp's shape put in or taken out; undefined once neither ramp is shaped. */
const withShape = (
    curves: ThemeOptions['curves'],
    ramp: 'primary' | 'neutral',
    shape: RampShape | undefined,
): ThemeOptions['curves'] => {
    const next = { ...curves, [ramp]: shape };
    const kept = Object.fromEntries(
        Object.entries(next).filter(([, value]) => value !== undefined),
    );
    return kept.primary || kept.neutral ? kept : undefined;
};

const Eyebrow = ({ children }: { children: ReactNode }) => (
    <p className="font-normal text-neutral-600 text-xs">{children}</p>
);

/** A palette's colours as one strip of equal cells, so every palette lines up on its first step. */
const Strip = ({ colors, size = 'md' }: { colors: readonly string[]; size?: 'sm' | 'md' }) => (
    <span
        aria-hidden
        className={cn(
            'relative flex shrink-0 overflow-hidden',
            // A faint inner edge over the cells, so the palest and the deepest steps keep their outline.
            "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:ring-1 after:ring-neutral-950/10 after:ring-inset after:content-['']",
            size === 'md' ? 'h-5 rounded-chip' : 'h-4 rounded-xs',
        )}
    >
        {colors.map((color, i) => (
            <span
                className={size === 'md' ? 'w-5' : 'w-3'}
                // biome-ignore lint/suspicious/noArrayIndexKey: one cell per step, in order
                key={i}
                style={{ background: color }}
            />
        ))}
    </span>
);

/* ---------- The palettes ---------- */

type PaletteRow = { id: Palette; label: string; colors: readonly string[]; summary: string };

/**
 * The three palettes as one divided list. Picking a row picks what the editor under it edits, so
 * each row is a radio: one in the tab order, the arrows move the choice.
 */
const PaletteList = ({
    rows,
    value,
    onChange,
}: {
    rows: readonly PaletteRow[];
    value: Palette;
    onChange: (value: Palette) => void;
}) => {
    const name = useId();

    return (
        <fieldset
            aria-label="Palette"
            className="flex min-w-0 flex-col divide-y divide-neutral-200 overflow-hidden rounded-card border border-neutral-200"
        >
            {rows.map(row => {
                const selected = row.id === value;
                return (
                    <label
                        className={cn(
                            'relative flex cursor-pointer items-center gap-4 px-4 py-3 text-xs transition-[background-color] duration-150',
                            selected ? 'bg-selected' : 'hover:bg-neutral-950/5',
                            // Inside the list's clipped corners, the ring sits inside the row.
                            'has-focus-visible:outline-2 has-focus-visible:outline-focus has-focus-visible:outline-solid has-focus-visible:-outline-offset-2',
                        )}
                        key={row.id}
                    >
                        <input
                            checked={selected}
                            className="sr-only"
                            name={name}
                            onChange={() => onChange(row.id)}
                            type="radio"
                            value={row.id}
                        />
                        <span className="w-16 shrink-0 font-medium text-neutral-950">
                            {row.label}
                        </span>
                        <Strip colors={row.colors} />
                        <span className="min-w-0 flex-1 truncate text-right text-neutral-600 tabular-nums">
                            {row.summary}
                        </span>
                    </label>
                );
            })}
        </fieldset>
    );
};

/* ---------- The data colours, read once per theme ---------- */

/** The page's mode and the theme as the data colours follow it: when React has time, as they are searched. */
const useDataTheme = (theme: ThemeOptions) => {
    const { mode } = useTheme();
    return { mode, key: JSON.stringify(useDeferredValue(theme)) };
};

/** Series 1 to 4 as the theme writes them for the page's mode: the tokens' own set with neither an accent nor a harmony. */
const useWrittenSeries = (theme: ThemeOptions) => {
    const { mode, key } = useDataTheme(theme);
    return useMemo(() => measureSeries(JSON.parse(key) as ThemeOptions, mode).series, [key, mode]);
};

/** What each harmony would write in place of the theme's series, each at its own geometry. */
const useHarmonies = (theme: ThemeOptions) => {
    // Picking a harmony clears the geometry it was worked within, so a drag on the wheel never
    // searches them again; custom keeps the set as it is.
    const { mode, key } = useDataTheme({ ...theme, charts: undefined, ...geometryReset(theme) });
    return useMemo(() => {
        const loose = JSON.parse(key) as ThemeOptions;
        return chartHarmonies.map(info => ({
            info,
            series:
                info.id === 'custom'
                    ? []
                    : (themeChartSeries({ ...loose, chartHarmony: info.id })?.[mode] ?? []),
        }));
    }, [key, mode]);
};

/* ---------- The editors ---------- */

export type EditorProps = ColourBuilderProps & { gamut: Gamut };

/** The accent, its colour well, hex and step, then the primary ramp's curves. */
export const PrimaryEditor = ({ theme, set, gamut }: EditorProps) => {
    const accent = theme.accent ?? defaultAccentSeed;
    const accentStep = theme.accentStep ?? defaultThemeOptions.accentStep;

    // A preset's data colours were picked for its own accent, so a new one lets the harmony find them.
    const setAccent = (hex?: string) => set({ accent: hex, charts: undefined });

    const setStep = (value: RampStep) => {
        const step = value === defaultThemeOptions.accentStep ? undefined : value;
        set({
            accentStep: step,
            // The default ramp is fixed at its 500: another step needs the seed written out to move it.
            accent: step ? accent : theme.accent === defaultAccentSeed ? undefined : theme.accent,
        });
    };

    // The ramp as drawn, and as Tailwind would draw it without the shape.
    const withAccent = { ...theme, accent };
    const ramp = themeAccentCurves(withAccent) ?? asOklch(defaultAccent);
    const reference =
        themeAccentCurves({
            ...withAccent,
            curves: withShape(theme.curves, 'primary', undefined),
        }) ?? asOklch(defaultAccent);
    // And as the curves alone draw it, under the steps set by hand.
    const curve = theme.curves?.primary?.steps
        ? (themeAccentCurves({
              ...withAccent,
              curves: withShape(theme.curves, 'primary', withoutSteps(theme.curves.primary)),
          }) ?? asOklch(defaultAccent))
        : ramp;

    // Two groups: the accent itself, then its ramp under a hairline and an eyebrow.
    return (
        <div className="flex flex-col gap-6">
            <div className={form}>
                <Row
                    hint="Your colour, and which step of the ramp it is: the other ten are built around it the way Tailwind builds its palette."
                    label="Primary"
                >
                    <AccentPicker
                        gamut={gamut}
                        onChange={setAccent}
                        step={accentStep}
                        value={accent}
                    />
                    <HexInput onChange={setAccent} value={accent} />
                    <Select onValueChange={value => setStep(value as RampStep)} value={accentStep}>
                        <SelectTrigger
                            aria-label="Which step the primary is"
                            className="w-24"
                            size="sm"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end">
                            {rampSteps.map(step => (
                                <SelectItem key={step} value={step}>
                                    {step}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Row>
            </div>
            <RampGraph
                gamut={gamut}
                kind="primary"
                label="Primary ramp"
                curve={curve}
                onShape={shape => set({ curves: withShape(theme.curves, 'primary', shape) })}
                ramp={ramp}
                reference={reference}
                seed={rampSteps.indexOf(accentStep)}
                shape={theme.curves?.primary}
            />
        </div>
    );
};

/** The greys' hue and tint, then their curves, opened on chroma: their lightness is Tailwind's. */
export const GreysEditor = ({ theme, set, gamut }: EditorProps) => {
    const neutral = theme.neutral ?? defaultThemeOptions.neutral;

    // The baseline greys carry no chroma, so their hue as read back from hex means nothing: give them the greys' own.
    const baseline = asOklch(defaultNeutral).map(color => ({ ...color, c: 0, h: neutral.hue }));
    const ramp = themeNeutralCurves(theme) ?? baseline;
    const reference =
        themeNeutralCurves({ ...theme, curves: withShape(theme.curves, 'neutral', undefined) }) ??
        baseline;
    const curve = theme.curves?.neutral?.steps
        ? (themeNeutralCurves({
              ...theme,
              curves: withShape(theme.curves, 'neutral', withoutSteps(theme.curves.neutral)),
          }) ?? baseline)
        : ramp;

    const setNeutral = (next: { hue: number; tint: number }) =>
        set({ neutral: next.hue === 0 && next.tint === 0 ? undefined : next });

    // Two groups: the greys' own hue and tint, then their ramp under a hairline and an eyebrow.
    return (
        <div className="flex flex-col gap-6">
            <SliderStack>
                <SliderRow
                    display={`${Math.round(neutral.hue)}°`}
                    knob={hueKnob(neutral.hue)}
                    label="Hue"
                    max={360}
                    min={0}
                    onValueChange={hue => setNeutral({ ...neutral, hue })}
                    step={1}
                    track={hueBand}
                    value={neutral.hue}
                />
                <SliderRow
                    display={neutral.tint === 0 ? 'None' : neutral.tint.toFixed(3)}
                    label="Tint"
                    max={0.04}
                    min={0}
                    onValueChange={tint => setNeutral({ ...neutral, tint })}
                    step={0.001}
                    value={neutral.tint}
                />
            </SliderStack>
            <RampGraph
                gamut={gamut}
                initialChannel="c"
                kind="grey"
                label="Neutral ramp"
                curve={curve}
                onShape={shape => set({ curves: withShape(theme.curves, 'neutral', shape) })}
                ramp={ramp}
                reference={reference}
                shape={theme.curves?.neutral}
            />
        </div>
    );
};

/** The harmony that finds series 2 to 4 from the primary, and the wheel it is worked within. */
export const DataEditor = ({ theme, set, gamut }: EditorProps) => {
    const written = useWrittenSeries(theme);
    const harmonies = useHarmonies(theme);
    const own = Boolean(theme.charts);
    const selected: ChartHarmony = theme.chartHarmony ?? 'auto';
    // The harmony a set was turned custom from, which Reset goes back to.
    const [origin, setOrigin] = useState<ChartHarmony>('auto');
    const work = (patch: Partial<ThemeOptions>) => {
        if (patch.chartHarmony === 'custom' && selected !== 'custom') setOrigin(selected);
        set(patch);
    };

    return (
        // The harmony as a form row, then the wheel it is worked within across the whole column.
        <div className="flex flex-col gap-6">
            <div className={form}>
                <Row
                    hint="Auto keeps series 2 to 4 furthest apart for every reader; the others follow a harmony. On the wheel, drag a series round for its hue, in or out for its step. Shift turns by 1°; a double-click gives the step back."
                    label="Harmony"
                >
                    {own ? (
                        <>
                            <p className="min-w-0 flex-1 truncate text-neutral-600 text-xs">
                                The theme brings its own chart colours.
                            </p>
                            <Button onClick={() => set({ charts: undefined })} variant="ghost">
                                Use a harmony
                            </Button>
                        </>
                    ) : (
                        <>
                            <Select<ChartHarmony>
                                onValueChange={value => work(harmonyChoice(theme, value))}
                                value={selected}
                            >
                                <SelectTrigger
                                    aria-label="Harmony"
                                    className="min-w-0 flex-1"
                                    size="sm"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {harmonies.map(({ info, series }) => (
                                        <SelectItem key={info.id} value={info.id}>
                                            <span className="inline-flex items-center gap-2.5">
                                                <Strip
                                                    // The harmony in force shows what the theme writes (the
                                                    // tokens' own set while there is no accent); custom
                                                    // starts from it.
                                                    colors={(info.id === selected ||
                                                    info.id === 'custom'
                                                        ? written
                                                        : series
                                                    ).map(color => toCss(color, gamut))}
                                                    size="sm"
                                                />
                                                {info.label}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                disabled={!hasGeometry(theme)}
                                onClick={() => set(geometryReset(theme, origin))}
                                variant="ghost"
                            >
                                <RotateCcw strokeWidth={2} />
                                Reset
                            </Button>
                        </>
                    )}
                </Row>
            </div>
            <HarmonyWheel gamut={gamut} set={work} theme={theme} />
        </div>
    );
};

/* ---------- The builder ---------- */

const editorLabels: Record<Palette, string> = {
    primary: 'Primary',
    greys: 'Neutral',
    data: 'Chart colours',
};

/**
 * The project's colour: the primary ramp, the greys and the data colours as one list, the gamut
 * they are all drawn in, and the editor for the palette picked in the list.
 */
export const ColourBuilder = ({ theme, set }: ColourBuilderProps) => {
    const [palette, setPalette] = useState<Palette>('primary');
    const gamut = theme.gamut ?? defaultThemeOptions.gamut;
    const written = useWrittenSeries(theme);

    const accent = theme.accent ?? defaultAccentSeed;
    const neutral = theme.neutral ?? defaultThemeOptions.neutral;
    const harmony = chartHarmonies.find(info => info.id === (theme.chartHarmony ?? 'auto'));

    const rows: PaletteRow[] = [
        {
            id: 'primary',
            label: 'Primary',
            colors: themeAccentRamp(theme),
            summary: `${accent} · ${theme.accentStep ?? defaultThemeOptions.accentStep}`,
        },
        {
            id: 'greys',
            label: 'Neutral',
            colors: themeNeutralRamp(theme),
            summary:
                neutral.tint === 0
                    ? 'Pure grey'
                    : `Hue ${Math.round(neutral.hue)}° · tint ${neutral.tint.toFixed(3)}`,
        },
        {
            id: 'data',
            label: 'Chart colours',
            colors: written.map(color => toCss(color, gamut)),
            summary: theme.charts ? 'Own colours' : (harmony?.label ?? 'Auto'),
        },
    ];

    const editor = { theme, set, gamut };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
                <PaletteList onChange={setPalette} rows={rows} value={palette} />
                <div className={form}>
                    <Row
                        hint="P3 is the wider gamut Tailwind's palette is drawn in; screens that cannot show it fall back on their own. sRGB keeps every colour to what every screen shows."
                        label="Gamut"
                    >
                        {/* Two short values: the control hugs them rather than spanning the column. */}
                        <SegmentedControl
                            aria-label="Gamut"
                            onValueChange={value =>
                                set({
                                    gamut:
                                        value === defaultThemeOptions.gamut
                                            ? undefined
                                            : (value as Gamut),
                                })
                            }
                            value={gamut}
                        >
                            <SegmentedControlItem value="p3">P3</SegmentedControlItem>
                            <SegmentedControlItem value="srgb">sRGB</SegmentedControlItem>
                        </SegmentedControl>
                    </Row>
                </div>
            </div>

            <section
                aria-label={editorLabels[palette]}
                className="flex flex-col gap-4 border-neutral-200 border-t pt-6"
            >
                <Eyebrow>{editorLabels[palette]}</Eyebrow>
                <div className="flex flex-col gap-6">
                    {palette === 'primary' && <PrimaryEditor {...editor} />}
                    {palette === 'greys' && <GreysEditor {...editor} />}
                    {palette === 'data' && <DataEditor {...editor} />}
                </div>
            </section>
        </div>
    );
};
