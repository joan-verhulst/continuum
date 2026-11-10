import { Overview } from '@screens/overview';
import { Button, cn, focusRing } from 'continuum';
import {
    ArrowRight,
    Bell,
    Calendar,
    ChevronDown,
    ChevronsLeftRight,
    ChevronsUpDown,
    CircleAlert,
    CreditCard,
    FileText,
    HelpCircle,
    Inbox,
    LayoutDashboard,
    Search,
    Settings,
    Ticket,
    TrendingDown,
    TrendingUp,
    UserPlus,
    UserRoundX,
    Users,
} from 'lucide-react';
import {
    animate,
    motion,
    useInView,
    useMotionValue,
    useMotionValueEvent,
    useReducedMotion,
    useTransform,
} from 'motion/react';
import {
    type CSSProperties,
    type KeyboardEvent,
    type PointerEvent,
    type ReactNode,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { ease, Reveal, Section, Shot, Window } from '../web';

/*
 * The fair test: one prompt, word for word, run twice with only the skill changed, and the two
 * outputs under one drag divider at their real size. Both are drawn at the 1280px the screens are
 * laid out for and cropped by the window, never scaled, so 13px stays 13px.
 *
 * PLACEHOLDER until the real run: the whole left side. The right is the playground's own Overview
 * screen, live in the page's theme; the left is a hand-built stand-in for what plain Claude makes of
 * the same content (the default shadcn look: a purple primary, a gradient header, cards on cards,
 * mixed weights, loose 16px everything). Replace it with the unedited output once the run in code exists.
 */

/* ---------- The stand-in for plain Claude ---------- */

// PLACEHOLDER until the real run. Off-system on purpose: these are the values a default Tailwind and
// shadcn setup reaches for (zinc greys, violet, emerald), kept here as variables so the drawing below
// reads as one look.
const plainPalette = {
    '--pc-bg': '#09090b',
    '--pc-side': '#0f0f12',
    '--pc-card': '#18181b',
    '--pc-inner': '#232327',
    '--pc-line': '#27272a',
    '--pc-fg': '#fafafa',
    '--pc-muted': '#a1a1aa',
    '--pc-faint': '#71717a',
    '--pc-violet': '#8b5cf6',
    '--pc-violet-strong': '#7c3aed',
    '--pc-violet-soft': '#a78bfa',
    '--pc-indigo': '#4f46e5',
    '--pc-blue': '#60a5fa',
    '--pc-emerald': '#10b981',
    '--pc-emerald-soft': '#34d399',
    '--pc-orange': '#fb923c',
    '--pc-red': '#ef4444',
    '--pc-amber': '#f59e0b',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    letterSpacing: 0,
} as CSSProperties;

const gradient = 'linear-gradient(90deg, var(--pc-violet-strong), var(--pc-indigo))';

// The twelve weeks of the quarter, the same figures the right side draws.
const weeks = [41.2, 41.9, 42.3, 43.1, 43.0, 44.2, 44.9, 45.3, 46.4, 46.9, 47.6, 48.26];

/** A smooth line through the points, as a charting library's "monotone" curve draws it. */
const smooth = (points: [number, number][]) =>
    points.reduce((path, [x, y], i) => {
        if (i === 0) return `M${x},${y}`;
        const [px, py] = points[i - 1] ?? [x, y];
        const mid = (x - px) / 2;
        return `${path} C${px + mid},${py} ${x - mid},${y} ${x},${y}`;
    }, '');

const PlainChart = () => {
    const width = 490;
    const height = 232;
    const pad = { top: 8, right: 4, bottom: 24, left: 44 };
    const [min, max] = [40, 50];
    const x = (i: number) => pad.left + (i / (weeks.length - 1)) * (width - pad.left - pad.right);
    const y = (k: number) =>
        pad.top + (1 - (k - min) / (max - min)) * (height - pad.top - pad.bottom);
    const points = weeks.map((k, i) => [x(i), y(k)] as [number, number]);
    const line = smooth(points);
    const floor = height - pad.bottom;

    return (
        <svg aria-hidden="true" className="mt-6 block" height={height} width={width}>
            <defs>
                <linearGradient id="plain-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--pc-violet)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--pc-violet)" stopOpacity={0} />
                </linearGradient>
            </defs>
            {[40, 42.5, 45, 47.5, 50].map(k => (
                <g key={k}>
                    <line
                        stroke="var(--pc-line)"
                        strokeDasharray="3 3"
                        x1={pad.left}
                        x2={width - pad.right}
                        y1={y(k)}
                        y2={y(k)}
                    />
                    <text
                        dominantBaseline="middle"
                        fill="var(--pc-faint)"
                        fontSize={12}
                        textAnchor="end"
                        x={pad.left - 8}
                        y={y(k)}
                    >
                        €{k}k
                    </text>
                </g>
            ))}
            {weeks.map((_, i) => (
                <text
                    fill="var(--pc-faint)"
                    fontSize={12}
                    key={`w${i + 1}`}
                    textAnchor="middle"
                    x={x(i)}
                    y={height - 6}
                >
                    W{i + 1}
                </text>
            ))}
            <path
                d={`${line} L${x(weeks.length - 1)},${floor} L${x(0)},${floor} Z`}
                fill="url(#plain-fill)"
            />
            <path
                d={line}
                fill="none"
                stroke="var(--pc-violet)"
                strokeLinecap="round"
                strokeWidth={2.5}
            />
            {points.map(([px, py]) => (
                <circle
                    cx={px}
                    cy={py}
                    fill="var(--pc-violet)"
                    key={px}
                    r={3.5}
                    stroke="var(--pc-card)"
                    strokeWidth={2}
                />
            ))}
        </svg>
    );
};

const plainNav = [
    { label: 'Overview', icon: LayoutDashboard, active: true },
    { label: 'Customers', icon: Users },
    { label: 'Invoices', icon: FileText },
    { label: 'Reports', icon: TrendingUp },
    { label: 'Inbox', icon: Inbox, count: 4 },
];

const plainStats = [
    {
        label: 'Active Customers',
        value: '1,284',
        delta: '+3.2%',
        icon: Users,
        tint: 'var(--pc-violet-soft)',
    },
    {
        label: 'New Customers',
        value: '86',
        delta: '+12',
        icon: UserPlus,
        tint: 'var(--pc-blue)',
    },
    {
        label: 'Churn Rate',
        value: '1.9%',
        delta: '-0.4 pt',
        icon: UserRoundX,
        tint: 'var(--pc-orange)',
        down: true,
    },
    {
        label: 'Open Tickets',
        value: '23',
        delta: '+5',
        icon: Ticket,
        tint: 'var(--pc-emerald-soft)',
    },
];

const plainActivity = [
    {
        title: 'Tyrell & Co started on the Starter plan',
        time: '12 minutes ago',
        icon: UserPlus,
        tint: 'var(--pc-emerald-soft)',
    },
    {
        title: 'Northwind Traders upgraded to Enterprise',
        time: '1 hour ago',
        icon: CreditCard,
        tint: 'var(--pc-violet-soft)',
    },
    {
        title: 'Payment from Initech failed',
        time: '3 hours ago',
        icon: CircleAlert,
        tint: 'var(--pc-red)',
    },
    {
        title: 'Cyberdyne cancelled their plan',
        time: 'Yesterday',
        icon: UserRoundX,
        tint: 'var(--pc-amber)',
    },
];

const plainPlans = [
    { name: 'Enterprise', value: '€28,400', share: 59 },
    { name: 'Pro', value: '€15,900', share: 33 },
    { name: 'Starter', value: '€3,960', share: 8 },
];

/** A soft circle or square in an icon's own colour at a tenth: the rainbow of chips. */
const tinted = (colour: string): CSSProperties => ({
    color: colour,
    backgroundColor: `color-mix(in srgb, ${colour} 12%, transparent)`,
});

const PlainCard = ({ className, children }: { className?: string; children: ReactNode }) => (
    <div
        className={cn(
            'rounded-[12px] border border-(--pc-line) bg-(--pc-card) p-6 shadow-[0_1px_3px_rgb(0_0_0/0.3)]',
            className,
        )}
    >
        {children}
    </div>
);

/** What plain Claude tends to build from the same prompt. PLACEHOLDER until the real run. */
const PlainOverview = () => (
    <div
        className="flex h-full w-7xl bg-(--pc-bg) text-(--pc-fg) text-[14px] leading-[20px]"
        style={plainPalette}
    >
        <aside className="flex w-64 shrink-0 flex-col border-(--pc-line) border-r bg-(--pc-side)">
            <div className="flex h-16 items-center gap-3 border-(--pc-line) border-b px-6">
                <span
                    className="grid size-8 place-items-center rounded-[8px] font-[700] text-[14px] text-white"
                    style={{ backgroundImage: gradient }}
                >
                    A
                </span>
                <span className="font-[600] text-[16px]">Acme Inc.</span>
                <ChevronDown className="ml-auto size-4 text-(--pc-faint)" />
            </div>
            <nav className="flex flex-col gap-1 p-4">
                {plainNav.map(item => (
                    <span
                        className={cn(
                            'flex h-10 items-center gap-3 rounded-[8px] px-3 font-[500]',
                            item.active
                                ? 'bg-(--pc-violet-strong) text-white shadow-[0_8px_20px_-6px_rgb(124_58_237/0.6)]'
                                : 'text-(--pc-muted)',
                        )}
                        key={item.label}
                    >
                        <item.icon className="size-5" />
                        {item.label}
                        {item.count && (
                            <span className="ml-auto rounded-full bg-(--pc-violet) px-2 py-0.5 font-[600] text-[12px] text-white leading-[16px]">
                                {item.count}
                            </span>
                        )}
                    </span>
                ))}
                <span className="mt-6 mb-2 px-3 font-[600] text-(--pc-faint) text-[12px] uppercase tracking-[0.08em]">
                    Workspace
                </span>
                <span className="flex h-10 items-center gap-3 rounded-[8px] px-3 font-[500] text-(--pc-muted)">
                    <Settings className="size-5" />
                    Settings
                </span>
                <span className="flex h-10 items-center gap-3 rounded-[8px] px-3 font-[500] text-(--pc-muted)">
                    <HelpCircle className="size-5" />
                    Help & Support
                </span>
            </nav>
            <div className="mt-auto border-(--pc-line) border-t p-4">
                <div className="flex items-center gap-3 rounded-[8px] bg-(--pc-inner) p-3">
                    <span
                        className="grid size-9 place-items-center rounded-full font-[600] text-[13px] text-white"
                        style={{ backgroundImage: gradient }}
                    >
                        AI
                    </span>
                    <span className="flex flex-col">
                        <span className="font-[600]">Acme Inc.</span>
                        <span className="text-(--pc-faint) text-[12px]">Pro Plan</span>
                    </span>
                    <ChevronsUpDown className="ml-auto size-4 text-(--pc-faint)" />
                </div>
            </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex h-16 shrink-0 items-center justify-between border-(--pc-line) border-b px-8">
                <span className="flex h-10 w-80 items-center gap-2 rounded-[8px] border border-(--pc-line) bg-(--pc-card) px-3 text-(--pc-faint)">
                    <Search className="size-4" />
                    Search...
                    <span className="ml-auto rounded-[4px] border border-(--pc-line) px-1.5 text-[12px]">
                        ⌘K
                    </span>
                </span>
                <span className="flex items-center gap-4">
                    <span className="relative grid size-10 place-items-center rounded-full text-(--pc-muted)">
                        <Bell className="size-5" />
                        <span className="absolute top-2 right-2.5 size-2 rounded-full bg-(--pc-red)" />
                    </span>
                    <span className="grid size-9 place-items-center rounded-full bg-(--pc-inner) font-[600] text-[13px]">
                        AC
                    </span>
                </span>
            </header>

            <main className="flex flex-col gap-8 p-8">
                <div
                    className="flex items-center justify-between rounded-[16px] p-8 text-white shadow-[0_20px_40px_-16px_rgb(124_58_237/0.5)]"
                    style={{ backgroundImage: gradient }}
                >
                    <div className="flex flex-col gap-2">
                        <p className="font-[700] text-[30px] leading-[36px]">Overview</p>
                        <p className="text-[16px] text-white/80">
                            How the workspace is doing this quarter.
                        </p>
                    </div>
                    <span className="flex h-10 items-center gap-2 rounded-[8px] border border-white/20 bg-white/10 px-4 font-[500]">
                        <Calendar className="size-4" />
                        This Quarter
                        <ChevronDown className="size-4" />
                    </span>
                </div>

                <div className="grid grid-cols-4 gap-6">
                    {plainStats.map(stat => (
                        <PlainCard key={stat.label}>
                            <div className="flex items-start justify-between">
                                <span className="font-[500] text-(--pc-muted)">{stat.label}</span>
                                <span className="rounded-[8px] p-2" style={tinted(stat.tint)}>
                                    <stat.icon className="size-5" />
                                </span>
                            </div>
                            <p className="mt-2 font-[700] text-[30px] leading-[36px]">
                                {stat.value}
                            </p>
                            <p className="mt-2 flex items-center gap-1 text-(--pc-faint)">
                                <span
                                    className="flex items-center gap-1 font-[600]"
                                    style={{
                                        color: stat.down ? 'var(--pc-red)' : 'var(--pc-emerald)',
                                    }}
                                >
                                    {stat.down ? (
                                        <TrendingDown className="size-4" />
                                    ) : (
                                        <TrendingUp className="size-4" />
                                    )}
                                    {stat.delta}
                                </span>
                                from last quarter
                            </p>
                        </PlainCard>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-6">
                    <PlainCard className="col-span-4">
                        <div className="flex items-start justify-between">
                            <div className="flex flex-col gap-1">
                                <p className="font-[600] text-[18px] leading-[28px]">
                                    Monthly Recurring Revenue
                                </p>
                                <p className="text-(--pc-muted)">Week by week this quarter</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="font-[700] text-[24px] leading-[32px]">
                                    €48,260
                                </span>
                                <span
                                    className="rounded-full px-2.5 py-0.5 font-[600] text-[12px]"
                                    style={tinted('var(--pc-emerald-soft)')}
                                >
                                    +17.1%
                                </span>
                            </div>
                        </div>
                        <PlainChart />
                    </PlainCard>
                    <PlainCard className="col-span-3">
                        <div className="flex items-center justify-between">
                            <p className="font-[600] text-[18px] leading-[28px]">Recent Activity</p>
                            <span className="flex items-center gap-1 font-[500] text-(--pc-violet-soft)">
                                View all
                                <ArrowRight className="size-4" />
                            </span>
                        </div>
                        <ul className="mt-6 flex flex-col gap-4">
                            {plainActivity.map(item => (
                                <li
                                    className="flex items-center gap-4 rounded-[8px] bg-(--pc-inner) p-3"
                                    key={item.title}
                                >
                                    <span
                                        className="grid size-10 shrink-0 place-items-center rounded-full"
                                        style={tinted(item.tint)}
                                    >
                                        <item.icon className="size-5" />
                                    </span>
                                    <span className="flex min-w-0 flex-col gap-0.5">
                                        <span className="truncate font-[500]">{item.title}</span>
                                        <span className="text-(--pc-faint) text-[12px]">
                                            {item.time}
                                        </span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </PlainCard>
                </div>

                <PlainCard>
                    <p className="font-[600] text-[18px] leading-[28px]">Revenue by Plan</p>
                    <ul className="mt-6 flex flex-col gap-5">
                        {plainPlans.map(plan => (
                            <li className="flex flex-col gap-2" key={plan.name}>
                                <span className="flex justify-between">
                                    <span className="font-[500]">{plan.name}</span>
                                    <span className="font-[600]">{plan.value}</span>
                                </span>
                                <span className="h-2 overflow-hidden rounded-full bg-(--pc-inner)">
                                    <span
                                        className="block h-full rounded-full"
                                        style={{
                                            width: `${plan.share}%`,
                                            backgroundImage: gradient,
                                        }}
                                    />
                                </span>
                            </li>
                        ))}
                    </ul>
                </PlainCard>
            </main>
        </div>
    </div>
);

/* ---------- The comparison ---------- */

const clamp = (value: number) => Math.min(100, Math.max(0, value));

// Where the divider rests until it is measured: a little left of the Continuum page's title, so that
// side shows its whole column and the plain side its sidebar. The hint then swings it this far over
// the plain page and back.
const start = 26;
const swing = 32;

/**
 * The two outputs stacked at 1:1, the right one cut away left of the divider. Drag anywhere on it,
 * or focus the handle and use the arrow keys. On a phone both shift left past the sidebar, by the
 * same amount, so the crop lands on the page rather than on two sidebars.
 */
const Comparison = () => {
    const frame = useRef<HTMLDivElement>(null);
    const handle = useRef<HTMLDivElement>(null);
    const reduce = useReducedMotion();
    const position = useMotionValue(start);
    const [value, setValue] = useState(start);
    const screen = useRef<HTMLDivElement>(null);
    const rest = useRef(start);
    const touched = useRef(false);
    const inView = useInView(frame, { once: true, amount: 0.5 });

    useMotionValueEvent(position, 'change', next => setValue(Math.round(next)));
    const clip = useTransform(position, next => `inset(0 0 0 ${next}%)`);
    const left = useTransform(position, next => `${next}%`);
    // The handle stays whole at either end, while the line runs to the edge.
    const knob = useTransform(position, next => `clamp(24px, ${next}%, calc(100% - 24px))`);

    // Until it is moved, the divider rests 24px left of the Continuum page's title, wherever the
    // crop puts it at this width.
    useLayoutEffect(() => {
        const element = frame.current;
        if (!element) return;
        const place = () => {
            const bounds = element.getBoundingClientRect();
            const title = screen.current?.querySelector('h1')?.getBoundingClientRect();
            if (touched.current || !title || bounds.width === 0) return;
            rest.current = clamp(((title.left - bounds.left - 24) / bounds.width) * 100);
            if (!position.isAnimating()) position.set(rest.current);
        };
        place();
        const observer = new ResizeObserver(place);
        observer.observe(element);
        return () => observer.disconnect();
    }, [position]);

    // Once, as it comes into view: the divider swings over the plain page and back, so it reads as
    // something to drag.
    useEffect(() => {
        if (!inView || reduce || touched.current) return;
        const from = rest.current;
        const hint = animate(position, [from, Math.min(from + swing, 90), from], {
            duration: 1.8,
            ease,
            delay: 0.4,
        });
        return () => hint.stop();
    }, [inView, reduce, position]);

    // The screens are heavy and never change; made once, so a drag only moves the clip.
    const plain = useMemo(() => <PlainOverview />, []);
    const continuum = useMemo(
        () => (
            <Shot>
                <Overview />
            </Shot>
        ),
        [],
    );

    const take = () => {
        touched.current = true;
        position.stop();
    };

    const fromPointer = (clientX: number) => {
        const rect = frame.current?.getBoundingClientRect();
        if (!rect || rect.width === 0) return;
        position.set(clamp(((clientX - rect.left) / rect.width) * 100));
    };

    const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;
        take();
        event.currentTarget.setPointerCapture(event.pointerId);
        fromPointer(event.clientX);
        handle.current?.focus({ preventScroll: true });
    };

    const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) fromPointer(event.clientX);
    };

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const step = event.shiftKey ? 10 : 5;
        const keys: Record<string, number> = {
            ArrowLeft: value - step,
            ArrowRight: value + step,
            PageDown: value - 20,
            PageUp: value + 20,
            Home: 0,
            End: 100,
        };
        const next = keys[event.key];
        if (next === undefined) return;
        event.preventDefault();
        take();
        position.set(clamp(next));
    };

    const layer = 'absolute inset-y-0 left-0 max-sm:-translate-x-[264px]';

    return (
        <Window
            bar={
                <div className="flex w-full items-center justify-between gap-3 text-xs">
                    <span className="flex min-w-0 items-baseline gap-2">
                        <span className="font-medium text-neutral-950">Claude alone</span>
                        <span className="truncate text-neutral-500 max-sm:hidden">no skill</span>
                    </span>
                    <span className="text-neutral-500 max-md:hidden">Drag to compare</span>
                    <span className="flex min-w-0 items-baseline justify-end gap-2">
                        <span className="truncate text-neutral-500 max-sm:hidden">
                            continuum-taste and your app.css
                        </span>
                        <span className="font-medium text-neutral-950">With Continuum</span>
                    </span>
                </div>
            }
            className="h-152 md:h-192"
        >
            <div
                className="absolute inset-0 cursor-ew-resize touch-pan-y select-none"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                ref={frame}
            >
                {/* Both are pictures here: nothing inside them takes focus or a click. */}
                <div aria-hidden className="absolute inset-0" inert>
                    <div className={layer}>{plain}</div>
                </div>
                <motion.div
                    aria-hidden
                    className="absolute inset-0"
                    inert
                    style={{ clipPath: clip }}
                >
                    <div className={cn(layer, 'w-7xl')} ref={screen}>
                        {continuum}
                    </div>
                </motion.div>

                <motion.div
                    className="pointer-events-none absolute inset-y-0 z-10 w-px -translate-x-1/2 bg-neutral-950/60"
                    style={{ left }}
                />
                <motion.div
                    aria-label="Divider between Claude alone and Claude with Continuum"
                    aria-valuemax={100}
                    aria-valuemin={0}
                    aria-valuenow={value}
                    aria-valuetext={`Claude alone ${value}%, with Continuum ${100 - value}%`}
                    className={cn(
                        '-translate-1/2 absolute top-1/2 z-20 grid size-10 cursor-ew-resize place-items-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-600 shadow-float',
                        focusRing,
                    )}
                    onKeyDown={onKeyDown}
                    ref={handle}
                    role="slider"
                    style={{ left: knob }}
                    tabIndex={0}
                >
                    <ChevronsLeftRight className="size-4" strokeWidth={2} />
                </motion.div>
            </div>
        </Window>
    );
};

/** Section 2: the proof in place of logos. One prompt, both outputs, one divider between them. */
export const FairTest = () => (
    <Section
        aside={
            // biome-ignore lint/a11y/useAnchorContent: the button renders its label into the link
            <Button render={<a href="/test" />} size="lg" variant="secondary">
                Read the full test
                <ArrowRight strokeWidth={2} />
            </Button>
        }
        description="Continuum helps bring those decisions together, making it easier to maintain consistency across components, layouts and entire applications. One prompt, run twice: Claude on its own, then Claude with Continuum. Drag to compare."
        eyebrow="Before and after"
        id="before-after"
        title="Good interfaces are the result of hundreds of considered decisions."
    >
        <Reveal>
            <Comparison />
        </Reveal>
    </Section>
);
