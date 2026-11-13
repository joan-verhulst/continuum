import { z } from 'zod';
import { themeArgument } from '../support/arguments';
import { defineTool, readOnly, structured, ToolError, text } from '../support/tool';
import {
    collectTokens,
    type TokenExtra,
    toCss,
    toDtcg,
    toFigma,
    toJson,
    toPaper,
} from '../system/tokens';
import { loadSystem } from '../system/values';

/*
 * The token set in the form another tool takes. Everything is read off one app.css, the default
 * theme's or the project's, so a canvas, a stylesheet and a token pipeline get the same values.
 */

export const getTokensTool = defineTool({
    name: 'get_tokens',
    title: 'Get tokens',
    description: `Returns Continuum's tokens (the role colours action, on-action, selected, tint, focus; the neutral, primary, success, warning and error ramps 50–950; radii; type sizes with line heights; the two weights; control heights; the spacing unit; the font and tracking), in Tailwind's names, in one format:
- 'css': :root custom properties with values resolved, dark as [data-mode="dark"] overrides.
- 'tailwind': the app.css itself, the Tailwind v4 entry a React project uses (everything, charts included).
- 'json': { light: { 'color-neutral-50': '#f8f8f8', … }, dark: { only what differs } }.
- 'dtcg': W3C Design Tokens (Format Module 2025.10), colours in oklch with an sRGB hex fallback, as the text of two files: continuum.tokens.json (light, every token) and continuum.dark.tokens.json (only the colours dark changes), loaded in that order.
- 'paper': the payload for Paper's create_tokens (add the fileId), plus to_dark and to_light payloads for set_tokens, since Paper has no modes: switching the file's mode is one set_tokens call.
- 'figma': a use_figma script with the payload inside: one collection 'Continuum', modes Light and Dark, COLOR as 0–1 rgba, FLOAT in px, STRING for the family, names with slashes (color/neutral/200, radius/card, text/xs, size/control). Pass the script to use_figma as it is.
Call this once when setting up a design file or a non-React stack, before drawing or styling anything.`,
    input: {
        format: z
            .enum(['css', 'tailwind', 'json', 'dtcg', 'paper', 'figma'])
            .describe('The form to return the tokens in; see the description.'),
        theme: themeArgument.optional(),
        mode: z
            .enum(['light', 'dark', 'both'])
            .optional()
            .describe("Which mode's values: 'light', 'dark', or 'both' (the default)."),
        include: z
            .array(z.enum(['charts', 'widths']))
            .optional()
            .describe(
                "Extra tokens: 'charts' the data colours chart-1–5 and chart-series-1–5; 'widths' the fixed widths of the sidebar, popover, menu, toast, dialog, sheet and so on. Left out unless asked.",
            ),
    },
    annotations: readOnly,
    handle: async ({ format, theme, mode = 'both', include = [] }) => {
        const system = await loadSystem(theme).catch((cause: unknown) => {
            throw new ToolError(
                `Could not read the theme ${JSON.stringify(theme)}: ${cause instanceof Error ? cause.message : String(cause)}. Pass the path to the project's app.css, its contents, or leave theme empty for the default; create_theme writes one.`,
            );
        });
        if (format === 'tailwind') return text(system.css);
        const tokens = collectTokens(system, include as TokenExtra[]);
        if (format === 'css') return text(toCss(system, tokens, mode));
        if (format === 'json') return structured({ theme: system.label, ...toJson(tokens, mode) });
        if (format === 'dtcg') return structured({ theme: system.label, ...toDtcg(tokens, mode) });
        if (format === 'paper') {
            return structured({
                theme: system.label,
                ...toPaper(tokens, mode),
                note: "Call create_tokens with create_tokens.tokens and the file's fileId. set_tokens with to_dark.tokens turns every artboard in the file dark, to_light.tokens back; take each mode's screenshots in turn.",
            });
        }
        return structured({ theme: system.label, ...toFigma(tokens, mode) });
    },
});
