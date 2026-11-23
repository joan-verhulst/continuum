'use client';

import {
    AppPanel,
    AppShell,
    Avatar,
    Badge,
    BarList,
    BarListItem,
    Breadcrumb,
    BreadcrumbHome,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    Button,
    Card,
    DropdownMenuItem,
    HeaderBar,
    IconTile,
    PageContent,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Sidebar,
    SidebarAccount,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarItem,
    SidebarLogo,
    SidebarSwitcher,
    SidebarSwitcherMark,
    SidebarToggle,
    StatCard,
} from 'continuum';
import { ChartCard, Sparkline } from 'continuum/charts';
import {
    ArrowRight,
    Bell,
    Boxes,
    ChartColumn,
    CircleAlert,
    Download,
    Ellipsis,
    Inbox,
    LayoutDashboard,
    LifeBuoy,
    Receipt,
    Settings,
    Sparkles,
    TrendingUp,
    UserPlus,
    UserRoundX,
    Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
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
 * The after of the landing's before and after: the overview of one workspace, built from the
 * library's parts as the skill composes an overview. The shell in full (the workspace, the places
 * with what waits in them, the account), the page head with the period it reads, the four figures
 * each with its twelve weeks and the two figures beside it, where the revenue moved week by week,
 * then what needs the reader, by plan, and what moved. One column, in reading order.
 */

const icon = { strokeWidth: 2 } as const;

const navIcons: Record<string, ReactNode> = {
    overview: <LayoutDashboard {...icon} />,
    customers: <Users {...icon} />,
    invoices: <Receipt {...icon} />,
    reports: <ChartColumn {...icon} />,
    inbox: <Inbox {...icon} />,
    agent: <Sparkles {...icon} />,
    settings: <Settings {...icon} />,
    help: <LifeBuoy {...icon} />,
};

const activityIcons = {
    new: { icon: <UserPlus {...icon} />, tone: 'success' },
    trial: { icon: <Sparkles {...icon} />, tone: 'primary' },
    failed: { icon: <CircleAlert {...icon} />, tone: 'warning' },
    upgrade: { icon: <TrendingUp {...icon} />, tone: 'success' },
    cancel: { icon: <UserRoundX {...icon} />, tone: undefined },
} as const;

const euro = (value: number) =>
    new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
    }).format(value);

// Churn as the amount lost, beside what came in, rather than under the axis.
const movementShown = movement.map(row => ({ ...row, churned: -row.churn }));

const Menu = ({ label }: { label: string }) => (
    <Button aria-label={`${label} options`} size="icon-sm" variant="ghost">
        <Ellipsis {...icon} />
    </Button>
);

const ScreenSidebar = () => (
    <Sidebar>
        <SidebarHeader>
            <SidebarLogo>
                <Boxes {...icon} />
            </SidebarLogo>
            <SidebarToggle />
        </SidebarHeader>
        <SidebarSwitcher
            aria-label={`${workspace.name}. Switch workspace`}
            detail={workspace.plan}
            mark={<SidebarSwitcherMark size={28}>A</SidebarSwitcherMark>}
            name={workspace.name}
            placement="top"
        >
            <DropdownMenuItem>{workspace.name}</DropdownMenuItem>
        </SidebarSwitcher>
        <SidebarGroup aria-label="Main">
            {nav.map(item => (
                <SidebarItem
                    active={item.id === 'overview'}
                    icon={navIcons[item.id]}
                    key={item.id}
                    trailing={
                        'count' in item ? <Badge variant="count">{item.count}</Badge> : undefined
                    }
                >
                    {item.label}
                </SidebarItem>
            ))}
        </SidebarGroup>
        <SidebarGroup aria-label="Workspace" label="Workspace">
            {navWorkspace.map(item => (
                <SidebarItem icon={navIcons[item.id]} key={item.id}>
                    {item.label}
                </SidebarItem>
            ))}
        </SidebarGroup>
        <SidebarFooter>
            <SidebarAccount
                avatar={<Avatar fallback={user.initials} />}
                detail={user.email}
                name={user.name}
            />
            <Button aria-label="Notifications" size="icon" variant="ghost">
                <Bell className="size-4.5" {...icon} />
            </Button>
        </SidebarFooter>
    </Sidebar>
);

/**
 * A side panel's section: a head with its title, one step over the rows it holds, its count and a
 * line of what is at stake; "View all" at its right, since the list can grow. Then its content.
 * Sections are parted by a full-width hairline.
 */
const PanelSection = ({
    title,
    count,
    line,
    children,
}: {
    title: string;
    count?: number;
    line?: ReactNode;
    children: ReactNode;
}) => (
    <section className="flex flex-col gap-4 border-neutral-200 border-b @max-shell-compact/shell:px-4 px-5 pt-4 pb-5 last:border-b-0">
        <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-0.5">
                <h2 className="flex h-6 items-center gap-2 font-medium text-neutral-950 text-sm">
                    {title}
                    {count !== undefined && <Badge variant="count">{count}</Badge>}
                </h2>
                {line && <p className="text-neutral-600 text-xs">{line}</p>}
            </div>
            <Button className="-mr-2" variant="ghost">
                View all
            </Button>
        </div>
        {children}
    </section>
);

/** When an event was, as the day it is grouped under. */
const dayOf = (when: string) =>
    /min|hour/.test(when) ? 'Today' : when === 'Yesterday' ? 'Yesterday' : 'Earlier';

const days = ['Today', 'Yesterday', 'Earlier'] as const;

/** What the accounts that need the reader bring in a month, together. */
const atRisk = attention.reduce((sum, row) => sum + Number(row.mrr.replace(/[^0-9]/g, '')), 0);

/**
 * The side panel (pages.md): 360 at the panel's right edge behind a full-height hairline. What waits
 * on the reader first, each account a unit of its own led by what is wrong; then what moved, as a
 * timeline by day.
 */
const SidePanel = () => (
    <aside
        aria-label="Needs attention and what moved"
        className="flex @max-shell-sidebar/shell:w-full w-90 shrink-0 flex-col overflow-hidden border-neutral-200 @max-shell-sidebar/shell:border-t border-l @max-shell-sidebar/shell:border-l-0"
    >
        <PanelSection
            count={attention.length}
            line={`${euro(atRisk)} a month at risk`}
            title="Needs attention"
        >
            <ul className="flex flex-col gap-2">
                {attention.map(row => (
                    // One account, read and acted on as one: a box of its own on control corners.
                    // Who and what is at stake lead; what is wrong and what to do about it close it,
                    // in a foot of their own.
                    <li
                        className="flex flex-col overflow-hidden rounded-control border border-neutral-200"
                        key={row.account}
                    >
                        <div className="flex items-center gap-3 p-3">
                            <Avatar
                                fallback={row.account.slice(0, 2).toUpperCase()}
                                shape="square"
                                size={32}
                                tone="neutral"
                            />
                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <span className="truncate font-medium text-neutral-950 text-sm">
                                    {row.account}
                                </span>
                                <span className="truncate text-neutral-600 text-xs">
                                    {row.detail}
                                </span>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-0.5">
                                <span className="font-medium text-neutral-950 text-sm tabular-nums">
                                    {row.mrr}
                                </span>
                                <span className="text-neutral-600 text-xs">a month</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 border-neutral-200 border-t bg-neutral-100 py-1.5 pr-1.5 pl-3">
                            <Badge tone={row.tone}>{row.issue}</Badge>
                            <Button variant="ghost">
                                {row.action}
                                <ArrowRight {...icon} />
                            </Button>
                        </div>
                    </li>
                ))}
            </ul>
        </PanelSection>
        <PanelSection title="What moved">
            <div className="flex flex-col gap-4">
                {days.map(day => {
                    const events = activity.filter(item => dayOf(item.when) === day);
                    if (!events.length) return null;
                    return (
                        <div className="flex flex-col gap-3" key={day}>
                            <span className="text-neutral-600 text-xs">{day}</span>
                            {/* Each event a box of its own, as the accounts above are: what happened, then when. */}
                            <ol className="flex flex-col gap-2">
                                {events.map(item => (
                                    <li
                                        className="flex items-center gap-3 rounded-control border border-neutral-200 p-3"
                                        key={item.what}
                                    >
                                        <IconTile
                                            aria-hidden
                                            tone={activityIcons[item.kind].tone}
                                            variant="outline"
                                        >
                                            {activityIcons[item.kind].icon}
                                        </IconTile>
                                        <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-xs">
                                            <p className="truncate text-neutral-950">{item.what}</p>
                                            {/* A time that only names its day is said once, by the day. */}
                                            {item.when !== day && (
                                                <p className="text-neutral-600">{item.when}</p>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    );
                })}
            </div>
        </PanelSection>
    </aside>
);

export const ContinuumScreen = () => (
    <AppShell className="h-full min-h-0">
        <ScreenSidebar />
        <AppPanel>
            <HeaderBar>
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="#">
                                <BreadcrumbHome />
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Overview</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                {/* The one action on the page as a whole: its figures, to take away. Narrow, the
                    bar's actions hide. */}
                <Button className="ml-auto @max-shell-sidebar/shell:hidden" variant="ghost">
                    <Download {...icon} />
                    Export
                </Button>
            </HeaderBar>
            {/* The page's column, and beside it the side panel: what waits on the reader stays in
                view while the figures change with the period. Narrow, the panel comes under it. */}
            <div className="flex min-h-0 flex-1 @max-shell-sidebar/shell:flex-col">
                <div className="min-w-0 @max-shell-sidebar/shell:flex-none flex-1 overflow-hidden">
                    <PageContent
                        className="flex flex-col gap-10 @max-shell-sidebar/shell:pb-10 pb-24"
                        width="default"
                    >
                        {/* Compact, the head stacks: the title and its line, the period under them. */}
                        <div className="flex @max-shell-compact/shell:flex-col @max-shell-compact/shell:items-start items-end justify-between @max-shell-compact/shell:gap-4 gap-6">
                            <div className="flex min-w-0 flex-col gap-1.5">
                                <h1 className="font-medium text-2xl text-neutral-950">Overview</h1>
                                <p className="text-neutral-600 text-sm">
                                    How {workspace.name} is doing {period.words}.
                                </p>
                            </div>
                            <Select defaultValue="quarter">
                                <SelectTrigger aria-label="Period" className="w-36" size="sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="month">Last 4 weeks</SelectItem>
                                    <SelectItem value="quarter">{period.label}</SelectItem>
                                    <SelectItem value="half">Last 26 weeks</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* The figures first, each with its twelve weeks and the two beside it. */}
                        {/* Two across under the sidebar's width; one on a phone, where two would cut
                            each label short. */}
                        <div className="grid @max-shell-compact/shell:grid-cols-1 @max-shell-sidebar/shell:grid-cols-2 grid-cols-4 gap-3">
                            {kpis.map(kpi => (
                                <StatCard
                                    actions={<Menu label={kpi.label} />}
                                    chart={
                                        <Sparkline
                                            aria-label={`${kpi.label}, the last twelve weeks`}
                                            data={kpi.series}
                                            kind={kpi.id === 'new' ? 'bar' : 'area'}
                                            labels={[
                                                { at: 0, label: weekLabels[0] },
                                                { at: kpi.series.length - 1, label: 'This week' },
                                            ]}
                                        />
                                    }
                                    delta={kpi.delta}
                                    facts={kpi.facts}
                                    key={kpi.id}
                                    label={kpi.label}
                                    trend={kpi.good === null ? 'neutral' : kpi.good ? 'up' : 'down'}
                                    value={kpi.value}
                                />
                            ))}
                        </div>

                        {/* What leads: the revenue, and where it moved week by week to get there. */}
                        <ChartCard
                            comparison={period.words}
                            data={movementShown}
                            delta={mrr.delta}
                            formatValue={euro}
                            formatY={value => `€${value}`}
                            height={200}
                            icon={<Receipt {...icon} />}
                            kind="bar"
                            series={[
                                { key: 'new', name: 'New' },
                                { key: 'expansion', name: 'Expansion' },
                                { key: 'churned', name: 'Churned', color: 'neutral' },
                            ]}
                            title="Monthly recurring revenue"
                            trend="up"
                            value={mrr.value}
                            x="week"
                        />

                        <Card layout="list">
                            <BarList title="Recurring revenue by plan" valueLabel="A month">
                                {byPlan.map(plan => (
                                    <BarListItem
                                        displayValue={euro(plan.revenue)}
                                        key={plan.plan}
                                        value={plan.revenue}
                                    >
                                        {plan.plan}
                                    </BarListItem>
                                ))}
                            </BarList>
                        </Card>
                    </PageContent>
                </div>
                <SidePanel />
            </div>
        </AppPanel>
    </AppShell>
);
