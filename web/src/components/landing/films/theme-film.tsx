'use client';

import { exportTheme, tailwindEntry } from '@playground/theme-export';
import { createThemeCss, type ThemeOptions } from 'continuum';
import { animate, useReducedMotion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { FilmCamera, FilmFrame, Note, SCREEN, type Shot, seconds, useFilm } from './kit';
import { type BuilderStep, PROJECT, ThemeScreen } from './theme-screen';

/** The scope the preview's theme is written for, its own so no other film or the hero shares it. */
const FILM_THEME = 'theme-film';

/** The product as it starts: a plain theme, untinted greys, a teal accent, IBM Plex Sans, tight corners. */
const start = {
    accent: '#0d9488',
    font: 'ibm-plex-sans',
    radius: 0.5,
} as const satisfies ThemeOptions;

/** The theme it is given: Continuum's indigo, greys tinted towards it, Geist, rounder corners. */
const asked = {
    accent: '#3939e5',
    neutral: { hue: 272, tint: 0.016 },
    radius: 1.5,
} as const satisfies ThemeOptions;

/*
 * The preview follows the theme as each option lands: colours ease over (the change being shown), a
 * font swaps. Scoped to the preview's theme, so only it eases.
 */
const easeCss = `.continuum[data-theme="${FILM_THEME}"], .continuum[data-theme="${FILM_THEME}"] * {
    transition-property: color, background-color, border-color, fill, stroke, outline-color, box-shadow;
    transition-duration: 500ms;
    transition-timing-function: cubic-bezier(0.65, 0, 0.35, 1);
}`;

/**
 * Theme a product, filmed on the theme builder itself: the app's five steps at their real size in a
 * 16:9 window, with Customers beside them wearing the theme as it is now. The film works the builder as a person would,
 * and the camera goes from each control to where its change lands in the preview: the primary taking
 * #3939e5 (the dock's action and selected view); Neutral, its tint drawn up to 0.016 at hue 272 (the
 * sidebar and the panels); Type, Geist picked (the page title); Controls, the corner scale drawn from
 * 50% to 150% (Export and the table's frame). Then the review, its checks measured for real in light
 * and dark, the app.css the export writes, and the camera pans across to the product, themed.
 */
const BEATS = [
    900, 1200, 1200, 700, 1300, 1200, 700, 1000, 1200, 700, 1300, 1200, 1400, 1500, 1300,
] as const;

export const THEME_SECONDS = seconds(BEATS);

/** The beat each option changes on, drawn over its length where a control is dragged. */
const AT = { accent: 1, neutral: 4, font: 7, radius: 10 } as const;

/** The builder's step at each beat. */
const stepAt = (beat: number): BuilderStep =>
    beat < 3
        ? 'primary'
        : beat < 6
          ? 'neutral'
          : beat < 9
            ? 'type'
            : beat < 12
              ? 'controls'
              : 'review';

/** The theme at a beat, `t` the way through a dragged change (0 to 1). */
const themeAt = (beat: number, t: number): ThemeOptions => {
    const through = (at: number) => (beat > at ? 1 : beat === at ? t : 0);
    const tint = Number((asked.neutral.tint * through(AT.neutral)).toFixed(3));
    // The corner slider moves in its own steps of 0.05.
    const radius =
        Math.round((start.radius + (asked.radius - start.radius) * through(AT.radius)) * 20) / 20;
    return {
        accent: beat >= AT.accent ? asked.accent : start.accent,
        ...(tint > 0 && { neutral: { hue: asked.neutral.hue, tint } }),
        // Geist is the builder's default, so picking it leaves the option out.
        ...(beat < AT.font && { font: start.font }),
        radius,
    };
};

/** A band of the builder, `from` and `height` in px from the top of a part, the panel's width. */
const band = (region: string, from: number, height: number): Shot => ({
    region,
    cut: box => ({ ...box, y: box.y + from, height }),
});

/** What the camera frames at each beat: always at real size, panning from a control to its change. */
const shotAt = (beat: number): Shot => {
    // The builder's top: its head, the stepper and the primary under them.
    if (beat <= 1) return band('builder', 0, 563);
    // Across to the preview's dock: the selected view and New customer, the two the accent fills.
    if (beat === 2) return { region: 'dock' };
    // Neutral: its colour and the ramp it tints.
    if (beat === 3 || beat === 4) return band('b-step', -40, 563);
    // The preview's top left: the canvas, the header bar, the panel, every surface the greys tint.
    if (beat === 5) return { region: 'preview', cut: box => ({ ...box, width: 635, height: 563 }) };
    // The fonts, Geist among them.
    if (beat === 6 || beat === 7) return band('b-question-1', -200, 400);
    // The preview's page title, in the font picked.
    if (beat === 8)
        return {
            region: 'head',
            cut: box => ({ ...box, x: box.x - 40, y: box.y - 120, width: 500, height: 400 }),
        };
    // The corner scale.
    if (beat === 9 || beat === 10) return band('b-corners', -100, 300);
    // Export and the table's frame below it, rounded.
    if (beat === 11)
        return {
            region: 'actions',
            cut: box => ({ ...box, x: box.x - 300, width: box.width + 320, height: 260 }),
        };
    // The review: every step's answer and the checks under them.
    if (beat === 12 || beat === 13) return band('builder', 0, 563);
    // The end: across to the product, themed, its head and its table.
    return { region: 'preview', cut: box => ({ ...box, height: 563 }) };
};

/** The lines of the export's app.css the film shows, as the export writes them for light. */
const shownLines = ['--color-action', '--color-neutral-500', '--font-sans', '--radius-control'];

const cssLines = (theme: ThemeOptions) => {
    const css = tailwindEntry(exportTheme(theme, PROJECT, 'dark'));
    return shownLines.map(name => {
        const line = css.split('\n').find(row => row.trim().startsWith(`${name}:`)) ?? '';
        const value = line.slice(line.indexOf(':') + 1).trim();
        // The font's stack is long: its first family says it.
        return [name, name === '--font-sans' ? `${value.split(',')[0]}, …;` : value] as const;
    });
};

/** One round of the film: the builder's state belongs to it, so a new round starts it afresh. */
const Round = ({ beat }: { beat: number }) => {
    const reduce = useReducedMotion() ?? false;
    const dragged = beat === AT.neutral || beat === AT.radius;
    // How far the drag of this beat has come; a beat not yet started on is at its start.
    const [drag, setDrag] = useState({ beat: -1, t: 0 });
    const t = drag.beat === beat ? drag.t : dragged && !reduce ? 0 : 1;
    useEffect(() => {
        if (!dragged || reduce) return;
        const control = animate(0, 1, {
            duration: 0.9,
            delay: 0.15,
            ease: [0.65, 0, 0.35, 1],
            onUpdate: value => setDrag({ beat, t: value }),
        });
        return () => control.stop();
    }, [beat, dragged, reduce]);

    const theme = themeAt(beat, t);
    const key = JSON.stringify(theme);
    // biome-ignore lint/correctness/useExhaustiveDependencies: the theme is read through its key.
    const css = useMemo(() => createThemeCss({ ...theme, name: FILM_THEME }), [key]);
    // What the export writes for the theme as it ends.
    const lines = useMemo(() => cssLines(themeAt(BEATS.length - 1, 1)), []);

    return (
        <>
            <style>{`${css}\n\n${easeCss}`}</style>
            <FilmCamera at={beat} shot={shotAt(beat)} size={SCREEN}>
                {/* The film works the builder; nothing set from inside it, as nobody can reach it. */}
                <ThemeScreen
                    set={() => {}}
                    step={stepAt(beat)}
                    theme={theme}
                    themeId={FILM_THEME}
                />
            </FilmCamera>
            <Note id={beat === 13 ? 'css' : null}>
                <div className="flex flex-col gap-2.5 font-mono text-[12px]">
                    <span className="text-neutral-600">app.css</span>
                    <div className="flex flex-col gap-1.5">
                        {lines.map(([name, value]) => (
                            <div className="flex gap-2 whitespace-pre" key={name}>
                                <span className="text-neutral-700">{name}:</span>
                                <span className="text-neutral-950">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </Note>
        </>
    );
};

export const ThemeFilm = () => {
    const { beat, round } = useFilm(BEATS);
    return (
        <FilmFrame round={round}>
            <Round beat={beat} />
        </FilmFrame>
    );
};
