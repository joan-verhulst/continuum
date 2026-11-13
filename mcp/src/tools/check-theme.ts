import { oklchToHex, type ThemeMode } from 'continuum';
import { z } from 'zod';
import {
    cut,
    lcValue,
    measurePairs,
    measureSeries,
    type PairResult,
    pairName,
    pairNeeds,
    requiredMisses,
    verdict,
} from '../../../playground/src/theme-editor/checks';
import { themeOptionsArgument } from '../support/arguments';
import { defineTool, readOnly, structured } from '../support/tool';
import { readThemeOptions } from '../system/tokens';

/*
 * The builder's Review step as a tool: each pair foundations names (text on the surface, a hint,
 * a badge, the focus ring, a control's outline) measured as painted in the theme, and held to the
 * system's level for its kind. The measures advise; the person looking at the theme decides.
 */

const measure = (options: Parameters<typeof measurePairs>[0], mode: ThemeMode) => {
    const results = measurePairs(options, mode).map(result => ({ result, state: verdict(result) }));
    const name = (result: PairResult) => `${result.check.label}: ${pairName(result.check)}`;
    // A miss in full, with where it shows and why it may be fine; a pass in a line.
    const misses = results
        .filter(({ state }) => state !== 'pass')
        .map(({ result, state }) => {
            const pair: Record<string, unknown> = {
                pair: name(result),
                needs: pairNeeds(result.check),
                ratio: Number(cut(result.ratio, 2)),
                apca: `Lc ${lcValue(result.lc)} (${result.apca ? 'meets' : 'under'} ${result.check.lc})`,
                verdict: state,
                use: result.check.use,
            };
            if (state === 'advise' && result.check.advisory) pair.why = result.check.advisory;
            return pair;
        });
    const passed = results
        .filter(({ state }) => state === 'pass')
        .map(
            ({ result }) => `${name(result)} ${cut(result.ratio, 2)}:1 (needs ${result.check.min})`,
        );
    const count = (state: string) => results.filter(item => item.state === state).length;
    const { series } = measureSeries(options, mode);
    return {
        pass: count('pass'),
        fail: count('fail'),
        advise: count('advise'),
        required: requiredMisses(options, mode),
        misses,
        passed,
        series: series.map(colour => oklchToHex(colour)),
    };
};

export const checkThemeTool = defineTool({
    name: 'check_theme',
    title: 'Check theme',
    description:
        "Measures a theme's contrast as the builder's Review step does: returns, per mode, { pass, fail, advise, required (misses WCAG requires), misses: [{ pair (what and which tokens), needs (its level and ratio), ratio (WCAG 2, cut not rounded), apca, verdict, use, why }], passed (one line per pair met), series (the chart colours 1–4 as painted) }. Call it after create_theme, with the same options, before handing the theme over. The checks advise: tell the person what misses and why, and let their eye decide; never change the theme on a check alone.",
    input: {
        options: themeOptionsArgument.optional(),
        preset: z
            .string()
            .optional()
            .describe('A preset id the options are laid over, as given to create_theme.'),
        mode: z
            .enum(['light', 'dark', 'both'])
            .optional()
            .describe("Which mode to measure: 'light', 'dark', or 'both' (the default)."),
    },
    annotations: readOnly,
    handle: ({ options, preset, mode = 'both' }) => {
        const read = readThemeOptions(options ?? {}, preset);
        const modes: ThemeMode[] = mode === 'both' ? ['light', 'dark'] : [mode];
        return structured({
            ...Object.fromEntries(modes.map(item => [item, measure(read, item)])),
            note: "Pairs are held to the system's own levels: text 4.5:1, labels and the focus ring 3:1, a control's shape 1.5:1. 'advise' is a miss WCAG does not require. These checks advise; the person's eye decides. The data colours are listed, not judged: series 1 is the accent itself.",
        });
    },
});
