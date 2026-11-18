'use client';

import { animate, useMotionValue, useMotionValueEvent } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import {
    Ask,
    FilmCamera,
    FilmFrame,
    Finding,
    Note,
    Prompt,
    SCREEN,
    type Shot,
    seconds,
    useFilm,
} from './kit';
import { type Block, type Faults, FaultyOverview } from './overview-film-screen';

/*
 * Improve a screen, filmed on one page: the Overview as an agent built it, in an app window at 16:9
 * and its real size, the camera panning across it. It is the playground's Overview with the agent's
 * faults laid over its parts, and improve_ui takes them off in its own order: the audit's findings
 * first; the structural change asked and agreed (revenue leads, the figures under it, the plans
 * beside what moved), the parts moving into that order; then the sure fixes, one kind at a time
 * across the whole page: colour, containers, type, spacing. Nothing is ever swapped: with the last
 * fault off it simply is the Overview, which the film ends on, scrolled through from its head.
 */

const BEATS = [
    500, // 0 the page as built
    1300, // 1 the prompt
    1200, // 2 the audit: every finding marked
    1100, // 3 the structural question
    500, // 4 answered
    1200, // 5 the parts move into the Overview's order
    900, // 6 colour: found
    1300, // 7 colour: fixed, down the page as the camera follows
    900, // 8 containers: found
    1000, // 9 containers: fixed
    800, // 10 type: found
    1000, // 11 type: fixed
    800, // 12 spacing: found
    1500, // 13 spacing: fixed, the camera going down with it
    800, // 14 the page in line, at its head
    1700, // 15 scrolled slowly down it
    1100, // 16 across to what moved
] as const;

export const IMPROVE_SECONDS = seconds(BEATS);

/** The beat each kind of fault comes off on; its finding shows from the beat before. */
const FIX = { structure: 4, colour: 7, containers: 9, type: 11, spacing: 13 } as const;
type Kind = keyof typeof FIX;

const faultsAt = (beat: number): Faults => ({
    structure: beat < FIX.structure + 1,
    colour: beat < FIX.colour,
    containers: beat < FIX.containers,
    type: beat < FIX.type,
    spacing: beat < FIX.spacing,
});

/** What the audit says of each kind, as data, in units (audit_source on the page as built). */
const findings: Record<Exclude<Kind, 'structure'>, [string, string, string][]> = {
    colour: [
        ['violet', '#7c3aed', 'roles'],
        ['head', 'gradient', 'none'],
    ],
    containers: [
        ['page', 'flat', 'a panel'],
        ['rows', 'a card each', 'one list'],
    ],
    type: [
        ['title', '30 · 700', '24 · 500'],
        ['figures', '30 · 700', '18 · 500'],
    ],
    spacing: [
        ['padding', '24', '16 · 20'],
        ['gap', '24', '16'],
    ],
};

const noteAt = (beat: number): Kind | 'audit' | null => {
    if (beat === 2) return 'audit';
    if (beat === 3 || beat === 4) return 'structure';
    if (beat === 6 || beat === 7) return 'colour';
    if (beat === 8 || beat === 9) return 'containers';
    if (beat === 10 || beat === 11) return 'type';
    if (beat === 12 || beat === 13) return 'spacing';
    return null;
};

/** The parts outlined as findings at each beat. */
const marksAt = (beat: number): Block[] => {
    if (beat === 2) return ['head', 'chart', 'stats', 'plans', 'activity'];
    if (beat === 6) return ['head', 'chart', 'plans'];
    if (beat === 8) return ['activity'];
    if (beat === 10) return ['head', 'stats'];
    if (beat === 12) return ['stats'];
    return [];
};

/** How far the page scrolls in its panel at each beat: 'end' is as far as it goes. */
const scrollAt = (beat: number): number | 'end' => {
    if (beat === 7 || beat === 8) return 320;
    if (beat === 13) return 260;
    if (beat >= 15) return 'end';
    return 0;
};

const Round = ({ beat }: { beat: number }) => {
    const [stage, setStage] = useState<HTMLDivElement | null>(null);
    const [room, setRoom] = useState({ width: 0, height: 0 });
    useEffect(() => {
        if (!stage) return;
        const measure = () => setRoom({ width: stage.clientWidth, height: stage.clientHeight });
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(stage);
        return () => observer.disconnect();
    }, [stage]);

    // The page scrolls inside its panel, as a real app does.
    const screen = useRef<HTMLDivElement>(null);
    const scroll = useMotionValue(0);
    useMotionValueEvent(scroll, 'change', value => {
        const node = screen.current?.querySelector<HTMLElement>('[data-slot="sheet-area"]');
        if (node) node.scrollTop = value;
    });
    useEffect(() => {
        const node = screen.current?.querySelector<HTMLElement>('[data-slot="sheet-area"]');
        const wanted = scrollAt(beat);
        const end = node ? node.scrollHeight - node.clientHeight : 0;
        const target = wanted === 'end' ? end : Math.min(wanted, end);
        if (Math.abs(scroll.get() - target) < 1) return;
        const slow = beat === 15;
        const control = animate(scroll, target, {
            duration: slow ? 1.7 : 0.9,
            ease: slow ? [0.45, 0, 0.55, 1] : [0.65, 0, 0.35, 1],
        });
        return () => control.stop();
    }, [beat, scroll]);

    /** The camera's view, its top left in the window. */
    const view = (left: number, top: number): Shot => ({
        region: 'window',
        cut: () => ({ x: left, y: top, width: room.width, height: room.height }),
    });
    const column = 372; // The page's column (396) less 24, so it opens at its left edge.
    const low = SCREEN.height - room.height;
    const shotAt = (): Shot => {
        if (beat <= 2 || beat === 6) return 'start';
        if (beat === 7 || beat === 8) return view(column, low);
        if (beat === 13) return view(column, low);
        if (beat === 16) return view(SCREEN.width - room.width, low);
        return view(column, 0);
    };

    const note = noteAt(beat);
    return (
        <div className="absolute inset-0" ref={setStage}>
            <FilmCamera at={beat} shot={shotAt()} size={SCREEN}>
                <div className="size-full" data-film="window" ref={screen}>
                    <FaultyOverview
                        faults={faultsAt(beat)}
                        markNav={beat === 2 || beat === 6}
                        marks={marksAt(beat)}
                        moving={beat === FIX.structure + 1}
                    />
                </div>
            </FilmCamera>
            <Prompt on={beat === 1} text="bring the overview in line" />
            <Note id={note} width={note === 'structure' ? 340 : undefined}>
                {note === 'structure' ? (
                    <Ask
                        answered={beat >= FIX.structure}
                        no="Keep the order"
                        question="An overview leads with its figure. Revenue first, full width, the figures under it, the plans beside what moved?"
                        yes="Reorder"
                    />
                ) : note === 'audit' ? (
                    <span className="font-mono text-[12px] text-neutral-950 tabular-nums">
                        34 findings · 31 to fix · 3 to ask
                    </span>
                ) : (
                    note && <Finding rows={findings[note]} />
                )}
            </Note>
        </div>
    );
};

export const ImproveFilm = () => {
    const { beat, round } = useFilm(BEATS);
    return (
        <FilmFrame round={round}>
            <Round beat={beat} />
        </FilmFrame>
    );
};
