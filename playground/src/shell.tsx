import {
    AppPanel,
    AppShell,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    cn,
    HeaderBar,
    NavGroup,
    NavItem,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Sidebar,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarLogo,
    SidebarToggle,
    Switch,
    themes,
} from 'continuum';
import { AppWindow, Blocks, Grid3x3, Moon, Palette, Shapes, Sun } from 'lucide-react';
import { type ReactNode, type RefObject, useEffect, useRef, useState } from 'react';
import { PageIndexProvider, scrollToSection, usePageIndex } from './layout';
import { type AppState, themeMeta, toHash, type View, views } from './meta';
import { screens } from './screens';

const icon = { strokeWidth: 1.5 } as const;

const viewMeta: Record<View, { label: string; icon: ReactNode }> = {
    foundations: { label: 'Foundations', icon: <Palette {...icon} /> },
    components: { label: 'Components', icon: <Blocks {...icon} /> },
    screens: { label: 'Screens', icon: <AppWindow {...icon} /> },
    raster: { label: 'Raster', icon: <Grid3x3 {...icon} /> },
};

/** Where the sidebar sits beside the panel rather than over it. */
const desktop = '(min-width: 1024px)';

type ShellProps = {
    state: AppState;
    onChange: (patch: Partial<AppState>) => void;
    children: ReactNode;
};

/**
 * The playground as one of the products: the Continuum sidebar on the canvas,
 * the current view on an inset panel that scrolls under its header bar.
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

    // A new view starts at its top, whether picked here or reached through the hash.
    // biome-ignore lint/correctness/useExhaustiveDependencies: runs on a view change only
    useEffect(() => {
        scroller.current?.scrollTo({ top: 0 });
    }, [state.view]);

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
                </HeaderBar>
                <div className="min-h-0 flex-1 overflow-auto" ref={scroller}>
                    {children}
                </div>
            </AppPanel>
        </AppShell>
    );
};

type PlaygroundSidebarProps = Omit<ShellProps, 'children'> & {
    className?: string;
    onHide: () => void;
    /** A section was picked; the overlay closes so the reader sees it. */
    onSection: () => void;
};

const PlaygroundSidebar = ({
    state,
    onChange,
    onHide,
    onSection,
    className,
}: PlaygroundSidebarProps) => {
    const { sections, active } = usePageIndex();
    const meta = themeMeta[state.theme];

    return (
        <Sidebar aria-label="Playground" className={className}>
            <SidebarHeader>
                <div className="flex min-w-0 items-center gap-1">
                    <SidebarLogo>
                        <Shapes {...icon} />
                    </SidebarLogo>
                    <span className="truncate font-medium text-neutral-950 text-sm">Continuum</span>
                </div>
                <SidebarToggle aria-label="Hide sidebar" onClick={onHide} />
            </SidebarHeader>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-3">
                <SidebarGroup aria-label="Views" divided>
                    {views.map(view => (
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

                {sections.length > 0 && (
                    <SidebarGroup aria-label="On this page" label="On this page">
                        <NavGroup
                            defaultOpen
                            icon={viewMeta[state.view].icon}
                            key={state.view}
                            label={viewMeta[state.view].label}
                        >
                            {sections.map(section => (
                                <NavItem
                                    active={section.id === active}
                                    key={section.id}
                                    onClick={() => {
                                        scrollToSection(section.id);
                                        onSection();
                                    }}
                                    variant="inset"
                                >
                                    {section.title}
                                </NavItem>
                            ))}
                        </NavGroup>
                    </SidebarGroup>
                )}
            </div>

            <SidebarFooter className="flex-col items-stretch gap-3 pt-3 pr-3 pb-4">
                <Select
                    onValueChange={value => {
                        const theme = themes.find(name => name === value);
                        if (theme) onChange({ theme, mode: themeMeta[theme].mode });
                    }}
                    value={state.theme}
                >
                    <SelectTrigger aria-label={`Theme, ${meta.name} ${meta.year}`} size="sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="start" className="w-72" side="top">
                        {themes.map(theme => (
                            <SelectItem key={theme} value={theme}>
                                <span className="text-neutral-950">{themeMeta[theme].name}</span>{' '}
                                <span className="font-normal text-neutral-500">
                                    {themeMeta[theme].year}
                                </span>
                                {/* The trigger shows the item text too; the product only fits the list. */}
                                <span className="in-data-[slot=select-trigger]:hidden font-normal text-neutral-500">
                                    {' '}
                                    · {themeMeta[theme].product}
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="flex items-center justify-between gap-3 px-2">
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

type TrailProps = {
    state: AppState;
    scroller: RefObject<HTMLDivElement | null>;
};

/** Continuum › view › the section being read, or the screen on show. */
const Trail = ({ state, scroller }: TrailProps) => {
    const { sections, active } = usePageIndex();
    const section = sections.find(entry => entry.id === active);
    const screen =
        state.view === 'screens'
            ? (screens.find(entry => entry.id === state.screen) ?? screens[0])
            : undefined;
    const last = section?.title ?? screen?.title;

    return (
        <Breadcrumb className="min-w-0">
            <BreadcrumbList className="flex-nowrap">
                <BreadcrumbItem className="max-sm:hidden">
                    <BreadcrumbLink
                        href={toHash({ ...state, view: 'foundations', screen: undefined })}
                    >
                        Continuum
                    </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="max-sm:hidden" />
                <BreadcrumbItem>
                    {last ? (
                        <BreadcrumbLink
                            href={toHash(state)}
                            onClick={event => {
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
