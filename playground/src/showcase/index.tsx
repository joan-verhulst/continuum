import {
    Badge,
    Button,
    cn,
    Dock,
    DockItem,
    Field,
    FieldLabel,
    Input,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableGroupRow,
    TableHead,
    TableHeader,
    TableRow,
} from 'continuum';
import { Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    DetailHeader,
    Page,
    PageDock,
    PageHeader,
    Section,
    scrollToSection,
    usePageIndex,
    useScrollSpy,
} from '../layout';
import { type AppState, toHash } from '../meta';
import { KnobStage, Neighbours, PreviewTile } from './detail';
import { type Gap, type GapStart, gaps } from './gaps';
import { type InUse, inUseOf } from './in-use';
import { type Category, categories, type Entry, entries, knobDefaults } from './previews';

const icon = { strokeWidth: 2 } as const;

const startBadge: Record<GapStart, { label: string; tone: 'primary' | 'success' | 'neutral' }> = {
    recipe: { label: 'Recipe written', tone: 'primary' },
    compose: { label: 'Compose existing', tone: 'success' },
    new: { label: 'New component', tone: 'neutral' },
};

const matches = (query: string, ...fields: string[]) =>
    fields.some(field => field.toLowerCase().includes(query));

const categoryLabel = (id: Category) => categories.find(entry => entry.id === id)?.label ?? id;

type ComponentsProps = {
    state: AppState;
    onChange: (patch: Partial<AppState>) => void;
};

/** Every component as a tile; a tile opens the component's own page, with its variants and states. */
export const Components = ({ state, onChange }: ComponentsProps) => {
    const entry = entries.find(item => item.id === state.component);
    const { setIndex, setActive } = usePageIndex();
    const open = useCallback((id?: string) => onChange({ component: id }), [onChange]);

    // The sidebar lists every component; picking one opens its page.
    useEffect(() => {
        setIndex(
            entries.map(item => ({
                id: item.id,
                title: item.name,
                group: categoryLabel(item.category),
            })),
            { label: 'Components', onSelect: open },
        );
        return () => {
            setIndex([]);
            setActive(undefined);
        };
    }, [open, setIndex, setActive]);

    useEffect(() => {
        setActive(entry?.id);
    }, [entry, setActive]);

    return entry ? (
        <ComponentPage entry={entry} key={entry.id} onOpen={open} />
    ) : (
        <ComponentsGrid onOpen={open} state={state} />
    );
};

type GridProps = {
    state: AppState;
    onOpen: (id?: string) => void;
};

const ComponentsGrid = ({ state, onOpen }: GridProps) => {
    const [query, setQuery] = useState('');
    const [showGaps, setShowGaps] = useState(false);
    const q = query.trim().toLowerCase();

    const shown = entries.filter(entry => matches(q, entry.name, entry.description));
    const missing = showGaps
        ? gaps.filter(gap => matches(q, gap.name, gap.description, gap.from))
        : [];
    const groups = categories
        .map(({ id, label }) => ({
            id,
            label,
            entries: shown.filter(entry => entry.category === id),
        }))
        .filter(group => group.entries.length > 0);

    // The categories on the page, as a dock in the bar at the foot that follows the scroll.
    const shownIds = groups.map(group => `s-${group.id}`).join(' ');
    const sectionIds = useMemo(() => (shownIds ? shownIds.split(' ') : []), [shownIds]);
    const [current, setCurrent] = useState<string>();
    useScrollSpy(sectionIds, setCurrent);

    return (
        <Page width="dense">
            <PageHeader
                aside={
                    <dl className="flex gap-10">
                        <Count label="Components" value={entries.length} />
                        <Count label="Not built yet" value={gaps.length} />
                    </dl>
                }
                description="Every component, live, in the theme previewed from the pill at the foot. Open one for its variants and states."
                title="Components"
            />
            {groups.length > 1 && (
                <PageDock>
                    <Dock
                        aria-label="Categories"
                        onValueChange={scrollToSection}
                        value={current ?? sectionIds[0]}
                    >
                        {groups.map(group => (
                            <DockItem key={group.id} value={`s-${group.id}`}>
                                {group.label}
                            </DockItem>
                        ))}
                    </Dock>
                </PageDock>
            )}
            <div className="-mt-6 flex flex-wrap items-center gap-3">
                <Input
                    aria-label="Search components"
                    className="w-full sm:w-60"
                    leadingIcon={<Search {...icon} />}
                    onChange={event => setQuery(event.target.value)}
                    placeholder="Search components"
                    size="sm"
                    value={query}
                />
                <Field className="ml-auto flex-row items-center gap-2.5">
                    <Switch checked={showGaps} onCheckedChange={setShowGaps} />
                    <FieldLabel className="cursor-pointer">Show what is missing</FieldLabel>
                </Field>
            </div>

            <div className="flex min-w-0 flex-col gap-20">
                {groups.map(group => (
                    <Section
                        id={`s-${group.id}`}
                        key={group.id}
                        title={
                            <span className="flex items-center gap-2.5">
                                {group.label}
                                <Badge variant="count">{group.entries.length}</Badge>
                            </span>
                        }
                    >
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {group.entries.map(entry => (
                                <Tile
                                    entry={entry}
                                    href={toHash({ ...state, component: entry.id })}
                                    key={entry.id}
                                    onOpen={() => onOpen(entry.id)}
                                />
                            ))}
                        </div>
                    </Section>
                ))}

                {missing.length > 0 && (
                    <Section
                        description="Components a product library usually carries that Continuum does not have yet, and where each would start: a recipe already written in the skill’s guide, parts that exist and only need composing, or a new component."
                        id="s-missing"
                        title={
                            <span className="flex items-center gap-2.5">
                                Not built yet
                                <Badge variant="count">{missing.length}</Badge>
                            </span>
                        }
                    >
                        <GapTable gaps={missing} />
                    </Section>
                )}

                {groups.length === 0 && missing.length === 0 && (
                    <div className="flex flex-col items-start gap-3 rounded-panel border border-neutral-200 border-dashed p-6 text-neutral-600 text-xs">
                        <p>Nothing matches “{query.trim()}”.</p>
                        <Button
                            onClick={() => {
                                setQuery('');
                                setShowGaps(true);
                            }}
                            variant="secondary"
                        >
                            Show everything
                        </Button>
                    </div>
                )}
            </div>
        </Page>
    );
};

const Count = ({ label, value }: { label: string; value: number }) => (
    <div className="flex flex-col gap-1">
        <dt className="text-neutral-600 text-xs">{label}</dt>
        <dd className="font-medium text-3xl text-neutral-950 tabular-nums tracking-[-0.01em]">
            {value}
        </dd>
    </div>
);

type TileProps = {
    entry: Entry;
    href: string;
    onOpen: () => void;
};

/** A component's live preview as a tile; the whole tile opens its page. */
const Tile = ({
    entry: { name, description, span, stageClassName, category, knobs, Preview },
    href,
    onOpen,
}: TileProps) => (
    <PreviewTile
        badge={<Badge>{categoryLabel(category)}</Badge>}
        className={cn(span === 2 && 'md:col-span-2', span === 3 && 'md:col-span-2 xl:col-span-3')}
        description={description}
        href={href}
        name={name}
        onOpen={onOpen}
        stageClassName={stageClassName}
    >
        <Preview knobs={knobDefaults(knobs)} />
    </PreviewTile>
);

type ComponentPageProps = {
    entry: Entry;
    onOpen: (id?: string) => void;
};

/** A piece of a product in a 16:9 frame, centred; a piece taller than the frame grows it. */
const Piece = ({ piece }: { piece: InUse }) =>
    piece.bare ? (
        piece.render()
    ) : (
        // The tile's surface without its rule that stretches children: a card keeps its own width.
        <div
            className={cn(
                'flex aspect-video min-w-0 flex-col items-center justify-center rounded-item border border-neutral-200 bg-neutral-50 p-8',
                piece.canvas && 'bg-neutral-100',
            )}
        >
            {piece.render()}
        </div>
    );

/** One component: one variant in one state on the stage, one piece it is used in, then its neighbours. */
const ComponentPage = ({ entry, onOpen }: ComponentPageProps) => {
    const piece = inUseOf(entry.id);
    const index = entries.indexOf(entry);
    const previous = entries[index - 1];
    const next = entries[index + 1];
    const { Preview, knobs } = entry;

    return (
        <Page className="gap-12" width="wide">
            <DetailHeader
                aside={<Badge>{categoryLabel(entry.category)}</Badge>}
                description={entry.description}
                onBack={() => onOpen(undefined)}
                parent="Components"
                title={entry.name}
            />
            <KnobStage
                className={entry.hero}
                knobs={knobs}
                render={values => <Preview knobs={values} />}
            />
            {piece && (
                <Section
                    description={
                        <>
                            <span className="font-medium text-neutral-950">{piece.title}.</span>{' '}
                            {piece.note}
                        </>
                    }
                    title="In use"
                >
                    <Piece piece={piece} />
                </Section>
            )}
            <Neighbours
                label="Neighbouring components"
                next={next}
                onOpen={onOpen}
                previous={previous}
            />
        </Page>
    );
};

const GapTable = ({ gaps: rows }: { gaps: Gap[] }) => (
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead>Component</TableHead>
                <TableHead className="max-md:hidden">What it is for</TableHead>
                <TableHead className="max-lg:hidden">Built from</TableHead>
                <TableHead>Start</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {categories.map(({ id, label }) => {
                const inCategory = rows.filter(gap => gap.category === id);
                if (inCategory.length === 0) return null;

                return [
                    <TableGroupRow hint={inCategory.length} key={id}>
                        {label}
                    </TableGroupRow>,
                    ...inCategory.map(gap => (
                        <TableRow key={gap.name}>
                            <TableCell className="whitespace-nowrap">{gap.name}</TableCell>
                            <TableCell className="font-normal text-neutral-700 max-md:hidden">
                                {gap.description}
                            </TableCell>
                            <TableCell className="font-normal text-neutral-600 max-lg:hidden">
                                {gap.from}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                                <Badge tone={startBadge[gap.start].tone}>
                                    {startBadge[gap.start].label}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    )),
                ];
            })}
        </TableBody>
    </Table>
);
