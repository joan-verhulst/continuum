import {
    CircleAlert,
    CircleCheck,
    Clock,
    Ellipsis,
    FileText,
    Mail,
    Rocket,
    Send,
    ShieldCheck,
    Sparkles,
    TriangleAlert,
} from 'lucide-react';
import {
    ActivityItem,
    ActivityList,
    AreaChart,
    Avatar,
    AvatarStack,
    Badge,
    Button,
    Card,
    CardDelta,
    CardHeader,
    CardTitle,
    CardValue,
    Checkbox,
    DescriptionItem,
    DescriptionList,
    DonutChart,
    FunnelChart,
    IconTile,
    Kbd,
    MetaRow,
    Separator,
    StatCard,
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableGroupRow,
    TableHead,
    TableHeader,
    TableRow,
} from 'continuum';
import { useState } from 'react';
import { ComponentSet, Specimen, Variant } from '../layout';

const icon = { strokeWidth: 1.5 } as const;

export const AvatarSection = () => (
    <Specimen title="Avatar">
        <ComponentSet>
            <div className="flex items-end gap-6">
                <Variant label="square · 32">
                    <Avatar fallback="NW" />
                </Variant>
                <Variant label="square · 24">
                    <Avatar fallback="NW" size={24} />
                </Variant>
                <Variant label="round · 32">
                    <Avatar fallback="AS" shape="round" />
                </Variant>
                <Variant label="round · 24">
                    <Avatar fallback="AS" shape="round" size={24} />
                </Variant>
                <Variant label="no initials">
                    <Avatar shape="round" />
                </Variant>
            </div>
        </ComponentSet>
        <Variant label="stack · max 4">
            <AvatarStack max={4}>
                {['AS', 'TB', 'MK', 'JL', 'RV', 'EP'].map(initials => (
                    <Avatar fallback={initials} key={initials} shape="round" size={24} />
                ))}
            </AvatarStack>
        </Variant>
    </Specimen>
);

const sessions = [
    { label: 'Mon', value: 1840 },
    { label: 'Tue', value: 2210 },
    { label: 'Wed', value: 1980 },
    { label: 'Thu', value: 2690 },
    { label: 'Fri', value: 2420 },
    { label: 'Sat', value: 1310 },
    { label: 'Sun', value: 1530 },
];

export const CardSection = () => (
    <>
        <Specimen stageClassName="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" title="Stat card">
            <StatCard delta="+12.4%" label="Sessions" value="12,480" />
            <StatCard delta="−3.1%" label="Bounce rate" trend="down" value="41.2%" />
            <StatCard delta="0.0%" label="Avg. duration" trend="neutral" value="2m 14s" />
            <StatCard delta="+8.9%" label="Conversions" value="1,204" />
        </Specimen>
        <Specimen
            stageClassName="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]"
            title="Card with a chart"
        >
            <Card>
                <CardHeader>
                    <CardTitle>Sessions this week</CardTitle>
                    <div className="flex items-baseline gap-2">
                        <CardValue size="lg">13,980</CardValue>
                        <CardDelta>+12.4% vs last week</CardDelta>
                    </div>
                </CardHeader>
                <AreaChart
                    annotation={{ index: 3, icon: <Rocket {...icon} /> }}
                    aria-label="Sessions per day this week"
                    data={sessions}
                    height={220}
                />
            </Card>
            <div className="flex flex-col gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Returning visitors</CardTitle>
                        <div className="flex items-baseline gap-2">
                            <CardValue size="xl">38%</CardValue>
                            <CardDelta trend="down">−2.4%</CardDelta>
                        </div>
                    </CardHeader>
                </Card>
                <MetaRow label="Invoice date" value="12 Oct 2025" />
                <MetaRow label="Due date" value="26 Oct 2025" />
            </div>
        </Specimen>
    </>
);

export const DescriptionSection = () => (
    <Specimen stageClassName="grid gap-8 md:grid-cols-2" title="Description list and activity">
        <Variant className="items-stretch" label="description list">
            <DescriptionList>
                <DescriptionItem term="Client">Acme Studio</DescriptionItem>
                <DescriptionItem term="Status">
                    <Badge tone="warning">Due soon</Badge>
                </DescriptionItem>
                <DescriptionItem term="Owners">
                    <AvatarStack>
                        <Avatar fallback="AS" shape="round" size={24} />
                        <Avatar fallback="TB" shape="round" size={24} />
                    </AvatarStack>
                </DescriptionItem>
                <DescriptionItem term="Billing address">
                    Keizersgracht 120
                    <br />
                    1015 CW Amsterdam
                </DescriptionItem>
            </DescriptionList>
        </Variant>
        <Variant className="items-stretch" label="activity list · tones">
            <ActivityList>
                <ActivityItem
                    action={<Badge tone="success">Paid</Badge>}
                    icon={<CircleCheck {...icon} />}
                    time="Today, 09:12"
                    title="Payment received"
                    tone="success"
                />
                <ActivityItem
                    action={<Badge tone="warning">Reminder</Badge>}
                    icon={<Clock {...icon} />}
                    time="2 days ago"
                    title="Reminder sent"
                    tone="warning"
                />
                <ActivityItem
                    action={<Badge tone="error">Bounced</Badge>}
                    icon={<CircleAlert {...icon} />}
                    time="3 days ago"
                    title="Email bounced"
                    tone="error"
                />
                <ActivityItem
                    icon={<Send {...icon} />}
                    time="12 days ago"
                    title="Invoice sent"
                    tone="primary"
                />
            </ActivityList>
        </Variant>
    </Specimen>
);

const tileTones = [
    { tone: 'neutral', icon: <FileText {...icon} /> },
    { tone: 'success', icon: <ShieldCheck {...icon} /> },
    { tone: 'warning', icon: <TriangleAlert {...icon} /> },
    { tone: 'error', icon: <CircleAlert {...icon} /> },
    { tone: 'primary', icon: <Sparkles {...icon} /> },
] as const;

export const SmallSection = () => (
    <Specimen title="Icon tile, kbd and separator">
        <ComponentSet>
            <div className="flex gap-6">
                {tileTones.map(({ tone, icon: glyph }) => (
                    <Variant key={tone} label={tone}>
                        <IconTile tone={tone}>{glyph}</IconTile>
                    </Variant>
                ))}
            </div>
        </ComponentSet>
        <Variant label="kbd">
            <div className="flex items-center gap-1">
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
                <span className="px-1 text-neutral-500 text-xxs">or</span>
                <Kbd>Esc</Kbd>
            </div>
        </Variant>
        <Variant label="separator · horizontal and vertical">
            <div className="flex h-10 w-56 flex-col justify-between">
                <div className="flex h-4 items-center gap-3 text-neutral-600 text-xs">
                    Draft
                    <Separator orientation="vertical" />
                    Review
                    <Separator orientation="vertical" />
                    Sent
                </div>
                <Separator />
            </div>
        </Variant>
    </Specimen>
);

type Step = { id: string; subject: string; delay: string; sent: number; opened: number };

const phases: { title: string; hint: string; steps: Step[] }[] = [
    {
        title: 'Welcome',
        hint: 'day 0 to 3',
        steps: [
            {
                id: 's1',
                subject: 'Welcome to Northwind',
                delay: 'Immediately',
                sent: 1240,
                opened: 812,
            },
            {
                id: 's2',
                subject: 'Set up your first report',
                delay: '1 day',
                sent: 1188,
                opened: 604,
            },
        ],
    },
    {
        title: 'Activation',
        hint: 'day 4 to 14',
        steps: [
            { id: 's3', subject: 'Invite your team', delay: '4 days', sent: 1032, opened: 455 },
            {
                id: 's4',
                subject: 'Three reports worth stealing',
                delay: '7 days',
                sent: 980,
                opened: 391,
            },
        ],
    },
];

const allSteps = phases.flatMap(phase => phase.steps);

const topPages = [
    { path: '/pricing', visitors: '4,812', share: '32%' },
    { path: '/blog/quarterly-review', visitors: '2,906', share: '19%' },
    { path: '/signup', visitors: '1,774', share: '12%' },
    { path: '/docs/getting-started', visitors: '1,203', share: '8%' },
];

export const TableSection = () => {
    const [selected, setSelected] = useState<string[]>(['s2']);
    const all = selected.length === allSteps.length;
    const sent = allSteps.reduce((sum, step) => sum + step.sent, 0);
    const opened = allSteps.reduce((sum, step) => sum + step.opened, 0);

    return (
        <>
            <Specimen
                note="Group rows, selection and a totals footer"
                stageClassName="block"
                title="Ruled table"
            >
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <Checkbox
                                    aria-label="Select all"
                                    checked={all ? true : selected.length ? 'indeterminate' : false}
                                    onCheckedChange={checked =>
                                        setSelected(
                                            checked === true ? allSteps.map(step => step.id) : [],
                                        )
                                    }
                                />
                            </TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Delay</TableHead>
                            <TableHead numeric>Sent</TableHead>
                            <TableHead numeric>Open rate</TableHead>
                            <TableHead className="w-12">
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {phases.map(phase => [
                            <TableGroupRow hint={phase.hint} key={phase.title}>
                                {phase.title}
                            </TableGroupRow>,
                            ...phase.steps.map(step => (
                                <TableRow key={step.id}>
                                    <TableCell>
                                        <Checkbox
                                            aria-label={`Select ${step.subject}`}
                                            checked={selected.includes(step.id)}
                                            onCheckedChange={checked =>
                                                setSelected(current =>
                                                    checked === true
                                                        ? [...current, step.id]
                                                        : current.filter(id => id !== step.id),
                                                )
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center gap-2">
                                            <Mail className="size-4 text-neutral-600" {...icon} />
                                            {step.subject}
                                        </span>
                                    </TableCell>
                                    <TableCell className="font-normal text-neutral-600">
                                        {step.delay}
                                    </TableCell>
                                    <TableCell numeric>
                                        {step.sent.toLocaleString('en-US')}
                                    </TableCell>
                                    <TableCell numeric>
                                        <Badge
                                            tone={
                                                step.opened / step.sent > 0.5
                                                    ? 'success'
                                                    : 'neutral'
                                            }
                                        >
                                            {Math.round((step.opened / step.sent) * 100)}%
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            aria-label="Step actions"
                                            size="icon-sm"
                                            variant="ghost"
                                        >
                                            <Ellipsis {...icon} />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )),
                        ])}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell />
                            <TableCell colSpan={2}>Total</TableCell>
                            <TableCell numeric>{sent.toLocaleString('en-US')}</TableCell>
                            <TableCell numeric>{Math.round((opened / sent) * 100)}%</TableCell>
                            <TableCell />
                        </TableRow>
                    </TableFooter>
                </Table>
            </Specimen>
            <Specimen
                note="Every row a separate rounded fill"
                stageClassName="block"
                title="Row table"
            >
                <Table variant="rows">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Page</TableHead>
                            <TableHead numeric>Visitors</TableHead>
                            <TableHead numeric>Share</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {topPages.map(page => (
                            <TableRow key={page.path}>
                                <TableCell>{page.path}</TableCell>
                                <TableCell numeric>{page.visitors}</TableCell>
                                <TableCell numeric>{page.share}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Specimen>
        </>
    );
};

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const ChartSection = () => (
    <>
        <Specimen
            note="Data colours chart-1 to chart-5"
            stageClassName="block"
            title="Area chart · two series"
        >
            <AreaChart
                aria-label="Visitors and sign-ups per day"
                formatY={value => `${value / 1000}k`}
                height={260}
                labels={days}
                series={[
                    { key: 'visitors', values: [4200, 5100, 4800, 6300, 5900, 3600, 4100] },
                    { key: 'returning', values: [1800, 2300, 2100, 2900, 2600, 1500, 1700] },
                ]}
            />
        </Specimen>
        <Specimen
            stageClassName="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]"
            title="Donut and funnel"
        >
            <Variant className="items-center" label="donut · three rings">
                <DonutChart
                    rings={[
                        { value: 0.72, label: 'Desktop' },
                        { value: 0.48, label: 'Mobile' },
                        { value: 0.21, label: 'Tablet' },
                    ]}
                    size={152}
                >
                    72%
                </DonutChart>
            </Variant>
            <Variant className="min-w-0 items-stretch" label="funnel · checkout">
                <div className="overflow-x-auto">
                    <FunnelChart
                        className="min-w-[640px]"
                        height={320}
                        steps={[
                            { label: '/cart', value: 8420, delta: 4.2 },
                            { label: '/checkout', value: 5110, delta: 1.8 },
                            { label: '/payment', value: 3240, delta: -2.6 },
                            { label: '/thank-you', value: 2710, delta: 3.1 },
                        ]}
                    />
                </div>
            </Variant>
        </Specimen>
    </>
);
