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
import { type ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
    DetailHeader,
    type Device,
    DeviceControl,
    devices,
    OverlayLayer,
    Page,
    PageDock,
    PageHeader,
    Section,
    scrollToSection,
    useDevice,
    usePageIndex,
    useScrollSpy,
} from '../layout';
import { type AppState, toHash } from '../meta';
import { KnobStage, Neighbours, PreviewTile } from './detail';
import { entries, inUseOf } from './entries';
import { type Gap, type GapStart, gaps } from './gaps';
import type { InUse } from './kit';
import { type Category, categories, type Entry, knobDefaults } from './kit';

const icon = { strokeWidth: 2 } as const;

const startBadge: Record<GapStart, { label: string; tone: 'primary' | 'success' | 'neutral' }> = {
    recipe: { label: 'Recipe in patterns', tone: 'primary' },
    compose: { label: 'Compose existing', tone: 'success' },
    new: { label: 'New component', tone: 'neutral' },
};

const matches = (query: string, ...fields: string[]) =>
    fields.some(field => field.toLowerCase().includes(query));

const categoryLabel = (id: Category) => categories.find(entry => entry.id === id)?.label ?? id;

/*
 * What the grid was showing when a component was opened: the gaps switch and the tile last opened.
 * Kept outside the grid, so coming back finds the grid as it was left, scrolled to that tile. The
 * search lives in the app's state, one query with the sidebar's.
 */
const gridMemory: { showGaps: boolean; opened?: string } = {
    showGaps: false,
};

const tileId = (id: string) => `c-${id}`;

/*
 * Charts are kept apart from the components everywhere, and the playground is no exception:
 * the same machinery draws both views, over its own half of the entries.
 */
type Kind = 'components' | 'charts';

const shelf: Record<Kind, { title: string; description: string; label: string }> = {
    components: {
        title: 'Components',
        label: 'Components',
        description:
            'Every component, live, in the theme of the project picked at the top of the sidebar. Open one for its variants and states.',
    },
    charts: {
        title: 'Charts',
        label: 'Charts',
        description:
            'The chart kit, a separate entry from the library (continuum/charts), live in the theme of the project picked at the top of the sidebar. Open one for its variants and states.',
    },
};

const entriesOf = (kind: Kind) =>
    entries.filter(entry => (entry.category === 'charts') === (kind === 'charts'));

const gapsOf = (kind: Kind) =>
    gaps.filter(gap => (gap.category === 'charts') === (kind === 'charts'));

type ShowcaseProps = {
    state: AppState;
    onChange: (patch: Partial<AppState>) => void;
};

/** Every component as a tile; a tile opens the component's own page, with its variants and states. */
export const Components = (props: ShowcaseProps) => <Showcase {...props} kind="components" />;

/** The chart kit, the same way: its own tab, never mixed in with the parts. */
export const Charts = (props: ShowcaseProps) => <Showcase {...props} kind="charts" />;

const Showcase = ({ state, onChange, kind }: ShowcaseProps & { kind: Kind }) => {
    const shown = useMemo(() => entriesOf(kind), [kind]);
    const entry = shown.find(item => item.id === state.component);
    const { setIndex, setActive } = usePageIndex();
    const open = useCallback(
        (id?: string) => {
            if (id) gridMemory.opened = id;
            onChange({ component: id });
        },
        [onChange],
    );

    // The sidebar lists this view's own entries; picking one opens its page.
    useEffect(() => {
        setIndex(
            shown.map(item => ({
                id: item.id,
                title: item.name,
                group: categoryLabel(item.category),
            })),
            { label: shelf[kind].label, onSelect: open },
        );
        return () => {
            setIndex([]);
            setActive(undefined);
        };
    }, [kind, open, setIndex, setActive, shown]);

    useEffect(() => {
        setActive(entry?.id);
    }, [entry, setActive]);

    return entry ? (
        <ComponentPage entry={entry} key={entry.id} onOpen={open} />
    ) : (
        <ComponentsGrid
            kind={kind}
            onOpen={open}
            onSearch={search => onChange({ search })}
            state={state}
        />
    );
};

type GridProps = {
    state: AppState;
    kind: Kind;
    onOpen: (id?: string) => void;
    /** The search changed; the sidebar's list follows it. */
    onSearch: (search: string) => void;
};

const ComponentsGrid = ({ state, kind, onOpen, onSearch: setQuery }: GridProps) => {
    const query = state.search ?? '';
    const [showGaps, setShowGaps] = useState(gridMemory.showGaps);
    const q = query.trim().toLowerCase();

    useEffect(() => {
        gridMemory.showGaps = showGaps;
    }, [showGaps]);

    // Back from a component, the tile it was opened from is where the eye left it. A frame later,
    // since the shell sends every new page to its top after this runs; once only, so the grid
    // reached again from another page starts at its top.
    useEffect(() => {
        const opened = gridMemory.opened;
        if (!opened) return;
        const frame = requestAnimationFrame(() => {
            gridMemory.opened = undefined;
            document.getElementById(tileId(opened))?.scrollIntoView({ block: 'center' });
        });
        return () => cancelAnimationFrame(frame);
    }, []);

    const shown = entriesOf(kind).filter(entry => matches(q, entry.name, entry.description));
    const missing = showGaps
        ? gapsOf(kind).filter(gap => matches(q, gap.name, gap.description, gap.from))
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
                        <Count label={shelf[kind].label} value={entriesOf(kind).length} />
                        <Count label="Not built yet" value={gapsOf(kind).length} />
                    </dl>
                }
                description={shelf[kind].description}
                title={shelf[kind].title}
            />
            {groups.length > 1 && (
                <PageDock>
                    <Dock
                        aria-label="Categories"
                        // Thirteen categories would run the width of the page; a few at a time, with chevrons.
                        className="max-w-140"
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
                    aria-label={`Search ${shelf[kind].label.toLowerCase()}`}
                    className="w-full sm:w-60"
                    leadingIcon={<Search {...icon} />}
                    onChange={event => setQuery(event.target.value)}
                    placeholder={`Search ${shelf[kind].label.toLowerCase()}`}
                    size="sm"
                    value={query}
                />
                <Field className="ml-auto flex-row items-center gap-2.5">
                    <Switch checked={showGaps} onCheckedChange={setShowGaps} />
                    <FieldLabel className="cursor-pointer">Show what is missing</FieldLabel>
                </Field>
            </div>

            <div className="flex min-w-0 flex-col gap-20">
                {groups.map(group => {
                    const tiles = (
                        <div
                            className={cn(
                                'grid gap-4 md:grid-cols-2',
                                // Charts are cards of one size, two to a row; components vary, three.
                                group.entries[0]?.category !== 'charts' && 'xl:grid-cols-3',
                            )}
                            key={group.id}
                        >
                            {group.entries.map(entry => (
                                <Tile
                                    entry={entry}
                                    href={toHash({ ...state, component: entry.id })}
                                    key={entry.id}
                                    named={groups.length > 1}
                                    onOpen={() => onOpen(entry.id)}
                                />
                            ))}
                        </div>
                    );

                    // One group is the view itself: its heading would only repeat the page's title.
                    return groups.length === 1 ? (
                        <div id={`s-${group.id}`} key={group.id}>
                            {tiles}
                        </div>
                    ) : (
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
                            {tiles}
                        </Section>
                    );
                })}

                {missing.length > 0 && (
                    <Section
                        description="Components a product library usually carries that Continuum does not have yet, and where each would start: a recipe already written in the skill’s patterns (patterns.md), parts that exist and only need composing, or a new component."
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
    /** Whether the tile wears its category: on a page of one category it would say the same thing. */
    named: boolean;
    onOpen: () => void;
};

/** The width every chart card is laid out at in a tile, before it is scaled to fit. */
const SHOT_WIDTH = 640;

/**
 * A chart's card as a shot: every card is laid out at the same width, whatever its own, and
 * then scaled as one picture to the tile, so a page of them reads as one set. Scaled, not
 * squeezed: a card pressed into a tile's height would let its chart run out of it.
 */
const FitShot = ({ children }: { children: ReactNode }) => {
    const [room, setRoom] = useState<HTMLDivElement | null>(null);
    const [subject, setSubject] = useState<HTMLDivElement | null>(null);
    const [fit, setFit] = useState({ scale: 1, height: 0 });

    useLayoutEffect(() => {
        if (!room || !subject) return;
        const fit = () => {
            // Layout sizes, which the transform leaves alone. Fitted to the tile's width alone,
            // so every card is as wide as the next; the tile is as tall as its card comes out.
            const scale = Math.min(1, room.clientWidth / SHOT_WIDTH);
            setFit({ scale, height: subject.offsetHeight * scale });
        };
        fit();
        const observer = new ResizeObserver(fit);
        observer.observe(room);
        observer.observe(subject);
        return () => observer.disconnect();
    }, [room, subject]);

    return (
        <div
            className="flex w-full min-w-0 items-center justify-center self-center"
            ref={setRoom}
            style={{ height: fit.height || undefined }}
        >
            <div
                className="flex shrink-0 items-center justify-center *:w-full *:max-w-none"
                ref={setSubject}
                style={{ transform: `scale(${fit.scale})`, width: SHOT_WIDTH }}
            >
                {children}
            </div>
        </div>
    );
};

/** A component's live preview as a tile; the whole tile opens its page. */
const Tile = ({
    entry: { id, name, description, span, stageClassName, category, knobs, Preview },
    href,
    named,
    onOpen,
}: TileProps) => {
    // A chart's preview is a whole card: the tile shows all of it, smaller, on a taller stage.
    const card = category === 'charts';

    return (
        <PreviewTile
            badge={named ? <Badge>{categoryLabel(category)}</Badge> : undefined}
            className={cn(
                !card && span === 2 && 'md:col-span-2',
                !card && span === 3 && 'md:col-span-2 xl:col-span-3',
            )}
            description={description}
            href={href}
            id={tileId(id)}
            name={name}
            onOpen={onOpen}
            stageClassName={cn(stageClassName, card && 'h-auto flex-1 items-stretch p-5')}
        >
            {card ? (
                <FitShot>
                    <Preview knobs={knobDefaults(knobs)} />
                </FitShot>
            ) : (
                <Preview knobs={knobDefaults(knobs)} />
            )}
        </PreviewTile>
    );
};

type ComponentPageProps = {
    entry: Entry;
    onOpen: (id?: string) => void;
};

/** A piece of a product in a 16:9 frame, centred; a piece taller than the frame grows it. */
const Piece = ({ piece, device }: { piece: InUse; device: Device }) =>
    device !== 'desktop' ? (
        <NarrowPiece device={device} piece={piece} />
    ) : piece.bare ? (
        piece.render()
    ) : piece.app ? (
        // A page of the app, edge to edge: the window is the frame.
        <div className="aspect-video min-w-0 overflow-hidden rounded-item border border-neutral-200">
            {piece.render()}
        </div>
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

/**
 * The same piece in a box a tablet or a phone wide, centred in the room the desktop frame takes
 * and as tall. The box is a shell container, so the piece narrows as it would on that screen
 * while the page around it stays as it is; a piece taller than the box still grows it.
 */
const NarrowPiece = ({ piece, device }: { piece: InUse; device: Exclude<Device, 'desktop'> }) => {
    const width = { width: devices[device].width };

    return (
        <div className="flex aspect-video min-w-0 items-start justify-center">
            {piece.bare ? (
                // A scene draws its own stage, hairline and all: it fills the box's height instead of
                // keeping its 16:9.
                <div
                    className="@container/shell max-w-full self-stretch *:aspect-auto *:h-full"
                    style={width}
                >
                    {piece.render()}
                </div>
            ) : piece.app ? (
                <div
                    className="@container/shell relative max-w-full self-stretch overflow-hidden rounded-item border border-neutral-200 bg-neutral-50"
                    style={width}
                >
                    <OverlayLayer>{piece.render()}</OverlayLayer>
                </div>
            ) : (
                <div
                    className={cn(
                        '@container/shell relative flex min-h-full max-w-full flex-col items-center justify-center rounded-item border border-neutral-200 bg-neutral-50',
                        device === 'phone' ? 'p-4' : 'p-8',
                        piece.canvas && 'bg-neutral-100',
                    )}
                    style={width}
                >
                    <OverlayLayer>{piece.render()}</OverlayLayer>
                </div>
            )}
        </div>
    );
};

/** One component: one variant in one state on the stage, one piece it is used in, then its neighbours. */
const ComponentPage = ({ entry, onOpen }: ComponentPageProps) => {
    const piece = inUseOf(entry.id);
    const index = entries.indexOf(entry);
    const previous = entries[index - 1];
    const next = entries[index + 1];
    const { Preview, knobs } = entry;
    const [device, setDevice] = useDevice();

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
                    aside={<DeviceControl onChange={setDevice} value={device} />}
                    description={
                        <>
                            <span className="font-medium text-neutral-950">{piece.title}.</span>{' '}
                            {piece.note}
                        </>
                    }
                    title="In use"
                >
                    <Piece device={device} piece={piece} />
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
