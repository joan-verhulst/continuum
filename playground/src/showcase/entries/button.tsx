import { Button, Card, IconTile } from 'continuum';
import { ArrowRight, FileText, Plus, Upload } from 'lucide-react';
import {
    type Entry,
    type InUse,
    icon,
    type Knob,
    o,
    opts,
    type PreviewProps,
    previewIcon,
} from '../kit';

const buttonKnobs: Knob[] = [
    {
        id: 'variant',
        label: 'Variant',
        options: opts('primary', 'secondary', 'ghost', 'tint'),
        default: 'primary',
    },
    {
        id: 'size',
        label: 'Size',
        options: [o('md', 'md · 34px'), o('lg', 'lg · 38px'), o('icon', 'Icon')],
        default: 'md',
    },
    {
        id: 'icon',
        label: 'Icon',
        options: [o('none', 'None'), o('leading', 'Leading'), o('trailing', 'Trailing')],
        default: 'leading',
    },
    { id: 'pill', label: 'Pill', switch: true, default: false },
    { id: 'disabled', label: 'Disabled', switch: true, default: false },
];

const ButtonPreview = ({ knobs }: PreviewProps) => {
    const variant = knobs.variant as 'primary' | 'secondary' | 'ghost' | 'tint';
    const shape = knobs.pill ? 'pill' : undefined;

    if (knobs.size === 'icon') {
        return (
            <Button
                aria-label="New report"
                disabled={Boolean(knobs.disabled)}
                shape={shape}
                size="icon"
                variant={variant}
            >
                <Plus {...previewIcon} />
            </Button>
        );
    }

    return (
        <Button
            disabled={Boolean(knobs.disabled)}
            shape={shape}
            size={knobs.size === 'lg' ? 'lg' : undefined}
            variant={variant}
        >
            {knobs.icon === 'leading' && <Plus {...previewIcon} />}
            New report
            {knobs.icon === 'trailing' && <ArrowRight {...previewIcon} />}
        </Button>
    );
};

export const entry: Entry = {
    id: 'button',
    name: 'Button',
    category: 'actions',
    description: 'Primary, secondary and ghost in two heights, plus icon buttons.',
    knobs: buttonKnobs,
    Preview: ButtonPreview,
};

const EmptyReports = () => (
    <Card className="w-full max-w-md items-center gap-5 px-8 py-10 text-center">
        <IconTile tone="primary" variant="outline">
            <FileText {...icon} />
        </IconTile>
        <div className="flex flex-col gap-1.5">
            <p className="font-medium text-neutral-950 text-sm">No reports yet</p>
            <p className="text-neutral-600 text-xs">
                Start from a template, or bring last quarter’s reports over in one go.
            </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
            <Button variant="secondary">
                <Upload {...icon} /> Import
            </Button>
            <Button>
                <Plus {...icon} /> New report
            </Button>
        </div>
        <Button variant="ghost">
            Browse templates <ArrowRight {...icon} />
        </Button>
    </Card>
);

export const inUse: InUse = {
    title: 'Empty state',
    note: 'The primary action, a secondary one beside it, and a ghost link under them.',
    canvas: true,
    render: () => <EmptyReports />,
};
