import { Badge, Dock, DockItem } from 'continuum';
import { type CSSProperties, type ReactNode, useCallback, useEffect, useState } from 'react';
import { exampleSections } from './examples';
import {
    DetailHeader,
    Frame,
    FullScreen,
    FullScreenButton,
    Page,
    PageDock,
    PageHeader,
    Section,
    Stage,
    scrollToSection,
    usePageIndex,
    useScrollSpy,
} from './layout';
import { type AppState, toHash } from './meta';
import { screens } from './screens';
import { Neighbours, PreviewTile } from './showcase/detail';

type Kind = 'screen' | 'block';

type Item = {
    kind: Kind;
    id: string;
    title: string;
    description: ReactNode;
    /** `still` draws it as a shot: nothing opens on its own. */
    render: (still?: boolean) => ReactNode;
};

/** Whole screens first, then blocks: parts of earlier products that stand on their own. */
const items: Item[] = [
    ...screens.map(screen => ({ kind: 'screen' as const, ...screen })),
    ...exampleSections.map(example => ({
        kind: 'block' as const,
        id: example.id,
        title: example.title,
        description: example.description,
        render: example.render,
    })),
];

const kindLabel: Record<Kind, string> = { screen: 'Screen', block: 'Block' };

type PatternsProps = {
    state: AppState;
    onChange: (patch: Partial<AppState>) => void;
};

/**
 * Patterns: the generic screens and the blocks, each as a live shot in a tile. Either opens on
 * a page of its own, the way back above it and its neighbours below, as a component does.
 */
export const Patterns = ({ state, onChange }: PatternsProps) => {
    const item = items.find(entry => entry.id === state.screen);
    const { setIndex, setActive } = usePageIndex();
    const open = useCallback((id?: string) => onChange({ screen: id }), [onChange]);

    useEffect(() => {
        setIndex(
            items.map(entry => ({
                id: entry.id,
                title: entry.title,
                group: entry.kind === 'screen' ? 'Screens' : 'Blocks',
            })),
            { label: 'Patterns', onSelect: open },
        );
        return () => {
            setIndex([]);
            setActive(undefined);
        };
    }, [open, setIndex, setActive]);

    useEffect(() => {
        setActive(item?.id);
    }, [item, setActive]);

    return item ? (
        <ItemPage item={item} key={item.id} onOpen={open} radius={state.radius} />
    ) : (
        <PatternsIndex onOpen={open} state={state} />
    );
};

const groups = [
    { id: 'pt-screens', title: 'Screens', items: items.filter(item => item.kind === 'screen') },
    { id: 'pt-blocks', title: 'Blocks', items: items.filter(item => item.kind === 'block') },
];

const groupIds = groups.map(group => group.id);

type IndexProps = {
    state: AppState;
    onOpen: (id?: string) => void;
};

/** The screens and then the blocks, each a tile with a live shot; the bar jumps between the two. */
const PatternsIndex = ({ state, onOpen }: IndexProps) => {
    const [current, setCurrent] = useState<string>();
    useScrollSpy(groupIds, setCurrent);

    return (
        <Page width="dense">
            <PageHeader
                description="Whole screens of one generic app, and the blocks of earlier products, all built from the system's components alone. Every one follows the mode and the theme previewed from the pill at the foot; open one to use it."
                title="Patterns"
            />
            <div className="flex min-w-0 flex-col gap-20">
                {groups.map(group => (
                    <Section
                        id={group.id}
                        key={group.id}
                        title={
                            <span className="flex items-center gap-2.5">
                                {group.title}
                                <Badge variant="count">{group.items.length}</Badge>
                            </span>
                        }
                    >
                        <div className="grid gap-4 lg:grid-cols-2">
                            {group.items.map(item => (
                                <PatternTile
                                    href={toHash({ ...state, screen: item.id })}
                                    item={item}
                                    key={item.id}
                                    onOpen={() => onOpen(item.id)}
                                    radius={state.radius}
                                />
                            ))}
                        </div>
                    </Section>
                ))}
            </div>
            <PageDock>
                <Dock
                    aria-label="Screens and blocks"
                    onValueChange={scrollToSection}
                    value={current ?? groupIds[0]}
                >
                    {groups.map(group => (
                        <DockItem key={group.id} value={group.id}>
                            {group.title}
                        </DockItem>
                    ))}
                </Dock>
            </PageDock>
        </Page>
    );
};

/** The playground's own corners, on a container round a pattern, whatever the theme previews. */
export const ownCorners = { '--continuum-radius-scale': 1 } as CSSProperties;

/** The previewed theme's corners again, on the pattern inside such a container. */
export const themeCorners = (radius: number) =>
    ({ '--continuum-radius-scale': radius }) as CSSProperties;

// Each kind at the size it is drawn at, and the scale of its shot in a tile.
const shot = {
    screen: { width: 1440, height: 900, scale: 0.6 },
    block: { width: 840, height: 520, scale: 0.75 },
} as const;

type TileProps = {
    item: Item;
    href: string;
    onOpen: () => void;
    /** The previewed corner scale, for the pattern inside; the tile keeps the playground's. */
    radius: number;
};

/**
 * A pattern's tile, laid out as a component's is: its kind at the top, a live shot on a stage
 * and its name in a well below. The shot sits at a fixed size, 40px in from the stage's left
 * and 24px from its top, and runs off its right and its foot.
 */
const PatternTile = ({ item, href, onOpen, radius }: TileProps) => {
    const { width, height, scale } = shot[item.kind];

    return (
        <div className="min-w-0" style={ownCorners}>
            <PreviewTile
                badge={<Badge>{kindLabel[item.kind]}</Badge>}
                description={item.description}
                href={href}
                name={item.title}
                onOpen={onOpen}
                stageClassName="h-72 items-start justify-start p-0"
            >
                <div
                    className="absolute top-6 left-10 overflow-hidden rounded-tl-item border-neutral-200 border-t border-l bg-neutral-50"
                    style={{ width: width * scale, height: height * scale }}
                >
                    <div
                        className="origin-top-left"
                        style={{ width, height, scale: String(scale), ...themeCorners(radius) }}
                    >
                        {item.kind === 'screen' ? (
                            item.render(true)
                        ) : (
                            // A block keeps its own width and sits flush left, as it would on a page.
                            <div className="h-full p-8 *:max-w-full">{item.render()}</div>
                        )}
                    </div>
                </div>
            </PreviewTile>
        </div>
    );
};

type ItemPageProps = {
    item: Item;
    onOpen: (id?: string) => void;
    /** The previewed corner scale, for the pattern; its container keeps the playground's. */
    radius: number;
};

/**
 * One screen or block on a page of its own, as a component's page is: the way back and what
 * it is, the thing itself, live, then its neighbours of the same kind.
 */
const ItemPage = ({ item, onOpen, radius }: ItemPageProps) => {
    const siblings = items.filter(entry => entry.kind === item.kind);
    const index = siblings.indexOf(item);
    const neighbour = (entry?: Item) => entry && { id: entry.id, name: entry.title };
    const [full, setFull] = useState(false);

    return (
        <Page className="gap-10" width={item.kind === 'screen' ? 'dense' : 'wide'}>
            <DetailHeader
                // A screen is judged as it opens, at the window's size; a block has no window of its own.
                aside={item.kind === 'screen' && <FullScreenButton onOpen={() => setFull(true)} />}
                description={item.description}
                onBack={() => onOpen(undefined)}
                parent="Patterns"
                title={item.title}
            />
            {full && <FullScreen onClose={() => setFull(false)}>{item.render()}</FullScreen>}
            {item.kind === 'screen' ? (
                // At its design size where the page is wide enough, scaled to it where it is not.
                <div style={ownCorners}>
                    <Frame designHeight={900} designWidth={1440}>
                        <div className="contents" style={themeCorners(radius)}>
                            {item.render()}
                        </div>
                    </Frame>
                </div>
            ) : (
                <Stage className="min-h-120" style={ownCorners}>
                    <div className="contents" style={themeCorners(radius)}>
                        {item.render()}
                    </div>
                </Stage>
            )}
            <Neighbours
                label={item.kind === 'screen' ? 'Neighbouring screens' : 'Neighbouring blocks'}
                next={neighbour(siblings[index + 1])}
                onOpen={onOpen}
                previous={neighbour(siblings[index - 1])}
            />
        </Page>
    );
};
