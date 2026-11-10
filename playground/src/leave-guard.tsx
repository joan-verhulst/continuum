import {
    Button,
    Dialog,
    DialogBody,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from 'continuum';
import { createContext, type RefObject, useContext, useEffect, useRef } from 'react';

/*
 * A page with changes that are not saved yet holds the playground there: while it is open it
 * registers what it would lose, and any way out of it (a sidebar item, a link, the browser's Back)
 * asks first whether to save them, drop them or stay.
 */

export type LeaveGuard = {
    /** What the changes belong to, as the question names it. */
    name: string;
    /** Whether there is anything to lose, read at the moment of leaving. */
    dirty: () => boolean;
    save: () => void;
    discard: () => void;
};

type Registry = RefObject<LeaveGuard | undefined>;

const LeaveGuardContext = createContext<Registry>({ current: undefined });

export const LeaveGuardProvider = LeaveGuardContext.Provider;

/** Registers the page's unsaved changes while it is mounted; the latest callbacks are always used. */
export const useLeaveGuard = (guard: LeaveGuard) => {
    const registry = useContext(LeaveGuardContext);
    const latest = useRef(guard);
    latest.current = guard;

    useEffect(() => {
        const entry: LeaveGuard = {
            get name() {
                return latest.current.name;
            },
            dirty: () => latest.current.dirty(),
            save: () => latest.current.save(),
            discard: () => latest.current.discard(),
        };
        registry.current = entry;
        return () => {
            if (registry.current === entry) registry.current = undefined;
        };
    }, [registry]);
};

/** The question when a page with unsaved changes is left: save and leave, discard, or stay. */
export const LeaveDialog = ({
    name,
    open,
    onSave,
    onDiscard,
    onCancel,
}: {
    name: string;
    open: boolean;
    onSave: () => void;
    onDiscard: () => void;
    onCancel: () => void;
}) => {
    const save = useRef<HTMLButtonElement>(null);
    return (
        <Dialog onOpenChange={next => !next && onCancel()} open={open}>
            <DialogContent className="w-[min(420px,calc(100vw-32px))]" initialFocus={save}>
                <DialogHeader>
                    <DialogTitle>Save changes to {name}?</DialogTitle>
                </DialogHeader>
                <DialogBody>
                    <DialogDescription>Your theme changes haven't been saved.</DialogDescription>
                </DialogBody>
                <DialogFooter>
                    <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
                    <Button onClick={onDiscard} variant="secondary">
                        Discard changes
                    </Button>
                    <Button onClick={onSave} ref={save}>
                        Save and leave
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
