import { cn, PageContent, SegmentedControl, SegmentedControlItem, Switch } from '@contui/ui';
import {
    type CSSProperties,
    Fragment,
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { Labelled } from '../../showcase/kit';
import { Findings } from './findings';
import { type Area, areasOf, type Measured, measure, round } from './measure';
import { type Piece, pieces } from './pieces';

type Box = { x: number; y: number; w: number; h: number };

type Layout = {
    measured: Record<string, Measured>;
    boxes: Record<string, Box>;
    areas: Record<string, Area[]>;
};

type Options = {
    guides: boolean;
    outlines: boolean;
    spacing: boolean;
    grid: boolean;
    inspector: boolean;
};

type GroupBy = 'height' | 'family';

/** The wall keeps to the small parts: anything that measures taller than this is left off. */
const TALLEST = 40;

const familyOrder = new Map<string, number>();
for (const piece of pieces)
    if (!familyOrder.has(piece.family)) familyOrder.set(piece.family, familyOrder.size);

const indexOf = new Map(pieces.map((piece, index) => [piece.id, index]));

/** The wall's order: by measured height then family, or by family then height. */
const orderOf = (
    shown: Piece[],
    measured: Record<string, Measured> | undefined,
    groupBy: GroupBy,
) => {
    const h = (piece: Piece) => measured?.[piece.id]?.h ?? 0;
    const family = (piece: Piece) => familyOrder.get(piece.family) ?? 0;
    const index = (piece: Piece) => indexOf.get(piece.id) ?? 0;
    return [...shown].sort((a, b) =>
        groupBy === 'height'
            ? h(a) - h(b) || family(a) - family(b) || index(a) - index(b)
            : family(a) - family(b) || h(a) - h(b) || index(a) - index(b),
    );
};

/** The pieces in runs: one a height, or one a family. */
const groupsOf = (
    ordered: Piece[],
    measured: Record<string, Measured> | undefined,
    groupBy: GroupBy,
) => {
    const groups: { label: string; pieces: Piece[] }[] = [];
    for (const piece of ordered) {
        const label = groupBy === 'height' ? String(measured?.[piece.id]?.h ?? '') : piece.family;
        const last = groups[groups.length - 1];
        if (last && last.label === label) last.pieces.push(piece);
        else groups.push({ label, pieces: [piece] });
    }
    return groups;
};

/** The value most of a list shares. */
const modeOf = (values: number[]) => {
    const counts = new Map<number, number>();
    for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
};

/** The faint 4 grid with every 16th line stronger, behind the wall. */
const gridStyle: CSSProperties = {
    backgroundImage: [
        'linear-gradient(to right, color-mix(in oklab, var(--color-neutral-950) 10%, transparent) 1px, transparent 1px)',
        'linear-gradient(to bottom, color-mix(in oklab, var(--color-neutral-950) 10%, transparent) 1px, transparent 1px)',
        'linear-gradient(to right, color-mix(in oklab, var(--color-neutral-950) 4%, transparent) 1px, transparent 1px)',
        'linear-gradient(to bottom, color-mix(in oklab, var(--color-neutral-950) 4%, transparent) 1px, transparent 1px)',
    ].join(','),
    backgroundSize: '64px 64px, 64px 64px, 4px 4px, 4px 4px',
};

/** Devtools' outline mode, on every element inside a piece; outlines take no room. */
const outlineCss =
    '[data-wall-outlines] [data-piece] *{outline:1px solid color-mix(in oklab,var(--color-primary-500) 45%,transparent);outline-offset:-1px}';

/** A wrapped line of pieces of one height, for its guides. */
type Line = { h: number; x: number; y: number; w: number; baseline?: number };

/** The lines the wall has wrapped into: pieces of one height that share a top. */
const linesOf = (groups: { pieces: Piece[] }[], layout: Layout) => {
    const lines: Line[] = [];
    for (const group of groups) {
        const rows = new Map<string, Piece[]>();
        for (const piece of group.pieces) {
            const box = layout.boxes[piece.id];
            const h = layout.measured[piece.id]?.h;
            if (!box || h === undefined) continue;
            const key = `${round(box.y)}:${h}`;
            rows.set(key, [...(rows.get(key) ?? []), piece]);
        }
        for (const row of rows.values()) {
            const boxes = row.map(piece => layout.boxes[piece.id]).filter((b): b is Box => !!b);
            const first = boxes[0];
            const h = row[0] && layout.measured[row[0].id]?.h;
            if (!first || h === undefined) continue;
            const left = Math.min(...boxes.map(b => b.x));
            const right = Math.max(...boxes.map(b => b.x + b.w));
            const baselines = row
                .map(piece => layout.measured[piece.id]?.baseline)
                .filter((value): value is number => value !== undefined);
            lines.push({ h, x: left, y: first.y, w: right - left, baseline: modeOf(baselines) });
        }
    }
    return lines;
};

/**
 * Every small part, packed like a collage but flat and straight: pieces flow and wrap 8 apart, at
 * their own size, ordered by measured height so each height forms its own run of lines. Tools to
 * compare them sit on top: guides at each line's top, centre, baseline and bottom, outlines, the
 * padding and gaps, a 4 grid and a readout under the pointer, with a table of what was measured
 * under it all.
 */
export const WallLab = () => {
    const bodies = useRef(new Map<string, HTMLDivElement>());
    const wall = useRef<HTMLDivElement>(null);
    const [layout, setLayout] = useState<Layout>();
    const [groupBy, setGroupBy] = useState<GroupBy>('height');
    // A link can open the wall bare (overlays=off) or with a piece inspected (inspect=button).
    const [linked] = useState(() => new URLSearchParams(window.location.hash.replace(/^#/, '')));
    const [options, setOptions] = useState<Options>(() => {
        const on = linked.get('overlays') !== 'off';
        return { guides: on, outlines: on, spacing: on, grid: on, inspector: true };
    });
    const [hovered, setHovered] = useState<string | undefined>(
        () => linked.get('inspect') ?? undefined,
    );
    // Pieces found taller than the wall keeps; once left off they stay off, so nothing flickers.
    const [tooTall, setTooTall] = useState<Set<string>>(() => new Set());

    const run = useCallback(() => {
        const frame = wall.current;
        if (!frame) return;
        const origin = frame.getBoundingClientRect();
        const next: Layout = { measured: {}, boxes: {}, areas: {} };
        const tall: string[] = [];
        for (const piece of pieces) {
            const body = bodies.current.get(piece.id);
            if (!body) continue;
            const measured = measure(body, piece);
            if (measured.h > TALLEST) {
                tall.push(piece.id);
                continue;
            }
            next.measured[piece.id] = measured;
            const rect = body.getBoundingClientRect();
            next.boxes[piece.id] = {
                x: rect.left - origin.left,
                y: rect.top - origin.top,
                w: rect.width,
                h: rect.height,
            };
            next.areas[piece.id] = areasOf(body, origin);
        }
        if (tall.length > 0) setTooTall(current => new Set([...current, ...tall]));
        setLayout(current =>
            current && JSON.stringify(current) === JSON.stringify(next) ? current : next,
        );
    }, []);

    // Measured once drawn, after the fonts, once things have settled, and on every resize.
    useEffect(() => {
        let live = true;
        const settle = () => {
            if (live) run();
        };
        settle();
        document.fonts.ready.then(settle);
        const timers = [setTimeout(settle, 600), setTimeout(settle, 1500)];
        window.addEventListener('resize', run);
        return () => {
            live = false;
            for (const timer of timers) clearTimeout(timer);
            window.removeEventListener('resize', run);
        };
    }, [run]);

    const shown = pieces.filter(piece => !tooTall.has(piece.id));
    const measured = layout?.measured;
    const ordered = orderOf(shown, measured, groupBy);
    const groups = groupsOf(ordered, measured, groupBy);
    const orderKey = ordered.map(piece => piece.id).join();

    // Once the order changes, the pieces have moved: measure where they are now.
    // biome-ignore lint/correctness/useExhaustiveDependencies: runs when the order or grouping changes
    useLayoutEffect(() => run(), [orderKey, groupBy, run]);

    // After an interaction a piece may change size (a chip removed, a hold run): measure again.
    const later = () => {
        requestAnimationFrame(run);
        setTimeout(run, 300);
    };

    const lines = layout ? linesOf(groups, layout) : [];
    const toggle = (key: keyof Options) => (on: boolean) =>
        setOptions(current => ({ ...current, [key]: on }));

    // Read live from the DOM as the pointer arrives, not from the last measure.
    const hoveredPiece = shown.find(piece => piece.id === hovered);
    const hoveredBody = hovered ? bodies.current.get(hovered) : undefined;
    const readout =
        options.inspector && hoveredPiece && hoveredBody
            ? measure(hoveredBody, hoveredPiece)
            : undefined;
    const readoutBox = hovered ? layout?.boxes[hovered] : undefined;
    const wallWidth = wall.current?.clientWidth ?? 0;

    return (
        <PageContent className="flex flex-col gap-6 pt-10 pb-24" width="inset">
            <style>{outlineCss}</style>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                <Labelled label="Guides">
                    <Switch checked={options.guides} onCheckedChange={toggle('guides')} />
                </Labelled>
                <Labelled label="Outlines">
                    <Switch checked={options.outlines} onCheckedChange={toggle('outlines')} />
                </Labelled>
                <Labelled label="Padding and gaps">
                    <Switch checked={options.spacing} onCheckedChange={toggle('spacing')} />
                </Labelled>
                <Labelled label="4px grid">
                    <Switch checked={options.grid} onCheckedChange={toggle('grid')} />
                </Labelled>
                <Labelled label="Inspector">
                    <Switch checked={options.inspector} onCheckedChange={toggle('inspector')} />
                </Labelled>
                <SegmentedControl
                    aria-label="Group by"
                    onValueChange={value => setGroupBy(value === 'family' ? 'family' : 'height')}
                    value={groupBy}
                >
                    <SegmentedControlItem value="height">By height</SegmentedControlItem>
                    <SegmentedControlItem value="family">By family</SegmentedControlItem>
                </SegmentedControl>
            </div>

            <div
                className={cn(
                    'relative flex flex-col gap-2',
                    // Out of sight until the first measure, so it never shows in the wrong order.
                    !layout && 'invisible',
                )}
                data-wall-outlines={options.outlines || undefined}
                onChange={later}
                onKeyUp={later}
                onPointerUp={later}
                ref={wall}
                style={options.grid ? gridStyle : undefined}
            >
                {groups.map(group => (
                    <div className="flex flex-wrap items-start gap-2" key={group.label}>
                        <span className="flex h-5 items-center whitespace-nowrap text-[11px] text-neutral-500 tabular-nums">
                            {group.label}
                        </span>
                        {group.pieces.map(piece => (
                            <Fragment key={piece.id}>
                                {/* Top-aligned and never stretched, so its height is the piece's own. */}
                                <div
                                    className="flex items-start self-start"
                                    data-piece={piece.id}
                                    onPointerEnter={() => setHovered(piece.id)}
                                    onPointerLeave={() =>
                                        setHovered(current =>
                                            current === piece.id ? undefined : current,
                                        )
                                    }
                                    ref={node => {
                                        if (node) bodies.current.set(piece.id, node);
                                        else bodies.current.delete(piece.id);
                                    }}
                                >
                                    {piece.node}
                                </div>
                            </Fragment>
                        ))}
                    </div>
                ))}

                {/* What is drawn over the pieces takes no pointer, so they stay live. */}
                <div aria-hidden className="pointer-events-none absolute inset-0 z-20">
                    {options.guides &&
                        lines.map(line => (
                            <div
                                className="absolute"
                                key={`${line.x}-${line.y}`}
                                style={{ left: line.x, top: line.y, width: line.w, height: line.h }}
                            >
                                <div className="absolute inset-x-0 top-0 h-px bg-primary-500/60" />
                                <div className="absolute inset-x-0 bottom-0 h-px bg-primary-500/60" />
                                <div
                                    className="absolute inset-x-0 border-primary-500/50 border-t border-dashed"
                                    style={{ top: round(line.h / 2) }}
                                />
                                {line.baseline !== undefined && (
                                    <div
                                        className="absolute inset-x-0 h-px bg-error-500/60"
                                        style={{ top: line.baseline }}
                                    />
                                )}
                            </div>
                        ))}
                    {options.spacing &&
                        layout &&
                        Object.values(layout.areas)
                            .flat()
                            .map(area => (
                                <div
                                    className={cn(
                                        'absolute flex items-center justify-center overflow-hidden font-medium text-[9px] leading-none',
                                        area.kind === 'padding'
                                            ? 'bg-success-500/25 text-success-800'
                                            : 'bg-primary-500/25 text-primary-800',
                                    )}
                                    key={`${area.kind}-${area.x}-${area.y}-${area.w}-${area.h}`}
                                    style={{
                                        left: area.x,
                                        top: area.y,
                                        width: area.w,
                                        height: area.h,
                                    }}
                                >
                                    {area.w >= 9 && area.h >= 9 ? area.value : ''}
                                </div>
                            ))}
                    {readout && readoutBox && (
                        <dl
                            className="absolute z-10 grid w-max grid-cols-[auto_auto] gap-x-3 gap-y-0.5 rounded-item bg-neutral-950 px-2.5 py-2 text-[11px] text-neutral-50 tabular-nums leading-4 shadow-float"
                            style={{
                                // Under the piece, kept inside the wall at its right edge.
                                left: Math.max(0, Math.min(readoutBox.x, wallWidth - 200)),
                                top: readoutBox.y + readoutBox.h + 8,
                            }}
                        >
                            <dt className="text-neutral-400">Size</dt>
                            <dd>
                                {readout.h} × {readout.w}
                            </dd>
                            <dt className="text-neutral-400">Padding</dt>
                            <dd>{readout.padding.join(' ')}</dd>
                            <dt className="text-neutral-400">Radius</dt>
                            <dd>{readout.radius}</dd>
                            <dt className="text-neutral-400">Text</dt>
                            <dd>{readout.font ?? '–'}</dd>
                            <dt className="text-neutral-400">Gap</dt>
                            <dd>{readout.gap ?? '–'}</dd>
                            <dt className="text-neutral-400">Icon</dt>
                            <dd>
                                {readout.icon ?? '–'}
                                {readout.iconGap !== undefined && `, ${readout.iconGap} to text`}
                            </dd>
                        </dl>
                    )}
                </div>
            </div>

            {measured && <Findings measured={measured} ordered={ordered} />}
        </PageContent>
    );
};
