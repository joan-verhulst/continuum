import {
    Button,
    Card,
    cn,
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from 'continuum';
import { Bell, Bold, Image as ImageIcon, Italic, Link2, List, Send, Trash2 } from 'lucide-react';
import { useStageContainer } from '../../layout';
import {
    type Entry,
    type InUse,
    icon,
    type Knob,
    opts,
    type PreviewProps,
    previewIcon,
    scene,
} from '../kit';

const tooltipKnobs: Knob[] = [
    { id: 'side', label: 'Side', options: opts('top', 'bottom', 'left', 'right'), default: 'top' },
];

const TooltipPreview = ({ knobs }: PreviewProps) => {
    const stage = useStageContainer();
    const side = knobs.side as 'top' | 'bottom' | 'left' | 'right';

    return (
        <TooltipProvider>
            {/* Room on the open tooltip's side, so the row sits centred with it. */}
            <div
                className={cn(
                    'flex gap-2',
                    stage && side === 'top' && 'pt-8',
                    stage && side === 'bottom' && 'pb-8',
                    stage && side === 'left' && 'pl-16',
                    stage && side === 'right' && 'pr-16',
                )}
            >
                {[
                    { label: 'Notifications', glyph: <Bell {...previewIcon} /> },
                    { label: 'Send', glyph: <Send {...previewIcon} /> },
                    { label: 'Delete', glyph: <Trash2 {...previewIcon} /> },
                ].map(({ label, glyph }, i) => (
                    <Tooltip key={label} open={stage && i === 1 ? true : undefined}>
                        <TooltipTrigger
                            render={<Button aria-label={label} size="icon" variant="secondary" />}
                        >
                            {glyph}
                        </TooltipTrigger>
                        <TooltipContent container={stage} side={side}>
                            {label}
                        </TooltipContent>
                    </Tooltip>
                ))}
            </div>
        </TooltipProvider>
    );
};

export const entry: Entry = {
    id: 'tooltip',
    name: 'Tooltip',
    category: 'overlays',
    description: 'A dark chip naming an icon button.',
    knobs: tooltipKnobs,
    Preview: TooltipPreview,
};

const formatting = [
    { label: 'Bold', glyph: <Bold {...icon} /> },
    { label: 'Italic', glyph: <Italic {...icon} /> },
    { label: 'Add a link', glyph: <Link2 {...icon} /> },
    { label: 'Bulleted list', glyph: <List {...icon} /> },
    { label: 'Insert image', glyph: <ImageIcon {...icon} /> },
];

const EditorTooltips = () => {
    const stage = useStageContainer();

    return (
        <TooltipProvider>
            <Card className="w-full max-w-md gap-4">
                <div className="flex gap-1 border-neutral-200 border-b pb-3">
                    {formatting.map((item, i) => (
                        <Tooltip key={item.label} open={i === 2 ? true : undefined}>
                            <TooltipTrigger
                                render={
                                    <Button aria-label={item.label} size="icon" variant="ghost" />
                                }
                            >
                                {item.glyph}
                            </TooltipTrigger>
                            <TooltipContent container={stage} side="bottom">
                                {item.label}
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </div>
                <p className="pt-4 text-neutral-700 text-xs">
                    Sessions held steady through the quarter, and the pricing page brought most of
                    the new sign-ups.
                </p>
            </Card>
        </TooltipProvider>
    );
};

export const inUse: InUse = {
    title: 'Formatting bar',
    note: 'Icon buttons, each named in a tooltip.',
    bare: true,
    render: scene(<EditorTooltips />),
};
