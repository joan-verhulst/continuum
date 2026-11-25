import { cn, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@contui/ui';
import type { Measured } from './measure';
import { scale } from './measure';
import { meant, type Piece } from './pieces';

type Column = {
    id: string;
    head: string;
    /** The value as compared and shown; undefined is a blank cell that never differs. */
    value: (m: Measured) => string | undefined;
};

const columns: Column[] = [
    { id: 'w', head: 'Width', value: m => String(m.w) },
    {
        id: 'padding',
        head: 'Padding',
        value: m => m.padding.join(' '),
    },
    { id: 'radius', head: 'Radius', value: m => String(m.radius) },
    { id: 'font', head: 'Text', value: m => m.font },
    { id: 'gap', head: 'Gap', value: m => (m.gap === undefined ? undefined : String(m.gap)) },
    { id: 'icon', head: 'Icon', value: m => (m.icon === undefined ? undefined : String(m.icon)) },
    {
        id: 'iconGap',
        head: 'Icon gap',
        value: m => (m.iconGap === undefined ? undefined : String(m.iconGap)),
    },
    {
        id: 'baseline',
        head: 'Baseline',
        value: m => (m.baseline === undefined ? undefined : String(m.baseline)),
    },
];

/** Widths differ by content, so they are shown but never flagged. */
const compared = new Set(['padding', 'radius', 'font', 'gap', 'icon', 'iconGap', 'baseline']);

/**
 * A piece with no padding or no corner of its own (a row of parts, an icon-only square) has nothing
 * to compare there, so it neither sets the usual value nor differs from it.
 */
const comparable = (id: string, value: string | undefined) =>
    value !== undefined &&
    !((id === 'padding' && value === '0 0 0 0') || (id === 'radius' && value === '0'));

/** The value most of a group shares, when at least two share it. */
const modeOf = (values: string[]) => {
    const counts = new Map<string, number>();
    for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
    let best: string | undefined;
    let most = 1;
    for (const [value, count] of counts)
        if (count > most) {
            best = value;
            most = count;
        }
    return best;
};

type FindingsProps = {
    ordered: Piece[];
    measured: Record<string, Measured>;
};

/**
 * One row a piece, in the strip's order, with what was measured. A value that differs from what
 * most pieces of the same height have, a height off the scale, or one off what the piece is meant
 * to be, is set in the error colour.
 */
export const Findings = ({ ordered, measured }: FindingsProps) => {
    // The usual value of each column within each height.
    const modes = new Map<string, string | undefined>();
    const groups = new Map<number, Measured[]>();
    for (const piece of ordered) {
        const m = measured[piece.id];
        if (!m) continue;
        groups.set(m.h, [...(groups.get(m.h) ?? []), m]);
    }
    for (const [h, group] of groups)
        for (const column of columns) {
            const values = group
                .map(column.value)
                .filter((v): v is string => comparable(column.id, v));
            modes.set(`${h}:${column.id}`, values.length >= 3 ? modeOf(values) : undefined);
        }

    return (
        <Table aria-label="Measured pieces">
            <TableHeader>
                <TableRow>
                    <TableHead>Piece</TableHead>
                    <TableHead>Family</TableHead>
                    <TableHead numeric>Height</TableHead>
                    <TableHead>Meant</TableHead>
                    {columns.map(column => (
                        <TableHead key={column.id} numeric={column.id === 'w'}>
                            {column.head}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {ordered.map(piece => {
                    const m = measured[piece.id];
                    if (!m) return null;
                    const target = meant[piece.id];
                    const missed = target !== undefined && target !== m.h;
                    const offScale = !scale.includes(m.h);
                    return (
                        <TableRow key={piece.id}>
                            <TableCell>{piece.id}</TableCell>
                            <TableCell className="font-normal text-neutral-600">
                                {piece.family}
                            </TableCell>
                            <TableCell
                                className={cn(offScale && 'text-error-700')}
                                numeric
                                title={
                                    offScale ? 'Off the 20 · 22 · 34 · 38 · 41 scale' : undefined
                                }
                            >
                                {m.h}
                            </TableCell>
                            <TableCell
                                className={cn(
                                    'font-normal',
                                    missed ? 'text-error-700' : 'text-neutral-600',
                                )}
                            >
                                {missed ? `meant ${target}, measures ${m.h}` : (target ?? '')}
                            </TableCell>
                            {columns.map(column => {
                                const value = column.value(m);
                                const mode = modes.get(`${m.h}:${column.id}`);
                                const differs =
                                    compared.has(column.id) &&
                                    comparable(column.id, value) &&
                                    mode !== undefined &&
                                    value !== mode;
                                return (
                                    <TableCell
                                        className={cn(
                                            'font-normal tabular-nums',
                                            differs ? 'text-error-700' : 'text-neutral-700',
                                        )}
                                        key={column.id}
                                        numeric={column.id === 'w'}
                                        title={differs ? `Most at ${m.h}: ${mode}` : undefined}
                                    >
                                        {value ?? ''}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
};
