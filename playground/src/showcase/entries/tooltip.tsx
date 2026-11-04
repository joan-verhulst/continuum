import {
    Button,
    Card,
    cn,
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from 'continuum';
import {
    Bell,
    Bold,
    ChartColumn,
    Image as ImageIcon,
    Italic,
    Link2,
    List,
    Send,
    Share2,
    Trash2,
} from 'lucide-react';
import { useStageContainer } from '../../layout';
import {
    AppScene,
    type Entry,
    type InUse,
    icon,
    type Knob,
    opts,
    type PreviewProps,
    previewIcon,
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
    { label: 'Insert a chart', glyph: <ChartColumn {...icon} /> },
];

const ReportEditor = () => {
    const stage = useStageContainer();

    return (
        <TooltipProvider>
            <Card className="gap-0 p-0">
                {/* The formatting row, ruled off the text it formats, edge to edge. */}
                <div className="flex items-center gap-1 border-neutral-200 border-b px-3 py-2">
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
                    <span className="ml-auto pr-2 text-neutral-500 text-xxs">Saved</span>
                </div>
                <div className="flex flex-col gap-3 px-8 pt-8 pb-10">
                    <h2 className="font-medium text-base text-neutral-950">Summary</h2>
                    <p className="max-w-[640px] text-neutral-700 text-xs leading-relaxed">
                        Sessions held steady through the quarter at 12,480 a week, and the pricing
                        page brought most of the new sign-ups. Northwind Traders moved to Enterprise
                        in August, which accounts for a third of the growth in recurring revenue.
                    </p>
                    <p className="max-w-[640px] text-neutral-700 text-xs leading-relaxed">
                        The bounce rate rose in August, mostly on mobile, after the new checkout
                        went live. It came back down once the payment step was split in two.
                    </p>
                    <h2 className="pt-4 font-medium text-base text-neutral-950">Next quarter</h2>
                    <p className="max-w-[640px] text-neutral-700 text-xs leading-relaxed">
                        Three renewals are due before January: Umbrella Health, Stark Logistics and
                        Globex.
                    </p>
                </div>
            </Card>
        </TooltipProvider>
    );
};

export const inUse: InUse = {
    title: 'Writing a report',
    note: 'The editor’s formatting buttons, each named in a tooltip on hover.',
    bare: true,
    render: () => (
        <AppScene
            page={{
                nav: 'top',
                place: 'reports',
                title: 'Q3 review',
                description: 'Draft, edited by Maya Chen 4 minutes ago.',
                actions: (
                    <>
                        <Button variant="secondary">
                            <Share2 {...icon} /> Share
                        </Button>
                        <Button>Publish report</Button>
                    </>
                ),
                children: <ReportEditor />,
            }}
        />
    ),
};
