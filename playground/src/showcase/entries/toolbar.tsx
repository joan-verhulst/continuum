import { Card, Toolbar, ToolbarButton, ToolbarChip } from 'continuum';
import { Check, Minimize2, WandSparkles } from 'lucide-react';
import { useState } from 'react';
import {
    type Entry,
    type InUse,
    icon,
    type Knob,
    opts,
    type PreviewProps,
    previewIcon,
} from '../kit';

const toolbarKnobs: Knob[] = [
    { id: 'variant', label: 'Variant', options: opts('inline', 'floating'), default: 'inline' },
];

const ToolbarPreview = ({ knobs }: PreviewProps) => {
    const [last, setLast] = useState<string>();

    return (
        <div className="flex flex-col items-center gap-3">
            <Toolbar
                aria-label="AI suggestions"
                variant={knobs.variant === 'floating' ? 'floating' : undefined}
            >
                <ToolbarChip>AI</ToolbarChip>
                <ToolbarButton onClick={() => setLast('Rewrite')}>
                    <WandSparkles {...previewIcon} /> Rewrite
                </ToolbarButton>
                <ToolbarButton onClick={() => setLast('Shorten')}>
                    <Minimize2 {...previewIcon} /> Shorten
                </ToolbarButton>
                <ToolbarButton onClick={() => setLast('Accept')}>
                    <Check {...previewIcon} /> Accept
                </ToolbarButton>
            </Toolbar>
            <span className="text-neutral-500 text-xxs">{last ?? 'Inline over a selection'}</span>
        </div>
    );
};

export const entry: Entry = {
    id: 'toolbar',
    name: 'Toolbar',
    category: 'actions',
    description: 'Inline AI actions and the floating selection bar.',
    knobs: toolbarKnobs,
    Preview: ToolbarPreview,
};

const SelectionToolbar = () => {
    const [last, setLast] = useState<string>();

    return (
        <Card className="w-full max-w-xl gap-3 p-6">
            <p className="font-medium text-neutral-950 text-sm">Q3 review</p>
            <p className="text-neutral-700 text-xs">
                Sessions held steady through the quarter.{' '}
                <mark className="rounded-chip bg-tint px-0.5 text-tint-fg">
                    Bounce rate rose in August, mostly on mobile, after the pricing page moved below
                    the fold
                </mark>
                , and recovered once it moved back.
            </p>
            <Toolbar aria-label="AI suggestions" className="self-start" variant="floating">
                <ToolbarChip>AI</ToolbarChip>
                <ToolbarButton onClick={() => setLast('Rewritten')}>
                    <WandSparkles {...icon} /> Rewrite
                </ToolbarButton>
                <ToolbarButton onClick={() => setLast('Shortened')}>
                    <Minimize2 {...icon} /> Shorten
                </ToolbarButton>
                <ToolbarButton onClick={() => setLast('Accepted')}>
                    <Check {...icon} /> Accept
                </ToolbarButton>
            </Toolbar>
            <p className="text-neutral-500 text-xs">
                {last ?? 'Conversions followed the same line, a week behind.'}
            </p>
        </Card>
    );
};

export const inUse: InUse = {
    title: 'Selection toolbar',
    note: 'AI actions floating under a selected sentence in a document.',
    canvas: true,
    render: () => <SelectionToolbar />,
};
