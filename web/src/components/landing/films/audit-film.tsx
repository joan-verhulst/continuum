'use client';

import { Theme } from 'continuum';
import { PRODUCT_THEME } from '../theme';
import { type App, AuditScreen, type Stage } from './audit-screen';
import {
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

/** What the audit finds in every one of the four files, the same in units whatever the stack. */
const finding: [string, string, string][] = [
    ['weight', '600', '500'],
    ['colour', '#6b7280', 'neutral-600'],
];

/** The beat each app's file is rewritten in, the camera on its window: round the four, clockwise. */
const fixedAt: Record<App, number> = { dashboard: 3, billing: 4, site: 5, admin: 6 };

/** What the camera frames at each beat: a window's top left, its tab just under the callout. */
const shotAt = (beat: number): Shot => {
    const app = (Object.keys(fixedAt) as App[]).find(each => fixedAt[each] === beat);
    if (beat > fixedAt.admin) return shotAt(fixedAt.admin);
    if (!app) return 'start';
    return {
        region: `pane-${app}`,
        cut: box => ({ x: box.x - 24, y: box.y - 104, width: 635, height: 563 }),
    };
};

const stageOf = (beat: number, app: App): Stage => {
    if (beat > fixedAt[app]) return 'fixed';
    if (beat === fixedAt[app]) return 'fixing';
    if (beat >= 2) return 'marked';
    return 'idle';
};

/**
 * Audit any stack, filmed on one window: the same plan card in four apps, four stacks, open side by
 * side (the dashboard in React with Tailwind, billing in Vue, the admin in Angular, the site in
 * Svelte), at real size and larger than the stage. You ask for the card audited in every app; one
 * read marks the same two lines in each, and the finding shows once, as data: a weight of 600 and a
 * raw grey. The camera pans window to window and each file's lines are rewritten in its own idiom:
 * font-medium and text-neutral-600 in the classes, 500 and var(--color-neutral-600) in the styles.
 */
const BEATS = [600, 1600, 1400, 1500, 1700, 1700, 1700, 1200] as const;

export const AUDIT_SECONDS = seconds(BEATS);

export const AuditFilm = () => {
    const { beat, round } = useFilm(BEATS);
    const stages = {
        dashboard: stageOf(beat, 'dashboard'),
        billing: stageOf(beat, 'billing'),
        admin: stageOf(beat, 'admin'),
        site: stageOf(beat, 'site'),
    };
    return (
        <FilmFrame round={round}>
            <FilmCamera at={beat} shot={shotAt(beat)} size={SCREEN}>
                <Theme className="size-full" mode="dark" theme={PRODUCT_THEME}>
                    <AuditScreen stages={stages} />
                </Theme>
            </FilmCamera>
            <Prompt on={beat === 1} text="Audit the plan card in every app." />
            <Note id={beat >= 2 && beat <= fixedAt.admin ? 'finding' : null}>
                <Finding rows={finding} />
            </Note>
        </FilmFrame>
    );
};
