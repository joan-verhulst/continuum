import {
    AppPanel,
    AppShell,
    Badge,
    BottomBar,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    ContinuumLogo,
    cn,
    DockAction,
    HeaderBar,
    isDefaultTheme,
    NavGroup,
    NavItem,
    SheetArea,
    Sidebar,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarToggle,
    Switch,
    Theme,
} from 'continuum';
import {
    Grid3x3,
    House,
    LayoutGrid,
    LayoutTemplate,
    Moon,
    Newspaper,
    Palette,
    Sun,
    SwatchBook,
} from 'lucide-react';
import { type ReactNode, type RefObject, useEffect, useRef, useState } from 'react';
import {
    DockSlotProvider,
    HeaderSlotProvider,
    type PageIndexEntry,
    PageIndexProvider,
    scrollToSection,
    usePageIndex,
} from './layout';
import { type AppState, CUSTOM_THEME, toHash, type View } from './meta';
import { ThemeSheet } from './theme-sheet';

const icon = { strokeWidth: 2 } as const;

const viewMeta: Record<View, { label: string; icon: ReactNode }> = {
    home: { label: 'Continuum', icon: <House {...icon} /> },
    foundations: { label: 'Foundations', icon: <Palette {...icon} /> },
    components: { label: 'Components', icon: <LayoutGrid {...icon} /> },
    patterns: { label: 'Patterns', icon: <LayoutTemplate {...icon} /> },
    raster: { label: 'Raster lab', icon: <Grid3x3 {...icon} /> },
    cms: { label: 'CMS test', icon: <Newspaper {...icon} /> },
};

const mainViews: View[] = ['home', 'foundations', 'components', 'patterns'];

/** Where the sidebar sits beside the panel rather than over it. */
const desktop = '(min-width: 1024px)';

type ShellProps = {
    state: AppState;
    onChange: (patch: Partial<AppState>) => void;
    children: ReactNode;
};

/**
 * The playground as a product of its own: the chrome is always Continuum's
 * default look, the page inside it shows whichever theme is being previewed,
 * and the dock at the bottom switches between them.
 */
export const Shell = (props: ShellProps) => (
    <PageIndexProvider>
        <ShellFrame {...props} />
    </PageIndexProvider>
);

const ShellFrame = ({ state, onChange, children }: ShellProps) => {
    const scroller = useRef<HTMLDivElement>(null);
    // Beside the panel it folds away on request; over it, it only opens on request.
    const [docked, setDocked] = useState(true);
    const [overlay, setOverlay] = useState(false);
    const [headerSlot, setHeaderSlot] = useState<HTMLDivElement | null>(null);
    const [dockSlot, setDockSlot] = useState<HTMLDivElement | null>(null);
    const customising = Boolean(state.builder);
    const setCustomising = (open: boolean) => onChange({ builder: open || undefined });
    const custom = !isDefaultTheme(state.theme);
    // Themes are previewed on what they would change: the foundations, the components, the patterns and the CMS test. The rest is Continuum's own.
    const previewable =
        state.view === 'foundations' ||
        state.view === 'components' ||
        state.view === 'patterns' ||
        state.view === 'cms';

    // A new page starts at its top, whether picked here or reached through the hash.
    // biome-ignore lint/correctness/useExhaustiveDependencies: runs on a page change only
    useEffect(() => {
        scroller.current?.scrollTo({ top: 0 });
    }, [state.view, state.component, state.screen]);

    useEffect(() => {
        if (!overlay) return;
        const close = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOverlay(false);
        };
        window.addEventListener('keydown', close);
        return () => window.removeEventListener('keydown', close);
    }, [overlay]);

    const isDesktop = () => window.matchMedia(desktop).matches;
    const show = () => (isDesktop() ? setDocked(true) : setOverlay(true));
    const hide = () => (isDesktop() ? setDocked(false) : setOverlay(false));

    return (
        <AppShell className="h-dvh min-h-0">
            {overlay && (
                <button
                    aria-label="Close sidebar"
                    className="fixed inset-0 z-40 cursor-default bg-neutral-950/20 lg:hidden"
                    onClick={() => setOverlay(false)}
                    type="button"
                />
            )}
            <PlaygroundSidebar
                className={cn(
                    'max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50 max-lg:bg-neutral-100 max-lg:shadow-sheet max-lg:transition-[translate,visibility] max-lg:duration-200 max-lg:ease-out-strong',
                    !overlay && 'max-lg:invisible max-lg:-translate-x-full',
                    !docked && 'lg:hidden',
                )}
                onChange={patch => {
                    onChange(patch);
                    if (patch.view) setOverlay(false);
                }}
                onHide={hide}
                onSection={() => setOverlay(false)}
                state={state}
            />
            <AppPanel className={cn('max-lg:ml-2', !docked && 'lg:ml-2')}>
                <HeaderBar className="justify-start gap-3">
                    <SidebarToggle
                        aria-expanded={overlay}
                        aria-label="Show sidebar"
                        className={cn(docked && 'lg:hidden')}
                        onClick={show}
                    />
                    <Trail scroller={scroller} state={state} />
                    {/* A page that fills the panel puts its own controls here. */}
                    <div className="ml-auto flex shrink-0 items-center gap-4" ref={setHeaderSlot} />
                </HeaderBar>
                <SheetArea className="min-h-0 flex-1 overflow-auto" ref={scroller}>
                    {/* The page previews the theme; the chrome around it stays Continuum's own. */}
                    <Theme
                        className="contents"
                        radius={previewable ? state.radius : 1}
                        theme={custom && previewable ? CUSTOM_THEME : undefined}
                    >
                        <HeaderSlotProvider value={headerSlot}>
                            <DockSlotProvider value={dockSlot}>{children}</DockSlotProvider>
                        </HeaderSlotProvider>
                    </Theme>
                    {previewable && (
                        <ThemeSheet
                            onChange={onChange}
                            onOpenChange={setCustomising}
                            open={customising}
                            state={state}
                        />
                    )}
                </SheetArea>
                {/* The bar at the foot: the page's own index, if it has one, then the theme's pill. */}
                {previewable && !customising && (
                    <BottomBar floating>
                        <div className="contents" ref={setDockSlot} />
                        <ThemePill onOpen={() => setCustomising(true)} state={state} />
                    </BottomBar>
                )}
            </AppPanel>
        </AppShell>
    );
};

/**
 * The theme's pill at the foot of the bar: the previewed theme's own action, its colour, shine
 * and corners, around the theme's icon. It opens the sheet, where a preview is turned on and
 * picked; without one it is the system's own action.
 */
const ThemePill = ({ state, onOpen }: { state: AppState; onOpen: () => void }) => (
    <Theme
        className="contents"
        radius={state.radius}
        theme={isDefaultTheme(state.theme) ? undefined : CUSTOM_THEME}
    >
        <DockAction aria-label="Theme" onClick={onOpen} size="icon">
            <SwatchBook {...icon} />
        </DockAction>
    </Theme>
);

type PlaygroundSidebarProps = Omit<ShellProps, 'children'> & {
    className?: string;
    onHide: () => void;
    /** An entry was picked; the overlay closes so the reader sees it. */
    onSection: () => void;
};

const PlaygroundSidebar = ({
    state,
    onChange,
    onHide,
    onSection,
    className,
}: PlaygroundSidebarProps) => {
    const { sections, active, label, onSelect } = usePageIndex();

    return (
        <Sidebar aria-label="Playground" className={className}>
            <SidebarHeader>
                {/* Inset like a nav row, so the mark sits over the icons and the name over the labels. */}
                <ContinuumLogo className="min-w-0 pl-2.5" size={18} />
                <SidebarToggle aria-label="Hide sidebar" onClick={onHide} />
            </SidebarHeader>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-3">
                <SidebarGroup aria-label="Views">
                    {mainViews.map(view => (
                        <NavItem
                            active={state.view === view}
                            icon={viewMeta[view].icon}
                            key={view}
                            onClick={() => onChange({ view })}
                        >
                            {viewMeta[view].label}
                        </NavItem>
                    ))}
                </SidebarGroup>

                {/* Apart from the system: an experiment that may change or go. It stays with the views, above whatever page is open. */}
                <SidebarGroup aria-label="Lab" label="Lab">
                    <NavItem
                        active={state.view === 'raster'}
                        icon={viewMeta.raster.icon}
                        onClick={() => onChange({ view: 'raster' })}
                        trailing={<Badge tone="primary">Beta</Badge>}
                    >
                        {viewMeta.raster.label}
                    </NavItem>
                    <NavItem
                        active={state.view === 'cms'}
                        icon={viewMeta.cms.icon}
                        onClick={() => onChange({ view: 'cms' })}
                    >
                        {viewMeta.cms.label}
                    </NavItem>
                </SidebarGroup>

                {sections.length > 0 && (
                    <PageIndexNav
                        active={active}
                        label={label ?? 'On this page'}
                        onPick={id => {
                            if (onSelect) onSelect(id);
                            else scrollToSection(id);
                            onSection();
                        }}
                        sections={sections}
                        view={state.view}
                    />
                )}
            </div>

            <SidebarFooter className="pt-3 pr-5 pb-5">
                <div className="flex flex-1 items-center justify-between gap-3 px-2">
                    <span className="text-neutral-600 text-xs">Dark mode</span>
                    <div className="flex items-center gap-2 text-neutral-600">
                        <Sun aria-hidden className="size-4" {...icon} />
                        <Switch
                            aria-label="Dark mode"
                            checked={state.mode === 'dark'}
                            onCheckedChange={checked =>
                                onChange({ mode: checked ? 'dark' : 'light' })
                            }
                        />
                        <Moon aria-hidden className="size-4" {...icon} />
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
};

type PageIndexNavProps = {
    sections: PageIndexEntry[];
    active?: string;
    label: string;
    view: View;
    onPick: (id: string) => void;
};

/**
 * The open page's index. Entries that carry a group sit under their group's label,
 * one block per group; the rest fold under the view's name.
 */
const PageIndexNav = ({ sections, active, label, view, onPick }: PageIndexNavProps) => {
    const groups = sections.reduce<{ label: string; entries: PageIndexEntry[] }[]>(
        (list, entry) => {
            const name = entry.group ?? '';
            const last = list.at(-1);
            if (last && last.label === name) last.entries.push(entry);
            else list.push({ label: name, entries: [entry] });
            return list;
        },
        [],
    );
    const grouped = groups.some(group => group.label);

    if (!grouped) {
        return (
            <SidebarGroup aria-label={label} label={label}>
                <NavGroup
                    defaultOpen
                    icon={viewMeta[view].icon}
                    key={view}
                    label={viewMeta[view].label}
                >
                    {sections.map(section => (
                        <NavItem
                            active={section.id === active}
                            key={section.id}
                            onClick={() => onPick(section.id)}
                            variant="inset"
                        >
                            {section.title}
                        </NavItem>
                    ))}
                </NavGroup>
            </SidebarGroup>
        );
    }

    return (
        <>
            {groups.map(group => (
                <SidebarGroup
                    aria-label={group.label || label}
                    key={group.label}
                    label={group.label || label}
                >
                    {group.entries.map(section => (
                        <NavItem
                            active={section.id === active}
                            key={section.id}
                            onClick={() => onPick(section.id)}
                        >
                            {section.title}
                        </NavItem>
                    ))}
                </SidebarGroup>
            ))}
        </>
    );
};

type TrailProps = {
    state: AppState;
    scroller: RefObject<HTMLDivElement | null>;
};

/** Continuum › view › the entry being read or the page that is open. */
const Trail = ({ state, scroller }: TrailProps) => {
    const { sections, active } = usePageIndex();
    const last = sections.find(entry => entry.id === active)?.title;

    if (state.view === 'home') {
        return (
            <Breadcrumb className="min-w-0">
                <BreadcrumbList className="flex-nowrap">
                    <BreadcrumbItem>
                        <BreadcrumbPage>Continuum</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
        );
    }

    return (
        <Breadcrumb className="min-w-0">
            <BreadcrumbList className="flex-nowrap">
                <BreadcrumbItem className="max-sm:hidden">
                    <BreadcrumbLink
                        href={toHash({
                            ...state,
                            view: 'home',
                            component: undefined,
                            screen: undefined,
                        })}
                    >
                        Continuum
                    </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="max-sm:hidden" />
                <BreadcrumbItem>
                    {last ? (
                        <BreadcrumbLink
                            href={toHash({
                                ...state,
                                component: undefined,
                                screen: undefined,
                            })}
                            onClick={event => {
                                // On a docs page the view's name scrolls back to its top; on a detail page it is the way back.
                                if (state.component || state.screen) return;
                                event.preventDefault();
                                scroller.current?.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                        >
                            {viewMeta[state.view].label}
                        </BreadcrumbLink>
                    ) : (
                        <BreadcrumbPage>{viewMeta[state.view].label}</BreadcrumbPage>
                    )}
                </BreadcrumbItem>
                {last && (
                    <>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem className="min-w-0">
                            <BreadcrumbPage className="truncate">{last}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </>
                )}
            </BreadcrumbList>
        </Breadcrumb>
    );
};
