'use client';

import { Theme } from 'continuum';
import { Check } from 'lucide-react';
import { PRODUCT_THEME } from '../theme';
import { BuildScreen, SCROLL } from './build-screen';
import { FilmCamera, FilmFrame, Note, Prompt, SCREEN, type Shot, seconds, useFilm } from './kit';

/** What each of the system's tools returned, as data: the call, then what it said. */
type Returned = { call: string; rows: [string, string][] };

const returned = {
    kind: {
        call: 'get_page_kind("settings")',
        rows: [
            ['column', '640'],
            ['groups', 'list cards'],
            ['primary', 'one, in the head'],
        ],
    },
    row: {
        call: 'get_component("SettingRow")',
        rows: [
            ['left', 'title + description'],
            ['right', 'one control'],
            ['control', '34'],
        ],
    },
    spacing: {
        call: 'get_spacing("list card")',
        rows: [
            ['padding', 'p-5 · 20'],
            ['next', 'gap-6 · 24'],
        ],
    },
    pattern: {
        call: 'find_pattern("list of members")',
        rows: [
            ['table', 'its own frame'],
            ['search', 'in its toolbar'],
            ['rows', 'a menu each'],
        ],
    },
} satisfies Record<string, Returned>;

const Result = ({ call, rows }: Returned) => (
    <div className="flex flex-col gap-2 font-mono text-[12px] tabular-nums">
        <span className="text-neutral-500">{call}</span>
        {rows.map(([what, value]) => (
            <div className="flex items-baseline gap-2" key={what}>
                <span className="w-16 shrink-0 text-neutral-500">{what}</span>
                <span className="text-neutral-950">{value}</span>
            </div>
        ))}
    </div>
);

/** The audit at the end, as it returns: the file, no findings. */
const Clean = () => (
    <div className="flex items-center gap-3 font-mono text-[12px]">
        <span className="text-neutral-500">audit_source("members/page.tsx")</span>
        <span className="flex items-center gap-1.5 text-success-600">
            <Check className="size-3.5" strokeWidth={2.5} />
            clean
        </span>
    </div>
);

/** The page's top: the header bar's foot, the head, and what lands under it. */
const pageTop: Shot = { region: 'page', cut: box => ({ ...box, y: box.y - 40, height: 520 }) };

/**
 * What the camera frames at each beat, at real size: it only pans, and the page scrolls under it as
 * the app's would. The window's corner first, Settings current in the sidebar; then the column.
 */
const shotAt = (beat: number): Shot => {
    if (beat <= 1) return 'start';
    // The list card's place, then the card: framed a little low, so the callout above leaves it clear.
    if (beat >= 4 && beat <= 6)
        return { region: 'card', cut: box => ({ ...box, y: box.y - 60, height: box.height + 84 }) };
    // The table's place as the page scrolls it up (measured before the scroll, so less SCROLL), then
    // the table, low enough that the callout sits over the card above it.
    if (beat === 7 || beat === 8)
        return {
            region: 'table',
            cut: box => ({
                ...box,
                y: box.y - 110 - (beat === 7 ? SCROLL : 0),
                height: box.height + 110,
            }),
        };
    // The pointed row, from its name to its menu, and the menu open under it.
    if (beat === 9)
        return {
            region: 'pointed',
            cut: box => ({ ...box, y: box.y - 60, height: box.height + 200 }),
        };
    // The page scrolled back to its top, the finished page from its head down, room above it for the
    // callout (the head is measured mid-scroll as the beat starts, so plus SCROLL there).
    if (beat >= 10)
        return {
            region: 'head',
            cut: box => ({ ...box, y: box.y - 70 + (beat === 10 ? SCROLL : 0), height: 520 }),
        };
    // The kind and the head landing: the page's top, under the header bar.
    return pageTop;
};

/**
 * Build a screen, filmed on a real one: Settings › Members in Northwind's shell, the page empty. You
 * ask for it; the system answers, and the page composes itself from its answers, one part at a time,
 * the camera panning to each as it lands: the settings kind (the 640 column drawn as a guide), the head with
 * its one primary; the SettingRow's shape, then the Access card of rows; the spacing, laid over the
 * card; the members pattern, then the table in its own frame, search on its bar, one row's menu
 * open. The page scrolls back to its top and the audit comes back clean. The camera only
 * pans: the window is drawn at its real 16:9 size and the stage crops it.
 */
const BEATS = [900, 1800, 1400, 1200, 1300, 1300, 1300, 1300, 1400, 1300, 1100, 1800] as const;

export const BUILD_SECONDS = seconds(BEATS);

export const BuildFilm = () => {
    const { beat, round } = useFilm(BEATS);
    const built = {
        column: beat >= 2 && beat <= 9,
        head: beat >= 3,
        card: beat >= 5,
        spacing: beat === 6,
        table: beat >= 8,
        menu: beat === 9,
        scrolled: beat >= 7 && beat <= 9,
    };
    const notes: Partial<Record<number, keyof typeof returned | 'clean'>> = {
        2: 'kind',
        4: 'row',
        6: 'spacing',
        7: 'pattern',
        11: 'clean',
    };
    const note = notes[beat] ?? null;
    return (
        <FilmFrame round={round}>
            <FilmCamera at={beat} shot={shotAt(beat)} size={SCREEN}>
                <Theme className="size-full" mode="dark" theme={PRODUCT_THEME}>
                    <BuildScreen built={built} />
                </Theme>
            </FilmCamera>
            <Prompt on={beat === 1} text="Build the members page under Settings." />
            <Note id={note}>
                {note === 'clean' ? <Clean /> : note && <Result {...returned[note]} />}
            </Note>
        </FilmFrame>
    );
};
