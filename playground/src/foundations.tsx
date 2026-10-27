import {
    Badge,
    Button,
    cn,
    Dock,
    DockItem,
    Field,
    FieldLabel,
    Input,
    NavItem,
    Tabs,
    TabsList,
    TabsTrigger,
    Theme,
} from 'continuum';
import {
    Activity,
    ChevronDown,
    FileText,
    Inbox,
    MousePointerClick,
    Palette,
    Rows3,
    Settings,
    SquareDashed,
    Type as TypeIcon,
} from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { Article, ArticleSection, C, column, Figure, frame, H, P, showcase } from './article';
import { Page, PageDock, PageHeader, scrollToSection, usePageIndex, useScrollSpy } from './layout';
import type { AppState } from './meta';
import { readBackground, readFont, readFontFamily, useResolved } from './resolve';
import { KnobStage } from './showcase/detail';
import type { Knob, PreviewProps } from './showcase/previews';

const icon = { strokeWidth: 2 } as const;

/*
 * The foundations read like a post on the blog: each one's heading, its specimen
 * on a stage with its knobs over it, then headed paragraphs in a reading column.
 * A figure is a stage, a list or a table, never a loose collection of parts, and
 * text never sits in a card. Every value is read off the page, so the theme and
 * mode on preview show through.
 */

/* ---------- Colour data ---------- */

const steps = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as const;

// Written out in full so Tailwind finds every class.
const ramps = {
    neutral: [
        'bg-neutral-50',
        'bg-neutral-100',
        'bg-neutral-200',
        'bg-neutral-300',
        'bg-neutral-400',
        'bg-neutral-500',
        'bg-neutral-600',
        'bg-neutral-700',
        'bg-neutral-800',
        'bg-neutral-900',
        'bg-neutral-950',
    ],
    primary: [
        'bg-primary-50',
        'bg-primary-100',
        'bg-primary-200',
        'bg-primary-300',
        'bg-primary-400',
        'bg-primary-500',
        'bg-primary-600',
        'bg-primary-700',
        'bg-primary-800',
        'bg-primary-900',
        'bg-primary-950',
    ],
    success: [
        'bg-success-50',
        'bg-success-100',
        'bg-success-200',
        'bg-success-300',
        'bg-success-400',
        'bg-success-500',
        'bg-success-600',
        'bg-success-700',
        'bg-success-800',
        'bg-success-900',
        'bg-success-950',
    ],
    warning: [
        'bg-warning-50',
        'bg-warning-100',
        'bg-warning-200',
        'bg-warning-300',
        'bg-warning-400',
        'bg-warning-500',
        'bg-warning-600',
        'bg-warning-700',
        'bg-warning-800',
        'bg-warning-900',
        'bg-warning-950',
    ],
    error: [
        'bg-error-50',
        'bg-error-100',
        'bg-error-200',
        'bg-error-300',
        'bg-error-400',
        'bg-error-500',
        'bg-error-600',
        'bg-error-700',
        'bg-error-800',
        'bg-error-900',
        'bg-error-950',
    ],
} as const;

type RampName = keyof typeof ramps;

/** One step: its colour and number; pointed at, it hands up the value read off the page. */
const Swatch = ({
    className,
    step,
    onPoint,
}: {
    className: string;
    step: string;
    onPoint: (value: string) => void;
}) => {
    const [ref, hex] = useResolved(readBackground);

    return (
        <div
            className="flex min-w-0 flex-col items-center gap-1.5"
            onPointerEnter={() => onPoint(`${step} · ${hex}`)}
        >
            <div
                className={cn(
                    'h-16 w-full rounded-chip ring-1 ring-neutral-950/10 ring-inset',
                    className,
                )}
                ref={ref}
            />
            <span className="font-medium text-neutral-950 text-xxs tabular-nums">{step}</span>
        </div>
    );
};

/**
 * One ramp step by step, narrow enough to sit centred clear of the panel; a line under it
 * reads out the step being pointed at, as the blog's colour figure does.
 */
const RampStrip = ({ name }: { name: RampName }) => {
    const [pointed, setPointed] = useState<string>();

    return (
        <div className="flex w-88 flex-col gap-3" onPointerLeave={() => setPointed(undefined)}>
            <div className="grid grid-cols-11 gap-1">
                {ramps[name].map((className, i) => (
                    <Swatch
                        className={className}
                        key={className}
                        onPoint={setPointed}
                        step={steps[i] ?? ''}
                    />
                ))}
            </div>
            <span className="text-center text-neutral-500 text-xs tabular-nums">
                {pointed ? `${name}-${pointed}` : 'Point at a step to read its value.'}
            </span>
        </div>
    );
};

/* ---------- Colour ---------- */

const ColourBody = () => (
    <Article>
        <H>Picked by what the step means</H>
        <P>
            A colour is never picked by how it looks. <C>neutral-50</C> is the surface, <C>100</C>{' '}
            the canvas and muted fills, <C>200</C> the hairline, <C>300</C> a hover border,{' '}
            <C>500</C> a placeholder, <C>600</C> secondary text and <C>950</C> primary text.
        </P>
        <P>
            Dark mode reads every ramp back to front, so the same class is right in both modes and
            components never carry a dark variant. There are no hex values in components, no
            Tailwind palette and no white. The one exception is the scrim behind a dialog, which
            must not flip.
        </P>

        <H>One action colour, one primary action per view</H>
        <P>
            The primary button, checked controls, the active rail item and the logo mark take the
            action colour. Everything else is secondary, outlined, or ghost. By default the action
            is near-black; a theme can make it the accent and light it, and every control follows,
            because they all read the same token.
        </P>

        <H>Selection is a wash, not a colour</H>
        <P>
            A hovered or selected row takes a 5% wash of the text colour, a table row on hover 3%.
            Pill tabs and an own chat message take the tint, a translucent wash by default, so it
            reads on the surface and on the canvas alike.
        </P>
        <SelectionFigure />

        <H>Status colours</H>
        <P>
            A coloured component takes its text from step <C>700</C> and its fill from step{' '}
            <C>500</C> of the same ramp at 20%, so the fill adapts to whatever it sits on, in light
            and dark. Dots and solid fills take <C>500</C>; icons and delta text take <C>600</C>.
            Badges are filled, never outlined.
        </P>
        <P>
            Status colours mean status. The primary ramp is for information and the assistant, not
            for emphasis.
        </P>
        <StatusFigure />
    </Article>
);

/** The same selection on a surface and on the canvas: a translucent wash reads on both. */
const SelectionFigure = () => (
    <Figure caption="The same rows and tabs on a surface and on the canvas: the selected row takes a 5% wash, the active tab the tint, and both read on either.">
        <div className={cn(frame, 'grid sm:grid-cols-2')}>
            {[
                { label: 'On a surface', className: 'bg-neutral-50' },
                { label: 'On the canvas', className: 'bg-neutral-100' },
            ].map(({ label, className }) => (
                <div
                    className={cn('flex flex-col justify-center gap-6 px-8 py-12', className)}
                    inert
                    key={label}
                >
                    <span className="text-neutral-500 text-xxs">{label}</span>
                    <div className="flex flex-col gap-0.5">
                        <NavItem icon={<Inbox {...icon} />}>Inbox</NavItem>
                        <NavItem icon={<FileText {...icon} />}>Drafts</NavItem>
                        <NavItem active icon={<Settings {...icon} />}>
                            Settings
                        </NavItem>
                    </div>
                    <Tabs defaultValue="summary">
                        <TabsList>
                            <TabsTrigger value="summary">Summary</TabsTrigger>
                            <TabsTrigger value="sources">Sources</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            ))}
        </div>
    </Figure>
);

// Light and dark, plain and tinted: each ground set in its own mode, whatever the page's.
const grounds = [
    { label: 'Surface', className: 'bg-neutral-50', mode: 'light' },
    { label: 'Canvas', className: 'bg-neutral-100', mode: 'light' },
    { label: 'Tinted', className: 'bg-primary-100', mode: 'light' },
    { label: 'Dark surface', className: 'bg-neutral-50', mode: 'dark' },
    { label: 'Dark canvas', className: 'bg-neutral-100', mode: 'dark' },
] as const;

/** One badge on every ground: its fill takes on what is under it, its text reads on all. */
const StatusFigure = () => (
    <Figure caption="One badge on five grounds. Its fill is 500 at 20%, so it takes on what is under it, and its 700 text reads on all of them; any ramp works the same way.">
        <div className={cn(frame, 'grid grid-cols-2 sm:grid-cols-5')} inert>
            {grounds.map(({ label, className, mode }) => (
                <Theme
                    className={cn(
                        'flex flex-col items-center justify-center gap-6 px-4 py-12',
                        className,
                    )}
                    key={label}
                    mode={mode}
                >
                    <span className="text-neutral-500 text-xxs">{label}</span>
                    <Badge tone="success">Paid</Badge>
                </Theme>
            ))}
        </div>
    </Figure>
);

/* ---------- Type ---------- */

const typeScale = [
    { name: 'xxs', className: 'text-xxs' },
    { name: 'xs', className: 'text-xs' },
    { name: 'sm', className: 'text-sm' },
    { name: 'base', className: 'text-base' },
    { name: 'lg', className: 'text-lg' },
    { name: 'xl', className: 'text-xl' },
    { name: '2xl', className: 'text-2xl' },
    { name: '3xl', className: 'text-3xl' },
    { name: '4xl', className: 'text-4xl' },
    { name: '5xl', className: 'text-5xl' },
    { name: '6xl', className: 'text-6xl' },
] as const;

/** One size: its name and measure on the left, the sample beside it; the rule runs edge to edge. */
const TypeRow = ({ name, className }: (typeof typeScale)[number]) => {
    const [ref, metrics] = useResolved(readFont);

    return (
        <div className="grid items-baseline gap-x-6 gap-y-1 border-neutral-200 border-b px-5 py-4 last:border-b-0 md:grid-cols-[140px_minmax(0,1fr)]">
            <span className="flex flex-col gap-0.5 text-xxs">
                <span className="font-medium text-neutral-950">text-{name}</span>
                <span className="text-neutral-500 tabular-nums">{metrics} px</span>
            </span>
            <span
                className={cn('min-w-0 truncate font-medium text-neutral-950', className)}
                ref={ref}
            >
                Weekly sessions 12,480
            </span>
        </div>
    );
};

const TypeBody = () => {
    const [ref, family] = useResolved(readFontFamily);

    return (
        <Article>
            <H>13px, two weights, no caps</H>
            <P>
                Most UI is <C>text-xs</C>. <C>text-xxs</C>, 11px, is for badges, counts, tooltips
                and hints; <C>text-sm</C>, 14px, for input values, dialog titles and option labels.
                Larger sizes are only for headline numbers and page titles. Every size is set in{' '}
                <span ref={ref}>{family}</span>, normal 400 or medium 500, with a 0.32px tracking
                and a line height of 1.25 times the size.
            </P>

            <H>Hierarchy by colour and weight, not size</H>
            <P>
                A card title is normal and <C>neutral-600</C>; its value is medium and{' '}
                <C>neutral-950</C>. Labels are quiet, data is loud. Numbers are tabular and
                right-aligned in tables. Text that overflows truncates; it never wraps or grows the
                control.
            </P>

            <H>The scale</H>
            <P>Every size, measured off the page.</P>
            <div className="flex min-w-0 flex-col overflow-hidden rounded-card border border-neutral-200 bg-neutral-50">
                {typeScale.map(row => (
                    <TypeRow key={row.name} {...row} />
                ))}
            </div>
        </Article>
    );
};

/* ---------- Surfaces and radii ---------- */

const SurfacesBody = () => (
    <Article>
        <H>Hairlines over shadows</H>
        <P>
            Cards share the page colour and are told apart by a <C>neutral-200</C> border alone. The
            one soft shadow is for what floats: toolbars, the dock, menus, popovers, a slider knob.
            Dialogs and sheets take a slightly deeper one.
        </P>

        <H>Space, not dividers</H>
        <P>
            Sections, groups, and a header and its body are set apart by padding and margin. A
            divider is kept only where nothing else can mark an edge: rows inside a bordered table,
            segments in a toolbar, the header bar a page scrolls under, and the parts of a floating
            container, where it always runs edge to edge.
        </P>

        <H>Radii nest and stay concentric</H>
        <P>
            A panel holds cards, a card holds items, an item holds chips, each a step smaller. An
            element inset in a rounded container takes the container's radius minus the inset, so
            the curves share a centre. Every radius is a token times the corner scale, so a theme
            squares or rounds the whole system at once; avatars and switch tracks are always round.
        </P>
    </Article>
);

/* ---------- Layout ---------- */

// The panel the columns are drawn in, as on a large screen.
const panel = 1600;

const widths = [
    { name: 'default', width: 896, value: '896px', use: 'Inputs and light content' },
    { name: 'wide', width: 1080, value: '1080px', use: 'A list with several columns' },
    { name: 'dense', width: 1280, value: '1280px', use: 'A very dense table' },
    { name: 'inset', width: panel - 128, value: 'panel less 64px a side', use: 'Several tables' },
    { name: 'full', width: panel, value: 'the whole panel', use: 'Only when asked for' },
] as const;

/** Each width as a column centred in one panel: the denser the content, the wider. */
const WidthsFigure = () => (
    <Figure caption="Each column centred in a 1600px panel. Narrower than its width, a column takes the panel less a 16 to 24px gutter.">
        <div className={cn(frame, 'flex flex-col justify-center gap-2 py-12')}>
            <span
                aria-hidden
                className="absolute inset-y-0 left-1/2 border-neutral-300 border-l border-dashed"
            />
            {widths.map(({ name, width, value, use }) => (
                <div
                    className="relative mx-auto flex h-11 min-w-0 items-center justify-between gap-4 rounded-item bg-neutral-950/5 px-3 text-xs"
                    key={name}
                    style={{ width: `${(width / panel) * 100}%` }}
                >
                    <span className="flex min-w-0 items-baseline gap-2">
                        <span className="font-medium text-neutral-950">{name}</span>
                        <span className="truncate text-neutral-500 tabular-nums">{value}</span>
                    </span>
                    <span className="truncate text-neutral-600">{use}</span>
                </div>
            ))}
        </div>
    </Figure>
);

/** Spacing shaded as cells of the grid, labelled with what it measures at its own size. */
const Band = ({ className, children }: { className?: string; children?: ReactNode }) => (
    <span
        className={cn(
            'relative flex shrink-0 items-center justify-center bg-primary-500/15 font-medium text-primary-700 text-xxs tabular-nums',
            className,
        )}
    >
        {children}
    </span>
);

// Drawn at twice its size, so each 4px step of the grid is 8px on screen.
const grid = {
    backgroundImage:
        'linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)',
    backgroundSize: '8px 8px',
};

/** A card at twice its size on the 4px grid, its padding and gaps shaded and measured. */
const GridFigure = () => (
    <Figure caption="A card at twice its size on the 4px grid: its padding is four steps, the gap under its label three, the gap beside its icon two.">
        <div className={cn(frame, 'flex items-center justify-center px-8 py-12')}>
            <div className="relative flex w-96 flex-col rounded-[calc(var(--radius-card)*2)] border-2 border-neutral-200 bg-neutral-50 p-8 [--grid-line:color-mix(in_oklab,var(--color-neutral-950)_7%,transparent)]">
                <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-[calc(var(--radius-card)*2-2px)]"
                    style={grid}
                />
                <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-[calc(var(--radius-card)*2-2px)] border-32 border-primary-500/15"
                />
                <span className="absolute inset-x-0 top-0 flex h-8 items-center justify-center font-medium text-primary-700 text-xxs tabular-nums">
                    16
                </span>
                {/* The parts at twice their size; the spacing between them drawn as it measures. */}
                <div className="relative flex items-center">
                    <span className="flex text-neutral-600" style={{ zoom: 2 }}>
                        <Activity {...icon} className="size-4" />
                    </span>
                    <Band className="h-8 w-4">8</Band>
                    <span className="text-neutral-600 text-xs" style={{ zoom: 2 }}>
                        Sessions
                    </span>
                </div>
                <Band className="h-6">12</Band>
                <span
                    className="relative font-medium text-2xl text-neutral-950 tabular-nums"
                    style={{ zoom: 2 }}
                >
                    12,480
                </span>
            </div>
        </div>
    </Figure>
);

const LayoutBody = () => (
    <Article>
        <H>A centred column, as wide as the content is dense</H>
        <P>
            Content sits in a centred column and never runs to the panel's edges. Below each width
            the column takes the panel less a gutter, so it is responsive by default.
        </P>
        <WidthsFigure />

        <H>A 4px grid</H>
        <P>
            Every gap and padding is a step of Tailwind's spacing scale, a multiple of{' '}
            <C>--spacing</C>.
        </P>
        <GridFigure />
    </Article>
);

/* ---------- States ---------- */

const StatesBody = () => (
    <Article>
        <H>The same states on every control</H>
        <P>
            Focus is a 2px outline in the focus colour, offset by 2px; inside a clipping container
            it moves inside. Hover darkens a border from <C>200</C> to <C>300</C> and text from{' '}
            <C>600</C> to <C>800</C>, or adds the 5% wash. Disabled is 50% opacity with no pointer
            events. Invalid is an <C>error-500</C> border with error icons and placeholder.
        </P>

        <H>Icons</H>
        <P>
            Icons are lucide at stroke 2: 16px by default, 12px in badges and chips. They take the
            colour of the text beside them, or <C>neutral-600</C> when they lead a control.
        </P>

        <H>Motion</H>
        <P>
            Colour changes take 150ms with an explicit property list; popups enter in 200ms from a
            small offset and fade out. Nothing bounces, nothing takes longer than 250ms, and motion
            is off for people who ask for less of it.
        </P>
        <Figure caption="Read off the page: a menu or a dialog enters in 200ms on a strong ease-out, from 95% or 8px below; a colour changes in 150ms. Slow it down to see the curve.">
            <KnobStage
                className={showcase}
                compact
                knobs={motionKnobs}
                render={values => <MotionStage knobs={values} />}
            />
        </Figure>
    </Article>
);

/* ---------- The stages: one specimen per foundation, its knobs over it ---------- */

const o = (value: string, label = value) => ({ value, label });

const rampKnobs: Knob[] = [
    {
        id: 'ramp',
        label: 'Ramp',
        options: (Object.keys(ramps) as RampName[]).map(name =>
            o(name, name.charAt(0).toUpperCase() + name.slice(1)),
        ),
        default: 'primary',
    },
];

/** One ramp: every step with its number, and the value of the one pointed at. */
const RampStage = ({ knobs }: PreviewProps) => {
    const name = (String(knobs.ramp) in ramps ? knobs.ramp : 'primary') as RampName;

    return <RampStrip key={name} name={name} />;
};

const surfaceKnobs: Knob[] = [
    {
        id: 'corners',
        label: 'Corner scale',
        options: [o('0', '0%'), o('0.5', '50%'), o('1', '100%'), o('1.5', '150%')],
        default: '1',
    },
];

/** A panel holding a card holding an item holding a chip: the radii nesting, at any corner scale. */
const SurfaceStage = ({ knobs }: PreviewProps) => (
    <Theme className="contents" radius={Number(knobs.corners)}>
        <div className="flex w-80 max-w-full flex-col items-start gap-3 rounded-panel border border-neutral-200 bg-neutral-100 p-4">
            <Badge>panel</Badge>
            <div className="flex w-full flex-col gap-3 rounded-card border border-neutral-200 bg-neutral-50 p-4">
                <Badge className="self-start">card</Badge>
                <div className="flex items-center gap-3">
                    <div className="flex h-9 flex-1 items-center gap-2 rounded-item bg-neutral-950/5 px-2">
                        <Badge className="bg-neutral-50">chip</Badge>
                        <span className="text-neutral-600 text-xs">item</span>
                    </div>
                    <Button tabIndex={-1}>control</Button>
                </div>
            </div>
        </div>
    </Theme>
);

const stateKnobs: Knob[] = [
    {
        id: 'state',
        label: 'State',
        options: [
            o('rest', 'At rest'),
            o('focus', 'Focused'),
            o('disabled', 'Disabled'),
            o('invalid', 'Invalid'),
        ],
        default: 'focus',
    },
];

/** The same states on every control: a field and a button in one of them. */
const StatesStage = ({ knobs }: PreviewProps) => {
    const state = knobs.state;
    const focus =
        state === 'focus' ? 'outline-2 outline-focus outline-offset-2 outline-solid' : undefined;

    return (
        <div className="flex items-end gap-4" key={String(state)}>
            <Field className="w-56" disabled={state === 'disabled'} invalid={state === 'invalid'}>
                <FieldLabel>Work email</FieldLabel>
                <Input className={focus} defaultValue="ana@northwind" size="sm" />
            </Field>
            <Button className={focus} disabled={state === 'disabled'} tabIndex={-1}>
                Save
            </Button>
        </div>
    );
};

// The classes each motion has in the library, so its values can be read off the page.
const motions = {
    menu: { name: 'Menu', classes: 'transition-[opacity,scale] duration-200 ease-out-strong' },
    dialog: {
        name: 'Dialog',
        classes: 'transition-[opacity,translate] duration-200 ease-out-strong',
    },
    colour: { name: 'Colour', classes: 'transition-colors duration-150' },
} as const;

type MotionName = keyof typeof motions;

/** A transition's duration and curve, as the page resolves them. */
const readMotion = (node: HTMLElement) => {
    const style = getComputedStyle(node);
    return `${style.transitionDuration}|${style.transitionTimingFunction}`;
};

/** The first duration in milliseconds, and the curve's four numbers. */
const parseMotion = (value: string) => {
    const [duration = '', timing = ''] = value.split('|');
    const first = duration.split(',')[0]?.trim() ?? '';
    const ms = Number.parseFloat(first) * (first.endsWith('ms') ? 1 : 1000);
    const numbers =
        timing
            .match(/-?[\d.]+/g)
            ?.slice(0, 4)
            .map(Number) ?? [];
    // A keyword rather than a curve reads as CSS's own ease.
    const curve = numbers.length === 4 ? numbers : [0.25, 0.1, 0.25, 1];

    return { ms: Number.isFinite(ms) ? Math.round(ms) : 0, curve };
};

const plot = { width: 352, height: 112 };

/** The curve as progress over time, with a dot running along it whenever the motion plays. */
const MotionCurve = ({ curve, on, time }: { curve: number[]; on: boolean; time: number }) => {
    const [x1 = 0, y1 = 0, x2 = 1, y2 = 1] = curve;
    const { width, height } = plot;
    const run = `${on ? time : 0}ms`;

    return (
        <div className="relative" style={{ height }}>
            <svg
                aria-hidden="true"
                className="absolute inset-0 overflow-visible"
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                width={width}
            >
                <path className="stroke-neutral-200" d={`M0 0V${height}H${width}`} fill="none" />
                <path
                    className="stroke-neutral-950"
                    d={`M0 ${height}C${x1 * width} ${(1 - y1) * height} ${x2 * width} ${(1 - y2) * height} ${width} 0`}
                    fill="none"
                    strokeWidth={2}
                />
            </svg>
            {/* Across at an even pace and up along the curve, so the dot traces it exactly. */}
            <span
                className="absolute -bottom-1.5 -left-1.5 transition-[translate] ease-linear motion-reduce:transition-none"
                style={{ translate: on ? `${width}px 0` : '0 0', transitionDuration: run }}
            >
                <span
                    className="block size-3 rounded-full bg-primary-500 transition-[translate] motion-reduce:transition-none"
                    style={{
                        translate: on ? `0 ${-height}px` : '0 0',
                        transitionDuration: run,
                        transitionTimingFunction: `cubic-bezier(${curve.join(', ')})`,
                    }}
                />
            </span>
        </div>
    );
};

const motionKnobs: Knob[] = [
    {
        id: 'motion',
        label: 'Motion',
        options: (Object.keys(motions) as MotionName[]).map(name => o(name, motions[name].name)),
        default: 'menu',
    },
    { id: 'slow', label: 'Slow motion', switch: true, default: false },
    { id: 'reduced', label: 'Reduced motion', switch: true, default: false },
];

/** One motion on a loop: its curve and duration read off the page, and the thing it moves. */
const MotionStage = ({ knobs }: PreviewProps) => {
    const name = (String(knobs.motion) in motions ? knobs.motion : 'menu') as MotionName;

    return (
        <MotionSpecimen
            key={name}
            name={name}
            reduced={Boolean(knobs.reduced)}
            slow={Boolean(knobs.slow)}
        />
    );
};

const MotionSpecimen = ({
    name,
    slow,
    reduced,
}: {
    name: MotionName;
    slow: boolean;
    reduced: boolean;
}) => {
    const [probe, value] = useResolved<HTMLSpanElement>(readMotion);
    const { ms, curve } = parseMotion(value);
    const [on, setOn] = useState(false);
    // Five times slower to see the curve; instant with reduced motion, as in the library.
    const time = reduced ? 0 : ms * (slow ? 5 : 1);
    const timing = {
        transitionDuration: `${time}ms`,
        transitionTimingFunction: `cubic-bezier(${curve.join(', ')})`,
    };

    useEffect(() => {
        const timer = window.setTimeout(() => setOn(shown => !shown), time + (on ? 1200 : 600));
        return () => window.clearTimeout(timer);
    }, [on, time]);

    return (
        <div className="flex w-88 max-w-full flex-col gap-6">
            <span
                aria-hidden
                className={cn('invisible absolute', motions[name].classes)}
                ref={probe}
            />
            <MotionCurve curve={curve} on={on} time={time} />
            <div className="flex items-baseline justify-between gap-4 text-xs">
                <span className="font-medium text-neutral-950">{motions[name].name}</span>
                <span className="truncate text-neutral-500 tabular-nums">
                    {ms}ms · cubic-bezier({curve.join(', ')})
                </span>
            </div>
            <div className="relative h-36">
                {name === 'menu' && (
                    <>
                        <Button tabIndex={-1} variant="secondary">
                            Sort <ChevronDown {...icon} />
                        </Button>
                        <div
                            className={cn(
                                'absolute top-10 left-0 flex w-44 origin-top-left flex-col gap-1 rounded-item border border-neutral-200 bg-neutral-50 p-1 shadow-float transition-[opacity,scale] motion-reduce:transition-none',
                                on ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
                            )}
                            style={timing}
                        >
                            {['Newest first', 'Oldest first', 'Name'].map((label, index) => (
                                <span
                                    className={cn(
                                        'flex h-8 items-center rounded-item px-2 font-medium text-neutral-950 text-xs',
                                        index === 0 && 'bg-neutral-950/5',
                                    )}
                                    key={label}
                                >
                                    {label}
                                </span>
                            ))}
                        </div>
                    </>
                )}
                {name === 'dialog' && (
                    <div className="flex h-full items-center justify-center">
                        <div
                            className={cn(
                                'w-72 rounded-card border border-neutral-200 bg-neutral-50 p-4 shadow-sheet transition-[opacity,translate] motion-reduce:transition-none',
                                on ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
                            )}
                            style={timing}
                        >
                            <p className="font-medium text-neutral-950 text-sm">
                                Archive this report?
                            </p>
                            <p className="mt-1 text-neutral-600 text-xs">
                                You can restore it from the archive.
                            </p>
                            <div className="mt-4 flex justify-end gap-2">
                                <Button tabIndex={-1} variant="secondary">
                                    Cancel
                                </Button>
                                <Button tabIndex={-1}>Archive</Button>
                            </div>
                        </div>
                    </div>
                )}
                {name === 'colour' && (
                    <div className="flex h-full flex-col justify-center gap-0.5">
                        <span className="flex h-8 items-center gap-2 rounded-item px-2 text-neutral-600 text-xs">
                            <Inbox {...icon} className="size-4" /> Inbox
                        </span>
                        <span
                            className={cn(
                                'flex h-8 items-center gap-2 rounded-item px-2 text-xs transition-colors motion-reduce:transition-none',
                                on ? 'bg-neutral-950/5 text-neutral-950' : 'text-neutral-600',
                            )}
                            style={timing}
                        >
                            <Settings {...icon} className="size-4" /> Settings
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

/* ---------- The page ---------- */

type Foundation = {
    id: string;
    name: string;
    /** Its short name in the dock. */
    short: string;
    icon: ReactNode;
    group: string;
    description: string;
    /** The specimen and its knobs; a foundation whose figure is in its article has none. */
    knobs?: readonly Knob[];
    Stage?: (props: PreviewProps) => ReactNode;
    /** The article under the stage. */
    Body: () => ReactNode;
};

const foundations: Foundation[] = [
    {
        id: 'f-colour',
        name: 'Colour',
        short: 'Colour',
        icon: <Palette {...icon} />,
        group: 'Colour',
        description: 'The step says what a colour is for; the theme says what it looks like.',
        knobs: rampKnobs,
        Stage: RampStage,
        Body: ColourBody,
    },
    {
        id: 'f-type',
        name: 'Type',
        short: 'Type',
        icon: <TypeIcon {...icon} />,
        group: 'Type',
        description: '13px, normal and medium, hierarchy by colour and weight.',
        Body: TypeBody,
    },
    {
        id: 'f-surfaces',
        name: 'Surfaces and radii',
        short: 'Surfaces',
        icon: <SquareDashed {...icon} />,
        group: 'Space',
        description:
            'Surfaces apart by a 1px line, sections by space; radii nest a step at a time.',
        knobs: surfaceKnobs,
        Stage: SurfaceStage,
        Body: SurfacesBody,
    },
    {
        id: 'f-layout',
        name: 'Layout',
        short: 'Layout',
        icon: <Rows3 {...icon} />,
        group: 'Space',
        description: 'A centred column as wide as the content is dense, spaced on a 4px grid.',
        Body: LayoutBody,
    },
    {
        id: 'f-states',
        name: 'States, icons and motion',
        short: 'States',
        icon: <MousePointerClick {...icon} />,
        group: 'Behaviour',
        description: 'The same focus, hover, disabled and invalid on every control; quiet motion.',
        knobs: stateKnobs,
        Stage: StatesStage,
        Body: StatesBody,
    },
];

const ids = foundations.map(entry => entry.id);

type FoundationsProps = { state: AppState };

/**
 * Every foundation on one page: each one's heading, its specimen on a stage with its knobs
 * over it, then its article. A dock floating at the foot jumps between them and follows the
 * scroll, in the bar at the foot beside the theme's pill.
 */
export const Foundations = ({ state }: FoundationsProps) => {
    const { setIndex, setActive, active } = usePageIndex();
    // Every value read off the page is read again whenever the theme, its corners or the mode change.
    const reading = `${JSON.stringify(state.theme)}-${state.radius}-${state.mode}`;

    useEffect(() => {
        setIndex(
            foundations.map(entry => ({ id: entry.id, title: entry.name, group: entry.group })),
            { label: 'Foundations' },
        );
        setActive(foundations[0]?.id);
        return () => {
            setIndex([]);
            setActive(undefined);
        };
    }, [setIndex, setActive]);

    useScrollSpy(ids, setActive);

    return (
        <Page className="gap-0">
            <div className={column}>
                <PageHeader
                    description="The handful of rules every component follows, with the tokens behind them. Every specimen takes its own properties; every value is read off the page."
                    title="Foundations"
                />
            </div>
            <div className="flex min-w-0 flex-col" key={reading}>
                {foundations.map(({ id, name, description, knobs, Stage, Body }) => (
                    <ArticleSection description={description} id={id} key={id} title={name}>
                        {Stage && (
                            <KnobStage
                                className={showcase}
                                compact
                                knobs={knobs}
                                render={values => <Stage knobs={values} />}
                            />
                        )}
                        <Body />
                    </ArticleSection>
                ))}
            </div>
            {/* The sections as a dock, in the bar at the foot beside the theme's pill. */}
            <PageDock>
                <Dock
                    aria-label="Foundations"
                    onValueChange={scrollToSection}
                    value={active ?? ids[0]}
                >
                    {foundations.map(entry => (
                        <DockItem key={entry.id} value={entry.id}>
                            {entry.icon}
                            {entry.short}
                        </DockItem>
                    ))}
                </Dock>
            </PageDock>
        </Page>
    );
};
