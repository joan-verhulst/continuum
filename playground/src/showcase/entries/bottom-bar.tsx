import { BottomBar, Dock, DockAction, DockItem } from 'continuum';
import {
    CalendarDays,
    CircleCheck,
    FileText,
    Plus,
    Rocket,
    Send,
    Settings,
    ShieldCheck,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { type Entry, type InUse, icon, type Knob, o, type PreviewProps, previewIcon } from '../kit';

const bottomBarKnobs: Knob[] = [
    {
        id: 'shape',
        label: 'Shape',
        options: [o('theme', 'Theme'), o('pill', 'Pill'), o('rounded', 'Rounded')],
        default: 'theme',
    },
    {
        id: 'sections',
        label: 'Sections',
        options: [o('few', 'Three'), o('many', 'More than fit')],
        default: 'few',
    },
    {
        id: 'action',
        label: 'Action',
        options: [o('label', 'Label'), o('icon', 'Icon'), o('none', 'None')],
        default: 'label',
    },
];

const bottomBarSections = [
    { id: 'eligibility', label: 'Eligibility', Icon: ShieldCheck },
    { id: 'audience', label: 'Audience', Icon: Users },
    { id: 'settings', label: 'Settings', Icon: Settings },
    { id: 'schedule', label: 'Schedule', Icon: CalendarDays },
    { id: 'content', label: 'Content', Icon: FileText },
    { id: 'review', label: 'Review', Icon: CircleCheck },
];

const BottomBarPreview = ({ knobs }: PreviewProps) => {
    const shape = knobs.shape as 'theme' | 'pill' | 'rounded';
    const many = knobs.sections === 'many';
    const sections = many ? bottomBarSections : bottomBarSections.slice(0, 3);

    return (
        // More sections than the bar's width scroll, with a chevron at the end that has more.
        <BottomBar className={many ? 'max-w-110' : undefined}>
            <Dock aria-label="Campaign" defaultValue="audience" shape={shape}>
                {sections.map(({ id, label, Icon }) => (
                    <DockItem key={id} value={id}>
                        <Icon {...previewIcon} />
                        {label}
                    </DockItem>
                ))}
            </Dock>
            {knobs.action === 'label' && (
                <DockAction shape={shape}>
                    Start campaign
                    <Rocket {...previewIcon} />
                </DockAction>
            )}
            {knobs.action === 'icon' && (
                <DockAction aria-label="Add section" shape={shape} size="icon">
                    <Plus {...previewIcon} />
                </DockAction>
            )}
        </BottomBar>
    );
};

export const entry: Entry = {
    id: 'bottom-bar',
    name: 'Bottom bar and dock',
    category: 'frame',
    description: 'Sections of a page and its main action, floating at the bottom.',
    span: 2,
    knobs: bottomBarKnobs,
    Preview: BottomBarPreview,
};

const DockFrame = () => {
    const [section, setSection] = useState('audience');

    return (
        <div className="relative flex h-80 w-full flex-col gap-4 overflow-hidden rounded-item border border-neutral-200 bg-neutral-50 p-6">
            <p className="font-medium text-neutral-950 text-sm">Start campaign</p>
            <div className="grid @max-shell-compact/shell:grid-cols-1 grid-cols-3 gap-4 opacity-60">
                <div className="h-20 rounded-card border border-neutral-200" />
                <div className="h-20 rounded-card border border-neutral-200" />
                <div className="h-20 rounded-card border border-neutral-200" />
            </div>
            <BottomBar floating>
                <Dock aria-label="Campaign" onValueChange={setSection} value={section}>
                    <DockItem value="eligibility">
                        <CircleCheck {...icon} />
                        Eligibility
                    </DockItem>
                    <DockItem value="audience">
                        <Users {...icon} />
                        Audience
                    </DockItem>
                    <DockItem value="schedule">
                        <CalendarDays {...icon} />
                        Schedule
                    </DockItem>
                </Dock>
                <DockAction>
                    Start campaign <Send {...icon} />
                </DockAction>
            </BottomBar>
        </div>
    );
};

export const inUse: InUse = {
    title: 'Campaign wizard',
    note: 'The steps as a dock at the foot of the page, the action beside them.',
    render: () => <DockFrame />,
};
