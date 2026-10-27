import {
    Badge,
    BottomBar,
    Button,
    cn,
    DockAction,
    PageContent,
    Theme,
    type ThemeMode,
    ThemeScope,
} from 'continuum';
import { ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';
import {
    type ComponentProps,
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';

export type SectionEntry = {
    id: string;
    title: string;
    description?: ReactNode;
    /** Sections with the same group sit together under one label. */
    group?: string;
    render: () => ReactNode;
};

/* ---------- Page index: a page hands its entries to the sidebar ---------- */

export type PageIndexEntry = {
    id: string;
    title: string;
    /** Entries with the same group sit together under its label in the sidebar. */
    group?: string;
};

type PageIndexOptions = {
    /** The group's label in the sidebar; "On this page" when left out. */
    label?: string;
    /** What picking an entry does; without it the sidebar scrolls to the entry's id. */
    onSelect?: (id: string) => void;
};

type PageIndex = PageIndexOptions & {
    sections: PageIndexEntry[];
    active?: string;
    setIndex: (sections: PageIndexEntry[], options?: PageIndexOptions) => void;
    setActive: (id: string | undefined) => void;
};

const noop = () => {};

const PageIndexContext = createContext<PageIndex>({
    sections: [],
    setIndex: noop,
    setActive: noop,
});

export const PageIndexProvider = ({ children }: { children: ReactNode }) => {
    const [index, setIndexState] = useState<{
        sections: PageIndexEntry[];
        options: PageIndexOptions;
    }>({ sections: [], options: {} });
    const [active, setActive] = useState<string>();
    // Stable, so the effects that register a page's index do not re-run on their own change.
    const setIndex = useCallback(
        (sections: PageIndexEntry[], options: PageIndexOptions = {}) =>
            setIndexState({ sections, options }),
        [],
    );
    const value = useMemo<PageIndex>(
        () => ({
            sections: index.sections,
            ...index.options,
            active,
            setIndex,
            setActive,
        }),
        [index, active, setIndex],
    );

    return <PageIndexContext.Provider value={value}>{children}</PageIndexContext.Provider>;
};

/** The entries of the page on show and the one being read, for the sidebar and breadcrumb. */
export const usePageIndex = () => useContext(PageIndexContext);

/** Scrolls a section to the top of the panel. */
export const scrollToSection = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

/* ---------- Header slot: a page puts its controls in the header bar ---------- */

const HeaderSlotContext = createContext<HTMLElement | null>(null);

export const HeaderSlotProvider = HeaderSlotContext.Provider;

/** Renders its children at the right end of the header bar, for a page that fills the panel. */
export const HeaderActions = ({ children }: { children: ReactNode }) => {
    const slot = useContext(HeaderSlotContext);
    return slot ? createPortal(children, slot) : null;
};

/* ---------- Dock slot: a page puts its own index in the bar at the foot ---------- */

const DockSlotContext = createContext<HTMLElement | null>(null);

export const DockSlotProvider = DockSlotContext.Provider;

/** Renders its children in the floating bar at the foot of the panel, before the theme's pill. */
export const PageDock = ({ children }: { children: ReactNode }) => {
    const slot = useContext(DockSlotContext);
    return slot ? createPortal(children, slot) : null;
};

/* ---------- Sections and specimens ---------- */

type SectionProps = Omit<ComponentProps<'section'>, 'title'> & {
    title: ReactNode;
    description?: ReactNode;
};

export const Section = ({ title, description, className, children, ...props }: SectionProps) => (
    <section className={cn('flex scroll-mt-6 flex-col gap-6', className)} {...props}>
        <header className="flex max-w-2xl flex-col gap-2">
            <h2 className="font-medium text-2xl text-neutral-950 tracking-[-0.01em]">{title}</h2>
            {description && <p className="text-neutral-600 text-sm">{description}</p>}
        </header>
        {children}
    </section>
);

/** A tile's surface: a quiet, bordered stage with the thing centred on it. */
export const tileClass =
    'flex min-h-36 min-w-0 flex-col items-center justify-center gap-4 rounded-item border border-neutral-200 bg-neutral-50 p-5 [&>*]:max-w-full';

export const Note = ({ className, ...props }: ComponentProps<'p'>) => (
    <p className={cn('max-w-2xl text-neutral-600 text-xs', className)} {...props} />
);

/* ---------- Page headers ---------- */

type PageHeaderProps = {
    eyebrow?: ReactNode;
    title: ReactNode;
    description: ReactNode;
    aside?: ReactNode;
};

/** Eyebrow badge, title and lead at the top of a view; space, not a hairline, sets it off. */
export const PageHeader = ({ eyebrow, title, description, aside }: PageHeaderProps) => (
    <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex max-w-2xl flex-col items-start gap-4">
            {eyebrow && <Badge>{eyebrow}</Badge>}
            <div className="flex flex-col gap-3">
                <h1 className="font-medium text-4xl text-neutral-950 tracking-[-0.02em]">
                    {title}
                </h1>
                <p className="text-base text-neutral-600">{description}</p>
            </div>
        </div>
        {aside}
    </header>
);

type DetailHeaderProps = {
    /** The view this detail belongs to, as a way back. */
    parent: string;
    onBack: () => void;
    title: ReactNode;
    description?: ReactNode;
    aside?: ReactNode;
};

/** The top of one thing's page: a way back, its name large, what it is, and its facts beside it. */
export const DetailHeader = ({ parent, onBack, title, description, aside }: DetailHeaderProps) => (
    <header className="flex flex-col gap-5">
        <Button className="-ml-2.5 w-fit" onClick={onBack} variant="ghost">
            <ArrowLeft strokeWidth={2} /> {parent}
        </Button>
        <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex max-w-2xl flex-col gap-3">
                <h1 className="font-medium text-4xl text-neutral-950 tracking-[-0.02em]">
                    {title}
                </h1>
                {description && <p className="text-base text-neutral-600">{description}</p>}
            </div>
            {aside}
        </div>
    </header>
);

/* ---------- Stages ---------- */

const StageContext = createContext<HTMLElement | null>(null);

/**
 * The stage a preview is drawn on, or null off one. An overlay given it as its portal
 * container opens inside the stage, so a dialog, sheet or menu can be shown open.
 */
export const useStageContainer = () => useContext(StageContext);

/**
 * A quiet surface with the thing centred on it, as a component page shows its subject.
 * It paints its own layer, so anything fixed inside it (a scrim, a sheet) keeps to its box.
 */
export const Stage = ({ className, children, ...props }: ComponentProps<'div'>) => {
    // State rather than a ref: an overlay inside renders before the ref is attached and has to render again once it is.
    const [node, setNode] = useState<HTMLDivElement | null>(null);

    return (
        <div
            className={cn(
                'relative isolate flex min-h-72 items-center justify-center overflow-hidden rounded-panel border border-neutral-200 bg-neutral-50 p-10 [contain:paint]',
                className,
            )}
            ref={setNode}
            {...props}
        >
            <StageContext.Provider value={node}>{children}</StageContext.Provider>
        </div>
    );
};

const useWidth = (initial: number) => {
    const ref = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(initial);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;
        const observer = new ResizeObserver(([entry]) => {
            if (entry) setWidth(entry.contentRect.width);
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    return [ref, width] as const;
};

type FrameProps = {
    /** The width the content was designed at; it is scaled down from there to fit. */
    designWidth?: number;
    designHeight?: number;
    mode?: ThemeMode;
    /** A shot rather than a thing to use: nothing inside can be focused or clicked. */
    still?: boolean;
    className?: string;
    children: ReactNode;
};

/** A screen at its design size, scaled to the room it has, like a photograph of the thing. */
export const Frame = ({
    designWidth = 1280,
    designHeight = 780,
    mode,
    still = false,
    className,
    children,
}: FrameProps) => {
    const [ref, width] = useWidth(600);
    const scale = Math.min(1, width / designWidth);

    return (
        <div
            className={cn(
                'overflow-hidden rounded-panel border border-neutral-200 bg-neutral-50',
                className,
            )}
            inert={still || undefined}
            ref={ref}
            style={{ height: designHeight * scale }}
        >
            <Theme
                className="origin-top-left bg-neutral-50"
                mode={mode}
                style={{
                    width: designWidth,
                    height: designHeight,
                    transform: `scale(${scale})`,
                }}
            >
                {children}
            </Theme>
        </div>
    );
};

/* ---------- Full screen ---------- */

type FullScreenProps = {
    onClose: () => void;
    /** The page's own controls, beside the way back: a switch between takes, say. */
    controls?: ReactNode;
    children: ReactNode;
};

/** How long the bar stays after the pointer stops, before it fades so the screen can be read whole. */
const BAR_IDLE_MS = 2500;

/**
 * A screen at the window's own size, as an app opens: over everything, unscaled, in the
 * previewed theme. Portalled to the body, so its menus and dialogs still open over it. Leaving
 * the browser's full screen (Esc) closes it, and so does the button in its bar.
 */
export const FullScreen = ({ onClose, controls, children }: FullScreenProps) => {
    // Held in a ref, so a parent that re-renders with a new callback does not drop full screen.
    const close = useRef(onClose);
    close.current = onClose;
    // Every spot of a screen holds something of its own, a breadcrumb, a dock, a save button, so the
    // bar keeps none of them covered for long: it shows while the pointer moves, as a player's controls do.
    const [shown, setShown] = useState(true);
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => {
        const left = () => {
            if (!document.fullscreenElement) close.current();
        };
        const wake = () => {
            setShown(true);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => setShown(false), BAR_IDLE_MS);
        };
        wake();
        document.addEventListener('fullscreenchange', left);
        window.addEventListener('pointermove', wake);
        window.addEventListener('keydown', wake);
        return () => {
            document.removeEventListener('fullscreenchange', left);
            window.removeEventListener('pointermove', wake);
            window.removeEventListener('keydown', wake);
            clearTimeout(timer.current);
            if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
        };
    }, []);

    return createPortal(
        <ThemeScope>
            {/* A grid, so the screen stretches to the window whatever width it asks for at least. */}
            <div className="fixed inset-0 z-50 grid bg-neutral-100" data-slot="full-screen">
                {children}
                {/* Centred over the header bar's empty middle; hovered or focused, it stays. */}
                <BottomBar
                    className={cn(
                        'top-4 bottom-auto transition-opacity duration-200 focus-within:opacity-100 hover:opacity-100 motion-reduce:transition-none',
                        !shown && 'opacity-0',
                    )}
                    floating
                >
                    {controls}
                    <DockAction aria-label="Leave full screen" onClick={onClose} size="icon">
                        <Minimize2 strokeWidth={2} />
                    </DockAction>
                </BottomBar>
            </div>
        </ThemeScope>,
        document.body,
    );
};

/**
 * The button that opens a screen full screen. The browser only grants its own full screen
 * from the click itself, so it is asked for here; where it says no, the layer still covers the window.
 */
export const FullScreenButton = ({ onOpen }: { onOpen: () => void }) => (
    <Button
        onClick={() => {
            document.documentElement.requestFullscreen?.().catch(() => undefined);
            onOpen();
        }}
        variant="secondary"
    >
        <Maximize2 strokeWidth={2} />
        Full screen
    </Button>
);

/* ---------- Page ---------- */

type PageProps = ComponentProps<typeof PageContent>;

/** A view's column, as wide as its content is dense, never the panel's full width. */
export const Page = ({ className, ...props }: PageProps) => (
    <PageContent className={cn('flex flex-col gap-14 pt-32 pb-32', className)} {...props} />
);

/* ---------- Docs page ---------- */

/** Marks the first section in the top part of the panel as the one being read. */
export const useScrollSpy = (ids: string[], onChange: (id: string) => void) => {
    useEffect(() => {
        const visible = new Map<string, boolean>();
        const observer = new IntersectionObserver(
            entries => {
                for (const entry of entries) visible.set(entry.target.id, entry.isIntersecting);
                const first = ids.find(id => visible.get(id));
                if (first) onChange(first);
            },
            // The panel's header bar ends about 62px down the viewport.
            { rootMargin: '-80px 0px -55% 0px' },
        );
        for (const id of ids) {
            const node = document.getElementById(id);
            if (node) observer.observe(node);
        }
        return () => observer.disconnect();
    }, [ids, onChange]);
};

type DocsPageProps = {
    sections: SectionEntry[];
    ids: string[];
    /** The sidebar group's label. */
    label?: string;
};

/** The sections one under the other; their index lives in the app's sidebar. */
export const DocsPage = ({ sections, ids, label }: DocsPageProps) => {
    const { setIndex, setActive } = usePageIndex();

    useEffect(() => {
        setIndex(
            sections.map(({ id, title }) => ({ id, title })),
            { label },
        );
        setActive(sections[0]?.id);
        return () => {
            setIndex([]);
            setActive(undefined);
        };
    }, [sections, label, setIndex, setActive]);

    useScrollSpy(ids, setActive);

    return (
        <div className="flex min-w-0 flex-col gap-20">
            {sections.map((section, i) => {
                const opensGroup = section.group && section.group !== sections[i - 1]?.group;

                return (
                    <Section
                        description={section.description}
                        id={section.id}
                        key={section.id}
                        title={
                            opensGroup ? (
                                <span className="flex flex-col items-start gap-3">
                                    <Badge>{section.group}</Badge>
                                    {section.title}
                                </span>
                            ) : (
                                section.title
                            )
                        }
                    >
                        {section.render()}
                    </Section>
                );
            })}
        </div>
    );
};
