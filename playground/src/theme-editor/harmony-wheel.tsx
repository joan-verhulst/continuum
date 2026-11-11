import {
    type ChartHarmony,
    type ChartSeries,
    chartHarmonies,
    chartRamps,
    chartSeriesSteps,
    chartStepIn,
    defaultAccent,
    type Gamut,
    hexToOklch,
    type Oklch,
    rampSteps,
    type SeriesCheck,
    StatusDot,
    type ThemeMode,
    type ThemeOptions,
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    themeAccentCurves,
    themeChartSeries,
    toCss,
    useTheme,
} from 'continuum';
import {
    type KeyboardEvent,
    type PointerEvent,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { checkChartSeries, cut, measureSeries, seriesLevels } from './checks';

/*
 * The data colours' wheel, where a harmony is worked within. The disk is every colour a series
 * can take in the page's mode: a ring per step the mode allows, the lightest outside, each ring
 * every hue as the engine draws it at that step. A series sits at its hue and its step. Round the
 * wheel is hue: the harmonies with a parameter keep their shape (an analogous spread, the split
 * either side of the opposite, the rectangle's width), the rigid ones turn custom, and custom moves
 * each hue freely. In and out is the step, held by hand in place of the search's pick. Series 1
 * starts as the primary's own 500 and can be taken like the others: the harmony's hues are turns
 * of its hue, so they follow it round, and a faint ring stays where the primary is.
 *
 * Light outside, because the disk then reads as the ramp does from the rim in: the eye takes the
 * pale rim as the lightest, and the deep centre as the deepest, in either mode.
 */

type Geometry = Pick<
    ThemeOptions,
    'chartHarmony' | 'chartSpread' | 'chartTurns' | 'chartSteps' | 'chartLead'
>;

/** The geometry a harmony is drawn at by itself: no spread, no hues of its own, no step held. */
const cleared = { chartSpread: undefined, chartTurns: undefined, chartSteps: undefined };

const infoOf = (harmony: ChartHarmony) => chartHarmonies.find(info => info.id === harmony);

/** The harmony the engine draws: custom without its three hues is auto. */
const kindOf = (geometry: Geometry): ChartHarmony => {
    const harmony = geometry.chartHarmony ?? 'auto';
    return harmony === 'custom' && geometry.chartTurns?.length !== 3 ? 'auto' : harmony;
};

/** True when the theme works a harmony within: a spread, hues of its own or a step held. */
export const hasGeometry = (theme: ThemeOptions) =>
    theme.chartSpread !== undefined ||
    theme.chartTurns !== undefined ||
    theme.chartSteps !== undefined ||
    theme.chartLead !== undefined ||
    theme.chartHarmony === 'custom';

/** A turn the short way round, in −180 to 180. */
const signed = (turn: number) => {
    const short = ((((turn % 360) + 540) % 360) - 180) as number;
    return short === -180 ? 180 : short;
};

const wrap = (hue: number) => ((hue % 360) + 360) % 360;

/** 5° steps, or single degrees with Shift. */
const snap = (value: number, fine: boolean) =>
    fine ? Math.round(value) : Math.round(value / 5) * 5;

/** A turn as the wheel says it: +40°, −30°, 180°. */
const formatTurn = (turn: number) => {
    const value = Math.round(signed(turn));
    if (value === 0 || value === 180) return `${value}°`;
    return value > 0 ? `+${value}°` : `−${Math.abs(value)}°`;
};

/** The harmony's parameter in words, for the centre: ±30°, 180° ±30°, 60° wide. */
const spreadPhrase = (harmony: ChartHarmony, spread: number) =>
    harmony === 'analogous'
        ? `±${spread}°`
        : harmony === 'split'
          ? `180° ±${spread}°`
          : `${spread}° wide`;

/** Held steps, or nothing once none is held. */
const tidySteps = (steps: (number | null)[]) =>
    steps.some(step => step !== null) ? steps : undefined;

/* ---------- The series as the wheel holds them ---------- */

type Handle = {
    /** Which of the harmony's hues it is: the key it is held by (custom: its series). */
    member: number;
    /** Its place among series 2 to 4, 0 to 2. */
    series: number;
    /** Its hue as a turn of series 1's. */
    turn: number;
    hue: number;
    /** Its step in the page's mode, 0 for 50 … 10 for 950. */
    step: number;
    /** True when its step is held by hand. */
    held: boolean;
    color: Oklch;
};

type Lead = {
    hue: number;
    /** Its hue as a turn of the primary's: 0 while it is the primary itself. */
    turn: number;
    step: number;
    /** True once it has been put somewhere other than the primary's own 500. */
    moved: boolean;
    color: Oklch;
};

/** The step of a hue whose ramp colour is nearest in lightness, for a set not drawn from ramps. */
const nearestStep = (ramp: readonly Oklch[], color: Oklch, steps: readonly number[]) =>
    steps.reduce((best, step) =>
        Math.abs((ramp[step]?.l ?? 0) - color.l) < Math.abs((ramp[best]?.l ?? 0) - color.l)
            ? step
            : best,
    );

const readSeries = ({
    view,
    series,
    written,
    mode,
    seedHue,
    rampAt,
}: {
    view: ThemeOptions;
    series: ChartSeries | null;
    written: readonly Oklch[];
    mode: ThemeMode;
    seedHue: number;
    rampAt: (turn: number) => readonly Oklch[];
}): { lead: Lead | null; handles: Handle[] } => {
    const steps = chartSeriesSteps[mode];
    if (series) {
        const colors = series[mode];
        const kind = kindOf(view);
        const leadTurn = signed(series.leadTurn);
        const lead = colors[0]
            ? {
                  hue: wrap(seedHue + leadTurn),
                  turn: leadTurn,
                  step: series.primaryStep[mode],
                  moved: view.chartLead !== undefined,
                  color: colors[0],
              }
            : null;
        const handles = [0, 1, 2].flatMap(i => {
            const color = colors[i + 1];
            if (!color) return [];
            const member = series.members[i] ?? i;
            const turn = series.turns[i] ?? 0;
            return [
                {
                    member,
                    series: i,
                    turn,
                    hue: wrap(seedHue + leadTurn + turn),
                    step: series.steps[mode][i + 1] ?? 5,
                    held: kind !== 'auto' && typeof view.chartSteps?.[member] === 'number',
                    color,
                },
            ];
        });
        return { lead, handles };
    }
    // A set the tokens or the theme write themselves: each colour at its own hue and nearest step.
    const first = written[0];
    const lead = first
        ? {
              hue: first.h,
              turn: 0,
              step: nearestStep(rampAt(first.h - seedHue), first, [4, 5, 6, 7]),
              moved: false,
              color: first,
          }
        : null;
    const handles = written.slice(1).map((color, i) => {
        const turn = signed(color.h - seedHue);
        return {
            member: i,
            series: i,
            turn,
            hue: wrap(color.h),
            step: nearestStep(rampAt(turn), color, steps),
            held: false,
            color,
        };
    });
    return { lead, handles };
};

/* ---------- Working within the harmony ---------- */

/** The series as custom hues in their order, their held steps kept with them. */
const toCustom = (geometry: Geometry, handles: readonly Handle[]): Geometry => {
    if (kindOf(geometry) === 'custom') return geometry;
    const ordered = [...handles].sort((a, b) => a.series - b.series);
    return {
        chartHarmony: 'custom',
        chartSpread: undefined,
        chartTurns: ordered.map(handle => signed(Math.round(handle.turn))),
        chartSteps: tidySteps(
            ordered.map(handle =>
                handle.held ? (geometry.chartSteps?.[handle.member] ?? null) : null,
            ),
        ),
    };
};

/** Series 1's place by hand, or nothing once it is back on the primary's own 500. */
const tidyLead = (lead: { turn?: number; step?: number }) => {
    const turn = lead.turn !== undefined && signed(lead.turn) !== 0 ? signed(lead.turn) : undefined;
    const step = lead.step !== undefined && lead.step !== 5 ? lead.step : undefined;
    if (turn === undefined && step === undefined) return undefined;
    return { ...(turn !== undefined && { turn }), ...(step !== undefined && { step }) };
};

/**
 * Series 1 turned to a hue. A harmony's hues are turns of its hue, so they follow it round; hues
 * placed by hand are each their own, so they give the turn back and stay where they were put.
 */
const withLeadHue = (geometry: Geometry, target: number, fine: boolean): Geometry => {
    const before = signed(geometry.chartLead?.turn ?? 0);
    const turn = signed(snap(target, fine));
    return {
        ...geometry,
        chartLead: tidyLead({ ...geometry.chartLead, turn }),
        ...(kindOf(geometry) === 'custom' && {
            chartTurns: geometry.chartTurns?.map(own => signed(own - (turn - before))),
        }),
    };
};

/** Series 1 put on a light-mode step, or back on the 500 with undefined. */
const withLeadStep = (geometry: Geometry, step: number | undefined): Geometry => ({
    ...geometry,
    chartLead: tidyLead({ ...geometry.chartLead, step }),
});

/** Series 1 back on the primary's own 500. */
const withoutLead = (geometry: Geometry): Geometry =>
    withLeadStep(withLeadHue(geometry, 0, true), undefined);

/**
 * A series turned to a hue. A harmony stays the harmony it is: where it has a parameter and the
 * series follows it, the parameter moves; otherwise the whole set turns with the series, by
 * turning series 1, which the harmony is found from. Only hues placed by hand (custom) move alone.
 */
const withHue = (geometry: Geometry, handle: Handle, target: number, fine: boolean): Geometry => {
    const kind = kindOf(geometry);
    if (kind === 'custom') {
        const turns = [...(geometry.chartTurns ?? [])];
        turns[handle.series] = signed(snap(target, fine));
        return { ...geometry, chartTurns: turns };
    }
    const range = infoOf(kind)?.spread;
    const follows = range?.members[handle.member];
    if (range && follows) {
        const spread = Math.min(
            range.max,
            Math.max(range.min, snap(signed(target - follows.from) / follows.times, fine)),
        );
        return { ...geometry, chartSpread: spread === range.initial ? undefined : spread };
    }
    // The series keeps its place in the harmony, so the set turns by as far as it was moved.
    const before = signed(geometry.chartLead?.turn ?? 0);
    return withLeadHue(geometry, before + signed(target - handle.turn), fine);
};

/** A series held at a light-mode step, or given back to the search with null. */
const withStep = (
    geometry: Geometry,
    handles: readonly Handle[],
    handle: Handle,
    step: number | null,
): Geometry => {
    // Auto's hues are a search, so a step is held for hues placed by hand.
    const base = kindOf(geometry) === 'auto' ? toCustom(geometry, handles) : geometry;
    const index = kindOf(base) === 'custom' ? handle.series : handle.member;
    const steps = [0, 1, 2].map(i => base.chartSteps?.[i] ?? null);
    steps[index] = step;
    return { ...base, chartSteps: tidySteps(steps) };
};

/** Which handle a series is, once a geometry is in force: custom holds them by series. */
const keyIn = (geometry: Geometry, handle: Handle) =>
    kindOf(geometry) === 'custom' ? handle.series : handle.member;

/**
 * What picking a harmony in the list writes: its own geometry; custom keeps the hues as they are,
 * so the wheel starts from them.
 */
export const harmonyChoice = (theme: ThemeOptions, harmony: ChartHarmony): Geometry => {
    if (harmony === 'custom') {
        const mode: ThemeMode = 'light';
        const series = themeChartSeries(theme);
        const primary = themeAccentCurves(theme) ?? asOklch(defaultAccent);
        const seedHue = primary[5]?.h ?? 272;
        const written = series ? [] : measureSeries(theme, mode).series;
        const { handles } = readSeries({
            view: theme,
            series,
            written,
            mode,
            seedHue,
            rampAt: chartRamps(primary, theme.gamut ?? 'p3'),
        });
        return toCustom(theme, handles);
    }
    return { chartHarmony: harmony === 'auto' ? undefined : harmony, ...cleared };
};

/** What Reset writes: the harmony's own geometry; custom goes back to where it was turned from. */
export const geometryReset = (theme: ThemeOptions, origin: ChartHarmony = 'auto'): Geometry => {
    const harmony = theme.chartHarmony === 'custom' ? origin : (theme.chartHarmony ?? 'auto');
    return {
        chartHarmony: harmony === 'auto' || harmony === 'custom' ? undefined : harmony,
        ...cleared,
        chartLead: undefined,
    };
};

const asOklch = (ramp: readonly string[]): Oklch[] =>
    ramp.map(value => hexToOklch(value) ?? { l: 0.5, c: 0, h: 0 });

/* ---------- Drawing ---------- */

/** The wheel's box, `size-86`. */
const SIZE = 344;
const CENTRE = SIZE / 2;
/**
 * The disk's rim, and each ring's width, which is also the pitch from one ring to the next: the rings
 * meet, told apart by their step and a seam of the surface at half strength, never a band of it. A
 * ring is wider than a handle, so series at one hue on neighbouring steps (the primary's own hue
 * again, or monochrome's four) each keep a spot of their own.
 */
const RIM = 162;
const RING = 18;
const PITCH = RING;
/** The hole in the middle, inside the deepest ring, where the readout sits. */
const HOLE = RIM - 6 * PITCH;
/** The seam between two rings: the surface at half strength, a hairline that follows the mode. */
const SEAM = 'color-mix(in oklab, var(--color-neutral-50) 50%, transparent)';
/** Where the angle being set is drawn, just outside the rim. */
const ARC = 168.5;
/**
 * A series' handle: a white bead inside its ring, 2px clear of its edges; a little larger in hand.
 * The pointer takes it within half a pitch, so neighbours never share a target.
 */
const BEAD = { rest: { white: 7, color: 5 }, lifted: { white: 8, color: 6 }, hit: PITCH / 2 };

const ringRadius = (index: number) => RIM - index * PITCH - RING / 2;
const ringIndexAt = (radius: number) =>
    Math.min(5, Math.max(0, Math.round((RIM - RING / 2 - radius) / PITCH)));

const at = (value: number) => Number(value.toFixed(2));

/** A hue and a radius as a point: 0° at the top, turning clockwise. */
const point = (hue: number, radius: number) => {
    const angle = (hue * Math.PI) / 180;
    return [CENTRE + radius * Math.sin(angle), CENTRE - radius * Math.cos(angle)] as const;
};

/** An arc along the rim from one hue to another, the short way round. */
const arcPath = (from: number, to: number, radius: number) => {
    const turn = signed(to - from);
    const [x0, y0] = point(from, radius);
    const [x1, y1] = point(from + turn, radius);
    return `M ${at(x0)} ${at(y0)} A ${radius} ${radius} 0 0 ${turn >= 0 ? 1 : 0} ${at(x1)} ${at(y1)}`;
};

const tick = (hue: number) => {
    const [x0, y0] = point(hue, ARC - 3);
    const [x1, y1] = point(hue, ARC + 3);
    return `M ${at(x0)} ${at(y0)} L ${at(x1)} ${at(y1)}`;
};

/* ---------- The status under the wheel ---------- */

const tone = { pass: 'success', warn: 'warning', fail: 'error' } as const;

const SeriesStatus = ({
    checks,
    mode,
    count,
}: {
    checks: SeriesCheck[];
    mode: ThemeMode;
    count: number;
}) => {
    const band = checks.find(check => check.id === 'band');
    const cvd = checks.find(check => check.id === 'cvd');
    const normal = checks.find(check => check.id === 'normal');
    const [low, high] = seriesLevels.band[mode];
    const pair = (check?: SeriesCheck) =>
        check?.series.length === 2
            ? `series ${(check.series[0] ?? 0) + 1} and ${(check.series[1] ?? 0) + 1}`
            : 'neighbours';
    const items = [
        band && {
            id: 'band',
            state: band.state,
            label: 'In band',
            value: `${count - band.series.length}/${count}`,
            about: `${count - band.series.length} of ${count} series sit in the ${mode} band, ${Math.round(low * 100)} to ${Math.round(high * 100)}% lightness, so none sinks into the surface or glares off it.`,
        },
        cvd && {
            id: 'cvd',
            state: cvd.state,
            label: 'Colour-blind',
            value: cut(cvd.value, 1),
            about: `Apart for colour-blind readers: the closest, ${pair(cvd)}, are ${cut(cvd.value, 1)} apart under ${cvd.vision} vision. ${seriesLevels.cvd.target} is wanted; ${seriesLevels.cvd.floor} holds only with labels beside the colours.`,
        },
        normal && {
            id: 'normal',
            state: normal.state,
            label: 'Full vision',
            value: cut(normal.value, 1),
            about: `Apart with full colour vision: the closest, ${pair(normal)}, are ${cut(normal.value, 1)} apart. ${seriesLevels.normal} is wanted.`,
        },
    ].filter(item => Boolean(item)) as {
        id: string;
        state: SeriesCheck['state'];
        label: string;
        value: string;
        about: string;
    }[];

    return (
        <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
            {items.map(item => (
                <Tooltip key={item.id}>
                    <TooltipTrigger
                        render={
                            <span className="inline-flex cursor-default items-center gap-1.5" />
                        }
                    >
                        <StatusDot size="sm" tone={tone[item.state]} />
                        <span className="text-neutral-600">{item.label}</span>
                        <span className="font-medium text-neutral-950 tabular-nums">
                            {item.value}
                        </span>
                        <span className="sr-only">. {item.about}</span>
                    </TooltipTrigger>
                    <TooltipContent>{item.about}</TooltipContent>
                </Tooltip>
            ))}
        </p>
    );
};

/* ---------- The wheel ---------- */

type Drag = {
    pointer: number;
    /** The geometry, the series and the series dragged as they were when the drag began. */
    geometry: Geometry;
    handles: Handle[];
    /** The series dragged; null for series 1, which is held apart from the three after it. */
    handle: Handle | null;
    /** Where the pointer took the handle, so it keeps its place under the pointer. */
    offset: { angle: number; radius: number };
    from: { angle: number; radius: number };
    /** Each way engages once the pointer has clearly moved that way, so a drag in or out keeps its hue. */
    hue: boolean;
    step: boolean;
    /** Taken once the pointer moves, so a press that stays put is still a click on its handle. */
    captured: boolean;
};

export type HarmonyWheelProps = {
    theme: ThemeOptions;
    set: (patch: Partial<ThemeOptions>) => void;
    gamut: Gamut;
};

/**
 * The hue and step of each data colour on one disk, each to drag, and under it how the set
 * reads, as it moves.
 */
export const HarmonyWheel = ({ theme, set, gamut }: HarmonyWheelProps) => {
    const { mode } = useTheme();
    const svg = useRef<SVGSVGElement>(null);
    const drag = useRef<Drag | null>(null);
    const [draft, setDraft] = useState<Geometry | null>(null);
    const [dragging, setDragging] = useState<number | null>(null);
    const [hovered, setHovered] = useState<number | null>(null);
    const [focused, setFocused] = useState<number | null>(null);
    const refocus = useRef<number | null>(null);

    // The wheel follows the pointer at once; the theme behind the page (the preview, the palette
    // list, the export) follows it every other frame or so, which leaves the wheel its frames.
    const frame = useRef(0);
    const last = useRef(0);
    const pending = useRef<Geometry | null>(null);
    const setLatest = useRef(set);
    setLatest.current = set;
    const flush = () => {
        cancelAnimationFrame(frame.current);
        frame.current = 0;
        const next = pending.current;
        pending.current = null;
        last.current = performance.now();
        if (next) setLatest.current(next);
    };
    const onFrame = (now: number) => {
        frame.current = now - last.current < 32 ? requestAnimationFrame(onFrame) : 0;
        if (!frame.current) flush();
    };
    const schedule = (next: Geometry) => {
        pending.current = next;
        setDraft(next);
        if (!frame.current) frame.current = requestAnimationFrame(onFrame);
    };
    // biome-ignore lint/correctness/useExhaustiveDependencies: flushes what is left on unmount only
    useEffect(() => () => flush(), []);

    const own = Boolean(theme.charts);
    const view: ThemeOptions = draft ? { ...theme, ...draft } : theme;

    // The ramps every hue is drawn from, and the disk they make in this mode.
    const rampKey = JSON.stringify({
        accent: theme.accent,
        accentStep: theme.accentStep,
        curves: theme.curves?.primary ? { primary: theme.curves.primary } : undefined,
        gamut,
    });
    const { rampAt, seedHue } = useMemo(() => {
        const options = JSON.parse(rampKey) as ThemeOptions;
        const primary = themeAccentCurves(options) ?? asOklch(defaultAccent);
        return {
            rampAt: chartRamps(primary, options.gamut ?? 'p3'),
            seedHue: primary[5]?.h ?? 272,
        };
    }, [rampKey]);
    const rings = useMemo(
        () =>
            chartSeriesSteps[mode].map((step, index) => {
                const stops = Array.from({ length: 37 }, (_, i) => {
                    const color = rampAt(i * 10 - seedHue)[step];
                    return `${color ? toCss(color, gamut) : 'transparent'} ${i * 10}deg`;
                });
                const radius = RIM - index * PITCH;
                return {
                    step,
                    radius,
                    background: `conic-gradient(in oklab, ${stops.join(', ')})`,
                };
            }),
        [rampAt, seedHue, mode, gamut],
    );

    // The colours as written and the surface they are read on, which the geometry never moves.
    const fixedKey = JSON.stringify({ ...theme, ...cleared });
    const measured = useMemo(
        () => measureSeries(JSON.parse(fixedKey) as ThemeOptions, mode),
        [fixedKey, mode],
    );

    const series = themeChartSeries(view);
    const { lead, handles } = readSeries({
        view,
        series,
        written: measured.series,
        mode,
        seedHue,
        rampAt,
    });
    const colors = series ? series[mode] : measured.series;
    const checks = checkChartSeries(colors, { mode, surface: measured.surface });

    const kind = kindOf(view);
    const range = infoOf(kind)?.spread;
    const spread = view.chartSpread ?? range?.initial ?? 0;
    const steps = chartSeriesSteps[mode];

    const keyOf = (handle: Handle) => keyIn(view, handle);
    const active = dragging ?? hovered ?? focused;
    const activeHandle = handles.find(handle => keyOf(handle) === active) ?? null;

    // A key press can turn a harmony custom, which keys the series anew: focus follows the series.
    useLayoutEffect(() => {
        const key = refocus.current;
        if (key === null) return;
        refocus.current = null;
        const node = svg.current?.querySelector<SVGGElement>(`[data-handle="${key}"]`);
        if (node && document.activeElement !== node) node.focus({ preventScroll: true });
    });

    const polar = (event: PointerEvent) => {
        const box = svg.current?.getBoundingClientRect();
        if (!box) return { angle: 0, radius: 0 };
        const x = ((event.clientX - box.left) / box.width) * SIZE - CENTRE;
        const y = ((event.clientY - box.top) / box.height) * SIZE - CENTRE;
        return { angle: wrap((Math.atan2(x, -y) * 180) / Math.PI), radius: Math.hypot(x, y) };
    };

    const geometryOf = (options: ThemeOptions): Geometry => ({
        chartHarmony: options.chartHarmony,
        chartSpread: options.chartSpread,
        chartTurns: options.chartTurns,
        chartSteps: options.chartSteps,
        chartLead: options.chartLead,
    });

    const lightStep = (step: number) => chartStepIn(step, mode, 'light');

    const begin = (event: PointerEvent<SVGGElement>, handle: Handle) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.currentTarget.focus({ preventScroll: true });
        const pointer = polar(event);
        drag.current = {
            pointer: event.pointerId,
            geometry: geometryOf(view),
            handles,
            handle,
            offset: {
                angle: signed(handle.hue - pointer.angle),
                radius: ringRadius(Math.max(0, steps.indexOf(handle.step))) - pointer.radius,
            },
            from: pointer,
            hue: false,
            step: false,
            captured: false,
        };
        setDragging(keyOf(handle));
    };

    /** Series 1 taken: it is dragged as the others are, round for its hue, in or out for its step. */
    const beginLead = (event: PointerEvent<SVGGElement>) => {
        if (event.button !== 0 || !lead) return;
        event.preventDefault();
        event.currentTarget.focus({ preventScroll: true });
        const pointer = polar(event);
        drag.current = {
            pointer: event.pointerId,
            geometry: geometryOf(view),
            handles,
            handle: null,
            offset: {
                angle: signed(lead.hue - pointer.angle),
                radius: ringRadius(Math.max(0, steps.indexOf(lead.step))) - pointer.radius,
            },
            from: pointer,
            hue: false,
            step: false,
            captured: false,
        };
        setDragging(-1);
    };

    const move = (event: PointerEvent<SVGSVGElement>) => {
        const current = drag.current;
        if (!current || current.pointer !== event.pointerId) return;
        if (!current.captured) {
            current.captured = true;
            svg.current?.setPointerCapture(event.pointerId);
        }
        const pointer = polar(event);
        const along =
            (Math.abs(signed(pointer.angle - current.from.angle)) * Math.PI * pointer.radius) / 180;
        if (along > 4) current.hue = true;
        if (Math.abs(pointer.radius - current.from.radius) > PITCH * 0.6) current.step = true;
        if (!current.hue && !current.step) return;

        const { handle, handles: before } = current;
        let next = current.geometry;
        if (!handle) {
            if (current.hue) {
                const target = wrap(pointer.angle + current.offset.angle) - seedHue;
                next = withLeadHue(next, target, event.shiftKey);
            }
            if (current.step) {
                const step = steps[ringIndexAt(pointer.radius + current.offset.radius)];
                if (step !== undefined) next = withLeadStep(next, lightStep(step));
            }
            schedule(next);
            return;
        }
        if (current.hue) {
            // A series' hue is a turn of series 1's, wherever that has been put.
            const from = seedHue + signed(current.geometry.chartLead?.turn ?? 0);
            const target = wrap(pointer.angle + current.offset.angle) - from;
            next = withHue(next, handle, target, event.shiftKey);
        }
        if (current.step) {
            const ring = ringIndexAt(pointer.radius + current.offset.radius);
            const start = steps.indexOf(handle.step);
            const step = steps[ring];
            // Back on the ring it started on, a step the search picked stays the search's.
            if (step !== undefined && (ring !== start || handle.held)) {
                next = withStep(next, before, handle, lightStep(step));
            }
        }
        // Turning custom keys the series anew: the pointer is still on this one, so hover follows it.
        setDragging(keyIn(next, handle));
        setHovered(keyIn(next, handle));
        schedule(next);
    };

    const end = (event: PointerEvent<SVGSVGElement>) => {
        const current = drag.current;
        if (!current || current.pointer !== event.pointerId) return;
        drag.current = null;
        if (svg.current?.hasPointerCapture(event.pointerId)) {
            svg.current.releasePointerCapture(event.pointerId);
        }
        flush();
        setDraft(null);
        setDragging(null);
    };

    /** A change made at once, from a key or a double-click, with focus kept on its series. */
    const apply = (next: Geometry, handle: Handle) => {
        refocus.current = keyIn(next, handle);
        set(next);
    };

    const onKey = (event: KeyboardEvent<SVGGElement>, handle: Handle) => {
        const geometry = geometryOf(view);
        const amount = event.shiftKey ? 1 : 5;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            const way = event.key === 'ArrowRight' ? 1 : -1;
            const follows = kind === 'custom' ? null : range?.members[handle.member];
            // A series that follows the parameter moves it a step; its own hue moves by the same.
            const target = follows
                ? follows.from + follows.times * (spread + way * amount * Math.sign(follows.times))
                : handle.turn + way * amount;
            apply(withHue(geometry, handle, target, event.shiftKey), handle);
        } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            // Up is out, towards the lighter rim.
            const index = Math.max(0, steps.indexOf(handle.step));
            const step =
                steps[Math.min(5, Math.max(0, index + (event.key === 'ArrowUp' ? -1 : 1)))];
            if (step === undefined) return;
            apply(withStep(geometry, handles, handle, lightStep(step)), handle);
        } else if (event.key === 'Backspace' || event.key === 'Delete') {
            if (!handle.held) return;
            apply(withStep(geometry, handles, handle, null), handle);
        } else return;
        event.preventDefault();
    };

    const onLeadKey = (event: KeyboardEvent<SVGGElement>) => {
        if (!lead) return;
        const geometry = geometryOf(view);
        let next: Geometry;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            const way = event.key === 'ArrowRight' ? 1 : -1;
            next = withLeadHue(geometry, lead.turn + way * (event.shiftKey ? 1 : 5), true);
        } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            // Up is out, towards the lighter rim.
            const index = Math.max(0, steps.indexOf(lead.step));
            const step =
                steps[Math.min(5, Math.max(0, index + (event.key === 'ArrowUp' ? -1 : 1)))];
            if (step === undefined) return;
            next = withLeadStep(geometry, lightStep(step));
        } else if (event.key === 'Backspace' || event.key === 'Delete') {
            if (!lead.moved) return;
            next = withoutLead(geometry);
        } else return;
        event.preventDefault();
        refocus.current = -1;
        set(next);
    };

    const stepName = (step: number) => rampSteps[step] ?? '';

    const describe = (handle: Handle) =>
        `Series ${handle.series + 2}, ${formatTurn(handle.turn)}, step ${stepName(handle.step)}, ${
            handle.held ? 'held' : 'picked by the search'
        }`;

    // The centre: the series in hand, or the harmony's parameter.
    const readout = (() => {
        if (activeHandle) {
            const follows = kind === 'custom' ? null : range?.members[activeHandle.member];
            return {
                value: follows ? spreadPhrase(kind, spread) : formatTurn(activeHandle.turn),
                caption: `Series ${activeHandle.series + 2} · ${stepName(activeHandle.step)}`,
            };
        }
        if (active === -1 && lead) {
            return {
                value: lead.turn === 0 ? `${Math.round(lead.hue)}°` : formatTurn(lead.turn),
                caption: `${lead.turn === 0 ? 'Primary' : 'Series 1'} · ${stepName(lead.step)}`,
            };
        }
        if (range && !own && series) {
            return {
                value: spreadPhrase(kind, spread),
                caption: range.name === 'width' ? 'Rectangle' : 'Spread',
            };
        }
        return null;
    })();

    // The angle being set, along the rim: series 1's from the primary, the others' from series 1
    // (or from its opposite for split's pair).
    const angle = (() => {
        if (own) return null;
        if (active === -1 && lead && lead.turn !== 0) return { from: wrap(seedHue), to: lead.hue };
        if (!activeHandle) return null;
        const follows = kind === 'custom' ? null : range?.members[activeHandle.member];
        const from = wrap(seedHue + (lead?.turn ?? 0) + (follows?.from ?? 0));
        return { from, to: activeHandle.hue };
    })();

    const placed = (hue: number, step: number) => {
        const [x, y] = point(hue, ringRadius(Math.max(0, steps.indexOf(step))));
        return { x: at(x), y: at(y) };
    };

    const leadAt = lead ? placed(lead.hue, lead.step) : null;
    // Where the primary itself is, shown once series 1 has been put somewhere else.
    const homeAt =
        lead?.moved && !own ? placed(wrap(seedHue), chartStepIn(5, 'light', mode)) : null;
    const leadBead = dragging === -1 || hovered === -1 ? BEAD.lifted : BEAD.rest;
    const turnsText = handles.map(handle => formatTurn(handle.turn)).join(', ');

    return (
        // The wheel is the step's centrepiece: centred in the column, its reading centred under it.
        <div className="flex flex-col items-center gap-3">
            <fieldset
                aria-label={`Chart colours on the oklch wheel, the lightest steps outside. Series 2 to 4 at ${turnsText} from series 1.`}
                className="relative size-86 min-w-0 shrink-0 select-none"
            >
                {/*
                 * The rings as discs, each deeper one laid over the last, so no edge lets the
                 * surface through by accident; the hole is cut once, from the whole stack, and the
                 * seam is drawn on purpose: a pixel of the surface at part strength round each disc.
                 */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                        mask: `radial-gradient(closest-side, transparent ${HOLE - 0.25}px, #000 ${HOLE + 0.25}px)`,
                    }}
                >
                    {rings.map((ring, index) => (
                        <div
                            className="absolute rounded-full"
                            key={ring.step}
                            style={{
                                left: CENTRE - ring.radius,
                                top: CENTRE - ring.radius,
                                width: ring.radius * 2,
                                height: ring.radius * 2,
                                background: ring.background,
                                boxShadow: index > 0 ? `0 0 0 1px ${SEAM}` : undefined,
                            }}
                        />
                    ))}
                </div>

                {readout && (
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5"
                    >
                        <span className="font-medium text-neutral-950 text-xs tabular-nums">
                            {readout.value}
                        </span>
                        <span className="text-neutral-600 text-xxs tabular-nums">
                            {readout.caption}
                        </span>
                    </div>
                )}

                <svg
                    aria-label="Series 1 to 4: left and right turn the hue, up and down the step"
                    className="absolute inset-0 size-full touch-none overflow-visible"
                    onPointerCancel={end}
                    onPointerMove={move}
                    onPointerUp={end}
                    ref={svg}
                    viewBox={`0 0 ${SIZE} ${SIZE}`}
                >
                    {angle && (
                        <g className="pointer-events-none" fill="none" strokeLinecap="round">
                            <path
                                d={arcPath(angle.from, angle.to, ARC)}
                                stroke="var(--color-neutral-950)"
                                strokeWidth={1}
                            />
                            <path d={tick(angle.from)} stroke="var(--color-neutral-400)" />
                            <path d={tick(angle.to)} stroke="var(--color-neutral-950)" />
                        </g>
                    )}

                    {homeAt && (
                        // The primary's own place, hollow: where series 1 goes back to.
                        <g
                            className="pointer-events-none"
                            transform={`translate(${homeAt.x} ${homeAt.y})`}
                        >
                            <circle
                                fill="none"
                                r={BEAD.rest.white - 1}
                                stroke="var(--color-neutral-950)"
                                strokeDasharray="2 2"
                                strokeOpacity={0.6}
                                strokeWidth={1}
                            />
                        </g>
                    )}

                    {leadAt && lead && (
                        // Series 1: the primary's own colour until it is taken. Ringed rather than
                        // a plain bead, as the ramp marks the theme's own colour, so it is told
                        // from the three found from it.
                        <g
                            aria-label="Series 1"
                            aria-valuemax={180}
                            aria-valuemin={-180}
                            aria-valuenow={Math.round(lead.turn)}
                            aria-valuetext={`Series 1, ${lead.turn === 0 ? 'the primary' : `${formatTurn(lead.turn)} from the primary`}, step ${stepName(lead.step)}`}
                            className={`group outline-none ${
                                own ? '' : dragging === -1 ? 'cursor-grabbing' : 'cursor-grab'
                            } ${
                                dragging === null
                                    ? 'transition-transform duration-200 ease-out motion-reduce:transition-none'
                                    : ''
                            }`}
                            data-handle={-1}
                            onBlur={() => setFocused(null)}
                            onDoubleClick={() => {
                                if (own || !lead.moved) return;
                                refocus.current = -1;
                                set(withoutLead(geometryOf(view)));
                            }}
                            onFocus={() => setFocused(-1)}
                            onKeyDown={own ? undefined : onLeadKey}
                            onPointerDown={own ? undefined : beginLead}
                            onPointerEnter={() => setHovered(-1)}
                            onPointerLeave={() => setHovered(null)}
                            role="slider"
                            style={{ transform: `translate(${leadAt.x}px, ${leadAt.y}px)` }}
                            tabIndex={own ? undefined : 0}
                        >
                            <title>
                                {`Series 1${lead.moved ? ' (double-click to put it back on the primary)' : ', the primary'}`}
                            </title>
                            <circle fill="transparent" r={BEAD.hit} />
                            <circle
                                className="opacity-0 group-focus-visible:opacity-100"
                                fill="none"
                                r={leadBead.white + 3}
                                stroke="var(--color-focus)"
                                strokeWidth={2}
                            />
                            <circle fill="var(--color-neutral-950)" r={leadBead.white + 0.5} />
                            <circle fill="var(--color-neutral-50)" r={leadBead.white - 1} />
                            <circle fill={toCss(lead.color, gamut)} r={leadBead.color - 1} />
                        </g>
                    )}

                    {handles.map(handle => {
                        const key = keyOf(handle);
                        const { x, y } = placed(handle.hue, handle.step);
                        const bead = key === dragging || key === hovered ? BEAD.lifted : BEAD.rest;
                        return (
                            <g
                                aria-label={`Series ${handle.series + 2}`}
                                aria-valuemax={180}
                                aria-valuemin={-180}
                                aria-valuenow={Math.round(signed(handle.turn))}
                                aria-valuetext={describe(handle)}
                                className={`group outline-none ${
                                    own ? '' : key === dragging ? 'cursor-grabbing' : 'cursor-grab'
                                } ${
                                    dragging === null
                                        ? 'transition-transform duration-200 ease-out motion-reduce:transition-none'
                                        : ''
                                }`}
                                data-handle={key}
                                key={key}
                                onBlur={() => setFocused(null)}
                                onDoubleClick={() =>
                                    !own &&
                                    handle.held &&
                                    apply(withStep(geometryOf(view), handles, handle, null), handle)
                                }
                                onFocus={() => setFocused(key)}
                                onKeyDown={own ? undefined : event => onKey(event, handle)}
                                onPointerDown={own ? undefined : event => begin(event, handle)}
                                onPointerEnter={() => setHovered(key)}
                                onPointerLeave={() => setHovered(null)}
                                role="slider"
                                style={{ transform: `translate(${x}px, ${y}px)` }}
                                tabIndex={own ? undefined : 0}
                            >
                                <circle fill="transparent" r={BEAD.hit} />
                                <circle
                                    className="opacity-0 group-focus-visible:opacity-100"
                                    fill="none"
                                    r={bead.white + 2}
                                    stroke="var(--color-focus)"
                                    strokeWidth={2}
                                />
                                <circle fill="#fff" r={bead.white} />
                                <circle fill={toCss(handle.color, gamut)} r={bead.color} />
                                {/* A faint edge, so a bead keeps its outline on the palest ring. */}
                                <circle
                                    fill="none"
                                    r={bead.white}
                                    stroke="rgb(0 0 0 / 0.2)"
                                    strokeWidth={1}
                                />
                                {handle.held && <circle fill="#fff" r={1.5} />}
                            </g>
                        );
                    })}
                </svg>
            </fieldset>

            <SeriesStatus checks={checks} count={colors.length} mode={mode} />
        </div>
    );
};
