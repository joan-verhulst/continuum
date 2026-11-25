'use client';

import {
    CommandMenu,
    CommandMenuContent,
    CommandMenuEmpty,
    CommandMenuFooter,
    CommandMenuGroup,
    CommandMenuInput,
    CommandMenuItem,
    CommandMenuList,
    cn,
    focusRing,
    Kbd,
    matchesCommand,
    useCommandMenuShortcut,
} from '@contui/ui';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SearchEntry } from '@/app/search.json/route';

/*
 * The site's one search: ⌘K (Ctrl K) from any page, or a search trigger, opens the library's
 * CommandMenu over every page the site builds (/search.json, fetched the first time it opens).
 * Results come in their sections, the section with the best match first, and within each a title
 * that starts with what is typed before one that only mentions it. Empty, it offers the sections'
 * own pages to start from.
 */

const openEvent = 'contui-search-open';

/** Opens the search from anywhere: a trigger in the header, the docs' top bar. */
export const openSiteSearch = () => window.dispatchEvent(new Event(openEvent));

/** The section pages offered before anything is typed. */
const starts = new Set([
    '/docs',
    '/docs/install',
    '/foundations',
    '/components',
    '/charts',
    '/examples',
    '/ai',
    '/ai/mcp-server',
    '/tools',
]);

const MAX = 60;

/** How well an entry answers the query: by its title first, its line and section after. */
const score = (entry: SearchEntry, query: string) => {
    const q = query.trim().toLowerCase();
    const title = entry.title.toLowerCase();
    if (title === q) return 100;
    if (title.startsWith(q)) return 80;
    const words = q.split(/\s+/).filter(Boolean);
    if (words.every(word => title.includes(word))) return 60;
    if (title.split(/[^a-z0-9]+/).some(part => words.some(word => part.startsWith(word))))
        return 40;
    return 20;
};

const useIndex = (open: boolean) => {
    const [entries, setEntries] = useState<SearchEntry[]>();
    useEffect(() => {
        if (!open || entries) return;
        let live = true;
        fetch('/search.json')
            .then(response => response.json() as Promise<SearchEntry[]>)
            .then(data => live && setEntries(data))
            .catch(() => live && setEntries([]));
        return () => {
            live = false;
        };
    }, [open, entries]);
    return entries;
};

/** The search's dialog. Mounted once, in the root layout. */
export const SiteSearch = () => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const router = useRouter();
    const entries = useIndex(open);

    const show = useCallback(() => {
        setQuery('');
        setOpen(true);
    }, []);
    useCommandMenuShortcut(show);
    useEffect(() => {
        window.addEventListener(openEvent, show);
        return () => window.removeEventListener(openEvent, show);
    }, [show]);

    const groups = useMemo(() => {
        if (!entries) return [];
        const typed = query.trim();
        const found = typed
            ? entries
                  .filter(entry => matchesCommand(typed, entry.title, entry.summary, entry.group))
                  .map((entry, order) => ({ entry, order, score: score(entry, typed) }))
                  .sort((a, b) => b.score - a.score || a.order - b.order)
                  .slice(0, MAX)
            : entries
                  .filter(entry => starts.has(entry.path))
                  .map((entry, order) => ({ entry, order, score: 0 }));
        const bySection = new Map<string, SearchEntry[]>();
        for (const { entry } of found) {
            bySection.set(entry.group, [...(bySection.get(entry.group) ?? []), entry]);
        }
        return typed
            ? [...bySection].map(([label, items]) => ({ label, items }))
            : [{ label: 'Start from', items: [...bySection.values()].flat() }];
    }, [entries, query]);

    const go = (path: string) => {
        setOpen(false);
        router.push(path);
    };

    return (
        <CommandMenu onOpenChange={setOpen} onQueryChange={setQuery} open={open} query={query}>
            <CommandMenuContent aria-label="Search the site">
                <CommandMenuInput
                    placeholder="Search components, foundations, examples…"
                    trailing={<Kbd className="pointer-coarse:hidden">Esc</Kbd>}
                />
                <CommandMenuList className="max-h-[min(440px,60cqh)]">
                    {!entries && <p className="px-2.5 py-3 text-neutral-600 text-xs">Loading…</p>}
                    {groups.map(group => (
                        <CommandMenuGroup key={group.label} label={group.label}>
                            {group.items.map(entry => (
                                <CommandMenuItem
                                    key={entry.path}
                                    keywords={[entry.summary, entry.group]}
                                    onSelect={() => go(entry.path)}
                                    value={entry.title}
                                >
                                    <span className="flex min-w-0 flex-1 items-baseline gap-2">
                                        <span className="shrink-0 text-neutral-950">
                                            {entry.title}
                                        </span>
                                        <span className="truncate text-neutral-500 text-xs">
                                            {entry.summary}
                                        </span>
                                    </span>
                                </CommandMenuItem>
                            ))}
                        </CommandMenuGroup>
                    ))}
                    {entries && <CommandMenuEmpty />}
                </CommandMenuList>
                <CommandMenuFooter>
                    <span className="flex items-center gap-1.5">
                        <Kbd>↑</Kbd>
                        <Kbd>↓</Kbd> to move
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Kbd>↵</Kbd> to open
                    </span>
                </CommandMenuFooter>
            </CommandMenuContent>
        </CommandMenu>
    );
};

/** ⌘ on a Mac, Ctrl elsewhere; ⌘ until the browser says which. */
const useModifier = () => {
    const [mod, setMod] = useState('⌘');
    useEffect(() => {
        if (!/Mac|iPhone|iPad/.test(navigator.platform)) setMod('Ctrl');
    }, []);
    return mod;
};

/**
 * The search as a field: a quiet box with the icon, what it searches and the shortcut. A button
 * that opens the dialog, so the typing happens there.
 */
export const SearchField = ({
    label = 'Search docs',
    className,
}: {
    /** What it says it searches; the dialog always searches the whole site. */
    label?: string;
    className?: string;
}) => {
    const mod = useModifier();
    return (
        <button
            className={cn(
                'flex h-control items-center gap-2 rounded-control border border-neutral-200 bg-neutral-100 pr-1.5 pl-3 text-neutral-500 text-sm transition-[border-color,color] duration-150 hover:border-neutral-300 hover:text-neutral-700',
                focusRing,
                className,
            )}
            onClick={openSiteSearch}
            type="button"
        >
            <Search aria-hidden className="size-4 shrink-0" strokeWidth={2} />
            <span className="flex-1 truncate text-left">{label}</span>
            <span className="flex shrink-0 items-center gap-0.5 max-sm:hidden">
                <Kbd>{mod}</Kbd>
                <Kbd>K</Kbd>
            </span>
        </button>
    );
};
