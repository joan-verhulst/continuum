'use client';

import {
    Badge,
    Card,
    CardTitle,
    CardValue,
    cn,
    PageContent,
    Select,
    SelectTrigger,
    SelectValue,
} from '@contui/ui';
import { ChartCard } from '@contui/ui/charts';
import { Euro } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';
import { Frame, formatEuro, PageHead } from '../hero-screens/shell';
import { ease } from '../web';

/*
 * The billing overview as an agent built it, in Northwind's shell at its real size: the head with its
 * period, the billed amount as a chart card full width, three stat cards under it. The agent drew the
 * stat cards from the Card parts with its own spacing, every value guessed: 32 padding, 12 throughout,
 * the cards 8 apart and 8 under the chart. Fixed, every value is the formula's for what each box holds
 * (the continuum-fix-padding skill, get_spacing): the card pads 16, the label and its figure are one
 * lockup 4 apart, 12 above the pill (each block's room inside a card: 9.9 + 2.5); the cards 16 apart
 * (1.1 × 16); the row 44 under the chart (each block's room standing free: 24.6 + 19.5). That is exactly
 * the library's StatCard, and the page's gaps as the playground's Overview has them.
 */

/** What the agent guessed, and what the formula gives. */
export const BUILT = { padding: 32, pair: 12, pill: 12, across: 8, down: 8 } as const;
export const FIXED = { padding: 16, pair: 4, pill: 12, across: 16, down: 44 } as const;

/** What the film has done to the page so far. */
export type Padding = {
    /** The first stat card's padding shaded and its value on it. */
    marks: boolean;
    /** The first card's two blocks outlined, each with the type size it counts at. */
    groups: boolean;
    /** The first card fixed. */
    first: boolean;
    /** The rest fixed: the other cards and the page's gaps. */
    rest: boolean;
};

// Wide enough on the right for a block's size tag beside its outline.
const shut = 'inset(-12px calc(100% + 48px) -12px -12px)';
const open = 'inset(-12px -48px -12px -12px)';
const gone = 'inset(-12px -48px -12px calc(100% + 48px))';

/** A mark laid over a part: it clips open from the left and off to the right, never fading. */
const Wipe = ({
    on,
    className,
    children,
}: {
    on: boolean;
    className: string;
    children: ReactNode;
}) => (
    <AnimatePresence>
        {on && (
            <motion.span
                animate={{ clipPath: open }}
                aria-hidden
                className={cn('pointer-events-none absolute', className)}
                exit={{ clipPath: gone }}
                initial={{ clipPath: shut }}
                transition={{ duration: 0.4, ease }}
            >
                {children}
            </motion.span>
        )}
    </AnimatePresence>
);

/** A card's padding, shaded as an inspector shades it, its value on it: red while off, the accent once right. */
const PaddingMark = ({ on, value, right }: { on: boolean; value: number; right: boolean }) => (
    <Wipe className="inset-0 z-20 rounded-[inherit]" on={on}>
        <motion.span
            animate={{ borderWidth: value }}
            className="absolute inset-0 rounded-[inherit] border-solid transition-colors duration-500"
            initial={false}
            style={{
                borderColor: right
                    ? 'color-mix(in oklab, var(--color-primary-500) 22%, transparent)'
                    : 'color-mix(in oklab, var(--color-error-500) 22%, transparent)',
            }}
            transition={{ duration: 0.6, ease }}
        />
        <span
            className={cn(
                'absolute -top-2 left-4 rounded-[3px] px-1 font-mono text-[10px] text-white tabular-nums leading-[15px] transition-colors duration-500',
                right ? 'bg-primary-500' : 'bg-error-500',
            )}
        >
            {value}
        </span>
    </Wipe>
);

/**
 * One block of a card's content, outlined while the card is read, the type size it counts at beside
 * it: the label and its figure count as one line at their average (15.5), the pill at its own (11).
 */
const Group = ({ on, size, children }: { on: boolean; size: number; children: ReactNode }) => (
    <div className="relative w-fit">
        {children}
        <Wipe
            className="-inset-1 rounded-[4px] outline-1 outline-primary-500 outline-solid"
            on={on}
        >
            <span className="absolute top-1/2 left-[calc(100%+6px)] -translate-y-1/2 font-mono text-[11px] text-primary-500 tabular-nums">
                {size}
            </span>
        </Wipe>
    </div>
);

/**
 * A stat card as the agent drew it from the Card parts, and as the formula puts it: once fixed it is
 * exactly the library's StatCard. The gaps ease by CSS, which motion cannot animate.
 */
const AgentStat = ({
    label,
    value,
    delta,
    trend,
    fixed,
    delay = 0,
    marks = false,
    groups = false,
    film,
}: {
    label: string;
    value: string;
    delta: string;
    trend: 'success' | 'error';
    fixed: boolean;
    delay?: number;
    marks?: boolean;
    groups?: boolean;
    film?: string;
}) => {
    const spacing = fixed ? FIXED : BUILT;
    const timing = { transitionDelay: `${delay}ms` };
    return (
        <Card
            className="relative min-w-0 flex-1 transition-[padding,row-gap] duration-600 ease-out-strong"
            data-film={film}
            data-slot="stat-card"
            style={{ padding: spacing.padding, rowGap: spacing.pill, ...timing }}
        >
            <PaddingMark on={marks} right={fixed} value={spacing.padding} />
            <Group on={groups} size={15.5}>
                <div
                    className="flex flex-col transition-[row-gap] duration-600 ease-out-strong"
                    style={{ rowGap: spacing.pair, ...timing }}
                >
                    <CardTitle>{label}</CardTitle>
                    <CardValue>{value}</CardValue>
                </div>
            </Group>
            <Group on={groups} size={11}>
                <Badge tone={trend} variant="pill">
                    {delta}
                </Badge>
            </Group>
        </Card>
    );
};

// The amount billed each week over the last twelve, as the chart card reads it.
const billed = [39.1, 40.2, 39.8, 41.5, 42.0, 41.6, 43.3, 44.1, 43.8, 45.6, 46.9, 48.26].map(
    (k, i) => ({ date: new Date(2026, 7, 31 + i * 7), billed: Math.round(k * 1000) }),
);
const last = billed[billed.length - 1]?.billed ?? 0;
const first = billed[0]?.billed ?? last;
const change = ((last - first) / first) * 100;
const formatWeek = (date: Date) =>
    date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const formatThousands = (value: number) => `€${Math.round(value / 1000)}k`;

/**
 * Billing, an overview as the agent built it: the composition is the system's (the head, the figure
 * that leads as a chart card full width, three stat cards under it); only its spacing is guessed.
 */
export const PaddingScreen = ({ state }: { state: Padding }) => {
    const gaps = state.rest ? FIXED : BUILT;
    // The page's gaps open after the second and third cards have started to settle.
    const timing = { transitionDelay: state.rest ? '250ms' : '0ms' };
    return (
        <div className="size-full">
            <Frame place="analytics" trail={['Analytics', 'Billing']}>
                {/* A block of its own round the column, so it takes the panel less its padding. */}
                <div data-film="page">
                    <PageContent className="flex flex-col" style={{ paddingTop: 40 }}>
                        <PageHead
                            description="What Northwind billed and how it was paid, the last twelve weeks."
                            title="Billing"
                        >
                            <Select
                                defaultValue="quarter"
                                items={[{ value: 'quarter', label: 'Last 12 weeks' }]}
                            >
                                <SelectTrigger aria-label="Period" className="w-36" size="sm">
                                    <SelectValue />
                                </SelectTrigger>
                            </Select>
                        </PageHead>
                        <div className="mt-11" data-film="chart">
                            <ChartCard
                                comparison="over the last twelve weeks"
                                data={billed}
                                delta={`+${change.toFixed(1)}%`}
                                figures={false}
                                formatValue={formatEuro}
                                formatX={formatWeek}
                                formatY={formatThousands}
                                height={180}
                                icon={<Euro />}
                                series={[{ key: 'billed', name: 'Billed' }]}
                                title="Billed"
                                trend="up"
                                value={formatEuro(last)}
                                x="date"
                                xTicks={4}
                            />
                        </div>
                        <div
                            className="flex items-start transition-[margin-top,column-gap] duration-600 ease-out-strong"
                            data-film="stats"
                            style={{ columnGap: gaps.across, marginTop: gaps.down, ...timing }}
                        >
                            <AgentStat
                                delta="+4.2%"
                                film="first"
                                fixed={state.first}
                                groups={state.groups}
                                label="Paid on time"
                                marks={state.marks}
                                trend="success"
                                value="81%"
                            />
                            <AgentStat
                                delay={0}
                                delta="+3"
                                fixed={state.rest}
                                label="Clients billed"
                                trend="success"
                                value="24"
                            />
                            <AgentStat
                                delay={120}
                                delta="−2 days"
                                fixed={state.rest}
                                label="Time to pay"
                                trend="success"
                                value="18 days"
                            />
                        </div>
                    </PageContent>
                </div>
            </Frame>
        </div>
    );
};
