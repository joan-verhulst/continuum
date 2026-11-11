import {
    Avatar,
    Button,
    Card,
    cn,
    IconTile,
    Rail,
    RailItem,
    RailSeparator,
    RailToggle,
    TooltipProvider,
} from 'continuum';
import {
    BarChart3,
    ChartColumn,
    ChartLine,
    FileText,
    Funnel,
    Globe,
    LayoutDashboard,
    LayoutGrid,
    MessageSquare,
    Plus,
    Receipt,
    Settings,
    UsersRound,
} from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { places } from '../../screens/workspace';
import {
    AppWindow,
    type Entry,
    type InUse,
    icon,
    type Knob,
    type PreviewProps,
    previewIcon,
} from '../kit';

const railKnobs: Knob[] = [{ id: 'expanded', label: 'Expanded', switch: true, default: false }];

const railItems = [
    { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { id: 'activity', label: 'Activity', Icon: Globe },
    { id: 'analytics', label: 'Analytics', Icon: BarChart3 },
    { id: 'users', label: 'Users', Icon: UsersRound },
    { id: 'ai', label: 'Ask AI', Icon: MessageSquare },
];

const RailPreview = ({ knobs }: PreviewProps) => {
    const [active, setActive] = useState('analytics');
    const [expanded, setExpanded] = useState(Boolean(knobs.expanded));

    // The knob opens and closes it, the width easing as it does in use; the toggle inside still does too.
    useEffect(() => setExpanded(Boolean(knobs.expanded)), [knobs.expanded]);

    const item = (id: string, label: string, glyph: ReactNode) => (
        <RailItem active={id === active} key={id} label={label} onClick={() => setActive(id)}>
            {glyph}
        </RailItem>
    );

    return (
        <TooltipProvider>
            <Rail aria-label="Main" expanded={expanded} onExpandedChange={setExpanded}>
                <RailToggle />
                <RailSeparator />
                {railItems.map(({ id, label, Icon }) => item(id, label, <Icon {...previewIcon} />))}
                <RailSeparator />
                <RailItem label="Anna de Vries">
                    <Avatar alt="" fallback="AV" shape="round" size={24} />
                </RailItem>
            </Rail>
        </TooltipProvider>
    );
};

export const entry: Entry = {
    id: 'rail',
    name: 'Rail',
    category: 'frame',
    description:
        'The main navigation as a floating island: icons, or icons and labels when expanded.',
    hero: 'min-h-105',
    knobs: railKnobs,
    Preview: RailPreview,
};

const reportCards = [
    {
        name: 'Northwind Q3 review',
        about: 'Sessions, revenue and renewals for the quarter.',
        meta: 'Quarterly · run today',
        Icon: FileText,
    },
    {
        name: 'Revenue by plan',
        about: 'Recurring revenue split by Starter, Pro and Enterprise.',
        meta: 'Every Monday · run yesterday',
        Icon: ChartColumn,
    },
    {
        name: 'Churn and renewals',
        about: 'Who left, who renewed, and what is up next month.',
        meta: 'Monthly · run 1 October',
        Icon: ChartLine,
    },
    {
        name: 'Invoice ageing',
        about: 'Open invoices by how long they have been waiting.',
        meta: 'Every Friday · run 27 September',
        Icon: Receipt,
    },
    {
        name: 'Signup funnel',
        about: 'From the pricing page to a paid plan, step by step.',
        meta: 'Weekly · run 26 September',
        Icon: Funnel,
    },
    {
        name: 'Board pack · October',
        about: 'The numbers the board asks for, on four pages.',
        meta: 'Once · run 28 September',
        Icon: LayoutGrid,
    },
];

const ReportsWithRail = () => {
    const [active, setActive] = useState<string>('reports');
    const [expanded, setExpanded] = useState(false);

    return (
        <AppWindow
            actions={
                <Button>
                    <Plus {...icon} /> New report
                </Button>
            }
            // Clear of the rail: its 24px inset, its width and a gutter, wider while it is open.
            className={cn(
                'transition-[padding] duration-300 ease-out-strong',
                expanded ? 'pl-70' : 'pl-28',
            )}
            description="Weekly and monthly reports, shared with your team."
            nav="none"
            overlay={
                <TooltipProvider>
                    <Rail
                        aria-label="Main"
                        className="absolute top-1/2 left-6 z-20 -translate-y-1/2"
                        expanded={expanded}
                        onExpandedChange={setExpanded}
                    >
                        <RailToggle />
                        <RailSeparator />
                        {places.map(place => (
                            <RailItem
                                active={place.id === active}
                                key={place.id}
                                label={place.label}
                                onClick={() => setActive(place.id)}
                            >
                                {place.icon}
                            </RailItem>
                        ))}
                        <RailSeparator />
                        <RailItem
                            active={active === 'settings'}
                            label="Settings"
                            onClick={() => setActive('settings')}
                        >
                            <Settings {...icon} />
                        </RailItem>
                        <RailItem label="Maya Chen">
                            <Avatar alt="" fallback="MC" shape="round" size={24} />
                        </RailItem>
                    </Rail>
                </TooltipProvider>
            }
            title="Reports"
        >
            <div className="grid @max-shell-compact/shell:grid-cols-1 grid-cols-3 gap-4">
                {reportCards.map(report => (
                    <Card className="gap-4" key={report.name}>
                        <IconTile>
                            <report.Icon {...icon} />
                        </IconTile>
                        <div className="flex flex-col gap-1">
                            <p className="font-medium text-neutral-950 text-xs">{report.name}</p>
                            <p className="text-neutral-600 text-xs">{report.about}</p>
                        </div>
                        <p className="text-neutral-600 text-xxs">{report.meta}</p>
                    </Card>
                ))}
            </div>
        </AppWindow>
    );
};

export const inUse: InUse = {
    title: 'Reports, with the rail',
    note: 'The sections floating at the page’s edge; its toggle opens it to labels.',
    app: true,
    render: () => <ReportsWithRail />,
};
