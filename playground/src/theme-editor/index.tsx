import {
    Badge,
    Button,
    cn,
    createThemeCss,
    Dialog,
    DialogBody,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    EmptyState,
    Field,
    FieldLabel,
    focusRing,
    Input,
    Notice,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    type ThemeMode,
    type ThemeOptions,
    themeFontFamilies,
    useNotice,
    useToast,
} from 'continuum';
import { Copy, Ellipsis, FolderKanban, Pencil, Plus, Trash2 } from 'lucide-react';
import { type FormEvent, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { AsidePanel, HeaderActions, Page, PageHeader } from '../layout';
import { useLeaveGuard } from '../leave-guard';
import type { AppState } from '../meta';
import { matchPreset, presetSwatch } from '../presets';
import { type Project, projectThemeId, sameTheme, useProjects } from '../projects';
import { ProjectFlow } from './flow';
import { ExportDialog } from './parts';
import { PreviewPanel } from './preview';

const icon = { strokeWidth: 2 } as const;

type Store = ReturnType<typeof useProjects>;

type ProjectsProps = {
    state: AppState;
    onChange: (patch: Partial<AppState>) => void;
};

/** Projects: the list, or the open project's settings. A link to one this browser does not have lands on the list. */
export const Projects = ({ state, onChange }: ProjectsProps) => {
    const store = useProjects();
    const open = state.project
        ? store.projects.find(project => project.id === state.project)
        : undefined;

    if (open) {
        return (
            <ProjectPage
                key={open.id}
                onChange={onChange}
                project={open}
                state={state}
                store={store}
            />
        );
    }
    return (
        <ProjectList
            creating={state.creating}
            current={state.current}
            onAsked={() => onChange({ creating: undefined })}
            onDeleted={id => {
                // The playground moves on to the latest project with a used theme, and wears it;
                // with none, it goes back to Continuum's own.
                if (id !== state.current) return;
                const next = store.projects.find(project => project.id !== id && project.applied);
                onChange({ current: next?.id, project: undefined });
            }}
            onOpen={id => onChange({ project: id })}
            store={store}
        />
    );
};

/* ---------- The list ---------- */

const ago = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

const updatedAgo = (time: number) => {
    const minutes = Math.round((time - Date.now()) / 60_000);
    if (Math.abs(minutes) < 60) return ago.format(minutes, 'minute');
    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) return ago.format(hours, 'hour');
    return ago.format(Math.round(hours / 24), 'day');
};

/** What a theme is in a word: the preset it still matches, the default, or its own. */
const themeName = (theme: ThemeOptions) => {
    const preset = matchPreset(theme);
    if (preset) return preset.label;
    return Object.keys(theme).length === 0 ? 'Default' : 'Custom';
};

const fontName = (theme: ThemeOptions) =>
    theme.font && theme.font in themeFontFamilies
        ? themeFontFamilies[theme.font as keyof typeof themeFontFamilies].family
        : (theme.font ?? 'Geist');

const ProjectMenu = ({
    onRename,
    onDuplicate,
    onDelete,
    name,
}: {
    onRename: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    name: string;
}) => (
    <DropdownMenu>
        <DropdownMenuTrigger
            render={<Button aria-label={`More for ${name}`} size="icon" variant="ghost" />}
        >
            <Ellipsis {...icon} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onRename}>
                <Pencil {...icon} />
                Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>
                <Copy {...icon} />
                Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} variant="danger">
                <Trash2 {...icon} />
                Delete
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
);

const ProjectList = ({
    store,
    onOpen,
    creating: asked,
    onAsked,
    onDeleted,
    current,
}: {
    store: Store;
    /** The project the playground is in. */
    current?: string;
    onOpen: (id: string) => void;
    /** A project is gone, so the playground lets go of it if it was the current one. */
    onDeleted: (id: string) => void;
    /** The switcher asked for a new project. */
    creating?: boolean;
    onAsked: () => void;
}) => {
    const [creating, setCreating] = useState(Boolean(asked));
    useEffect(() => {
        if (!asked) return;
        setCreating(true);
        onAsked();
    }, [asked, onAsked]);
    const [renaming, setRenaming] = useState<Project>();
    const [deleting, setDeleting] = useState<Project>();

    return (
        <Page>
            <PageHeader
                aside={
                    <Button onClick={() => setCreating(true)}>
                        <Plus {...icon} />
                        New project
                    </Button>
                }
                description="A product and the theme it is built in: its primary, neutral and chart colours, the character of its controls and its sizes. Each takes its app.css and DESIGN.md to the project."
                title="Projects"
            />

            {store.projects.length === 0 ? (
                <EmptyState
                    action={
                        <Button onClick={() => setCreating(true)} variant="secondary">
                            New project
                        </Button>
                    }
                    description="Name it, then build its theme in six steps. Projects are kept in this browser."
                    icon={<FolderKanban {...icon} />}
                    title="No projects yet"
                />
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Project</TableHead>
                            <TableHead>Theme</TableHead>
                            <TableHead>Font</TableHead>
                            <TableHead>Updated</TableHead>
                            <TableHead className="w-12">
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {store.projects.map(project => (
                            <TableRow
                                className="cursor-pointer"
                                key={project.id}
                                onClick={() => onOpen(project.id)}
                            >
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <button
                                            className={cn(
                                                'flex items-center gap-2.5 rounded-chip text-left font-medium text-neutral-950',
                                                focusRing,
                                            )}
                                            onClick={event => {
                                                event.stopPropagation();
                                                onOpen(project.id);
                                            }}
                                            type="button"
                                        >
                                            <span
                                                aria-hidden
                                                className="size-3 shrink-0 rounded-full ring-1 ring-neutral-950/10 ring-inset"
                                                style={{ background: presetSwatch(project.theme) }}
                                            />
                                            {project.name}
                                        </button>
                                        {/* A draft has no theme to wear yet; the one in use is the playground's. */}
                                        {!project.applied ? (
                                            <Badge>Draft</Badge>
                                        ) : (
                                            project.id === current && (
                                                <Badge tone="primary">In use</Badge>
                                            )
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>{themeName(project.theme)}</TableCell>
                                <TableCell>{fontName(project.theme)}</TableCell>
                                <TableCell className="text-neutral-600">
                                    {updatedAgo(project.updated)}
                                </TableCell>
                                {/* The menu acts on the row without opening it. */}
                                <TableCell onClick={event => event.stopPropagation()}>
                                    <ProjectMenu
                                        name={project.name}
                                        onDelete={() => setDeleting(project)}
                                        onDuplicate={() =>
                                            store.create(`${project.name} copy`, {
                                                theme: project.theme,
                                                progress: progressOf(project),
                                                flow: 2,
                                                applied: project.applied,
                                            })
                                        }
                                        onRename={() => setRenaming(project)}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            <NewProjectDialog
                onCreate={name => onOpen(store.create(name).id)}
                onOpenChange={setCreating}
                open={creating}
            />
            <RenameDialog
                onOpenChange={open => !open && setRenaming(undefined)}
                onRename={name => renaming && store.update(renaming.id, { name })}
                project={renaming}
            />
            <DeleteDialog
                inUse={Boolean(deleting?.applied) && deleting?.id === current}
                next={
                    store.projects.find(project => project.id !== deleting?.id && project.applied)
                        ?.name
                }
                onDelete={() => {
                    if (!deleting) return;
                    store.remove(deleting.id);
                    onDeleted(deleting.id);
                }}
                onOpenChange={open => !open && setDeleting(undefined)}
                project={deleting}
            />
        </Page>
    );
};

/* ---------- Dialogs ---------- */

const NewProjectDialog = ({
    open,
    onOpenChange,
    onCreate,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreate: (name: string) => void;
}) => {
    const [name, setName] = useState('');

    const submit = (event: FormEvent) => {
        event.preventDefault();
        onCreate(name.trim() || 'Untitled project');
        onOpenChange(false);
        setName('');
    };

    return (
        <Dialog onOpenChange={onOpenChange} open={open}>
            <DialogContent className="w-[min(480px,calc(100vw-32px))]">
                <form onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle>New project</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <DialogDescription>
                            A name for the product. Its theme starts clear: the steps after this
                            build it, from your primary colour on.
                        </DialogDescription>
                        <Field>
                            <FieldLabel>Name</FieldLabel>
                            <Input
                                autoFocus
                                onChange={event => setName(event.target.value)}
                                placeholder="Untitled project"
                                value={name}
                            />
                        </Field>
                    </DialogBody>
                    <DialogFooter>
                        <DialogClose render={<Button variant="secondary" />}>Cancel</DialogClose>
                        <Button type="submit">Create project</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const RenameDialog = ({
    project,
    onOpenChange,
    onRename,
}: {
    project?: Project;
    onOpenChange: (open: boolean) => void;
    onRename: (name: string) => void;
}) => {
    const [name, setName] = useState('');
    // The field starts from the name of the project it opened for, each time it opens.
    const [draftFor, setDraftFor] = useState<string>();
    if (project && project.id !== draftFor) {
        setDraftFor(project.id);
        setName(project.name);
    } else if (!project && draftFor) {
        setDraftFor(undefined);
    }

    return (
        <Dialog onOpenChange={onOpenChange} open={Boolean(project)}>
            <DialogContent className="w-[min(420px,calc(100vw-32px))]">
                <form
                    onSubmit={event => {
                        event.preventDefault();
                        if (name.trim()) onRename(name.trim());
                        onOpenChange(false);
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>Rename project</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <Field>
                            <FieldLabel>Name</FieldLabel>
                            <Input
                                autoFocus
                                onChange={event => setName(event.target.value)}
                                value={name}
                            />
                        </Field>
                    </DialogBody>
                    <DialogFooter>
                        <DialogClose render={<Button variant="secondary" />}>Cancel</DialogClose>
                        <Button type="submit">Rename</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const DeleteDialog = ({
    project,
    inUse,
    next,
    onOpenChange,
    onDelete,
}: {
    project?: Project;
    /** The playground wears this project's theme, and moves on once it is gone. */
    inUse: boolean;
    /** The project the playground moves on to, the latest with a used theme; none for Continuum's own. */
    next?: string;
    onOpenChange: (open: boolean) => void;
    onDelete: () => void;
}) => (
    <Dialog onOpenChange={onOpenChange} open={Boolean(project)}>
        <DialogContent className="w-[min(420px,calc(100vw-32px))]">
            <DialogHeader>
                <DialogTitle>Delete {project?.name}?</DialogTitle>
            </DialogHeader>
            <DialogBody>
                <DialogDescription>
                    Its theme goes with it. Files already taken to the project stay as they are.
                    {inUse &&
                        ` It is the theme the playground wears now, so the playground moves to ${next ? `${next}'s theme` : "Continuum's own"}.`}
                </DialogDescription>
            </DialogBody>
            <DialogFooter>
                <DialogClose render={<Button variant="secondary" />}>Cancel</DialogClose>
                <Button
                    onClick={() => {
                        onDelete();
                        onOpenChange(false);
                    }}
                >
                    Delete project
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);

/* ---------- A project ---------- */

/** The review: the step an existing project without a recorded progress opens on. */
const REVIEW_STEP = 4;

/** Where the six steps before (Primary, Neutral, Charts, Controls, Sizes, Review) land in today's five. */
const fromSixSteps = [0, 0, 0, 2, 3, 4];

/** A project's progress in today's steps, an older project's read from the six it was counted in. */
const progressOf = (project: Project) => {
    if (project.progress === undefined) return REVIEW_STEP;
    if (project.flow === 2) return Math.min(project.progress, REVIEW_STEP);
    return fromSixSteps[Math.min(project.progress, 5)] ?? REVIEW_STEP;
};

/** Drops the keys set to undefined, so untouched options compare equal to the defaults. */
const compact = (options: ThemeOptions): ThemeOptions =>
    Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined));

type ProjectPageProps = {
    project: Project;
    store: Store;
    state: AppState;
    onChange: (patch: Partial<AppState>) => void;
};

/** Whether the key press is ⌘S or Ctrl+S. */
const isSaveKey = (event: KeyboardEvent) =>
    (event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === 's';

/**
 * One project's theme, a step at a time, with a piece of a product in the theme in a panel of its
 * own beside it. The steps change a draft, which the preview follows; the project keeps it once it
 * is saved, and leaving with it unsaved asks first. The rest of the playground wears the theme as
 * it was last used, so the controls hold still under the pointer. The furthest step reached is
 * kept as it is reached: it is where the project opens, not a change to its theme.
 */
const ProjectPage = ({ project, store, state, onChange }: ProjectPageProps) => {
    const [mode, setMode] = useState<ThemeMode>(state.mode);
    const [exporting, setExporting] = useState(Boolean(state.exporting));
    const toast = useToast();
    const { notice, show } = useNotice();

    // The theme as saved, and the draft the steps change; refs too, so a way out reads them as they are.
    const saved = project.theme;
    const [draft, setDraft] = useState<ThemeOptions>(saved);
    // A theme saved from elsewhere (another tab) is taken up while there is nothing unsaved here.
    const [base, setBase] = useState(saved);
    if (base !== saved) {
        setBase(saved);
        if (sameTheme(draft, base)) setDraft(saved);
    }
    const savedRef = useRef(saved);
    savedRef.current = saved;
    const draftRef = useRef(draft);
    draftRef.current = draft;
    const dirty = !sameTheme(draft, saved);

    const save = () => {
        const theme = draftRef.current;
        if (sameTheme(theme, savedRef.current)) return;
        store.update(project.id, { theme });
        savedRef.current = theme;
        show('Saved');
    };

    const discard = () => {
        draftRef.current = savedRef.current;
        setDraft(savedRef.current);
    };

    useLeaveGuard({
        name: project.name,
        dirty: () => !sameTheme(draftRef.current, savedRef.current),
        save,
        discard,
    });

    // Closing the tab or reloading with unsaved changes asks too, in the browser's own words; the
    // listener is there only while something is unsaved.
    useEffect(() => {
        if (!dirty) return;
        const ask = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', ask);
        return () => window.removeEventListener('beforeunload', ask);
    }, [dirty]);

    // ⌘S or Ctrl+S saves while the project is open, and never opens the browser's own save.
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (!isSaveKey(event)) return;
            event.preventDefault();
            save();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    // The sidebar's Export asks once; the dialog opens and the ask is let go of.
    const asked = state.exporting;
    useEffect(() => {
        if (!asked) return;
        setExporting(true);
        onChange({ exporting: undefined });
    }, [asked, onChange]);

    const theme = draft;
    const set = (patch: Partial<ThemeOptions>) =>
        setDraft(now => {
            const next = compact({ ...now, ...patch });
            draftRef.current = next;
            return next;
        });

    // The controls answer at once; the theme behind the preview follows when React has time.
    const shown = useDeferredValue(theme);
    const id = projectThemeId(project);
    const css = useMemo(() => createThemeCss({ ...shown, name: id }), [shown, id]);
    // In use: the playground wears this project and its theme has not changed since.
    // A draft never used is not in use, even while its theme is still the empty one.
    const inUse =
        state.current === project.id &&
        Boolean(project.applied) &&
        sameTheme(project.applied, theme);

    // The project saves the theme as it is now, keeps it as used and becomes current, so every page
    // wears it; with nothing left unsaved, going home asks nothing.
    const use = () => {
        const theme = draftRef.current;
        // A theme used before is updated where it is being worked on, so the next change is a
        // step away; only the first use goes to Home, to show the playground wearing it.
        const update = Boolean(project.applied);
        store.update(project.id, { theme, applied: theme, progress: REVIEW_STEP, flow: 2 });
        savedRef.current = theme;
        if (!update) onChange({ view: 'home', project: project.id });
        toast.add({
            title: update ? `${project.name} is updated` : `${project.name} is in use`,
            description: update
                ? 'Every page of the playground wears the new theme.'
                : 'Every page of the playground wears its theme now.',
            type: 'success',
        });
    };

    return (
        <Page width="narrow">
            {css && <style>{css}</style>}
            {/* "Saved" hangs from the header bar, as a save state does. */}
            <HeaderActions>
                <Notice {...notice} />
            </HeaderActions>
            <ProjectFlow
                dirty={dirty}
                inUse={inUse}
                name={project.name}
                onExport={() => setExporting(true)}
                onProgress={step => store.update(project.id, { progress: step, flow: 2 })}
                onSave={save}
                onUse={use}
                used={Boolean(project.applied)}
                progress={progressOf(project)}
                set={set}
                theme={theme}
            />

            {/* The preview is a panel of its own beside the page, not part of its column. */}
            <AsidePanel aria-label="Preview">
                <PreviewPanel
                    mode={mode}
                    onModeChange={setMode}
                    set={set}
                    theme={shown}
                    themeId={id}
                />
            </AsidePanel>

            <ExportDialog
                label={project.name}
                mode={mode}
                onGamut={gamut => set({ gamut: gamut === 'p3' ? undefined : gamut })}
                onOpenChange={setExporting}
                open={exporting}
                options={theme}
                unsaved={dirty}
            />
        </Page>
    );
};
