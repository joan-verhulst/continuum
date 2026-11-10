import {
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    ToastProvider,
    useToast,
} from 'continuum';
import { Archive, ArrowUpRight, FileDown, FileText, Plus, RotateCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useStageContainer } from '../../layout';
import {
    AppScene,
    type Entry,
    type InUse,
    icon,
    type Knob,
    o,
    opts,
    type PreviewProps,
} from '../kit';

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
    // A small action's confirmation ("Link copied") is a Notice; a toast tells of work that runs on.
    neutral: {
        title: 'Export started',
        thing: 'Northwind Q3 review',
        meta: '12 pages as PDF · we’ll email you a link',
        action: 'Open exports',
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
        title: 'Export started, with every chart, table and comment in the report included',
        thing: 'Northwind Q3 review · revenue, retention and the board summary for the third quarter',
        meta: 'Twelve pages as a PDF with the charts at print size. It can take a few minutes; we’ll email you a link when it is ready, and it waits under Exports for thirty days.',
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

// What each action does here, in a word under the button, since there is nothing behind it to undo.
const actionResults = {
    neutral: 'Opened the exports',
    success: 'Undone: the report is back',
    error: 'Retried: archived',
};

/**
 * Raises one toast that stays while the knobs describe it, and another from the button that leaves
 * on its timer. Closing the held one leaves the button to bring it back.
 */
const ToastTrigger = ({ knobs }: PreviewProps) => {
    const toast = useToast();
    const [held, setHeld] = useState<string>();
    const [result, setResult] = useState<string>();
    const type = knobs.type === 'neutral' || knobs.type === 'error' ? knobs.type : 'success';
    const text = { ...toastText[type], ...(knobs.length === 'long' ? longText[type] : {}) };
    // The card names the thing with a line about it; the tab, when there is one, says what happened.
    const show = (timeout?: number) => {
        const id: string = toast.add({
            title: text.thing,
            description: knobs.description ? text.meta : undefined,
            type: type === 'neutral' ? undefined : type,
            timeout,
            actionProps: knobs.action
                ? {
                      children: text.action,
                      onClick: () => {
                          setResult(actionResults[type]);
                          toast.close(id);
                      },
                  }
                : undefined,
            data: {
                tab: knobs.tab ? text.title : undefined,
                icon: type === 'neutral' ? <FileDown {...icon} /> : undefined,
                actionIcon: actionIcons[type],
            },
        });
        return id;
    };

    const hold = () => {
        setResult(undefined);
        setHeld(show(0));
    };

    // biome-ignore lint/correctness/useExhaustiveDependencies: a new toast for each change of the knobs
    useEffect(() => {
        const id = show(0);
        setHeld(id);
        setResult(undefined);
        return () => toast.close(id);
    }, [knobs.type, knobs.length, knobs.tab, knobs.description, knobs.action]);

    // Closed, leaving, or pushed out of the pile by newer ones: either way no longer there to read.
    const showing = toast.toasts.some(
        item => item.id === held && item.transitionStatus !== 'ending' && !item.limited,
    );

    return (
        <div className="flex flex-col items-center gap-3">
            {showing ? (
                <Button onClick={() => show()} variant="secondary">
                    Show another
                </Button>
            ) : (
                <Button onClick={hold} variant="secondary">
                    Show it again
                </Button>
            )}
            <span aria-live="polite" className="text-neutral-600 text-xxs">
                {result ?? (showing ? 'Held open while the knobs describe it' : 'Closed')}
            </span>
        </div>
    );
};

const ToastPreview = ({ knobs }: PreviewProps) => {
    const stage = useStageContainer();

    return (
        <ToastProvider container={stage}>
            <div className="pb-20">
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
    { id: 'q3', name: 'Northwind Q3 review', owner: 'Maya Chen', updated: 'Today' },
    { id: 'renewal', name: 'Acme renewal forecast', owner: 'Liam Ortiz', updated: 'Yesterday' },
    { id: 'board', name: 'Board pack · October', owner: 'Sara Kim', updated: '21 Oct' },
    { id: 'churn', name: 'Churn by plan', owner: 'Noah Patel', updated: '18 Oct' },
    { id: 'cash', name: 'Cash flow · Q4 outlook', owner: 'Maya Chen', updated: '14 Oct' },
];

const ReportRows = () => {
    const toast = useToast();
    const [reports, setReports] = useState(archivable.slice(1));

    // The piece opens just after an export and an archive, so a long toast and a short one show.
    // biome-ignore lint/correctness/useExhaustiveDependencies: once, on mount
    useEffect(() => {
        const first = archivable[0];
        if (!first) return;
        const exported: string = toast.add({
            title: 'Exporting the board pack',
            description: '38 pages · we’ll email you a link',
            timeout: 0,
            // There is no exports page in the piece; the toast has done its work once it is followed.
            actionProps: { children: 'Open exports', onClick: () => toast.close(exported) },
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
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Report</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="w-12">
                        <span className="sr-only">Archive</span>
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {reports.map(report => (
                    <TableRow key={report.id}>
                        <TableCell>
                            <span className="flex items-center gap-2.5 font-medium text-neutral-950">
                                <FileText className="size-4 shrink-0 text-neutral-600" {...icon} />
                                {report.name}
                            </span>
                        </TableCell>
                        <TableCell className="text-neutral-600">{report.owner}</TableCell>
                        <TableCell className="text-neutral-600">{report.updated}</TableCell>
                        <TableCell>
                            <Button
                                aria-label={`Archive ${report.name}`}
                                onClick={() => archive(report)}
                                size="icon-sm"
                                variant="ghost"
                            >
                                <Archive {...icon} />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

// Inside the scene, so the toasts portal into its stage and stack in the window's corner.
const Toasts = () => {
    const stage = useStageContainer();

    return (
        <ToastProvider container={stage}>
            <ReportRows />
        </ToastProvider>
    );
};

const ArchiveReports = () => (
    <AppScene
        page={{
            actions: (
                <Button>
                    <Plus {...icon} /> New report
                </Button>
            ),
            description: 'Weekly and monthly reports, shared with your team.',
            place: 'reports',
            title: 'Reports',
            trail: ['Reports'],
            children: <Toasts />,
        }}
    />
);

export const inUse: InUse = {
    title: 'Archive a report',
    note: 'Reports, just after an archive and an export: the archive confirms itself under a tab with Undo, the export is a plain card.',
    bare: true,
    render: () => <ArchiveReports />,
};
