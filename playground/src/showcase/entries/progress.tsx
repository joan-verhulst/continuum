import { Button, IconTile, Progress, StatCard } from 'continuum';
import { CircleCheck, FileText, Paperclip, Send, X } from 'lucide-react';
import {
    AppScene,
    type Entry,
    type InUse,
    icon,
    type Knob,
    OpenDialog,
    o,
    type PreviewProps,
} from '../kit';

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
    { name: 'board-summary.pdf', size: '2.4 MB', value: 100 },
    { name: 'revenue-by-plan.png', size: '860 KB', value: 64 },
    { name: 'q3-figures.xlsx', size: '120 KB', value: 12 },
];

// What the report says, under its numbers.
const ReportSummary = () => (
    <div className="flex max-w-2xl flex-col gap-2 text-neutral-700 text-xs">
        <h2 className="font-medium text-base text-neutral-950">Summary</h2>
        <p>
            Revenue grew for the third quarter running, led by the move of six Pro customers to
            Enterprise. Net retention held above 100% in every month.
        </p>
        <p>
            Churn stayed low, but two of the three accounts lost were on the Starter plan after
            their trial; the onboarding sequence is being rewritten for them.
        </p>
    </div>
);

// The report the files are added to, behind the dialog.
const reportPage = {
    actions: (
        <>
            <Button variant="secondary">
                <Paperclip {...icon} /> Add files
            </Button>
            <Button>
                <Send {...icon} /> Share
            </Button>
        </>
    ),
    description: 'Revenue, retention and the board summary for the third quarter.',
    nav: 'top',
    place: 'reports',
    title: 'Northwind Q3 review',
    children: (
        <>
            <div className="grid grid-cols-3 gap-4">
                <StatCard delta="+6.2%" label="Revenue" value="€412,800" />
                <StatCard delta="+1.4%" label="Net retention" value="108%" />
                <StatCard delta="−0.3%" label="Churn" trend="down" value="2.1%" />
            </div>
            <ReportSummary />
        </>
    ),
} as const;

const UploadFiles = () => (
    <AppScene page={reportPage}>
        <OpenDialog
            footer={
                <>
                    <Button variant="secondary">Cancel uploads</Button>
                    <Button disabled>Done</Button>
                </>
            }
            title="Add files to the report"
            width={480}
        >
            <Progress label="Uploading 3 files" showValue size="md" value={59} />
            <ul className="flex flex-col gap-4">
                {uploads.map(file => (
                    <li className="flex items-center gap-3" key={file.name}>
                        <IconTile
                            tone={file.value === 100 ? 'success' : 'neutral'}
                            variant={file.value === 100 ? 'outline' : 'filled'}
                        >
                            {file.value === 100 ? (
                                <CircleCheck {...icon} />
                            ) : (
                                <FileText {...icon} />
                            )}
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
        </OpenDialog>
    </AppScene>
);

export const inUse: InUse = {
    title: 'Add files to a report',
    note: 'An upload dialog over the report: progress for the whole and for every file.',
    bare: true,
    render: () => <UploadFiles />,
};
