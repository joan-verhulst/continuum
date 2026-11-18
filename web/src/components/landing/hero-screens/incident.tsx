'use client';

import {
    ActivityItem,
    ActivityList,
    AppPanel,
    AppShell,
    Avatar,
    Badge,
    Breadcrumb,
    BreadcrumbHome,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    Button,
    Card,
    CardTitle,
    HeaderBar,
    LiveCount,
    PageContent,
    SegmentedControl,
    SegmentedControlItem,
    Sidebar,
    SidebarAccount,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarItem,
    SidebarLogo,
    SidebarToggle,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableSearch,
    TableToolbar,
    TableToolbarEnd,
} from 'continuum';
import { ChartCard, useChart } from 'continuum/charts';
import {
    Activity,
    BellRing,
    BookOpen,
    CircleCheck,
    Gauge,
    LayoutGrid,
    Megaphone,
    Plug,
    Radar,
    Rocket,
    Server,
    Settings,
    Siren,
    Undo2,
    UserCheck,
    Users,
} from 'lucide-react';
import { type ReactNode, useLayoutEffect, useState } from 'react';

/*
 * Vigil, an observability tool, on the page of an incident while it is still open: checkout-api's
 * p95 latency went over its 2 s threshold after the 13:58 deploy, the alert fired at 14:02, the
 * deploy was rolled back at 14:16 and the numbers are coming down but not yet under the line. It is
 * 14:25, 23 minutes in.
 *
 * A detail page, so the incident's own title row leads: its name, severity and state, who leads it
 * and who is on call, and the one thing to do, Resolve incident. Under it what an SRE reads while it
 * runs: latency against its threshold and the error rate, the services it reaches, the requests as
 * they come in, and what has been done so far.
 *
 * Drawn at its real size like the suite's screens (shell.tsx), at least 1408 × 792 with the page 722
 * under the header bar. The title row stands 96 below the bar at every size, the charts take a share
 * of a larger window's room, and the log and the timeline run on past the panel's foot, as a live
 * log scrolls. Nothing in it opens a portal, and every colour is a token.
 */

const icon = { strokeWidth: 2 } as const;

/* ---------- The shell: Vigil's own ---------- */

/** The page's height at the smallest size the screen is drawn at: the panel's 776 less the bar's 54. */
const LEAST_ROOM = 722;

const WorkspaceMark = () => (
    <span className="grid size-full place-items-center bg-action font-medium text-on-action text-xs">
        H
    </span>
);

const VigilSidebar = () => (
    <Sidebar>
        <SidebarHeader>
            <SidebarLogo>
                <Radar {...icon} />
            </SidebarLogo>
            <SidebarToggle />
        </SidebarHeader>
        <SidebarGroup aria-label="Main">
            <SidebarItem
                active
                icon={<Siren {...icon} />}
                trailing={<Badge variant="count">2</Badge>}
            >
                Incidents
            </SidebarItem>
            <SidebarItem icon={<BellRing {...icon} />}>Alerts</SidebarItem>
            <SidebarItem icon={<Server {...icon} />}>Services</SidebarItem>
            <SidebarItem icon={<Activity {...icon} />}>Traces</SidebarItem>
            <SidebarItem icon={<LayoutGrid {...icon} />}>Dashboards</SidebarItem>
            <SidebarItem icon={<Users {...icon} />}>On-call</SidebarItem>
            <SidebarItem icon={<BookOpen {...icon} />}>Runbooks</SidebarItem>
        </SidebarGroup>
        <SidebarGroup aria-label="Workspace" label="Workspace">
            <SidebarItem icon={<Plug {...icon} />}>Integrations</SidebarItem>
            <SidebarItem icon={<Settings {...icon} />}>Settings</SidebarItem>
        </SidebarGroup>
        <SidebarFooter>
            <SidebarAccount avatar={<WorkspaceMark />} name="Halden" detail="Production" />
        </SidebarFooter>
    </Sidebar>
);

const Trail = () => (
    <Breadcrumb>
        <BreadcrumbList>
            <BreadcrumbItem>
                <BreadcrumbLink href="#">
                    <BreadcrumbHome />
                </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
                <BreadcrumbLink href="#">Incidents</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
                <BreadcrumbPage>INC-2318</BreadcrumbPage>
            </BreadcrumbItem>
        </BreadcrumbList>
    </Breadcrumb>
);

/* ---------- The data: the last hour, 13:25 to 14:25, a reading a minute ---------- */

const START = new Date(2026, 10, 16, 13, 25);
const minute = (i: number) => new Date(START.getTime() + i * 60_000);
const clock = (date: Date) =>
    date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

/** The row of a time on the hour's axis. */
const at = (hours: number, minutes: number) => (hours - 13) * 60 + minutes - 25;
const DEPLOY = at(13, 58);
const FIRED = at(14, 2);
const ROLLBACK = at(14, 16);
const NOW = at(14, 25);

const THRESHOLD = 2000;

/** A seeded jitter, so the readings look measured and are the same on every render. */
const jitter = (i: number, seed: number) =>
    Math.sin(i * 1.7 + seed) * 0.5 +
    Math.sin(i * 0.43 + seed * 3) * 0.35 +
    Math.cos(i * 2.9) * 0.15;

const readings = Array.from({ length: NOW + 1 }, (_, i) => {
    // Quiet at 640 ms; from the deploy it climbs to about 3.4 s, and from the rollback it comes
    // back down, a minute behind as the old pods take the traffic again.
    const rise = i < DEPLOY ? 0 : Math.min(1, (i - DEPLOY) / 9);
    const fall = i < ROLLBACK + 2 ? 0 : Math.min(0.62, (i - ROLLBACK - 2) * 0.09);
    const level = rise * (1 - fall);
    const latency = 640 + level * 2760 + jitter(i, 1) * (60 + level * 260);
    const errors = 0.18 + level * 6 + jitter(i, 5) * (0.06 + level * 0.7);
    return {
        time: minute(i),
        latency: Math.round(latency),
        errors: Math.max(0.05, Math.round(errors * 100) / 100),
    };
});

/** What happened in the hour, as the chart's own markers: a rule with its label at the foot. */
const markers = [
    { index: FIRED, label: 'Alert 14:02', tone: 'error' as const },
    { index: ROLLBACK, label: 'Rollback 14:16' },
];

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

/** A good change, in the ink the chart card writes its own change in (charts.md, the card). */
const goodInk = 'text-[color-mix(in_oklab,var(--color-success-500)_62%,var(--color-neutral-950))]';

/* ---------- The parts ---------- */

/** The alert's threshold across the plot: a faint dashed rule, its value at the quiet left end. */
const Threshold = () => {
    const { plot, yOf } = useChart();
    const y = Math.round(yOf(THRESHOLD)) + 0.5;
    return (
        <g aria-hidden>
            <line
                stroke="var(--color-error-500)"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
                strokeWidth={1}
                x1={plot.left}
                x2={plot.left + plot.width}
                y1={y}
                y2={y}
            />
            <text
                className="fill-error-600 text-xxs tabular-nums"
                dominantBaseline="text-after-edge"
                textAnchor="start"
                x={plot.left + 8}
                y={y - 3}
            >
                Alert at 2.0 s
            </text>
        </g>
    );
};

/** The error rate after the latency's change: the incident's second figure, quieter than its first. */
const ErrorRate = () => (
    <>
        from the 14:14 peak
        <span aria-hidden className="px-2">
            ·
        </span>
        <span className="font-medium text-neutral-950 tabular-nums">1.9%</span> 5xx{' '}
        <span className={`font-medium tabular-nums ${goodInk}`}>−4.3 pts</span>
    </>
);

// Only what the incident reaches: checkout-api itself, and the two that wait on it.
const services: { name: string; reading: string; health: string; tone: 'warning' | 'error' }[] = [
    { name: 'checkout-api', reading: 'p95 2.31 s · 1.9% 5xx', health: 'Degraded', tone: 'error' },
    { name: 'payments-gateway', reading: 'p95 1.48 s · 0.6% 5xx', health: 'Slow', tone: 'warning' },
    { name: 'storefront-web', reading: 'p95 1.12 s · 0.2% 5xx', health: 'Slow', tone: 'warning' },
];

// Who is working the incident, and as what.
const responders = [
    { initials: 'PR', name: 'Priya Raman', role: 'Incident lead' },
    { initials: 'JW', name: 'Jonas Weber', role: 'On-call' },
    { initials: 'AO', name: 'Ade Okafor', role: 'Comms' },
];

/** The responders, a short list: a 24 avatar and the name, the role at the row's end. */
const RespondersCard = () => (
    <Card layout="list">
        <CardTitle>Responders</CardTitle>
        <Table variant="rows">
            <TableBody>
                {responders.map(person => (
                    <TableRow key={person.name}>
                        {/* The 24 avatar sits in the row's 34 without the cell's own padding. */}
                        <TableCell className="py-0">
                            <span className="flex min-w-0 items-center gap-2">
                                <Avatar
                                    alt={person.name}
                                    fallback={person.initials}
                                    shape="round"
                                    size={24}
                                />
                                <span className="truncate">{person.name}</span>
                            </span>
                        </TableCell>
                        <TableCell align="right" className="text-neutral-600">
                            {person.role}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </Card>
);

const ServicesCard = () => (
    <Card layout="list">
        <CardTitle>Affected services</CardTitle>
        <Table variant="rows">
            <TableBody>
                {services.map(service => (
                    <TableRow key={service.name}>
                        {/* A second line of meta under the name: the row's 54 rather than 34. */}
                        <TableCell>
                            <span className="flex flex-col gap-1">
                                <span className="font-mono">{service.name}</span>
                                <span className="text-neutral-600 tabular-nums">
                                    {service.reading}
                                </span>
                            </span>
                        </TableCell>
                        <TableCell align="right" className="py-0">
                            <Badge tone={service.tone} variant="dot">
                                {service.health}
                            </Badge>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </Card>
);

const timeline: {
    title: string;
    time: string;
    icon: ReactNode;
    tone: 'neutral' | 'success' | 'error' | 'primary';
}[] = [
    {
        title: 'Status page updated',
        time: '14:19 · Ade Okafor',
        icon: <Megaphone {...icon} />,
        tone: 'primary',
    },
    {
        title: 'Rolled back to v4.18.1',
        time: '14:16 · Jonas Weber',
        icon: <Undo2 {...icon} />,
        tone: 'success',
    },
    {
        title: 'Traced to v4.18.2’s pool size',
        time: '14:12 · Priya Raman',
        icon: <Activity {...icon} />,
        tone: 'neutral',
    },
    {
        title: 'Priya Raman took the lead',
        time: '14:06 · Raised to SEV-2',
        icon: <Siren {...icon} />,
        tone: 'neutral',
    },
    {
        title: 'Jonas Weber acknowledged',
        time: '14:04 · Paged at 14:02',
        icon: <UserCheck {...icon} />,
        tone: 'neutral',
    },
    {
        title: 'Alert fired: p95 over 2 s',
        time: '14:02 · Alertmanager',
        icon: <BellRing {...icon} />,
        tone: 'error',
    },
    {
        title: 'Deployed checkout-api v4.18.2',
        time: '13:58 · Buildkite',
        icon: <Rocket {...icon} />,
        tone: 'neutral',
    },
];

/** What has been done so far, the latest first; it runs on past the panel's foot as the log does. */
const TimelineCard = () => (
    <Card layout="list">
        <CardTitle>Timeline</CardTitle>
        <ActivityList>
            {timeline.map(item => (
                <ActivityItem
                    icon={item.icon}
                    key={item.title}
                    time={item.time}
                    title={item.title}
                    tone={item.tone}
                />
            ))}
        </ActivityList>
    </Card>
);

type Request = {
    time: string;
    id: string;
    route: string;
    status: number;
    duration: number;
};

// The latest requests through checkout-api, newest first: the slow ones still come, fewer.
const requests: Request[] = [
    {
        time: '14:25:41.208',
        id: 'req_8fk2x9a1',
        route: 'POST /v2/checkout/sessions',
        status: 200,
        duration: 2318,
    },
    {
        time: '14:25:40.877',
        id: 'req_3mq7c0de',
        route: 'POST /v2/checkout/sessions',
        status: 504,
        duration: 5000,
    },
    {
        time: '14:25:40.412',
        id: 'req_b71ka4zt',
        route: 'GET /v2/cart/{id}',
        status: 200,
        duration: 148,
    },
    {
        time: '14:25:39.960',
        id: 'req_x0p2n6lw',
        route: 'POST /v2/payments/intents',
        status: 502,
        duration: 3412,
    },
    {
        time: '14:25:39.531',
        id: 'req_6hd9e2qu',
        route: 'POST /v2/checkout/sessions',
        status: 200,
        duration: 1964,
    },
    {
        time: '14:25:39.106',
        id: 'req_k4s8v1mb',
        route: 'GET /v2/shipping/rates',
        status: 200,
        duration: 412,
    },
    {
        time: '14:25:38.742',
        id: 'req_r9t3w5yc',
        route: 'POST /v2/checkout/sessions',
        status: 429,
        duration: 12,
    },
    {
        time: '14:25:38.309',
        id: 'req_2zj6f8gh',
        route: 'POST /v2/payments/intents',
        status: 200,
        duration: 2706,
    },
    {
        time: '14:25:37.884',
        id: 'req_n5c1u7ra',
        route: 'GET /v2/cart/{id}',
        status: 200,
        duration: 131,
    },
    {
        time: '14:25:37.450',
        id: 'req_w8e4l2ks',
        route: 'POST /v2/checkout/sessions',
        status: 504,
        duration: 5000,
    },
    {
        time: '14:25:37.019',
        id: 'req_q1y5o9bv',
        route: 'POST /v2/checkout/sessions',
        status: 200,
        duration: 2140,
    },
    {
        time: '14:25:36.588',
        id: 'req_d7g3i6mx',
        route: 'GET /v2/shipping/rates',
        status: 200,
        duration: 388,
    },
];

const statusTone = (status: number) =>
    status >= 500 ? 'error' : status >= 400 ? 'warning' : 'neutral';

const ms = new Intl.NumberFormat('en-GB');

const RequestLog = () => {
    const [view, setView] = useState('all');
    const shown = requests.filter(request =>
        view === '5xx'
            ? request.status >= 500
            : view === 'slow'
              ? request.duration >= THRESHOLD
              : true,
    );
    return (
        <Table
            toolbar={
                <TableToolbar>
                    <TableSearch aria-label="Search requests" placeholder="Request ID or route" />
                    <TableToolbarEnd>
                        <LiveCount className="mr-2" count={412} label="a minute" />
                        <SegmentedControl
                            aria-label="Requests"
                            onValueChange={next => setView(next as string)}
                            value={view}
                        >
                            <SegmentedControlItem value="all">All</SegmentedControlItem>
                            <SegmentedControlItem value="5xx">5xx</SegmentedControlItem>
                            <SegmentedControlItem value="slow">Over 2 s</SegmentedControlItem>
                        </SegmentedControl>
                    </TableToolbarEnd>
                </TableToolbar>
            }
            wrapperClassName="col-span-2"
        >
            <TableHeader>
                <TableRow>
                    <TableHead className="w-32">Time</TableHead>
                    <TableHead className="w-32">Request</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead className="w-20">Status</TableHead>
                    <TableHead className="w-24" numeric>
                        Duration
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {shown.map(request => (
                    <TableRow key={request.id}>
                        <TableCell className="font-normal text-neutral-700 tabular-nums">
                            {request.time}
                        </TableCell>
                        <TableCell className="font-mono font-normal">{request.id}</TableCell>
                        <TableCell className="max-w-0 truncate font-normal text-neutral-700">
                            {request.route}
                        </TableCell>
                        {/* The badge is 22 in a 41 row: the cell's own padding would push it to 46. */}
                        <TableCell className="py-0">
                            <Badge tone={statusTone(request.status)}>{request.status}</Badge>
                        </TableCell>
                        <TableCell
                            className={
                                request.duration >= THRESHOLD ? 'text-error-600' : 'font-normal'
                            }
                            numeric
                        >
                            {ms.format(request.duration)} ms
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

/**
 * The incident's page head, plain: the title and its severity, one line of what state it is in and
 * who leads it, and its two actions at the right, bottom-aligned with the line.
 */
const TitleRow = () => (
    <div className="flex items-end justify-between gap-6">
        <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex min-w-0 items-center gap-2">
                <h1 className="truncate font-medium text-2xl text-neutral-950">
                    Checkout API p95 latency above 2s
                </h1>
                <Badge tone="error">SEV-2</Badge>
            </div>
            <p className="truncate text-neutral-600 text-sm">
                INC-2318 · Mitigating · opened 14:02, 23 min ago
            </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
            <Button variant="secondary">
                <Megaphone {...icon} />
                Post update
            </Button>
            <Button>
                <CircleCheck {...icon} />
                Resolve incident
            </Button>
        </div>
    </div>
);

/* ---------- The page ---------- */

/** What stands over the lead: the page's 96, the title row and the gap under it. */
const TOP = 96;
const TITLE = 54;
const TITLE_GAP = 44;

const Incident = ({ room }: { room: number }) => {
    // The lead's plot takes about a third of the room under the title row, never less than 180;
    // the log and the side column under it run on past the panel's foot, as a live log scrolls.
    const plot = Math.min(360, Math.max(180, Math.round((room - TOP - TITLE - TITLE_GAP) * 0.3)));
    return (
        <PageContent
            className="flex flex-col gap-11 px-6"
            style={{ paddingTop: TOP }}
            width="dense"
        >
            <TitleRow />
            <div className="flex flex-col gap-4">
                <ChartCard
                    comparison={<ErrorRate />}
                    data={readings}
                    delta="−1.09 s"
                    formatTitle={clock}
                    formatX={clock}
                    formatY={seconds}
                    height={plot}
                    icon={<Gauge />}
                    incompleteFrom={NOW - 1}
                    markers={markers}
                    series={[{ key: 'latency', name: 'p95 latency' }]}
                    title="p95 latency · checkout-api"
                    trend="up"
                    value="2.31 s"
                    x="time"
                    xTicks={7}
                    yTicks={4}
                >
                    <Threshold />
                </ChartCard>
                {/* The main column and one side column, on the lead card's edges. */}
                <div className="grid grid-cols-3 items-start gap-4">
                    <RequestLog />
                    <div className="flex flex-col gap-4">
                        <RespondersCard />
                        <ServicesCard />
                        <TimelineCard />
                    </div>
                </div>
            </div>
        </PageContent>
    );
};

export const IncidentScreen = () => {
    const [page, setPage] = useState<HTMLDivElement | null>(null);
    const [room, setRoom] = useState(LEAST_ROOM);

    useLayoutEffect(() => {
        if (!page) return;
        const measure = () => setRoom(Math.max(LEAST_ROOM, page.clientHeight));
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(page);
        return () => observer.disconnect();
    }, [page]);

    return (
        <AppShell className="size-full min-h-0">
            <VigilSidebar />
            <AppPanel>
                <HeaderBar>
                    <Trail />
                </HeaderBar>
                <div className="relative min-h-0 flex-1 overflow-hidden" ref={setPage}>
                    <Incident room={room} />
                </div>
            </AppPanel>
        </AppShell>
    );
};
