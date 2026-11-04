import { Avatar, Rail, RailItem, RailSeparator, RailToggle, TooltipProvider } from 'continuum';
import {
    BarChart3,
    ChartLine,
    Funnel,
    Globe,
    LayoutDashboard,
    LayoutGrid,
    MessageSquare,
    Settings,
    UsersRound,
} from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { type Entry, type InUse, icon, type Knob, type PreviewProps, previewIcon } from '../kit';

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

    // The knob opens and closes it; the toggle inside still does too.
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
    hero: 'min-h-[420px]',
    knobs: railKnobs,
    Preview: RailPreview,
};

const railItemsInUse = [
    { id: 'overview', label: 'Overview', icon: <LayoutGrid {...icon} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 {...icon} /> },
    { id: 'traffic', label: 'Traffic', icon: <ChartLine {...icon} /> },
    { id: 'funnels', label: 'Funnels', icon: <Funnel {...icon} /> },
];

const RailFrame = () => {
    const [active, setActive] = useState('analytics');

    return (
        <TooltipProvider>
            <div className="flex h-[400px] w-full gap-6 overflow-hidden rounded-item border border-neutral-200 bg-neutral-50 p-6">
                <Rail aria-label="Main" className="self-start">
                    <RailToggle />
                    <RailSeparator />
                    {railItemsInUse.map(item => (
                        <RailItem
                            active={item.id === active}
                            key={item.id}
                            label={item.label}
                            onClick={() => setActive(item.id)}
                        >
                            {item.icon}
                        </RailItem>
                    ))}
                    <RailSeparator />
                    <RailItem label="Settings">
                        <Settings {...icon} />
                    </RailItem>
                    <RailItem label="Northwind">
                        <Avatar alt="" fallback="NW" shape="round" size={24} />
                    </RailItem>
                </Rail>
                <div className="flex flex-1 flex-col gap-4 opacity-60">
                    <p className="font-medium text-neutral-950 text-sm capitalize">{active}</p>
                    <div className="h-24 rounded-card border border-neutral-200" />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="h-20 rounded-card border border-neutral-200" />
                        <div className="h-20 rounded-card border border-neutral-200" />
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
};

export const inUse: InUse = {
    title: 'Dashboard rail',
    note: 'The sections as icons, named in tooltips; the toggle opens it to labels and the page makes room.',
    render: () => <RailFrame />,
};
