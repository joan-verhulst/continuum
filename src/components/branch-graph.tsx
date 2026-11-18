'use client';

import { Tag } from 'lucide-react';
import {
    type ComponentProps,
    type KeyboardEvent,
    type ReactNode,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { cn } from '../lib/cn';

/* ---------- Data ---------- */

export type BranchGraphRef = {
    name: string;
    /** A branch moves with the work; a tag marks one commit for good. */
    kind?: 'branch' | 'tag';
    /** The branch checked out: its label is set in full ink. */
    current?: boolean;
    /** A remote's copy of a branch (`origin/main`): its label is muted. */
    remote?: boolean;
};

export type BranchGraphCommit = {
    id: string;
    /** The commits this one was made on: none for the first, one for most, two or more for a merge. */
    parents: readonly string[];
    message: ReactNode;
    author?: ReactNode;
    time?: Date;
    refs?: readonly BranchGraphRef[];
};

export type BranchGraphColumn = 'author' | 'hash' | 'time';

export type BranchGraphProps = Omit<ComponentProps<'div'>, 'onSelect'> & {
    /** Names the list for a screen reader. */
    'aria-label': string;
    /**
     * Newest first, every commit above the commits it was made on, as `git log --topo-order`
     * gives them. A parent that is not in the list (history cut short) keeps its lane running
     * off the foot.
     */
    commits: readonly BranchGraphCommit[];
    /** 34 rows for a long log, 41 for a short one read closely. */
    density?: 'compact' | 'default';
    /** The columns after the message, in this order. */
    columns?: readonly BranchGraphColumn[];
    /** The selected commit's id. With `onSelectedChange`, rows are picked by click or keyboard. */
    selected?: string | null;
    onSelectedChange?: (id: string) => void;
    /** Writes a commit's time; "12 Nov, 14:03" unless given. */
    formatTime?: (time: Date) => ReactNode;
    /** How many refs a row shows before it folds the rest into "+N". */
    maxRefs?: number;
    /**
     * The branch everything else is made from: its line keeps the leftmost lane, in neutral ink,
     * and the branches take the colours beside it. `main` or `master` when a commit carries one;
     * `null` for none.
     */
    trunk?: string | null;
    /**
     * A hairline frame on the surface, for the history as the page's list; off where a card or a
     * sheet already frames it.
     */
    framed?: boolean;
};

/* ---------- Lanes ---------- */

type Edge = { lane: number };

type RowGraph = {
    lane: number;
    /** Lanes running past this commit, top to foot. */
    through: number[];
    /** A child above runs down into the dot. */
    top: boolean;
    /** The first parent runs on down from the dot. */
    bottom: boolean;
    /** Lanes coming down that end here, turning in to the dot along its row: branches made from it. */
    joins: Edge[];
    /** Lanes leaving the dot along its row and turning down: the other parents of a merge. */
    splits: Edge[];
    merge: boolean;
};

/** Holds the leftmost lane for the trunk until its first commit comes. */
const RESERVED = '\u0000trunk';

/** The trunk's commits: its branch's commit and that commit's first parents, down the list. */
const trunkOf = (commits: readonly BranchGraphCommit[], trunk: string | null) => {
    const ids = new Set<string>();
    if (!trunk) return ids;
    const byId = new Map(commits.map(commit => [commit.id, commit]));
    let at = commits.find(commit =>
        commit.refs?.some(ref => ref.name === trunk && ref.kind !== 'tag'),
    );
    while (at && !ids.has(at.id)) {
        ids.add(at.id);
        const first = at.parents[0];
        at = first ? byId.get(first) : undefined;
    }
    return ids;
};

/**
 * Gives each commit a lane. A lane holds the commit it is waiting for; a commit takes the leftmost
 * lane waiting for it (or the first free one, at a branch tip), its first parent carries the lane on,
 * and every other parent of a merge takes the lane already waiting for it or a free one. The trunk's
 * commits keep the leftmost lane, so the line everything branches from runs straight down the edge.
 */
export const layoutBranchGraph = (
    commits: readonly BranchGraphCommit[],
    trunk: string | null = null,
) => {
    const onTrunk = trunkOf(commits, trunk);
    const lanes: (string | null)[] = onTrunk.size > 0 ? [RESERVED] : [];
    let width = 1;

    const freeLane = (taken: readonly number[]) => {
        const index = lanes.findIndex((id, i) => id === null && !taken.includes(i));
        if (index >= 0) return index;
        lanes.push(null);
        return lanes.length - 1;
    };

    const rows = commits.map((commit): RowGraph => {
        const waiting = lanes.flatMap((id, i) => (id === commit.id ? [i] : []));
        const lane = onTrunk.has(commit.id) ? 0 : (waiting[0] ?? freeLane([]));
        const before = [...lanes];
        const top = lanes[lane] === commit.id;
        const joining = waiting.filter(index => index !== lane);

        const [first, ...rest] = commit.parents;
        lanes[lane] = first ?? null;

        const splits: Edge[] = [];
        for (const parent of rest) {
            const found = lanes.indexOf(parent);
            if (found === lane) continue;
            // Not in a lane freed on this very row, so a lane coming in and one going out never share a stretch.
            const target =
                found >= 0
                    ? found
                    : onTrunk.has(parent) && lanes[0] === RESERVED
                      ? 0
                      : freeLane([lane, ...joining]);
            lanes[target] = parent;
            splits.push({ lane: target });
        }
        for (const index of joining) lanes[index] = null;

        const through = before.flatMap((id, i) =>
            id !== null && id !== RESERVED && i !== lane && !joining.includes(i) ? [i] : [],
        );

        while (lanes.length > 0 && lanes[lanes.length - 1] === null) lanes.pop();
        width = Math.max(width, before.length, lanes.length, lane + 1);

        return {
            lane,
            through,
            top,
            bottom: first != null,
            joins: joining.map(index => ({ lane: index })),
            splits,
            merge: commit.parents.length > 1,
        };
    });

    return { rows, width };
};

/* ---------- Drawing ---------- */

/** From the frame's edge to the first lane's centre. */
const INSET = 16;
/** Between two lanes' centres. */
const PITCH = 16;
/** The corner where a line turns from its row into a lane. */
const TURN = 6;
const DOT = 4;
/** The break a line along a row leaves where it crosses a lane. */
const BREAK = 3;
const STROKE = 1.5;

const LANE_COLORS = [
    'var(--color-neutral-400)',
    'var(--color-chart-series-1)',
    'var(--color-chart-series-2)',
    'var(--color-chart-series-3)',
    'var(--color-chart-series-4)',
];

/**
 * A lane's colour, by its place: the leftmost lane, where the line the log was read from runs, is
 * the neutral ink, and the lanes beside it take the series colours in turn.
 */
const laneColor = (lane: number) =>
    lane === 0 ? LANE_COLORS[0] : LANE_COLORS[1 + ((lane - 1) % (LANE_COLORS.length - 1))];

const laneX = (lane: number) => INSET + lane * PITCH;

/** A line along the dot's row from `from` to `to`, broken where it crosses a lane running past. */
const rowLine = (
    from: number,
    to: number,
    cy: number,
    crossing: readonly number[],
    move = true,
) => {
    const dir = Math.sign(to - from);
    const stops = crossing
        .map(laneX)
        .filter(x => (x - from) * dir > 0 && (to - x) * dir > 0)
        .sort((a, b) => (a - b) * dir);
    let d = move ? `M${from} ${cy}` : '';
    for (const x of stops) d += ` H${x - dir * BREAK} M${x + dir * BREAK} ${cy}`;
    return `${d} H${to}`;
};

const RowGraphic = ({
    row,
    width,
    height,
    selected,
}: {
    row: RowGraph;
    width: number;
    height: number;
    selected: boolean;
}) => {
    const cy = height / 2;
    const x = laneX(row.lane);
    const ink = laneColor(row.lane);
    const line = { fill: 'none', strokeWidth: STROKE, strokeLinecap: 'round' } as const;

    return (
        <svg
            aria-hidden="true"
            className="block shrink-0 overflow-visible"
            height={height}
            width={width}
        >
            {row.joins.map(({ lane }) => {
                const lx = laneX(lane);
                const dir = Math.sign(x - lx);
                return (
                    <path
                        {...line}
                        d={`M${lx} 0 V${cy - TURN} Q${lx} ${cy} ${lx + dir * TURN} ${cy}${rowLine(lx + dir * TURN, x - dir * DOT, cy, row.through, false)}`}
                        key={`j${lane}`}
                        stroke={laneColor(lane)}
                    />
                );
            })}
            {row.splits.map(({ lane }) => {
                const lx = laneX(lane);
                const dir = Math.sign(lx - x);
                return (
                    <path
                        {...line}
                        d={`${rowLine(x + dir * DOT, lx - dir * TURN, cy, row.through)} Q${lx} ${cy} ${lx} ${cy + TURN} V${height}`}
                        key={`s${lane}`}
                        stroke={laneColor(lane)}
                    />
                );
            })}
            {row.through.map(lane => (
                <path
                    {...line}
                    d={`M${laneX(lane)} 0 V${height}`}
                    key={`t${lane}`}
                    stroke={laneColor(lane)}
                />
            ))}
            {row.top && <path {...line} d={`M${x} 0 V${cy - DOT}`} stroke={ink} />}
            {row.bottom && <path {...line} d={`M${x} ${cy + DOT} V${height}`} stroke={ink} />}
            {selected && (
                <circle
                    cx={x}
                    cy={cy}
                    fill={`color-mix(in oklab, ${ink} 22%, transparent)`}
                    r={DOT + 4}
                />
            )}
            {row.merge ? (
                <circle
                    cx={x}
                    cy={cy}
                    fill="none"
                    r={DOT - STROKE / 2}
                    stroke={ink}
                    strokeWidth={STROKE}
                />
            ) : (
                <circle cx={x} cy={cy} fill={ink} r={DOT} />
            )}
        </svg>
    );
};

/* ---------- Refs ---------- */

/** The refs a row has no room for, as a count; their names in the native tooltip and to a screen reader. */
const FoldedRefs = ({
    refs,
    className,
}: {
    refs: readonly BranchGraphRef[];
    className?: string;
}) =>
    refs.length > 0 ? (
        <span
            className={cn(
                'inline-flex h-5 shrink-0 items-center rounded-chip px-1 font-medium text-neutral-600 text-xxs tabular-nums',
                className,
            )}
            title={refs.map(ref => ref.name).join(', ')}
        >
            +{refs.length}
            <span className="sr-only">: {refs.map(ref => ref.name).join(', ')}</span>
        </span>
    ) : null;

const RefLabel = ({
    label,
    lane,
    className,
}: {
    label: BranchGraphRef;
    lane: number;
    className?: string;
}) => (
    <span
        className={cn(
            'inline-flex h-5 min-w-0 max-w-40 shrink items-center gap-1 rounded-chip bg-neutral-950/5 px-1.5 font-medium text-xxs',
            label.current
                ? 'text-neutral-950'
                : label.remote
                  ? 'text-neutral-600'
                  : 'text-neutral-800',
            label.current && 'shadow-[inset_0_0_0_1px_var(--color-neutral-300)]',
            className,
        )}
        data-slot="branch-graph-ref"
    >
        {label.kind === 'tag' ? (
            <Tag className="size-3 shrink-0 text-neutral-600" strokeWidth={2} />
        ) : (
            <span
                className="size-1.5 shrink-0 rounded-full"
                style={{ background: laneColor(lane) }}
            />
        )}
        <span className="truncate">{label.name}</span>
    </span>
);

/* ---------- The list ---------- */

const writeTime = (time: Date) =>
    `${time.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, ${time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;

const NOMINAL_HEIGHT = { compact: 34, default: 41 } as const;

/**
 * A commit history: a row per commit, newest first, and beside the rows the lanes the commits sit on.
 * A branch leaves the commit it was made from along that commit's row and turns up into a lane of its
 * own; a merge reaches out along its row to the branch it took in. Lines only run down a lane or along
 * a dot's row, so a busy history still reads as rows.
 */
export const BranchGraph = ({
    commits,
    density = 'compact',
    columns = ['author', 'hash', 'time'],
    selected = null,
    onSelectedChange,
    formatTime = writeTime,
    maxRefs = 2,
    trunk,
    framed = true,
    className,
    style,
    ...props
}: BranchGraphProps) => {
    const trunkName =
        trunk === undefined
            ? (commits
                  .flatMap(commit => commit.refs ?? [])
                  .find(
                      ref =>
                          !ref.remote &&
                          ref.kind !== 'tag' &&
                          (ref.name === 'main' || ref.name === 'master'),
                  )?.name ?? null)
            : trunk;
    const { rows, width } = useMemo(
        () => layoutBranchGraph(commits, trunkName),
        [commits, trunkName],
    );
    const graphWidth = laneX(width - 1) + DOT;
    const interactive = onSelectedChange != null;

    // The row's height comes from the theme's height scale, so it is read off the first row.
    const firstRow = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState<number>(NOMINAL_HEIGHT[density]);
    useLayoutEffect(() => {
        const node = firstRow.current;
        if (!node) return;
        const read = () =>
            setHeight(node.getBoundingClientRect().height || NOMINAL_HEIGHT[density]);
        read();
        const observer = new ResizeObserver(read);
        observer.observe(node);
        return () => observer.disconnect();
    }, [density]);

    const listRef = useRef<HTMLDivElement>(null);
    const [focusId, setFocusId] = useState<string | null>(null);
    const tabStop = focusId ?? selected ?? commits[0]?.id;

    const move = (event: KeyboardEvent<HTMLDivElement>, index: number) => {
        const last = commits.length - 1;
        const to =
            event.key === 'ArrowDown'
                ? Math.min(index + 1, last)
                : event.key === 'ArrowUp'
                  ? Math.max(index - 1, 0)
                  : event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? last
                      : null;
        if (to !== null) {
            event.preventDefault();
            const target = commits[to];
            if (!target) return;
            setFocusId(target.id);
            listRef.current
                ?.querySelector<HTMLElement>(`[data-index="${to}"]`)
                ?.focus({ preventScroll: false });
            return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            const commit = commits[index];
            if (commit) onSelectedChange?.(commit.id);
        }
    };

    return (
        // The frame is its own container, so the list answers the room it is given: under 560 the
        // author and the hash go and the message keeps its line.
        <div
            className={cn(
                '@container/branch-graph flex w-full flex-col overflow-hidden',
                framed && 'rounded-control border border-neutral-200 bg-neutral-50 shadow-card',
                className,
            )}
            data-slot="branch-graph"
            style={style}
        >
            <div
                className="grid min-h-0 w-full flex-1 content-start overflow-y-auto overflow-x-hidden text-xs"
                data-slot="branch-graph-list"
                ref={listRef}
                role={interactive ? 'listbox' : 'list'}
                style={{
                    gridTemplateColumns: [
                        `${graphWidth}px`,
                        'minmax(0, 1fr)',
                        ...columns.map(() => 'auto'),
                    ].join(' '),
                }}
                {...props}
            >
                {commits.map((commit, index) => {
                    const row = rows[index] as RowGraph;
                    const isSelected = selected === commit.id;
                    const refs = commit.refs ?? [];
                    const shown = refs.slice(0, maxRefs);
                    const folded = refs.slice(maxRefs);
                    return (
                        <div
                            {...(interactive
                                ? { role: 'option', 'aria-selected': isSelected }
                                : { role: 'listitem' })}
                            className={cn(
                                'col-span-full grid grid-cols-subgrid items-center pr-4',
                                density === 'compact' ? 'h-control' : 'h-table-row',
                                interactive &&
                                    'cursor-default outline-none transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-solid focus-visible:-outline-offset-2',
                                interactive && !isSelected && 'hover:bg-neutral-950/3',
                                isSelected && 'bg-selected',
                            )}
                            data-index={index}
                            data-selected={isSelected || undefined}
                            data-slot="branch-graph-row"
                            key={commit.id}
                            onClick={interactive ? () => onSelectedChange(commit.id) : undefined}
                            onFocus={interactive ? () => setFocusId(commit.id) : undefined}
                            onKeyDown={interactive ? event => move(event, index) : undefined}
                            ref={index === 0 ? firstRow : undefined}
                            tabIndex={interactive ? (tabStop === commit.id ? 0 : -1) : undefined}
                        >
                            <RowGraphic
                                height={height}
                                row={row}
                                selected={isSelected}
                                width={graphWidth}
                            />
                            <span className="flex min-w-0 items-center gap-2 pl-4">
                                {shown.length > 0 && (
                                    <span className="flex min-w-0 @max-[560px]/branch-graph:max-w-[45%] max-w-[60%] shrink-0 items-center gap-1">
                                        {shown.map((ref, at) => (
                                            <RefLabel
                                                // A narrow list keeps the first ref only, so the message still reads.
                                                className={cn(
                                                    at > 0 && '@max-[560px]/branch-graph:hidden',
                                                )}
                                                key={`${ref.kind}:${ref.name}`}
                                                label={ref}
                                                lane={row.lane}
                                            />
                                        ))}
                                        <FoldedRefs
                                            className="@max-[560px]/branch-graph:hidden"
                                            refs={folded}
                                        />
                                        <FoldedRefs
                                            className="@min-[560px]/branch-graph:hidden"
                                            refs={refs.slice(1)}
                                        />
                                    </span>
                                )}
                                <span
                                    className={cn(
                                        'min-w-0 truncate',
                                        row.merge ? 'text-neutral-600' : 'text-neutral-900',
                                    )}
                                >
                                    {commit.message}
                                </span>
                            </span>
                            {columns.map(column =>
                                column === 'author' ? (
                                    <span
                                        className="@max-[560px]/branch-graph:hidden max-w-40 truncate pl-4 text-neutral-700"
                                        key={column}
                                    >
                                        {commit.author}
                                    </span>
                                ) : column === 'hash' ? (
                                    <span
                                        className="@max-[560px]/branch-graph:hidden pl-4 font-mono text-neutral-600 text-xxs"
                                        key={column}
                                    >
                                        {commit.id.slice(0, 7)}
                                    </span>
                                ) : (
                                    <span
                                        className="whitespace-nowrap pl-4 text-right text-neutral-600 tabular-nums"
                                        key={column}
                                    >
                                        {commit.time ? formatTime(commit.time) : null}
                                    </span>
                                ),
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
