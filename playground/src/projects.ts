import type { ThemeOptions } from 'continuum';
import { useSyncExternalStore } from 'react';

/*
 * Projects: a name and the theme a product is built in. They live in this browser's storage for
 * now; each one's theme is what its app.css and DESIGN.md are exported from. Using a theme keeps a
 * copy of it as the project's own: the playground wears that copy while the project is current, so
 * edits after it show in the preview alone until the theme is used again.
 */

export type Project = {
    id: string;
    name: string;
    /** The theme, its corner scale included. */
    theme: ThemeOptions;
    /** When it last changed, in ms since the epoch. */
    updated: number;
    /** The furthest step of the flow reached; a project opens there. A new one starts at 0. */
    progress?: number;
    /** The theme as it was last used; none while the project is a draft. */
    applied?: ThemeOptions;
};

const KEY = 'continuum.projects';

const listeners = new Set<() => void>();

let cache: Project[] | null = null;

const read = (): Project[] => {
    if (cache) return cache;
    try {
        const raw = localStorage.getItem(KEY);
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        cache = Array.isArray(parsed)
            ? parsed.filter(
                  (item): item is Project =>
                      typeof item === 'object' &&
                      item !== null &&
                      typeof (item as Project).id === 'string' &&
                      typeof (item as Project).name === 'string',
              )
            : [];
    } catch {
        cache = [];
    }
    return cache;
};

const write = (projects: Project[]) => {
    cache = projects;
    try {
        localStorage.setItem(KEY, JSON.stringify(projects));
    } catch {
        // Storage can be full or blocked; the projects still live for this visit.
    }
    for (const listener of listeners) listener();
};

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    // Another tab changing them shows here too.
    const onStorage = (event: StorageEvent) => {
        if (event.key !== KEY) return;
        cache = null;
        listener();
    };
    window.addEventListener('storage', onStorage);
    return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', onStorage);
    };
};

const newId = () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID().slice(0, 8)
        : Math.random().toString(36).slice(2, 10);

/** Every project, newest change first, and the ways to change them. */
export const useProjects = () => {
    const projects = useSyncExternalStore(subscribe, read, () => []);

    return {
        projects: [...projects].sort((a, b) => b.updated - a.updated),
        create: (
            name: string,
            from: Partial<Pick<Project, 'theme' | 'progress' | 'applied'>> = {},
        ) => {
            // A new project starts clear, at the first step of its flow.
            const project: Project = {
                id: newId(),
                name,
                theme: {},
                progress: 0,
                ...from,
                updated: Date.now(),
            };
            write([...read(), project]);
            return project;
        },
        update: (id: string, patch: Partial<Omit<Project, 'id'>>) =>
            write(
                read().map(project =>
                    project.id === id ? { ...project, ...patch, updated: Date.now() } : project,
                ),
            ),
        remove: (id: string) => write(read().filter(project => project.id !== id)),
    };
};

/** The data-theme a project's theme is written under, so several can sit on one page. */
export const projectThemeId = (project: Pick<Project, 'id'>) => `project-${project.id}`;

/** The data-theme of the theme as it was used, which the whole playground wears. */
export const appliedThemeId = (project: Pick<Project, 'id'>) => `applied-${project.id}`;

/** Whether two themes set the same options, whatever order they were set in. */
export const sameTheme = (a?: ThemeOptions, b?: ThemeOptions) => {
    const key = (theme?: ThemeOptions) =>
        JSON.stringify(
            Object.entries(theme ?? {})
                .filter(([, value]) => value !== undefined)
                .sort(([x], [y]) => x.localeCompare(y)),
        );
    return key(a) === key(b);
};
