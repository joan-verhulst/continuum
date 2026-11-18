'use client';

import { useCallback } from 'react';
import { useToast } from './toast';

export type OptimisticAction = {
    /** Shows the change at once, as though it were done. */
    apply: () => void;
    /** Puts the thing back exactly as it was, in its place in the list. */
    revert: () => void;
    /** Sends the change. It runs as the change shows; if it rejects, the change is reverted and an error toast says so. */
    commit?: () => unknown;
    /** Sends the reverse, when Undo is pressed. */
    undo?: () => unknown;
    /** The toast's title: the thing it happened to ("Northwind Q3 review"). */
    title: string;
    /** What happened to it ("Moved to Archive"). */
    description?: string;
    /** An optional tab over the toast ("Report archived"). */
    tab?: string;
    /** The error toast's words when the commit fails. */
    failed?: { title: string; description?: string };
};

/**
 * An optimistic update with Undo, on the toast: the change shows at once, a toast says what happened
 * with Undo for its 5s, and the request goes as the change shows. Undo reverts it and sends the
 * reverse; a request that fails reverts it and says so in an `error` toast. For a reversible action
 * that almost always succeeds (archive, move, mark as read, delete to a bin). Needs a ToastProvider.
 */
export const useOptimisticUndo = () => {
    const toast = useToast();

    return useCallback(
        ({ apply, revert, commit, undo, title, description, tab, failed }: OptimisticAction) => {
            let undone = false;
            apply();
            const id: string = toast.add({
                title,
                description,
                data: { tab, undo: true },
                actionProps: {
                    children: 'Undo',
                    onClick: () => {
                        undone = true;
                        revert();
                        undo?.();
                        toast.close(id);
                    },
                },
            });
            Promise.resolve()
                .then(commit)
                .catch(() => {
                    if (undone) return;
                    toast.close(id);
                    revert();
                    toast.add({
                        title: failed?.title ?? title,
                        description:
                            failed?.description ?? 'It didn’t go through, so nothing changed',
                        type: 'error',
                    });
                });
        },
        [toast],
    );
};
