'use client';

import {
    cn,
    deltaE,
    focusRing,
    hexToOklch,
    luminance,
    type Oklch,
    oklchToHex,
    StatusDot,
    seriesThresholds,
    simulateVision,
    type ThemeOptions,
} from 'continuum';
import { useMemo, useState } from 'react';
import { useShareAccent } from './builder-link';
import { capital, hexOf, readSource } from './colours';
import { appCss } from './export-excerpt';
import {
    Group,
    PasteButton,
    type Swatch,
    SwatchList,
    swatchesOf,
    swatchNames,
    ThemeButton,
    ToolActions,
} from './kit';
import { useMyTheme } from './my-theme';

/*
 * The colour-blindness simulator, the colour tools' one way of working (./kit): your colours as
 * swatches, the actions under them, then the result in its frame: the same colours under each
 * kind of colour vision, side by side, and in plain words which of them become hard to tell apart,
 * and for whom. It starts on the theme's primary and chart colours and follows the theme until a
 * colour is changed.
 *
 * The three dichromacies are simulated with Machado, Oliveira and Fernandes (2009) at full severity
 * (the library's simulateVision); achromatopsia keeps the luminance alone. Two colours are judged
 * by their distance after the simulation (OKLab ΔE × 100, the library's deltaE) against the levels
 * the theme builder holds chart colours to: under 6 they read as one colour, under 8 (15 with full
 * colour vision) they are hard to tell apart. The number stays out of sight, on each line's title.
 */

type Sight = 'normal' | 'protan' | 'deutan' | 'tritan' | 'achromat';

const sights: readonly { id: Sight; label: string; short: string; note: string; name: string }[] = [
    {
        id: 'normal',
        label: 'Normal',
        short: 'Normal',
        note: 'Full colour vision',
        name: 'full colour vision',
    },
    {
        id: 'protan',
        label: 'Protanopia',
        short: 'Protan',
        note: 'No red cones',
        name: 'protanopia',
    },
    {
        id: 'deutan',
        label: 'Deuteranopia',
        short: 'Deutan',
        note: 'No green cones',
        name: 'deuteranopia',
    },
    {
        id: 'tritan',
        label: 'Tritanopia',
        short: 'Tritan',
        note: 'No blue cones',
        name: 'tritanopia',
    },
    {
        id: 'achromat',
        label: 'Achromatopsia',
        short: 'Grey',
        note: 'No colour at all',
        name: 'achromatopsia (or a print in grey)',
    },
];

/** A colour seen without colour: its luminance, as the grey of the same lightness. */
const grey = (color: Oklch): Oklch => ({ l: Math.cbrt(luminance(color)), c: 0, h: 0 });

const seen = (color: Oklch, sight: Sight) =>
    sight === 'normal' ? color : sight === 'achromat' ? grey(color) : simulateVision(color, sight);

const apart = (a: Oklch, b: Oklch, sight: Sight) =>
    sight === 'achromat'
        ? 100 * Math.abs(grey(a).l - grey(b).l)
        : deltaE(a, b, sight === 'normal' ? 'normal' : sight);

type Clash = { pair: string; distance: number };

type Reading = {
    sight: (typeof sights)[number];
    colors: Oklch[];
    /** Pairs that read as one colour, and pairs only just apart. */
    same: Clash[];
    hard: Clash[];
};

const read = (
    palette: readonly Oklch[],
    names: readonly string[],
    sight: (typeof sights)[number],
): Reading => {
    const want = sight.id === 'normal' ? seriesThresholds.normal : seriesThresholds.cvd.target;
    const same: Clash[] = [];
    const hard: Clash[] = [];
    palette.forEach((a, i) => {
        palette.forEach((b, j) => {
            if (j <= i) return;
            const distance = apart(a, b, sight.id);
            const clash = { pair: `${names[i]} and ${names[j]}`, distance };
            if (distance < seriesThresholds.cvd.floor) same.push(clash);
            else if (distance < want) hard.push(clash);
        });
    });
    return { sight, colors: palette.map(color => seen(color, sight.id)), same, hard };
};

/** A few pairs in a breath: the first two, and how many more. */
const pairsSaid = (clashes: readonly Clash[]) => {
    const shown = clashes.slice(0, 2).map(clash => clash.pair);
    const rest = clashes.length - shown.length;
    return `${shown.join(', ')}${rest > 0 ? ` and ${rest} more ${rest === 1 ? 'pair' : 'pairs'}` : ''}`;
};

/** A few names in a breath: a, b and c. */
const listed = (names: readonly string[]) =>
    names.length < 2
        ? (names[0] ?? '')
        : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

type Callout = { key: string; tone: 'error' | 'warning'; text: string; detail: string };

const sentence = (same: readonly Clash[], hard: readonly Clash[], who: string) =>
    same.length > 0 && hard.length > 0
        ? `${capital(pairsSaid(same))} look the same ${who}; ${pairsSaid(hard)} are hard to tell apart.`
        : same.length > 0
          ? `${capital(pairsSaid(same))} look the same ${who}.`
          : `${capital(pairsSaid(hard))} are hard to tell apart ${who}.`;

/**
 * What goes wrong, in as few sentences as say it: a pair that is close for everyone is said once,
 * and kinds of vision that lose the same pairs share a sentence.
 */
const calloutsOf = (readings: readonly Reading[]): Callout[] => {
    const callout = (same: Clash[], hard: Clash[], who: string): Callout => ({
        key: who,
        tone: same.length > 0 ? 'error' : 'warning',
        text: sentence(same, hard, who),
        detail: [...same, ...hard]
            .map(clash => `${clash.pair}: ΔE ${Math.round(clash.distance)}`)
            .join(' · '),
    });
    const everyone = readings.find(reading => reading.sight.id === 'normal');
    const said = new Set([...(everyone?.same ?? []), ...(everyone?.hard ?? [])].map(c => c.pair));
    const groups = new Map<string, { names: string[]; same: Clash[]; hard: Clash[] }>();
    for (const reading of readings) {
        if (reading.sight.id === 'normal') continue;
        const same = reading.same.filter(clash => !said.has(clash.pair));
        const hard = reading.hard.filter(clash => !said.has(clash.pair));
        if (same.length + hard.length === 0) continue;
        const key = JSON.stringify([same.map(c => c.pair), hard.map(c => c.pair)]);
        const group = groups.get(key);
        if (group) group.names.push(reading.sight.name);
        else groups.set(key, { names: [reading.sight.name], same, hard });
    }
    return [
        ...(everyone && said.size > 0
            ? [callout(everyone.same, everyone.hard, 'to everyone, even with full colour vision')]
            : []),
        ...[...groups.values()].map(group =>
            callout(group.same, group.hard, `with ${listed(group.names)}`),
        ),
    ];
};

const MOST = 8;

/**
 * A theme's primary, then the four colours its charts tell series apart by (chart-1 to chart-4 in
 * its app.css; the fifth is a step of the first), without doubles, by their hue names.
 */
const themeColours = (theme: ThemeOptions): Swatch[] => {
    const all = readSource(appCss(theme)).light;
    const picked = [
        ...all.filter(colour => colour.name === 'primary-500'),
        ...all.filter(colour => /^chart-[1-4]$/.test(colour.name)),
    ].map(colour => colour.color);
    const kept: Oklch[] = [];
    for (const color of picked) {
        if (!kept.some(other => deltaE(color, other, 'normal') < 4)) kept.push(color);
    }
    return kept.slice(0, MOST).map(color => ({ hex: hexOf(color) }));
};

/**
 * The simulator's state and its parts, for a page to lay out: your colours, their two ways in, the
 * kinds of vision to show, and the result (the colours as each reader sees them, and in words).
 * VisionTool lays them out in groups; the theme builder's page as a workspace.
 */
export const useVisionParts = (theme?: ThemeOptions) => {
    // The default theme's colours, until the reader's own theme is read in the browser.
    const [own, setOwn] = useState<Swatch[]>(() => themeColours({}));
    const [linkedTheme, setLinkedTheme] = useState<ThemeOptions>({});
    const mine = useMyTheme(theme, setLinkedTheme, true);
    const swatches = useMemo(
        () => (mine.linked ? themeColours(linkedTheme) : own),
        [mine.linked, linkedTheme, own],
    );
    const change = (next: Swatch[]) => {
        mine.unlink();
        setOwn(next);
    };

    const palette = useMemo(
        () => swatches.map(swatch => hexToOklch(swatch.hex) ?? { l: 0.5, c: 0, h: 0 }),
        [swatches],
    );
    const names = useMemo(() => swatchNames(swatches), [swatches]);
    const lower = names.map(name => name.toLowerCase());
    const first = palette[0];
    useShareAccent(first && first.c >= 0.04 ? hexOf(first) : '');
    const readings = sights.map(sight => read(palette, lower, sight));
    const callouts = calloutsOf(readings);
    // The kinds of vision side by side: every one, or full colour vision beside one of them.
    const [focus, setFocus] = useState<Sight | 'all'>('all');
    const columns =
        focus === 'all'
            ? readings
            : readings.filter(
                  reading => reading.sight.id === 'normal' || reading.sight.id === focus,
              );

    return {
        /** Your colours, as wells to change, add to and take from. */
        colours: <SwatchList max={MOST} onChange={change} swatches={swatches} />,
        /** The two ways colours come in from elsewhere. */
        ways: (
            <ToolActions
                note={
                    mine.linked
                        ? 'Your theme’s primary and chart colours.'
                        : `${swatches.length} colours of your own.`
                }
            >
                <PasteButton onPaste={source => change(swatchesOf(source, MOST))} />
                <ThemeButton linked={mine.linked} onUse={mine.use} />
            </ToolActions>
        ),
        /** Which kinds of vision the result shows: all five, or one beside full colour vision. */
        modes: (
            <ul className="flex flex-col gap-0.5">
                {[
                    { id: 'all' as const, label: 'All five, side by side', note: '' },
                    ...sights.filter(sight => sight.id !== 'normal'),
                ].map(option => {
                    const on = focus === option.id;
                    return (
                        <li key={option.id}>
                            <button
                                aria-pressed={on}
                                className={cn(
                                    'flex h-control w-full cursor-pointer items-center justify-between gap-3 rounded-item px-3 text-left text-xs transition-colors duration-150',
                                    focusRing,
                                    on
                                        ? 'bg-selected font-medium text-neutral-950'
                                        : 'text-neutral-600 hover:bg-neutral-950/5 hover:text-neutral-950',
                                )}
                                onClick={() => setFocus(option.id)}
                                type="button"
                            >
                                <span>{option.label}</span>
                                {option.note && (
                                    <span className="font-normal text-neutral-600">
                                        {option.note}
                                    </span>
                                )}
                            </button>
                        </li>
                    );
                })}
            </ul>
        ),
        /** The colours as each reader sees them, and in words who loses which. */
        result: (
            <>
                <div
                    aria-label={`Your ${swatches.length} colours as five kinds of colour vision see them`}
                    className="grid min-w-0 gap-x-1.5 sm:gap-x-3"
                    style={{
                        gridTemplateColumns: `minmax(0, 6.5rem) repeat(${columns.length}, minmax(0, 1fr))`,
                    }}
                    role="img"
                >
                    <span />
                    {columns.map(reading => (
                        <div className="flex min-w-0 flex-col gap-0.5 pb-3" key={reading.sight.id}>
                            <span className="truncate font-medium text-neutral-950 text-xxs sm:text-xs">
                                <span className="max-sm:hidden">{reading.sight.label}</span>
                                <span className="sm:hidden">{reading.sight.short}</span>
                            </span>
                            <span className="truncate text-neutral-600 text-xxs max-sm:hidden">
                                {reading.sight.note}
                            </span>
                        </div>
                    ))}
                    {palette.map((own, row) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: the colours in order, and they repeat
                        <div className="contents" key={row}>
                            <span
                                className="flex h-10 items-center truncate pr-1 text-neutral-600 text-xxs sm:text-xs"
                                data-slot="vision-cell"
                            >
                                {names[row]}
                            </span>
                            {columns.map(reading => (
                                <span
                                    data-slot="vision-cell"
                                    className={cn(
                                        'h-10',
                                        row === 0 && 'rounded-t-item',
                                        row === palette.length - 1 && 'rounded-b-item',
                                    )}
                                    key={reading.sight.id}
                                    style={{
                                        background: oklchToHex(reading.colors[row] ?? own),
                                    }}
                                />
                            ))}
                        </div>
                    ))}
                </div>

                {/* And in words: who loses which colours. */}
                <div className="flex min-w-0 flex-col gap-3 border-neutral-200 border-t pt-5">
                    {callouts.length === 0 ? (
                        <p className="flex items-center gap-2.5 text-neutral-950 text-sm">
                            <StatusDot tone="success" />
                            Everyone can tell these colours apart.
                        </p>
                    ) : (
                        <>
                            <ul className="flex flex-col gap-2.5">
                                {callouts.map(callout => (
                                    <li
                                        className="flex items-baseline gap-2.5 text-neutral-950 text-sm"
                                        key={callout.key}
                                        title={callout.detail}
                                    >
                                        <StatusDot
                                            className="-translate-y-px"
                                            tone={callout.tone}
                                        />
                                        <span className="min-w-0">{callout.text}</span>
                                    </li>
                                ))}
                            </ul>
                            <p className="text-pretty text-neutral-600 text-xs">
                                Make one of each pair lighter or darker: lightness is the one
                                difference every reader sees. Where the colours must stay, put a
                                label beside each.
                            </p>
                        </>
                    )}
                </div>
            </>
        ),
    };
};

/** The simulator on its own: your colours, then what each kind of vision makes of them. */
export const VisionTool = ({
    theme,
}: {
    /** The theme being made on the page; left out, the one the builder keeps in this browser. */
    theme?: ThemeOptions;
}) => {
    const parts = useVisionParts(theme);
    return (
        <div className="flex min-w-0 flex-col gap-6">
            <Group label="Your colours" more={<Group label="Bring colours in">{parts.ways}</Group>}>
                {parts.colours}
            </Group>
            <Group label="As five kinds of colour vision see them">{parts.result}</Group>
        </div>
    );
};
