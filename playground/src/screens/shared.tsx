import {
    Avatar,
    Breadcrumb,
    BreadcrumbHome,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    Button,
    CardDelta,
    CardHeader,
    CardTitle,
    CardValue,
    cn,
    pageContentVariants,
    Rail,
    RailItem,
    RailSeparator,
    SidebarAccount,
    SidebarFooter,
} from 'continuum';
import { type TooltipRow, useChartStable } from 'continuum/charts';
import {
    Bell,
    ChartColumn,
    Globe,
    LayoutGrid,
    type LucideIcon,
    MessagesSquare,
    PanelLeft,
    Plus,
} from 'lucide-react';
import { Fragment, type ReactNode, useState } from 'react';

const railItems = [
    { id: 'dashboards', label: 'Dashboards', icon: <LayoutGrid strokeWidth={2} /> },
    { id: 'analytics', label: 'Analytics', icon: <ChartColumn strokeWidth={2} /> },
    { id: 'regions', label: 'Regions', icon: <Globe strokeWidth={2} /> },
    { id: 'feedback', label: 'Feedback', icon: <MessagesSquare strokeWidth={2} /> },
];

/** The floating capsule nav the analytics screens share, 32px from the left, centred. */
const AnalyticsRail = ({ initial }: { initial: string }) => {
    const [active, setActive] = useState(initial);

    return (
        <Rail aria-label="Main" className="absolute top-1/2 left-8 z-20 -translate-y-1/2">
            <RailItem label="Toggle sidebar">
                <PanelLeft strokeWidth={2} />
            </RailItem>
            <RailSeparator />
            {railItems.map(item => (
                <RailItem
                    active={active === item.id}
                    aria-current={active === item.id ? 'page' : undefined}
                    key={item.id}
                    label={item.label}
                    onClick={() => setActive(item.id)}
                >
                    {item.icon}
                </RailItem>
            ))}
            <RailSeparator />
            <RailItem label="Notifications">
                <Bell strokeWidth={2} />
            </RailItem>
            <Avatar alt="Northwind" className="mt-1" fallback="N" />
        </Rail>
    );
};

/**
 * Breadcrumb trail plus the "Add to Ask" action that tops every analytics page.
 * Sticky, with the fade the screens draw so content slides out beneath it.
 */
export const AnalyticsTopBar = ({ trail }: { trail: string[] }) => (
    <div className="sticky top-0 z-10 flex h-[54px] shrink-0 items-center justify-between gap-4 bg-linear-to-b from-60% from-neutral-50 to-transparent">
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink href="#">
                        <BreadcrumbHome />
                    </BreadcrumbLink>
                </BreadcrumbItem>
                {trail.map((crumb, i) => (
                    <Fragment key={crumb}>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            {i === trail.length - 1 ? (
                                <BreadcrumbPage>{crumb}</BreadcrumbPage>
                            ) : (
                                <BreadcrumbLink href="#">{crumb}</BreadcrumbLink>
                            )}
                        </BreadcrumbItem>
                    </Fragment>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
        <Button>
            Add to Ask
            <Plus strokeWidth={2} />
        </Button>
    </div>
);

/**
 * Page frame of the analytics screens: an 896px column centred on the canvas,
 * the rail floating over its left edge and a floating BottomBar pinned to the
 * bottom of the frame. The column scrolls on its own so the rail and the bar
 * stay put in whatever frame holds it.
 */
export const AnalyticsPage = ({
    rail,
    children,
    bottomBar,
}: {
    rail: string;
    children: ReactNode;
    /** A `<BottomBar floating>`; this frame is its positioned parent. */
    bottomBar?: ReactNode;
}) => (
    <div className="relative h-full min-w-[1200px] bg-neutral-50">
        <AnalyticsRail initial={rail} />
        <div className="h-full overflow-y-auto">
            <div
                className={cn(
                    pageContentVariants(),
                    'flex flex-col pt-5',
                    bottomBar ? 'pb-28' : 'pb-12',
                )}
            >
                {children}
            </div>
        </div>
        {bottomBar}
    </div>
);

/** Card header of the analytics charts: muted title over a big value and its change. */
export const ChartCardHeader = ({
    title,
    value,
    delta,
    trend,
    size = 'xl',
}: {
    title: ReactNode;
    value: ReactNode;
    delta: ReactNode;
    trend?: 'up' | 'down';
    size?: 'lg' | 'xl';
}) => (
    <CardHeader>
        <CardTitle>{title}</CardTitle>
        <div className="flex items-baseline gap-2">
            <CardValue size={size}>{value}</CardValue>
            <CardDelta trend={trend}>{delta}</CardDelta>
        </div>
    </CardHeader>
);

/**
 * Room for the y tick labels on the left and the x labels underneath. The kit's
 * 40px on every side leaves an empty band above and beside a chart in a card.
 */
export const chartMargin = { top: 16, right: 16, bottom: 32, left: 40 };

/** The week the analytics screens report on: Monday 19 to Sunday 25 October 2026. */
export const reportWeek = Array.from({ length: 7 }, (_, i) => new Date(2026, 9, 19 + i));

/** Weekday names on the x-axis, as the screens were drawn ("Mon", "Tue" …). */
export const formatWeekday = (date: Date) => date.toLocaleDateString('en-GB', { weekday: 'short' });

/** One tooltip row per series, with a readable name instead of the data key. */
export const seriesRows =
    (
        series: { key: string; label: string; color: string }[],
        format: (value: number) => string = String,
    ) =>
    (point: Record<string, unknown>): TooltipRow[] =>
        series.map(({ key, label, color }) => ({
            color,
            label,
            value: format(Number(point[key] ?? 0)),
        }));

/**
 * Marks one data point with a dashed rule and an icon disc at the top of the
 * plot, such as the day a release went out. The kit has no annotation part, so
 * this draws one from the chart's own scales and marker tokens.
 */
export const ChartAnnotation = ({ index, icon: Icon }: { index: number; icon?: LucideIcon }) => {
    const { data, xScale, xAccessor, innerHeight } = useChartStable();
    const point = data[index];
    if (!point) return null;

    // Half a pixel off the whole pixel, so the 1px rule lands crisp.
    const x = Math.round(xScale(xAccessor(point)) ?? 0) + 0.5;

    return (
        <g data-slot="chart-annotation" pointerEvents="none">
            <line
                stroke="var(--color-chart-crosshair)"
                strokeDasharray="4 4"
                x1={x}
                x2={x}
                y1={0}
                y2={innerHeight}
            />
            {Icon && (
                <>
                    <circle
                        cx={x}
                        cy={0}
                        fill="var(--color-chart-marker-background)"
                        r={12}
                        stroke="var(--color-chart-marker-border)"
                    />
                    <Icon
                        color="var(--color-chart-marker-foreground)"
                        height={12}
                        strokeWidth={2}
                        width={12}
                        x={x - 6}
                        y={-6}
                    />
                </>
            )}
        </g>
    );
};
// Drawn after the series and outside their reveal clip, so the disc is not cut off at the top.
ChartAnnotation.__isPostOverlay = true;

/** A dark square with a white 16px glyph: the workspace logo in a sidebar footer. */
export const WorkspaceMark = ({ children }: { children: ReactNode }) => (
    <span className="grid size-full place-items-center bg-neutral-950 text-neutral-50 [&_svg]:size-4">
        {children}
    </span>
);

/** The sidebar footer every app screen shares: who is signed in, and a bell. */
export const AccountFooter = ({
    avatar,
    name,
    plan,
}: {
    avatar: ReactNode;
    name: ReactNode;
    plan?: ReactNode;
}) => (
    <SidebarFooter>
        <SidebarAccount avatar={avatar} name={name} plan={plan} />
        <Button aria-label="Notifications" size="icon" variant="ghost">
            <Bell className="size-[18px]" strokeWidth={2} />
        </Button>
    </SidebarFooter>
);

/** Page and section headings as drawn; the system has no Heading component. */
export const PageTitle = ({ children }: { children: ReactNode }) => (
    <h1 className="font-medium text-2xl text-neutral-950">{children}</h1>
);

const titleSizes = { sm: 'text-sm', base: 'text-base', lg: 'text-lg' } as const;

export const SectionTitle = ({
    title,
    description,
    as: Tag = 'h2',
    size = 'base',
    lead = false,
}: {
    title: ReactNode;
    description?: ReactNode;
    as?: 'h1' | 'h2';
    size?: keyof typeof titleSizes;
    /** Sets the description at 16px, as the report generator draws it. */
    lead?: boolean;
}) => (
    <div className={cn('flex max-w-[500px] flex-col', lead ? 'gap-2' : 'gap-1.5')}>
        <Tag className={cn('font-medium text-neutral-950', titleSizes[size])}>{title}</Tag>
        {description && (
            <p className={cn('text-neutral-600', lead ? 'text-base' : 'text-sm')}>{description}</p>
        )}
    </div>
);
