'use client';

import {
    Button,
    cn,
    hexToOklch,
    type Oklch,
    oklchToHex,
    SegmentedControl,
    SegmentedControlItem,
    type ThemeMode,
    type ThemeOptions,
    wcagContrast,
} from '@contui/ui';
import { ArrowLeftRight, Check, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useShareAccent } from './builder-link';
import { hexOf, readColour, readSource } from './colours';
import { CssColourInput } from './controls';
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
 * The contrast checker, one job in plain words: is this text readable on this background?
 *
 * Check a pair, the group on show: a text colour and a background colour, the text set on the
 * background at three sizes, the contrast ratio in large type, and whether it passes, said as
 * sentences for body text and large text at WCAG's two levels (AA, the one audits ask for, and the
 * stricter AAA). Where body text fails, the one button moves the text to the nearest shade that
 * passes.
 *
 * Its More options opens two groups under it: your colours, the swatch list every colour tool
 * shares (./kit) with its two ways in (the theme made in the theme builder, or colours pasted), and
 * every pair of them as a grid to read: each colour as text, by row, on each as a background, by
 * column, every square the text on its background with its ratio and its verdict in a word.
 *
 * It starts on the theme made in the theme builder (the default theme until one is made), on a
 * pair of it that fails, so it shows an answer and its fix before anything is touched.
 */

const black: Oklch = { l: 0, c: 0, h: 0 };
const white: Oklch = { l: 1, c: 0, h: 0 };

/** The ratio as WCAG writes it, never rounded up: 4.499 is not 4.5. */
const ratioText = (ratio: number, digits = 2) => {
    const scale = 10 ** digits;
    return (Math.floor(ratio * scale) / scale).toFixed(digits);
};

/** The four verdicts, as sentences: what passes, at which level, and what it needs. */
const verdicts = [
    { what: 'body text', level: 'AA', min: 4.5 },
    { what: 'large text', level: 'AA', min: 3 },
    { what: 'body text', level: 'AAA', min: 7 },
    { what: 'large text', level: 'AAA', min: 4.5 },
] as const;

/**
 * The shade of `moving` nearest it that reaches `min` against `fixed`: the same hue and chroma,
 * made darker or lighter by as little as it takes. Measured as the hex it would be given as.
 */
const nearestShade = (moving: Oklch, fixed: Oklch, min: number): Oklch | null => {
    let best: { by: number; color: Oklch } | null = null;
    for (const way of [-1, 1]) {
        for (let by = 0.005; by <= 1; by += 0.005) {
            const l = moving.l + way * by;
            if (l < 0 || l > 1) break;
            const color = hexToOklch(oklchToHex({ ...moving, l }));
            if (!color || wcagContrast(color, fixed) < min) continue;
            if (!best || by < best.by) best = { by, color };
            break;
        }
    }
    return best?.color ?? null;
};

/** A pair's verdict in one word, for a square of the grid, and the colour it is said in. */
const word = (ratio: number) =>
    ratio >= 4.5
        ? { label: 'Pass', tone: 'text-success-800' }
        : ratio >= 3
          ? { label: 'Large', tone: 'text-warning-800' }
          : { label: 'Fail', tone: 'text-error-800' };

const MOST = 10;

/** The colours a page of a theme is drawn in, by their token names, in one mode. */
const themeRoles = [
    'neutral-50',
    'neutral-100',
    'neutral-500',
    'neutral-600',
    'neutral-950',
    'primary-500',
    'action',
    'on-action',
];

const themeSwatches = (theme: ThemeOptions, mode: ThemeMode): Swatch[] => {
    const source = readSource(appCss(theme));
    const colours = (mode === 'dark' && source.dark) || source.light;
    return themeRoles.flatMap(name => {
        const colour = colours.find(item => item.name === name);
        return colour ? [{ hex: hexOf(colour.color), name }] : [];
    });
};

type Pair = { text: string; background: string };

/**
 * The pair a set opens on: on its lightest colour, the first colour that fails for body text there
 * without being meant for a fill (2:1 and up), so the tool opens on a question worth answering.
 */
const firstPair = (swatches: readonly Swatch[]): Pair => {
    const colors = swatches.map(swatch => hexToOklch(swatch.hex) ?? white);
    const lights = colors.map(color => color.l);
    const back = lights.indexOf(Math.max(...lights));
    const ground = colors[back] ?? white;
    const misses = colors.findIndex((color, i) => {
        const ratio = wcagContrast(color, ground);
        return i !== back && ratio < 4.5 && ratio >= 2;
    });
    const text = misses >= 0 ? misses : back === 0 ? 1 : 0;
    return {
        text: swatches[text]?.hex ?? '#676767',
        background: swatches[back]?.hex ?? '#f8f8f8',
    };
};

const swatchEdge =
    'shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-neutral-950)_10%,transparent)]';

/**
 * The checker's state and its parts, for a page to lay out: the pair's fields, the pair's answer
 * (sample, ratio, verdicts, fix), your colours with their two ways in, and the grid of every pair
 * with its legend. ContrastTool lays them out in groups; the theme builder's page lays them out as
 * a workspace, the inputs beside the answer.
 */
export const useContrastParts = (theme?: ThemeOptions) => {
    const [own, setOwn] = useState<Swatch[]>(() => themeSwatches({}, 'light'));
    const [linkedTheme, setLinkedTheme] = useState<ThemeOptions>({});
    const [mode, setMode] = useState<ThemeMode>('light');
    const [pair, setPair] = useState<Pair>(() => firstPair(themeSwatches({}, 'light')));
    // The pair follows the theme until the reader picks one of their own.
    const [picked, setPicked] = useState(false);
    const mine = useMyTheme(theme, setLinkedTheme, true);

    const swatches = useMemo(
        () => (mine.linked ? themeSwatches(linkedTheme, mode) : own),
        [mine.linked, linkedTheme, mode, own],
    );
    useEffect(() => {
        if (!picked && mine.linked) setPair(firstPair(swatches));
    }, [picked, mine.linked, swatches]);

    const change = (next: Swatch[]) => {
        mine.unlink();
        setOwn(next);
    };
    const choose = (next: Partial<Pair>) => {
        setPicked(true);
        setPair(now => ({ ...now, ...next }));
    };

    const fg = readColour(pair.text) ?? black;
    const bg = readColour(pair.background) ?? white;
    const fgHex = hexOf(fg);
    const bgHex = hexOf(bg);
    const ratio = wcagContrast(fg, bg);
    useShareAccent([fg, bg].find(color => color.c >= 0.04) ? hexOf(fg.c >= bg.c ? fg : bg) : '');
    // The fix aims at the first level body text misses: AA, then AAA.
    const aim =
        ratio < 4.5 ? { level: 'AA', min: 4.5 } : ratio < 7 ? { level: 'AAA', min: 7 } : null;
    const shade = aim && nearestShade(fg, bg, aim.min);

    const colors = swatches.map(swatch => hexToOklch(swatch.hex) ?? white);
    const names = swatchNames(swatches);

    // Each square is the row's text on the column's background, its ratio and verdict in a word.
    const grid = (
        <table
            className="w-full table-fixed border-separate border-spacing-1 text-xxs tabular-nums"
            style={{ minWidth: 88 + colors.length * 60 }}
        >
            <caption className="sr-only">
                Each colour as text, by row, on each colour as a background, by column, with its
                contrast ratio and verdict
            </caption>
            <colgroup>
                <col style={{ width: 88 }} />
            </colgroup>
            <thead>
                <tr>
                    <td />
                    <th
                        className="pb-1 text-left font-medium text-neutral-950 text-xs"
                        colSpan={colors.length}
                        scope="colgroup"
                    >
                        Background →
                    </th>
                </tr>
                <tr>
                    <th
                        className="pr-1 text-right align-bottom font-medium text-neutral-950 text-xs"
                        scope="col"
                    >
                        Text ↓
                    </th>
                    {swatches.map((swatch, c) => (
                        <th
                            className="pb-1 font-normal"
                            // biome-ignore lint/suspicious/noArrayIndexKey: the colours in order
                            key={c}
                            scope="col"
                            title={names[c]}
                        >
                            <span className="flex flex-col items-center gap-1 text-neutral-600">
                                <span
                                    aria-hidden
                                    className={cn('h-2 w-full rounded-[2px]', swatchEdge)}
                                    style={{ background: swatch.hex }}
                                />
                                <span className="max-w-full truncate">{names[c]}</span>
                            </span>
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {colors.map((ink, r) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: the colours in order
                    <tr key={r}>
                        <th className="pr-1 font-normal" scope="row">
                            <span className="flex items-center justify-end gap-1.5 text-neutral-600">
                                <span className="truncate">{names[r]}</span>
                                <span
                                    aria-hidden
                                    className={cn('size-2 shrink-0 rounded-[2px]', swatchEdge)}
                                    style={{ background: swatches[r]?.hex }}
                                />
                            </span>
                        </th>
                        {colors.map((ground, c) => {
                            if (r === c) {
                                return (
                                    // biome-ignore lint/suspicious/noArrayIndexKey: the colours in order
                                    <td className="p-0" key={c}>
                                        <span className="flex h-14 items-center justify-center rounded-[6px] bg-neutral-950/3 text-neutral-600">
                                            same
                                        </span>
                                    </td>
                                );
                            }
                            const cell = wcagContrast(ink, ground);
                            const said = word(cell);
                            return (
                                // biome-ignore lint/suspicious/noArrayIndexKey: the colours in order
                                <td className="p-0" key={c}>
                                    <span
                                        aria-label={`${names[r]} text on ${names[c]}: ${ratioText(cell)} to 1, ${said.label === 'Large' ? 'large text only' : said.label.toLowerCase()}`}
                                        className="flex w-full flex-col gap-1 p-0.5"
                                        role="img"
                                    >
                                        <span
                                            className={cn(
                                                'flex h-8 w-full items-center justify-center rounded-[4px] font-medium text-sm',
                                                swatchEdge,
                                            )}
                                            style={{
                                                background: swatches[c]?.hex,
                                                color: swatches[r]?.hex,
                                            }}
                                        >
                                            Aa
                                        </span>
                                        <span className="flex w-full items-center justify-between gap-1 px-0.5">
                                            <span className="text-neutral-950">
                                                {ratioText(cell, 1)}
                                            </span>
                                            <span className={said.tone}>{said.label}</span>
                                        </span>
                                    </span>
                                </td>
                            );
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
    );

    const legend = (
        <div className="flex flex-col gap-1.5 text-neutral-600 text-xs">
            <p>
                Each square is the row’s text on the column’s background, with its contrast ratio
                and verdict.
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
                <li>
                    <span className="font-medium text-success-800">Pass</span> readable as body text
                    (4.5 : 1 or more)
                </li>
                <li>
                    <span className="font-medium text-warning-800">Large</span> large text only (3 :
                    1 or more)
                </li>
                <li>
                    <span className="font-medium text-error-800">Fail</span> too faint for text
                </li>
            </ul>
        </div>
    );

    return {
        /** The pair: the text and the background, and the swap. */
        fields: (
            <div className="flex flex-wrap items-end gap-x-3 gap-y-4">
                <CssColourInput
                    label="Text colour"
                    onChange={text => choose({ text })}
                    value={pair.text}
                />
                <Button
                    aria-label="Swap the text and the background"
                    onClick={() => choose({ text: pair.background, background: pair.text })}
                    size="icon"
                    variant="ghost"
                >
                    <ArrowLeftRight strokeWidth={2} />
                </Button>
                <CssColourInput
                    label="Background colour"
                    onChange={background => choose({ background })}
                    value={pair.background}
                />
            </div>
        ),
        /** The pair's answer: in use, its ratio, the four verdicts and the one fix. */
        result: (
            <div className="flex min-w-0 flex-col gap-6">
                <div
                    className="flex min-w-0 flex-col gap-3 rounded-card border border-neutral-200 px-6 py-6 sm:px-8"
                    style={{ background: bgHex, color: fgHex }}
                >
                    <p className="font-medium text-2xl leading-tight tracking-[-0.01em]">
                        Large text, 24px
                    </p>
                    <p className="text-base leading-normal">
                        Body text, 16px: the size a paragraph like this one is read at.
                    </p>
                    <p className="text-xs">Small text, 13px: labels, buttons and table cells.</p>
                </div>

                <div className="grid min-w-0 gap-6 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]">
                    <div className="flex min-w-0 flex-col gap-1">
                        <p className="text-neutral-600 text-xs">Contrast ratio</p>
                        <p className="font-medium text-5xl text-neutral-950 tabular-nums leading-none tracking-[-0.02em]">
                            {ratioText(ratio)}
                            <span className="text-3xl text-neutral-600"> : 1</span>
                        </p>
                        <p className="pt-1 text-neutral-600 text-xs">
                            From 1 : 1, no contrast, to 21 : 1, black on white.
                        </p>
                    </div>
                    <ul className="flex min-w-0 flex-col gap-2">
                        {verdicts.map(verdict => {
                            const passes = ratio >= verdict.min;
                            return (
                                <li
                                    className="flex items-start gap-2.5 text-sm"
                                    key={`${verdict.what}-${verdict.level}`}
                                >
                                    <span
                                        aria-hidden
                                        className={cn(
                                            'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full [&_svg]:size-3',
                                            passes
                                                ? 'bg-success-500/20 text-success-800'
                                                : 'bg-error-500/20 text-error-800',
                                        )}
                                    >
                                        {passes ? <Check strokeWidth={3} /> : <X strokeWidth={3} />}
                                    </span>
                                    <span className="min-w-0 text-neutral-950">
                                        {passes ? 'Passes' : 'Fails'} for {verdict.what}
                                        {verdict.level === 'AAA' ? ' at the stricter level' : ''}{' '}
                                        <span className="text-neutral-600">
                                            ({verdict.level}, needs {verdict.min} : 1)
                                        </span>
                                    </span>
                                </li>
                            );
                        })}
                        <li className="pt-1 text-neutral-600 text-xs">
                            AA is the level laws and audits ask for. Large text is 24px, or 19px
                            bold.
                        </li>
                    </ul>
                </div>

                {aim && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                        {shade ? (
                            <>
                                <Button onClick={() => choose({ text: hexOf(shade) })}>
                                    Use nearest passing shade
                                </Button>
                                <p className="flex min-w-0 items-center gap-2 text-neutral-600 text-xs">
                                    <span
                                        aria-hidden
                                        className={cn('size-4 shrink-0 rounded-chip', swatchEdge)}
                                        style={{ background: hexOf(shade) }}
                                    />
                                    <span>
                                        The text becomes{' '}
                                        <span className="font-mono text-neutral-950">
                                            {hexOf(shade)}
                                        </span>
                                        , {ratioText(wcagContrast(shade, bg))} : 1, which passes for
                                        body text ({aim.level}).
                                    </span>
                                </p>
                            </>
                        ) : (
                            <p className="text-neutral-600 text-xs">
                                No shade of this text colour passes on this background. Pick a
                                lighter or a darker background.
                            </p>
                        )}
                    </div>
                )}
            </div>
        ),
        /** Your colours, and their two ways in. */
        colours: (
            <>
                <SwatchList max={MOST} onChange={change} swatches={swatches} />
                <ToolActions
                    note={
                        mine.linked
                            ? 'The colours your theme draws a page in.'
                            : `${swatches.length} colours.`
                    }
                >
                    {mine.linked && (
                        <SegmentedControl
                            aria-label="Your theme in"
                            onValueChange={value => setMode(value as ThemeMode)}
                            value={mode}
                        >
                            <SegmentedControlItem value="light">Light</SegmentedControlItem>
                            <SegmentedControlItem value="dark">Dark</SegmentedControlItem>
                        </SegmentedControl>
                    )}
                    <PasteButton
                        onPaste={source => {
                            const named = source.named
                                ? themeRoles.flatMap(name => {
                                      const colour = source.light.find(item => item.name === name);
                                      return colour ? [{ hex: hexOf(colour.color), name }] : [];
                                  })
                                : [];
                            change(named.length >= 2 ? named : swatchesOf(source, MOST));
                        }}
                    />
                    <ThemeButton
                        linked={mine.linked}
                        onUse={() => {
                            setPicked(false);
                            mine.use();
                        }}
                    />
                </ToolActions>
            </>
        ),
        /** Every pair of your colours, and how to read it. */
        grid: (
            <>
                <div className="-m-1 min-w-0 overflow-x-auto p-1">{grid}</div>
                {legend}
            </>
        ),
    };
};

/** The checker on its own: the pair, and under More options your colours and every pair. */
export const ContrastTool = ({
    theme,
}: {
    /** The theme being made on the page; left out, the one the builder keeps in this browser. */
    theme?: ThemeOptions;
}) => {
    const parts = useContrastParts(theme);
    return (
        <Group
            label="Check a pair"
            more={
                <>
                    <Group label="Your colours">{parts.colours}</Group>
                    <Group label="Every pair of your colours">{parts.grid}</Group>
                </>
            }
        >
            <div className="flex min-w-0 flex-col gap-6">
                {parts.fields}
                {parts.result}
            </div>
        </Group>
    );
};
