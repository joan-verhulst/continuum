import {
    apcaContrast,
    Button,
    cn,
    focusRing,
    formatOklch,
    type Oklch,
    Popover,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Separator,
    type SeriesCheck,
    type SeriesCheckId,
    StatusDot,
    type StatusDotTone,
    type ThemeMode,
    type ThemeOptions,
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    wcagContrast,
} from 'continuum';
import { Check, Grid3x3, X } from 'lucide-react';
import {
    createContext,
    type ReactNode,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    type Balance,
    balanceCurves,
    type CurveKey,
    type CurveRamp,
    cut,
    type GridRamp,
    gridRamps,
    lcValue,
    measurePairs,
    measureSeries,
    type PairResult,
    pairName,
    pairNeeds,
    rampColors,
    requiredMisses,
    seriesLevels,
    stepLabels,
    type Verdict,
    verdict,
    wcagLevel,
} from './checks';

/*
 * The check layer: how the theme reads, shown on the preview itself rather than in a report. While
 * it is on, a small mark sits on each element a measured pair paints (the ratio, green when it
 * passes, red when it misses, amber when the miss is advice) and the header counts the misses. The
 * count opens the list, with the other mode's count and an action that balances the two: it finds
 * the curves that pass in both and shows what it would set before it sets it. A second popover lays
 * one ramp's steps on another's, light over dark, and rings a pair that reads in one mode only. A
 * filter shows the preview as colour-blind readers see it. WCAG 2.2 marks; APCA is given in the
 * tooltips, as advice.
 */

const icon = { strokeWidth: 2 } as const;

/* ---------- Colour vision ---------- */

export type Vision = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

export const visionOptions: { value: Vision; label: string }[] = [
    { value: 'normal', label: 'Normal vision' },
    { value: 'protanopia', label: 'Protanopia' },
    { value: 'deuteranopia', label: 'Deuteranopia' },
    { value: 'tritanopia', label: 'Tritanopia' },
    { value: 'achromatopsia', label: 'Achromatopsia' },
];

/*
 * Machado, Oliveira and Fernandes (2009) at severity 1, the matrices src/lib/contrast.ts measures the
 * data colours by. They work on linear sRGB, so the filter runs in linearRGB. Achromatopsia keeps
 * only the luminance, by the sRGB primaries' weights.
 */
const visionMatrices: Record<Exclude<Vision, 'normal'>, readonly (readonly number[])[]> = {
    protanopia: [
        [0.152286, 1.052583, -0.204868],
        [0.114503, 0.786281, 0.099216],
        [-0.003882, -0.048116, 1.051998],
    ],
    deuteranopia: [
        [0.367322, 0.860646, -0.227968],
        [0.280085, 0.672501, 0.047413],
        [-0.01182, 0.04294, 0.968881],
    ],
    tritanopia: [
        [1.255528, -0.076749, -0.178779],
        [-0.078411, 0.930809, 0.147602],
        [0.004733, 0.691367, 0.3039],
    ],
    achromatopsia: [
        [0.2126, 0.7152, 0.0722],
        [0.2126, 0.7152, 0.0722],
        [0.2126, 0.7152, 0.0722],
    ],
};

/** A 3 × 3 matrix as feColorMatrix's 4 × 5, alpha passed through. */
const matrixValues = (rows: readonly (readonly number[])[]) =>
    [...rows.map(row => `${row.join(' ')} 0 0`), '0 0 0 1 0'].join(' ');

/** The filters the vision select picks from, once per panel; `visionFilter` names one. */
export const VisionFilters = ({ id }: { id: string }) => (
    // Sized to nothing rather than hidden: a filter inside an undisplayed SVG is not applied.
    <svg aria-hidden="true" className="pointer-events-none absolute size-0" focusable="false">
        <defs>
            {Object.entries(visionMatrices).map(([vision, rows]) => (
                <filter colorInterpolationFilters="linearRGB" id={`${id}-${vision}`} key={vision}>
                    <feColorMatrix type="matrix" values={matrixValues(rows)} />
                </filter>
            ))}
        </defs>
    </svg>
);

/** The CSS filter for a vision, or none for normal vision. */
export const visionFilter = (id: string, vision: Vision) =>
    vision === 'normal' ? undefined : `url(#${id}-${vision})`;

export const VisionSelect = ({
    value,
    onChange,
}: {
    value: Vision;
    onChange: (vision: Vision) => void;
}) => (
    <Select<Vision> onValueChange={onChange} value={value}>
        {/* As wide as the longest name, so the header keeps its place as the vision changes. */}
        <SelectTrigger aria-label="Simulated vision" className="w-38 justify-between" size="sm">
            <SelectValue />
        </SelectTrigger>
        <SelectContent>
            {visionOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                    {option.label}
                </SelectItem>
            ))}
        </SelectContent>
    </Select>
);

/* ---------- Measuring ---------- */

type SeriesMeasure = ReturnType<typeof measureSeries>;

export type CheckLayer = {
    mode: ThemeMode;
    pairs: PairResult[];
    byId: Map<string, PairResult>;
    series: SeriesMeasure;
};

/**
 * The theme measured for one mode while the layer is on, or null while it is off. Keyed on the
 * theme's text, so a new object with the same choices (each render of the page makes one) measures
 * nothing again.
 */
export const useCheckLayer = (theme: ThemeOptions, mode: ThemeMode, on: boolean) => {
    const key = JSON.stringify(theme);
    return useMemo((): CheckLayer | null => {
        if (!on) return null;
        const options = JSON.parse(key) as ThemeOptions;
        const pairs = measurePairs(options, mode);
        return {
            mode,
            pairs,
            byId: new Map(pairs.map(result => [result.check.id, result])),
            series: measureSeries(options, mode),
        };
    }, [key, mode, on]);
};

const CheckContext = createContext<CheckLayer | null>(null);

/** Hands the measures to the marks inside it; null turns the layer off. */
export const CheckProvider = CheckContext.Provider;

/** The layer's measures, or null while it is off. */
export const useChecks = () => useContext(CheckContext);

/* ---------- The data colours, as lines ---------- */

/** A lightness without its leading zero, as the bands are written: .43. */
const short = (value: number) => value.toFixed(2).replace(/^0/, '');

const finite = (value: number, show: (value: number) => string) =>
    Number.isFinite(value) ? show(value) : '—';

type SeriesRow = {
    id: SeriesCheckId;
    /** In the chart's tooltip, under "Chart colours". */
    label: string;
    /** In the list of misses, beside the pairs. */
    line: string;
    needs: (mode: ThemeMode) => string;
    /** The measure as shown, cut toward the threshold so a shown figure never claims a pass. */
    show: (check: SeriesCheck, series: Oklch[]) => string;
};

const { band, chroma, cvd, normal, contrast } = seriesLevels;

const seriesRows: SeriesRow[] = [
    {
        id: 'band',
        label: 'Lightness band',
        line: 'Series lightness',
        needs: mode => `${short(band[mode][0])}–${short(band[mode][1])}`,
        // The darkest rounded down and the lightest up, so a series just outside never shows inside.
        show: (_, series) => {
            if (series.length === 0) return '—';
            const lightness = series.map(color => color.l);
            const low = Math.floor(Math.min(...lightness) * 100) / 100;
            const high = Math.ceil(Math.max(...lightness) * 100) / 100;
            return `${short(low)}–${short(high)}`;
        },
    },
    {
        id: 'chroma',
        label: 'Chroma',
        line: 'Series chroma',
        needs: () => `C ${short(chroma)}`,
        show: check => finite(check.value, value => `C ${short(Math.trunc(value * 100) / 100)}`),
    },
    {
        id: 'cvd',
        label: 'Colour-blind distance',
        line: 'Series apart, colour-blind',
        needs: () => `ΔE ${cvd.target}`,
        show: check => finite(check.value, value => `ΔE ${cut(value, 1)}`),
    },
    {
        id: 'normal',
        label: 'Normal distance',
        line: 'Series apart',
        needs: () => `ΔE ${normal}`,
        show: check => finite(check.value, value => `ΔE ${cut(value, 1)}`),
    },
    {
        id: 'contrast',
        label: 'Contrast',
        line: 'Series on the surface',
        needs: () => `${contrast}:1`,
        show: check => finite(check.value, value => `${cut(value, 2)}:1`),
    },
];

/** A series check as a pair's verdict: a warning holds with labels beside the colours, so it advises. */
const seriesVerdict: Record<SeriesCheck['state'], Verdict> = {
    pass: 'pass',
    warn: 'advise',
    fail: 'fail',
};

const worst = (verdicts: Verdict[]): Verdict =>
    verdicts.includes('fail') ? 'fail' : verdicts.includes('advise') ? 'advise' : 'pass';

/* ---------- Marks ---------- */

const dotTone: Record<Verdict, StatusDotTone> = {
    pass: 'success',
    fail: 'error',
    advise: 'warning',
};

const said: Record<Verdict, string> = {
    pass: 'passes',
    fail: 'misses',
    advise: 'misses, advised only',
};

const markTone: Record<Verdict, string> = {
    // A badge's 20% wash mixed onto the surface, so the preview never shows through a mark.
    pass: 'bg-[color-mix(in_oklab,var(--color-success-500)_20%,var(--color-neutral-50))] text-success-800',
    advise: 'bg-[color-mix(in_oklab,var(--color-warning-500)_20%,var(--color-neutral-50))] text-warning-800',
    // A miss is the one loud mark, and it stays told apart by its weight under any vision filter.
    fail: 'bg-error-600 text-neutral-50',
};

/** Where a mark sits on its element. */
const places = {
    /** Astride the top right corner, mostly outside it, so the part it measures stays in view. */
    corner: '-top-2 left-full -translate-x-1.5',
    /** Beside a line of text, centred on it. */
    after: 'top-1/2 left-full ml-1.5 -translate-y-1/2',
    /** Raised past the end of a word, as a footnote is, so it covers none of its letters. */
    raised: '-top-2 left-full ml-0.5',
    /** Over an input's placeholder: past the 12px padding, the 16px search icon and its 8px gap. */
    start: '-top-2 left-9',
    /** From the text inside a pill badge (8px in, 4px down) out to the badge's own corner. */
    inset: '-top-3 left-full translate-x-0.5',
} as const;

export type MarkPlace = keyof typeof places;

/** Below 10 to one decimal, cut rather than rounded, so 4.49 shows 4.4 and never reads as a pass. */
const shortRatio = (ratio: number) => (ratio >= 10 ? String(Math.trunc(ratio)) : cut(ratio, 1));

const Mark = ({
    state,
    label,
    place,
    tip,
    children,
}: {
    state: Verdict;
    label: string;
    place: MarkPlace;
    tip: ReactNode;
    children: ReactNode;
}) => (
    <Tooltip>
        <TooltipTrigger
            aria-label={label}
            className={cn(
                // Fixed pixels: a mark is the check's, so the theme's type and spacing never resize it.
                'absolute z-10 inline-flex h-4 min-w-4 cursor-default select-none items-center justify-center whitespace-nowrap rounded-full px-1 font-medium text-[11px] tabular-nums leading-none shadow-float',
                markTone[state],
                places[place],
                focusRing,
            )}
        >
            {children}
        </TooltipTrigger>
        <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
);

/** A label and its value on one line of a tooltip. */
const TipRow = ({ label, children }: { label: string; children: ReactNode }) => (
    <span className="flex gap-2">
        <span className="w-9 shrink-0 text-neutral-400">{label}</span>
        <span className="min-w-0 tabular-nums">{children}</span>
    </span>
);

const PairTip = ({ result }: { result: PairResult }) => {
    const state = verdict(result);
    return (
        <span className="flex flex-col gap-0.5 py-0.5">
            <span>{result.check.label}</span>
            <span className="mb-1 text-neutral-400">{pairName(result.check)}</span>
            <TipRow label="Needs">{pairNeeds(result.check)}</TipRow>
            <TipRow label="Has">
                {`${cut(result.ratio, 2)}:1 · APCA Lc ${lcValue(result.lc)}`}
            </TipRow>
            {state === 'advise' && result.check.advisory && (
                <span className="mt-1 font-normal text-neutral-400">{result.check.advisory}</span>
            )}
        </span>
    );
};

const PairMark = ({ result, place }: { result?: PairResult; place: MarkPlace }) => {
    if (!result) return null;
    const state = verdict(result);
    return (
        <Mark
            label={`${result.check.label}: ${cut(result.ratio, 2)} to 1, ${said[state]}`}
            place={place}
            state={state}
            tip={<PairTip result={result} />}
        >
            {shortRatio(result.ratio)}
        </Mark>
    );
};

const SeriesTip = ({ series, mode }: { series: SeriesMeasure; mode: ThemeMode }) => (
    <span className="flex flex-col gap-1 py-0.5">
        <span className="mb-0.5">Chart colours, series 1 to 4</span>
        {seriesRows.map(row => {
            const check = series.checks.find(item => item.id === row.id);
            if (!check) return null;
            return (
                <span className="flex items-center gap-1.5" key={row.id}>
                    <StatusDot size="sm" tone={dotTone[seriesVerdict[check.state]]} />
                    <span className="flex-1 text-neutral-400">{row.label}</span>
                    <span className="tabular-nums">{row.show(check, series.series)}</span>
                    <span className="w-12 text-right text-neutral-400 tabular-nums">
                        {row.needs(mode)}
                    </span>
                </span>
            );
        })}
    </span>
);

const SeriesMark = ({ layer, place }: { layer: CheckLayer; place: MarkPlace }) => {
    const state = worst(layer.series.checks.map(check => seriesVerdict[check.state]));
    const Glyph = state === 'fail' ? X : Check;
    return (
        <Mark
            label={`Chart colours ${said[state]}`}
            place={place}
            state={state}
            tip={<SeriesTip mode={layer.mode} series={layer.series} />}
        >
            <Glyph className="size-2.5" strokeWidth={2.5} />
        </Mark>
    );
};

type CheckedProps = {
    /** The pair the element paints, by its id in checks.ts, or `series` for a chart's data colours. */
    check?: string;
    place?: MarkPlace;
    /** A block element is wrapped in a div, an inline one in a span. */
    as?: 'span' | 'div';
    className?: string;
    children: ReactNode;
};

/**
 * Wraps a preview element in the box its mark is placed by. The box is there with the layer off
 * too, and the mark is out of the flow, so turning the layer on moves nothing.
 */
export const Checked = ({
    check,
    place = 'corner',
    as: Element = 'span',
    className,
    children,
}: CheckedProps) => {
    const layer = useChecks();
    return (
        <Element className={cn('relative inline-flex w-fit max-w-full', className)}>
            {children}
            {layer &&
                check &&
                (check === 'series' ? (
                    // No mark where the chart colours are not judged.
                    layer.series.checks.length > 0 && <SeriesMark layer={layer} place={place} />
                ) : (
                    <PairMark place={place} result={layer.byId.get(check)} />
                ))}
        </Element>
    );
};

/* ---------- The misses ---------- */

type Line = { id: string; label: string; value: string; needs: string; state: Verdict };

/** Every pair and data-colour check that misses, required or advised, for the layer's mode. */
const missLines = (layer: CheckLayer): Line[] => [
    ...layer.pairs.flatMap((result): Line[] => {
        const state = verdict(result);
        return state === 'pass'
            ? []
            : [
                  {
                      id: result.check.id,
                      label: result.check.label,
                      value: `${cut(result.ratio, 2)}:1`,
                      needs: `${result.check.min}:1`,
                      state,
                  },
              ];
    }),
    ...seriesRows.flatMap((row): Line[] => {
        const check = layer.series.checks.find(item => item.id === row.id);
        if (!check || check.state === 'pass') return [];
        return [
            {
                id: `series-${row.id}`,
                label: row.line,
                value: row.show(check, layer.series.series),
                needs: row.needs(layer.mode),
                state: seriesVerdict[check.state],
            },
        ];
    }),
];

const Lines = ({ lines }: { lines: Line[] }) => (
    <ul className="flex flex-col gap-2">
        {lines.map(line => (
            <li className="flex items-center gap-2" key={line.id}>
                <StatusDot size="sm" tone={dotTone[line.state]} />
                <span className="min-w-0 flex-1 truncate text-neutral-950" title={line.label}>
                    {line.label}
                </span>
                <span className="font-medium text-neutral-950 tabular-nums">{line.value}</span>
                <span className="w-20 shrink-0 text-right text-neutral-600 tabular-nums">
                    needs {line.needs}
                </span>
            </li>
        ))}
    </ul>
);

const missCount = (count: number) =>
    count === 0 ? 'All clear' : `${count} ${count === 1 ? 'miss' : 'misses'}`;

/* ---------- Balancing light and dark ---------- */

type Balancing = { state: 'idle' } | { state: 'busy' } | { state: 'done'; balance: Balance };

/**
 * Runs the balance a slice at a time, about 8ms of work between frames, so the page keeps
 * answering while it searches. A theme changed under it drops the run and its answer.
 */
const useBalance = (theme: ThemeOptions) => {
    const key = JSON.stringify(theme);
    const [run, setRun] = useState<{ key: string; balancing: Balancing } | null>(null);
    const timer = useRef<number | undefined>(undefined);
    const latest = useRef(key);
    latest.current = key;

    useEffect(() => () => window.clearTimeout(timer.current), []);

    const start = () => {
        window.clearTimeout(timer.current);
        const search = balanceCurves(JSON.parse(key) as ThemeOptions);
        setRun({ key, balancing: { state: 'busy' } });
        const step = () => {
            if (latest.current !== key) return;
            const next = search.next();
            if (next.done) setRun({ key, balancing: { state: 'done', balance: next.value } });
            else timer.current = window.setTimeout(step, 0);
        };
        timer.current = window.setTimeout(step, 0);
    };
    const stop = () => {
        window.clearTimeout(timer.current);
        setRun(null);
    };

    const balancing: Balancing = run?.key === key ? run.balancing : { state: 'idle' };
    return { balancing, start, stop };
};

const rampNames: Record<CurveRamp, string> = { neutral: 'Neutral', primary: 'Primary' };

const keyNames: Record<CurveKey, string> = {
    lightest: 'Lightest',
    darkest: 'Darkest',
    midtones: 'Midtones',
    saturation: 'Saturation',
};

/** A curve value as its slider shows it: the ends' lightness, the midtones signed, a percentage. */
const curveValue = (key: CurveKey, value: number) => {
    if (key === 'lightest' || key === 'darkest') return `${(value * 100).toFixed(1)}%`;
    if (key === 'saturation') return `${Math.round(value * 100)}%`;
    if (Math.abs(value) < 0.005) return '0';
    return `${value > 0 ? '+' : '−'}${Math.abs(value).toFixed(2)}`;
};

/** The pairs as a phrase: "Success badge, warning badge, a rising delta in light". */
const pairList = (pairs: Balance['unfixed'][number]['pairs']) => {
    const lower = (label: string, i: number) =>
        i === 0 ? label : `${label[0]?.toLowerCase()}${label.slice(1)}`;
    // Commas only: a label may hold an "and" of its own (hints and placeholders).
    const join = (parts: string[]) => parts.join(', ');
    const only = pairs[0]?.modes;
    const oneMode =
        only?.length === 1 &&
        pairs.every(pair => pair.modes.length === 1 && pair.modes[0] === only[0]);
    if (oneMode) return `${join(pairs.map((pair, i) => lower(pair.label, i)))} in ${only[0]}`;
    return join(
        pairs.map(
            (pair, i) =>
                `${lower(pair.label, i)}${pair.modes.length === 1 ? ` in ${pair.modes[0]}` : ''}`,
        ),
    );
};

const ModeCounts = ({ balance }: { balance: Balance }) => (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 tabular-nums">
        {(['light', 'dark'] as const).map(mode => (
            <div className="contents" key={mode}>
                <dt className="text-neutral-600">{mode === 'light' ? 'Light' : 'Dark'}</dt>
                <dd className="text-neutral-600">
                    {`${balance.before[mode]} → `}
                    <span className="font-medium text-neutral-950">
                        {missCount(balance.after[mode]).toLowerCase()}
                    </span>
                </dd>
            </div>
        ))}
    </dl>
);

/**
 * What the balance would do, before it does it: the misses in each mode now and after, the values
 * it sets, and what no curve can fix, with why.
 */
const Proposal = ({
    balance,
    onApply,
    onCancel,
}: {
    balance: Balance;
    onApply: () => void;
    onCancel: () => void;
}) => {
    const first = useRef<HTMLButtonElement>(null);
    // The list it replaces held the focus; it moves to the answer's own action.
    useEffect(() => first.current?.focus(), []);
    const { changes, patch, unfixed } = balance;

    return (
        <>
            <PopoverHeader>
                <PopoverTitle>Balance light and dark</PopoverTitle>
                <PopoverDescription>
                    {patch
                        ? 'The curves that pass the most in both modes, moved as little as they can be.'
                        : 'No shape of the curves passes more than the one this theme has.'}
                </PopoverDescription>
            </PopoverHeader>
            <ModeCounts balance={balance} />
            {changes.length > 0 && (
                <dl className="grid grid-cols-[auto_auto_1fr] gap-x-3 gap-y-1 tabular-nums">
                    {changes.map((change, i) => (
                        <div className="contents" key={`${change.ramp}-${change.key}`}>
                            <dt className="text-neutral-600">
                                {changes[i - 1]?.ramp === change.ramp ? '' : rampNames[change.ramp]}
                            </dt>
                            <dt className="text-neutral-950">{keyNames[change.key]}</dt>
                            <dd className="text-right text-neutral-600">
                                {`${curveValue(change.key, change.from)} → `}
                                <span className="font-medium text-neutral-950">
                                    {curveValue(change.key, change.to)}
                                </span>
                            </dd>
                        </div>
                    ))}
                </dl>
            )}
            {unfixed.length > 0 && (
                <div className="flex flex-col gap-2">
                    <p className="text-neutral-600">No curve fixes</p>
                    <ul className="flex flex-col gap-2">
                        {unfixed.map(group => (
                            <li className="flex gap-2" key={group.reason}>
                                <StatusDot className="mt-1.5" size="sm" tone="error" />
                                <span className="flex min-w-0 flex-col gap-0.5">
                                    <span className="text-neutral-950">
                                        {pairList(group.pairs)}
                                    </span>
                                    <span className="text-neutral-600">{group.reason}</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <div className="flex justify-end gap-2">
                {patch ? (
                    <>
                        <Button onClick={onCancel} variant="ghost">
                            Cancel
                        </Button>
                        <Button onClick={onApply} ref={first}>
                            Apply
                        </Button>
                    </>
                ) : (
                    <Button onClick={onCancel} ref={first} variant="ghost">
                        Back
                    </Button>
                )}
            </div>
        </>
    );
};

/**
 * The header's quiet count while the layer is on: the pairs under their level, or "All clear". It
 * opens the list of every miss in the mode shown, the advised ones under their own title, and the
 * other mode's count beside the action that balances the two.
 */
export const MissesButton = ({
    layer,
    theme,
    set,
}: {
    layer: CheckLayer;
    theme: ThemeOptions;
    /** Sets the balanced curves; without it the popover only reports. */
    set?: (patch: Partial<ThemeOptions>) => void;
}) => {
    const [open, setOpen] = useState(false);
    const { balancing, start, stop } = useBalance(theme);
    const lines = missLines(layer);
    const misses = lines.filter(line => line.state === 'fail');
    const advised = lines.filter(line => line.state === 'advise');
    const count = missCount(misses.length);

    const other: ThemeMode = layer.mode === 'light' ? 'dark' : 'light';
    const key = JSON.stringify(theme);
    // The other mode is measured only while the list is open.
    const otherMisses = useMemo(
        () => (open ? requiredMisses(JSON.parse(key) as ThemeOptions, other) : 0),
        [open, key, other],
    );

    return (
        <Popover
            onOpenChange={next => {
                setOpen(next);
                if (!next) stop();
            }}
            open={open}
        >
            <PopoverTrigger render={<Button variant="ghost" />}>
                <StatusDot size="sm" tone={misses.length ? 'error' : 'success'} />
                {count}
            </PopoverTrigger>
            <PopoverContent align="start" className="w-84">
                {balancing.state === 'done' ? (
                    <Proposal
                        balance={balancing.balance}
                        onApply={() => {
                            if (balancing.balance.patch) set?.(balancing.balance.patch);
                            stop();
                        }}
                        onCancel={stop}
                    />
                ) : (
                    <>
                        <PopoverHeader>
                            <PopoverTitle>{`${count} in ${layer.mode}`}</PopoverTitle>
                            <PopoverDescription>
                                Text 4.5:1 · labels, hints and the focus ring 3:1 · shapes 1.5:1.
                            </PopoverDescription>
                        </PopoverHeader>
                        {misses.length > 0 && <Lines lines={misses} />}
                        {advised.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <p className="text-neutral-600">Advised, not required</p>
                                <Lines lines={advised} />
                            </div>
                        )}
                        {lines.length === 0 && (
                            <p className="text-neutral-600">Every pair meets its level.</p>
                        )}
                        <Separator />
                        <div className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-2 text-neutral-600">
                                <StatusDot size="sm" tone={otherMisses ? 'error' : 'success'} />
                                {`${missCount(otherMisses)} in ${other}`}
                            </span>
                            {set && misses.length + otherMisses > 0 && (
                                <Button
                                    loading={balancing.state === 'busy'}
                                    onClick={start}
                                    variant="secondary"
                                >
                                    Balance light and dark
                                </Button>
                            )}
                        </div>
                    </>
                )}
            </PopoverContent>
        </Popover>
    );
};

/* ---------- The contrast grid ---------- */

const rampLabel: Record<GridRamp, string> = {
    neutral: 'Neutral',
    primary: 'Primary',
    success: 'Success',
    warning: 'Warning',
    error: 'Error',
};

const RampSelect = ({
    label,
    value,
    onChange,
}: {
    label: string;
    value: GridRamp;
    onChange: (ramp: GridRamp) => void;
}) => (
    <Select<GridRamp> onValueChange={onChange} value={value}>
        <SelectTrigger aria-label={label} className="flex-1 justify-between" size="sm">
            <SelectValue />
        </SelectTrigger>
        <SelectContent>
            {gridRamps.map(ramp => (
                <SelectItem key={ramp} value={ramp}>
                    {rampLabel[ramp]}
                </SelectItem>
            ))}
        </SelectContent>
    </Select>
);

type GridCell = { fg: Oklch; bg: Oklch; ratio: number; lc: number };
type GridCells = Record<ThemeMode, GridCell[][]>;
type CellAt = { r: number; c: number };

/** What a pair can be used for: under 3:1 nothing, from 3:1 a control or large text, from 4.5:1 text. */
const use = (ratio: number) => (ratio >= 4.5 ? 2 : ratio >= 3 ? 1 : 0);

/** Whether a pair is fit for one use in one mode and not in the other. */
const differs = (cells: GridCells, { r, c }: CellAt) => {
    const light = cells.light[r]?.[c];
    const dark = cells.dark[r]?.[c];
    return Boolean(light && dark && use(light.ratio) !== use(dark.ratio));
};

/**
 * A level as a mark, in the colour it is drawn in: a large dot at AAA, a small one at AA, a ring at
 * 3:1, nothing under it. Filled is fit for text, so the AA line is where dots turn into rings.
 */
const LevelMark = ({ level }: { level: ReturnType<typeof wcagLevel> }) =>
    level === 'AAA' ? (
        <span className="size-2 rounded-full bg-current" />
    ) : level === 'AA' ? (
        <span className="size-1.25 rounded-full bg-current" />
    ) : level === '3:1' ? (
        <span className="size-1.75 rounded-full border-[1.5px] border-current" />
    ) : null;

const levelSaid = (ratio: number) => {
    const level = wcagLevel(ratio);
    return level === null ? 'under 3:1' : level === '3:1' ? '3:1 only' : level;
};

const cellSummary = (cell: GridCell) =>
    `${cut(cell.ratio, 2)}:1 · ${levelSaid(cell.ratio)} · Lc ${lcValue(cell.lc)}`;

const stepName = (ramp: GridRamp, index: number) => `${ramp}-${stepLabels[index] ?? ''}`;

const moves: Record<string, [number, number]> = {
    ArrowUp: [-1, 0],
    ArrowDown: [1, 0],
    ArrowLeft: [0, -1],
    ArrowRight: [0, 1],
};

const clampStep = (value: number) => Math.min(stepLabels.length - 1, Math.max(0, value));

/**
 * Each cell's place, made once: the tooltip compares its trigger's payload by identity, so a new
 * object on every render would set it again and again.
 */
const cellPlaces = stepLabels.map((_, r) => stepLabels.map((__, c): CellAt => ({ r, c })));

/**
 * One mode's grid: each text step, by row, on each background step, by column, painted as the mode
 * paints them, the mark in the text's colour on the background's. A pair that is fit for a use in
 * one mode only is ringed. One cell is in the tab order; the arrows move between them.
 */
const ModeGrid = ({
    mode,
    cells,
    textRamp,
    backRamp,
    active,
    onActive,
}: {
    mode: ThemeMode;
    cells: GridCells;
    textRamp: GridRamp;
    backRamp: GridRamp;
    active: CellAt;
    onActive: (at: CellAt) => void;
}) => (
    <table className="w-max border-separate border-spacing-0.5 text-xxs tabular-nums">
        <caption className="sr-only">
            {`${rampLabel[textRamp]} text, by row, on ${rampLabel[backRamp].toLowerCase()} backgrounds, by column, in ${mode} mode`}
        </caption>
        <thead>
            <tr>
                <td className="h-4 w-7 pr-1 font-medium text-neutral-950">
                    {mode === 'light' ? 'Light' : 'Dark'}
                </td>
                {stepLabels.map((step, c) => (
                    <th className="relative h-4 p-0 font-normal" key={step} scope="col">
                        {/* The ends and the middle named; the rest only for screen readers. */}
                        <span
                            className={cn(
                                'absolute bottom-0 left-1/2 -translate-x-1/2 text-neutral-600',
                                c % 5 !== 0 && 'sr-only',
                            )}
                        >
                            {step}
                        </span>
                    </th>
                ))}
            </tr>
        </thead>
        <tbody>
            {cells[mode].map((row, r) => {
                const textStep = stepLabels[r] ?? '';
                return (
                    <tr key={textStep}>
                        <th className="pr-1 text-right font-normal text-neutral-600" scope="row">
                            {textStep}
                        </th>
                        {row.map((cell, c) => {
                            const name = `${stepName(textRamp, r)} on ${stepName(backRamp, c)}`;
                            const other = cells[mode === 'light' ? 'dark' : 'light'][r]?.[c];
                            const ringed = differs(cells, { r, c });
                            return (
                                <td className="p-0" key={stepLabels[c]}>
                                    <TooltipTrigger
                                        aria-label={`${name}: ${mode} ${cut(cell.ratio, 2)} to 1, ${levelSaid(cell.ratio)}${
                                            other
                                                ? `; ${mode === 'light' ? 'dark' : 'light'} ${cut(other.ratio, 2)} to 1, ${levelSaid(other.ratio)}`
                                                : ''
                                        }${ringed ? '; differs between the modes' : ''}`}
                                        className={cn(
                                            // A faint inner hairline, so a step as pale or as deep as the popover still reads as a cell.
                                            'flex size-4.5 cursor-default items-center justify-center rounded-[3px] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-neutral-950)_8%,transparent)]',
                                            focusRing,
                                            ringed &&
                                                'outline-[1.5px] outline-error-500 outline-solid',
                                        )}
                                        data-cell={`${r}-${c}`}
                                        onFocus={() => onActive({ r, c })}
                                        onKeyDown={event => {
                                            const move = moves[event.key];
                                            const next =
                                                event.key === 'Home'
                                                    ? { r, c: 0 }
                                                    : event.key === 'End'
                                                      ? { r, c: stepLabels.length - 1 }
                                                      : move
                                                        ? {
                                                              r: clampStep(r + move[0]),
                                                              c: clampStep(c + move[1]),
                                                          }
                                                        : null;
                                            if (!next) return;
                                            event.preventDefault();
                                            onActive(next);
                                            event.currentTarget
                                                .closest('table')
                                                ?.querySelector<HTMLElement>(
                                                    `[data-cell="${next.r}-${next.c}"]`,
                                                )
                                                ?.focus();
                                        }}
                                        payload={cellPlaces[r]?.[c]}
                                        style={{
                                            background: formatOklch(cell.bg),
                                            color: formatOklch(cell.fg),
                                        }}
                                        tabIndex={active.r === r && active.c === c ? 0 : -1}
                                    >
                                        <LevelMark level={wcagLevel(cell.ratio)} />
                                    </TooltipTrigger>
                                </td>
                            );
                        })}
                    </tr>
                );
            })}
        </tbody>
    </table>
);

/** The marks read in the popover's own ink, so the key holds whatever the grid's colours are. */
const Legend = () => (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-neutral-600 text-xxs">
        {(['AAA', 'AA', '3:1'] as const).map(level => (
            <li className="flex items-center gap-1.5" key={level}>
                <span className="flex size-3 items-center justify-center text-neutral-950">
                    <LevelMark level={level} />
                </span>
                {level}
            </li>
        ))}
        <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-[2px] outline-[1.5px] outline-error-500 outline-solid" />
            One mode only
        </li>
    </ul>
);

/**
 * The contrast grid behind a small icon button: one ramp's eleven steps as text on another's, in
 * light over dark, so a pair that reads in one mode and not the other shows in both. Each cell is
 * marked by its level; the ratio and APCA's Lc for both modes are in its tooltip.
 */
export const GridButton = ({ theme }: { theme: ThemeOptions }) => {
    const [open, setOpen] = useState(false);
    const [textRamp, setTextRamp] = useState<GridRamp>('neutral');
    const [backRamp, setBackRamp] = useState<GridRamp>('neutral');
    // Secondary text on the surface: the pair most worth starting from.
    const [active, setActive] = useState<CellAt>({ r: 6, c: 0 });

    const key = JSON.stringify(theme);
    // Measured only while it is open: 242 pairs on every change of the theme would be wasted.
    const cells = useMemo((): GridCells | null => {
        if (!open) return null;
        const options = JSON.parse(key) as ThemeOptions;
        const measure = (mode: ThemeMode) => {
            const back = rampColors(options, mode, backRamp);
            return rampColors(options, mode, textRamp).map(fg =>
                back.map(bg => ({ fg, bg, ratio: wcagContrast(fg, bg), lc: apcaContrast(fg, bg) })),
            );
        };
        return { light: measure('light'), dark: measure('dark') };
    }, [open, key, textRamp, backRamp]);

    const mismatches = cells
        ? stepLabels.reduce(
              (sum, _, r) => sum + stepLabels.filter((__, c) => differs(cells, { r, c })).length,
              0,
          )
        : 0;

    return (
        <Popover onOpenChange={setOpen} open={open}>
            <Tooltip>
                <TooltipTrigger
                    render={
                        <PopoverTrigger
                            render={
                                <Button aria-label="Contrast grid" size="icon" variant="ghost" />
                            }
                        />
                    }
                >
                    <Grid3x3 {...icon} />
                </TooltipTrigger>
                <TooltipContent>Contrast grid</TooltipContent>
            </Tooltip>
            {/* As wide as a grid: eleven 18px cells 2px apart, and the step names. */}
            <PopoverContent align="end" className="w-70">
                <PopoverHeader>
                    <PopoverTitle>Contrast grid</PopoverTitle>
                    <PopoverDescription>
                        {mismatches === 0
                            ? 'Light and dark agree on every pair.'
                            : `${mismatches} ${mismatches === 1 ? 'pair passes' : 'pairs pass'} in one mode only, ringed in both.`}
                    </PopoverDescription>
                </PopoverHeader>
                <div className="flex items-center gap-2">
                    <RampSelect label="Text ramp" onChange={setTextRamp} value={textRamp} />
                    <span className="text-neutral-600">on</span>
                    <RampSelect label="Background ramp" onChange={setBackRamp} value={backRamp} />
                </div>
                {cells && (
                    <Tooltip>
                        {({ payload }) => {
                            const at = payload as CellAt | undefined;
                            const light = at && cells.light[at.r]?.[at.c];
                            const dark = at && cells.dark[at.r]?.[at.c];
                            return (
                                <>
                                    <div className="flex flex-col gap-3">
                                        {(['light', 'dark'] as const).map(mode => (
                                            <ModeGrid
                                                active={active}
                                                backRamp={backRamp}
                                                cells={cells}
                                                key={mode}
                                                mode={mode}
                                                onActive={setActive}
                                                textRamp={textRamp}
                                            />
                                        ))}
                                    </div>
                                    <TooltipContent>
                                        {at && light && dark && (
                                            <span className="flex flex-col gap-0.5 py-0.5">
                                                <span className="mb-1">
                                                    {`${stepName(textRamp, at.r)} on ${stepName(backRamp, at.c)}`}
                                                </span>
                                                <TipRow label="Light">{cellSummary(light)}</TipRow>
                                                <TipRow label="Dark">{cellSummary(dark)}</TipRow>
                                            </span>
                                        )}
                                    </TooltipContent>
                                </>
                            );
                        }}
                    </Tooltip>
                )}
                <Legend />
            </PopoverContent>
        </Popover>
    );
};
