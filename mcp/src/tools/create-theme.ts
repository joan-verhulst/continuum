import { themeFontFamilies } from 'continuum';
import { z } from 'zod';
import { presets } from '../../../playground/src/presets';
import { designBrief, exportTheme, tailwindEntry } from '../../../playground/src/theme-export';
import { themeOptionsArgument } from '../support/arguments';
import { defineTool, readOnly, structured } from '../support/tool';
import { readThemeOptions, themeChoices } from '../system/tokens';

/*
 * The theme builder's export without the playground: options in, the app.css and DESIGN.md a
 * project ships out, written by the same code the builder's Export button runs. Options that
 * change nothing give the default theme, labelled Continuum, as the builder does.
 */

export const createThemeTool = defineTool({
    name: 'create_theme',
    title: 'Create theme',
    description:
        "Turns theme options into a project's theme: returns { label, options (as read), appCss (the Tailwind v4 entry: the whole look in Tailwind's names, light and dark), designMd (the brief that sets the project up and states the rules for its values), files (where each goes) }. Call it without options first: it returns every option with its choices and defaults, and the presets, so you can choose with the person. Then call it with the options (and a preset to start from, if one fits). Measure the result with check_theme; pass the appCss as theme to the other tools to check against the project's own values.",
    input: {
        options: themeOptionsArgument.optional(),
        preset: z
            .string()
            .optional()
            .describe(
                'A preset id to start from (eyes, indigo, electric, lime, stone); options are laid over it.',
            ),
        label: z
            .string()
            .optional()
            .describe(
                "What the person calls the theme: the project's name. Used in the files' headings.",
            ),
        mode: z
            .enum(['light', 'dark'])
            .optional()
            .describe(
                "The mode the app opens in, written into DESIGN.md's setup: 'light' unless given.",
            ),
    },
    annotations: readOnly,
    handle: ({ options, preset, label, mode = 'light' }) => {
        if (!preset && (!options || Object.keys(options).length === 0)) {
            return structured({
                note: 'No options given: these are the choices. Call create_theme again with options (and a preset, if one fits); anything left out keeps its default.',
                ...themeChoices(),
            });
        }
        const read = readThemeOptions(options ?? {}, preset);
        const named =
            label?.trim() ||
            presets.find(item => item.id === preset)?.label ||
            read.name ||
            'Project';
        const theme = exportTheme(read, named, mode);
        const font =
            themeFontFamilies[(read.font ?? 'geist') as keyof typeof themeFontFamilies]?.package;
        return structured({
            label: theme.label,
            options: read,
            appCss: tailwindEntry(theme),
            designMd: designBrief(theme),
            files: {
                'src/app.css':
                    'The Tailwind entry, in place of the copied styles/ folder: import it once from the entry script. Change dark values in its [data-mode="dark"] block with their light ones.',
                'DESIGN.md':
                    "At the repository's root, where Claude reads it: the project's setup and its rules.",
                ...(font ? { font: `npm install ${font}, imported in the entry script.` } : {}),
            },
            ...(theme.label === 'Continuum'
                ? { note: "These options change nothing, so this is Continuum's default theme." }
                : {}),
        });
    },
});
