import { cn } from '@contui/ui';
import {
    ArrowRight,
    Bell,
    Bot,
    Calendar,
    ChartColumn,
    ChartPie,
    ChevronDown,
    ChevronsUpDown,
    CircleAlert,
    Clock,
    CreditCard,
    DollarSign,
    Download,
    Ellipsis,
    FileText,
    HelpCircle,
    Inbox,
    LayoutDashboard,
    Menu,
    Search,
    Settings,
    Sparkles,
    Ticket,
    TrendingDown,
    TrendingUp,
    TriangleAlert,
    UserPlus,
    UserRoundX,
    Users,
    Zap,
} from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import {
    activity,
    attention,
    byPlan,
    kpis,
    movement,
    mrr,
    nav,
    navWorkspace,
    period,
    user,
    weekLabels,
    workspace,
} from './data';

/*
 * The left of the landing's before and after: the same overview as the Continuum side, with the same
 * frozen content, built the way a coding agent builds it without a design system. A hand-built
 * stand-in for that output: the default shadcn look (zinc greys, a violet primary), a gradient banner,
 * an icon tile in every card, Title Case, 600 and 700 weights, 24px padding everywhere, cards inside
 * cards, glows, a rainbow of pills and a y-axis zoomed until growth looks steep. It should look good at
 * a glance; that is the point of the comparison.
 *
 * Narrow, it does what such a build does on a phone: the sidebar goes behind a menu button, the
 * grids fall to one column, the charts are drawn again at a phone's width. Its own width decides
 * (the `plain` container), so it follows the frame it is shown in.
 */

// The palette: the values a default Tailwind and shadcn setup reaches for, dark first, light when the
// site is light. Kept as variables (the same names the film's stand-in uses) so both modes read alike.
const palette = `
.plain-screen {
    --pc-bg: #09090b; --pc-side: #0c0c0f; --pc-card: #121215; --pc-inner: #1c1c21; --pc-line: #27272a;
    --pc-fg: #fafafa; --pc-muted: #a1a1aa; --pc-faint: #71717a;
    --pc-violet: #8b5cf6; --pc-violet-strong: #7c3aed; --pc-violet-soft: #a78bfa; --pc-indigo: #6366f1;
    --pc-blue: #60a5fa; --pc-emerald: #10b981; --pc-emerald-soft: #34d399; --pc-orange: #fb923c;
    --pc-red: #f87171; --pc-amber: #fbbf24; --pc-pink: #f472b6;
    --pc-shadow: 0 1px 3px rgb(0 0 0 / 0.4), 0 8px 24px -12px rgb(0 0 0 / 0.6);
    --pc-glow: 0 0 0 1px rgb(139 92 246 / 0.15), 0 12px 40px -12px rgb(139 92 246 / 0.45);
}
[data-mode='light'] .plain-screen {
    --pc-bg: #f8f8fb; --pc-side: #ffffff; --pc-card: #ffffff; --pc-inner: #f4f4f5; --pc-line: #e4e4e7;
    --pc-fg: #09090b; --pc-muted: #52525b; --pc-faint: #71717a;
    --pc-violet: #7c3aed; --pc-violet-strong: #7c3aed; --pc-violet-soft: #7c3aed; --pc-indigo: #4f46e5;
    --pc-blue: #2563eb; --pc-emerald: #059669; --pc-emerald-soft: #059669; --pc-orange: #ea580c;
    --pc-red: #dc2626; --pc-amber: #d97706; --pc-pink: #db2777;
    --pc-shadow: 0 1px 3px rgb(0 0 0 / 0.06), 0 8px 24px -12px rgb(0 0 0 / 0.12);
    --pc-glow: 0 0 0 1px rgb(124 58 237 / 0.08), 0 12px 40px -12px rgb(124 58 237 / 0.3);
}
`;

const gradient = 'linear-gradient(135deg, var(--pc-violet-strong), var(--pc-indigo))';

/** A soft square or circle in an icon's own colour: the rainbow of chips. */
const tinted = (colour: string, amount = 14): CSSProperties => ({
    color: colour,
    backgroundColor: `color-mix(in srgb, ${colour} ${amount}%, transparent)`,
});

const euro = (value: number) => `€${Math.round(value).toLocaleString('en-US')}`;

/** A smooth line through the points, as a charting library's "monotone" curve draws it. */
const smooth = (points: [number, number][]) =>
    points.reduce((path, [x, y], i) => {
        if (i === 0) return `M${x},${y}`;
        const [px, py] = points[i - 1] ?? [x, y];
        const mid = (x - px) / 2;
        return `${path} C${px + mid},${py} ${x - mid},${y} ${x},${y}`;
    }, '');

// MRR week by week, as the agent derives it: the start plus each week's net movement.
const mrrWeeks = movement.reduce<number[]>((list, week) => {
    const last = list.at(-1) ?? mrr.start;
    list.push(last + week.new + week.expansion + week.churn);
    return list;
}, []);
const totals = movement.reduce(
    (sum, week) => ({
        new: sum.new + week.new,
        expansion: sum.expansion + week.expansion,
        churn: sum.churn + week.churn,
    }),
    { new: 0, expansion: 0, churn: 0 },
);

const Card = ({
    className,
    glow,
    children,
}: {
    className?: string;
    glow?: boolean;
    children: ReactNode;
}) => (
    <div
        className={cn('rounded-[12px] border border-(--pc-line) bg-(--pc-card) p-6', className)}
        style={{ boxShadow: glow ? 'var(--pc-glow)' : 'var(--pc-shadow)' }}
    >
        {children}
    </div>
);

/** A card's head: a tinted icon tile, a Title Case title and its line, and something on the right. */
const CardHead = ({
    icon: Icon,
    tint,
    title,
    line,
    children,
}: {
    icon: typeof Users;
    tint: string;
    title: string;
    line?: string;
    children?: ReactNode;
}) => (
    <div className="flex @max-xl/plain:flex-wrap items-start justify-between gap-4">
        <div className="flex @max-xl/plain:min-w-0 items-center gap-3">
            <span className="grid size-10 place-items-center rounded-[10px]" style={tinted(tint)}>
                <Icon className="size-5" />
            </span>
            <div className="flex flex-col">
                <p className="font-[600] text-[18px] leading-[26px]">{title}</p>
                {line && <p className="text-(--pc-muted) text-[13px]">{line}</p>}
            </div>
        </div>
        {children}
    </div>
);

const Pill = ({ tint, children }: { tint: string; children: ReactNode }) => (
    <span
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-[600] text-[12px] leading-[18px]"
        style={tinted(tint, 16)}
    >
        {children}
    </span>
);

const navIcons = {
    overview: LayoutDashboard,
    customers: Users,
    invoices: FileText,
    reports: ChartColumn,
    inbox: Inbox,
    agent: Bot,
    settings: Settings,
    help: HelpCircle,
} as const;

const titleCase = (text: string) =>
    text.replace(/\b(\w)(\w*)/g, (word, first: string, rest: string) =>
        ['and', 'of', 'to', 'the'].includes(word) ? word : first.toUpperCase() + rest,
    );

const Sidebar = () => (
    <aside className="flex @max-5xl/plain:hidden h-full w-64 shrink-0 flex-col border-(--pc-line) border-r bg-(--pc-side)">
        <div className="flex h-16 shrink-0 items-center gap-3 border-(--pc-line) border-b px-4">
            <span
                className="grid size-9 place-items-center rounded-[10px] font-[700] text-[15px] text-white shadow-[0_4px_14px_-4px_rgb(124_58_237/0.7)]"
                style={{ backgroundImage: gradient }}
            >
                A
            </span>
            <span className="flex flex-col">
                <span className="font-[700] text-[15px] leading-[20px]">{workspace.name}</span>
                <span className="text-(--pc-faint) text-[12px] leading-[16px]">
                    {titleCase(workspace.plan)}
                </span>
            </span>
            <ChevronsUpDown className="ml-auto size-4 text-(--pc-faint)" />
        </div>
        <nav className="flex flex-col gap-1 p-4">
            <span className="mb-2 px-3 font-[600] text-(--pc-faint) text-[11px] uppercase tracking-[0.08em]">
                Main Menu
            </span>
            {nav.map(item => {
                const Icon = navIcons[item.id];
                const active = item.id === 'overview';
                return (
                    <span
                        className={cn(
                            'flex h-10 items-center gap-3 rounded-[8px] px-3 font-[500]',
                            active
                                ? 'bg-(--pc-violet-strong) text-white shadow-[0_8px_20px_-6px_rgb(124_58_237/0.6)]'
                                : 'text-(--pc-muted)',
                        )}
                        key={item.id}
                    >
                        <Icon className="size-5" />
                        {item.label}
                        {'count' in item && (
                            <span
                                className={cn(
                                    'ml-auto rounded-full px-2 py-0.5 font-[600] text-[11px] leading-[16px]',
                                    item.id === 'invoices'
                                        ? 'bg-(--pc-red) text-white'
                                        : 'bg-(--pc-violet) text-white',
                                )}
                            >
                                {item.count}
                            </span>
                        )}
                        {item.id === 'agent' && (
                            <Sparkles className="ml-auto size-4 text-(--pc-amber)" />
                        )}
                    </span>
                );
            })}
            <span className="mt-6 mb-2 px-3 font-[600] text-(--pc-faint) text-[11px] uppercase tracking-[0.08em]">
                Workspace
            </span>
            {navWorkspace.map(item => {
                const Icon = navIcons[item.id];
                return (
                    <span
                        className="flex h-10 items-center gap-3 rounded-[8px] px-3 font-[500] text-(--pc-muted)"
                        key={item.id}
                    >
                        <Icon className="size-5" />
                        {titleCase(item.label)}
                    </span>
                );
            })}
        </nav>
        <div className="mt-auto border-(--pc-line) border-t p-4">
            <div className="flex items-center gap-3 rounded-[10px] border border-(--pc-line) bg-(--pc-inner) p-3">
                <span
                    className="grid size-9 shrink-0 place-items-center rounded-full font-[600] text-[13px] text-white"
                    style={{ backgroundImage: gradient }}
                >
                    {user.initials}
                </span>
                <span className="flex min-w-0 flex-col">
                    <span className="font-[600] leading-[20px]">{user.name}</span>
                    <span className="truncate text-(--pc-faint) text-[12px] leading-[16px]">
                        {user.email}
                    </span>
                </span>
                <ChevronsUpDown className="ml-auto size-4 shrink-0 text-(--pc-faint)" />
            </div>
        </div>
    </aside>
);

const TopBar = () => (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-(--pc-line) border-b bg-(--pc-side) @max-3xl/plain:px-4 px-8">
        <span className="flex items-center gap-2 text-(--pc-faint)">
            {/* The sidebar, folded behind a menu button. */}
            <span className="@max-5xl/plain:grid hidden size-10 place-items-center rounded-[8px] border border-(--pc-line) text-(--pc-muted)">
                <Menu className="size-5" />
            </span>
            <span className="@max-xl/plain:hidden">Dashboard</span>
            <span className="@max-xl/plain:hidden">/</span>
            <span className="font-[600] text-(--pc-fg)">Overview</span>
        </span>
        <span className="flex items-center @max-xl/plain:gap-3 gap-4">
            <span className="flex @max-3xl/plain:hidden h-10 w-80 items-center gap-2 rounded-[8px] border border-(--pc-line) bg-(--pc-card) px-3 text-(--pc-faint)">
                <Search className="size-4" />
                Search anything...
                <span className="ml-auto rounded-[4px] border border-(--pc-line) bg-(--pc-inner) px-1.5 font-[500] text-[12px]">
                    ⌘K
                </span>
            </span>
            <span className="@max-3xl/plain:grid hidden size-10 place-items-center rounded-full border border-(--pc-line) text-(--pc-muted)">
                <Search className="size-5" />
            </span>
            <span className="relative grid size-10 place-items-center rounded-full border border-(--pc-line) text-(--pc-muted)">
                <Bell className="size-5" />
                <span className="absolute top-2 right-2.5 size-2 rounded-full bg-(--pc-red) ring-(--pc-side) ring-2" />
            </span>
            <span className="flex items-center gap-2">
                <span
                    className="grid size-9 place-items-center rounded-full font-[600] text-[13px] text-white ring-(--pc-violet)/40 ring-2"
                    style={{ backgroundImage: gradient }}
                >
                    {user.initials}
                </span>
                <ChevronDown className="size-4 text-(--pc-faint)" />
            </span>
        </span>
    </header>
);

const Hero = () => (
    <div
        className="relative flex shrink-0 @max-3xl/plain:flex-col @max-3xl/plain:items-start items-center justify-between @max-3xl/plain:gap-5 overflow-hidden rounded-[16px] @max-3xl/plain:px-6 px-8 @max-3xl/plain:py-6 py-7 text-white shadow-[0_20px_40px_-16px_rgb(124_58_237/0.5)]"
        style={{ backgroundImage: gradient }}
    >
        {/* The decorative blobs every banner gets. */}
        <span className="absolute -top-20 right-40 size-56 rounded-full bg-white/10 blur-2xl" />
        <span className="absolute right-8 -bottom-24 size-48 rounded-full bg-fuchsia-400/30 blur-3xl" />
        <div className="relative flex flex-col gap-2">
            <p className="font-[700] @max-xl/plain:text-[24px] text-[30px] @max-xl/plain:leading-[30px] leading-[36px]">
                Welcome back, {user.name.split(' ')[0]}! 👋
            </p>
            <p className="@max-xl/plain:text-[15px] text-[16px] text-white/80">
                Here's what's happening with {workspace.name} {period.words}.
            </p>
        </div>
        <div className="relative flex @max-xl/plain:w-full @max-xl/plain:flex-col items-center @max-xl/plain:items-stretch gap-3">
            <span className="flex h-10 items-center @max-xl/plain:justify-center gap-2 rounded-[8px] border border-white/20 bg-white/10 px-4 font-[500] backdrop-blur">
                <Calendar className="size-4" />
                {titleCase(period.label)}
                <ChevronDown className="size-4" />
            </span>
            <span className="flex h-10 items-center @max-xl/plain:justify-center gap-2 rounded-[8px] bg-white px-4 font-[600] text-[#6d28d9] shadow-lg">
                <Download className="size-4" />
                Export Report
            </span>
        </div>
    </div>
);

const kpiLook = {
    customers: { icon: Users, tint: 'var(--pc-violet-soft)' },
    new: { icon: UserPlus, tint: 'var(--pc-blue)' },
    churn: { icon: UserRoundX, tint: 'var(--pc-orange)' },
    tickets: { icon: Ticket, tint: 'var(--pc-pink)' },
} as Record<string, { icon: typeof Users; tint: string }>;

const Sparkline = ({ id, series, tint }: { id: string; series: number[]; tint: string }) => {
    const [w, h] = [104, 44];
    const min = Math.min(...series);
    const max = Math.max(...series);
    const points = series.map(
        (v, i) =>
            [(i / (series.length - 1)) * w, 4 + (1 - (v - min) / (max - min || 1)) * (h - 8)] as [
                number,
                number,
            ],
    );
    const line = smooth(points);
    return (
        <svg aria-hidden="true" className="shrink-0 overflow-visible" height={h} width={w}>
            <defs>
                <linearGradient id={`plain-spark-${id}`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={tint} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={tint} stopOpacity={0} />
                </linearGradient>
            </defs>
            <path d={`${line} L${w},${h} L0,${h} Z`} fill={`url(#plain-spark-${id})`} />
            <path d={line} fill="none" stroke={tint} strokeLinecap="round" strokeWidth={2} />
        </svg>
    );
};

const Kpis = () => (
    <div className="grid shrink-0 @max-5xl/plain:grid-cols-2 @max-xl/plain:grid-cols-1 grid-cols-4 @max-3xl/plain:gap-4 gap-6">
        {kpis.map(kpi => {
            const look = kpiLook[kpi.id] ?? { icon: Users, tint: 'var(--pc-violet-soft)' };
            const up = !kpi.delta.startsWith('−') && !kpi.delta.startsWith('-');
            const tone = kpi.good ? 'var(--pc-emerald-soft)' : 'var(--pc-red)';
            return (
                <Card className="flex flex-col" key={kpi.id}>
                    <div className="flex items-center justify-between">
                        <span className="font-[500] text-(--pc-muted)">{titleCase(kpi.label)}</span>
                        <span className="rounded-[10px] p-2" style={tinted(look.tint)}>
                            <look.icon className="size-5" />
                        </span>
                    </div>
                    <div className="mt-1 flex items-end justify-between gap-2">
                        <p className="font-[700] text-[30px] leading-[36px] tracking-[-0.02em]">
                            {kpi.value}
                        </p>
                        <Sparkline id={kpi.id} series={kpi.series} tint={look.tint} />
                    </div>
                    <span className="mt-2 flex items-center gap-2 whitespace-nowrap text-(--pc-faint) text-[13px]">
                        <Pill tint={tone}>
                            {up ? (
                                <TrendingUp className="size-3.5" />
                            ) : (
                                <TrendingDown className="size-3.5" />
                            )}
                            {kpi.delta}
                        </Pill>
                        vs last period
                    </span>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                        {kpi.facts.map(fact => (
                            <span
                                className="flex flex-col rounded-[8px] bg-(--pc-inner) px-3 py-2"
                                key={fact.label}
                            >
                                <span className="text-(--pc-faint) text-[12px] leading-[16px]">
                                    {fact.label}
                                </span>
                                <span className="font-[600] leading-[20px]">{fact.value}</span>
                            </span>
                        ))}
                    </div>
                </Card>
            );
        })}
    </div>
);

/** How a chart is drawn: wide, or at a phone's width with every third week named. */
type ChartSize = { id: string; width: number; height: number; every: number; className: string };

const wide: ChartSize = {
    id: 'wide',
    width: 680,
    height: 260,
    every: 1,
    className: '@max-xl/plain:hidden',
};
const phone: ChartSize = {
    id: 'phone',
    width: 320,
    height: 200,
    every: 3,
    className: '@max-xl/plain:block hidden',
};

/** MRR over the twelve weeks, the axis zoomed to the band the line moves in so growth looks steep. */
const MrrChart = ({ size: { id, width, height, every, className } }: { size: ChartSize }) => {
    const pad = { top: 12, right: id === 'phone' ? 12 : 24, bottom: 28, left: 52 };
    const [min, max] = [41000, 48500];
    const ticks = [41000, 42500, 44000, 45500, 47000, 48500];
    const x = (i: number) =>
        pad.left + (i / (mrrWeeks.length - 1)) * (width - pad.left - pad.right);
    const y = (v: number) =>
        pad.top + (1 - (v - min) / (max - min)) * (height - pad.top - pad.bottom);
    const points = mrrWeeks.map((v, i) => [x(i), y(v)] as [number, number]);
    const line = smooth(points);
    const floor = height - pad.bottom;
    const last = points.at(-1) ?? [0, 0];

    return (
        <svg
            aria-hidden="true"
            className={cn('mt-4 block h-auto w-full', className)}
            viewBox={`0 0 ${width} ${height}`}
        >
            <defs>
                <linearGradient id={`plain-mrr-fill-${id}`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--pc-violet)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--pc-violet)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id={`plain-mrr-line-${id}`} x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="var(--pc-indigo)" />
                    <stop offset="100%" stopColor="var(--pc-pink)" />
                </linearGradient>
                <filter height="200%" id={`plain-mrr-glow-${id}`} width="200%" x="-50%" y="-50%">
                    <feGaussianBlur stdDeviation="4" />
                </filter>
            </defs>
            {ticks.map(k => (
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
                        x={pad.left - 10}
                        y={y(k)}
                    >
                        €{(k / 1000).toFixed(1)}k
                    </text>
                </g>
            ))}
            {weekLabels.map((label, i) =>
                i % every ? null : (
                    <text
                        fill="var(--pc-faint)"
                        fontSize={12}
                        key={label}
                        textAnchor="middle"
                        x={x(i)}
                        y={height - 6}
                    >
                        {label}
                    </text>
                ),
            )}
            <path
                d={`${line} L${x(mrrWeeks.length - 1)},${floor} L${x(0)},${floor} Z`}
                fill={`url(#plain-mrr-fill-${id})`}
            />
            <path
                d={line}
                fill="none"
                filter={`url(#plain-mrr-glow-${id})`}
                opacity={0.7}
                stroke="var(--pc-violet)"
                strokeWidth={6}
            />
            <path
                d={line}
                fill="none"
                stroke={`url(#plain-mrr-line-${id})`}
                strokeLinecap="round"
                strokeWidth={3}
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
            <circle cx={last[0]} cy={last[1]} fill="var(--pc-pink)" opacity={0.25} r={10} />
            <circle
                cx={last[0]}
                cy={last[1]}
                fill="var(--pc-pink)"
                r={5}
                stroke="var(--pc-card)"
                strokeWidth={2}
            />
        </svg>
    );
};

const Revenue = () => (
    <Card className="@max-5xl/plain:col-span-1 col-span-2" glow>
        <CardHead
            icon={DollarSign}
            line={`Revenue growth ${period.words}`}
            tint="var(--pc-violet-soft)"
            title="Monthly Recurring Revenue"
        >
            <span className="flex rounded-[8px] border border-(--pc-line) bg-(--pc-inner) p-1 font-[500] text-[13px]">
                <span className="rounded-[6px] bg-(--pc-card) px-3 py-1 shadow-sm">MRR</span>
                <span className="px-3 py-1 text-(--pc-faint)">Movement</span>
            </span>
        </CardHead>
        <div className="mt-6 flex @max-xl/plain:flex-col items-end @max-xl/plain:items-stretch @max-xl/plain:gap-4 gap-6">
            <div className="flex flex-col gap-1">
                <span className="flex items-center gap-3">
                    <span className="bg-linear-to-r from-(--pc-fg) to-(--pc-violet-soft) bg-clip-text font-[700] text-[36px] text-transparent leading-[40px] tracking-[-0.02em]">
                        {mrr.value}
                    </span>
                    <Pill tint="var(--pc-emerald-soft)">
                        <TrendingUp className="size-3.5" />
                        {mrr.delta}
                    </Pill>
                </span>
                <span className="text-(--pc-faint) text-[13px]">
                    Up from {euro(mrr.start)} {period.words}
                </span>
            </div>
            <div className="@max-xl/plain:ml-0 ml-auto flex @max-xl/plain:grid @max-xl/plain:grid-cols-3 @max-xl/plain:gap-2 gap-3">
                {[
                    { label: 'New', value: totals.new, tint: 'var(--pc-emerald-soft)' },
                    { label: 'Expansion', value: totals.expansion, tint: 'var(--pc-blue)' },
                    { label: 'Churn', value: totals.churn, tint: 'var(--pc-red)' },
                ].map(item => (
                    <span
                        className="flex flex-col rounded-[10px] border border-(--pc-line) bg-(--pc-inner) @max-xl/plain:px-3 px-4 py-2"
                        key={item.label}
                    >
                        <span className="flex items-center gap-1.5 text-(--pc-faint) text-[12px]">
                            <span
                                className="size-2 rounded-full"
                                style={{ backgroundColor: item.tint }}
                            />
                            {item.label}
                        </span>
                        <span
                            className="@max-xl/plain:whitespace-nowrap font-[700]"
                            style={{ color: item.tint }}
                        >
                            {item.value > 0 ? '+' : '−'}
                            {euro(Math.abs(item.value))}
                        </span>
                    </span>
                ))}
            </div>
        </div>
        <MrrChart size={wide} />
        <MrrChart size={phone} />
    </Card>
);

const Attention = () => (
    <Card className="flex flex-col">
        <CardHead
            icon={TriangleAlert}
            line="Accounts that need your action"
            tint="var(--pc-amber)"
            title="Needs Attention"
        >
            <span className="rounded-full bg-(--pc-red) px-2.5 py-0.5 font-[700] text-[12px] text-white shadow-[0_0_12px_rgb(248_113_113/0.6)]">
                {attention.length}
            </span>
        </CardHead>
        <ul className="mt-6 flex flex-col gap-4">
            {attention.map(item => {
                const tint = item.tone === 'error' ? 'var(--pc-red)' : 'var(--pc-amber)';
                return (
                    <li
                        className="flex flex-col gap-3 rounded-[10px] border border-(--pc-line) bg-(--pc-inner) p-4"
                        key={item.account}
                    >
                        <div className="flex items-center gap-3">
                            <span
                                className="grid size-10 shrink-0 place-items-center rounded-full font-[700]"
                                style={tinted(tint, 18)}
                            >
                                {item.account[0]}
                            </span>
                            <span className="flex min-w-0 flex-col">
                                <span className="font-[600] leading-[20px]">{item.account}</span>
                                <span className="truncate text-(--pc-faint) text-[12px]">
                                    {item.domain}
                                </span>
                            </span>
                            <span className="ml-auto flex shrink-0 flex-col items-end">
                                <span className="font-[700] leading-[20px]">{item.mrr}</span>
                                <span className="text-(--pc-faint) text-[12px]">MRR</span>
                            </span>
                        </div>
                        <span className="text-(--pc-muted) text-[13px]">{item.detail}</span>
                        <div className="flex items-center justify-between gap-3">
                            <span className="whitespace-nowrap">
                                <Pill tint={tint}>
                                    {item.tone === 'error' ? (
                                        <CircleAlert className="size-3.5" />
                                    ) : (
                                        <Clock className="size-3.5" />
                                    )}
                                    {item.issue}
                                </Pill>
                            </span>
                            <span
                                className={cn(
                                    'flex h-8 shrink-0 items-center gap-1.5 rounded-[8px] px-3 font-[600] text-[13px]',
                                    item.tone === 'error'
                                        ? 'bg-(--pc-violet-strong) text-white shadow-[0_6px_16px_-6px_rgb(124_58_237/0.8)]'
                                        : 'border border-(--pc-line) bg-(--pc-card)',
                                )}
                            >
                                {titleCase(item.action)}
                            </span>
                        </div>
                    </li>
                );
            })}
        </ul>
    </Card>
);

/** The weekly movement as stacked bars around zero. */
const MovementChart = ({ size: { width, every, className } }: { size: ChartSize }) => {
    const height = width === wide.width ? 220 : 200;
    const pad = { top: 8, right: 8, bottom: 28, left: 52 };
    const [min, max] = [-400, 1200];
    const y = (v: number) =>
        pad.top + (1 - (v - min) / (max - min)) * (height - pad.top - pad.bottom);
    const step = (width - pad.left - pad.right) / movement.length;
    const bar = step * 0.5;
    return (
        <svg
            aria-hidden="true"
            className={cn('mt-6 block h-auto w-full', className)}
            viewBox={`0 0 ${width} ${height}`}
        >
            {[-400, 0, 400, 800, 1200].map(k => (
                <g key={k}>
                    <line
                        stroke="var(--pc-line)"
                        strokeDasharray={k === 0 ? undefined : '3 3'}
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
                        x={pad.left - 10}
                        y={y(k)}
                    >
                        €{k}
                    </text>
                </g>
            ))}
            {movement.map((week, i) => {
                const cx = pad.left + step * i + step / 2;
                return (
                    <g key={week.week}>
                        <rect
                            fill="var(--pc-violet)"
                            height={y(0) - y(week.new)}
                            width={bar}
                            x={cx - bar / 2}
                            y={y(week.new)}
                        />
                        <rect
                            fill="var(--pc-blue)"
                            height={y(week.new) - y(week.new + week.expansion)}
                            rx={4}
                            width={bar}
                            x={cx - bar / 2}
                            y={y(week.new + week.expansion)}
                        />
                        <rect
                            fill="var(--pc-red)"
                            height={y(week.churn) - y(0)}
                            rx={4}
                            width={bar}
                            x={cx - bar / 2}
                            y={y(0)}
                        />
                        {i % every === 0 && (
                            <text
                                fill="var(--pc-faint)"
                                fontSize={12}
                                textAnchor="middle"
                                x={cx}
                                y={height - 6}
                            >
                                {week.week}
                            </text>
                        )}
                    </g>
                );
            })}
        </svg>
    );
};

const Movement = () => (
    <Card className="@max-5xl/plain:col-span-1 col-span-2">
        <CardHead
            icon={ChartColumn}
            line="New, expansion and churn by week"
            tint="var(--pc-blue)"
            title="Revenue Movement"
        >
            <span className="flex @max-xl/plain:flex-wrap items-center gap-4 @max-xl/plain:gap-x-4 @max-xl/plain:gap-y-1 text-(--pc-muted) text-[13px]">
                {[
                    ['New', 'var(--pc-violet)'],
                    ['Expansion', 'var(--pc-blue)'],
                    ['Churn', 'var(--pc-red)'],
                ].map(([label, colour]) => (
                    <span className="flex items-center gap-1.5" key={label}>
                        <span
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: colour }}
                        />
                        {label}
                    </span>
                ))}
            </span>
        </CardHead>
        <MovementChart size={wide} />
        <MovementChart size={phone} />
    </Card>
);

const planColours = ['var(--pc-violet)', 'var(--pc-indigo)', 'var(--pc-blue)', 'var(--pc-pink)'];

const Plans = () => {
    const total = byPlan.reduce((sum, plan) => sum + plan.revenue, 0);
    const r = 70;
    const circumference = 2 * Math.PI * r;
    let offset = 0;
    return (
        <Card>
            <CardHead
                icon={ChartPie}
                line="Share of MRR per plan"
                tint="var(--pc-pink)"
                title="Revenue by Plan"
            >
                <Ellipsis className="size-5 text-(--pc-faint)" />
            </CardHead>
            <div className="relative mx-auto mt-6 size-44">
                <svg aria-hidden="true" className="-rotate-90" height={176} width={176}>
                    {byPlan.map((plan, i) => {
                        const length = (plan.revenue / total) * circumference;
                        const dash = `${Math.max(length - 4, 0)} ${circumference}`;
                        const segment = (
                            <circle
                                cx={88}
                                cy={88}
                                fill="none"
                                key={plan.plan}
                                r={r}
                                stroke={planColours[i]}
                                strokeDasharray={dash}
                                strokeDashoffset={-offset}
                                strokeLinecap="round"
                                strokeWidth={18}
                            />
                        );
                        offset += length;
                        return segment;
                    })}
                </svg>
                <span className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-[700] text-[22px] leading-[28px]">{mrr.value}</span>
                    <span className="text-(--pc-faint) text-[12px]">Total MRR</span>
                </span>
            </div>
            <ul className="mt-6 flex flex-col gap-3">
                {byPlan.map((plan, i) => (
                    <li className="flex items-center gap-3" key={plan.plan}>
                        <span
                            className="size-3 rounded-[4px]"
                            style={{ backgroundColor: planColours[i] }}
                        />
                        <span className="font-[500]">{plan.plan}</span>
                        <span className="@max-xl/plain:hidden text-(--pc-faint) text-[12px]">
                            {plan.customers} customers
                        </span>
                        <span className="ml-auto font-[600]">{euro(plan.revenue)}</span>
                        <span className="w-12 text-right text-(--pc-faint) text-[12px]">
                            {Math.round((plan.revenue / total) * 100)}%
                        </span>
                    </li>
                ))}
            </ul>
        </Card>
    );
};

const activityLook = {
    new: { icon: UserPlus, tint: 'var(--pc-emerald-soft)', tag: 'New' },
    trial: { icon: Zap, tint: 'var(--pc-blue)', tag: 'Trial' },
    failed: { icon: CircleAlert, tint: 'var(--pc-red)', tag: 'Failed' },
    upgrade: { icon: CreditCard, tint: 'var(--pc-violet-soft)', tag: 'Upgrade' },
    cancel: { icon: UserRoundX, tint: 'var(--pc-amber)', tag: 'Cancelled' },
} as const;

const Activity = () => (
    <Card className="@max-5xl/plain:col-span-1 col-span-3">
        <CardHead
            icon={Sparkles}
            line="The latest events across your workspace"
            tint="var(--pc-emerald-soft)"
            title="Recent Activity"
        >
            <span className="flex items-center gap-1 font-[600] text-(--pc-violet-soft)">
                View All
                <ArrowRight className="size-4" />
            </span>
        </CardHead>
        <ul className="mt-6 flex flex-col gap-3">
            {activity.map(item => {
                const look = activityLook[item.kind];
                return (
                    <li
                        className="flex items-center gap-4 rounded-[10px] bg-(--pc-inner) p-3"
                        key={item.what}
                    >
                        <span
                            className="grid size-10 shrink-0 place-items-center rounded-full"
                            style={tinted(look.tint)}
                        >
                            <look.icon className="size-5" />
                        </span>
                        <span className="flex min-w-0 flex-col">
                            <span className="truncate font-[500]">{item.what}</span>
                            <span className="text-(--pc-faint) text-[12px]">{item.when}</span>
                        </span>
                        <span className="ml-auto">
                            <Pill tint={look.tint}>{look.tag}</Pill>
                        </span>
                    </li>
                );
            })}
        </ul>
    </Card>
);

// The rows of cards, three across, one under the other below 1024.
const row = 'grid shrink-0 @max-5xl/plain:grid-cols-1 grid-cols-3 @max-3xl/plain:gap-4 gap-6';

/** The overview as a coding agent builds it without the system. */
export const PlainScreen = () => (
    <div className="plain-screen @container/plain flex h-full w-full overflow-hidden bg-(--pc-bg) text-(--pc-fg) text-[14px] leading-[20px] tracking-normal [font-family:ui-sans-serif,system-ui,sans-serif]">
        <style>{palette}</style>
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
            <TopBar />
            <main className="flex min-h-0 flex-1 flex-col @max-3xl/plain:gap-4 gap-6 overflow-hidden @max-3xl/plain:p-4 p-8">
                <Hero />
                <Kpis />
                <div className={row}>
                    <Revenue />
                    <Attention />
                </div>
                <div className={row}>
                    <Movement />
                    <Plans />
                </div>
                <div className={row}>
                    <Activity />
                </div>
            </main>
        </div>
    </div>
);
