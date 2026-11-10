/*
 * What the component pages share: the entry, knob and in-use types, the categories, and the
 * helpers more than one component is drawn with. Each component's own preview, knobs and
 * in-use piece live in entries/<id>.tsx, listed in entries/index.ts.
 */

import {
    AppPanel,
    AppShell,
    Button,
    type ChatMessageStatus,
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
    HeaderBar,
    Rail,
    RailItem,
    RailSeparator,
    TooltipProvider,
    TopNav,
    TopNavBrand,
    TopNavLink,
    TopNavLinks,
} from 'continuum';
import { Boxes, Settings } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Stage, useStageContainer } from '../layout';
import { PageHead, type Place, places, Trail, WorkspaceSidebar } from '../screens/workspace';

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

export type KnobValues = Record<string, string | boolean>;

type KnobBase = {
    id: string;
    label: string;
    /**
     * Whether the knob means anything for the other knobs' values; left out, it always does.
     * A knob another one makes meaningless leaves the panel rather than sit there dead.
     */
    when?: (values: KnobValues) => boolean;
};

export type Knob =
    | (KnobBase & { options: readonly KnobOption[]; default: string })
    | (KnobBase & { switch: true; default: boolean });

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

/** A small photo stand-in for image attachments: a dusk sky over two hills, drawn inline. */
export const sampleImage = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e2a4a"/><stop offset="1" stop-color="#c97b5a"/></linearGradient></defs><rect width="80" height="80" fill="url(#s)"/><circle cx="54" cy="34" r="8" fill="#f3d9a4"/><path d="M0 62 Q20 44 40 58 T80 52 V80 H0Z" fill="#2b3550"/><path d="M0 70 Q30 58 56 68 T80 66 V80 H0Z" fill="#161c2c"/></svg>',
)}`;

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
    /** Draws a page of the app (an `AppWindow`) that fills the frame edge to edge. */
    app?: boolean;
    /** Drawn on the canvas colour with cards on it, as a product page is. */
    canvas?: boolean;
    /** Draws its own 16:9 stage (a scene with something open), so no frame is put round it. */
    bare?: boolean;
    render: () => ReactNode;
};

/* ---------- Sending: a message walks its delivery states, or fails and is retried ---------- */

export type Sent = { id: number; text: string; status: ChatMessageStatus };

// When each state lands after the send, in ms: a quick tick, then the far side's two.
const walk: [number, ChatMessageStatus][] = [
    [500, 'sent'],
    [1300, 'delivered'],
    [2400, 'read'],
];

/**
 * The current user's sent messages, each walking sending → sent → delivered → read, or failing
 * once (as a dropped connection would) when `fails`; a retry goes through.
 */
export const useSending = (fails = false) => {
    const [sent, setSent] = useState<Sent[]>([]);
    const timers = useRef<number[]>([]);
    const next = useRef(0);

    useEffect(() => () => timers.current.forEach(clearTimeout), []);

    const set = (id: number, status: ChatMessageStatus) =>
        setSent(current => current.map(m => (m.id === id ? { ...m, status } : m)));

    const deliver = (id: number, fail: boolean) => {
        set(id, 'sending');
        const steps: [number, ChatMessageStatus][] = fail ? [[900, 'failed']] : walk;
        for (const [at, status] of steps) {
            timers.current.push(window.setTimeout(() => set(id, status), at));
        }
    };

    const send = (text: string) => {
        next.current += 1;
        const id = next.current;
        setSent(current => [...current, { id, text, status: 'sending' }]);
        deliver(id, fails);
    };

    const retry = (id: number) => deliver(id, false);

    return { sent, send, retry };
};

/* ---------- The app: one product every piece is a page of ---------- */

/**
 * How the page is reached, and so how it is framed:
 * - `sidebar`: the workspace's sidebar on the canvas, the page on the inset panel under a header
 *   bar with its breadcrumb.
 * - `rail`: one page, edge to edge, with the rail floating over it at the left.
 * - `top`: one page with the top navigation across it.
 * - `none`: the page alone.
 */
export type AppNav = 'sidebar' | 'rail' | 'top' | 'none';

export type AppWindowProps = {
    nav?: AppNav;
    /** Where in the app the page is: lights its place in the navigation. */
    place?: Place;
    /** The breadcrumb down to the page, in the sidebar's header bar. */
    trail?: string[];
    /** The page's title and the line under it; left out, the page starts with the piece. */
    title?: ReactNode;
    description?: ReactNode;
    /** The page's own actions, beside its title. */
    actions?: ReactNode;
    /** Over the page at its foot: a floating bar, a toast. */
    overlay?: ReactNode;
    /**
     * The page's column: `narrow` (640) for one thing made or edited, `default` (896) for
     * settings and details, `wide` (the window) for lists and dashboards.
     */
    width?: 'narrow' | 'default' | 'wide';
    /** Classes for the page's column. */
    className?: string;
    children: ReactNode;
};

// The page's column: its head, then the piece, fading out at the foot where the page runs on.
// The page's column, as dense as the page is: the widths PageContent gives a page.
const columnWidths: Record<'narrow' | 'default', string> = {
    narrow: 'max-w-content-narrow',
    default: 'max-w-content',
};

const PageColumn = ({
    title,
    description,
    actions,
    width = 'wide',
    className,
    children,
}: Pick<
    AppWindowProps,
    'title' | 'description' | 'actions' | 'width' | 'className' | 'children'
>) => {
    const page = (
        <>
            {title && (
                <PageHead description={description} title={title}>
                    {actions}
                </PageHead>
            )}
            {children}
        </>
    );

    return (
        <div
            className={cn(
                'flex min-h-0 flex-1 flex-col gap-8 overflow-hidden px-10 pt-10 [mask-image:linear-gradient(to_bottom,black_calc(100%-48px),transparent)]',
                className,
            )}
        >
            {width === 'wide' ? (
                page
            ) : (
                <div className={cn('mx-auto flex w-full flex-col gap-8', columnWidths[width])}>
                    {page}
                </div>
            )}
        </div>
    );
};

const topPlaces = places.slice(0, 4);

/**
 * A page of the workspace the Patterns screens are built in, at full size and cropped to the
 * frame, framed by how it is reached (see `AppNav`), with the piece in its place on it.
 */
export const AppWindow = ({
    nav = 'sidebar',
    place = 'overview',
    trail,
    overlay,
    ...page
}: AppWindowProps) => {
    if (nav === 'sidebar') {
        return (
            <AppShell className="h-full min-h-0 w-full">
                <WorkspaceSidebar place={place} />
                <AppPanel>
                    <HeaderBar>
                        <Trail trail={trail ?? []} />
                    </HeaderBar>
                    <PageColumn {...page} />
                    {overlay}
                </AppPanel>
            </AppShell>
        );
    }

    return (
        <div className="relative flex h-full w-full flex-col bg-neutral-50">
            {nav === 'top' && (
                <TopNav className="border-neutral-200 border-b">
                    <TopNavBrand logo={<Boxes {...icon} />}>Acme</TopNavBrand>
                    <TopNavLinks aria-label="Sections">
                        {topPlaces.map(item => (
                            <TopNavLink active={item.id === place} key={item.id}>
                                {item.label}
                            </TopNavLink>
                        ))}
                    </TopNavLinks>
                </TopNav>
            )}
            {nav === 'rail' && (
                // Floats over the page at its left edge, centred, as an island does.
                <TooltipProvider>
                    <Rail
                        aria-label="Main"
                        className="absolute top-1/2 left-6 z-20 -translate-y-1/2"
                    >
                        {places.map(item => (
                            <RailItem active={item.id === place} key={item.id} label={item.label}>
                                {item.icon}
                            </RailItem>
                        ))}
                        <RailSeparator />
                        <RailItem active={place === 'settings'} label="Settings">
                            <Settings {...icon} />
                        </RailItem>
                    </Rail>
                </TooltipProvider>
            )}
            <PageColumn
                {...page}
                // Clear of the floating rail: its 24px inset, its 52px and a gutter.
                className={cn(nav === 'rail' && 'pl-28', page.className)}
            />
            {overlay}
        </div>
    );
};

/* ---------- Scenes: a stage with something held open on it ---------- */

export const Scene = ({ className, children }: { className?: string; children: ReactNode }) => (
    <Stage className={cn('aspect-video min-h-110 w-full', className)}>{children}</Stage>
);

/**
 * An overlay on a stage: open from the start, so the page shows it, but closed by its own
 * controls and opened again by its trigger, so it still answers. It waits for the stage, so it
 * never opens on the page behind it first.
 */
export const useHeldOpen = () => {
    const stage = useStageContainer();
    const [open, setOpen] = useState(true);

    return { stage, open: open && stage !== null, onOpenChange: setOpen };
};

/** Brings back an overlay that was closed and has no trigger on the stage, at the stage's foot. */
export const Reopen = ({ label, onClick }: { label: ReactNode; onClick: () => void }) => (
    <Button
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2"
        onClick={onClick}
        variant="secondary"
    >
        {label}
    </Button>
);

export type OpenDialogProps = {
    title: string;
    /** The dialog's width in px; it never outgrows the stage. */
    width?: number;
    footer?: ReactNode;
    children: ReactNode;
};

/**
 * A dialog held open, scrim and all, on the stage it is drawn on. Its Cancel, × and action close
 * it, as they would in the product, and a button at the stage's foot opens it again.
 */
export const OpenDialog = ({ title, width = 440, footer, children }: OpenDialogProps) => {
    const { stage, open, onOpenChange } = useHeldOpen();

    return (
        <>
            <Dialog modal={false} onOpenChange={onOpenChange} open={open}>
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
            {stage && !open && <Reopen label={title} onClick={() => onOpenChange(true)} />}
        </>
    );
};

/** Cancel and the dialog's action; both close it, the action as though it had done its work. */
export const DialogActions = ({ action, disabled }: { action: ReactNode; disabled?: boolean }) => (
    <>
        <DialogClose render={<Button variant="secondary" />}>Cancel</DialogClose>
        <DialogClose disabled={disabled} render={<Button />}>
            {action}
        </DialogClose>
    </>
);

/**
 * A page of the app with something held open over it: the overlay (a dialog, sheet, menu, toast)
 * portals into the stage, so it sits over the page as it would in the product.
 */
export const AppScene = ({ page, children }: { page: AppWindowProps; children?: ReactNode }) => (
    <Scene className="p-0">
        <div className="absolute inset-0">
            <AppWindow {...page} />
        </div>
        {children}
    </Scene>
);

export const scene = (node: ReactNode, className?: string) => () => (
    <Scene className={className}>{node}</Scene>
);
