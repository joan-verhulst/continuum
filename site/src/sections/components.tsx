import { Stage } from '@playground/layout';
import { entries } from '@playground/showcase/entries';
import { type Category, type Entry, knobDefaults } from '@playground/showcase/kit';
import { Button, buttonVariants, cn, focusRing, Tabs, TabsList, TabsTrigger } from 'continuum';
import { ArrowRight } from 'lucide-react';
import { useInView } from 'motion/react';
import { useRef, useState } from 'react';
import { Reveal, Section } from '../web';

/*
 * The components, first thing after the hero: the library's own entries, live and at their real
 * size, the same previews the docs show. A row of groups picks which; a group opens on three rows and
 * shows the rest on request, so the page moves on to the screens without a wall of tiles.
 */

type Group = { id: string; label: string } & (
    | { ids: readonly string[] }
    | { categories: readonly Category[] }
);

const groups: Group[] = [
    {
        id: 'featured',
        label: 'Featured',
        // Twelve columns' worth on a laptop: the table and the chart take two each.
        ids: [
            'table',
            'select',
            'date-picker',
            'command-menu',
            'tabs',
            'area-chart',
            'toast',
            'stat-card',
            'segmented',
            'chat-composer',
        ],
    },
    { id: 'inputs', label: 'Inputs and forms', categories: ['inputs', 'forms', 'filtering'] },
    { id: 'navigation', label: 'Navigation', categories: ['frame', 'navigation'] },
    { id: 'actions', label: 'Actions and overlays', categories: ['actions', 'overlays'] },
    {
        id: 'data',
        label: 'Data and status',
        categories: ['content', 'labels', 'status', 'messages'],
    },
    { id: 'charts', label: 'Charts and AI', categories: ['charts', 'ai'] },
];

const byId = new Map(entries.map(entry => [entry.id, entry]));

const entriesOf = (group: Group): Entry[] =>
    'ids' in group
        ? group.ids.flatMap(id => byId.get(id) ?? [])
        : entries.filter(entry => group.categories.includes(entry.category));

/** How many grid cells a group shows before the rest: three rows of three. */
const FOLD = 9;

const docs = '/docs#view=components&mode=dark';

/**
 * A component, live: its preview on the canvas, inset in the card, then its name and one line. The
 * stage is inert, as on the docs' grid, so a preview draws itself as a tile (no knobs panel to clear)
 * and the whole card opens the component's page, where its knobs are.
 */
const Tile = ({ entry, index }: { entry: Entry; index: number }) => {
    const { id, name, description, span, stageClassName, knobs, Preview } = entry;
    // A preview mounts once its stage is wholly on screen: the open ones (the select, the command
    // menu) scroll their chosen row into view as they mount, which would otherwise scroll the page.
    const stage = useRef<HTMLDivElement>(null);
    const seen = useInView(stage, { once: true, amount: 'all' });
    return (
        <Reveal
            className={cn(
                'group/tile relative flex min-w-0 flex-col rounded-panel border border-neutral-200 bg-neutral-50 transition-[border-color] duration-150 hover:border-neutral-300',
                span === 2 && 'md:col-span-2',
                span === 3 && 'md:col-span-2 lg:col-span-3',
            )}
            // Only the first row staggers; a group switched to later appears at once.
            delay={Math.min(index, 3)}
        >
            <Stage
                className={cn(
                    'm-2 mb-0 h-64 min-h-0 rounded-[calc(var(--radius-panel)-8px)] bg-neutral-100 p-6',
                    stageClassName,
                )}
                inert
            >
                {/* The stage's own ref feeds its overlays, so a box over it is what is watched. */}
                <div aria-hidden className="pointer-events-none absolute inset-0" ref={stage} />
                {seen && <Preview knobs={knobDefaults(knobs)} />}
            </Stage>
            <a
                className={cn(
                    'flex items-start gap-3 rounded-b-panel px-4 pt-3 pb-4 after:absolute after:inset-0 after:rounded-panel after:content-[""]',
                    focusRing,
                )}
                href={`/docs#${new URLSearchParams({ mode: 'dark', view: 'components', component: id })}`}
            >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <h3 className="font-medium text-neutral-950 text-sm">{name}</h3>
                    <span className="text-pretty text-neutral-600 text-xs leading-normal">
                        {description}
                    </span>
                </div>
                <ArrowRight
                    aria-hidden
                    className="mt-0.5 size-4 shrink-0 text-neutral-400 transition-[color,translate] duration-150 group-hover/tile:translate-x-0.5 group-hover/tile:text-neutral-950"
                    strokeWidth={2}
                />
            </a>
        </Reveal>
    );
};

export const Components = () => {
    const [groupId, setGroupId] = useState(groups[0]?.id ?? 'featured');
    const [expanded, setExpanded] = useState(false);
    const group = groups.find(item => item.id === groupId) ?? groups[0];
    const list = group ? entriesOf(group) : [];

    // Fold after the tile that fills the ninth cell, so the fold lands at a row's end. The featured
    // set is picked to fill its rows and never folds.
    let shown = list;
    if (!expanded && group?.id !== 'featured') {
        let cells = 0;
        const end = list.findIndex(entry => {
            cells += entry.span ?? 1;
            return cells >= FOLD;
        });
        shown = end === -1 ? list : list.slice(0, end + 1);
    }
    const hidden = list.length - shown.length;

    return (
        <Section
            aside={
                <Reveal delay={1}>
                    <a className={buttonVariants({ variant: 'secondary', size: 'lg' })} href={docs}>
                        Browse all {entries.length}
                        <ArrowRight strokeWidth={2} />
                    </a>
                </Reveal>
            }
            description="A comprehensive collection of components and design foundations, built around a cohesive visual language. Designed to work together, flexible enough to make every project your own."
            eyebrow={`${entries.length} components`}
            id="components"
            title="Everything works better together."
        >
            <div className="flex flex-col gap-6">
                <Reveal className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                    <Tabs
                        className="mx-auto w-max"
                        onValueChange={value => {
                            setGroupId(String(value));
                            setExpanded(false);
                        }}
                        value={groupId}
                    >
                        <TabsList aria-label="Component groups" variant="pill">
                            {groups.map(item => (
                                <TabsTrigger key={item.id} value={item.id}>
                                    {item.label}
                                    <span className="tabular-nums">{entriesOf(item).length}</span>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </Reveal>
                <div
                    className="grid grid-flow-dense gap-4 md:grid-cols-2 lg:grid-cols-3"
                    key={groupId}
                >
                    {shown.map((entry, index) => (
                        <Tile entry={entry} index={index} key={entry.id} />
                    ))}
                </div>
                {hidden > 0 && (
                    <div className="flex justify-center">
                        <Button onClick={() => setExpanded(true)} size="lg" variant="secondary">
                            Show {hidden} more in {group?.label.toLowerCase()}
                        </Button>
                    </div>
                )}
            </div>
        </Section>
    );
};
