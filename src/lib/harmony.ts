import { buildRampFrom, type Gamut, maxChroma, type Oklch, paletteProfile } from './color';
import { seriesThresholds, simulateVision, wcagContrast } from './contrast';

/*
 * A theme's data colours, found from its primary. A harmony names the hues, as turns of the
 * primary's hue on the oklch wheel, where equal turns look equally far apart (on the HSL wheel a
 * turn of blue covers far less than one of green). Each hue is drawn as Tailwind would draw it,
 * as vivid as the primary is, and every series then takes the step of its ramp that tells it
 * best from its neighbours: in the lightness band for the mode, clear of grey, apart under
 * protan and deutan vision and under full colour vision, and against the chart's surface. The
 * order of the hues is searched the same way, so neighbours in a stack differ most. Auto
 * searches the hues as well.
 *
 * A harmony can be worked within: the three with a parameter (analogous, split complementary,
 * tetradic) take a spread; custom takes the hues as given, in their order; and any series' step
 * can be held by hand, in place of the one the search would pick.
 */

export type ChartHarmony =
    | 'auto'
    | 'analogous'
    | 'complementary'
    | 'split'
    | 'triadic'
    | 'tetradic'
    | 'square'
    | 'monochrome'
    | 'custom';

/**
 * A harmony's one parameter, in degrees: each hue that follows it sits at `from + times × spread`;
 * a hue without one (null) keeps the harmony's own turn.
 */
export type ChartSpread = {
    /** What the parameter is: a spread either side, or the width of a rectangle. */
    name: 'spread' | 'width';
    initial: number;
    min: number;
    max: number;
    members: readonly ({ from: number; times: number } | null)[];
};

export type ChartHarmonyInfo = {
    id: ChartHarmony;
    label: string;
    /** The hues of series 2 to 4, as turns of the primary's hue; a repeated hue takes another step. */
    turns: readonly number[] | null;
    description: string;
    /** The parameter the harmony is drawn at, for those that have one. */
    spread?: ChartSpread;
};

export const chartHarmonies: readonly ChartHarmonyInfo[] = [
    {
        id: 'auto',
        label: 'Auto',
        turns: null,
        description:
            'The three hues that stay furthest from the primary and from each other, for every reader.',
    },
    {
        id: 'analogous',
        label: 'Analogous',
        turns: [-30, 30, 60],
        description:
            'Neighbours on the wheel, 30° and 60° on: one mood, told apart mostly by lightness.',
        spread: {
            name: 'spread',
            initial: 30,
            min: 10,
            max: 90,
            members: [
                { from: 0, times: -1 },
                { from: 0, times: 1 },
                { from: 0, times: 2 },
            ],
        },
    },
    {
        id: 'complementary',
        label: 'Complementary',
        turns: [180, 0, 180],
        description: 'The opposite hue, then the primary and its opposite again at other steps.',
    },
    {
        id: 'split',
        label: 'Split complementary',
        turns: [150, 210, 0],
        description: 'The two hues either side of the opposite, then the primary at another step.',
        spread: {
            name: 'spread',
            initial: 30,
            min: 10,
            max: 80,
            members: [{ from: 180, times: -1 }, { from: 180, times: 1 }, null],
        },
    },
    {
        id: 'triadic',
        label: 'Triadic',
        turns: [120, 240, 0],
        description: 'Three hues a third of the wheel apart, then the primary at another step.',
    },
    {
        id: 'tetradic',
        label: 'Tetradic',
        turns: [60, 180, 240],
        description: 'Two opposite pairs 60° apart: a rectangle on the wheel.',
        spread: {
            name: 'width',
            initial: 60,
            min: 15,
            max: 165,
            members: [{ from: 0, times: 1 }, null, { from: 180, times: 1 }],
        },
    },
    {
        id: 'square',
        label: 'Square',
        turns: [90, 180, 270],
        description: 'Four hues a quarter of the wheel apart.',
    },
    {
        id: 'monochrome',
        label: 'Monochrome',
        turns: [0, 0, 0],
        description:
            'The primary in four steps. It reads as an order more than as four series, so label them.',
    },
    {
        id: 'custom',
        label: 'Custom',
        turns: null,
        description: 'Hues placed by hand, each a turn of the primary, in the order given.',
    },
];

const infoOf = (harmony: ChartHarmony) => chartHarmonies.find(item => item.id === harmony);

/**
 * The turns of series 2 to 4 a harmony names, at a spread for the three that take one (clamped to
 * its range); null for auto and custom, whose hues are searched or given.
 */
export const harmonyTurns = (harmony: ChartHarmony, spread?: number): number[] | null => {
    const info = infoOf(harmony);
    if (!info?.turns) return null;
    const range = info.spread;
    if (!range || spread === undefined || !Number.isFinite(spread)) return [...info.turns];
    const value = Math.min(range.max, Math.max(range.min, spread));
    return info.turns.map((turn, i) => {
        const member = range.members[i];
        return member ? member.from + member.times * value : turn;
    });
};

export type ChartSeries = {
    /** Series 1 to 4 for light mode; the first is the primary's 500 unless it was put elsewhere. */
    light: Oklch[];
    /** The same series for dark mode, a step lighter or darker each where the surface asks. */
    dark: Oklch[];
    /** The step series 1 takes in each mode, 0 for 50 … 10 for 950. */
    primaryStep: { light: number; dark: number };
    /** Series 1's hue as a turn of the primary's: 0 while it is the primary itself. */
    leadTurn: number;
    /** The hue of each series after the first, as a turn of series 1's. */
    turns: number[];
    /**
     * Which of the harmony's hues each series after the first is, by its place in the harmony's
     * turns (custom: in the turns given), so a step held by hand stays with its hue as the order
     * is searched.
     */
    members: number[];
    /** The step each series takes in each mode, 0 for 50 … 10 for 950. */
    steps: { light: number[]; dark: number[] };
};

type Mode = 'light' | 'dark';

/** The steps each mode's series may take, and the one a hue reads best at. */
const stepsFor: Record<Mode, { steps: number[]; home: number }> = {
    light: { steps: [3, 4, 5, 6, 7, 8], home: 5 },
    dark: { steps: [2, 3, 4, 5, 6, 7], home: 4 },
};

/** The steps series 2 to 4 may take in each mode, lightest first: 0 for 50 … 10 for 950. */
export const chartSeriesSteps: Record<Mode, readonly number[]> = {
    light: stepsFor.light.steps,
    dark: stepsFor.dark.steps,
};

/**
 * A series' step carried from one mode to the other: the same place in the other mode's band, so a
 * step held at the light band's 600 is the dark band's 500, one lighter, as the band itself is.
 */
export const chartStepIn = (step: number, from: Mode, to: Mode) => {
    const source = stepsFor[from].steps;
    const target = stepsFor[to].steps;
    // The bands are runs of steps, so a place is a distance from the lightest; outside it is clamped.
    const index = Math.min(source.length - 1, Math.max(0, Math.round(step) - (source[0] ?? 0)));
    return target[index] ?? Math.round(step);
};

/** Series 1 put by hand: its hue as a turn of the primary's, and its light-mode step (3 to 8). */
export type ChartLead = { turn?: number; step?: number };

/** The geometry a harmony is worked within: its spread, custom hues, and steps held by hand. */
export type ChartGeometry = {
    /**
     * Series 1, where it is not the primary's own 500: the harmony's hues are turns of its hue, so
     * the set follows it round.
     */
    lead?: ChartLead;
    /** The harmony's one parameter (analogous, split complementary, tetradic), in degrees. */
    spread?: number;
    /** Custom only: series 2 to 4 as turns of the primary's hue, in order. */
    turns?: readonly number[];
    /**
     * The light-mode step (3 to 8) of each of the harmony's hues, in the order of its turns; null
     * leaves one to the search. Dark mode takes the same place in its band. Auto has no hues to hold.
     */
    steps?: readonly (number | null | undefined)[];
};

type Lab = readonly [number, number, number];

const toLab = ({ l, c, h }: Oklch): Lab => {
    const angle = (h * Math.PI) / 180;
    return [l, c * Math.cos(angle), c * Math.sin(angle)];
};

const distance = (a: Lab, b: Lab) => 100 * Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** A colour readied for the search: how it looks to each reader, and how well it stands alone. */
type Option = {
    color: Oklch;
    step: number;
    /** The turn of the hue it was drawn at, so two options of one hue are known as such. */
    turn: number;
    normal: Lab;
    protan: Lab;
    deutan: Lab;
    /** In the mode's lightness band and clear of grey: the two checks a series must pass. */
    fits: boolean;
    /**
     * 0 to 1: how well it holds against the surface, near the hue's best step; one that misses the
     * band or the floor (taken only where nothing else is left) loses by how far it misses.
     */
    alone: number;
};

const ready = (color: Oklch, step: number, turn: number, mode: Mode, surface: Oklch): Option => {
    const [low, high] = seriesThresholds.band[mode];
    // Under 3:1 a mark is still legal beside labels, so contrast is weighed, not required.
    const contrast =
        0.5 + 0.5 * Math.min(1, wcagContrast(color, surface) / seriesThresholds.contrast);
    const home = 1 - 0.02 * Math.abs(step - stepsFor[mode].home);
    const outside = Math.max(low - color.l, color.l - high, 0);
    const near =
        Math.max(0.1, 1 - outside * 6) *
        Math.max(0.3, Math.min(1, color.c / seriesThresholds.chroma));
    return {
        color,
        step,
        turn,
        normal: toLab(color),
        protan: toLab(simulateVision(color, 'protan')),
        deutan: toLab(simulateVision(color, 'deutan')),
        fits: color.l >= low && color.l <= high && color.c >= seriesThresholds.chroma,
        alone: contrast * home * near,
    };
};

/** How well two series are told apart: 1 where both thresholds are met, capped so one easy pair cannot hide a hard one. */
const apart = (a: Option, b: Option) =>
    Math.min(
        distance(a.normal, b.normal) / seriesThresholds.normal,
        Math.min(distance(a.protan, b.protan), distance(a.deutan, b.deutan)) /
            seriesThresholds.cvd.target,
        1.5,
    );

/** A set's score: its weakest neighbours or its weakest colour, with a share of its weakest pair overall. */
const score = (set: readonly Option[]) => {
    let neighbours = Number.POSITIVE_INFINITY;
    let all = Number.POSITIVE_INFINITY;
    let alone = Number.POSITIVE_INFINITY;
    for (let i = 0; i < set.length; i++) {
        const a = set[i] as Option;
        alone = Math.min(alone, a.alone);
        for (let j = i + 1; j < set.length; j++) {
            const value = apart(a, set[j] as Option);
            all = Math.min(all, value);
            if (j === i + 1) neighbours = Math.min(neighbours, value);
        }
    }
    return Math.min(neighbours, alone) + 0.25 * all;
};

/** The same step of the same hue: one colour, which two series can never share. */
const same = (a: Option, b: Option) => a.step === b.step && (a.turn - b.turn) % 360 === 0;

/** The options that pass the band and the chroma floor, or all of them where none does. */
const fitting = (options: readonly Option[]) => {
    const passing = options.filter(option => option.fits);
    return passing.length ? passing : [...options];
};

/**
 * Every combination of one option per slot, no colour twice, scored, the best kept: first from
 * the options that pass the band and the floor, then, if no set of distinct colours is left, from
 * all; and where steps held by hand leave no distinct set at all, with a colour repeated.
 */
const bestOf = (slots: readonly Option[][]): { set: Option[]; score: number } => {
    const strict = search(slots.map(fitting));
    if (strict.set.length) return strict;
    const loose = search(slots);
    return loose.set.length ? loose : search(slots, true);
};

const search = (slots: readonly Option[][], repeat = false) => {
    let best: Option[] = [];
    let bestScore = Number.NEGATIVE_INFINITY;
    const walk = (at: number, picked: Option[]) => {
        if (at === slots.length) {
            const value = score(picked);
            if (value > bestScore) {
                bestScore = value;
                best = [...picked];
            }
            return;
        }
        for (const option of slots[at] ?? []) {
            if (!repeat && picked.some(other => same(other, option))) continue;
            picked.push(option);
            walk(at + 1, picked);
            picked.pop();
        }
    };
    walk(0, []);
    return { set: best, score: bestScore };
};

const permutations = <T>(items: readonly T[]): T[][] =>
    items.length <= 1
        ? [[...items]]
        : items.flatMap((item, i) =>
              permutations([...items.slice(0, i), ...items.slice(i + 1)]).map(rest => [
                  item,
                  ...rest,
              ]),
          );

const cache = new Map<string, ChartSeries>();

/**
 * The ramps a primary's data colours are drawn from, by turn of its hue: the primary's own at 0,
 * and every other hue as Tailwind would draw it, as vivid as the primary is. Each is built once.
 */
export const chartRamps = (primary: readonly Oklch[], gamut: Gamut) => {
    const seed = primary[5] ?? { l: 0.55, c: 0.2, h: 265 };
    const profile = paletteProfile(seed.h);
    // How vivid the primary is against Tailwind's own at its step; the other hues follow it, but
    // never so far that they read as grey.
    const strength = Math.min(
        1.1,
        Math.max(
            0.55,
            seed.c /
                Math.max(1e-6, maxChroma(seed.l, seed.h, gamut)) /
                Math.max(1e-6, profile.share[gamut][5] ?? 0.9),
        ),
    );

    const ramps = new Map<number, readonly Oklch[]>();
    return (turn: number): readonly Oklch[] => {
        const t = ((turn % 360) + 360) % 360;
        const known = ramps.get(t);
        if (known) return known;
        let ramp: readonly Oklch[];
        if (t === 0) ramp = primary;
        else {
            const h = (seed.h + t) % 360;
            const shape = paletteProfile(h);
            const l = shape.l[5] ?? 0.62;
            const c = strength * (shape.share[gamut][5] ?? 0.9) * maxChroma(l, h, gamut);
            ramp = buildRampFrom({ l, c, h }, shape, { step: 5, gamut });
        }
        ramps.set(t, ramp);
        return ramp;
    };
};

/** Custom turns as given, when there are three and all are numbers. */
const givenTurns = (turns: readonly number[] | undefined) =>
    turns?.length === 3 && turns.every(Number.isFinite) ? [...turns] : null;

/** Steps held by hand, one per hue, each within the light band or null. */
const heldSteps = (steps: ChartGeometry['steps']) => {
    const [low = 3, high = 8] = [stepsFor.light.steps[0], stepsFor.light.steps.at(-1)];
    const held = [0, 1, 2].map(i => {
        const step = steps?.[i];
        return typeof step === 'number' && Number.isFinite(step)
            ? Math.min(high, Math.max(low, Math.round(step)))
            : null;
    });
    return held.some(step => step !== null) ? held : null;
};

/**
 * Series 1 to 4 for a theme: the primary ramp (50 to 950, as light mode writes it), a harmony, the
 * gamut and the chart surface in each mode, and the geometry the harmony is worked within, if any.
 */
export const buildChartSeries = (
    primary: readonly Oklch[],
    harmony: ChartHarmony,
    {
        gamut,
        surface,
        spread,
        turns: customTurns,
        steps: customSteps,
        lead: customLead,
    }: { gamut: Gamut; surface: Record<Mode, Oklch> } & ChartGeometry,
): ChartSeries => {
    // Series 1: the primary's own hue and its 500 unless put elsewhere, within the band.
    const leadTurn =
        typeof customLead?.turn === 'number' && Number.isFinite(customLead.turn)
            ? ((Math.round(customLead.turn) % 360) + 360) % 360
            : 0;
    const [bandLow = 3, bandHigh = 8] = [stepsFor.light.steps[0], stepsFor.light.steps.at(-1)];
    const leadStep =
        typeof customLead?.step === 'number' && Number.isFinite(customLead.step)
            ? Math.min(bandHigh, Math.max(bandLow, Math.round(customLead.step)))
            : 5;
    // Custom without its three hues is auto; auto has no hues to hold a step for.
    const given = harmony === 'custom' ? givenTurns(customTurns) : null;
    const kind: ChartHarmony = harmony === 'custom' && !given ? 'auto' : harmony;
    const hues = kind === 'custom' ? given : harmonyTurns(kind, spread);
    const held = kind === 'auto' ? null : heldSteps(customSteps);
    const key = JSON.stringify([
        primary,
        kind,
        gamut,
        surface,
        hues && (spread !== undefined || held || kind === 'custom') ? [hues, held] : null,
        leadTurn,
        leadStep,
    ]);
    const cached = cache.get(key);
    if (cached) {
        // The most recent go last, so a drag through many geometries never pushes out the sets in use.
        cache.delete(key);
        cache.set(key, cached);
        return cached;
    }

    const rampAt = chartRamps(primary, gamut);

    // A turn is of series 1's hue; the ramps are kept by turn of the primary's.
    const optionsAt = (turn: number, mode: Mode, steps = stepsFor[mode].steps) => {
        const ramp = rampAt(leadTurn + turn);
        return steps.flatMap(step => {
            const color = ramp[step];
            return color ? [ready(color, step, turn, mode, surface[mode])] : [];
        });
    };

    // A hue's options in a mode: every step of the band, or the one held for it, carried over.
    const slot = (turn: number, mode: Mode, step: number | null | undefined) =>
        optionsAt(
            turn,
            mode,
            typeof step === 'number' ? [chartStepIn(step, 'light', mode)] : undefined,
        );

    // Series 1 is the colour as given in light mode: the primary's 500, or the step it was put
    // on. It is never moved there by the search; where it misses the band, the checks say so and
    // it can be put on another step. Dark mode has no colour of its own to keep, so its step is
    // found among the four round the 500's place, as it always was, unless the step was put by hand.
    const leadHeld = typeof customLead?.step === 'number' && Number.isFinite(customLead.step);
    const first = (mode: Mode) =>
        optionsAt(
            0,
            mode,
            mode === 'light'
                ? [leadStep]
                : leadHeld
                  ? [chartStepIn(leadStep, 'light', 'dark')]
                  : [3, 4, 5, 6],
        );

    // A set of hues in one order (by their places in the list), at the best steps for each mode;
    // it is as good as its weaker mode.
    const judge = (list: readonly number[], order: readonly number[]) => {
        const turnOf = (member: number) => list[member] ?? 0;
        const slots = (mode: Mode) => [
            first(mode),
            ...order.map(member => slot(turnOf(member), mode, held?.[member])),
        ];
        const light = bestOf(slots('light'));
        const dark = bestOf(slots('dark'));
        return {
            turns: order.map(turnOf),
            members: [...order],
            light: light.set,
            dark: dark.set,
            score: Math.min(light.score, dark.score),
        };
    };
    const bestOrder = (list: readonly number[]) =>
        permutations(list.map((_, i) => i))
            .map(order => judge(list, order))
            .reduce((best, next) => (next.score > best.score ? next : best));

    let chosen: ReturnType<typeof judge>;
    if (kind === 'custom' && hues) {
        // Placed by hand: each hue is the series it was placed as.
        chosen = judge(hues, [0, 1, 2]);
    } else if (hues) {
        chosen = bestOrder(hues);
    } else {
        // Auto: hues every 10°, each at least 30° from the primary and from each other, at the
        // steps that stand well alone. The pairs are scored once, every ordered triple in light
        // mode, and the best few hue sets are judged in both modes in every order.
        const lead = fitting(first('light')).sort((x, y) => y.alone - x.alone)[0];
        const pool = Array.from({ length: 31 }, (_, i) => 30 + i * 10).flatMap(turn =>
            optionsAt(turn, 'light').filter(option => option.fits && option.alone > 0.6),
        );
        const gap = (x: number, y: number) => {
            const d = Math.abs(x - y) % 360;
            return Math.min(d, 360 - d);
        };
        // The best sets so far, by score, each a set of hues (the steps are picked again per mode).
        const top: { hues: number[]; score: number }[] = [];
        const keep = 12;
        const floor = () =>
            top.length < keep ? Number.NEGATIVE_INFINITY : (top.at(-1)?.score ?? 0);
        const offer = (hues: number[], value: number) => {
            const key = [...hues].sort((x, y) => x - y).join();
            const known = top.findIndex(
                entry => [...entry.hues].sort((x, y) => x - y).join() === key,
            );
            if (known >= 0) {
                if ((top[known]?.score ?? 0) >= value) return;
                top.splice(known, 1);
            }
            top.push({ hues, score: value });
            top.sort((x, y) => y.score - x.score);
            if (top.length > keep) top.pop();
        };
        if (lead) {
            const n = pool.length;
            const fromLead = pool.map(option => apart(lead, option));
            const pair = pool.map((x, i) =>
                pool.map((y, j) => (i === j || gap(x.turn, y.turn) < 30 ? -1 : apart(x, y))),
            );
            for (let i = 0; i < n; i++) {
                const li = fromLead[i] ?? 0;
                const alone = Math.min(lead.alone, pool[i]?.alone ?? 0);
                for (let j = 0; j < n; j++) {
                    const ij = pair[i]?.[j] ?? -1;
                    if (ij < 0) continue;
                    // Neither the third hue nor the overall share can lift this pair past the kept sets.
                    if (Math.min(li, ij, alone) + 0.375 <= floor()) continue;
                    const lj = fromLead[j] ?? 0;
                    for (let k = 0; k < n; k++) {
                        const jk = pair[j]?.[k] ?? -1;
                        const ik = pair[i]?.[k] ?? -1;
                        if (jk < 0 || ik < 0) continue;
                        const lk = fromLead[k] ?? 0;
                        const weakest = Math.min(alone, pool[j]?.alone ?? 0, pool[k]?.alone ?? 0);
                        const value =
                            Math.min(li, ij, jk, weakest) + 0.25 * Math.min(li, lj, lk, ij, ik, jk);
                        if (value > floor()) {
                            offer(
                                [pool[i]?.turn ?? 0, pool[j]?.turn ?? 0, pool[k]?.turn ?? 0],
                                value,
                            );
                        }
                    }
                }
            }
        }
        chosen = (top.length ? top : [{ hues: [120, 240, 180], score: 0 }])
            .map(entry => bestOrder(entry.hues))
            .reduce((best, next) => (next.score > best.score ? next : best));
    }

    const { turns, members, light, dark } = chosen;

    const result: ChartSeries = {
        light: light.map(option => option.color),
        dark: dark.map(option => option.color),
        primaryStep: { light: light[0]?.step ?? 5, dark: dark[0]?.step ?? 4 },
        leadTurn,
        turns,
        members,
        steps: {
            light: light.map(option => option.step),
            dark: dark.map(option => option.step),
        },
    };
    if (cache.size >= 64) {
        const oldest = cache.keys().next().value;
        if (oldest !== undefined) cache.delete(oldest);
    }
    cache.set(key, result);
    return result;
};
