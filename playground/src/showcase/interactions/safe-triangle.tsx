import {
    Button,
    cn,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from 'continuum';
import {
    Archive,
    Copy,
    Download,
    Ellipsis,
    Folder,
    FolderInput,
    Pencil,
    Share2,
    Trash2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStageContainer } from '../../layout';
import type { Entry, Knob, PreviewProps } from '../kit';
import { previewIcon } from '../kit';

/*
 * The submenu cone. Base UI's submenu trigger closes its submenu through floating-ui's safePolygon:
 * once the pointer leaves the trigger, a triangle from where it left to the submenu's near edge
 * (and the strip between the two) keeps the submenu open, and the items it crosses take no hover.
 * This demo draws that area over the menu, from the same geometry, so the behaviour can be seen.
 */

const below = [
    { label: 'Duplicate', Icon: Copy },
    { label: 'Share', Icon: Share2 },
    { label: 'Download', Icon: Download },
    { label: 'Archive', Icon: Archive },
];

const folders = [
    'Board packs',
    'Quarterly',
    'Shared with clients',
    'Finance',
    'Archive 2025',
    'Drafts',
];

type Point = { x: number; y: number };

type Area = {
    /** The triangle: where the pointer left the trigger, then the submenu's near corners. */
    triangle: [Point, Point, Point];
    /** The strip between the trigger and the submenu. */
    trough: { x: number; y: number; width: number; height: number };
    pointer?: Point & { inside: boolean; onTrigger: boolean };
};

const insideRect = (p: Point, r: DOMRect) =>
    p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;

/** Whether a point lies in a triangle, by the sign of the three edges. */
const insideTriangle = (p: Point, [a, b, c]: [Point, Point, Point]) => {
    const side = (u: Point, v: Point) => (p.x - v.x) * (u.y - v.y) - (u.x - v.x) * (p.y - v.y);
    const d1 = side(a, b);
    const d2 = side(b, c);
    const d3 = side(c, a);
    const negative = d1 < 0 || d2 < 0 || d3 < 0;
    const positive = d1 > 0 || d2 > 0 || d3 > 0;
    return !(negative && positive);
};

/**
 * Follows the pointer and the open submenu each frame and works out the safe area, relative to the
 * stage it is drawn on. While the pointer is on the trigger the cone follows it; once it leaves,
 * the cone stays where it left, as safePolygon's does; on the submenu it is gone.
 */
const useSafeArea = (stage: HTMLElement | null, still: boolean) => {
    const [area, setArea] = useState<Area>();
    const pointer = useRef<Point>(undefined);
    const leave = useRef<Point>(undefined);

    useEffect(() => {
        if (!stage) return;
        const move = (event: PointerEvent) => {
            pointer.current = { x: event.clientX, y: event.clientY };
        };
        document.addEventListener('pointermove', move);
        let frame = 0;
        let last = '';
        const tick = () => {
            frame = requestAnimationFrame(tick);
            const trigger = stage.querySelector('[data-slot=dropdown-menu-sub-trigger]');
            // The positioner, not the popup: the popup scales in from 95%, the positioner holds its place.
            const popup = stage.querySelector(
                '[data-slot=dropdown-menu-sub-positioner]:has(> :not([data-ending-style]))',
            );
            if (!(trigger && popup)) {
                leave.current = undefined;
                if (last) setArea(undefined);
                last = '';
                return;
            }
            const t = trigger.getBoundingClientRect();
            const s = popup.getBoundingClientRect();
            const box = stage.getBoundingClientRect();
            const p = pointer.current;
            let from = leave.current;
            if (still || !p) {
                // Before the pointer arrives: as though it had just left the trigger two thirds along.
                from = from ?? { x: t.left + t.width * 0.66, y: t.top + t.height / 2 };
            } else if (insideRect(p, t)) {
                from = p;
                leave.current = p;
            } else if (insideRect(p, s)) {
                // Landed on the submenu: the area has done its work.
                if (last) setArea(undefined);
                last = '';
                return;
            }
            if (!from) from = { x: t.right - 8, y: t.top + t.height / 2 };
            const triangle: [Point, Point, Point] = [
                { x: from.x - box.left, y: from.y - box.top },
                { x: s.left - box.left, y: s.top - box.top },
                { x: s.left - box.left, y: s.bottom - box.top },
            ];
            const trough = {
                x: t.right - box.left,
                y: Math.min(t.top, s.top) - box.top,
                width: Math.max(0, s.left - t.right),
                height: Math.max(t.bottom, s.bottom) - Math.min(t.top, s.top),
            };
            const local = p && !still ? { x: p.x - box.left, y: p.y - box.top } : undefined;
            const next: Area = {
                triangle,
                trough,
                pointer: local && {
                    ...local,
                    onTrigger: Boolean(p && insideRect(p, t)),
                    inside:
                        insideTriangle(local, triangle) ||
                        (local.x >= trough.x &&
                            local.x <= trough.x + trough.width &&
                            local.y >= trough.y &&
                            local.y <= trough.y + trough.height),
                },
            };
            const key = JSON.stringify(next);
            if (key !== last) {
                last = key;
                setArea(next);
            }
        };
        frame = requestAnimationFrame(tick);
        return () => {
            cancelAnimationFrame(frame);
            document.removeEventListener('pointermove', move);
        };
    }, [stage, still]);

    return area;
};

/** The area, drawn over the stage: the action colour, faint, with its edge a little stronger. */
const SafeAreaOverlay = ({ area, stage }: { area: Area; stage: HTMLElement }) =>
    createPortal(
        <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-60 size-full overflow-visible"
            data-slot="safe-area"
        >
            <rect
                className="fill-action/10"
                height={area.trough.height}
                width={area.trough.width}
                x={area.trough.x}
                y={area.trough.y}
            />
            <polygon
                className="fill-action/15 stroke-action/60"
                points={area.triangle.map(p => `${p.x},${p.y}`).join(' ')}
                strokeDasharray="3 3"
                strokeWidth={1}
            />
            <circle className="fill-action" cx={area.triangle[0].x} cy={area.triangle[0].y} r={3} />
            {area.pointer && (
                <circle
                    className={cn(
                        'stroke-2',
                        area.pointer.inside
                            ? 'fill-action/30 stroke-action'
                            : 'fill-neutral-50 stroke-neutral-500',
                    )}
                    cx={area.pointer.x}
                    cy={area.pointer.y}
                    r={5}
                />
            )}
        </svg>,
        stage,
    );

const knobs: Knob[] = [{ id: 'area', label: 'Draw the safe area', switch: true, default: true }];

const SafeTrianglePreview = ({ knobs: values }: PreviewProps) => {
    const stage = useStageContainer();
    const still = Boolean(stage?.inert);
    const [open, setOpen] = useState(true);
    const [last, setLast] = useState<string>();
    const area = useSafeArea(values.area ? stage : null, still);

    return (
        <div
            className={cn(
                'flex flex-col items-center gap-3',
                stage && (still ? 'pr-52 pb-40' : 'pr-56 pb-60'),
            )}
        >
            {!still && (
                <span aria-live="polite" className="text-neutral-600 text-xxs">
                    {last ??
                        (area?.pointer
                            ? area.pointer.onTrigger
                                ? 'On the trigger: the cone starts where the pointer leaves'
                                : area.pointer.inside
                                  ? 'In the safe area: the items it crosses take no hover'
                                  : 'Outside it: the submenu closes'
                            : 'Rest on Move to, then head diagonally for a folder')}
                </span>
            )}
            <DropdownMenu
                modal={stage ? false : undefined}
                onOpenChange={setOpen}
                open={stage ? still || open : false}
            >
                <DropdownMenuTrigger render={<Button variant="secondary" />}>
                    Actions <Ellipsis {...previewIcon} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52" container={stage}>
                    <DropdownMenuItem onClick={() => setLast('Rename')}>
                        <Pencil {...previewIcon} /> Rename
                    </DropdownMenuItem>
                    {/*
                     * Held open only on the grid's still. On the page it opens by hover alone: the safe area
                     * belongs to the hover that opened it, so a submenu opened any other way has none.
                     */}
                    <DropdownMenuSub open={still || undefined}>
                        <DropdownMenuSubTrigger icon={<FolderInput {...previewIcon} />}>
                            Move to
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-52" container={stage} sideOffset={4}>
                            {(still ? folders.slice(0, 3) : folders).map(folder => (
                                <DropdownMenuItem
                                    key={folder}
                                    onClick={() => setLast(`Moved to ${folder}`)}
                                >
                                    <Folder {...previewIcon} /> {folder}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    {/* On the grid's still, a shorter menu, so the pair fits the tile. */}
                    {(still ? below.slice(0, 1) : below).map(({ label, Icon }) => (
                        <DropdownMenuItem key={label} onClick={() => setLast(label)}>
                            <Icon {...previewIcon} /> {label}
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setLast('Deleted')} variant="danger">
                        <Trash2 {...previewIcon} /> Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            {stage && area && <SafeAreaOverlay area={area} stage={stage} />}
        </div>
    );
};

export const entry: Entry = {
    id: 'safe-triangle',
    name: 'Safe triangle',
    category: 'interaction',
    description:
        'A submenu stays open while the pointer heads for it across other items: the area it may cross, drawn.',
    // Two columns on the grid, so the menu and its submenu fit side by side in the still.
    span: 2,
    hero: 'min-h-110',
    knobs,
    Preview: SafeTrianglePreview,
};
