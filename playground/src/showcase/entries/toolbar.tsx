import { Button, Toolbar, ToolbarButton, ToolbarChip } from 'continuum';
import { Check, Minimize2, Share2, WandSparkles } from 'lucide-react';
import { useState } from 'react';
import {
    AppWindow,
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
            <span className="text-neutral-600 text-xxs">
                {last ??
                    (knobs.variant === 'floating'
                        ? 'Floating at the foot, over a selection'
                        : 'Inline over a focused block')}
            </span>
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

// The selected sentence, and what Rewrite and Shorten make of it.
const versions = {
    original:
        'Bounce rate rose in August, mostly on mobile, after the pricing page moved below the fold',
    rewritten:
        'In August more mobile visitors left at once, because the pricing page had dropped below the fold',
    shortened: 'Mobile bounce rose in August, with pricing below the fold',
};

const ReportDraft = () => {
    const [version, setVersion] = useState<keyof typeof versions>('original');
    const [selected, setSelected] = useState(true);

    return (
        <AppWindow
            actions={
                <>
                    <Button variant="secondary">
                        <Share2 {...icon} /> Share
                    </Button>
                    <Button>Publish</Button>
                </>
            }
            description="Draft · Maya Chen edited it 12 minutes ago"
            place="reports"
            title="Northwind Q3 review"
            trail={['Reports', 'Northwind Q3 review']}
        >
            <article className="flex max-w-150 flex-col gap-4 text-neutral-800 text-sm leading-relaxed">
                <h2 className="pt-2 font-medium text-base text-neutral-950">Traffic</h2>
                <p>
                    Sessions held steady through the quarter at around 12,000 a week, with the
                    newsletter bringing in a fifth of them.
                </p>
                <div className="relative">
                    <p>
                        Most of the quarter went to plan.{' '}
                        <mark
                            className={
                                selected
                                    ? 'rounded-chip bg-tint px-0.5 text-tint-fg'
                                    : 'cursor-text bg-transparent text-inherit'
                            }
                            onClick={() => setSelected(true)}
                        >
                            {versions[version]}
                        </mark>
                        , and recovered once it moved back in September.
                    </p>
                    {selected && (
                        <Toolbar
                            aria-label="AI suggestions"
                            className="absolute top-full left-24 z-10 mt-2 shadow-float"
                        >
                            <ToolbarChip>AI</ToolbarChip>
                            <ToolbarButton onClick={() => setVersion('rewritten')}>
                                <WandSparkles {...icon} /> Rewrite
                            </ToolbarButton>
                            <ToolbarButton onClick={() => setVersion('shortened')}>
                                <Minimize2 {...icon} /> Shorten
                            </ToolbarButton>
                            <ToolbarButton onClick={() => setSelected(false)}>
                                <Check {...icon} /> Accept
                            </ToolbarButton>
                        </Toolbar>
                    )}
                </div>
                <p>
                    Conversions followed the same line a week behind, and ended the quarter 8.9% up
                    on the last.
                </p>
                <h2 className="pt-2 font-medium text-base text-neutral-950">Revenue</h2>
                <p>Recurring revenue reached €184,000 a month, led by two Enterprise renewals.</p>
            </article>
        </AppWindow>
    );
};

export const inUse: InUse = {
    title: 'A report draft',
    note: 'AI actions under a selected sentence in a report: rewrite it, shorten it or keep it.',
    app: true,
    render: () => <ReportDraft />,
};
