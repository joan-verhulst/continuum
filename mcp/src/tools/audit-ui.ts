import { z } from 'zod';
import { auditUi } from '../audit/ui';
import { mediumArgument, modeArgument, themeArgument } from '../support/arguments';
import { defineTool, readOnly, structured, ToolError } from '../support/tool';
import { loadSystem } from '../system/values';
import type { Fact } from '../types';

/*
 * The audit of anything rendered, in any stack: a browser's snapshot, a canvas's computed styles,
 * or the values another tool read off its own UI, all judged by the same rules.
 */

const subject = z
    .object({
        tag: z.string().optional(),
        role: z.string().optional(),
        name: z.string().optional(),
        kind: z
            .enum([
                'control',
                'icon-control',
                'badge',
                'row',
                'text',
                'container',
                'floating',
                'divider',
                'page',
                'unknown',
            ])
            .optional(),
        text: z.boolean().optional(),
        picture: z.boolean().optional(),
        library: z.boolean().optional(),
    })
    .passthrough();

const fact = z
    .object({
        at: z.string(),
        property: z.string(),
        value: z.union([z.string(), z.number()]),
        subject: subject.optional(),
        written: z
            .object({
                form: z.enum(['declaration', 'utility', 'literal', 'rendered']).optional(),
                text: z.string().optional(),
                syntax: z.enum(['css', 'js', 'qss', 'qml']).optional(),
            })
            .optional(),
        guessed: z.boolean().optional(),
    })
    .passthrough();

/** A fact as the rules read it: kebab-case property, a string value, a subject and a form. */
const normaliseFact = (raw: z.infer<typeof fact>): Fact => {
    const property = raw.property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    const value =
        typeof raw.value === 'number'
            ? `${raw.value}${/weight|opacity|z-index/.test(property) ? '' : 'px'}`
            : raw.value;
    return {
        at: raw.at,
        property,
        value,
        subject: { kind: 'unknown', ...(raw.subject ?? {}) } as Fact['subject'],
        written: {
            form: raw.written?.form ?? 'rendered',
            text: raw.written?.text ?? `${property}: ${value}`,
            ...(raw.written?.syntax ? { syntax: raw.written.syntax } : {}),
        },
        ...(raw.guessed ? { guessed: true } : {}),
    };
};

export const auditUiTool = defineTool({
    name: 'audit_ui',
    title: 'Audit rendered UI',
    description:
        "Audits any rendered UI against Continuum, whatever built it, and returns findings: what is off in units, what Continuum wants and why, and the fix written for the place it was found (css, tailwind, canvas style patch, qss, code). Three ways in: run get_snapshot_script in a browser and pass its result as tree; pass a canvas's layers with their computed styles as tree (Paper's get_computed_styles, a Figma read); or pass facts, the values any other tool read off its own UI (a design tool plugin, a native app's inspector). Apply 'fix' findings (high first, medium then look), propose 'advise' findings to the person with their reason, and audit again until it is clean.",
    input: {
        tree: z
            .union([z.record(z.string(), z.unknown()), z.array(z.unknown()), z.string()])
            .optional()
            .describe(
                "The UI as a tree of boxes: the object get_snapshot_script's script returns, unchanged; or a styles tree, nodes { id, name, type, text, styles: { camelCase CSS }, children }, or { root: <node tree>, styles: { <node id>: <computed styles> } }, or a bare map of node id to computed styles.",
            ),
        format: z
            .enum(['snapshot', 'styles'])
            .optional()
            .describe(
                "'snapshot' (the script's result) or 'styles' (a canvas's styles tree). Empty to detect it.",
            ),
        facts: z
            .array(fact)
            .optional()
            .describe(
                "Values read by any other tool, one per entry: { at: where it is (a node id, 'file:line'), property: the CSS property in kebab-case with sides spelt out ('background-color', 'padding-left', 'border-top-width'), value: in CSS syntax ('36px', '#3b82f6', '600'), subject: { kind: 'control' | 'icon-control' | 'badge' | 'row' | 'text' | 'container' | 'floating' | 'divider' | 'page' | 'unknown', tag, role, name, text: true for read text, picture: true for charts, images and avatars }, written: { form: 'rendered' | 'declaration' | 'utility' | 'literal', text: as it was written } }. The kind is what makes heights and shadows judgeable: say it when you know it.",
            ),
        medium: mediumArgument,
        theme: themeArgument.optional(),
        mode: modeArgument.optional(),
        structure: z
            .boolean()
            .optional()
            .describe(
                'With a tree, add advice on the whole of it: more than one primary action, containers nested, tabs where the dock goes, dividers between sections. Defaults to true; false when auditing a single part.',
            ),
    },
    annotations: readOnly,
    handle: async ({ tree, format, facts, medium, theme, mode, structure }) => {
        if (tree === undefined && !facts?.length)
            throw new ToolError(
                'Pass tree (the result of get_snapshot_script, or a canvas styles tree) or facts.',
            );
        const system = await loadSystem(theme).catch(() => {
            throw new ToolError(
                `Could not read the theme "${theme}". Pass the path to the project's app.css, its contents, or leave theme empty for the default.`,
            );
        });
        const audit = auditUi(
            { tree, facts: facts?.map(normaliseFact) },
            { system, medium, mode, structure, format },
        );
        return structured(audit as unknown as Record<string, unknown>);
    },
});
