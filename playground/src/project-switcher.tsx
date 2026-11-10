import {
    cn,
    DropdownMenuItem,
    DropdownMenuSeparator,
    SidebarSwitcher,
    SidebarSwitcherMark,
    type ThemeOptions,
} from 'continuum';
import { Check, LayoutGrid, Plus } from 'lucide-react';
import type { AppState } from './meta';
import { matchPreset, presetSwatch } from './presets';
import { type Project, useProjects } from './projects';

/*
 * The account's projects, one current at a time, as a site switcher in a product: the current one
 * at the top of the sidebar, the others a click away, then the overview and a new one. Picking one
 * keeps the page that is open; the whole playground wears its theme once it is used, and the
 * Projects view edits it.
 */

const icon = { strokeWidth: 2 } as const;

/** What a project's theme is, in a word under its name: a draft until it is used. */
const themeLine = (theme?: ThemeOptions) => {
    if (!theme) return 'Draft';
    const preset = matchPreset(theme);
    if (preset) return `${preset.label} theme`;
    return Object.keys(theme).length === 0 ? 'Default theme' : 'Own theme';
};

/**
 * A project's mark: its initial on its action colour. A neutral action flips with the mode, so its
 * initial takes the colour drawn on the action, never a fixed white.
 */
const ProjectMark = ({ project, size }: { project?: Project; size: 20 | 28 }) => (
    <SidebarSwitcherMark
        className={cn(project && project.theme.action !== 'accent' && 'text-on-action')}
        color={project ? presetSwatch(project.theme) : undefined}
        size={size}
    >
        {project ? project.name.slice(0, 1).toUpperCase() : ''}
    </SidebarSwitcherMark>
);

type ProjectSwitcherProps = {
    state: AppState;
    onChange: (patch: Partial<AppState>) => void;
};

export const ProjectSwitcher = ({ state, onChange }: ProjectSwitcherProps) => {
    const { projects } = useProjects();
    const current = projects.find(project => project.id === state.current);

    return (
        <SidebarSwitcher
            aria-label={current ? `Project: ${current.name}. Switch project` : 'Pick a project'}
            detail={
                current
                    ? themeLine(current.applied)
                    : projects.length
                      ? 'Pick one to work on'
                      : 'Start your first'
            }
            mark={<ProjectMark project={current} size={28} />}
            name={current ? current.name : 'No project'}
        >
            {projects.map(project => (
                <DropdownMenuItem
                    key={project.id}
                    // The same page in another project; on the Projects view, that project's theme.
                    onClick={() =>
                        onChange(
                            state.view === 'projects'
                                ? { view: 'projects', project: project.id }
                                : { project: project.id },
                        )
                    }
                >
                    <ProjectMark project={project} size={20} />
                    <span className="min-w-0 flex-1 truncate">{project.name}</span>
                    {project.id === current?.id && (
                        <Check className="size-4 text-neutral-950" {...icon} />
                    )}
                </DropdownMenuItem>
            ))}
            {projects.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={() => onChange({ view: 'projects', project: undefined })}>
                <LayoutGrid {...icon} />
                All projects
            </DropdownMenuItem>
            <DropdownMenuItem
                onClick={() => onChange({ view: 'projects', project: undefined, creating: true })}
            >
                <Plus {...icon} />
                New project
            </DropdownMenuItem>
        </SidebarSwitcher>
    );
};

/** Where the current project is kept, so a fresh visit opens on it. */
export const CURRENT_PROJECT = 'continuum.project';
