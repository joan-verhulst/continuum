'use client';

import { allCustomers, formatEuro, PageHead, plans, Workspace } from '@screens/workspace';
import {
    ActivityItem,
    ActivityList,
    BarList,
    BarListItem,
    Card,
    CardTitle,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    StatCard,
} from 'continuum';
import { ChartCard } from 'continuum/charts';
import { CircleAlert, Euro, Sparkles, Ticket, UserPlus, UserRoundX, Users } from 'lucide-react';
import { animate, motion, useMotionValue } from 'motion/react';
import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Shot } from '../web';
import {
    PlainActivity,
    PlainHero,
    PlainPlans,
    PlainRevenue,
    PlainSidebar,
    PlainTopBar,
    plainPalette,
} from './plain-overview';

/*
 * The Overview, built as the playground builds it (screens/overview.tsx: the same parts, the same
 * figures), with what an agent gets wrong without the system laid over it as faults that come off
 * one kind at a time. With every fault on it is the page Before and after shows on its left
 * (PlainOverview): where a style over a real part cannot reach that page's look, the fault is that
 * page's own part laid over the real one, and it clips away in its step. With every fault off it is
 * exactly the Overview.
 *
 * - structure: the agent's order (the figures first, the chart beside what moved, the plans last), its
 *   top bar with search in place of the trail, its sidebar with the switcher in its head;
 * - colour: the violet selection and count, the gradient head, the violet chart and bars, the
 *   rainbow icon chips and coloured deltas, zinc cards;
 * - containers: the page flat to the window rather than a panel, each activity row a card;
 * - type: the system font, titles and figures at 30 and 700, labels at 600 and 500, body at 14;
 * - spacing: 24 in every card and between them, 40-high nav items.
 */

export type Faults = {
    structure: boolean;
    colour: boolean;
    containers: boolean;
    type: boolean;
    spacing: boolean;
};

export type Block = 'head' | 'chart' | 'stats' | 'plans' | 'activity';
const BLOCKS: Block[] = ['head', 'chart', 'stats', 'plans', 'activity'];

/** Which fault carries each part's overlay of the agent's own markup away. */
const OVERLAY: Partial<Record<Block, keyof Faults>> = {
    head: 'colour',
    chart: 'colour',
    plans: 'colour',
    activity: 'colour',
};

const icon = { strokeWidth: 2 } as const;
const ease = 'cubic-bezier(0.65, 0, 0.35, 1)';

// The figures, as the Overview reads them for its default period, the last twelve weeks.
const total = allCustomers.reduce((sum, customer) => sum + customer.mrr, 0);
const weeks = [
    33.0, 33.4, 34.1, 34.5, 35.2, 35.6, 36.3, 36.9, 37.4, 38.2, 38.8, 39.5, 40.1, 40.7, 41.2, 41.9,
    42.3, 43.1, 43.0, 44.2, 44.9, 45.3, 46.4, 46.9, 47.6,
].map((k, i) => ({ date: new Date(2026, 3, 27 + i * 7), revenue: Math.round(k * 1000) }));
weeks.push({ date: new Date(2026, 9, 19), revenue: total });
const range = weeks.slice(-12);
const start = range[0]?.revenue ?? total;
const change = ((total - start) / start) * 100;
const formatWeek = (date: Date) =>
    date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const formatThousands = (value: number) => `€${Math.round(value / 1000)}k`;
const byPlan = plans
    .map(plan => ({
        name: plan.id,
        revenue: allCustomers
            .filter(customer => customer.plan === plan.id)
            .reduce((sum, customer) => sum + customer.mrr, 0),
    }))
    .sort((a, b) => b.revenue - a.revenue);
const activeCustomers = allCustomers.filter(customer => customer.status === 'Active').length;

/** The agent's icon chips on the figures, each in its own tint. */
const chips = [
    { icon: Users, tint: '#a78bfa' },
    { icon: UserPlus, tint: '#60a5fa' },
    { icon: UserRoundX, tint: '#fb923c' },
    { icon: Ticket, tint: '#34d399' },
];

/*
 * The faults as styles over the parts' own, each kind under its flag on the screen's root. The
 * transitions carry each kind off; the delays run a change down the page in reading order.
 */
const css = `
.fo * { transition-property: color, background-color, border-color, padding, gap, font-size, line-height, font-weight, border-radius, box-shadow, margin, height, min-height; transition-duration: 600ms; transition-timing-function: ${ease}; }
.fo { --fo-sans: ui-sans-serif, system-ui, sans-serif; }

/* Colour */
.fo[data-colour] [data-slot="sidebar-item"][aria-current="page"] { background-color: #7c3aed; color: #fff; box-shadow: 0 8px 20px -6px rgb(124 58 237 / 0.6); }
.fo[data-colour] [data-slot="sidebar"] [data-slot="badge"] { background-color: #8b5cf6; color: #fff; }
.fo[data-colour] [data-slot="stat-card"] { background-color: #18181b; border-color: #27272a; border-radius: 12px; box-shadow: 0 1px 3px rgb(0 0 0 / 0.3); }
.fo[data-colour] [data-slot="stat-card"] [data-slot="card-title"] { min-height: 36px; }
.fo[data-colour] [data-slot="stat-card"] [data-slot="badge"] { background-color: transparent; color: #10b981; padding: 0; font-size: 14px; font-weight: 600; }
.fo[data-colour] .fo-stat:nth-child(3) [data-slot="badge"] { color: #ef4444; }
.fo[data-colour] [data-slot="stat-card"] [data-slot="badge"]::after { content: 'from last quarter'; margin-left: 4px; color: #71717a; font-weight: 400; }
.fo[data-colour] [data-slot="stat-card"] [data-slot="badge"]::before { content: ''; width: 16px; height: 16px; margin-right: 4px; background-color: currentColor; mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='22 7 13.5 15.5 8.5 10.5 2 17'/%3E%3Cpolyline points='16 7 22 7 22 13'/%3E%3C/svg%3E") center / contain no-repeat; }
.fo[data-colour] .fo-stat:nth-child(3) [data-slot="badge"]::before { mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='22 17 13.5 8.5 8.5 13.5 2 7'/%3E%3Cpolyline points='16 17 22 17 22 11'/%3E%3C/svg%3E"); }
.fo:not([data-colour]) [data-block="stats"] * { transition-delay: 150ms; }

/* Containers */
.fo[data-containers] [data-slot="app-panel"] { margin: 0; border-radius: 0; border-width: 0 0 0 1px; }
.fo[data-containers] [data-slot="activity-item"] { background-color: #232327; border-radius: 8px; padding: 12px; }
.fo[data-containers] [data-slot="activity-list"] { gap: 16px; }

/* Type */
.fo[data-type] .fo-page { font-family: var(--fo-sans); }
.fo[data-type] [data-block="head"] .fo-real h1 { font-size: 30px; line-height: 36px; font-weight: 700; }
.fo[data-type] [data-block="head"] .fo-real p { font-size: 16px; }
.fo[data-type] [data-slot="card-value"], .fo[data-type] [data-slot="chart-card-head"] .text-2xl { font-size: 30px; line-height: 36px; font-weight: 700; }
.fo[data-type] [data-slot="stat-card"] [data-slot="card-title"] { font-size: 14px; font-weight: 500; color: #a1a1aa; text-transform: capitalize; }
.fo[data-type] [data-block="activity"] [data-slot="card-title"], .fo[data-type] [data-slot="bar-list-title"], .fo[data-type] [data-slot="chart-card-head"] h3 { font-size: 18px; line-height: 28px; font-weight: 600; color: #fafafa; }
.fo[data-type] [data-slot="bar-list-label"], .fo[data-type] [data-slot="activity-item"] p:first-child, .fo[data-type] [data-slot="sidebar-item"] { font-size: 14px; font-weight: 500; }
.fo[data-type] [data-slot="bar-list-value"] { font-size: 14px; font-weight: 600; }
.fo[data-type] [data-slot="sidebar-label"] { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; }

/* Spacing */
.fo[data-spacing] [data-slot="stat-card"] { padding: 24px; gap: 8px; }
.fo[data-spacing] [data-slot="stat-card"] > div:first-child { gap: 8px; }
.fo[data-spacing] [data-block="plans"] [data-slot="card"], .fo[data-spacing] [data-block="activity"] [data-slot="card"] { padding: 24px; gap: 24px; }
.fo[data-spacing] .fo-stats { gap: 24px; }
.fo[data-spacing] [data-slot="bar-list-items"] { gap: 12px; }
.fo[data-spacing] [data-slot="sidebar-item"] { padding: 11px 12px; }
.fo[data-spacing] [data-slot="sidebar-group"] { padding-left: 16px; padding-right: 16px; }

/* A finding marked: a red outline round the part. */
.fo [data-block] { outline: 2px solid transparent; outline-offset: 6px; transition: outline-color 200ms; }
.fo [data-block][data-mark] { outline-color: var(--color-error-500); }
.fo [data-slot="sidebar-item"][aria-current="page"] { outline: 2px solid transparent; outline-offset: 4px; }
.fo[data-mark-nav] [data-slot="sidebar-item"][aria-current="page"] { outline-color: var(--color-error-500); }
`;

/** A layer of the agent's own markup, clipped away from its left when its fault comes off. */
const Overlay = ({
    on,
    delay = 0,
    className,
    children,
}: {
    on: boolean;
    delay?: number;
    className?: string;
    children: ReactNode;
}) => (
    <div
        className={className}
        style={{
            ...plainPalette,
            clipPath: on
                ? 'inset(-60px -60px -60px -60px)'
                : 'inset(-60px -60px -60px calc(100% + 60px))',
            transition: `clip-path 700ms ${ease} ${delay}ms`,
        }}
    >
        {children}
    </div>
);

type Place = { x: number; y: number; width: number };

/** The agent's arrangement at the window's width, from its top left, and the Overview's. */
const arrange = (
    structure: boolean,
    width: number,
    heights: Record<Block, number>,
    rowGap: number,
    colGap: number,
    origin: { x: number; y: number },
) => {
    const place = {} as Record<Block, Place>;
    let y = origin.y;
    const row = (items: [Block, number, number][]) => {
        for (const [block, x, w] of items) place[block] = { x: origin.x + x, y, width: w };
        y += Math.max(...items.map(([block]) => heights[block])) + rowGap;
    };
    row([['head', 0, width]]);
    if (structure) {
        const seventh = (width - 6 * colGap) / 7;
        const chart = 4 * seventh + 3 * colGap;
        row([['stats', 0, width]]);
        row([
            ['chart', 0, chart],
            ['activity', chart + colGap, width - chart - colGap],
        ]);
        row([['plans', 0, width]]);
    } else {
        const half = (width - colGap) / 2;
        row([['chart', 0, width]]);
        row([['stats', 0, width]]);
        row([
            ['plans', 0, half],
            ['activity', half + colGap, half],
        ]);
    }
    return { place, height: y - rowGap - origin.y };
};

/** One part: the real one, and over it, until its fault comes off, the agent's. */
const Part = ({
    block,
    at,
    moving,
    marked,
    overlay,
    overlayOn,
    delay,
    real,
    onHeights,
}: {
    block: Block;
    at: Place | undefined;
    moving: boolean;
    marked: boolean;
    overlay: ReactNode;
    overlayOn: boolean;
    delay: number;
    real: ReactNode;
    onHeights: (block: Block, real: number, plain: number) => void;
}) => {
    const realRef = useRef<HTMLDivElement>(null);
    const plainRef = useRef<HTMLDivElement>(null);
    const left = useMotionValue(0);
    const top = useMotionValue(0);
    const width = useMotionValue(0);

    useLayoutEffect(() => {
        const measure = () =>
            onHeights(
                block,
                realRef.current?.offsetHeight ?? 0,
                plainRef.current?.offsetHeight ?? 0,
            );
        measure();
        const observer = new ResizeObserver(measure);
        if (realRef.current) observer.observe(realRef.current);
        if (plainRef.current) observer.observe(plainRef.current);
        return () => observer.disconnect();
    }, [block, onHeights]);

    useEffect(() => {
        if (!at) return;
        if (!moving || width.get() === 0) {
            left.set(at.x);
            top.set(at.y);
            width.set(at.width);
            return;
        }
        const options = { duration: 1, ease: [0.65, 0, 0.35, 1] as const };
        const controls = [
            animate(left, at.x, options),
            animate(top, at.y, options),
            animate(width, at.width, options),
        ];
        return () => {
            for (const control of controls) control.stop();
        };
    }, [at, moving, left, top, width]);

    return (
        <motion.div
            className="absolute top-0 left-0 rounded-[12px]"
            data-block={block}
            data-film={block}
            data-mark={marked || undefined}
            style={{ left, top, width }}
        >
            <div
                className="fo-real"
                ref={realRef}
                style={{
                    clipPath:
                        overlay && overlayOn
                            ? 'inset(0 100% 0 0)'
                            : 'inset(-60px -60px -60px -60px)',
                    transition: `clip-path 700ms ${ease} ${delay}ms`,
                }}
            >
                {real}
            </div>
            {overlay && (
                <Overlay className="absolute inset-x-0 top-0" delay={delay} on={overlayOn}>
                    <div ref={plainRef}>{overlay}</div>
                </Overlay>
            )}
        </motion.div>
    );
};

const Blocks = ({
    faults,
    marks,
    moving,
    real,
    overlays,
}: {
    faults: Faults;
    marks: readonly Block[];
    moving: boolean;
    real: Record<Block, ReactNode>;
    overlays: Partial<Record<Block, ReactNode>>;
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState<{ width: number; rowGap: number } | null>(null);
    const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
    const [heights, setHeights] = useState<Partial<Record<Block, [number, number]>>>({});

    useLayoutEffect(() => {
        const root = ref.current;
        if (!root) return;
        const column = root.parentElement;
        const measure = () =>
            setSize({
                width: root.clientWidth,
                rowGap: Number.parseFloat(column ? getComputedStyle(column).rowGap : '') || 40,
            });
        measure();
        // Where the agent's page starts, in the column's terms: 32 in from the sidebar and from the
        // foot of its 64-high top bar.
        const screen = root.closest('.fo')?.getBoundingClientRect();
        const box = root.getBoundingClientRect();
        if (screen)
            setOrigin({ x: screen.left + 256 + 32 - box.left, y: screen.top + 64 + 32 - box.top });
        const observer = new ResizeObserver(measure);
        observer.observe(root);
        return () => observer.disconnect();
    }, []);

    const onHeights = useRef((block: Block, realHeight: number, plainHeight: number) =>
        setHeights(current => {
            const was = current[block];
            if (was && was[0] === realHeight && was[1] === plainHeight) return current;
            return { ...current, [block]: [realHeight, plainHeight] };
        }),
    ).current;

    const overlayOn = (block: Block) => {
        const fault = OVERLAY[block];
        return fault ? faults[fault] : false;
    };
    const ready = size && origin && BLOCKS.every(block => heights[block]);
    const layout = ready
        ? arrange(
              faults.structure,
              faults.structure ? 1440 - 256 - 64 : size.width,
              Object.fromEntries(
                  BLOCKS.map(block => {
                      const [realHeight = 0, plainHeight = 0] = heights[block] ?? [];
                      return [block, overlayOn(block) ? plainHeight : realHeight];
                  }),
              ) as Record<Block, number>,
              faults.structure ? 32 : size.rowGap,
              faults.spacing ? 24 : 16,
              faults.structure ? origin : { x: 0, y: 0 },
          )
        : null;
    const delays: Record<Block, number> = {
        head: 100,
        stats: 200,
        chart: 300,
        plans: 450,
        activity: 600,
    };

    return (
        <div
            className="relative"
            ref={ref}
            style={{
                height: layout && !faults.structure ? layout.height : undefined,
                visibility: layout ? undefined : 'hidden',
            }}
        >
            {BLOCKS.map(block => (
                <Part
                    at={layout?.place[block]}
                    block={block}
                    delay={delays[block]}
                    key={block}
                    marked={marks.includes(block)}
                    moving={moving}
                    onHeights={onHeights}
                    overlay={overlays[block]}
                    overlayOn={overlayOn(block)}
                    real={real[block]}
                />
            ))}
        </div>
    );
};

/**
 * The Overview with its faults: `faults` says which are still on, `marks` which parts are outlined as
 * findings, `moving` lets a change of order travel rather than jump.
 */
export const FaultyOverview = ({
    faults,
    marks = [],
    markNav = false,
    moving = false,
}: {
    faults: Faults;
    marks?: readonly Block[];
    markNav?: boolean;
    moving?: boolean;
}) => {
    const [period, setPeriod] = useState('quarter');
    const real: Record<Block, ReactNode> = {
        head: (
            <PageHead
                description="How the workspace is doing over the last twelve weeks."
                title="Overview"
            >
                <Select onValueChange={value => setPeriod(String(value))} value={period}>
                    <SelectTrigger aria-label="Period" className="w-36" size="sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="month">Last 4 weeks</SelectItem>
                        <SelectItem value="quarter">Last 12 weeks</SelectItem>
                        <SelectItem value="half">Last 26 weeks</SelectItem>
                    </SelectContent>
                </Select>
            </PageHead>
        ),
        chart: (
            <ChartCard
                comparison="over the last twelve weeks"
                data={range}
                delta={`${change >= 0 ? '+' : '−'}${Math.abs(change).toFixed(1)}%`}
                formatValue={formatEuro}
                formatX={formatWeek}
                formatY={formatThousands}
                height={260}
                icon={<Euro />}
                series={[{ key: 'revenue', name: 'Recurring revenue' }]}
                title="Monthly recurring revenue"
                trend={change >= 0 ? 'up' : 'down'}
                value={formatEuro(total)}
                x="date"
                xTicks={4}
            />
        ),
        stats: (
            <div className="fo-stats grid grid-cols-4 gap-4">
                {[
                    <StatCard
                        delta="+3"
                        key="a"
                        label="Active customers"
                        value={String(activeCustomers)}
                    />,
                    <StatCard delta="+2" key="n" label="New customers" value="9" />,
                    <StatCard delta="−0.4 pt" key="c" label="Churn" trend="up" value="1.9%" />,
                    <StatCard delta="+5" key="t" label="Open tickets" trend="down" value="23" />,
                ].map((card, i) => {
                    const chip = chips[i];
                    return (
                        <div className="fo-stat relative grid" key={card.key}>
                            {card}
                            {chip && (
                                <Overlay
                                    className="absolute top-6 right-6"
                                    delay={200}
                                    on={faults.colour}
                                >
                                    <span
                                        className="block rounded-[8px] p-2"
                                        style={{
                                            color: chip.tint,
                                            backgroundColor: `color-mix(in srgb, ${chip.tint} 12%, transparent)`,
                                        }}
                                    >
                                        <chip.icon className="size-5" />
                                    </span>
                                </Overlay>
                            )}
                        </div>
                    );
                })}
            </div>
        ),
        plans: (
            <Card layout="list">
                <BarList title="Recurring revenue by plan" valueLabel="A month">
                    {byPlan.map(plan => (
                        <BarListItem
                            displayValue={formatEuro(plan.revenue)}
                            key={plan.name}
                            value={plan.revenue}
                        >
                            {plan.name}
                        </BarListItem>
                    ))}
                </BarList>
            </Card>
        ),
        activity: (
            <Card layout="list">
                <CardTitle>What moved</CardTitle>
                <ActivityList>
                    <ActivityItem
                        icon={<UserPlus {...icon} />}
                        time="12 minutes ago"
                        title="Tyrell & Co started on the Starter plan"
                        tone="success"
                    />
                    <ActivityItem
                        icon={<Sparkles {...icon} />}
                        time="2 hours ago"
                        title="Riverbend Media started a trial of Pro"
                        tone="primary"
                    />
                    <ActivityItem
                        icon={<CircleAlert {...icon} />}
                        time="3 hours ago"
                        title="A payment from Initech failed"
                        tone="warning"
                    />
                    <ActivityItem
                        icon={<UserRoundX {...icon} />}
                        time="2 weeks ago"
                        title="Cyberdyne cancelled their plan"
                    />
                </ActivityList>
            </Card>
        ),
    };
    const plain = 'text-(--pc-fg) text-[14px] leading-[20px]';
    const overlays: Partial<Record<Block, ReactNode>> = {
        head: (
            <div className={plain}>
                <PlainHero />
            </div>
        ),
        chart: (
            <div className={plain}>
                <PlainRevenue />
            </div>
        ),
        plans: (
            <div className={plain}>
                <PlainPlans />
            </div>
        ),
        activity: (
            <div className={plain}>
                <PlainActivity />
            </div>
        ),
    };
    return (
        <Shot className="size-full">
            <style>{css}</style>
            <div
                className="fo relative size-full"
                data-colour={faults.colour || undefined}
                data-containers={faults.containers || undefined}
                data-mark-nav={markNav || undefined}
                data-spacing={faults.spacing || undefined}
                data-type={faults.type || undefined}
            >
                <div className="fo-page size-full">
                    <Workspace gap="gap-11" place="overview" trail={['Overview']}>
                        <Blocks
                            faults={faults}
                            marks={marks}
                            moving={moving}
                            overlays={overlays}
                            real={real}
                        />
                    </Workspace>
                </div>
                {/* The agent's shell: its sidebar, with the switcher in its head, and its top bar. */}
                <Overlay
                    className={`absolute inset-y-0 left-0 flex ${plain}`}
                    on={faults.structure}
                >
                    <PlainSidebar />
                </Overlay>
                <Overlay
                    className={`absolute top-0 right-0 left-64 bg-(--pc-bg) ${plain}`}
                    delay={100}
                    on={faults.structure}
                >
                    <PlainTopBar />
                </Overlay>
            </div>
        </Shot>
    );
};
