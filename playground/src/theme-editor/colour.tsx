import {
    Button,
    type ChartHarmony,
    ColorField,
    ColorPicker,
    chartHarmonies,
    cn,
    defaultAccent,
    defaultAccentSeed,
    defaultNeutral,
    defaultThemeOptions,
    type Gamut,
    hexToOklch,
    type Oklch,
    oklchToHex,
    type RampShape,
    type RampStep,
    rampSteps,
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
import { useDeferredValue, useMemo, useState } from 'react';
import { measureSeries } from './checks';
import { Block } from './controls';
import { geometryReset, HarmonyWheel, harmonyChoice, hasGeometry } from './harmony-wheel';
import { RampEditor } from './ramp-editor';

/*
 * The editors of a project's colour: the primary ramp, the greys and the data colours. The data
 * colours are found from the primary; how the colours read for every kind of vision is the
 * preview's check layer, not these.
 */

export type ColourBuilderProps = {
    theme: ThemeOptions;
    set: (patch: Partial<ThemeOptions>) => void;
};

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

/** A palette's colours as one strip of equal cells, so every palette lines up on its first step. */
export const Strip = ({
    colors,
    size = 'md',
}: {
    colors: readonly string[];
    size?: 'sm' | 'md';
}) => (
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

/* ---------- The data colours, read once per theme ---------- */

/** The page's mode and the theme as the data colours follow it: when React has time, as they are searched. */
const useDataTheme = (theme: ThemeOptions) => {
    const { mode } = useTheme();
    return { mode, key: JSON.stringify(useDeferredValue(theme)) };
};

/** Series 1 to 4 as the theme writes them for the page's mode: the tokens' own set with neither an accent nor a harmony. */
export const useWrittenSeries = (theme: ThemeOptions) => {
    const { mode, key } = useDataTheme(theme);
    return useMemo(() => measureSeries(JSON.parse(key) as ThemeOptions, mode).series, [key, mode]);
};

/** What each harmony would write in place of the theme's series, each at its own geometry. */
const useHarmonies = (theme: ThemeOptions) => {
    // Picking a harmony clears the geometry it was worked within, so a drag on the wheel never
    // searches them again; custom keeps the set as it is.
    const { mode, key } = useDataTheme({
        ...theme,
        charts: undefined,
        ...geometryReset(theme),
        chartLead: theme.chartLead,
    });
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

/** The accent by its well and its value, then the ramp it gives, edited on its own strip. */
export const PrimaryEditor = ({ theme, set, gamut }: EditorProps) => {
    const accent = theme.accent ?? defaultAccentSeed;
    const accentStep = theme.accentStep ?? defaultThemeOptions.accentStep;

    // A preset's data colours were picked for its own accent, so a new one lets the harmony find them.
    const setAccent = (hex?: string) => set({ accent: hex, charts: undefined });

    const setStep = (value: RampStep) => {
        const step = value === defaultThemeOptions.accentStep ? undefined : value;
        // The step takes the colour itself, so what was set on it by hand goes.
        const steps = { ...theme.curves?.primary?.steps };
        delete steps[value];
        const shape = theme.curves?.primary && {
            ...theme.curves.primary,
            steps: Object.keys(steps).length ? steps : undefined,
        };
        set({
            curves: withShape(
                theme.curves,
                'primary',
                shape && Object.values(shape).some(item => item !== undefined) ? shape : undefined,
            ),
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

    // The theme's own surface in each mode, which the picker reads the colour against as a fill.
    const greysKey = JSON.stringify([theme.neutral, theme.curves?.neutral, theme.gamut]);
    // biome-ignore lint/correctness/useExhaustiveDependencies: the greys by what shapes them
    const surfaces = useMemo(() => {
        const greys = themeNeutralCurves(theme) ?? asOklch(defaultNeutral);
        return {
            light: oklchToHex(greys[0] ?? { l: 0.98, c: 0, h: 0 }),
            dark: oklchToHex(greys[10] ?? { l: 0.15, c: 0, h: 0 }),
        };
    }, [greysKey]);

    // The colour in one container, the ramp it gives in another.
    return (
        <div className="flex flex-col gap-3">
            <Block>
                {/* The colour's well opens the picker; its value beside it can be typed or pasted. */}
                <div className="flex items-center gap-3">
                    <ColorPicker
                        contrast={surfaces}
                        label="Primary"
                        onChange={setAccent}
                        value={accent}
                    />
                    <ColorField label="Primary" onChange={setAccent} value={accent} />
                </div>
            </Block>
            <Block>
                <RampEditor
                    gamut={gamut}
                    kind="primary"
                    name="Primary"
                    onSeed={setStep}
                    onShape={shape => set({ curves: withShape(theme.curves, 'primary', shape) })}
                    ramp={ramp}
                    reference={reference}
                    seed={rampSteps.indexOf(accentStep)}
                    shape={theme.curves?.primary}
                    swatches={themeAccentRamp(withAccent)}
                />
            </Block>
        </div>
    );
};

/** The greys' own colour with its hue and tint, then the ramp on its strip. */
export const GreysEditor = ({ theme, set, gamut }: EditorProps) => {
    const neutral = theme.neutral ?? defaultThemeOptions.neutral;

    // The baseline greys carry no chroma, so their hue as read back from hex means nothing: give them the greys' own.
    const baseline = asOklch(defaultNeutral).map(color => ({ ...color, c: 0, h: neutral.hue }));
    const ramp = themeNeutralCurves(theme) ?? baseline;
    const reference =
        themeNeutralCurves({ ...theme, curves: withShape(theme.curves, 'neutral', undefined) }) ??
        baseline;
    // The greys as one colour: their 500, which a picked or typed colour gives its hue and chroma to.
    const middle = oklchToHex(ramp[5] ?? { l: 0.55, c: 0, h: 0 });
    const setOwn = (hex?: string) => {
        const own = hex ? hexToOklch(hex) : null;
        if (!own) return;
        // The colour gives the greys its hue and how much of it; how light each step is stays
        // Tailwind's, since that is what every pair of text and surface is measured on.
        const tint = Math.min(0.08, Number(own.c.toFixed(3)));
        setNeutral(tint < 0.001 ? { hue: 0, tint: 0 } : { hue: Math.round(own.h), tint });
    };

    const setNeutral = (next: { hue: number; tint: number }) =>
        set({ neutral: next.hue === 0 && next.tint === 0 ? undefined : next });

    // A grey of one's own with its hue and tint, then the ramp.
    return (
        <div className="flex flex-col gap-3">
            <Block>
                {/* The greys' own colour: its hue and how much of it. Set here and nowhere else. */}
                <div className="flex items-center gap-3">
                    <ColorPicker label="Neutral" onChange={setOwn} value={middle} />
                    <ColorField label="Neutral" onChange={setOwn} value={middle} />
                </div>
            </Block>
            <Block>
                <RampEditor
                    gamut={gamut}
                    kind="grey"
                    name="Neutral"
                    onShape={shape => set({ curves: withShape(theme.curves, 'neutral', shape) })}
                    ramp={ramp}
                    reference={reference}
                    shape={theme.curves?.neutral}
                    swatches={themeNeutralRamp(theme)}
                    tint={{ hue: neutral.hue, tint: neutral.tint, onChange: setNeutral }}
                />
            </Block>
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
        // The harmony picked from its list, then the wheel it is worked within.
        <div className="flex flex-col gap-3">
            <Block>
                {/* The harmony picked from a list, each with the four colours it finds. */}
                <div className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-neutral-600 text-xs">Harmony</span>
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
                                onValueChange={value => value && work(harmonyChoice(theme, value))}
                                value={selected}
                            >
                                <SelectTrigger aria-label="Harmony" className="min-w-0 flex-1">
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
                </div>
            </Block>
            <Block>
                <HarmonyWheel gamut={gamut} set={work} theme={theme} />
            </Block>
        </div>
    );
};
