import { Button, DialogClose, DialogDescription, ValueField } from 'continuum';
import { CircleCheck, History } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    type Entry,
    type InUse,
    icon,
    type Knob,
    OpenDialog,
    o,
    opts,
    type PreviewProps,
    previewIcon,
    scene,
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
            <ValueField copyable label="Link" value="continuum.app/r/northwind-q3" />
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
    note: 'The button that was pressed works; Cancel waits for it.',
    bare: true,
    render: scene(<PublishReport />),
};
