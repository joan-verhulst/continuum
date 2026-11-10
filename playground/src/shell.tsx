import {
    AppPanel,
    AppShell,
    Avatar,
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
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    HeaderBar,
    Input,
    Kbd,
    NavGroup,
    NavItem,
    SheetArea,
    Sidebar,
    SidebarBack,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarLevel,
    SidebarLevelHead,
    SidebarSwitcher,
    SidebarToggle,
    type ThemeMode,
    useToast,
} from 'continuum';
import {
    ChevronRight,
    Download,
    FolderKanban,
    Grid3x3,
    House,
    LayoutGrid,
    LayoutTemplate,
    LogOut,
    Moon,
    Paintbrush,
    Palette,
    Plus,
    Search,
    Settings,
    Sun,
    SwatchBook,
} from 'lucide-react';
import { type ReactNode, type RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
    AsideSlotProvider,
    DockSlotProvider,
    FooterSlotProvider,
    HeaderSlotProvider,
    type PageIndexEntry,
    PageIndexProvider,
    scrollToSection,
    usePageIndex,
} from './layout';
import { type AppState, toHash, type View } from './meta';
import { ProjectSwitcher } from './project-switcher';
import { useProjects } from './projects';
import { entries } from './showcase/entries';

const icon = { strokeWidth: 2 } as const;

const viewMeta: Record<View, { label: string; icon: ReactNode }> = {
    home: { label: 'Continuum', icon: <House {...icon} /> },
    foundations: { label: 'Foundations', icon: <Palette {...icon} /> },
    components: { label: 'Components', icon: <LayoutGrid {...icon} /> },
    patterns: { label: 'Patterns', icon: <LayoutTemplate {...icon} /> },
    projects: { label: 'Projects', icon: <SwatchBook {...icon} /> },
    raster: { label: 'Raster lab', icon: <Grid3x3 {...icon} /> },
};

/** Where the sidebar sits beside the panel rather than over it. */
const desktop = '(min-width: 1024px)';
const isDesktop = () => window.matchMedia(desktop).matches;

/** The shortcut as the reader's keyboard writes it. */
const searchKey = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
    ? '⌘K'
    : 'Ctrl K';

/** Whether a component is what the search is after, by its name or what it is for. */
const findsEntry = (query: string, entry: { name: string; description: string }) =>
    entry.name.toLowerCase().includes(query) || entry.description.toLowerCase().includes(query);

type ShellProps = {
    state: AppState;
    onChange: (patch: Partial<AppState>) => void;
    children: ReactNode;
};

/**
 * The playground as a product of its own, in the current project's theme once
 * that is used: the chrome, the pages and the screens on them alike.
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
    const [asideSlot, setAsideSlot] = useState<HTMLDivElement | null>(null);
    const [footerSlot, setFooterSlot] = useState<HTMLDivElement | null>(null);
    // A view with an index opens the sidebar on that index; its back button leaves it for the
    // top level, which holds until another view opens.
    const [backFrom, setBackFrom] = useState<View>();
    // The docs pages keep their index in the dock; a project's page has its own bar at the foot.
    const hasDock =
        state.view === 'foundations' || state.view === 'components' || state.view === 'patterns';

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

    const show = () => (isDesktop() ? setDocked(true) : setOverlay(true));
    const hide = () => (isDesktop() ? setDocked(false) : setOverlay(false));

    // ⌘K or Ctrl+K, from anywhere, goes to the components search: the sidebar comes back if it is
    // away, and another view gives way to Components, where the search lives.
    const search = useRef<HTMLInputElement>(null);
    const latest = useRef({ view: state.view, onChange });
    latest.current = { view: state.view, onChange };
    useEffect(() => {
        const focusSearch = (event: KeyboardEvent) => {
            if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
            if (event.key.toLowerCase() !== 'k') return;
            event.preventDefault();
            flushSync(() => {
                if (isDesktop()) setDocked(true);
                else setOverlay(true);
                setBackFrom(undefined);
                if (latest.current.view !== 'components') {
                    latest.current.onChange({ view: 'components', component: undefined });
                }
            });
            search.current?.focus();
            search.current?.select();
        };
        window.addEventListener('keydown', focusSearch);
        return () => window.removeEventListener('keydown', focusSearch);
    }, []);

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
                onLevel={setBackFrom}
                atTop={backFrom === state.view}
                // Typing keeps the overlay open, even when it brings the Components view up behind it.
                onSearch={onChange}
                onSection={() => setOverlay(false)}
                searchRef={search}
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
                    <HeaderSlotProvider value={headerSlot}>
                        <DockSlotProvider value={dockSlot}>
                            <AsideSlotProvider value={asideSlot}>
                                <FooterSlotProvider value={footerSlot}>
                                    {children}
                                </FooterSlotProvider>
                            </AsideSlotProvider>
                        </DockSlotProvider>
                    </HeaderSlotProvider>
                </SheetArea>
                {/* A page's own bar at the foot: a project's Back and Continue. */}
                <div className="contents" ref={setFooterSlot} />
                {/* The bar at the foot holds the page's own index, if it has one. */}
                {hasDock && (
                    <BottomBar className="max-w-[calc(100%-3rem)]" floating>
                        <div className="contents" ref={setDockSlot} />
                    </BottomBar>
                )}
            </AppPanel>
            {/* A page's own second panel, beside the main one (a project's preview). */}
            <div className="contents" ref={setAsideSlot} />
        </AppShell>
    );
};

type PlaygroundSidebarProps = Omit<ShellProps, 'children'> & {
    className?: string;
    onHide: () => void;
    /** An entry was picked; the overlay closes so the reader sees it. */
    onSection: () => void;
    /** The search changed; unlike `onChange`, it leaves the overlay open. */
    onSearch: (patch: Partial<AppState>) => void;
    searchRef: RefObject<HTMLInputElement | null>;
    /** The reader went back from this view's index to the top level; none to show the index again. */
    onLevel: (view: View | undefined) => void;
    /** The top level shows although the open view has an index. */
    atTop: boolean;
};

const libraryViews: View[] = ['foundations', 'components', 'patterns'];

/** The views with an index of their own, which the sidebar drills into. */
const indexed = new Set<View>(libraryViews);

const PlaygroundSidebar = ({
    state,
    onChange,
    onHide,
    onSection,
    onSearch,
    searchRef,
    onLevel,
    atTop,
    className,
}: PlaygroundSidebarProps) => {
    const drilled = indexed.has(state.view) && !atTop;
    const { sections, active, label, onSelect } = usePageIndex();
    const { projects } = useProjects();
    const current = projects.find(project => project.id === state.current);
    const projectOpen =
        state.view === 'projects' && projects.some(project => project.id === state.project);

    // The search narrows the Components list in the page index, by name or what a component is for.
    const query = state.search ?? '';
    const q = query.trim().toLowerCase();
    const found = useMemo(
        () => (q ? entries.filter(entry => findsEntry(q, entry)) : undefined),
        [q],
    );
    const filtering = state.view === 'components' && found !== undefined;
    const shown = filtering
        ? sections.filter(section => found.some(entry => entry.id === section.id))
        : sections;

    return (
        <Sidebar aria-label="Playground" className={className}>
            <SidebarHeader>
                {/* Inset like a nav row, so the mark sits over the icons and the name over the labels. */}
                <ContinuumLogo className="min-w-0 pl-2.5" size={18} />
                <SidebarToggle aria-label="Hide sidebar" onClick={onHide} />
            </SidebarHeader>

            {/* The current project, as a product's site switcher: the Project group works on it. */}
            <ProjectSwitcher onChange={onChange} state={state} />

            {/*
             * Two levels: the top level's places, or the open view's index under its back row. The
             * index has the sidebar's whole height, so a long list (every component) shows whole.
             */}
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-3">
                {drilled ? (
                    <SidebarLevel key={`index-${state.view}`}>
                        {/* The back row and the search stay put while the list scrolls under them. */}
                        <SidebarLevelHead>
                            <SidebarBack
                                backLabel="Back to the menu"
                                onClick={() => onLevel(state.view)}
                            >
                                {viewMeta[state.view].label}
                            </SidebarBack>

                            {/* 9 inside the hairline makes a nav row's 10, so its icon sits over the nav icons. */}
                            {state.view === 'components' && (
                                <Input
                                    aria-keyshortcuts="Meta+K Control+K"
                                    aria-label="Search components"
                                    className="pr-2 pl-2.25"
                                    leadingIcon={<Search {...icon} />}
                                    onChange={event => onSearch({ search: event.target.value })}
                                    onKeyDown={event => {
                                        if (event.nativeEvent.isComposing) return;
                                        if (event.key === 'Enter') {
                                            const first = filtering ? shown[0]?.id : undefined;
                                            if (!first) return;
                                            event.preventDefault();
                                            onChange({ view: 'components', component: first });
                                        } else if (event.key === 'Escape') {
                                            // The first Escape clears the query; the next leaves the field.
                                            if (query) {
                                                event.preventDefault();
                                                event.stopPropagation();
                                                onSearch({ search: '' });
                                            } else {
                                                event.currentTarget.blur();
                                            }
                                        }
                                    }}
                                    placeholder="Search components"
                                    ref={searchRef}
                                    size="sm"
                                    trailing={<Kbd aria-hidden>{searchKey}</Kbd>}
                                    value={query}
                                />
                            )}
                        </SidebarLevelHead>

                        {shown.length > 0 ? (
                            <PageIndexNav
                                active={active}
                                label={label ?? 'On this page'}
                                onPick={id => {
                                    if (onSelect) onSelect(id);
                                    else scrollToSection(id);
                                    onSection();
                                }}
                                sections={shown}
                                view={state.view}
                            />
                        ) : (
                            filtering && (
                                <p className="px-4.5 py-2 text-neutral-600 text-xs">
                                    No components match
                                </p>
                            )
                        )}
                    </SidebarLevel>
                ) : (
                    <SidebarLevel from="start" key="top">
                        <SidebarGroup aria-label="Home">
                            <NavItem
                                active={state.view === 'home'}
                                icon={viewMeta.home.icon}
                                onClick={() => onChange({ view: 'home' })}
                            >
                                Home
                            </NavItem>
                        </SidebarGroup>

                        {/* The current project's places; with none, the way to one. */}
                        <SidebarGroup
                            aria-label="Project"
                            // A long project name ends in an ellipsis rather than wrapping the label.
                            label={
                                current ? (
                                    <span className="block truncate">Project · {current.name}</span>
                                ) : (
                                    'Project'
                                )
                            }
                        >
                            {current ? (
                                <>
                                    <NavItem
                                        active={projectOpen}
                                        icon={<Paintbrush {...icon} />}
                                        onClick={() =>
                                            onChange({ view: 'projects', project: current.id })
                                        }
                                    >
                                        Theme
                                    </NavItem>
                                    {/* An action on the project's page: it opens its export, and never stays selected. */}
                                    <NavItem
                                        icon={<Download {...icon} />}
                                        onClick={() =>
                                            onChange({
                                                view: 'projects',
                                                project: current.id,
                                                exporting: true,
                                            })
                                        }
                                    >
                                        Export
                                    </NavItem>
                                </>
                            ) : (
                                <NavItem
                                    icon={<Plus {...icon} />}
                                    onClick={() =>
                                        onChange({
                                            view: 'projects',
                                            project: undefined,
                                            creating: true,
                                        })
                                    }
                                >
                                    New project
                                </NavItem>
                            )}
                            <NavItem
                                active={state.view === 'projects' && !projectOpen}
                                icon={<FolderKanban {...icon} />}
                                onClick={() => onChange({ view: 'projects', project: undefined })}
                            >
                                All projects
                            </NavItem>
                        </SidebarGroup>

                        {/* Each opens its view and drills into its index; the chevron says so. */}
                        <SidebarGroup aria-label="Library" label="Library">
                            {libraryViews.map(view => (
                                <NavItem
                                    active={state.view === view}
                                    icon={viewMeta[view].icon}
                                    key={view}
                                    onClick={() => {
                                        onLevel(undefined);
                                        onChange({ view });
                                    }}
                                    trailing={
                                        <ChevronRight className="text-neutral-500" {...icon} />
                                    }
                                >
                                    {viewMeta[view].label}
                                </NavItem>
                            ))}
                        </SidebarGroup>

                        {/* Apart from the system: an experiment that may change or go, at the end. */}
                        <SidebarGroup aria-label="Lab" label="Lab">
                            <NavItem
                                active={state.view === 'raster'}
                                icon={viewMeta.raster.icon}
                                onClick={() => onChange({ view: 'raster' })}
                                trailing={<Badge tone="primary">Beta</Badge>}
                            >
                                {viewMeta.raster.label}
                            </NavItem>
                        </SidebarGroup>
                    </SidebarLevel>
                )}
            </div>

            <SidebarFooter className="pt-3 pr-3 pb-5">
                <AccountSwitcher mode={state.mode} onChange={onChange} />
            </SidebarFooter>
        </Sidebar>
    );
};

/**
 * Who is signed in, as a product's account menu: a demo, since the playground has no accounts.
 * Its one working row is the appearance, the playground's light or dark.
 */
const AccountSwitcher = ({
    mode,
    onChange,
}: {
    mode: ThemeMode;
    onChange: (patch: Partial<AppState>) => void;
}) => {
    const toast = useToast();
    const notYet = () =>
        toast.add({
            title: 'Accounts are coming',
            description: 'The playground has no sign-in yet: projects are kept in this browser.',
        });

    return (
        <SidebarSwitcher
            aria-label="Joan Verhulst. Account"
            detail="Free plan"
            mark={<Avatar fallback="JV" />}
            name="Joan Verhulst"
            placement="footer"
        >
            <DropdownMenuItem onClick={notYet}>
                <Settings {...icon} />
                Account settings
            </DropdownMenuItem>
            <DropdownMenuRadioGroup
                onValueChange={value => onChange({ mode: value === 'dark' ? 'dark' : 'light' })}
                value={mode}
            >
                <DropdownMenuLabel>Appearance</DropdownMenuLabel>
                <DropdownMenuRadioItem icon={<Sun {...icon} />} value="light">
                    Light
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem icon={<Moon {...icon} />} value="dark">
                    Dark
                </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={notYet}>
                <LogOut {...icon} />
                Sign out
            </DropdownMenuItem>
        </SidebarSwitcher>
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
                    // How many sit in the group, at the label's end: what a search leaves, while it narrows.
                    label={
                        <span className="flex items-center justify-between gap-2">
                            <span className="min-w-0 truncate">{group.label || label}</span>
                            <span className="shrink-0 tabular-nums">{group.entries.length}</span>
                        </span>
                    }
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
    const { projects } = useProjects();
    // A project's page names the project; a docs page names the section being read.
    const project =
        state.view === 'projects' && state.project
            ? projects.find(item => item.id === state.project)?.name
            : undefined;
    const last = project ?? sections.find(entry => entry.id === active)?.title;

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
                            project: undefined,
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
                                project: undefined,
                            })}
                            onClick={event => {
                                // On a docs page the view's name scrolls back to its top; on a detail page it is the way back.
                                if (state.component || state.screen || state.project) return;
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
