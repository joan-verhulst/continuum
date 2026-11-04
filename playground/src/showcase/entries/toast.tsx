import { Button, Card, CardHeader, CardTitle, ToastProvider, useToast } from 'continuum';
import { Archive, ArrowUpRight, FileDown, FileText, Link2, RotateCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useStageContainer } from '../../layout';
import { type Entry, type InUse, icon, type Knob, o, opts, type PreviewProps, scene } from '../kit';

const toastKnobs: Knob[] = [
    { id: 'type', label: 'Type', options: opts('neutral', 'success', 'error'), default: 'success' },
    {
        id: 'length',
        label: 'Text',
        options: [o('short', 'Short'), o('long', 'A lot')],
        default: 'short',
    },
    { id: 'tab', label: 'Tab', switch: true, default: true },
    { id: 'description', label: 'Description', switch: true, default: true },
    { id: 'action', label: 'Action', switch: true, default: true },
];

// What happened (the tab), the thing it happened to (the card) and a line about it.
const toastText = {
    neutral: {
        title: 'Link copied',
        thing: 'Northwind Q3 review',
        meta: 'Anyone in the workspace can open it',
        action: 'Open',
    },
    success: {
        title: 'Report archived',
        thing: 'Northwind Q3 review',
        meta: 'Moved to Archive · 12 pages',
        action: 'Undo',
    },
    error: {
        title: 'Couldn’t archive',
        thing: 'Northwind Q3 review',
        meta: 'You’re offline, so nothing moved',
        action: 'Retry',
    },
} as const;

// The same toasts with far too much to say, to show where the card wraps and where it stops.
const longText = {
    neutral: {
        title: 'Link copied to your clipboard and shared with the Northwind workspace',
        thing: 'Northwind Q3 review · revenue, retention and the board summary for the third quarter',
        meta: 'Anyone in the workspace can open it, comment on it and copy it into their own reports, until you turn the link off in the report’s sharing settings.',
    },
    success: {
        title: 'Report archived and removed from every dashboard it was pinned to',
        thing: 'Northwind Q3 review · revenue, retention and the board summary for the third quarter',
        meta: 'Moved to Archive with its 12 pages, 4 charts and 31 comments. It stays searchable, and anyone with the link can still read it, but nobody can edit it until it is restored.',
    },
    error: {
        title: 'Couldn’t archive the report, and nothing about it has changed',
        thing: 'Northwind Q3 review · revenue, retention and the board summary for the third quarter',
        meta: 'You went offline while the archive was saving, so the report is still where it was. We’ll try again as soon as you’re back online, or you can retry now.',
    },
} as const;

const actionIcons = {
    neutral: <ArrowUpRight {...icon} />,
    success: undefined,
    error: <RotateCw {...icon} />,
};

/** Raises one toast that stays while the knobs describe it, and another from the button. */
const ToastTrigger = ({ knobs }: PreviewProps) => {
    const toast = useToast();
    const type = knobs.type === 'neutral' || knobs.type === 'error' ? knobs.type : 'success';
    const text = { ...toastText[type], ...(knobs.length === 'long' ? longText[type] : {}) };
    // The card names the thing with a line about it; the tab, when there is one, says what happened.
    const show = (timeout?: number) =>
        toast.add({
            title: text.thing,
            description: knobs.description ? text.meta : undefined,
            type: type === 'neutral' ? undefined : type,
            timeout,
            actionProps: knobs.action ? { children: text.action } : undefined,
            data: {
                tab: knobs.tab ? text.title : undefined,
                icon: type === 'neutral' ? <Link2 {...icon} /> : undefined,
                actionIcon: actionIcons[type],
            },
        });

    // biome-ignore lint/correctness/useExhaustiveDependencies: a new toast for each change of the knobs
    useEffect(() => {
        const id = show(0);
        return () => toast.close(id);
    }, [knobs.type, knobs.length, knobs.tab, knobs.description, knobs.action]);

    return (
        <Button onClick={() => show()} variant="secondary">
            Show another
        </Button>
    );
};

const ToastPreview = ({ knobs }: PreviewProps) => {
    const stage = useStageContainer();

    return (
        <ToastProvider container={stage}>
            <div className="pb-16">
                <ToastTrigger knobs={knobs} />
            </div>
        </ToastProvider>
    );
};

export const entry: Entry = {
    id: 'toast',
    name: 'Toast',
    category: 'messages',
    description: 'What just happened, as a card in the corner with undo, under an optional tab.',
    knobs: toastKnobs,
    Preview: ToastPreview,
};

const archivable = [
    { id: 'q3', name: 'Northwind Q3 review', owner: 'Anna de Vries' },
    { id: 'renewal', name: 'Acme renewal forecast', owner: 'Bram Jansen' },
    { id: 'board', name: 'Board pack · October', owner: 'Chloé Martin' },
    { id: 'churn', name: 'Churn by plan', owner: 'Daan Visser' },
];

const ReportRows = () => {
    const toast = useToast();
    const [reports, setReports] = useState(archivable.slice(1));

    // The piece opens just after an export and an archive, so a long toast and a short one show.
    // biome-ignore lint/correctness/useExhaustiveDependencies: once, on mount
    useEffect(() => {
        const first = archivable[0];
        if (!first) return;
        const exported = toast.add({
            title: 'Exporting the board pack',
            description: '38 pages · we’ll email you a link',
            timeout: 0,
            actionProps: { children: 'Open exports' },
            data: { icon: <FileDown {...icon} />, actionIcon: <ArrowUpRight {...icon} /> },
        });
        const id = toast.add({
            title: first.name,
            description: 'Moved to Archive',
            type: 'success',
            data: { tab: 'Report archived' },
            timeout: 0,
            actionProps: {
                children: 'Undo',
                onClick: () => {
                    setReports(current => [first, ...current]);
                    toast.close(id);
                },
            },
        });
        return () => {
            toast.close(exported);
            toast.close(id);
        };
    }, []);

    const archive = (report: (typeof archivable)[number]) => {
        setReports(current => current.filter(item => item.id !== report.id));
        const id = toast.add({
            title: report.name,
            description: 'Moved to Archive',
            type: 'success',
            data: { tab: 'Report archived' },
            actionProps: {
                children: 'Undo',
                onClick: () => {
                    setReports(current =>
                        archivable.filter(item =>
                            [...current.map(row => row.id), report.id].includes(item.id),
                        ),
                    );
                    toast.close(id);
                },
            },
        });
    };

    return (
        <Card className="mb-16 w-full max-w-lg gap-3">
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Reports</CardTitle>
                <span className="text-neutral-600 text-xs tabular-nums">{reports.length}</span>
            </CardHeader>
            <ul className="flex flex-col gap-1">
                {reports.map(report => (
                    <li className="flex h-[34px] items-center gap-3 text-xs" key={report.id}>
                        <FileText className="size-4 shrink-0 text-neutral-600" {...icon} />
                        <span className="min-w-0 flex-1 truncate font-medium text-neutral-950">
                            {report.name}
                        </span>
                        <span className="shrink-0 text-neutral-500 max-sm:hidden">
                            {report.owner}
                        </span>
                        <Button
                            aria-label={`Archive ${report.name}`}
                            onClick={() => archive(report)}
                            size="icon-sm"
                            variant="ghost"
                        >
                            <Archive {...icon} />
                        </Button>
                    </li>
                ))}
            </ul>
        </Card>
    );
};

const ArchiveReports = () => {
    const stage = useStageContainer();

    return (
        <ToastProvider container={stage}>
            <ReportRows />
        </ToastProvider>
    );
};

export const inUse: InUse = {
    title: 'Archive a report',
    note: 'Each archive confirms itself under a Report archived tab, with Undo in it; the running export is a plain card.',
    bare: true,
    render: scene(<ArchiveReports />),
};
