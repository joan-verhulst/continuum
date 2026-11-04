/*
 * What the component pages share: the entry, knob and in-use types, the categories, and the
 * helpers more than one component is drawn with. Each component's own preview, knobs and
 * in-use piece live in entries/<id>.tsx, listed in entries/index.ts.
 */

import {
    Button,
    cn,
    Dialog,
    DialogBody,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Field,
    FieldLabel,
} from 'continuum';
import type { ReactNode } from 'react';
import { Stage, useStageContainer } from '../layout';

/* ---------- Previews ---------- */

export const previewIcon = { strokeWidth: 1.5 } as const;

export const categories = [
    { id: 'frame', label: 'App frame' },
    { id: 'navigation', label: 'Navigation' },
    { id: 'actions', label: 'Actions' },
    { id: 'inputs', label: 'Inputs' },
    { id: 'forms', label: 'Forms and settings' },
    { id: 'filtering', label: 'Filtering' },
    { id: 'overlays', label: 'Overlays' },
    { id: 'content', label: 'Content' },
    { id: 'labels', label: 'Labels and identity' },
    { id: 'status', label: 'Status' },
    { id: 'messages', label: 'Messages' },
    { id: 'charts', label: 'Charts' },
    { id: 'ai', label: 'AI' },
] as const;

export type Category = (typeof categories)[number]['id'];

/*
 * Knobs: a component's variants and states are not laid out as a grid of every
 * combination; the page shows one, and a panel beside the stage picks which.
 */

export type KnobOption = { value: string; label: string };

export type Knob =
    | { id: string; label: string; options: readonly KnobOption[]; default: string }
    | { id: string; label: string; switch: true; default: boolean };

export type KnobValues = Record<string, string | boolean>;

export type PreviewProps = { knobs: KnobValues };

export const knobDefaults = (knobs: readonly Knob[] = []): KnobValues =>
    Object.fromEntries(knobs.map(knob => [knob.id, knob.default]));

export const o = (value: string, label = value): KnobOption => ({ value, label });

/** Options named after their values, capitalised. */
export const opts = (...values: string[]) =>
    values.map(value => o(value, value.charAt(0).toUpperCase() + value.slice(1)));

export const tones = ['neutral', 'success', 'warning', 'error', 'primary'] as const;

export type Tone = (typeof tones)[number];

export const sizes = [o('sm', 'sm · 34px'), o('md', 'md · 38px')];

export type Entry = {
    id: string;
    name: string;
    category: Category;
    description: string;
    /** Columns taken in the grid; charts and tables need the room. */
    span?: 2 | 3;
    /** Classes for the tile's stage on the grid. */
    stageClassName?: string;
    /** Classes for the stage at the top of the component's page. */
    hero?: string;
    /** What the page's panel can change about the preview; the grid shows the defaults. */
    knobs?: readonly Knob[];
    Preview: (props: PreviewProps) => ReactNode;
};

/** A control with its label beside it; the Field wires the label to the control. */
export const Labelled = ({ children, label }: { children: ReactNode; label: string }) => (
    <Field className="flex-row items-center gap-2.5">
        {children}
        <FieldLabel className="cursor-pointer">{label}</FieldLabel>
    </Field>
);

/* ---------- In-use pieces ---------- */

export const icon = { strokeWidth: 2 } as const;

/*
 * Components in use: one small, real piece of a product per component, built so
 * that component is the thing on show. Form controls sit in the dialog they would
 * be filled in; overlays are shown open; everything else in the card or frame it
 * belongs to, with as little beside it as the piece needs.
 */

export type InUse = {
    title: string;
    /** What the piece is, in a line. */
    note: string;
    /** Drawn on the canvas colour with cards on it, as a product page is. */
    canvas?: boolean;
    /** Draws its own 16:9 stage (a scene with something open), so no frame is put round it. */
    bare?: boolean;
    render: () => ReactNode;
};

/* ---------- Scenes: a stage with something held open on it ---------- */

export const Scene = ({ className, children }: { className?: string; children: ReactNode }) => (
    <Stage className={cn('aspect-video min-h-[440px] w-full', className)}>{children}</Stage>
);

export type OpenDialogProps = {
    title: string;
    /** The dialog's width in px; it never outgrows the stage. */
    width?: number;
    footer?: ReactNode;
    children: ReactNode;
};

/** A dialog held open, scrim and all, on the stage it is drawn on. */
export const OpenDialog = ({ title, width = 440, footer, children }: OpenDialogProps) => {
    const stage = useStageContainer();

    return (
        <Dialog modal={false} open>
            <DialogContent
                container={stage}
                finalFocus={false}
                initialFocus={false}
                style={{ width: `min(${width}px, calc(100% - 32px))` }}
            >
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <DialogBody>{children}</DialogBody>
                {footer && <DialogFooter>{footer}</DialogFooter>}
            </DialogContent>
        </Dialog>
    );
};

export const DialogActions = ({ action, disabled }: { action: ReactNode; disabled?: boolean }) => (
    <>
        <DialogClose render={<Button variant="secondary" />}>Cancel</DialogClose>
        <Button disabled={disabled}>{action}</Button>
    </>
);

export const scene = (node: ReactNode, className?: string) => () => (
    <Scene className={className}>{node}</Scene>
);
