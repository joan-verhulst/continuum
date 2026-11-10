import { Badge, Dock, DockItem } from 'continuum';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
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
import { type ScreenId, type ScreenNav, ScreenNavProvider } from './screens/shared';
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
    // Full screen is kept here, above the item's page, so a link inside a screen can open the next
    // screen without leaving it.
    const [full, setFull] = useState(false);
    const [customer, setCustomer] = useState<string>();
    const open = useCallback(
        (id?: string) => {
            if (!id) setFull(false);
            onChange({ screen: id });
        },
        [onChange],
    );
    // How a live screen opens another of the app: the page and its link follow.
    const nav = useMemo<ScreenNav>(
        () => ({
            open: (id: ScreenId, next?: string) => {
                setCustomer(next);
                open(id);
            },
            customer,
        }),
        [open, customer],
    );

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
        // Leaving the screens, by the browser's back as well, leaves full screen with them.
        if (item?.kind !== 'screen') setFull(false);
    }, [item, setActive]);

    if (!item) return <PatternsIndex onOpen={open} state={state} />;

    return (
        <>
            <ItemPage
                item={item}
                key={item.id}
                nav={nav}
                onFull={() => setFull(true)}
                onOpen={open}
            />
            {full && (
                <FullScreen onClose={() => setFull(false)}>
                    <ScreenNavProvider value={nav}>{item.render()}</ScreenNavProvider>
                </FullScreen>
            )}
        </>
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
                description="Whole screens of one generic app, and the blocks of earlier products, all built from the system's components alone. Every one follows the mode and the theme of the project picked in the sidebar; open one to use it."
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

// Each kind at the size it is drawn at, and the scale of its shot in a tile.
const shot = {
    screen: { width: 1440, height: 900, scale: 0.6 },
    block: { width: 840, height: 520, scale: 0.75 },
} as const;

type TileProps = {
    item: Item;
    href: string;
    onOpen: () => void;
};

/**
 * A pattern's tile, laid out as a component's is: its kind at the top, a live shot on a stage
 * and its name in a well below. The shot sits at a fixed size, 40px in from the stage's left
 * and 24px from its top, and runs off its right and its foot.
 */
const PatternTile = ({ item, href, onOpen }: TileProps) => {
    const { width, height, scale } = shot[item.kind];

    return (
        <div className="min-w-0">
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
                        style={{ width, height, scale: String(scale) }}
                    >
                        {item.kind === 'screen' ? (
                            item.render(true)
                        ) : (
                            // A block keeps its own width and sits flush left, as it would on a page.
                            <div className="h-full p-8 [:where(&>*)]:max-w-full">
                                {item.render()}
                            </div>
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
    /** Lets the live screen open the app's other screens. */
    nav: ScreenNav;
    onFull: () => void;
};

/**
 * One screen or block on a page of its own, as a component's page is: the way back and what
 * it is, the thing itself, live, then its neighbours of the same kind.
 */
const ItemPage = ({ item, onOpen, nav, onFull }: ItemPageProps) => {
    const siblings = items.filter(entry => entry.kind === item.kind);
    const index = siblings.indexOf(item);
    const neighbour = (entry?: Item) => entry && { id: entry.id, name: entry.title };

    return (
        <Page className="gap-10" width={item.kind === 'screen' ? 'dense' : 'wide'}>
            <DetailHeader
                // A screen is judged as it opens, at the window's size; a block has no window of its own.
                aside={item.kind === 'screen' && <FullScreenButton onOpen={onFull} />}
                description={item.description}
                onBack={() => onOpen(undefined)}
                parent="Patterns"
                title={item.title}
            />
            {item.kind === 'screen' ? (
                // At its design size where the page is wide enough, scaled to it where it is not.
                <Frame designHeight={900} designWidth={1440}>
                    <ScreenNavProvider value={nav}>{item.render()}</ScreenNavProvider>
                </Frame>
            ) : (
                <Stage className="min-h-120">{item.render()}</Stage>
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
