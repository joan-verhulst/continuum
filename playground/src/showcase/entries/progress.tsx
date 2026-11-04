import { Button, Card, IconTile, Progress } from 'continuum';
import { CircleCheck, FileText, X } from 'lucide-react';
import { type Entry, type InUse, icon, type Knob, o, type PreviewProps } from '../kit';

const progressKnobs: Knob[] = [
    {
        id: 'state',
        label: 'State',
        options: [
            o('running', 'Under way'),
            o('indeterminate', 'Indeterminate'),
            o('done', 'Done'),
        ],
        default: 'running',
    },
    {
        id: 'size',
        label: 'Size',
        options: [o('sm', 'sm · 4px'), o('md', 'md · 8px')],
        default: 'sm',
    },
    { id: 'value', label: 'Show the value', switch: true, default: true },
    { id: 'caption', label: 'Caption', switch: true, default: false },
];

const ProgressPreview = ({ knobs }: PreviewProps) => {
    const done = knobs.state === 'done';

    return (
        <Progress
            caption={
                knobs.caption
                    ? done
                        ? 'Done'
                        : knobs.state === 'indeterminate'
                          ? 'Usually under a minute'
                          : '2 of 3 files'
                    : undefined
            }
            className="w-full max-w-72"
            label={
                done
                    ? 'Uploaded 3 files'
                    : knobs.state === 'indeterminate'
                      ? 'Preparing export'
                      : 'Uploading 3 files'
            }
            showValue={Boolean(knobs.value) && knobs.state !== 'indeterminate'}
            size={knobs.size === 'md' ? 'md' : 'sm'}
            tone={done ? 'success' : undefined}
            value={done ? 100 : knobs.state === 'indeterminate' ? null : 64}
        />
    );
};

export const entry: Entry = {
    id: 'progress',
    name: 'Progress',
    category: 'status',
    description: 'A task under way, or indeterminate while it starts.',
    knobs: progressKnobs,
    Preview: ProgressPreview,
};

const uploads = [
    { name: 'brand-guidelines.pdf', size: '2.4 MB', value: 100 },
    { name: 'homepage-hero.png', size: '860 KB', value: 64 },
    { name: 'q3-figures.xlsx', size: '120 KB', value: 12 },
];

const Uploads = () => (
    <Card className="w-full max-w-md gap-5">
        <Progress label="Uploading 3 files" showValue size="md" value={59} />
        <ul className="flex flex-col gap-4">
            {uploads.map(file => (
                <li className="flex items-center gap-3" key={file.name}>
                    <IconTile
                        tone={file.value === 100 ? 'success' : 'neutral'}
                        variant={file.value === 100 ? 'outline' : 'filled'}
                    >
                        {file.value === 100 ? <CircleCheck {...icon} /> : <FileText {...icon} />}
                    </IconTile>
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <div className="flex items-baseline justify-between gap-3 text-xs">
                            <span className="truncate font-medium text-neutral-950">
                                {file.name}
                            </span>
                            <span className="shrink-0 text-neutral-500">{file.size}</span>
                        </div>
                        <Progress
                            aria-label={`${file.name} upload`}
                            tone={file.value === 100 ? 'success' : undefined}
                            value={file.value}
                        />
                    </div>
                    <Button aria-label={`Cancel ${file.name}`} size="icon-sm" variant="ghost">
                        <X {...icon} />
                    </Button>
                </li>
            ))}
        </ul>
    </Card>
);

export const inUse: InUse = {
    title: 'Uploads',
    note: 'Progress for the whole and for every file.',
    canvas: true,
    render: () => <Uploads />,
};
