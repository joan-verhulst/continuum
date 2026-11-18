import {
    Button,
    cn,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    ToastProvider,
    useOptimisticUndo,
} from 'continuum';
import { Archive, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useStageContainer } from '../../layout';
import type { Entry, Knob, PreviewProps } from '../kit';
import { icon, o } from '../kit';

/*
 * Optimistic update with Undo: the row leaves at once, a toast offers Undo, and the request runs
 * behind it. Set the request to fail and the row comes back by itself, with an error toast.
 */

const threads = [
    { id: 'renewal', name: 'Acme renewal terms', from: 'Liam Ortiz' },
    { id: 'invoice', name: 'Invoice INV-2041 overdue', from: 'Billing' },
    { id: 'board', name: 'Board pack · October', from: 'Sara Kim' },
    { id: 'churn', name: 'Churn by plan, first look', from: 'Noah Patel' },
];

type Thread = (typeof threads)[number];

const knobs: Knob[] = [
    {
        id: 'request',
        label: 'The request',
        options: [o('ok', 'Succeeds'), o('fail', 'Fails after 800 ms')],
        default: 'ok',
    },
];

const Inbox = ({ fails, still }: { fails: boolean; still: boolean }) => {
    const optimistic = useOptimisticUndo();
    const [shown, setShown] = useState(threads.map(thread => thread.id));

    // Back in its own place: the list's order, not the end.
    const restore = (id: string) =>
        setShown(now => threads.map(t => t.id).filter(t => t === id || now.includes(t)));

    const archive = (thread: Thread) =>
        optimistic({
            apply: () => setShown(now => now.filter(id => id !== thread.id)),
            revert: () => restore(thread.id),
            commit: () =>
                new Promise((resolve, reject) =>
                    setTimeout(() => (fails ? reject(new Error('offline')) : resolve(null)), 800),
                ),
            title: thread.name,
            description: 'Moved to Archive',
            failed: {
                title: 'Couldn’t archive',
                description: `${thread.name} is back in the inbox`,
            },
        });

    return (
        <div className="flex w-full max-w-120 flex-col gap-3">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Thread</TableHead>
                        {/* The grid's tile has room for the threads alone. */}
                        {!still && <TableHead>From</TableHead>}
                        <TableHead className="w-12">
                            <span className="sr-only">Archive</span>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {(still ? threads.slice(0, 3) : threads)
                        .filter(thread => shown.includes(thread.id))
                        .map(thread => (
                            <TableRow key={thread.id}>
                                <TableCell className="font-medium text-neutral-950">
                                    {thread.name}
                                </TableCell>
                                {!still && (
                                    <TableCell className="text-neutral-600">
                                        {thread.from}
                                    </TableCell>
                                )}
                                <TableCell>
                                    <Button
                                        aria-label={`Archive ${thread.name}`}
                                        onClick={() => archive(thread)}
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
            {shown.length < threads.length && (
                <Button
                    className="self-start"
                    onClick={() => setShown(threads.map(thread => thread.id))}
                    variant="ghost"
                >
                    <RotateCcw {...icon} /> Bring all back
                </Button>
            )}
        </div>
    );
};

const OptimisticUndoPreview = ({ knobs: values }: PreviewProps) => {
    const stage = useStageContainer();
    const still = Boolean(stage?.inert);

    return (
        // Inside the stage, so the toasts stack in its corner; on the page, room under the list for them.
        <ToastProvider container={stage}>
            <div className={cn('flex w-full justify-center', !still && 'pb-24')}>
                <Inbox fails={values.request === 'fail'} still={still} />
            </div>
        </ToastProvider>
    );
};

export const entry: Entry = {
    id: 'optimistic-undo',
    name: 'Optimistic update with Undo',
    category: 'interaction',
    description:
        'The change shows at once with Undo in a toast; the request runs behind it, and a failure puts the thing back.',
    hero: 'min-h-110',
    knobs,
    Preview: OptimisticUndoPreview,
};
