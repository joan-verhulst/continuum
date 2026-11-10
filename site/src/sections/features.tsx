import { presets } from '@playground/presets';
import { designBrief, exportTheme } from '@playground/theme-export';
import {
    Badge,
    Button,
    cn,
    SegmentedControl,
    SegmentedControlItem,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableSearch,
    TableToolbar,
    TableToolbarEnd,
    type ThemeOptions,
    ToastProvider,
    useToast,
} from 'continuum';
import { Download, FileText } from 'lucide-react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import {
    Fragment,
    type ReactNode,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { siteTheme } from '../theme';
import { ease, Pill, Reveal, Section } from '../web';

/*
 * Features: what Continuum decides for Claude, four cards, each with a close-up of the real thing at
 * its real size, inset in the card and cropped by it, never scaled. The shots sit on the canvas
 * (neutral-100) the way the product sits on it, and the parts in them are the library's own.
 */

/* ---------- The card ---------- */

type FeatureProps = {
    /** The feature's name, in the pill. */
    name: string;
    title: string;
    description: string;
    /** Where it sits in the grid, for the reveal's stagger. */
    index: number;
    children: ReactNode;
};

/** A feature: its close-up inset 8px in the card, then the pill, a sentence title and one line. */
const Feature = ({ name, title, description, index, children }: FeatureProps) => (
    <Reveal
        className="flex min-w-0 flex-col rounded-panel border border-neutral-200 bg-neutral-50"
        delay={index}
    >
        <div className="relative m-2 mb-0 h-80 overflow-hidden rounded-[calc(var(--radius-panel)-8px)] border border-neutral-200 bg-neutral-100 sm:h-70">
            {children}
        </div>
        <div className="flex flex-col items-start gap-4 p-6 pt-5">
            <Pill dot={false}>{name}</Pill>
            <div className="flex flex-col gap-2">
                <h3 className="text-balance font-medium text-neutral-950 text-xl tracking-[-0.01em]">
                    {title}
                </h3>
                <p className="max-w-[440px] text-[15px] text-neutral-600 leading-[1.6]">
                    {description}
                </p>
            </div>
        </div>
    </Reveal>
);

/* ---------- Density: a table with its measures ---------- */

type Span = { top: number; bottom: number };
/** Where the measured parts sit in the shot: a span is a top and a bottom, a left its left edge. */
type Measures = {
    control: Span & { left: number };
    type: Span & { left: number };
    /** The hairline's row, its top pixel. */
    line: number;
    /** The table frame's left edge. */
    edge: number;
};

const rows = [
    { name: 'Northwind Traders', plan: 'Enterprise', status: 'Active', mrr: '€4,800' },
    { name: 'Globex', plan: 'Pro', status: 'Active', mrr: '€1,240' },
    { name: 'Initech', plan: 'Pro', status: 'Past due', mrr: '€980' },
    { name: 'Umbrella Health', plan: 'Enterprise', status: 'Active', mrr: '€6,200' },
] as const;

const tone = { Active: 'success', 'Past due': 'warning' } as const;

// The gutter's geometry, in px from the table's left edge: the dimension line, its ticks either
// side of it, and the labels' right edge.
const RULE = 18;
const TICK = 4;
const LABEL = 30;

/** A measure's value over what it measures, right-aligned in the gutter and centred on `middle`. */
const Label = ({
    edge,
    middle,
    value,
    children,
}: {
    edge: number;
    middle: number;
    value: string;
    children: ReactNode;
}) => (
    <span
        className="absolute flex -translate-x-full -translate-y-1/2 flex-col items-end gap-0.5 text-right"
        style={{ left: edge - LABEL, top: middle }}
    >
        <span className="font-mono text-neutral-950 text-xs">{value}</span>
        <span className="text-neutral-500 text-xxs">{children}</span>
    </span>
);

/**
 * A dimension in the gutter, as a drawing tool draws one: a rule between two ticks, dashed guides
 * from the ticks to the part it measures, and its value beside it.
 */
const Ruler = ({
    edge,
    span,
    value,
    label,
}: {
    edge: number;
    span: Span & { left: number };
    value: string;
    label: string;
}) => {
    const x = edge - RULE;
    return (
        <>
            <span
                className="absolute w-px bg-neutral-500"
                style={{ left: x, top: span.top, height: span.bottom - span.top }}
            />
            {[span.top, span.bottom - 1].map(y => (
                <span key={y}>
                    <span
                        className="absolute h-px bg-neutral-500"
                        style={{ left: x - TICK, top: y, width: TICK * 2 + 1 }}
                    />
                    <span
                        className="absolute border-neutral-500/60 border-t border-dashed"
                        style={{ left: x + TICK + 3, top: y, width: span.left - x - TICK - 3 }}
                    />
                </span>
            ))}
            <Label edge={edge} middle={(span.top + span.bottom) / 2} value={value}>
                {label}
            </Label>
        </>
    );
};

/**
 * A table at 13px with three of its measures drawn in the gutter beside it: the control's 34, the
 * type's 13 (its em box, centred on the line) and the 1px hairline under a row. Read off the
 * rendered parts, so they stay true to whatever the theme draws.
 */
const DensityShot = () => {
    const shot = useRef<HTMLDivElement>(null);
    const [measures, setMeasures] = useState<Measures>();

    useLayoutEffect(() => {
        const element = shot.current;
        if (!element) return;
        const measure = () => {
            const base = element.getBoundingClientRect();
            const box = (selector: string) =>
                element.querySelector(selector)?.getBoundingClientRect();
            const control = box('[data-slot=table-toolbar] [data-slot=input]');
            const text = box('[data-measure=type]');
            const row = box('[data-measure=row]');
            const table = box('[data-slot=table-wrapper]');
            if (!control || !text || !row || !table) return;
            const size = Number.parseFloat(
                getComputedStyle(element.querySelector('[data-measure=type]') as Element).fontSize,
            );
            const centre = (text.top + text.bottom) / 2 - base.top;
            setMeasures({
                control: {
                    top: control.top - base.top,
                    bottom: control.bottom - base.top,
                    left: control.left - base.left,
                },
                type: {
                    top: centre - size / 2,
                    bottom: centre + size / 2,
                    left: text.left - base.left,
                },
                line: Math.round(row.bottom - base.top) - 1,
                edge: table.left - base.left,
            });
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(element);
        document.fonts?.ready.then(measure);
        return () => observer.disconnect();
    }, []);

    return (
        <div className="absolute inset-0" ref={shot}>
            <div aria-hidden className="absolute top-8 left-28 w-140" inert>
                <Table
                    toolbar={
                        <TableToolbar>
                            <TableSearch placeholder="Search customers" />
                            <TableToolbarEnd>
                                <Select defaultValue="any">
                                    <SelectTrigger size="sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="any">Any plan</SelectItem>
                                    </SelectContent>
                                </Select>
                            </TableToolbarEnd>
                        </TableToolbar>
                    }
                >
                    <TableHeader>
                        <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead className="w-28">Plan</TableHead>
                            <TableHead className="w-28">Status</TableHead>
                            <TableHead className="w-32 text-right">Monthly revenue</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row, i) => (
                            <TableRow data-measure={i === 1 ? 'row' : undefined} key={row.name}>
                                <TableCell>
                                    <span data-measure={i === 0 ? 'type' : undefined}>
                                        {row.name}
                                    </span>
                                </TableCell>
                                <TableCell className="font-normal text-neutral-700">
                                    {row.plan}
                                </TableCell>
                                <TableCell>
                                    <Badge tone={tone[row.status]}>{row.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right tabular-nums">{row.mrr}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {measures && (
                <div aria-hidden className="pointer-events-none absolute inset-0">
                    <Ruler
                        edge={measures.edge}
                        label="control"
                        span={measures.control}
                        value="34px"
                    />
                    <Ruler edge={measures.edge} label="type" span={measures.type} value="13px" />
                    {/* The hairline drawn on out of the table to its label, over its first 12px. */}
                    <span
                        className="absolute h-px bg-neutral-500"
                        style={{
                            left: measures.edge - RULE - TICK,
                            top: measures.line,
                            width: RULE + TICK + 12,
                        }}
                    />
                    <Label edge={measures.edge} middle={measures.line + 0.5} value="1px">
                        hairline
                    </Label>
                </div>
            )}
        </div>
    );
};

/* ---------- DESIGN.md: the brief beside the accent ---------- */

type Accent = { id: string; label: string; theme: ThemeOptions };

const accents: Accent[] = [
    { id: 'amber', label: 'Amber', theme: siteTheme },
    ...presets.map(preset => ({ id: preset.id, label: preset.label, theme: preset.theme })),
];

/**
 * The rows of the brief's theme table, as the file has them, line numbers and all: the part an
 * accent rewrites. The inset crops them at the foot and the right, the way an editor would.
 */
const briefLines = (accent: Accent) => {
    const lines = designBrief(exportTheme(accent.theme, accent.label, 'dark')).split('\n');
    const from = Math.max(
        0,
        lines.findIndex(line => line.startsWith('| Accent |')),
    );
    return lines.slice(from, from + 10).map((text, i) => ({ number: from + i + 1, text }));
};

/**
 * The accent, picked from six, beside the DESIGN.md it writes: the brief's theme rows, read from
 * the same writer the theme builder exports with. A line that changed with the pick is marked a
 * moment, so the change reads.
 */
const BriefShot = () => {
    const [id, setId] = useState('amber');
    const accent = accents.find(item => item.id === id) ?? accents[0];
    const lines = useMemo(() => (accent ? briefLines(accent) : []), [accent]);
    const previous = useRef<string[]>(lines.map(line => line.text));
    const [changed, setChanged] = useState<Set<string>>(new Set());

    useEffect(() => {
        const before = new Set(previous.current);
        setChanged(new Set(lines.map(line => line.text).filter(text => !before.has(text))));
        previous.current = lines.map(line => line.text);
    }, [lines]);

    return (
        <div className="absolute inset-0 flex gap-4 pt-6 pl-4 sm:pl-6">
            <style>
                {
                    '@keyframes features-changed { 0%, 40% { background-color: color-mix(in oklab, var(--color-primary-500) 22%, transparent) } 100% { background-color: transparent } }'
                }
            </style>
            <fieldset className="flex w-10 shrink-0 flex-col gap-0.5 sm:w-32">
                <legend className="sr-only">Accent</legend>
                {accents.map(item => (
                    <label
                        className={cn(
                            'flex h-control cursor-pointer items-center gap-2.5 rounded-item px-2.5 text-neutral-600 text-xs transition-[background-color,color] duration-150',
                            'hover:bg-neutral-950/5 hover:text-neutral-800 has-checked:bg-selected has-checked:text-neutral-950',
                            'has-focus-visible:outline-2 has-focus-visible:outline-focus has-focus-visible:outline-solid has-focus-visible:outline-offset-2',
                        )}
                        key={item.id}
                    >
                        <input
                            checked={item.id === id}
                            className="sr-only"
                            name="features-accent"
                            onChange={() => setId(item.id)}
                            type="radio"
                            value={item.id}
                        />
                        <span
                            aria-hidden
                            className="size-3.5 shrink-0 rounded-full"
                            style={{ background: item.theme.accent }}
                        />
                        <span className="max-sm:sr-only">{item.label}</span>
                    </label>
                ))}
            </fieldset>

            <figure className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-tl-card border-neutral-200 border-t border-l bg-neutral-50">
                <figcaption className="flex h-10 shrink-0 items-center gap-2 border-neutral-200 border-b px-4 font-mono text-neutral-600 text-xs">
                    <FileText className="size-4" strokeWidth={2} />
                    DESIGN.md
                    <span className="truncate text-neutral-500">/ The theme</span>
                </figcaption>
                <pre className="flex flex-col py-3 font-mono text-xs leading-5.5">
                    {lines.map(line => (
                        <code
                            className="flex min-h-5.5 gap-4 whitespace-pre pr-4"
                            key={`${line.number}:${line.text}`}
                            style={
                                changed.has(line.text)
                                    ? { animation: 'features-changed 1400ms ease-out both' }
                                    : undefined
                            }
                        >
                            <span className="w-8 shrink-0 select-none text-right text-neutral-500">
                                {line.number}
                            </span>
                            <span className="text-neutral-800">{line.text}</span>
                        </code>
                    ))}
                </pre>
            </figure>
        </div>
    );
};

/* ---------- Components: a control and a button that answer ---------- */

const formats = { csv: 'CSV', xlsx: 'XLSX', json: 'JSON' } as const;
type Format = keyof typeof formats;

/** The export: the format, then the button that raises the toast saying the file is ready. */
const Exporter = () => {
    const [format, setFormat] = useState<Format>('csv');
    const toast = useToast();
    const host = useRef<HTMLDivElement>(null);
    const inView = useInView(host, { once: true, amount: 0.6 });

    const ready = (as: Format) =>
        toast.add({
            title: `customers.${as}`,
            description: '1,284 rows, ready to download.',
            type: 'success',
            actionProps: { children: 'Download' },
            data: { actionIcon: <Download strokeWidth={2} /> },
        });

    // One is up already when the card comes into view, so the shot reads whole before a press.
    // biome-ignore lint/correctness/useExhaustiveDependencies: once, on the first view
    useEffect(() => {
        if (inView) ready('csv');
    }, [inView]);

    return (
        <div className="flex flex-col items-start gap-2" ref={host}>
            <span className="text-neutral-600 text-xs" id="features-format">
                Export format
            </span>
            <div className="flex flex-wrap items-center gap-2">
                <SegmentedControl
                    aria-labelledby="features-format"
                    onValueChange={value => setFormat(value as Format)}
                    value={format}
                >
                    {Object.entries(formats).map(([value, label]) => (
                        <SegmentedControlItem key={value} value={value}>
                            {label}
                        </SegmentedControlItem>
                    ))}
                </SegmentedControl>
                <Button onClick={() => ready(format)}>
                    Export customers
                    <Download strokeWidth={2} />
                </Button>
            </div>
        </div>
    );
};

/** The toasts stay in the shot: their stack stands in the inset's corner, not the page's. */
const ComponentsShot = () => {
    const [host, setHost] = useState<HTMLDivElement | null>(null);

    return (
        <div className="absolute inset-0" ref={setHost}>
            <ToastProvider
                container={host}
                limit={2}
                timeout={0}
                viewportClassName="absolute right-auto bottom-5 left-1/2 w-90 max-w-[calc(100%-32px)] -translate-x-1/2 max-sm:right-auto max-sm:bottom-5 max-sm:left-1/2 max-sm:w-90"
            >
                <div className="absolute inset-x-0 top-10 flex justify-center px-6">
                    <Exporter />
                </div>
            </ToastProvider>
        </div>
    );
};

/* ---------- MCP: the agent asks, Continuum answers ---------- */

type Turn =
    | { who: 'agent'; call: string; args?: string }
    | { who: 'continuum'; title?: string; rows: [string, ReactNode][] };

const swatch = (
    <span
        aria-hidden
        className="mr-2 inline-block size-2.5 rounded-[3px] align-[-1px]"
        style={{ background: siteTheme.accent }}
    />
);

const turns: Turn[] = [
    { who: 'agent', call: 'get_theme' },
    {
        who: 'continuum',
        rows: [
            [
                'action',
                <>
                    {swatch}
                    {siteTheme.accent}, lit
                </>,
            ],
            ['type', '13px, 400 and 500'],
            ['controls', '34 and 38px'],
        ],
    },
    { who: 'agent', call: 'review_screen', args: 'app/overview.tsx' },
    {
        who: 'continuum',
        title: '2 findings',
        rows: [
            ['L18', 'text-sm on a cell → text-xs'],
            ['L42', 'shadow-md on a card → hairline'],
        ],
    },
];

/**
 * A short exchange over the MCP, set as a transcript: who speaks in the gutter, what they said in
 * mono beside it. It plays once as it comes into view, a turn at a time.
 */
const McpShot = () => {
    const reduce = useReducedMotion();
    const box = useRef<HTMLOListElement>(null);
    const inView = useInView(box, { once: true, amount: 0.6 });

    return (
        <motion.ol
            animate={inView || reduce ? 'shown' : 'hidden'}
            className="absolute inset-0 flex flex-col gap-3 p-5 text-xs sm:p-6"
            initial={reduce ? false : 'hidden'}
            ref={box}
            transition={{ staggerChildren: 0.5, delayChildren: 0.2 }}
        >
            {turns.map((turn, i) => (
                <motion.li
                    // On a phone the speaker stands over the turn, so what was said keeps the width.
                    className={cn('flex flex-col gap-1 sm:flex-row sm:gap-4', i === 2 && 'sm:mt-3')}
                    key={`turn-${i + 1}`}
                    transition={{ duration: 0.4, ease }}
                    variants={{ hidden: { opacity: 0, y: 6 }, shown: { opacity: 1, y: 0 } }}
                >
                    <span className="shrink-0 text-neutral-500 sm:w-22">
                        {turn.who === 'agent' ? 'Claude Code' : 'Continuum'}
                    </span>
                    {turn.who === 'agent' ? (
                        <code className="min-w-0 truncate font-mono text-neutral-950">
                            {turn.call}
                            <span className="text-neutral-500">(</span>
                            {turn.args && <span className="text-neutral-600">"{turn.args}"</span>}
                            <span className="text-neutral-500">)</span>
                        </code>
                    ) : (
                        <div className="flex min-w-0 flex-1 flex-col gap-1 border-neutral-200 border-l pl-3 font-mono">
                            {turn.title && <p className="pb-0.5 text-neutral-950">{turn.title}</p>}
                            {/* Keys as wide as the longest, so a short one (a line number) leaves the room to its finding. */}
                            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
                                {turn.rows.map(([key, value]) => (
                                    <Fragment key={key}>
                                        <dt className="text-neutral-500">{key}</dt>
                                        <dd className="min-w-0 text-neutral-800 sm:truncate">
                                            {value}
                                        </dd>
                                    </Fragment>
                                ))}
                            </dl>
                        </div>
                    )}
                </motion.li>
            ))}
        </motion.ol>
    );
};

/* ---------- The section ---------- */

/** Section 3: what Continuum decides, four cards, each with the real thing at its real size. */
export const Features = () => (
    <Section
        description="Other kits hand Claude the parts. Continuum also hands it the decisions behind them: how dense, which colour acts and how each kind of page is composed, in units it applies."
        eyebrow="Your agent"
        id="features"
        title="Then Claude builds with it, the way you would."
    >
        <div className="grid gap-4 md:grid-cols-2">
            <Feature
                description="13px type, two weights, controls on 34 and 38px, hairlines instead of boxes."
                index={0}
                name="Density"
                title="Fit the working day on one screen."
            >
                <DensityShot />
            </Feature>
            <Feature
                description="Change the accent and the file Claude reads changes with it."
                index={1}
                name="DESIGN.md"
                title="Turn your theme into a brief."
            >
                <BriefShot />
            </Feature>
            <Feature
                description="Two control heights and one action colour, in light and dark. Press export and the toast answers in the other mode."
                index={2}
                name="Light and dark"
                title="Every decision holds in both modes."
            >
                <ComponentsShot />
            </Feature>
            <Feature
                description="Continuum's MCP server hands the rules, your theme and a review of any screen to Claude Code, Cursor or Claude Desktop."
                index={3}
                name="MCP"
                title="Ask Continuum from any agent."
            >
                <McpShot />
            </Feature>
        </div>
    </Section>
);
