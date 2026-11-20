'use client';

import { ArticleSection, CodeBlock, column } from '@playground/article';
import { ContinuumLogo } from '@playground/brand';
import { Home } from '@playground/home';
import {
    AsidePanel,
    AsideSlotProvider,
    FooterSlotProvider,
    HeaderSlotProvider,
    OverlayLayer,
    Page,
    PageHeader,
    PageIndexProvider,
} from '@playground/layout';
import type { AppState } from '@playground/meta';
import { ProjectFlow } from '@playground/theme-editor/flow';
import { PreviewPanel } from '@playground/theme-editor/preview';
import { designBrief, exportTheme, tailwindEntry } from '@playground/theme-export';
import {
    AppPanel,
    AppShell,
    Avatar,
    Badge,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    Button,
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    EmptyState,
    Field,
    FieldLabel,
    HeaderBar,
    Input,
    SheetArea,
    Sidebar,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarItem,
    SidebarLevel,
    SidebarSwitcher,
    SidebarSwitcherMark,
    SidebarToggle,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    Theme,
    type ThemeOptions,
} from 'continuum';
import {
    BookOpen,
    ChartLine,
    ChevronRight,
    CircleCheck,
    Copy,
    Download,
    FileUp,
    FolderKanban,
    Grid3x3,
    House,
    LayoutDashboard,
    LayoutGrid,
    LayoutTemplate,
    Paintbrush,
    Palette,
    Plug,
    Plus,
    X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Fragment, type ReactNode, useEffect, useMemo, useState } from 'react';
import manifest from '../../../../../mcp/manifest.json';

/*
 * The app as the film shows it: the playground itself, put together from the parts it is made of,
 * so every pixel on screen is the product. The sidebar, the header bar and the page frame are the
 * library's own (AppShell, Sidebar, HeaderBar); the pages are the playground's (ProjectFlow, the
 * PreviewPanel beside it, Home, the MCP server's article); the two dialogs are drawn with the
 * library's Dialog as the playground draws them, open inside the window rather than over the page.
 *
 * Nothing in it keeps state of its own that the film depends on: the film hands it one `FilmState`
 * per moment, and it draws that moment. Nothing writes to the visitor's storage or clipboard.
 */

const icon = { strokeWidth: 2 } as const;

/** The project's name, through the dialog, the flow, the sidebar and the export. */
export const PROJECT = 'Acme';

/** The ids the film's themes are written under. */
export const THEME_IDS = { app: 'hiw-app', draft: 'hiw-draft' } as const;

export type FilmView = 'projects' | 'project' | 'home' | 'mcp';

export type FilmState = {
    view: FilmView;
    /** No project yet, a draft being themed, or the theme in use across the app. */
    project: 'none' | 'draft' | 'used';
    /** The flow's step: 0 Colour … 4 Review. */
    step: number;
    /** The draft's theme, as the flow and its preview show it. */
    theme: ThemeOptions;
    /** The New project dialog, and how much of the name is typed. */
    creating: boolean;
    name: string;
    /** The Export dialog, and its open tab. */
    exporting: boolean;
    exportTab: 'css' | 'md';
    /** How far the page is scrolled, as a person scrolls a long page down to what they want. */
    scroll: number;
    /** "Acme is in use", in the window's corner. */
    toast: boolean;
};

/* ---------- The sidebar ---------- */

const SidebarNav = ({ state }: { state: FilmState }) => {
    const current = state.project !== 'none';
    const library = [
        { label: 'Foundations', icon: <Palette {...icon} /> },
        { label: 'Components', icon: <LayoutGrid {...icon} /> },
        { label: 'Charts', icon: <ChartLine {...icon} /> },
        { label: 'Patterns', icon: <LayoutTemplate {...icon} /> },
    ];
    return (
        <Sidebar aria-label="Playground">
            <SidebarHeader>
                <ContinuumLogo className="min-w-0 pl-2.5" size={18} />
                <SidebarToggle aria-label="Hide sidebar" />
            </SidebarHeader>

            <SidebarSwitcher
                aria-label="Project"
                detail={
                    state.project === 'used'
                        ? 'Own theme'
                        : state.project === 'draft'
                          ? 'Draft'
                          : 'Start your first'
                }
                mark={
                    <SidebarSwitcherMark
                        color={
                            state.project === 'none'
                                ? undefined
                                : state.project === 'used'
                                  ? 'var(--color-action)'
                                  : '#3939e5'
                        }
                        size={28}
                    >
                        {current ? PROJECT.slice(0, 1) : ''}
                    </SidebarSwitcherMark>
                }
                name={current ? PROJECT : 'No project'}
            >
                {null}
            </SidebarSwitcher>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden pb-3">
                <SidebarLevel from="start">
                    <SidebarGroup aria-label="Home">
                        <SidebarItem active={state.view === 'home'} icon={<House {...icon} />}>
                            Home
                        </SidebarItem>
                    </SidebarGroup>
                    <SidebarGroup
                        aria-label="Project"
                        label={current ? `Project · ${PROJECT}` : 'Project'}
                    >
                        {current ? (
                            <>
                                <SidebarItem
                                    active={state.view === 'project'}
                                    icon={<Paintbrush {...icon} />}
                                >
                                    Theme
                                </SidebarItem>
                                <SidebarItem data-hiw="nav-export" icon={<Download {...icon} />}>
                                    Export
                                </SidebarItem>
                            </>
                        ) : (
                            <SidebarItem icon={<Plus {...icon} />}>New project</SidebarItem>
                        )}
                        <SidebarItem
                            active={state.view === 'projects'}
                            icon={<FolderKanban {...icon} />}
                        >
                            All projects
                        </SidebarItem>
                    </SidebarGroup>
                    <SidebarGroup aria-label="Library" label="Library">
                        {library.map(item => (
                            <SidebarItem
                                icon={item.icon}
                                key={item.label}
                                trailing={<ChevronRight className="text-neutral-500" {...icon} />}
                            >
                                {item.label}
                            </SidebarItem>
                        ))}
                    </SidebarGroup>
                    <SidebarGroup aria-label="Install" label="Install">
                        <SidebarItem icon={<BookOpen {...icon} />}>Skills</SidebarItem>
                        <SidebarItem
                            active={state.view === 'mcp'}
                            data-hiw="nav-mcp"
                            icon={<Plug {...icon} />}
                        >
                            MCP server
                        </SidebarItem>
                    </SidebarGroup>
                    <SidebarGroup aria-label="Lab" label="Lab">
                        <SidebarItem
                            icon={<Grid3x3 {...icon} />}
                            trailing={<Badge tone="primary">Beta</Badge>}
                        >
                            Raster lab
                        </SidebarItem>
                        <SidebarItem icon={<LayoutDashboard {...icon} />}>Wall</SidebarItem>
                    </SidebarGroup>
                </SidebarLevel>
            </div>

            <SidebarFooter className="pt-3 pr-3 pb-5">
                <SidebarSwitcher
                    aria-label="Account"
                    detail="Personal workspace"
                    mark={<Avatar fallback="JV" />}
                    name="Joan Verhulst"
                    placement="footer"
                >
                    {null}
                </SidebarSwitcher>
            </SidebarFooter>
        </Sidebar>
    );
};

/** The header bar's trail: where the page is. */
const Trail = ({ state }: { state: FilmState }) => {
    const pages: Record<FilmView, string[]> = {
        home: [],
        projects: ['Projects'],
        project: ['Projects', PROJECT],
        mcp: ['MCP server'],
    };
    const trail = ['Continuum', ...pages[state.view]];
    return (
        <Breadcrumb>
            <BreadcrumbList>
                {trail.map((item, index) => (
                    <Fragment key={item}>
                        {index > 0 && <BreadcrumbSeparator />}
                        <BreadcrumbItem>
                            {index === trail.length - 1 ? (
                                <BreadcrumbPage>{item}</BreadcrumbPage>
                            ) : (
                                <BreadcrumbLink href="#">{item}</BreadcrumbLink>
                            )}
                        </BreadcrumbItem>
                    </Fragment>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    );
};

/* ---------- The pages ---------- */

const ProjectsPage = () => (
    <Page>
        <div data-hiw="page-head">
            <PageHeader
                aside={
                    <Button data-hiw="new-project">
                        <Plus {...icon} />
                        New project
                    </Button>
                }
                description="A product and the theme it is built in: its primary, neutral and chart colours, the character of its controls and its sizes. Each takes its app.css and DESIGN.md to the project."
                title="Projects"
            />
        </div>
        <EmptyState
            action={<Button variant="secondary">New project</Button>}
            description="Name it, then build its theme in six steps. Projects are kept in this browser."
            icon={<FolderKanban {...icon} />}
            title="No projects yet"
        />
    </Page>
);

/** One project's theme: the flow's steps, the preview in the panel beside them. */
const ProjectPage = ({ state }: { state: FilmState }) => (
    <Page width="narrow">
        {/* The page's own gap, so the flow's head, stepper and step keep their room as on the page. */}
        <div className="flex flex-col gap-14" data-hiw="flow">
            <ProjectFlow
                dirty={false}
                inUse={state.project === 'used'}
                // Opened at the film's step, as a project opens where it was left.
                key={state.step}
                name={PROJECT}
                onExport={() => {}}
                onProgress={() => {}}
                onSave={() => {}}
                onUse={() => {}}
                progress={state.step}
                set={() => {}}
                theme={state.theme}
                used={state.project === 'used'}
            />
        </div>
        <AsidePanel aria-label="Preview">
            <PreviewPanel
                mode="dark"
                onModeChange={() => {}}
                theme={state.theme}
                themeId={THEME_IDS.draft}
            />
        </AsidePanel>
    </Page>
);

const HOME_STATE = { mode: 'dark', view: 'home' } as AppState;

const INSTALL = [
    {
        title: 'Clone and install',
        text: 'Anywhere on the machine; the server runs from this clone.',
        code: 'git clone git@github.com:joan-verhulst/continuum.git\ncd continuum\npnpm install',
    },
    {
        title: 'Install the skills and the server',
        text: 'Copies the skills to ~/.claude/skills and registers the server with Claude Code for every project.',
        code: 'pnpm install:skill',
    },
    {
        title: 'Check it is connected',
        text: 'In any project, continuum is listed as connected.',
        code: 'claude mcp list',
    },
];

/** The MCP server's page, as the playground's: the same head, steps and blocks. */
const McpPage = () => (
    <Page className="gap-0">
        <div className={column}>
            <PageHeader
                description="Continuum for any agent, in any editor: the system's parts, values and maths as tools, and an audit that says what to fix in UI that already exists."
                title="MCP server"
            />
        </div>
        <ArticleSection
            description="Once per machine, from a clone of the repo."
            id="hiw-mcp-setup"
            title="Set it up"
        >
            <ol className={`${column} flex flex-col gap-10`}>
                {INSTALL.map((step, index) => (
                    <li
                        className="flex min-w-0 flex-col gap-3"
                        data-hiw={index === 1 ? 'install' : undefined}
                        key={step.title}
                    >
                        <div className="flex flex-col gap-1">
                            <span className="font-medium text-base text-neutral-950">
                                {index + 1}. {step.title}
                            </span>
                            <span className="text-base text-neutral-700 leading-relaxed">
                                {step.text}
                            </span>
                        </div>
                        <CodeBlock code={step.code} />
                    </li>
                ))}
            </ol>
        </ArticleSection>
        <ArticleSection
            description={`${manifest.tools.length} tools, all of them reading: the agent makes the edits.`}
            id="hiw-mcp-tools"
            title="What it offers"
        >
            <ul
                className={`${column} flex flex-col overflow-hidden rounded-card border border-neutral-200 bg-neutral-50`}
            >
                {manifest.tools.slice(0, 6).map(tool => (
                    <li
                        className="flex min-w-0 flex-col gap-1 border-neutral-200 border-b px-5 py-4 last:border-b-0"
                        key={tool.name}
                    >
                        <span className="font-medium font-mono text-neutral-950 text-sm">
                            {tool.name}
                        </span>
                    </li>
                ))}
            </ul>
        </ArticleSection>
    </Page>
);

/* ---------- The dialogs ---------- */

/** The open dialogs' shared props: drawn inside the window, never taking the page's focus or scroll. */
const held = { modal: false } as const;
const content = { initialFocus: false, finalFocus: false } as const;

const NewProjectDialog = ({ open, name }: { open: boolean; name: string }) => (
    <Dialog {...held} open={open}>
        <DialogContent {...content} className="w-[480px]" data-hiw="dialog">
            <DialogHeader>
                <DialogTitle>New project</DialogTitle>
            </DialogHeader>
            <DialogBody>
                <DialogDescription>
                    A name for the product. Its theme starts clear: the steps after this build it,
                    from your primary colour on.
                </DialogDescription>
                <Field>
                    <FieldLabel>Name</FieldLabel>
                    <Input
                        data-hiw="name"
                        placeholder="Untitled project"
                        readOnly
                        tabIndex={-1}
                        value={name}
                    />
                </Field>
                <div className="flex items-center gap-3 rounded-item border border-neutral-200 py-1.5 pr-1.5 pl-3 text-xs">
                    <span className="min-w-0 flex-1 truncate text-neutral-600">
                        Starts from Continuum’s defaults
                    </span>
                    <Button tabIndex={-1} variant="ghost">
                        <FileUp {...icon} />
                        Import a theme
                    </Button>
                </div>
            </DialogBody>
            <DialogFooter>
                <Button tabIndex={-1} variant="secondary">
                    Cancel
                </Button>
                <Button data-hiw="create" tabIndex={-1}>
                    Create project
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);

/** Export the theme, as the project page's: app.css and DESIGN.md, written from the theme. */
const ExportDialog = ({
    open,
    tab,
    theme,
}: {
    open: boolean;
    tab: 'css' | 'md';
    theme: ThemeOptions;
}) => {
    // Written once per theme: the export is the real one, the film only shows it.
    const key = JSON.stringify(theme);
    // biome-ignore lint/correctness/useExhaustiveDependencies: the theme is read through its key.
    const files = useMemo(() => {
        const exported = exportTheme(theme, PROJECT, 'dark');
        return [
            {
                id: 'css',
                name: 'app.css',
                text: tailwindEntry(exported),
                note: "The whole theme in Tailwind's names, as the entry in src/: colours, type, radii, shadows, spacing and widths.",
            },
            {
                id: 'md',
                name: 'DESIGN.md',
                text: designBrief(exported),
                note: 'For Claude, at the project’s root. A line @DESIGN.md in CLAUDE.md has every session start from it.',
            },
        ];
    }, [key]);
    return (
        <Dialog {...held} open={open}>
            <DialogContent {...content} className="w-[680px]" data-hiw="export">
                <DialogHeader>
                    <DialogTitle>Export the theme</DialogTitle>
                </DialogHeader>
                <DialogBody>
                    <DialogDescription>
                        Save both files in a project and ask Claude to set it up from DESIGN.md: it
                        says where the library comes from, what to install and how to keep the look.
                    </DialogDescription>
                    <Tabs value={tab}>
                        <div className="flex items-center justify-between gap-3">
                            <TabsList variant="pill">
                                {files.map(file => (
                                    <TabsTrigger
                                        data-hiw={`tab-${file.id}`}
                                        key={file.id}
                                        tabIndex={-1}
                                        value={file.id}
                                    >
                                        {file.name}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            <div className="flex items-center gap-2">
                                <Button tabIndex={-1} variant="secondary">
                                    <Download {...icon} />
                                    Download
                                </Button>
                                <Button tabIndex={-1} variant="secondary">
                                    <Copy {...icon} />
                                    Copy
                                </Button>
                            </div>
                        </div>
                        {files.map(file => (
                            <TabsContent
                                className="flex flex-col gap-3"
                                key={file.id}
                                value={file.id}
                            >
                                <p className="text-neutral-600 text-xs">{file.note}</p>
                                <pre className="wrap-break-word h-[340px] overflow-hidden whitespace-pre-wrap rounded-item border border-neutral-200 bg-neutral-950/3 p-4 font-mono text-neutral-800 text-xxs">
                                    {file.text}
                                </pre>
                            </TabsContent>
                        ))}
                    </Tabs>
                </DialogBody>
                <DialogFooter>
                    <Button data-hiw="export-done" tabIndex={-1} variant="secondary">
                        Done
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

/** The toast the app raises when a theme is first used, in the window's corner. */
const InUseToast = ({ shown }: { shown: boolean }) => (
    <motion.div
        animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        className="absolute right-4 bottom-4 z-50 flex w-toast items-start gap-3 rounded-card border border-neutral-200 bg-neutral-50 p-4"
        initial={false}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
        <CircleCheck className="mt-px size-4 shrink-0 text-success-600" {...icon} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="font-medium text-neutral-950 text-sm">{PROJECT} is in use</span>
            <span className="text-neutral-600 text-xs">
                Every page of the playground wears its theme now.
            </span>
        </div>
        <X className="size-4 shrink-0 text-neutral-500" {...icon} />
    </motion.div>
);

/* ---------- The app ---------- */

/**
 * The playground at one moment of the film, filling its window. It wears the app's theme (the
 * default, then Acme's once it is used); the draft's preview wears the draft.
 */
export const FilmApp = ({ state }: { state: FilmState }) => {
    const [headerSlot, setHeaderSlot] = useState<HTMLDivElement | null>(null);
    const [asideSlot, setAsideSlot] = useState<HTMLDivElement | null>(null);
    const [footerSlot, setFooterSlot] = useState<HTMLDivElement | null>(null);
    const [sheet, setSheet] = useState<HTMLDivElement | null>(null);

    // The page scrolls as a person scrolls it: smoothly, to where the film wants it.
    useEffect(() => {
        sheet?.scrollTo({ top: state.scroll, behavior: state.scroll ? 'smooth' : 'instant' });
    }, [sheet, state.scroll]);

    let page: ReactNode;
    if (state.view === 'projects') page = <ProjectsPage />;
    else if (state.view === 'project') page = <ProjectPage state={state} />;
    else if (state.view === 'home') page = <Home onChange={() => {}} state={HOME_STATE} />;
    else page = <McpPage />;

    return (
        <Theme className="relative size-full" mode="dark" theme={THEME_IDS.app}>
            <OverlayLayer>
                <PageIndexProvider>
                    <AppShell className="size-full min-h-0">
                        <SidebarNav state={state} />
                        <AppPanel>
                            <HeaderBar className="justify-start gap-3" sidebarToggle={false}>
                                <Trail state={state} />
                                <div
                                    className="ml-auto flex shrink-0 items-center gap-4"
                                    ref={setHeaderSlot}
                                />
                            </HeaderBar>
                            <SheetArea className="min-h-0 flex-1 overflow-hidden" ref={setSheet}>
                                <HeaderSlotProvider value={headerSlot}>
                                    <AsideSlotProvider value={asideSlot}>
                                        <FooterSlotProvider value={footerSlot}>
                                            {page}
                                        </FooterSlotProvider>
                                    </AsideSlotProvider>
                                </HeaderSlotProvider>
                            </SheetArea>
                            <div className="contents" data-hiw="foot" ref={setFooterSlot} />
                        </AppPanel>
                        <div className="contents" ref={setAsideSlot} />
                    </AppShell>
                </PageIndexProvider>
                <NewProjectDialog name={state.name} open={state.creating} />
                {state.project !== 'none' && (
                    <ExportDialog
                        open={state.exporting}
                        tab={state.exportTab}
                        theme={state.theme}
                    />
                )}
            </OverlayLayer>
            <InUseToast shown={state.toast} />
        </Theme>
    );
};
