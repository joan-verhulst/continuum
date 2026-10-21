import {
    ArrowRight,
    Calendar,
    ChartColumn,
    Clock,
    Eye,
    FileText,
    Folder,
    Gauge,
    Heart,
    Layers,
    LifeBuoy,
    MousePointerClick,
    Plus,
    Share2,
    Sparkles,
    TrendingUp,
    Users,
} from 'lucide-react';
import {
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
    Checkbox,
    Field,
    FieldLabel,
    HeaderBar,
    Input,
    Kbd,
    NavGroup,
    NavItem,
    OptionList,
    OptionRow,
    RadioGroup,
    RadioGroupItem,
    SegmentedControl,
    SegmentedControlItem,
    Separator,
    Sidebar,
    SidebarGroup,
    SidebarHeader,
    SidebarLogo,
    SidebarToggle,
    SuggestionChip,
} from 'continuum';
import { type ReactNode, useState } from 'react';
import { AccountFooter, SectionTitle } from './shared';

type Stat = { id: string; label: string; icon: ReactNode };

const general: Stat[] = [
    { id: 'engagement', label: 'Engagement rate', icon: <Users strokeWidth={1.5} /> },
    { id: 'followers', label: 'Follower growth', icon: <TrendingUp strokeWidth={1.5} /> },
    { id: 'reach', label: 'Post reach', icon: <Eye strokeWidth={1.5} /> },
    { id: 'ctr', label: 'Click-through rate', icon: <MousePointerClick strokeWidth={1.5} /> },
    { id: 'impressions', label: 'Impressions', icon: <ChartColumn strokeWidth={1.5} /> },
];

const video: Stat[] = [
    { id: 'views', label: 'Video views', icon: <Eye strokeWidth={1.5} /> },
    { id: 'watch', label: 'Average watch time', icon: <Clock strokeWidth={1.5} /> },
    { id: 'completion', label: 'Completion rate', icon: <Gauge strokeWidth={1.5} /> },
    { id: 'shares', label: 'Shares', icon: <Share2 strokeWidth={1.5} /> },
];

const social: Stat[] = [
    { id: 'likes', label: 'Likes', icon: <Heart strokeWidth={1.5} /> },
    { id: 'comments', label: 'Comments', icon: <Users strokeWidth={1.5} /> },
    { id: 'saves', label: 'Saves', icon: <Layers strokeWidth={1.5} /> },
    { id: 'profile', label: 'Profile visits', icon: <MousePointerClick strokeWidth={1.5} /> },
];

const platforms: { id: string; label: string; stats: Stat[] }[] = [
    { id: 'general', label: 'General', stats: general },
    { id: 'shorts', label: 'Short video', stats: video },
    { id: 'photos', label: 'Photos', stats: social },
    { id: 'network', label: 'Network', stats: social },
    { id: 'longform', label: 'Long video', stats: video },
    { id: 'stories', label: 'Stories', stats: social },
];

const suggestions = {
    'Current month': 'October 1, 2025 – October 31, 2025',
    'Previous month': 'September 1, 2025 – September 30, 2025',
    'Last 90 days': 'July 23, 2025 – October 20, 2025',
};

const clients = [
    { id: 'fern', icon: '🪴', label: 'Fern & Field' },
    { id: 'velo', icon: '🚲', label: 'Velo Works' },
    { id: 'dune', icon: '🏜️', label: 'Dune Outfitters' },
];

const ReportSidebar = () => (
    <Sidebar>
        <SidebarHeader>
            <SidebarLogo>
                <ChartColumn strokeWidth={2} />
            </SidebarLogo>
            <SidebarToggle />
        </SidebarHeader>
        <SidebarGroup aria-label="Main" divided>
            <NavItem icon={<Plus strokeWidth={1.5} />} variant="primary">
                New report
            </NavItem>
            <NavItem icon={<Gauge strokeWidth={1.5} />} trailing={<Kbd>H</Kbd>}>
                Home
            </NavItem>
            <NavItem active icon={<Users strokeWidth={1.5} />} trailing={<Kbd>C</Kbd>}>
                Clients
            </NavItem>
            <NavItem icon={<Layers strokeWidth={1.5} />} trailing={<Kbd>L</Kbd>}>
                Logs
            </NavItem>
            <NavItem
                icon={<LifeBuoy strokeWidth={1.5} />}
                trailing={
                    <Badge tone="success" variant="count">
                        128
                    </Badge>
                }
            >
                Support
            </NavItem>
        </SidebarGroup>
        <SidebarGroup aria-label="Clients" label="Clients">
            <NavGroup defaultOpen icon="☕" label="Copper Kettle Café">
                <NavItem icon={<FileText strokeWidth={1.5} />} variant="inset">
                    Reports
                </NavItem>
                <NavItem icon={<Share2 strokeWidth={1.5} />} variant="inset">
                    Channels
                </NavItem>
                <NavItem icon={<Calendar strokeWidth={1.5} />} variant="inset">
                    Schedule
                </NavItem>
            </NavGroup>
            {clients.map(client => (
                <NavGroup icon={client.icon} key={client.id} label={client.label}>
                    <NavItem icon={<FileText strokeWidth={1.5} />} variant="inset">
                        Reports
                    </NavItem>
                    <NavItem icon={<Share2 strokeWidth={1.5} />} variant="inset">
                        Channels
                    </NavItem>
                </NavGroup>
            ))}
            <NavItem variant="project" icon={<Folder strokeWidth={1.5} />}>
                Archive
            </NavItem>
        </SidebarGroup>
        <AccountFooter
            avatar={<Avatar alt="" size={36} fallback="JC" />}
            name="Jane Cooper"
            plan="Startup"
        />
    </Sidebar>
);

/** Report generator (Lime, 2025): a centred form of period, statistics and trend filter. */
export const ReportGenerator = () => {
    const [dates, setDates] = useState(suggestions['Current month']);
    const [platform, setPlatform] = useState('general');
    const [checked, setChecked] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(general.map(stat => [`general:${stat.id}`, true])),
    );
    const [trend, setTrend] = useState('all');

    const current = platforms.find(p => p.id === platform) ?? platforms[0];

    return (
        <AppShell className="h-full min-h-0 min-w-[1280px]">
            <ReportSidebar />
            <AppPanel>
                <HeaderBar>
                    <Breadcrumb>
                        <BreadcrumbList className="text-sm">
                            <BreadcrumbItem>
                                <BreadcrumbLink href="#">
                                    <BreadcrumbHome />
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="#">Clients</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Generate report</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </HeaderBar>

                <div className="min-h-0 flex-1 overflow-auto">
                    <form
                        className="mx-auto flex w-[960px] flex-col gap-8 pt-[72px] pb-24"
                        onSubmit={event => event.preventDefault()}
                    >
                        <SectionTitle
                            description="Pick a period and the statistics to include. The report is ready to share as soon as it is generated."
                            as="h1"
                            lead
                            size="lg"
                            title="Generate report for Acme Corp"
                        />

                        <Separator />

                        <section className="flex flex-col gap-6">
                            <SectionTitle
                                lead
                                description="Set the period the report covers. Only data from within this period is included."
                                title="Select period"
                            />
                            <div className="flex flex-col gap-3">
                                <Field>
                                    <FieldLabel>Dates</FieldLabel>
                                    <Input
                                        leadingIcon={<Calendar strokeWidth={1.5} />}
                                        onChange={event => setDates(event.target.value)}
                                        value={dates}
                                    />
                                </Field>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="mr-2 flex items-center gap-1.5 text-neutral-600 text-xs">
                                        <Sparkles className="size-4" strokeWidth={1.5} />
                                        Suggestions:
                                    </span>
                                    {Object.entries(suggestions).map(([label, value]) => (
                                        <SuggestionChip key={label} onClick={() => setDates(value)}>
                                            {label}
                                        </SuggestionChip>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <Separator />

                        <section className="flex flex-col gap-6">
                            <SectionTitle
                                lead
                                description="Select the data to include, both across all platforms and per platform."
                                title="Choose statistics for the report (optional)"
                            />
                            <Card className="gap-0 p-0">
                                <div className="border-neutral-200 border-b p-3">
                                    <SegmentedControl
                                        aria-label="Platform"
                                        onValueChange={setPlatform}
                                        value={platform}
                                    >
                                        {platforms.map(p => (
                                            <SegmentedControlItem key={p.id} value={p.id}>
                                                {p.label}
                                            </SegmentedControlItem>
                                        ))}
                                    </SegmentedControl>
                                </div>
                                <OptionList className="p-3">
                                    {current?.stats.map(stat => {
                                        const key = `${platform}:${stat.id}`;
                                        return (
                                            <OptionRow
                                                control={
                                                    <Checkbox
                                                        checked={checked[key] ?? false}
                                                        onCheckedChange={value =>
                                                            setChecked(state => ({
                                                                ...state,
                                                                [key]: value === true,
                                                            }))
                                                        }
                                                    />
                                                }
                                                icon={stat.icon}
                                                key={key}
                                                label={stat.label}
                                            />
                                        );
                                    })}
                                </OptionList>
                            </Card>
                        </section>

                        <Separator />

                        <section className="flex flex-col gap-6">
                            <SectionTitle
                                lead
                                description="Choose which trends the report calls out next to the figures."
                                title="Trend filter (optional)"
                            />
                            <RadioGroup
                                aria-label="Trend filter"
                                onValueChange={setTrend}
                                value={trend}
                            >
                                <OptionRow
                                    control={<RadioGroupItem value="all" />}
                                    label="Show all trends"
                                />
                                <OptionRow
                                    control={<RadioGroupItem value="positive" />}
                                    description="Growth against the previous period"
                                    label="Only positive trends"
                                />
                                <OptionRow
                                    control={<RadioGroupItem value="negative" />}
                                    description="Declines worth a closer look"
                                    label="Only negative trends"
                                />
                            </RadioGroup>
                        </section>

                        <div className="flex justify-end">
                            <Button type="submit">
                                Generate report
                                <ArrowRight strokeWidth={1.5} />
                            </Button>
                        </div>
                    </form>
                </div>
            </AppPanel>
        </AppShell>
    );
};
