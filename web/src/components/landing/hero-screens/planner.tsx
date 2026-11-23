'use client';

import {
    AppPanel,
    AppShell,
    Avatar,
    AvatarStack,
    Badge,
    Breadcrumb,
    BreadcrumbHome,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    Button,
    cn,
    HeaderBar,
    Meter,
    PageContent,
    SegmentedControl,
    SegmentedControlItem,
    Sidebar,
    SidebarAccount,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarItem,
    SidebarLogo,
    SidebarToggle,
    StatusDot,
    type StatusDotTone,
} from 'continuum';
import {
    Aperture,
    Bell,
    CalendarCheck,
    CalendarDays,
    Camera,
    ChevronLeft,
    ChevronRight,
    Clock,
    DoorOpen,
    Inbox,
    LifeBuoy,
    MapPin,
    Package,
    Plus,
    ReceiptText,
    Settings,
    Users,
} from 'lucide-react';
import { type ReactNode, useLayoutEffect, useState } from 'react';
import { compact } from './shell';

/*
 * Slate, the planner Halftone Studios runs its rental studios from: next week, week 48. A grid of
 * the studios by the days, every booking a block in its day (confirmed, on hold, clashing, the
 * studio's own work), a span when it runs over days. The requests still waiting for a studio sit in
 * the grid's first row, under the day they asked for; each day's booked hours against the hours the
 * studios are open close it. The Nova Records shoot is selected, its details open under it.
 *
 * Its own product, not the Northwind suite: its own shell, drawn at its real size and never scaled,
 * filling the hero's least window (1408 × 792) and taking more studios on a taller one. Nothing opens
 * a portal: the popover is drawn in place. Every colour is a token.
 *
 * On a phone the week is one day at a time: the days in a segmented control, the same grid under it
 * with the studios by the chosen day, and the page scrolls.
 */

const icon = { strokeWidth: 2 } as const;

/* ---------- The data ---------- */

const days = ['Mon 23', 'Tue 24', 'Wed 25', 'Thu 26', 'Fri 27', 'Sat 28'];
/** Every studio is open 08:00 to 20:00. */
const OPEN_HOURS = 12;

type Kind = 'confirmed' | 'hold' | 'clash' | 'internal' | 'request';

const kinds: Record<Kind, { tone: StatusDotTone; label: string; block: string }> = {
    confirmed: { tone: 'success', label: 'Confirmed', block: 'border-neutral-200 bg-neutral-50' },
    hold: {
        tone: 'warning',
        label: 'On hold',
        block: 'border-dashed border-neutral-300 bg-neutral-50',
    },
    clash: { tone: 'error', label: 'Clash', block: 'border-error-500/60 bg-neutral-50' },
    internal: {
        tone: 'neutral',
        label: 'Studio work',
        block: 'border-neutral-200 bg-neutral-950/3',
    },
    request: { tone: 'neutral', label: 'Request', block: 'border-dashed border-neutral-300' },
};

type Booking = {
    title: string;
    /** The time and the person, the block's second line. */
    meta: string;
    kind: Kind;
    /** Booked hours on each day it covers. */
    hours: number;
    selected?: boolean;
    /** The second line in error, for the half of a clash that overlaps. */
    warn?: boolean;
};

/** A day's cell: its bookings, over one day or, with `span`, several. Null is a free day. */
type Cell = { span?: number; bookings: Booking[] } | null;

type Lane = { name: string; meta: string; cells: Cell[] };

const one = (booking: Booking, span?: number): Cell => ({ span, bookings: [booking] });

const requests: Lane = {
    name: 'Requests',
    meta: '4 waiting for a studio',
    cells: [
        null,
        one({ title: 'Polder Coffee', meta: 'Any daylight · 4 h', kind: 'request', hours: 0 }),
        one({
            title: 'Sunday Supply',
            meta: 'Cyclorama · 8 h',
            kind: 'request',
            hours: 0,
        }),
        null,
        one({ title: 'Atelier Noor', meta: 'Any studio · 6 h', kind: 'request', hours: 0 }),
        one({ title: 'Vos & Daughters', meta: 'Kitchen set · 5 h', kind: 'request', hours: 0 }),
    ],
};

const studios: Lane[] = [
    {
        name: 'Studio A',
        meta: 'Daylight, 140 m²',
        cells: [
            one({
                title: 'Hollis & Rae',
                meta: 'All day · Sem Bakker',
                kind: 'confirmed',
                hours: 10,
            }),
            one({
                title: 'Nova Records',
                meta: '09–15 · Ilse de Wit',
                kind: 'confirmed',
                hours: 6,
                selected: true,
            }),
            one(
                {
                    title: 'Maison Verre winter campaign',
                    meta: 'Wed–Thu, all day · Joris Smit',
                    kind: 'confirmed',
                    hours: 10,
                },
                2,
            ),
            one({ title: 'Mareld', meta: '10–18 · 1st hold', kind: 'hold', hours: 8 }),
            null,
        ],
    },
    {
        name: 'Studio B',
        meta: 'Daylight, 90 m²',
        cells: [
            {
                bookings: [
                    {
                        title: 'Linde Swimwear',
                        meta: '09–12 · Kaito Mori',
                        kind: 'confirmed',
                        hours: 3,
                    },
                    {
                        title: 'Studio Linnen',
                        meta: '13–18 · Eva Jansen',
                        kind: 'confirmed',
                        hours: 5,
                    },
                ],
            },
            one({
                title: 'Ferm Footwear',
                meta: 'All day · Lotte Dekker',
                kind: 'confirmed',
                hours: 10,
            }),
            null,
            one({ title: 'Oak & Iron', meta: '09–14 · 2nd hold', kind: 'hold', hours: 5 }),
            {
                bookings: [
                    {
                        title: 'Nova Records film',
                        meta: '10–13 · Ilse de Wit',
                        kind: 'confirmed',
                        hours: 3,
                    },
                    {
                        title: 'Visser & Co',
                        meta: '14–17 · Marit Visser',
                        kind: 'confirmed',
                        hours: 3,
                    },
                ],
            },
            one({
                title: 'Light workshop',
                meta: '10–16 · Daan Vos',
                kind: 'internal',
                hours: 6,
            }),
        ],
    },
    {
        name: 'Cyclorama',
        meta: 'Infinity cove, 12 m',
        cells: [
            one({
                title: 'Repaint the cove',
                meta: 'All day · Maintenance',
                kind: 'internal',
                hours: 10,
            }),
            one(
                {
                    title: 'Solstice spring film',
                    meta: 'Tue–Wed, 08–20 · Noa Peters',
                    kind: 'confirmed',
                    hours: 12,
                },
                2,
            ),
            null,
            one({
                title: 'Groenstroom',
                meta: '08–14 · Ruben Mol',
                kind: 'confirmed',
                hours: 6,
            }),
            one({ title: 'Indigo Row denim', meta: 'All day · 1st hold', kind: 'hold', hours: 10 }),
        ],
    },
    {
        name: 'Studio C',
        meta: 'Blackout, 60 m²',
        cells: [
            null,
            one({
                title: 'Moon Atelier',
                meta: '13–18 · Sara Lind',
                kind: 'confirmed',
                hours: 5,
            }),
            one(
                {
                    title: 'Kraak music video',
                    meta: 'Wed–Thu, all day · Thijs Kok',
                    kind: 'confirmed',
                    hours: 10,
                },
                2,
            ),
            null,
            one({
                title: 'Moon Atelier stills',
                meta: '10–15 · Sara Lind',
                kind: 'confirmed',
                hours: 5,
            }),
        ],
    },
    {
        name: 'Podcast booth',
        meta: '4 mics, 2 cameras',
        cells: [
            {
                bookings: [
                    {
                        title: 'Techpraat',
                        meta: '10–12 · Anouk Smit',
                        kind: 'confirmed',
                        hours: 2,
                    },
                    {
                        title: 'Kaapstad Radio',
                        meta: '14–16 · Mo Haddad',
                        kind: 'confirmed',
                        hours: 2,
                    },
                ],
            },
            one({
                title: 'Geldzaken',
                meta: '11–13 · Bas Vermeer',
                kind: 'confirmed',
                hours: 2,
            }),
            one({
                title: 'Techpraat',
                meta: '10–12 · Anouk Smit',
                kind: 'confirmed',
                hours: 2,
            }),
            null,
            {
                bookings: [
                    {
                        title: 'Kaapstad Radio',
                        meta: '14–16 · Mo Haddad',
                        kind: 'clash',
                        hours: 2,
                    },
                    {
                        title: 'Sportcafé live',
                        meta: '15–17 · overlaps 1 h',
                        kind: 'clash',
                        hours: 1,
                        warn: true,
                    },
                ],
            },
            null,
        ],
    },
    {
        name: 'Kitchen set',
        meta: 'Food and product',
        cells: [
            one(
                {
                    title: 'De Kas cookbook',
                    meta: 'Mon–Tue, all day · Yara Bos',
                    kind: 'confirmed',
                    hours: 10,
                },
                2,
            ),
            one({
                title: 'Bord & Bos stills',
                meta: '09–15 · Yara Bos',
                kind: 'confirmed',
                hours: 6,
            }),
            one({ title: 'Pastry Lab', meta: '10–16 · 1st hold', kind: 'hold', hours: 6 }),
            null,
            null,
        ],
    },
    {
        name: 'Rooftop',
        meta: 'Outdoor, by the weather',
        cells: [
            null,
            null,
            null,
            one({
                title: 'Indigo Row',
                meta: '11–15 · weather hold',
                kind: 'hold',
                hours: 4,
            }),
            null,
            one({
                title: 'Tuin magazine',
                meta: '09–12 · Femke Ros',
                kind: 'confirmed',
                hours: 3,
            }),
        ],
    },
    {
        name: 'Edit suite',
        meta: 'Two grading bays',
        cells: [
            one({
                title: 'Groenstroom offline',
                meta: '10–18 · Ruben Mol',
                kind: 'confirmed',
                hours: 8,
            }),
            null,
            null,
            one({
                title: 'Solstice rough cut',
                meta: '10–18 · Noa Peters',
                kind: 'confirmed',
                hours: 8,
            }),
            one(
                {
                    title: 'Kraak colour grade',
                    meta: 'Fri–Sat, all day · Thijs Kok',
                    kind: 'confirmed',
                    hours: 10,
                },
                2,
            ),
        ],
    },
];

/** Rooms booked less often, listed last: shown when the page has a row to spare. */
const spare: Lane[] = [
    {
        name: 'Studio D',
        meta: 'Daylight, 45 m²',
        cells: [
            one({
                title: 'Brik ceramics',
                meta: '10–14 · Ayla Demir',
                kind: 'confirmed',
                hours: 4,
            }),
            null,
            one({ title: 'Fenna Kok', meta: '13–17 · 1st hold', kind: 'hold', hours: 4 }),
            null,
            one({
                title: 'Vos & Daughters',
                meta: '09–13 · Mila Vos',
                kind: 'confirmed',
                hours: 4,
            }),
            null,
        ],
    },
    {
        name: 'Meeting room',
        meta: 'Castings, 12 seats',
        cells: [
            null,
            one({
                title: 'Solstice casting',
                meta: '10–16 · Noa Peters',
                kind: 'confirmed',
                hours: 6,
            }),
            null,
            one({
                title: 'Kraak call-back',
                meta: '09–11 · Thijs Kok',
                kind: 'confirmed',
                hours: 2,
            }),
            null,
            null,
        ],
    },
];

/* ---------- The sizes the grid is counted in ---------- */

const HEAD = 41;
const BLOCK = 48;
/** The cell's padding round its blocks, and the gap between two blocks in one cell. */
const INSET = 4;
const FOOT = 53;
const PAGE_HEAD = 54;
/** The page starts 96 below the header bar's bottom edge, at every size. */
const PAGE_TOP = 96;
/** The block gap between the page head and the grid, from the spacing formula. */
const HEAD_GAP = 48;
const BOTTOM = 24;

const laneHeight = (lane: Lane) => {
    const most = Math.max(1, ...lane.cells.map(cell => cell?.bookings.length ?? 0));
    return INSET * 2 + most * BLOCK + (most - 1) * INSET + 1;
};

/** The hours a lane is booked on each day, a span counting on every day it covers. */
const hoursByDay = (lane: Lane) => {
    const out = days.map(() => 0);
    let day = 0;
    for (const cell of lane.cells) {
        const span = cell?.span ?? 1;
        const hours = cell?.bookings.reduce((sum, b) => sum + b.hours, 0) ?? 0;
        for (let i = 0; i < span; i++) out[day + i] = (out[day + i] ?? 0) + hours;
        day += span;
    }
    return out;
};

/* ---------- The parts ---------- */

/**
 * A booking as the planner draws it, the schedule pattern's block: item corners, a hairline, 8 in;
 * a 6 dot in its state's tone, the title 13 medium, the time and the person 11 under it.
 */
const Block = ({
    booking,
    selected = booking.selected,
}: {
    booking: Booking;
    selected?: boolean;
}) => {
    const kind = kinds[booking.kind];
    return (
        <div
            className={cn(
                'flex h-12 min-w-0 shrink-0 flex-col justify-center rounded-item border px-2',
                kind.block,
                selected && 'outline-2 outline-action outline-offset-1',
            )}
            data-slot="planner-block"
        >
            <span className="flex min-w-0 items-center gap-2">
                <StatusDot size="sm" tone={kind.tone} />
                <span className="truncate font-medium text-neutral-950 text-xs">
                    {booking.title}
                    <span className="sr-only">, {kind.label}</span>
                </span>
            </span>
            <span
                className={cn(
                    'truncate pl-3.5 text-xxs',
                    booking.warn ? 'text-error-600' : 'text-neutral-600',
                )}
            >
                {booking.meta}
            </span>
        </div>
    );
};

const LaneRow = ({ lane }: { lane: Lane }) => (
    <div className="grid grid-cols-7 border-neutral-200 border-t" data-slot="planner-lane">
        <div className="flex min-w-0 flex-col justify-center px-3">
            <span className="truncate font-medium text-neutral-950 text-xs">{lane.name}</span>
            <span className="truncate text-neutral-600 text-xs">{lane.meta}</span>
        </div>
        {lane.cells.map((cell, i) => (
            <div
                className={cn(
                    'flex min-w-0 flex-col gap-1 border-neutral-200 border-l p-1',
                    cell?.span === 2 && 'col-span-2',
                )}
                // biome-ignore lint/suspicious/noArrayIndexKey: a lane's cells are its days, in order
                key={i}
            >
                {cell?.bookings.map(booking => (
                    <Block booking={booking} key={booking.title} />
                ))}
            </div>
        ))}
    </div>
);

const Fact = ({ figure, children }: { figure: ReactNode; children: ReactNode }) => (
    <div className="flex min-h-6 items-center gap-2 text-neutral-700 text-xs">
        <span className="flex size-4 shrink-0 items-center justify-center text-neutral-600">
            {figure}
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-2 truncate">{children}</span>
    </div>
);

/** The selected booking's details: the popover's anatomy, drawn in place rather than portalled. */
const BookingPopover = ({
    top,
    left,
    className = 'w-popover',
}: {
    top?: number;
    left?: string;
    /** Its width; on a phone its edges and its top instead, under the selected booking's row. */
    className?: string;
}) => (
    <div
        aria-label="Nova Records"
        className={cn(
            'absolute z-20 flex flex-col gap-3 rounded-card border border-neutral-200 bg-neutral-50 p-3 text-neutral-700 text-xs shadow-float',
            className,
        )}
        data-slot="popover-content"
        role="dialog"
        style={{ top, left }}
    >
        <div className="flex items-start gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="truncate font-medium text-neutral-950 text-sm">Nova Records</p>
                <p className="truncate text-neutral-600">Album cover, three setups</p>
            </div>
            <Badge tone="success">Confirmed</Badge>
        </div>
        <div className="flex flex-col gap-1">
            <Fact figure={<Clock {...icon} />}>Tue 24 Nov, 09:00 to 15:00</Fact>
            <Fact figure={<MapPin {...icon} />}>Studio A, north light</Fact>
            <Fact figure={<Users {...icon} />}>
                <AvatarStack>
                    <Avatar alt="Ilse de Wit" fallback="IW" shape="round" size={24} />
                    <Avatar alt="Tim Hendriks" fallback="TH" shape="round" size={24} />
                    <Avatar alt="Lisa Brouwer" fallback="LB" shape="round" size={24} />
                </AvatarStack>
                <span className="truncate">Ilse de Wit and 2 crew</span>
            </Fact>
            <Fact figure={<Package {...icon} />}>Profoto D2 kit, white sweep, haze</Fact>
        </div>
        <Meter caption="€420 of €1,260" label="Deposit paid" value={33} />
        <div className="flex justify-end gap-2">
            <Button variant="ghost">Reschedule</Button>
            <Button variant="secondary">Open booking</Button>
        </div>
    </div>
);

/**
 * The planner: the schedule pattern's bordered grid, every studio by the days, and a spare room
 * more when the page has a row for it. In the least room it runs on past the panel's foot, as a
 * scrolled planner does, and its footer of booked hours stays pinned there over the rows.
 */
const Planner = ({ room }: { room: number }) => {
    const fixed = PAGE_TOP + PAGE_HEAD + HEAD_GAP + HEAD + FOOT + BOTTOM + 2;
    let used = fixed + [requests, ...studios].reduce((sum, lane) => sum + laneHeight(lane), 0);
    const shown = [...studios];
    for (const lane of spare) {
        if (used + laneHeight(lane) > room) break;
        shown.push(lane);
        used += laneHeight(lane);
    }
    // Past the foot, the footer is pinned flush with it; its corners round only at the grid's own end.
    const runsOn = used > room;
    const booked = days.map((_, day) =>
        shown.reduce((sum, lane) => sum + (hoursByDay(lane)[day] ?? 0), 0),
    );
    const capacity = shown.length * OPEN_HOURS;

    // The popover opens 4 under the selected block: Studio A's, on Tuesday.
    const popoverTop = HEAD + laneHeight(requests) + INSET + BLOCK + 4;

    return (
        <div
            className="relative @max-shell-compact/shell:hidden shrink-0 rounded-card border border-neutral-200 bg-neutral-50"
            data-slot="planner"
        >
            <div className="grid h-row grid-cols-7 rounded-t-[calc(var(--radius-card)-1px)] bg-neutral-100 text-neutral-600 text-xs">
                <span className="flex items-center px-3">Studio</span>
                {days.map(day => (
                    <span
                        className="flex items-center border-neutral-200 border-l px-3 tabular-nums"
                        key={day}
                    >
                        {day}
                    </span>
                ))}
            </div>
            <LaneRow lane={requests} />
            {shown.map(lane => (
                <LaneRow key={lane.name} lane={lane} />
            ))}
            <div
                className={cn(
                    'sticky bottom-0 z-10 grid grid-cols-7 border-neutral-200 border-t bg-neutral-50',
                    !runsOn && 'rounded-b-[calc(var(--radius-card)-1px)]',
                )}
                data-slot="planner-footer"
            >
                <div className="flex min-w-0 flex-col justify-center px-3">
                    <span className="truncate font-medium text-neutral-950 text-xs">Booked</span>
                    <span className="truncate text-neutral-600 text-xs">
                        Of {capacity} h open a day
                    </span>
                </div>
                {booked.map((hours, i) => {
                    const share = Math.round((hours / capacity) * 100);
                    return (
                        <div className="min-w-0 border-neutral-200 border-l p-3" key={days[i]}>
                            <Meter
                                caption={`${share}%`}
                                label={`${hours} h`}
                                tone={share >= 85 ? 'warning' : undefined}
                                value={share}
                            />
                        </div>
                    );
                })}
            </div>
            <BookingPopover left="calc(200% / 7 + 4px)" top={popoverTop} />
        </div>
    );
};

/** The cell a lane has on a day: the one the day falls in, a span's on each day it covers. */
const cellOn = (lane: Lane, day: number): Cell => {
    let at = 0;
    for (const cell of lane.cells) {
        const span = cell?.span ?? 1;
        if (day < at + span) return cell;
        at += span;
    }
    return null;
};

const DayRow = ({
    lane,
    day,
    open,
    onToggle,
}: {
    lane: Lane;
    day: number;
    open: boolean;
    onToggle: () => void;
}) => (
    <div className="relative grid grid-cols-5 border-neutral-200 border-t" data-slot="planner-lane">
        <div className="col-span-2 flex min-w-0 flex-col justify-center px-3">
            <span className="truncate font-medium text-neutral-950 text-xs">{lane.name}</span>
            <span className="truncate text-neutral-600 text-xs">{lane.meta}</span>
        </div>
        <div className="col-span-3 flex min-w-0 flex-col gap-1 border-neutral-200 border-l p-1">
            {cellOn(lane, day)?.bookings.map(booking =>
                booking.selected ? (
                    <button
                        aria-expanded={open}
                        className="flex min-w-0 cursor-pointer flex-col rounded-item text-left"
                        key={booking.title}
                        onClick={onToggle}
                        type="button"
                    >
                        <Block booking={booking} selected={open} />
                    </button>
                ) : (
                    <Block booking={booking} key={booking.title} />
                ),
            )}
        </div>
        {open && cellOn(lane, day)?.bookings.some(booking => booking.selected) && (
            <BookingPopover className="inset-x-1 top-full" />
        )}
    </div>
);

/**
 * The planner on a phone: one day of the week at a time, picked in a segmented control over the
 * grid; the studios by that day, every room listed since the page scrolls, and the day's booked
 * hours at its foot. Tapping the Nova Records shoot opens or closes its details under it.
 */
const DayPlanner = () => {
    const [day, setDay] = useState(1);
    const [open, setOpen] = useState(true);
    const lanes = [...studios, ...spare];
    const capacity = lanes.length * OPEN_HOURS;
    const hours = lanes.reduce((sum, lane) => sum + (hoursByDay(lane)[day] ?? 0), 0);
    const share = Math.round((hours / capacity) * 100);

    return (
        <div className="@max-shell-compact/shell:flex hidden flex-col gap-4">
            <SegmentedControl
                aria-label="Day"
                fill
                onValueChange={value => setDay(Number(value))}
                value={String(day)}
            >
                {days.map((label, i) => (
                    <SegmentedControlItem key={label} value={String(i)}>
                        {label.slice(0, 3)}
                    </SegmentedControlItem>
                ))}
            </SegmentedControl>
            <div
                className="relative rounded-card border border-neutral-200 bg-neutral-50"
                data-slot="planner"
            >
                <div className="grid h-row grid-cols-5 rounded-t-[calc(var(--radius-card)-1px)] bg-neutral-100 text-neutral-600 text-xs">
                    <span className="col-span-2 flex items-center px-3">Studio</span>
                    <span className="col-span-3 flex items-center border-neutral-200 border-l px-3 tabular-nums">
                        {days[day]}
                    </span>
                </div>
                {[requests, ...lanes].map(lane => (
                    <DayRow
                        day={day}
                        key={lane.name}
                        lane={lane}
                        onToggle={() => setOpen(was => !was)}
                        open={open}
                    />
                ))}
                <div
                    className="grid grid-cols-5 rounded-b-[calc(var(--radius-card)-1px)] border-neutral-200 border-t"
                    data-slot="planner-footer"
                >
                    <div className="col-span-2 flex min-w-0 flex-col justify-center px-3">
                        <span className="truncate font-medium text-neutral-950 text-xs">
                            Booked
                        </span>
                        <span className="truncate text-neutral-600 text-xs">
                            Of {capacity} h open
                        </span>
                    </div>
                    <div className="col-span-3 min-w-0 border-neutral-200 border-l p-3">
                        <Meter
                            caption={`${share}%`}
                            label={`${hours} h`}
                            tone={share >= 85 ? 'warning' : undefined}
                            value={share}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ---------- The shell: Slate's own ---------- */

const places = [
    { label: 'Schedule', icon: <CalendarDays {...icon} />, current: true },
    { label: 'Requests', icon: <Inbox {...icon} />, count: 6 },
    { label: 'Bookings', icon: <CalendarCheck {...icon} /> },
    { label: 'Clients', icon: <Users {...icon} /> },
    { label: 'Studios', icon: <DoorOpen {...icon} /> },
    { label: 'Equipment', icon: <Camera {...icon} /> },
    { label: 'Invoices', icon: <ReceiptText {...icon} /> },
];

/** The studio's mark in the footer account: its initial on the darkest grey. */
const StudioMark = () => (
    <span className="grid size-full place-items-center bg-neutral-950 font-medium text-neutral-50 text-xs">
        H
    </span>
);

const SlateSidebar = () => (
    <Sidebar>
        <SidebarHeader>
            <SidebarLogo>
                <Aperture {...icon} />
            </SidebarLogo>
            <SidebarToggle />
        </SidebarHeader>
        <SidebarGroup aria-label="Main">
            {places.map(place => (
                <SidebarItem
                    active={place.current}
                    icon={place.icon}
                    key={place.label}
                    trailing={
                        place.count ? <Badge variant="count">{place.count}</Badge> : undefined
                    }
                >
                    {place.label}
                </SidebarItem>
            ))}
        </SidebarGroup>
        <SidebarGroup aria-label="Workspace" label="Workspace">
            <SidebarItem icon={<Settings {...icon} />}>Settings</SidebarItem>
            <SidebarItem icon={<LifeBuoy {...icon} />}>Help and support</SidebarItem>
        </SidebarGroup>
        <SidebarFooter>
            <SidebarAccount avatar={<StudioMark />} name="Halftone Studios" detail="Rotterdam" />
            <Button aria-label="Notifications" size="icon" variant="ghost">
                <Bell {...icon} />
            </Button>
        </SidebarFooter>
    </Sidebar>
);

/** The page under the header bar at the hero's least window (1408 × 792): the panel's 776 less 54. */
const LEAST_ROOM = 722;

export const PlannerScreen = () => {
    const [page, setPage] = useState<HTMLDivElement | null>(null);
    const [room, setRoom] = useState(LEAST_ROOM);

    useLayoutEffect(() => {
        if (!page) return;
        const measure = () => setRoom(Math.max(LEAST_ROOM, page.clientHeight));
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(page);
        return () => observer.disconnect();
    }, [page]);

    return (
        <AppShell className="size-full min-h-0">
            <SlateSidebar />
            <AppPanel>
                <HeaderBar>
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="#">
                                    <BreadcrumbHome />
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="#">Schedule</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Week 48</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </HeaderBar>
                <div
                    className="relative flex min-h-0 flex-1 flex-col overflow-hidden @max-shell-compact/shell:overflow-y-auto"
                    ref={setPage}
                >
                    <PageContent
                        // On a phone: the panel less 16 a side, 40 down over the inline start.
                        className="flex @max-shell-compact/shell:w-[calc(100%-32px)] w-[calc(100%-3rem)] flex-col @max-shell-compact/shell:gap-8 gap-12 @max-shell-compact/shell:pt-10! pb-6"
                        style={{ paddingTop: PAGE_TOP }}
                        width="dense"
                    >
                        <div className={cn('flex items-end justify-between gap-6', compact.stack)}>
                            <div className="flex min-w-0 flex-col gap-1.5">
                                <h1
                                    className={cn(
                                        'truncate font-medium text-2xl text-neutral-950',
                                        compact.wrap,
                                    )}
                                >
                                    Week 48
                                </h1>
                                <p
                                    className={cn(
                                        'truncate text-neutral-600 text-sm',
                                        compact.wrap,
                                    )}
                                >
                                    23 to 28 November, the studios open 08:00 to 20:00
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <Button
                                    aria-label="Previous week"
                                    className={compact.hidden}
                                    size="icon"
                                    variant="secondary"
                                >
                                    <ChevronLeft {...icon} />
                                </Button>
                                <Button
                                    aria-label="Next week"
                                    className={compact.hidden}
                                    size="icon"
                                    variant="secondary"
                                >
                                    <ChevronRight {...icon} />
                                </Button>
                                <Button variant="primary">
                                    <Plus {...icon} />
                                    New booking
                                </Button>
                            </div>
                        </div>
                        <Planner room={room} />
                        <DayPlanner />
                    </PageContent>
                </div>
            </AppPanel>
        </AppShell>
    );
};
