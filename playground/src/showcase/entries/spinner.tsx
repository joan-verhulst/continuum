import { Button, DialogClose, DialogDescription, StatCard, ValueField } from 'continuum';
import { CircleCheck, History } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    AppScene,
    type Entry,
    type InUse,
    icon,
    type Knob,
    OpenDialog,
    o,
    opts,
    type PreviewProps,
    previewIcon,
} from '../kit';

const spinnerKnobs: Knob[] = [
    {
        id: 'variant',
        label: 'Button',
        options: opts('primary', 'secondary', 'ghost'),
        default: 'primary',
    },
    {
        id: 'size',
        label: 'Size',
        options: [o('md', 'md · 34px'), o('lg', 'lg · 38px')],
        default: 'md',
    },
    { id: 'icon', label: 'Icon button', switch: true, default: false },
    { id: 'loading', label: 'Busy', switch: true, default: true },
];

const SpinnerPreview = ({ knobs }: PreviewProps) => {
    const [busy, setBusy] = useState(true);

    useEffect(() => setBusy(Boolean(knobs.loading)), [knobs.loading]);

    // A click starts the work again; it settles after a moment unless the knob holds it busy.
    useEffect(() => {
        if (!busy || knobs.loading) return;
        const timer = window.setTimeout(() => setBusy(false), 1600);
        return () => window.clearTimeout(timer);
    }, [busy, knobs.loading]);

    const variant =
        knobs.variant === 'secondary' || knobs.variant === 'ghost' ? knobs.variant : 'primary';

    return knobs.icon ? (
        <Button
            aria-label="Refresh"
            loading={busy}
            onClick={() => setBusy(true)}
            size="icon"
            variant={variant === 'primary' ? 'secondary' : variant}
        >
            <History {...previewIcon} />
        </Button>
    ) : (
        <Button
            loading={busy}
            onClick={() => setBusy(true)}
            size={knobs.size === 'lg' ? 'lg' : 'md'}
            variant={variant}
        >
            {busy ? 'Saving…' : 'Save changes'}
        </Button>
    );
};

export const entry: Entry = {
    id: 'spinner',
    name: 'Spinner',
    category: 'status',
    description: 'Only inside the button that is busy.',
    knobs: spinnerKnobs,
    Preview: SpinnerPreview,
};

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

// The report being published, behind the dialog.
const reportPage = {
    actions: <Button>Publish</Button>,
    description: 'Draft · last edited by Maya Chen 4 minutes ago.',
    nav: 'rail',
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

const PublishReport = () => {
    const [state, setState] = useState<'idle' | 'busy' | 'done'>('busy');

    useEffect(() => {
        if (state !== 'busy') return;
        const timer = window.setTimeout(() => setState('done'), 2400);
        return () => window.clearTimeout(timer);
    }, [state]);

    return (
        <OpenDialog
            footer={
                <>
                    <DialogClose
                        render={<Button disabled={state === 'busy'} variant="secondary" />}
                    >
                        Cancel
                    </DialogClose>
                    <Button loading={state === 'busy'} onClick={() => setState('busy')}>
                        {state === 'busy'
                            ? 'Publishing…'
                            : state === 'done'
                              ? 'Publish again'
                              : 'Publish'}
                    </Button>
                </>
            }
            title="Publish report"
        >
            <DialogDescription>
                Everyone with the link sees the numbers as they are now; later changes wait for the
                next publish.
            </DialogDescription>
            <ValueField copyable label="Link" value="acme.app/r/northwind-q3" />
            {state === 'done' && (
                <p className="flex items-center gap-1.5 text-neutral-600 text-xs">
                    <CircleCheck className="size-4 text-success-600" {...icon} /> Published just now
                </p>
            )}
        </OpenDialog>
    );
};

export const inUse: InUse = {
    title: 'Publish report',
    note: 'A publish dialog over the report: the button that was pressed works, and Cancel waits for it.',
    bare: true,
    render: () => (
        <AppScene page={reportPage}>
            <PublishReport />
        </AppScene>
    ),
};
